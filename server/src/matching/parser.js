// Text helpers for the matcher: clean up, split into parts, find quantity and unit.
// Everything here is plain rules, so results are the same every time.

const DEVANAGARI_DIGITS = '०१२३४५६७८९';
const TELUGU_DIGITS = '౦౧౨౩౪౫౬౭౮౯';

const NUMBER_WORDS = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, once: 1, twice: 2,
  एक: 1, दो: 2, तीन: 3, चार: 4, पांच: 5, पाँच: 5, छह: 6, सात: 7, आठ: 8, नौ: 9, दस: 10,
};

// 1. Normalise: lowercase, native digits -> 0-9, number words -> digits.
export function normalise(text) {
  let t = String(text).toLowerCase();
  t = t.replace(/[०-९]/g, (c) => DEVANAGARI_DIGITS.indexOf(c));
  t = t.replace(/[౦-౯]/g, (c) => TELUGU_DIGITS.indexOf(c));
  t = t.replace(/(\d),(\d{3})/g, '$1$2'); // 1,200 -> 1200
  t = t.replace(/(\d)\s*(?:m3|m³)(?![a-z0-9])/g, '$1 cu m'); // 30 m3 -> 30 cu m
  t = t.replace(/[\p{L}\p{M}]+/gu, (w) => (w in NUMBER_WORDS ? String(NUMBER_WORDS[w]) : w));
  return t.replace(/\s+/g, ' ').trim();
}

// 2. Split into parts at commas, "and", "then", "also", full stops and their Hindi/Telugu forms.
const SPLITTER = /\s*[,;।]\s*|\s*\.(?=\s|$)\s*|\s+(?:and|then|also|plus|और|तथा|फिर|మరియు|ఆ తర్వాత)\s+/u;
export function splitParts(text) {
  return text.split(SPLITTER).map((p) => p.trim()).filter(Boolean);
}

// Words that mean "this material was used up".
const USE_WORDS = /(?:^|[^a-z])(?:used|use|consumed|utili[sz]ed|utili[sz]ing)(?![a-z])|(?:^|\s)(?:लगा|लगी|लगीं|लगे|इस्तेमाल|वाड़ा)(?=\s|$)|వాడాము|ఉపయోగించాము|వాడిన|ఉపయోగించిన/u;
export const hasUseWord = (part) => USE_WORDS.test(part);

// Words that show "meter" means an electric meter that was fitted, not a length.
const INSTALL_WORDS = /install|fix|fit|energy|connect|बिठा|लगाए|लगाया|బిగించ|ఇచ్చి|అమర్చ/u;
const LENGTH_THINGS = /^(?:of\b|ka\b|की\b|యొక్క)|^\s*(?:wire|cable|pipe|line|canal|road|cu\b)/u;

// Unit table. `re` must match at the start of the text that follows a number.
// Order matters: longer units first.
const UNIT_TABLE = [
  { unit: 'cu m', re: /^(?:cu\.?\s?m(?![a-z])|cum(?![a-z])|cubic\s*met(?:re|er)s?|घन\s*मीटर|క్యూబిక్\s*మీటర్)/u },
  { unit: 'bags', re: /^(?:bags?(?![a-z])|bori|बोरी|बोरे|బస్తా)/u },
  { unit: 'kg', re: /^(?:kgs?(?![a-z])|kilos?(?![a-z])|kilograms?|किलो|కిలో)/u },
  { unit: '%', re: /^(?:%|percent|per\s?cent|प्रतिशत|శాతం)/u },
  { unit: 'houses', re: /^(?:houses?(?![a-z])|homes?(?![a-z])|घर|ఇళ్ల|ఇళ్ళ|ఇల్లు|ఇంటి)/u },
  { unit: 'nos', re: /^energy\s*met(?:re|er)s?(?![a-z])/u }, // "2 energy meters" is always a count
  { unit: 'meter?', re: /^(?:met(?:re|er)s?(?![a-z])|mtrs?(?![a-z])|मीटर|మీటర్)/u },
  { unit: 'm', re: /^m(?![a-z])/u },
  {
    unit: 'nos',
    re: /^(?:nos?\.?(?![a-z])|numbers?(?![a-z])|pcs(?![a-z])|pieces?(?![a-z])|units?(?![a-z])|(?:poles?|columns?|culverts?|gates?|pumps?|transformers?|bricks?|connections?|doors?|windows?|tanks?)(?![a-z])|खंभे|खंभा|कॉलम|ईंट|ईंटें|స్తంభాల|స్తంభం|కాలమ్|ఇటుక|కనెక్షన్|గేట్|గేటు)/u,
  },
];

// Numbers followed by these words are not quantities of work (e.g. "10 workers").
const IGNORED_AFTER_NUMBER = /^(?:days?|hours?|hrs?|workers?|labou?rers?|people|persons?|men|masons?|women|am|pm|मजदूर|కూలీలు)(?![a-z])/u;

// 3. Find the quantity and unit in one part.
// `projectHasMeters` says whether this project has an energy-meter task or material.
// Returns { quantity, unit, hasUnit, hasNumber }.
export function extractQuantity(part, { projectHasMeters = false } = {}) {
  const numbers = [...part.matchAll(/\d+(?:\.\d+)?/g)];
  let firstPlain = null;
  for (const n of numbers) {
    const after = part.slice(n.index + n[0].length).replace(/^\s*(?:-\s*)?/, '');
    if (IGNORED_AFTER_NUMBER.test(after)) continue;
    const quantity = parseFloat(n[0]);
    if (firstPlain === null) firstPlain = quantity;
    for (const { unit, re } of UNIT_TABLE) {
      const m = after.replace(/^of\s+/, '').match(re);
      if (!m) continue;
      if (unit === 'meter?') {
        // "meter" can be a length (metre) or an energy meter. Decide from nearby words.
        const rest = after.slice(m[0].length);
        const isDevice = !LENGTH_THINGS.test(rest) && projectHasMeters && INSTALL_WORDS.test(part);
        return { quantity, unit: isDevice ? 'nos' : 'm', hasUnit: true, hasNumber: true };
      }
      return { quantity, unit, hasUnit: true, hasNumber: true };
    }
  }
  if (firstPlain !== null) {
    return { quantity: firstPlain, unit: '', hasUnit: false, hasNumber: true };
  }
  return { quantity: 0, unit: '', hasUnit: false, hasNumber: false };
}

// How well does the unit we found fit the task's unit?
// 1 = fits, 0.6 = countable things that can be swapped (nos / houses), 0.5 = no unit found, 0 = conflict.
export function unitFit(found, wanted) {
  if (!found) return 0.5;
  if (found === wanted) return 1;
  if ((found === 'nos' && wanted === 'houses') || (found === 'houses' && wanted === 'nos')) return 0.6;
  return 0;
}
