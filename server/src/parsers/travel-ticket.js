/**
 * Travel Ticket Parser
 * Targets: IRCTC, Flights (MakeMyTrip, Indigo, Goibibo)
 */
const { extractAmount, extractDate, titleCase } = require('./helpers');

function parseTravelTicket(rawText, lines) {
  let amount = 0;
  let merchant = 'Travel Ticket';
  let txnDate = extractDate(rawText);
  let note = 'Travel Booking';

  // ===== MERCHANT =====
  // Usually top line or specific keywords
  for (const line of lines) {
    const l = line.trim();
    if (/(irctc|makemytrip|goibibo|yatra|indigo|air\s*india|spicejet|vistara|akasa)/i.test(l)) {
      merchant = l;
      break;
    }
  }

  // ===== AMOUNT =====
  // Look for "Total Fare", "Convenience Fee + Fare"
  const totalKeywords = [/total\s*fare/i, /grand\s*total/i, /total\s*amount/i, /amount\s*paid/i];
  
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

module.exports = parseTravelTicket;
