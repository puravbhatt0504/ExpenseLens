/**
 * parse-text.js — POST /parse-text
 *
 * Receives raw OCR text from ML Kit, routes it through the App-Specific
 * Regex Router, then applies category inference from the database.
 */
const { Router } = require('express');
const db = require('../db');
const { routeParser } = require('../parsers');

const router = Router();

router.post('/', async (req, res) => {
  try {
    // Pre-process: strip commas within numbers (e.g., "1,700" → "1700")
    const rawText = (req.body.text || '').replace(/(\d),(\d)/g, '$1$2');
    if (!rawText) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const textLower = rawText.toLowerCase();

    // 1. Fetch categories and merchant_rules for category inference
    const { rows: categories } = await db.query('SELECT id, name FROM categories');
    const { rows: merchantRules } = await db.query('SELECT pattern, category_id FROM merchant_rules');

    // 2. Route to the correct app-specific parser
    const parsed = routeParser(rawText, lines);

    let parsedData = {
      amount: parsed.amount,
      merchant: parsed.merchant || 'Unknown Merchant',
      txnDate: parsed.txnDate || new Date().toISOString().split('T')[0],
      categoryId: null,
      note: parsed.note || null,
    };

    // 3. Category inference (shared across all parsers)

    // 3a. Merchant rules from DB (deterministic)
    if (parsedData.merchant && parsedData.merchant !== 'Unknown Merchant') {
      const merchantLower = parsedData.merchant.toLowerCase();
      for (const rule of merchantRules) {
        if (merchantLower.includes(rule.pattern.toLowerCase())) {
          parsedData.categoryId = rule.category_id;
          break;
        }
      }
    }

    // 3b. Category name match in full text
    if (!parsedData.categoryId) {
      const cat = categories.find(c => textLower.includes(c.name.toLowerCase()));
      if (cat) parsedData.categoryId = cat.id;
    }

    // 3c. Keyword heuristics
    if (!parsedData.categoryId) {
      const foodKw = ['pizza', 'burger', 'chicken', 'biryani', 'restaurant', 'food', 'kitchen', 'cafe', 'oven', 'swiggy', 'zomato', 'items', 'order total'];
      const groceryKw = ['grocery', 'blinkit', 'instamart', 'bigbasket', 'dmart', 'zepto'];
      const transportKw = ['uber', 'ola', 'rapido', 'taxi', 'ride', 'auto'];
      const shoppingKw = ['flipkart', 'amazon', 'myntra', 'meesho', 'mall', 'store'];
      const billsKw = ['electricity', 'water', 'gas', 'broadband', 'wifi', 'jio', 'airtel', 'vodafone', 'vi ', 'recharge', 'postpaid', 'prepaid'];
      const entertainmentKw = ['netflix', 'hotstar', 'prime video', 'spotify', 'youtube', 'bookmyshow', 'pvr', 'inox', 'movie'];

      if (foodKw.some(k => textLower.includes(k))) {
        const cat = categories.find(c => c.name.toLowerCase().includes('food'));
        if (cat) parsedData.categoryId = cat.id;
      } else if (groceryKw.some(k => textLower.includes(k))) {
        const cat = categories.find(c => c.name.toLowerCase().includes('grocer'));
        if (cat) parsedData.categoryId = cat.id;
      } else if (transportKw.some(k => textLower.includes(k))) {
        const cat = categories.find(c => c.name.toLowerCase().includes('transport'));
        if (cat) parsedData.categoryId = cat.id;
      } else if (shoppingKw.some(k => textLower.includes(k))) {
        const cat = categories.find(c => c.name.toLowerCase().includes('shop'));
        if (cat) parsedData.categoryId = cat.id;
      } else if (billsKw.some(k => textLower.includes(k))) {
        const cat = categories.find(c => c.name.toLowerCase().includes('bill') || c.name.toLowerCase().includes('utilit'));
        if (cat) parsedData.categoryId = cat.id;
      } else if (entertainmentKw.some(k => textLower.includes(k))) {
        const cat = categories.find(c => c.name.toLowerCase().includes('entertain'));
        if (cat) parsedData.categoryId = cat.id;
      }
    }

    console.log(`[parse-text] App: ${parsed.app} | Input: ${rawText.length} chars`);
    console.log(`[parse-text] Result:`, JSON.stringify(parsedData));

    res.json(parsedData);
  } catch (err) {
    console.error('POST /parse-text error:', err);
    res.status(500).json({ error: 'Failed to parse text', details: err.message || String(err) });
  }
});

module.exports = router;
