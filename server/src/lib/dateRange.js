/**
 * dateRange.js — Shared helpers for "YYYY-MM" month query params.
 *
 * Filtering with `to_char(txn_date, 'YYYY-MM') = $1` forces Postgres to
 * compute to_char() for every row, which a plain btree index on the date
 * column cannot support. Passing the first-of-month as a date and filtering
 * with a half-open range (`>= start AND < start + 1 month`) can use the
 * index instead.
 */
const MONTH_FORMAT = /^\d{4}-\d{2}$/;

/** "2026-08" -> "2026-08-01", the value to bind as the range's lower bound. */
function monthStart(month) {
  return `${month}-01`;
}

module.exports = { MONTH_FORMAT, monthStart };
