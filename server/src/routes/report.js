/**
 * report.js — GET /report?month=YYYY-MM
 */
const { Router } = require('express');
const PDFDocument = require('pdfkit-table');
const db = require('../db');

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { month } = req.query;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'month query param required in YYYY-MM format' });
    }

    // 1. Fetch summary data (from Phase 4 logic)
    const summaryQuery = `
      SELECT 
        COUNT(t.id) as count,
        COALESCE(SUM(t.amount), 0) as total
      FROM transactions t
      WHERE to_char(t.txn_date, 'YYYY-MM') = $1 AND t.user_id = $2
    `;
    const { rows: summaryRows } = await db.query(summaryQuery, [month, req.user.id]);
    const total = parseFloat(summaryRows[0].total);

    // 2. Fetch category breakdown
    const categoryQuery = `
      SELECT 
        c.id, c.name, COALESCE(SUM(t.amount), 0) as amount
      FROM categories c
      LEFT JOIN transactions t ON c.id = t.category_id AND to_char(t.txn_date, 'YYYY-MM') = $1 AND t.user_id = $2
      GROUP BY c.id, c.name
      HAVING COALESCE(SUM(t.amount), 0) > 0
      ORDER BY amount DESC
    `;
    const { rows: categoryRows } = await db.query(categoryQuery, [month, req.user.id]);

    // 3. Fetch transactions list
    const transactionsQuery = `
      SELECT t.amount, t.txn_date, t.merchant, t.note, c.name AS category_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE to_char(t.txn_date, 'YYYY-MM') = $1 AND t.user_id = $2
      ORDER BY t.txn_date DESC, t.created_at DESC
    `;
    const { rows: transactionRows } = await db.query(transactionsQuery, [month, req.user.id]);

    // 4. Initialize PDF Document
    const doc = new PDFDocument({ margin: 30, size: 'A4' });

    // Stream PDF directly to response
    res.setHeader('Content-disposition', `attachment; filename="ExpenseReport_${month}.pdf"`);
    res.setHeader('Content-type', 'application/pdf');
    doc.pipe(res);

    // Add title
    doc.fontSize(20).text(`Expense Report: ${month}`, { align: 'center' });
    doc.moveDown();

    // Add Total Spend
    doc.fontSize(16).text(`Total Spend: Rs. ${total.toFixed(2)}`, { align: 'center' });
    doc.moveDown(2);

    // Add Category Breakdown Table
    if (categoryRows.length > 0) {
      doc.fontSize(14).text('Category Breakdown', { underline: true });
      doc.moveDown();
      
      const categoryTable = {
        headers: ['Category', 'Amount (Rs.)', '% of Total'],
        rows: categoryRows.map(row => {
          const amt = parseFloat(row.amount);
          const percent = ((amt / total) * 100).toFixed(1);
          return [row.name, amt.toFixed(2), `${percent}%`];
        }),
      };
      
      await doc.table(categoryTable, { 
        prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
        prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => doc.font('Helvetica').fontSize(10)
      });
      doc.moveDown(2);
    }

    // Add Transactions Table
    if (transactionRows.length > 0) {
      doc.fontSize(14).text('Transactions', { underline: true });
      doc.moveDown();
      
      const transactionsTable = {
        headers: ['Date', 'Merchant / Note', 'Category', 'Amount (Rs.)'],
        rows: transactionRows.map(t => {
          const dateStr = t.txn_date instanceof Date ? t.txn_date.toISOString().split('T')[0] : t.txn_date;
          let desc = t.merchant || '';
          if (t.note) desc += (desc ? ' - ' + t.note : t.note);
          if (!desc) desc = 'Unknown';
          
          return [
            dateStr,
            desc,
            t.category_name || 'Uncategorized',
            parseFloat(t.amount).toFixed(2)
          ];
        }),
      };
      
      await doc.table(transactionsTable, {
        prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
        prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => doc.font('Helvetica').fontSize(10)
      });
    } else {
      doc.fontSize(12).text('No transactions found for this month.', { align: 'center' });
    }

    // Finalize PDF
    doc.end();

  } catch (err) {
    console.error('GET /report error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate report' });
    }
  }
});

module.exports = router;
