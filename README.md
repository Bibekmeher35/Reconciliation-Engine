# Transaction Reconciliation Engine

A full-stack solution to ingest, match, and reconcile cryptocurrency transaction datasets from users and exchanges. It features a robust Node.js backend API and a sleek, modern Next.js frontend interface.

## System Architecture

### 1. Backend (Node.js, Express, MongoDB)
- **Ingestion Pipeline**: Parses raw CSVs using `csv-parser` and validates the data. Bad rows are flagged and stored (not dropped), maintaining absolute data integrity.
- **Matching Engine**: Features dynamic time window tolerances and quantity percentage tolerances. Automatically maps perspective-based transaction types (e.g., User `TRANSFER_OUT` equals Exchange `TRANSFER_IN`).
- **File Handling**: Uploaded files are temporarily stored via `multer` for ingestion and instantly purged from the disk once written to the database.
- **Zero-Setup Database**: Utilizes `mongodb-memory-server` to automatically spin up a volatile, in-memory MongoDB instance when the server starts. No local MongoDB installation is required!

### 2. Frontend (Next.js, React)
- **Modern Interface**: Built with Vanilla CSS, featuring a premium dark-mode glassmorphism aesthetic.
- **Interactive Capabilities**: Users can effortlessly drag-and-drop or select User and Exchange CSV files, tweak matching tolerances, and view visual metrics instantly.
- **Instant Reporting**: Directly downloads the comprehensive Reconciliation CSV Report immediately after processing.

---

## Getting Started

### Prerequisites
- **Node.js** (v18 or higher recommended)
- *(MongoDB is **not** required locally)*

### Setup Instructions

You will need to run the backend and the frontend simultaneously in two separate terminal windows.

#### 1. Start the Backend API
Open your first terminal window, navigate to the project root, and run:
```bash
# Install backend dependencies
npm install

# Start the Express server (Runs on Port 3000)
npm start
```

#### 2. Start the Frontend UI
Open a second terminal window, navigate to the `frontend/` directory, and run:
```bash
cd frontend

# Install frontend dependencies
npm install

# Start the Next.js development server (Runs on Port 3001)
npm run dev -- -p 3001
```

#### 3. Access the Application
Open your browser and navigate to: **http://localhost:3001**

---

## API Endpoints Reference

If you prefer using `curl` or Postman, the backend exposes the following REST endpoints on `http://localhost:3000`:

- **`POST /reconcile`**: Accepts `multipart/form-data` containing `userFile`, `exchangeFile`, `timeToleranceMins`, and `quantityTolerancePercent`. Triggers the engine and returns a summary.
- **`GET /report/:runId`**: Streams the generated reconciliation report as a downloadable CSV.
- **`GET /report/:runId/summary`**: Returns the summary counts of the run in JSON format.
- **`GET /report/:runId/unmatched`**: Returns details for all unmatched rows.

---

## Key Design Decisions

- **Handling Bad Data**: The assignment explicitly requested not to drop bad data. This was solved by migrating standard strict Mongoose validations into a custom `IngestionService`. Invalid rows are written to MongoDB with an `isValid: false` flag and an array detailing their `issues`.
- **ES Modules**: The entire backend was refactored to use standard ES Modules (`import`/`export`) for modern, future-proof JavaScript compliance.
- **File Cleanup**: Uploaded CSV files are passed cleanly to the ingestion streams and instantly unlinked via `fs.unlinkSync()` to prevent server bloat.
