/**
 * Generic Parser — fallback when no specific app is detected.
 *
 * Uses all the heuristics from the original monolithic parser:
 *   - "Paid to/by" merchant extraction
 *   - ₹ symbol or garbled amount extraction
 *   - Date in various formats
 *   - Best-effort merchant from first meaningful line
 */
const { extractAmount, extractDate, findLastNumericLineAfter, titleCase } = require('./helpers');

function parseGeneric(rawText, lines) {
  let amount = 0;
  let merchant = '';
  let txnDate = null;
  let note = null;

  // ===== AMOUNT =====

  // A1: Any ₹ amount in the text
  const rupeeAmounts = [...rawText.matchAll(/₹\s*([\d,]+(?:\.\d{1,2})?)/g)];
  if (rupeeAmounts.length > 0) {
    // Take the last one (usually the final total/paid amount)
    amount = parseFloat(rupeeAmounts[rupeeAmounts.length - 1][1].replace(/,/g, ''));
  }

  // A2: "Paid By" positional with garbled ₹
  if (!amount) {
    const paidByIdx = lines.findIndex(l => /paid\s*by/i.test(l));
    if (paidByIdx !== -1) {
      const inlineMatch = lines[paidByIdx].match(/(\d{2,6}(?:\.\d{1,2})?)\s*$/);
      if (inlineMatch) {
        amount = parseFloat(inlineMatch[1]);
      }
      if (!amount) {
        const lastNum = findLastNumericLineAfter(lines, paidByIdx);
        if (lastNum) amount = extractAmount(lastNum);
      }
    }
  }

  // A3: "To Pay" positional
  if (!amount) {
    const toPayIdx = lines.findIndex(l => /to\s*pay/i.test(l));
    if (toPayIdx !== -1) {
      for (let i = toPayIdx; i < Math.min(toPayIdx + 8, lines.length); i++) {
        const lineNums = [...lines[i].matchAll(/(\d{2,6}(?:\.\d{1,2})?)/g)];
        if (lineNums.length > 0) {
          const candidate = parseFloat(lineNums[lineNums.length - 1][1]);
          if (candidate > 0) amount = candidate;
        }
      }
    }
  }

  // A4: Last reasonable number in the text
  if (!amount) {
    const allNums = [...rawText.matchAll(/\b(\d{2,6}(?:\.\d{1,2})?)\b/g)]
      .map(m => parseFloat(m[1]))
      .filter(n => n >= 10);
    if (allNums.length > 0) {
      amount = allNums[allNums.length - 1];
    }
  }

  // ===== MERCHANT =====

  // M1: "Paid to <name>"
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/paid\s*to\s+([a-zA-Z][a-zA-Z\s.&'-]+)/i);
    if (m) {
      merchant = m[1].trim();
      break;
    }
    // "Paid to" on its own line
    if (/^paid\s*to$/i.test(line.trim())) {
      for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
        const nextL = lines[j].trim();
        if (nextL.length <= 2) continue;
        if (/transaction\s*successful/i.test(nextL)) continue;
        if (/^[0-9:]+\s*(am|pm)/i.test(nextL)) continue;
        if (/^[A-Za-z\s]+$/.test(nextL)) {
          merchant = nextL;
          break;
        }
      }
      break;
    }
  }

  // M2: "<Name> (N Items)"
  if (!merchant) {
    for (const line of lines) {
      const m = line.match(/^(.+?)\s*\(\s*\d+\s*items?\s*\)/i);
      if (m) {
        merchant = m[1].trim();
        break;
      }
    }
  }

  // M3: "from <merchant>"
  if (!merchant) {
    for (const line of lines) {
      const m = line.match(/(?:ordered?\s+from|delivered?\s+from|from)\s+([A-Za-z][A-Za-z\s.&'-]+)/i);
      if (m) {
        merchant = m[1].trim();
        break;
      }
    }
  }

  // M4: First meaningful line
  if (!merchant) {
    for (const line of lines) {
      const l = line.trim();
      if (/^\d{1,2}:\d{2}/.test(l)) continue;
      if (/order\s*summary/i.test(l)) continue;
      if (/^\d{3}/.test(l)) continue;
      if (/delivery|delivering|delivered/i.test(l)) continue;
      if (/CRN|help|greens|road|nagar/i.test(l)) continue;
      if (/payment\s*(info|details|successful)/i.test(l)) continue;
      if (/paid\s*(by|to)/i.test(l)) continue;
      if (/saving/i.test(l)) continue;
      if (/total|tax|charge|fee/i.test(l)) continue;
      if (/transaction/i.test(l)) continue;
      if (l.length < 3 || l.length > 60) continue;
      if (/^\d+$/.test(l)) continue;
      if (/^[A-Z\d]{1,2}\d{2,}/.test(l)) continue;
      merchant = l.replace(/\(\d+\s*items?\)/i, '').trim();
      break;
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

module.exports = parseGeneric;
