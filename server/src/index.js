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
const jobsRouter = require('./routes/jobs');
const { requireAuth } = require('./middleware/auth');
const { startCronJobs } = require('./jobs/cron');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
//
// The Flutter app authenticates with a bearer token it holds itself, so an
// open CORS policy could not be used to steal a session — but there is no
// reason to leave `Access-Control-Allow-Origin: *` open to the entire
// internet either. Only the web app's known origins are allowed; requests
// with no Origin header (native HTTP clients, curl, server-to-server calls,
// and Vercel Cron) are unaffected — CORS is a browser-only mechanism.
const ALLOWED_ORIGINS = [
  'https://expense-lens-app.vercel.app',
  'http://localhost:3000',
];
// Every Vercel preview deployment of the web app gets its own subdomain
// (web-<hash>-purav-bhatts-projects.vercel.app) that can't be listed ahead
// of time.
const VERCEL_PREVIEW_ORIGIN = /^https:\/\/web-[a-z0-9]+-purav-bhatts-projects\.vercel\.app$/;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin) || VERCEL_PREVIEW_ORIGIN.test(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
}));
app.use(express.json());

// Public Routes
app.use('/auth', authRouter);
app.use('/categories', categoriesRouter); // Assuming categories are global for now
app.use('/jobs', jobsRouter); // guarded by CRON_SECRET, not requireAuth — see routes/jobs.js

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
  startCronJobs();
});
