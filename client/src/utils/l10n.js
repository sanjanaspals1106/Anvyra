// Shows data from the database in the chosen language.
//  - names of projects, tasks and materials: Hindi / Telugu name if there is one, else the English name
//  - units (bags, nos, cu m...) and statuses go through i18n keys
//  - text the server writes in English (matcher warnings, reasons, activity lines) is mapped to i18n keys
// Everything falls back to the English text, so nothing is ever blank.
import i18n from '../i18n';
import { fmtDate, num } from './format';

const t = (key, opts) => i18n.t(key, opts);

// ---------------------------------------------------------------- names
let NAMES = {}; // English name -> { hi, te }
let DESCRIPTIONS = {};
export function setNames({ names = {}, descriptions = {} } = {}) {
  NAMES = names;
  DESCRIPTIONS = descriptions;
}
const pick = (table, english) => {
  if (!english) return english;
  const lng = i18n.language;
  return (lng !== 'en' && table[english]?.[lng]) || english;
};
export const L = (english) => pick(NAMES, english);
export const Ldesc = (english) => pick(DESCRIPTIONS, english);

// ---------------------------------------------------------------- units
const UNIT_KEYS = { '%': 'percent', 'cu m': 'cum', m: 'm', kg: 'kg', nos: 'nos', bags: 'bags', houses: 'houses' };
export const unitName = (unit) => (UNIT_KEYS[unit] ? t(`units.${UNIT_KEYS[unit]}`, { defaultValue: unit }) : unit);

// ---------------------------------------------------------------- server messages
// Each rule: a pattern for the English text the server wrote, the i18n key, and how to fill in the blanks.
const WARNINGS = [
  [/^No matching (task|material) found\. Please choose one\.$/, 'srv.noMatch', (m) => ({ kind: t(`srv.kind.${m[1]}`) })],
  [/^No quantity found in this part\.$/, 'srv.noQuantity'],
  [/^No unit written, please check the quantity\.$/, 'srv.noUnit'],
  [/^(.+?): ([\d.,]+) (.+?) would be more than the planned ([\d.,]+) (.+)\.$/, 'srv.overPlanned',
    (m) => ({ name: L(m[1]), total: m[2], unit: unitName(m[3]), planned: m[4] })],
  [/^(.+?): ([\d.,]+) (.+?) used is more than the stock of ([\d.,]+) (.+)\.$/, 'srv.overStock',
    (m) => ({ name: L(m[1]), qty: m[2], unit: unitName(m[3]), stock: m[4] })],
  [/^Looks like "(.+)", which is already complete\.$/, 'srv.alreadyComplete', (m) => ({ name: L(m[1]) })],
  [/^Could not translate this update\. Please read the original text\.$/, 'srv.translateFailed'],
  [/^Nothing about the project work was understood in this text\.$/, 'srv.nothingUnderstood'],
];
const REASONS = [
  [/^meaning ([\d.]+)$/, 'srv.reason.meaning', (m) => ({ n: m[1] })],
  [/^words: (.+)$/, 'srv.reason.words', (m) => ({ words: m[1] })],
  [/^unit not written$/, 'srv.reason.unitMissing'],
  [/^unit matches \((.+)\)$/, 'srv.reason.unitMatch', (m) => ({ unit: unitName(m[1]) })],
  [/^unit close \((.+) ~ (.+)\)$/, 'srv.reason.unitClose', (m) => ({ a: unitName(m[1]), b: unitName(m[2]) })],
  [/^unit differs \((.+) vs (.+)\)$/, 'srv.reason.unitDiffers', (m) => ({ a: unitName(m[1]), b: unitName(m[2]) })],
  [/^already complete$/, 'srv.reason.complete'],
  [/^spelling fixed: (.+)$/, 'srv.reason.spelling', (m) => ({ words: m[1] })],
  [/^no matching (task|material) found$/, 'srv.reason.noMatch', (m) => ({ kind: t(`srv.kind.${m[1]}`) })],
  [/^demo history$/, 'srv.reason.demo'],
];
const ACTIVITY = [
  [/^([\d.,]+) (cu m|bags|kg|nos|houses|m|%) (.+) received$/, 'srv.activity.received', (m) => ({ qty: m[1], unit: unitName(m[2]), name: L(m[3]) })],
  [/^Rs ([\d.,]+)( - .*)?$/, null, (m) => `₹${m[1]}${m[2] || ''}`],
  [/^(.+) replaced by (.+)$/, 'srv.activity.replaced', (m) => ({ old: m[1], next: m[2] })],
  [/^(.+) is now the supervisor$/, 'srv.activity.nowSupervisor', (m) => ({ name: m[1] })],
  [/^(.+) added as supervisor$/, 'srv.activity.added', (m) => ({ name: m[1] })],
];

function mapText(rules, text) {
  if (!text || i18n.language === 'en') return text;
  for (const [re, key, params] of rules) {
    const m = text.match(re);
    if (m && !key) return params(m);
    if (m) return t(key, { ...(params ? params(m) : {}), defaultValue: text });
  }
  return text;
}
export const warningText = (s) => mapText(WARNINGS, s);
export const reasonText = (s) => mapText(REASONS, s);
export const activityText = (s) => mapText(ACTIVITY, s);

// Message for an API error: translated by its code, else the server's English text.
export function messageForError(data, fallback) {
  if (data?.code && i18n.exists(`apiErrors.${data.code}`)) {
    return t(`apiErrors.${data.code}`, { ...(data.params || {}), defaultValue: data.error });
  }
  return data?.error || fallback;
}

export { fmtDate, num };
