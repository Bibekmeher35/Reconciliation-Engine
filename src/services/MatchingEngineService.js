import Transaction from '../models/Transaction.js';
import ReconciliationResult from '../models/ReconciliationResult.js';
import ReconciliationRun from '../models/ReconciliationRun.js';

class MatchingEngineService {
  static getTypeEquivalent(type) {
    if (type === 'TRANSFER_OUT') return 'TRANSFER_IN';
    if (type === 'TRANSFER_IN') return 'TRANSFER_OUT';
    return type; // BUY -> BUY, SELL -> SELL
  }

  static isQuantityWithinTolerance(q1, q2, tolerancePercent) {
    // If exact match
    if (q1 === q2) return true;
    // Calculate percentage difference relative to q1
    // Avoid division by zero
    if (q1 === 0) return q2 === 0;
    const diff = Math.abs(q1 - q2);
    const percentDiff = diff / Math.abs(q1);
    // tolerancePercent is passed as something like 0.01 (which might mean 0.01% or just a ratio).
    // The requirement: "configurable tolerance (e.g. 0.01% by default)".
    // So 0.01% = 0.0001
    return percentDiff <= (tolerancePercent / 100);
  }

  static async runMatching(runId) {
    const run = await ReconciliationRun.findOne({ runId });
    if (!run) throw new Error(`Run config not found for ${runId}`);

    const { timeToleranceMins, quantityTolerancePercent } = run.config;
    const timeToleranceMs = timeToleranceMins * 60 * 1000;

    // Fetch all transactions for this run
    const userTransactions = await Transaction.find({ runId, source: 'USER' }).lean();
    const exchangeTransactions = await Transaction.find({ runId, source: 'EXCHANGE' }).lean();

    // To keep track of matched exchange transactions
    const matchedExchangeIds = new Set();
    const results = [];

    // Helper to add result
    const addResult = (category, userTx, exchangeTx, reason = '') => {
      results.push({
        runId,
        category,
        reason,
        userTx: userTx ? userTx._id : null,
        exchangeTx: exchangeTx ? exchangeTx._id : null,
        userRow: userTx ? userTx.originalRow : null,
        exchangeRow: exchangeTx ? exchangeTx.originalRow : null,
      });
      if (exchangeTx) {
        matchedExchangeIds.add(exchangeTx._id.toString());
      }
    };

    for (const userTx of userTransactions) {
      const equivalentType = this.getTypeEquivalent(userTx.type);
      
      // If userTx is invalid (e.g., missing timestamp), we cannot reliably match it via time window
      if (!userTx.timestamp) {
        let reason = 'Data quality issue: missing timestamp.';
        if (!userTx.isValid) {
          reason += ' Issues: ' + userTx.issues.join(', ');
        }
        addResult('UNMATCHED_USER', userTx, null, reason);
        continue;
      }

      // Find candidates: Unmatched, Same Asset, Equivalent Type, Within Time Window
      const timeCandidates = exchangeTransactions.filter((exTx) => {
        if (matchedExchangeIds.has(exTx._id.toString())) return false;
        if (exTx.asset !== userTx.asset) return false;
        if (exTx.type !== equivalentType) return false;
        if (!exTx.timestamp) return false;

        const timeDiff = Math.abs(userTx.timestamp.getTime() - exTx.timestamp.getTime());
        return timeDiff <= timeToleranceMs;
      });

      if (timeCandidates.length === 0) {
        let reason = 'No matching transaction found within time tolerance.';
        if (!userTx.isValid) {
          reason += ' Note: Data has issues: ' + userTx.issues.join(', ');
        }
        addResult('UNMATCHED_USER', userTx, null, reason);
        continue;
      }

      // Among time candidates, find quantity matches
      const exactOrToleranceMatches = timeCandidates.filter((exTx) => 
        this.isQuantityWithinTolerance(userTx.quantity, exTx.quantity, quantityTolerancePercent)
      );

      if (exactOrToleranceMatches.length >= 1) {
        // MATCHED
        // If multiple, pick the closest in time
        exactOrToleranceMatches.sort((a, b) => {
          const diffA = Math.abs(userTx.timestamp.getTime() - a.timestamp.getTime());
          const diffB = Math.abs(userTx.timestamp.getTime() - b.timestamp.getTime());
          return diffA - diffB;
        });

        const bestMatch = exactOrToleranceMatches[0];
        addResult('MATCHED', userTx, bestMatch, 'Matched perfectly within tolerances.');
      } else {
        // CONFLICTING: Found time candidates, but none matched the quantity tolerance
        // We link it to the closest time candidate as a "Conflict"
        timeCandidates.sort((a, b) => {
          const diffA = Math.abs(userTx.timestamp.getTime() - a.timestamp.getTime());
          const diffB = Math.abs(userTx.timestamp.getTime() - b.timestamp.getTime());
          return diffA - diffB;
        });

        const bestConflict = timeCandidates[0];
        addResult('CONFLICTING', userTx, bestConflict, `Time matched but quantity differed beyond ${quantityTolerancePercent}%. User: ${userTx.quantity}, Exchange: ${bestConflict.quantity}`);
      }
    }

    // Process remaining exchange transactions
    for (const exTx of exchangeTransactions) {
      if (!matchedExchangeIds.has(exTx._id.toString())) {
        let reason = 'Present in exchange file, not found in user file.';
        if (!exTx.isValid) {
          reason += ' Note: Data has issues: ' + exTx.issues.join(', ');
        }
        addResult('UNMATCHED_EXCHANGE', null, exTx, reason);
      }
    }

    // Save results
    if (results.length > 0) {
      await ReconciliationResult.insertMany(results);
    }

    // Update run summary
    const summary = {
      matched: results.filter(r => r.category === 'MATCHED').length,
      conflicting: results.filter(r => r.category === 'CONFLICTING').length,
      unmatchedUser: results.filter(r => r.category === 'UNMATCHED_USER').length,
      unmatchedExchange: results.filter(r => r.category === 'UNMATCHED_EXCHANGE').length,
    };

    await ReconciliationRun.updateOne({ runId }, { $set: { summary } });

    return { runId, summary };
  }
}

export default MatchingEngineService;
