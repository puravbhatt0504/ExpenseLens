/**
 * report.js — GET /report?month=YYYY-MM
 */
const { Router } = require('express');
const PDFDocument = require('pdfkit-table');
const db = require('../db');

const router = Router();

// Helper for Pie Chart slices
function getPieSliceSvg(cx, cy, radius, startAngle, endAngle) {
  startAngle -= Math.PI / 2;
  endAngle -= Math.PI / 2;
  
  const startX = cx + radius * Math.cos(startAngle);
  const startY = cy + radius * Math.sin(startAngle);
  const endX = cx + radius * Math.cos(endAngle);
  const endY = cy + radius * Math.sin(endAngle);
  
  const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";
  
  return `M ${cx} ${cy} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
}

router.get('/', async (req, res) => {
  try {
    const { month } = req.query;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'month query param required in YYYY-MM format' });
    }

    // 1. Fetch summary data
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
        c.id, c.name, c.color, COALESCE(SUM(t.amount), 0) as amount
      FROM categories c
      LEFT JOIN transactions t ON c.id = t.category_id AND to_char(t.txn_date, 'YYYY-MM') = $1 AND t.user_id = $2
      GROUP BY c.id, c.name, c.color
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
    const doc = new PDFDocument({ margin: 0, size: 'A4' });

    res.setHeader('Content-disposition', `attachment; filename="ExpenseReport_${month}.pdf"`);
    res.setHeader('Content-type', 'application/pdf');
    doc.pipe(res);

    const primaryColor = '#6C63FF';
    const textPrimary = '#1E1E2C';
    const textSecondary = '#8A93A6';

    // Header Background
    doc.rect(0, 0, 595.28, 150).fill(primaryColor);
    
    // Title
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(28).text('ExpenseLens', 40, 40);
    doc.font('Helvetica').fontSize(14).text(`Monthly Report: ${month}`, 40, 75);

    // Total Spend Card
    doc.roundedRect(380, 30, 175, 90, 10).fill('#FFFFFF');
    doc.fillColor(textSecondary).font('Helvetica').fontSize(12).text('Total Spend', 390, 45);
    doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(22).text(`Rs. ${total.toFixed(0)}`, 390, 70);
    doc.fillColor(textSecondary).font('Helvetica').fontSize(10).text(`${summaryRows[0].count} transactions`, 390, 100);

    doc.x = 40;
    doc.y = 180;
    
    // Category Breakdown & Pie Chart
    if (categoryRows.length > 0) {
      doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(18).text('Category Breakdown');
      doc.moveDown(1);
      
      // Draw Pie Chart
      const cx = 110;
      const cy = doc.y + 60;
      const radius = 60;
      let currentAngle = 0;
      
      categoryRows.forEach(row => {
        const amt = parseFloat(row.amount);
        const sliceAngle = (amt / total) * 2 * Math.PI;
        const color = row.color || primaryColor;
        
        if (sliceAngle > 1.999 * Math.PI) {
          doc.circle(cx, cy, radius).fill(color);
        } else if (sliceAngle > 0) {
          const svgPath = getPieSliceSvg(cx, cy, radius, currentAngle, currentAngle + sliceAngle);
          doc.path(svgPath).fill(color);
        }
        currentAngle += sliceAngle;
      });

      // Draw Legend Table beside the pie chart
      const legendX = cx + radius + 40;
      const legendY = doc.y;
      
      const categoryTable = {
        headers: ['Category', 'Amount (Rs.)', '% of Total'],
        rows: categoryRows.map(row => {
          const amt = parseFloat(row.amount);
          const percent = ((amt / total) * 100).toFixed(1);
          return [row.name, amt.toFixed(2), `${percent}%`];
        }),
      };
      
      await doc.table(categoryTable, {
        width: 300,
        x: legendX,
        y: legendY,
        prepareHeader: () => doc.font('Helvetica-Bold').fontSize(11).fillColor('#FFFFFF'),
        prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
          doc.font('Helvetica').fontSize(10).fillColor(textPrimary);
          // Small color square for legend
          if (indexColumn === 0) {
            const rowColor = categoryRows[indexRow]?.color || primaryColor;
            doc.rect(rectCell.x + 4, rectCell.y + 4, 8, 8).fill(rowColor);
          }
        },
        divider: {
          header: { disabled: false, width: 2, opacity: 1 },
          horizontal: { disabled: false, width: 1, opacity: 0.2 },
        },
        padding: 8,
      });

      // Move Y below the chart or table (whichever is taller)
      doc.y = Math.max(cy + radius + 30, doc.y + 30);
    }

    // Transactions Table
    if (transactionRows.length > 0) {
      doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(18).text('Transactions', 40, doc.y);
      doc.moveDown(0.5);
      
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
        width: 515,
        x: 40,
        prepareHeader: () => doc.font('Helvetica-Bold').fontSize(11).fillColor('#FFFFFF'),
        prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
          doc.font('Helvetica').fontSize(10).fillColor(textPrimary);
        },
        divider: {
          header: { disabled: false, width: 2, opacity: 1 },
          horizontal: { disabled: false, width: 1, opacity: 0.2 },
        },
        padding: 8,
      });
    } else {
      doc.fillColor(textSecondary).font('Helvetica').fontSize(14).text('No transactions found for this month.', { align: 'center' });
    }

    // Footer
    doc.moveDown(2);
    doc.fillColor('#CCCCCC').font('Helvetica').fontSize(10).text('Generated by ExpenseLens', { align: 'center' });

    doc.end();

  } catch (err) {
    console.error('GET /report error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate report' });
    }
  }
});

module.exports = router;
