/**
 * PhonePe Parser
 *
 * PhonePe UPI success screenshots typically look like:
 *   Paid to
 *   Transaction Successful
 *   ii                              (or a checkmark garble)
 *   04:16 pm on 6 Feb 2026
 *   NEHA JAIN
 *   *******0087@ybl
 *   Banking Name : NEHA JAIN
 *   Payment Details
 *   Transaction ID
 *   T2602061616224696218762
 *   Debited from
 *   XXXXXX1751
 *   UTR: 518786941797
 *   ₹1,700                          (or garbled: 1700, 71700)
 *
 * Key signals:
 *   - "Paid to" header (sometimes on its own line)
 *   - "Transaction Successful"
 *   - UPI handle ending in @ybl
 *   - Amount is usually the last 1-2 lines, often standalone numbers
 */
const { extractAmount, extractDate, titleCase } = require('./helpers');

function parsePhonePe(rawText, lines) {
  let amount = 0;
  let merchant = '';
  let txnDate = null;
  let note = null;

  // ===== MERCHANT =====
  // PhonePe layout: "Paid to" is often on its own line.
  // The merchant name is a few lines below, after "Transaction Successful" and the timestamp.
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Case 1: "Paid to NEHA JAIN" on the same line
    const sameLineMatch = line.match(/paid\s*to\s+([a-zA-Z][a-zA-Z\s.&'-]+)/i);
    if (sameLineMatch) {
      merchant = sameLineMatch[1].trim();
      break;
    }

    // Case 2: "Paid to" on its own line → scan downward
    if (/^paid\s*to$/i.test(line)) {
      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        const nextLine = lines[j].trim();
        if (nextLine.length <= 2) continue;                                  // skip "ii" garble
        if (/transaction\s*successful/i.test(nextLine)) continue;            // skip status
        if (/^\d{1,2}:\d{2}\s*(am|pm)/i.test(nextLine)) continue;           // skip time
        if (/^(on\s+)?\d{1,2}\s+\w+\s+\d{4}/i.test(nextLine)) continue;    // skip date line
        if (/payment\s*details/i.test(nextLine)) break;                      // gone too far
        if (/^[*]+\d+@/i.test(nextLine)) continue;                          // skip masked UPI ID
        // First meaningful text line is the merchant name
        if (/^[A-Za-z]/.test(nextLine)) {
          merchant = nextLine;
          break;
        }
      }
      break;
    }
  }

  // Fallback: "Banking Name : <name>"
  if (!merchant) {
    for (const line of lines) {
      const m = line.match(/banking\s*name\s*:\s*(.+)/i);
      if (m) {
        merchant = m[1].trim();
        break;
      }
    }
  }

  // ===== AMOUNT =====
  // PhonePe: Amount is usually the last standalone number(s) at the bottom.
  // It may appear with ₹ symbol or without (garbled).

  // Try ₹ symbol first
  const rupeeAmounts = [...rawText.matchAll(/₹\s*([\d,]+(?:\.\d{1,2})?)/g)];
  if (rupeeAmounts.length > 0) {
    amount = parseFloat(rupeeAmounts[rupeeAmounts.length - 1][1].replace(/,/g, ''));
  }

  // If no ₹ found, take the last standalone number lines
  if (!amount) {
    const numericLines = [];
    for (let i = lines.length - 1; i >= 0; i--) {
      const l = lines[i].trim();
      if (/^[A-Za-z]?\d{2,8}(?:\.\d{1,2})?$/.test(l)) {
        numericLines.unshift(l);
      } else if (numericLines.length > 0) {
        break; // Stop once we hit a non-numeric line after collecting some
      }
    }

    if (numericLines.length > 0) {
      // Take the last one (they're often duplicated, e.g. "1700\n1700")
      amount = extractAmount(numericLines[numericLines.length - 1]);
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

module.exports = parsePhonePe;
