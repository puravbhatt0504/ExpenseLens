/**
 * Fuel Station Receipt Parser
 * Targets: IndianOil, Bharat Petroleum, HP, Shell
 */
const { extractAmount, extractDate, titleCase } = require('./helpers');

function parseFuelReceipt(rawText, lines) {
  let amount = 0;
  let merchant = 'Fuel Station';
  let txnDate = extractDate(rawText);
  let note = 'Fuel Receipt';

  // ===== MERCHANT =====
  // Usually top line
  for (const line of lines) {
    const l = line.trim();
    if (l.length < 3) continue;
    if (/(petroleum|hpcl|indianoil|bpcl|shell|fuel|pump)/i.test(l)) {
      merchant = l;
      break;
    }
  }

  // ===== AMOUNT =====
  // Look for "Amount(Rs)", "Sale Amount", "Sale(Rs)". explicitly IGNORE "Rate/Ltr", "Volume".
  const amountKeywords = [/amount\s*\(?rs/i, /sale\s*amount/i, /^amount/i];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isAmountLine = amountKeywords.some(regex => regex.test(line));
    if (isAmountLine) {
      const inlineAmount = extractAmount(line);
      if (inlineAmount > 0) {
        amount = inlineAmount;
        break;
      }
      // Look ahead up to 2 lines
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

module.exports = parseFuelReceipt;
