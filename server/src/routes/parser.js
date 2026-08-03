const { Router } = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const db = require('../db');

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /parse-receipt — parse UPI/PhonePe screenshots using Tesseract JS
router.post('/', upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    // 1. Fetch categories for context
    const { rows: categories } = await db.query('SELECT id, name FROM categories');

    // 2. Run Tesseract JS
    let parsedData = { amount: 0.0, merchant: 'Unknown Merchant', txnDate: null, categoryId: null, note: null };
    try {
      const result = await Tesseract.recognize(req.file.buffer, 'eng');
      const text = result.data.text.toLowerCase();
      
      // Extract amount
      const amountMatch = text.match(/(?:rs\.?|inr|₹|amount|paid)\s*(\d+(?:\.\d{1,2})?)/);
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

    } catch (e) {
      console.error('Tesseract execution/parsing failed:', e);
      return res.status(500).json({ error: 'Failed to parse image', details: e.message || String(e) });
    }

    res.json(parsedData);
  } catch (err) {
    console.error('POST /parse-receipt error:', err);
    res.status(500).json({ error: 'Failed to parse receipt', details: err.message || String(err) });
  }
});

module.exports = router;
