# Transaction Reconciliation Engine

A robust Node.js and Express based system to ingest, match, and reconcile cryptocurrency transaction datasets from users and exchanges.

## Features

- **Ingestion Pipeline**: Parses raw CSVs from multiple sources.
- **Data Quality Handling**: Instead of silently dropping bad rows (e.g., negative quantities, missing timestamps), the ingestion engine flags them and logs the specific issue in the database.
- **Configurable Matching Engine**: Matches transactions based on configurable time window tolerances and quantity percentage tolerances.
- **Type Equivalency Mapping**: Automatically maps perspective-based types (e.g., User `TRANSFER_OUT` equals Exchange `TRANSFER_IN`).
- **Asset Normalization**: Handles case insensitivity and common aliases (e.g., `bitcoin` to `BTC`).
- **RESTful API**: Triggers runs and generates detailed JSON and CSV reconciliation reports.

## Prerequisites

- Node.js (v18+ recommended)
- MongoDB is **not** required to be installed locally. The project uses `mongodb-memory-server` to automatically spin up an in-memory database for frictionless testing.

## Setup & Running

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Server**
   ```bash
   npm start
   ```
   The server will start on `http://localhost:3000`.

## API Endpoints

### 1. Trigger Reconciliation
**POST** `/reconcile`
```json
// Optional Request Body
{
  "timeToleranceMins": 5,
  "quantityTolerancePercent": 0.01
}
```
**Response**
```json
{
  "message": "Reconciliation completed successfully",
  "runId": "uuid-v4-string",
  "summary": { "matched": 21, "conflicting": 1, "unmatchedUser": 4, "unmatchedExchange": 3 }
}
```

### 2. Fetch Full Report (CSV Export)
**GET** `/report/:runId`
Downloads the detailed reconciliation report as a CSV file. Includes reasons for matching/conflicting/unmatched.

### 3. Fetch Summary
**GET** `/report/:runId/summary`
Returns the JSON summary counts of the run.

### 4. Fetch Unmatched Rows
**GET** `/report/:runId/unmatched`
Returns all unmatched rows (from both User and Exchange sources) in JSON format.

## System Design & Key Decisions

- **Database Choice**: MongoDB (Mongoose) was chosen because transaction data, especially with data quality issues, can be highly variable. The unstructured nature of NoSQL is perfect for keeping `originalRow` data intact.
- **Zero-Setup Database**: Used `mongodb-memory-server` to allow reviewers to pull and run the code immediately without setting up a database instance.
- **Validation Strategy**: Standard Mongoose schemas often enforce strict validation (throwing errors and aborting inserts). Because the requirements specified "do not silently drop bad rows", validation logic was moved to the `IngestionService`. The Mongoose schema fields were made optional so bad rows are still persisted but flagged with `isValid: false` and a list of `issues`.
- **Matching Heuristics**: The matching engine pairs `TRANSFER_OUT` with `TRANSFER_IN`. It also skips matching transactions via time-window heuristics if their timestamps are malformed, categorizing them as `UNMATCHED_USER` with the specific reason (e.g., "Data quality issue: missing timestamp").

## Project Structure
- `src/config/db.js`: In-memory MongoDB initialization.
- `src/controllers/reconciliationController.js`: Express route handlers.
- `src/models/`: Mongoose schemas (`Transaction`, `ReconciliationRun`, `ReconciliationResult`).
- `src/services/`: Core logic (`IngestionService.js` and `MatchingEngineService.js`).
- `src/routes/`: Express router definitions.
