/**
 * jobs.js — HTTP-triggered background jobs.
 *
 * Vercel serverless functions are ephemeral — an in-process node-cron timer
 * scheduled inside app.listen() never fires in production, because nothing
 * keeps the process alive between requests. Vercel Cron instead calls an
 * HTTP endpoint on a schedule, so the job body has to live behind a route.
 *
 * Guarded by CRON_SECRET rather than requireAuth: Vercel Cron cannot supply
 * a user's session token, and this must not be a route any client can call.
 */
const { Router } = require('express');
const { runAutoSplitSavings } = require('../jobs/autoSplitSavings');

const router = Router();

function requireCronSecret(req, res, next) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// GET /jobs/auto-split-savings — invoked by Vercel Cron (see vercel.json).
router.get('/auto-split-savings', requireCronSecret, async (req, res) => {
  try {
    const summary = await runAutoSplitSavings();
    console.log('[jobs] auto-split-savings:', summary);
    res.json({ ok: true, ...summary });
  } catch (err) {
    console.error('[jobs] auto-split-savings failed:', err);
    res.status(500).json({ ok: false, error: 'Auto-split job failed' });
  }
});

module.exports = router;
