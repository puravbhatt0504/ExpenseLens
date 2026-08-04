/**
 * index.js — Express API entry point for ExpenseLens.
 */
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const authRouter = require('./routes/auth');
const categoriesRouter = require('./routes/categories');
const transactionsRouter = require('./routes/transactions');
const summaryRouter = require('./routes/summary');
const parserRouter = require('./routes/parser');
const reportRouter = require('./routes/report');
const { requireAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Public Routes
app.use('/auth', authRouter);
app.use('/categories', categoriesRouter); // Assuming categories are global for now

const parseTextRouter = require('./routes/parse-text');
const budgetsRouter = require('./routes/budgets');

const incomesRouter = require('./routes/incomes');
const savingsRouter = require('./routes/savings');

// Protected Routes
app.use('/transactions', requireAuth, transactionsRouter);
app.use('/incomes', requireAuth, incomesRouter);
app.use('/savings', requireAuth, savingsRouter);
app.use('/summary', requireAuth, summaryRouter);
app.use('/budgets', requireAuth, budgetsRouter);
app.use('/parse-receipt', requireAuth, parserRouter);
app.use('/parse-text', requireAuth, parseTextRouter);
app.use('/report', requireAuth, reportRouter);

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'expenselens-api' });
});

// Start server
app.listen(PORT, () => {
  console.log(`ExpenseLens API running on http://localhost:${PORT}`);
});
