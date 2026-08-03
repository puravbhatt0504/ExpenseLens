/**
 * Google Pay (GPay) Parser
 *
 * GPay UPI success screenshots typically look like:
 *   Payment successful
 *   ₹500
 *   <Recipient Name>
 *   <recipient>@okicici
 *   19 Aug, 2025 • 09:31 PM
 *   UPI transaction ID
 *   423456789012
 *   Paid by
 *   State Bank of India XXXX
 *
 * Key signals:
 *   - "Payment successful" (NOT "Transaction Successful" — that's PhonePe)
 *   - Amount appears right after "Payment successful", often with ₹
 *   - UPI handles use @ok* (e.g., @okicici, @oksbi, @okhdfcbank)
 *   - "UPI transaction ID" label
 *   - "Paid by <Bank Name>"
 */
const { extractAmount, extractDate, titleCase } = require('./helpers');

function parseGPay(rawText, lines) {
  let amount = 0;
  let merchant = '';
  let txnDate = null;
  let note = null;

  // ===== AMOUNT =====
  // GPay: Amount is usually right after "Payment successful", often "₹500" or "₹1,500"
  for (let i = 0; i < lines.length; i++) {
    if (/payment\s*successful/i.test(lines[i])) {
      // Check the next few lines for the amount
      for (let j = i; j < Math.min(i + 3, lines.length); j++) {
        const rupeeMatch = lines[j].match(/₹\s*([\d,]+(?:\.\d{1,2})?)/);
        if (rupeeMatch) {
          amount = parseFloat(rupeeMatch[1].replace(/,/g, ''));
          break;
        }
        // Garbled: standalone number right after "Payment successful"
        if (j > i && /^[A-Za-z]?\d{2,8}(?:\.\d{1,2})?$/.test(lines[j].trim())) {
          amount = extractAmount(lines[j].trim());
          break;
        }
      }
      break;
    }
  }

  // Fallback: any ₹ amount in the text
  if (!amount) {
    const rupeeAmounts = [...rawText.matchAll(/₹\s*([\d,]+(?:\.\d{1,2})?)/g)];
    if (rupeeAmounts.length > 0) {
      amount = parseFloat(rupeeAmounts[0][1].replace(/,/g, ''));
    }
  }

  // ===== MERCHANT =====
  // GPay: The recipient name is typically 1-2 lines after the amount, before the UPI ID
  // Find "Payment successful" line, then skip amount line, next text line is the merchant
  for (let i = 0; i < lines.length; i++) {
    if (/payment\s*successful/i.test(lines[i])) {
      for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
        const line = lines[j].trim();
        // Skip amount lines (₹ or pure numbers)
        if (/^₹/.test(line)) continue;
        if (/^[A-Za-z]?\d+(?:\.\d+)?$/.test(line)) continue;
        // Skip UPI IDs
        if (/@\w+/i.test(line)) continue;
        // Skip date lines
        if (/\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(line)) continue;
        // Skip UPI transaction labels
        if (/upi\s*transaction/i.test(line)) break;
        // This should be the merchant name
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

module.exports = parseGPay;
