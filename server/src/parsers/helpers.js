/**
 * helpers.js — Shared utilities for all parsers
 */

/**
 * ML Kit often misreads the ₹ symbol as a leading character (7, F, H, T, etc.).
 * This function strips that garbled prefix to extract the real amount.
 * Examples: "7366" → 366, "F47" → 47, "T402" → 402, "319" → 319
 */
function extractAmount(raw) {
  const s = raw.trim().replace(/,/g, '');

  // If it starts with a letter followed by digits, strip the letter (garbled ₹)
  const letterPrefix = s.match(/^[A-Za-z](\d{2,6}(?:\.\d{1,2})?)$/);
  if (letterPrefix) {
    return parseFloat(letterPrefix[1]);
  }

  // If it's all digits and the first char is '7' (most common ₹ misread),
  // strip it — but only if the remaining number is a reasonable amount (>= 10)
  if (/^\d+$/.test(s) && s.length >= 3 && s[0] === '7') {
    const stripped = parseFloat(s.substring(1));
    if (stripped >= 10) return stripped;
  }

  // Otherwise return as-is
  const m = s.match(/(\d+(?:\.\d{1,2})?)/);
  return m ? parseFloat(m[1]) : 0;
}

/**
 * Extract a date from OCR text. Supports many Indian date formats:
 *  - "6 Feb 2026", "06 February 2026"
 *  - "2026-02-06" (ISO)
 *  - "06/02/2026", "06-02-2026" (DD/MM/YYYY)
 *  - "19 Aug, 2025 • 09:31 PM"
 *  - "2 Aug 2026, 01:00 PM"
 * Returns YYYY-MM-DD or null.
 */
function extractDate(rawText) {
  const MONTHS = {
    jan: '01', january: '01',
    feb: '02', february: '02',
    mar: '03', march: '03',
    apr: '04', april: '04',
    may: '05',
    jun: '06', june: '06',
    jul: '07', july: '07',
    aug: '08', august: '08',
    sep: '09', september: '09',
    oct: '10', october: '10',
    nov: '11', november: '11',
    dec: '12', december: '12',
  };

  // "6 Feb 2026", "06 February 2026", "19 Aug, 2025", "2 Aug 2026, 01:00 PM"
  const namedMonth = rawText.match(/(\d{1,2})\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[,.]?\s+(\d{4})/i);
  if (namedMonth) {
    const day = namedMonth[1].padStart(2, '0');
    const month = MONTHS[namedMonth[2].toLowerCase()];
    const year = namedMonth[3];
    return `${year}-${month}-${day}`;
  }

  // ISO: "2026-02-06"
  const iso = rawText.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[0];

  // DD/MM/YYYY
  const slashed = rawText.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (slashed) return `${slashed[3]}-${slashed[2]}-${slashed[1]}`;

  // DD-MM-YYYY
  const dashed = rawText.match(/(\d{2})-(\d{2})-(\d{4})/);
  if (dashed) return `${dashed[3]}-${dashed[2]}-${dashed[1]}`;

  return null;
}

/**
 * Find the last standalone number in lines after a given index.
 * Used for garbled ₹ amounts from ML Kit.
 */
function findLastNumericLineAfter(lines, startIdx) {
  let lastNumLine = null;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (/^[A-Za-z]?\d{2,6}(?:\.\d{1,2})?$/.test(lines[i].trim())) {
      lastNumLine = lines[i].trim();
    }
  }
  return lastNumLine;
}

/**
 * Title-case a string: "neha jain" → "Neha Jain"
 */
function titleCase(str) {
  return str.replace(/\b\w/g, l => l.toUpperCase());
}

module.exports = { extractAmount, extractDate, findLastNumericLineAfter, titleCase };
