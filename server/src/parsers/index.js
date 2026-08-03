/**
 * parsers/index.js — App-Specific Regex Router
 *
 * Instead of running one giant generic parser, we first detect which app
 * the screenshot came from, then route to a specialised parser that knows
 * exactly where to find the amount, merchant, and date for that app.
 *
 * If no app is detected, we fall back to a generic parser.
 */

const parsePhonePe = require('./phonepe');
const parseGPay = require('./gpay');
const parsePaytm = require('./paytm');
const parseFoodDelivery = require('./food-delivery');
const parsePosReceipt = require('./pos-receipt');
const parseRetailInvoice = require('./retail-invoice');
const parseUtilityBill = require('./utility-bill');
const parseFuelReceipt = require('./fuel-receipt');
const parseEcommerceInvoice = require('./ecommerce-invoice');
const parseTravelTicket = require('./travel-ticket');
const parseGeneric = require('./generic');

// Each detector returns { detected: boolean, parser: fn }
const APP_DETECTORS = [
  // Utility Bills
  {
    name: 'Utility_Bill',
    detect: (text) => /bill\s*of\s*supply/i.test(text) || /consumer\s*no/i.test(text) || /bescom|mahavitaran|adani\s*electricity|airtel\s*broadband/i.test(text),
    parser: parseUtilityBill,
  },
  // Fuel Receipts
  {
    name: 'Fuel_Receipt',
    detect: (text) => /pump\s*no/i.test(text) || /nozzle\s*no/i.test(text) || /indianoil|bharat\s*petroleum|hpcl|shell/i.test(text),
    parser: parseFuelReceipt,
  },
  // E-commerce Invoices
  {
    name: 'Ecommerce_Invoice',
    detect: (text) => /(sold\s*by|seller)\s*:/i.test(text) && /shipped\s*to/i.test(text),
    parser: parseEcommerceInvoice,
  },
  // Travel Tickets
  {
    name: 'Travel_Ticket',
    detect: (text) => /pnr|flight\s*no|e-ticket/i.test(text) || /irctc|makemytrip|indigo|goibibo/i.test(text),
    parser: parseTravelTicket,
  },
  // Retail / Supermarket Invoices
  {
    name: 'Retail_Invoice',
    detect: (text) => /retail\s*invoice/i.test(text) || /cash\s*memo/i.test(text) || /tax\s*invoice/i.test(text) || /gstin\s*:/i.test(text),
    parser: parseRetailInvoice,
  },
  // POS Receipts
  {
    name: 'POS_Receipt',
    detect: (text) => /order\s*receipt/i.test(text) || (/total\s*pa[il]d/i.test(text) && /sgst|cgst/i.test(text)),
    parser: parsePosReceipt,
  },
  // Food delivery MUST come first because these screenshots often mention
  // UPI apps (e.g., "Paid By PhonePe") as the payment method.
  {
    name: 'FoodDelivery',
    detect: (text) => /swiggy|zomato|oven\s*story|domino|order\s*summary/i.test(text) || (/\d+\s*items?\s*\)/i.test(text) && /to\s*pay/i.test(text)),
    parser: parseFoodDelivery,
  },
  {
    name: 'PhonePe',
    detect: (text) => /phonepe|phone\s*pe/i.test(text) || (/paid\s*to/i.test(text) && /transaction\s*successful/i.test(text) && /@ybl/i.test(text)),
    parser: parsePhonePe,
  },
  {
    name: 'GPay',
    detect: (text) => /google\s*pay|gpay/i.test(text) || (/payment\s*successful/i.test(text) && /upi\s*transaction\s*id/i.test(text)),
    parser: parseGPay,
  },
  {
    name: 'Paytm',
    detect: (text) => /paytm/i.test(text) || (/money\s*sent\s*successfully/i.test(text) && /@paytm/i.test(text)),
    parser: parsePaytm,
  },
];

/**
 * Route the raw text to the best app-specific parser.
 * @param {string} rawText - Pre-processed OCR text (commas already stripped from numbers)
 * @param {string[]} lines  - Non-empty trimmed lines
 * @returns {{ app: string, amount: number, merchant: string, txnDate: string|null, note: string|null }}
 */
function routeParser(rawText, lines) {
  for (const { name, detect, parser } of APP_DETECTORS) {
    if (detect(rawText)) {
      console.log(`[parser-router] Detected app: ${name}`);
      const result = parser(rawText, lines);
      return { app: name, ...result };
    }
  }

  console.log('[parser-router] No specific app detected, using generic parser');
  const result = parseGeneric(rawText, lines);
  return { app: 'Generic', ...result };
}

module.exports = { routeParser };
