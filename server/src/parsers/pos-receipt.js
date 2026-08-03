/**
 * POS Receipt Parser
 *
 * Handles standard thermal/POS restaurant receipts (e.g. Petpooja, Anlook, etc.)
 * These usually contain:
 * - Merchant name at the very top
 * - "Order Receipt" or "Bill"
 * - "Order Id", "Order Date"
 * - "Total Amount", "Total Paid"
 */
const { extractAmount, extractDate, titleCase } = require('./helpers');

function parsePosReceipt(rawText, lines) {
  let amount = 0;
  let merchant = '';
  let txnDate = null;
  let note = 'POS Receipt';

  // ===== MERCHANT =====
  // In POS receipts, the merchant is almost always the first or second line.
  for (const line of lines) {
    const l = line.trim();
    // Skip empty or garbage
    if (l.length < 3) continue;
    // Skip things that look like addresses or GST
    if (/address|gst|floor|sector|tower/i.test(l)) continue;
    // Skip purely numeric
    if (/^\d+$/.test(l)) continue;
    
    merchant = l;
    break;
  }

  // ===== AMOUNT =====
  // 1. Try inline first: "Total Paid: 750"
  const totalKeywords = [/total\s*pa[il]d/i, /total\s*amount/i, /net\s*amount/i, /grand\s*total/i];
  for (const line of lines) {
    if (totalKeywords.some(regex => regex.test(line))) {
      const inlineMatch = extractAmount(line);
      if (inlineMatch > 0) {
        amount = inlineMatch;
        break;
      }
    }
  }

  // 2. Fallback: Find the MAXIMUM amount prefixed with Rs, ₹, or INR in the entire text.
  // Thermal receipts always have the highest value as the grand total.
  if (!amount) {
    const currencyMatches = [...rawText.matchAll(/(?:rs\.?|inr|₹)\s*(\d+(?:\.\d{1,2})?)/gi)];
    if (currencyMatches.length > 0) {
      const amounts = currencyMatches.map(m => parseFloat(m[1]));
      amount = Math.max(...amounts);
    }
  }

  // 3. Ultimate Fallback: Find the last reasonable number in the text (less than 1,000,000 to avoid phone numbers)
  if (!amount) {
    const allNums = [...rawText.matchAll(/\b(\d+(?:\.\d{1,2})?)\b/g)]
      .map(m => parseFloat(m[1]))
      .filter(n => n < 1000000); // Filter out phone numbers
    if (allNums.length > 0) {
      amount = allNums[allNums.length - 1];
    }
  }

  // ===== DATE =====
  // The helper works well, but we can also explicitly look for "Order Date:"
  for (const line of lines) {
    if (/order\s*date/i.test(line)) {
      const datePart = line.replace(/order\s*date:?/i, '').trim();
      if (datePart) {
        txnDate = extractDate(datePart);
      }
      break;
    }
  }
  
  // Fallback to generic date extractor if not found next to "Order Date"
  if (!txnDate) {
    txnDate = extractDate(rawText);
  }

  return {
    amount: amount || 0,
    merchant: merchant ? titleCase(merchant) : '',
    txnDate,
    note,
  };
}

module.exports = parsePosReceipt;
