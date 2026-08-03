/**
 * Paytm Parser
 *
 * Paytm UPI success screenshots typically look like:
 *   Payment Successful   OR   Money Sent Successfully
 *   ₹500.00
 *   <Recipient Name>
 *   <recipient>@paytm
 *   11 Sep 2023, 6:59 PM
 *   UPI Reference No. 423456789012
 *   Bank of Baroda XXXXX1234
 *
 * Key signals:
 *   - "Payment Successful" or "Money Sent Successfully"
 *   - UPI handles ending in @paytm
 *   - "UPI Reference No." label
 *   - Amount usually appears prominently with ₹
 */
const { extractAmount, extractDate, titleCase } = require('./helpers');

function parsePaytm(rawText, lines) {
  let amount = 0;
  let merchant = '';
  let txnDate = null;
  let note = null;

  // ===== AMOUNT =====
  // Paytm: Amount usually appears with ₹ near the top, right after the success message
  const rupeeAmounts = [...rawText.matchAll(/₹\s*([\d,]+(?:\.\d{1,2})?)/g)];
  if (rupeeAmounts.length > 0) {
    // Take the first ₹ amount (it's the main payment amount)
    amount = parseFloat(rupeeAmounts[0][1].replace(/,/g, ''));
  }

  // Fallback: standalone numbers near "Payment Successful"
  if (!amount) {
    for (let i = 0; i < lines.length; i++) {
      if (/payment\s*successful|money\s*sent/i.test(lines[i])) {
        for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
          if (/^[A-Za-z]?\d{2,8}(?:\.\d{1,2})?$/.test(lines[j].trim())) {
            amount = extractAmount(lines[j].trim());
            break;
          }
        }
        break;
      }
    }
  }

  // ===== MERCHANT =====
  // Paytm: Name appears after the amount, before the UPI ID
  for (let i = 0; i < lines.length; i++) {
    if (/payment\s*successful|money\s*sent/i.test(lines[i])) {
      for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
        const line = lines[j].trim();
        // Skip amount lines
        if (/^₹/.test(line)) continue;
        if (/^[A-Za-z]?\d+(?:\.\d+)?$/.test(line)) continue;
        // Skip UPI IDs
        if (/@\w+/i.test(line)) continue;
        // Skip date lines
        if (/\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(line)) continue;
        // Skip reference labels
        if (/upi\s*ref|reference/i.test(line)) break;
        if (/order\s*id|txn\s*id/i.test(line)) break;
        // This should be the merchant/recipient name
        if (line.length >= 2 && /^[A-Za-z]/.test(line)) {
          merchant = line;
          break;
        }
      }
      break;
    }
  }

  // Fallback: "Paid to <name>"
  if (!merchant) {
    for (const line of lines) {
      const m = line.match(/paid\s*to\s+([a-zA-Z][a-zA-Z\s.&'-]+)/i);
      if (m) {
        merchant = m[1].trim();
        break;
      }
    }
  }

  // ===== DATE =====
  txnDate = extractDate(rawText);

  return {
    amount: amount || 0,
    merchant: merchant ? titleCase(merchant) : '',
    txnDate,
    note,
  };
}

module.exports = parsePaytm;
