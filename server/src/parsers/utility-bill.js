/**
 * Utility Bill Parser
 * Targets: Electricity, Gas, Water, Broadband (BESCOM, Jio, Airtel, Mahavitaran)
 */
const { extractAmount, extractDate, titleCase } = require('./helpers');

function parseUtilityBill(rawText, lines) {
  let amount = 0;
  let merchant = '';
  let txnDate = null;
  let note = 'Utility Bill';

  // ===== MERCHANT =====
  // Usually the largest text at the top: BESCOM, Airtel, Jio, etc.
  for (const line of lines) {
    const l = line.trim();
    if (l.length < 3) continue;
    if (/(electricity|power|gas|broadband|water|telecom)/i.test(l) || /limited|ltd/i.test(l)) {
      merchant = l;
      break;
    }
    // Very common providers
    if (/(bescom|mahavitaran|adani|airtel|jio|bsnl|vodafone|vi )/i.test(l)) {
      merchant = l;
      break;
    }
  }

  // ===== AMOUNT =====
  // Utility bills have "Amount Payable (on or before due date)", "Net Payable". 
  const totalKeywords = [/amount\s*payable/i, /net\s*payable/i, /total\s*due/i, /current\s*bill/i];
  
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

  // ===== DATE =====
  // Look for Bill Date or Due Date
  for (const line of lines) {
    if (/bill\s*date|invoice\s*date/i.test(line)) {
      txnDate = extractDate(line);
      if (txnDate) break;
    }
  }
  if (!txnDate) txnDate = extractDate(rawText);

  return {
    amount: amount || 0,
    merchant: merchant ? titleCase(merchant) : '',
    txnDate,
    note,
  };
}

module.exports = parseUtilityBill;
