const cron = require('node-cron');
const db = require('../db');

function startCronJobs() {
  // Run on the 1st of every month at 00:00
  cron.schedule('0 0 1 * *', async () => {
    console.log('Running auto-split savings cron job...');
    try {
      // Find users who opted in
      const { rows: users } = await db.query('SELECT id FROM users WHERE auto_split_savings = true');
      if (users.length === 0) return;

      // Determine previous month string (YYYY-MM)
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      const prevMonthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      for (const user of users) {
        // Calculate total income for prev month
        const incRes = await db.query(`SELECT SUM(amount) as total FROM incomes WHERE user_id = $1 AND date LIKE $2`, [user.id, `${prevMonthStr}-%`]);
        const income = parseFloat(incRes.rows[0].total || 0);

        // Calculate total spend
        const expRes = await db.query(`SELECT SUM(amount) as total FROM transactions WHERE user_id = $1 AND txn_date LIKE $2`, [user.id, `${prevMonthStr}-%`]);
        const spend = parseFloat(expRes.rows[0].total || 0);

        const netBalance = income - spend;
        if (netBalance <= 0) continue;

        // Fetch active goals
        const { rows: goals } = await db.query(`SELECT * FROM savings_goals WHERE user_id = $1 AND current_amount < target_amount`, [user.id]);
        if (goals.length === 0) continue;

        const splitAmount = Math.floor((netBalance / goals.length) * 100) / 100;

        for (const goal of goals) {
          const newAmount = parseFloat(goal.current_amount) + splitAmount;
          await db.query(`UPDATE savings_goals SET current_amount = $1 WHERE id = $2`, [newAmount, goal.id]);
        }
        console.log(`Auto-split ${netBalance} across ${goals.length} goals for user ${user.id}`);
      }
    } catch (err) {
      console.error('Error in auto-split cron job:', err);
    }
  });
  console.log('Cron jobs scheduled.');
}

module.exports = { startCronJobs };
