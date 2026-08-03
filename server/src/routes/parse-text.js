const { Router } = require('express');
const db = require('../db');

const router = Router();

// POST /parse-text — parse extracted text from ML Kit
router.post('/', async (req, res) => {
  try {
    const rawText = req.body.text;
    if (!rawText) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const text = rawText.toLowerCase();

    // 1. Fetch categories for context
    const { rows: categories } = await db.query('SELECT id, name FROM categories');

    let parsedData = { amount: 0.0, merchant: 'Unknown Merchant', txnDate: null, categoryId: null, note: null };

    // Extract amount
    // Improved regex to handle "Order Summary" where amount is at the end or preceded by "paid by" / "to pay"
    let amountMatch = text.match(/(?:paid by.*?₹\s*|to pay.*?₹\s*|total.*?₹\s*)(\d+(?:\.\d{1,2})?)/i);
    
    // If not found, try the old generic one or look for the last occurrence of ₹<amount>
    if (!amountMatch) {
      const allAmounts = [...text.matchAll(/₹\s*(\d+(?:\.\d{1,2})?)/g)];
      if (allAmounts.length > 0) {
        amountMatch = allAmounts[allAmounts.length - 1]; // usually the final paid amount is at the bottom
      } else {
        amountMatch = text.match(/(?:rs\.?|inr|amount|paid)\s*(\d+(?:\.\d{1,2})?)/);
      }
    }

    if (amountMatch) {
      parsedData.amount = parseFloat(amountMatch[1]);
    }

    // Extract date (YYYY-MM-DD or DD/MM/YYYY)
    const dateMatch = text.match(/(\d{4}-\d{2}-\d{2})|(\d{2}\/\d{2}\/\d{4})/);
    if (dateMatch) {
      if (dateMatch[1]) {
        parsedData.txnDate = dateMatch[1];
      } else {
        const [d, m, y] = dateMatch[2].split('/');
        parsedData.txnDate = `${y}-${m}-${d}`;
      }
    }
    
    if (!parsedData.txnDate) {
      parsedData.txnDate = new Date().toISOString().split('T')[0];
    }

    // Extract merchant
    const merchantMatch = text.match(/paid to\s+([a-z\s]+)/);
    let merchant = '';
    if (merchantMatch) {
      merchant = merchantMatch[1].trim();
      parsedData.merchant = merchant.replace(/\b\w/g, l => l.toUpperCase()); // Title Case
    } else {
      // For food delivery, the first line usually contains the merchant
      const firstLine = text.split('\n').map(l => l.trim()).find(l => l.length > 0);
      if (firstLine && !firstLine.includes('summary') && !firstLine.includes('order')) {
        // e.g., "oven story (2 items)"
        merchant = firstLine.replace(/\(\d+\s*items?\)/i, '').trim();
        parsedData.merchant = merchant.replace(/\b\w/g, l => l.toUpperCase());
      }
    }

    // Infer category
    if (merchant) {
      const cat = categories.find(c => merchant.includes(c.name.toLowerCase()));
      if (cat) parsedData.categoryId = cat.id;
    }
    if (!parsedData.categoryId) {
       const cat = categories.find(c => text.includes(c.name.toLowerCase()));
       if (cat) parsedData.categoryId = cat.id;
    }

    // Check merchant_rules for a deterministic match
    if (parsedData.merchant && parsedData.merchant !== 'Unknown Merchant') {
      const merchantLower = parsedData.merchant.toLowerCase();
      const { rows: rules } = await db.query('SELECT pattern, category_id FROM merchant_rules');
      for (const rule of rules) {
        if (merchantLower.includes(rule.pattern.toLowerCase())) {
          parsedData.categoryId = rule.category_id;
          break;
        }
      }
    }

    res.json(parsedData);
  } catch (err) {
    console.error('POST /parse-text error:', err);
    res.status(500).json({ error: 'Failed to parse text', details: err.message || String(err) });
  }
});

module.exports = router;
