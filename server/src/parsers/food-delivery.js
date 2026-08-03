/**
 * Food Delivery Parser (Swiggy, Zomato, Oven Story, Domino's, etc.)
 *
 * Food delivery order screenshots typically look like:
 *   Order Summary
 *   <address>
 *   <Restaurant Name> (N Items)
 *   <Item 1>
 *   <Item 2>
 *   Order Total (Excl.Taxes)      ₹319
 *   Taxes & Charges               ₹47
 *   Delivery Fees                 Free
 *   To Pay (Incl. Taxes)          ₹366
 *   Payment Info
 *   Paid By PhonePe               ₹366
 *
 * Key signals:
 *   - "Order Summary"
 *   - "<Name> (N Items)"
 *   - "To Pay" / "Paid By" labels
 *   - Food item names (pizza, chicken, biryani, etc.)
 *
 * ML Kit quirks on these:
 *   - The left column (labels) and right column (prices) are read separately
 *   - ₹ is garbled as 7/F/H/T
 *   - Prices appear as standalone lines like "7366", "F47", "T402"
 */
const { extractAmount, extractDate, findLastNumericLineAfter, titleCase } = require('./helpers');

function parseFoodDelivery(rawText, lines) {
  let amount = 0;
  let merchant = '';
  let txnDate = null;
  let note = null;

  // ===== MERCHANT =====
  // Strategy 1: "<Name> (N Items)" pattern
  for (const line of lines) {
    const m = line.match(/^(.+?)\s*\(\s*\d+\s*items?\s*\)/i);
    if (m) {
      merchant = m[1].trim();
      break;
    }
  }

  // Strategy 2: Known brand detection
  if (!merchant) {
    const brands = [
      { pattern: /oven\s*story/i, name: 'Oven Story' },
      { pattern: /domino/i, name: "Domino's" },
      { pattern: /pizza\s*hut/i, name: 'Pizza Hut' },
      { pattern: /mcdonald/i, name: "McDonald's" },
      { pattern: /burger\s*king/i, name: 'Burger King' },
      { pattern: /kfc/i, name: 'KFC' },
      { pattern: /subway/i, name: 'Subway' },
      { pattern: /haldiram/i, name: "Haldiram's" },
      { pattern: /behrouz/i, name: 'Behrouz Biryani' },
      { pattern: /faasos/i, name: 'Faasos' },
      { pattern: /box8/i, name: 'Box8' },
      { pattern: /wow\s*momo/i, name: 'Wow! Momo' },
    ];
    for (const brand of brands) {
      if (brand.pattern.test(rawText)) {
        merchant = brand.name;
        break;
      }
    }
  }

  // Strategy 3: "from <restaurant>"
  if (!merchant) {
    for (const line of lines) {
      const m = line.match(/(?:ordered?\s+from|delivered?\s+from|from)\s+([A-Za-z][A-Za-z\s.&'-]+)/i);
      if (m) {
        merchant = m[1].trim();
        break;
      }
    }
  }

  // ===== AMOUNT =====
  // Priority 1: "Paid By" line with ₹ amount
  const paidByRupee = rawText.match(/paid\s*by\s*[|\s]*\w+.*?₹\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (paidByRupee) {
    amount = parseFloat(paidByRupee[1].replace(/,/g, ''));
  }

  // Priority 2: "To Pay" line with ₹ amount (take the LAST ₹ on that line)
  if (!amount) {
    const toPayLine = lines.find(l => /to\s*pay/i.test(l));
    if (toPayLine) {
      const amountsOnLine = [...toPayLine.matchAll(/₹\s*([\d,]+(?:\.\d{1,2})?)/g)];
      if (amountsOnLine.length > 0) {
        amount = parseFloat(amountsOnLine[amountsOnLine.length - 1][1].replace(/,/g, ''));
      }
    }
  }

  // Priority 3: Garbled ₹ — find "Paid By" line and take last numeric line after it
  if (!amount) {
    const paidByIdx = lines.findIndex(l => /paid\s*by/i.test(l));
    if (paidByIdx !== -1) {
      // Check inline amount on "Paid By" line
      const inlineMatch = lines[paidByIdx].match(/(\d{2,6}(?:\.\d{1,2})?)\s*$/);
      if (inlineMatch) {
        amount = parseFloat(inlineMatch[1]);
      }

      // Otherwise get the last standalone numeric line after "Paid By"
      if (!amount) {
        const lastNum = findLastNumericLineAfter(lines, paidByIdx);
        if (lastNum) {
          amount = extractAmount(lastNum);
        }
      }
    }
  }

  // Priority 4: "To Pay" positional — look for amounts near it
  if (!amount) {
    const toPayIdx = lines.findIndex(l => /to\s*pay/i.test(l));
    if (toPayIdx !== -1) {
      for (let i = toPayIdx; i < Math.min(toPayIdx + 8, lines.length); i++) {
        const lineNums = [...lines[i].matchAll(/(\d{2,6}(?:\.\d{1,2})?)/g)];
        if (lineNums.length > 0) {
          const candidate = parseFloat(lineNums[lineNums.length - 1][1]);
          if (candidate > 0) {
            amount = candidate;
          }
        }
      }
    }
  }

  // ===== DATE =====
  txnDate = extractDate(rawText);

  // ===== NOTE (item descriptions) =====
  const foodKeywords = /pizza|chicken|burger|biryani|noodle|rice|paneer|dal|curry|sandwich|wrap|roll|fries|drink|coke|pepsi|momo|veg|non.?veg|masala|tikka|tandoori|garlic\s*bread|pasta/i;
  const itemLines = lines.filter(l => {
    return !(/(total|tax|charge|fee|saving|pay|delivery|order summary|payment|help|crn)/i.test(l))
      && !(/^\d/.test(l))
      && l.length > 10
      && foodKeywords.test(l);
  });
  if (itemLines.length > 0) {
    note = [...new Set(itemLines.map(l => l.replace(/[·•]/g, '').trim()))].join(', ');
  }

  return {
    amount: amount || 0,
    merchant: merchant ? titleCase(merchant) : '',
    txnDate,
    note,
  };
}

module.exports = parseFoodDelivery;
