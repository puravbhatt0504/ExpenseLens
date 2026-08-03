/**
 * Retail / Supermarket Invoice Parser
 * Targets: D-Mart, Reliance Smart, Electronics, Clothing stores.
 */
const { extractAmount, extractDate, titleCase } = require('./helpers');

function parseRetailInvoice(rawText, lines) {
  let amount = 0;
  let merchant = '';
  let txnDate = extractDate(rawText);
  let note = 'Retail Invoice';

  // ===== MERCHANT =====
  // In retail, the merchant is usually right before the GSTIN or Address, or at the very top.
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (/gstin\s*:/i.test(l)) {
      // Look back a few lines for the merchant name
      for (let j = i - 1; j >= Math.max(0, i - 4); j--) {
        const candidate = lines[j].trim();
        if (candidate.length > 3 && !/address|floor|sector|near/i.test(candidate)) {
          merchant = candidate;
          break;
        }
      }
      break;
    }
  }
  
  if (!merchant) {
    // Fallback: first non-empty line that isn't a header
    for (const line of lines) {
      const l = line.trim();
      if (l.length > 3 && !/tax\s*invoice|retail\s*invoice|cash\s*memo/i.test(l)) {
        merchant = l;
        break;
      }
    }
  }

  // ===== AMOUNT =====
  // Retail invoices have "Subtotal", "Tax", "Cash Tendered", "Change Due". We want "Grand Total", "Amount Payable", "Net Amount".
  const totalKeywords = [/grand\s*total/i, /amount\s*payable/i, /net\s*amount/i, /net\s*payable/i, /^total\s*amount/i];
  
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

module.exports = parseRetailInvoice;
