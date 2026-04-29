const express = require('express');
const { connectDB } = require('./config/db');
const reconciliationRoutes = require('./routes/reconciliationRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use('/', reconciliationRoutes);

// Health check
app.get('/health', (req, res) => res.status(200).json({ status: 'OK' }));

const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Available endpoints:');
    console.log(`- POST http://localhost:${PORT}/reconcile`);
    console.log(`- GET  http://localhost:${PORT}/report/:runId`);
    console.log(`- GET  http://localhost:${PORT}/report/:runId/summary`);
    console.log(`- GET  http://localhost:${PORT}/report/:runId/unmatched`);
  });
};

startServer();
