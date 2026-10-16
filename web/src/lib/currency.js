'use client';
import useSWR from 'swr';
import { fetcher } from './api';

/**
 * Display currency. Amounts are stored as plain numbers and never converted —
 * this only decides the symbol and digit grouping used to render them.
 */
export const CURRENCIES = {
  INR: { symbol: '₹', locale: 'en-IN' },
  PHP: { symbol: '₱', locale: 'en-PH' },
};

export const DEFAULT_CURRENCY = 'INR';

export function currencySymbol(code) {
  return (CURRENCIES[code] || CURRENCIES[DEFAULT_CURRENCY]).symbol;
}

/**
 * formatMoney(1234.5, 'PHP')              → "₱1,234.50"
 * formatMoney(1234.5, 'INR')              → "₹1,234.50"
 * formatMoney(1234.5, 'INR', { decimals: 0 }) → "₹1,235"
 * formatMoney(null, 'INR')                → "₹0.00"
 */
export function formatMoney(amount, code, { decimals = 2 } = {}) {
  const { symbol, locale } = CURRENCIES[code] || CURRENCIES[DEFAULT_CURRENCY];
  const n = Number(amount);
  return `${symbol}${(Number.isFinite(n) ? n : 0).toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/**
 * The user's selected currency. SWR dedupes `/auth/me`, so every component
 * calling this shares one request.
 *
 *   const { code, symbol, format } = useCurrency();
 *   format(1234.5)            → "₱1,234.50"
 *   format(1234.5, 0)         → "₱1,235"
 */
export function useCurrency() {
  const { data } = useSWR('/auth/me', fetcher);
  const code = data?.user?.currency || DEFAULT_CURRENCY;
  return {
    code,
    symbol: currencySymbol(code),
    format: (amount, decimals = 2) => formatMoney(amount, code, { decimals }),
  };
}
