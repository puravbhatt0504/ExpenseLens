/**
 * autoSplitSavings.js — Splits each opted-in user's prior-month surplus
 * (income minus spend) across their active savings goals.
 *
 * Shared between the local dev node-cron trigger (cron.js) and the
 * production Vercel Cron route (routes/jobs.js), so there is exactly one
 * implementation of the actual logic.
 */
const db = require('../db');
const { monthStart } = require('../lib/dateRange');

/** Previous calendar month as 'YYYY-MM', relative to `now`. */
function previousMonthStr(now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

async function runAutoSplitSavings() {
  const prevMonthStr = previousMonthStr();
  const start = monthStart(prevMonthStr);
  const summary = { month: prevMonthStr, processed: 0, skippedAlreadyRun: 0, skippedNoSurplus: 0 };

  const { rows: users } = await db.query('SELECT id FROM users WHERE auto_split_savings = true');
  if (users.length === 0) return summary;

  for (const user of users) {
    // Idempotency guard: Vercel Cron delivery is at-least-once, and this
    // job *increments* current_amount, so re-running it for a month
    // already split would double-apply real money. Claiming the
    // (user_id, month) row atomically is the lock.
    const { rows: claimRows } = await db.query(
      'INSERT INTO auto_split_runs (user_id, month) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING user_id',
      [user.id, prevMonthStr]
    );
    if (claimRows.length === 0) {
      summary.skippedAlreadyRun++;
      continue;
    }

    const [incRes, expRes] = await Promise.all([
      db.query(
        `SELECT SUM(amount) as total FROM incomes
         WHERE user_id = $1 AND date >= $2::date AND date < ($2::date + INTERVAL '1 month')`,
        [user.id, start]
      ),
      db.query(
        `SELECT SUM(amount) as total FROM transactions
         WHERE user_id = $1 AND txn_date >= $2::date AND txn_date < ($2::date + INTERVAL '1 month')`,
        [user.id, start]
      ),
    ]);
    const income = parseFloat(incRes.rows[0].total || 0);
    const spend = parseFloat(expRes.rows[0].total || 0);
    const netBalance = income - spend;

    if (netBalance <= 0) {
      summary.skippedNoSurplus++;
      continue;
    }

    const { rows: goals } = await db.query(
      'SELECT * FROM savings_goals WHERE user_id = $1 AND current_amount < target_amount',
      [user.id]
    );
    if (goals.length === 0) continue;

    const splitAmount = Math.floor((netBalance / goals.length) * 100) / 100;

    for (const goal of goals) {
      const newAmount = parseFloat(goal.current_amount) + splitAmount;
      await db.query('UPDATE savings_goals SET current_amount = $1 WHERE id = $2', [newAmount, goal.id]);
    }
    summary.processed++;
    console.log(`Auto-split ${netBalance} across ${goals.length} goals for user ${user.id}`);
  }

  return summary;
}

module.exports = { runAutoSplitSavings, previousMonthStr };
