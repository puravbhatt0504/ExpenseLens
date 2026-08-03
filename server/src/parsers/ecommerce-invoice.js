/**
 * E-commerce Invoice Parser
 * Targets: Amazon, Flipkart, Blinkit, Zepto
 */
const { extractAmount, extractDate, titleCase } = require('./helpers');

function parseEcommerceInvoice(rawText, lines) {
  let amount = 0;
  let merchant = 'E-commerce';
  let txnDate = extractDate(rawText);
  let note = 'E-commerce Order';

  // ===== MERCHANT =====
  // Look for "Sold By:" or "Seller:"
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/(sold\s*by|seller)\s*:/i.test(line)) {
      const inlineMatch = line.replace(/(sold\s*by|seller)\s*:/i, '').trim();
      if (inlineMatch.length > 3) {
        merchant = inlineMatch;
        break;
      }
      // Look ahead 1 line
      if (i + 1 < lines.length) {
        merchant = lines[i + 1].trim();
        break;
      }
    }
  }

  // ===== AMOUNT =====
  // Look for "Grand Total" usually at the bottom of the table
  const totalKeywords = [/grand\s*total/i, /total\s*amount/i];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isTotal = totalKeywords.some(regex => regex.test(line));
    if (isTotal) {
      const inlineAmount = extractAmount(line);
      if (inlineAmount > 0) {
        amount = inlineAmount;
        break;
      }
      // Look ahead up to 3 lines
      for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
        const possibleAmount = extractAmount(lines[j]);
        if (possibleAmount > 0) {
          amount = possibleAmount;
          break;
        }
      }
      if (amount > 0) break;
    }
  }

  return {
    amount: amount || 0,
    merchant: merchant ? titleCase(merchant) : '',
    txnDate,
    note,
  };
}

module.exports = parseEcommerceInvoice;
