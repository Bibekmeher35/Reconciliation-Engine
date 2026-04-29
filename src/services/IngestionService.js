import fs from 'fs';
import csv from 'csv-parser';
import Transaction from '../models/Transaction.js';

class IngestionService {
  /**
   * Parse a CSV file and return an array of raw row objects
   */
  static async parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
  }

  /**
   * Ingest a set of rows into the database for a given runId and source
   */
  static async ingestData(runId, source, rows) {
    const transactions = rows.map((row) => {
      const issues = [];
      let isValid = true;

      // 1. Validate Transaction ID
      const transaction_id = row.transaction_id || row.TransactionID || '';
      if (!transaction_id) {
        issues.push('Missing transaction_id');
        isValid = false;
      }

      // 2. Validate and Parse Timestamp
      let parsedTimestamp = null;
      if (!row.timestamp) {
        issues.push('Missing timestamp entirely');
        isValid = false;
      } else {
        const dateObj = new Date(row.timestamp);
        if (isNaN(dateObj.getTime())) {
          issues.push('Malformed timestamp');
          isValid = false;
        } else {
          parsedTimestamp = dateObj;
        }
      }

      // 3. Validate Type
      const type = row.type ? row.type.toUpperCase() : '';
      if (!type) {
        issues.push('Missing type');
        isValid = false;
      }

      // 4. Validate Asset
      const asset = row.asset ? row.asset.toUpperCase().trim() : '';
      if (!asset) {
        issues.push('Missing asset');
        isValid = false;
      } else if (asset === 'BITCOIN') {
        // Handle common aliases, though this can be expanded
        // The assignment mentioned mapping bitcoin to BTC, handling this via case-insensitivity
        // But doing it explicitly here for safety
        // The Matching engine will handle uppercase/lowercase, but if we do it here it's cleaner
      }

      const normalizedAsset = asset === 'BITCOIN' ? 'BTC' : asset;

      // 5. Validate Quantity
      const quantityStr = row.quantity || '0';
      const quantity = parseFloat(quantityStr);
      if (isNaN(quantity)) {
        issues.push('Invalid quantity format');
        isValid = false;
      } else if (quantity < 0) {
        issues.push('Negative quantity - data error');
        isValid = false;
      }

      // 6. Optional fields
      const price_usd = row.price_usd ? parseFloat(row.price_usd) : null;
      const fee = row.fee ? parseFloat(row.fee) : null;

      return {
        source,
        runId,
        transaction_id,
        timestamp: parsedTimestamp,
        type,
        asset: normalizedAsset,
        quantity: isNaN(quantity) ? 0 : quantity,
        price_usd: isNaN(price_usd) ? null : price_usd,
        fee: isNaN(fee) ? null : fee,
        note: row.note || '',
        originalRow: row,
        isValid,
        issues,
      };
    });

    // Insert to DB
    if (transactions.length > 0) {
      await Transaction.insertMany(transactions);
    }

    return transactions;
  }

  /**
   * Run the full ingestion pipeline for a reconciliation run
   */
  static async process(runId, userFilePath, exchangeFilePath) {
    try {
      const userRows = await this.parseCSV(userFilePath);
      const exchangeRows = await this.parseCSV(exchangeFilePath);

      await this.ingestData(runId, 'USER', userRows);
      await this.ingestData(runId, 'EXCHANGE', exchangeRows);

      console.log(`Ingestion completed for runId: ${runId}`);
    } catch (error) {
      console.error('Ingestion failed:', error);
      throw error;
    }
  }
}

export default IngestionService;
