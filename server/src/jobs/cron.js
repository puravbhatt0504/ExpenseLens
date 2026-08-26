/**
 * cron.js — LOCAL DEVELOPMENT ONLY.
 *
 * node-cron keeps a timer alive inside the Node process, which only works
 * for a process that stays running — true for `npm run dev` locally, false
 * for a Vercel serverless function, which freezes or terminates between
 * requests. In production the same job runs via Vercel Cron hitting
 * GET /jobs/auto-split-savings (see vercel.json and routes/jobs.js).
 */
const cron = require('node-cron');
const { runAutoSplitSavings } = require('./autoSplitSavings');

function startCronJobs() {
  if (process.env.VERCEL) {
    // Never schedule an in-process timer on Vercel — it will not fire, and
    // it would race with the real trigger (Vercel Cron) if it somehow did.
    return;
  }

  // Run on the 1st of every month at 00:00, local time.
  cron.schedule('0 0 1 * *', async () => {
    console.log('Running auto-split savings cron job...');
    try {
      const summary = await runAutoSplitSavings();
      console.log('[cron] auto-split-savings:', summary);
    } catch (err) {
      console.error('Error in auto-split cron job:', err);
    }
  });
  console.log('Cron jobs scheduled (local dev).');
}

module.exports = { startCronJobs };
