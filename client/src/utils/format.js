import i18n from '../i18n';

// Digits stay 0-9 in every language ("-u-nu-latn"); only month and day names change with the language.
const LOCALES = { en: 'en-IN', hi: 'hi-IN-u-nu-latn', te: 'te-IN-u-nu-latn' };
const locale = () => LOCALES[i18n.language] || LOCALES.en;

// Indian-style money: 2600000 -> "₹26,00,000"
export const inr = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

// Dates like "28 Oct 2026" / "28 अक्तू॰ 2026" / "28 అక్టో 2026"
export function fmtDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' });
}

// "28 Oct", for chart axes
export function fmtDay(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(locale(), { day: 'numeric', month: 'short' });
}

// "2026-10-28" for <input type="date">
export const toInputDate = (d = new Date()) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

export const num = (n) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 1 });

export const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
