// Scores how well one part of an update matches a task or material.
//   score = 50% meaning + 30% keywords + 20% unit
// Each candidate also gets plain-English reasons so the officer can see why.

import Fuse from 'fuse.js';
import { meaningScores } from './embeddings.js';
import { unitFit } from './parser.js';

export const WEIGHTS = { meaning: 0.5, keywords: 0.3, unit: 0.2 };

const isLatin = (s) => /^[\x00-\x7f]+$/.test(s);
const words = (s) => s.match(/[a-z]+/g) || [];

// Keyword hits for one candidate. Returns { score 0-1, hits: [keyword, ...] }.
// English keywords use fuse.js so small spelling mistakes still count ("colums", "exavation").
// Hindi/Telugu keywords are matched as plain text (with the word ending allowed to change).
export function keywordScore(part, keywords) {
  const tokens = words(part).map((w) => (w.length > 4 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w));
  const grams = new Set(tokens);
  for (let i = 0; i < tokens.length - 1; i++) grams.add(`${tokens[i]} ${tokens[i + 1]}`);

  const latinKeywords = [...new Set(keywords.filter(isLatin).map((k) => k.toLowerCase()))];
  const fuse = new Fuse(latinKeywords, { includeScore: true, threshold: 0.3, ignoreLocation: true });

  const strengths = new Map(); // keyword -> 0..1
  for (const kw of latinKeywords) {
    if (kw.includes(' ') && part.includes(kw)) strengths.set(kw, 1);
  }
  for (const gram of grams) {
    if (gram.includes(' ')) continue;
    if (latinKeywords.includes(gram)) {
      strengths.set(gram, 1);
    } else if (gram.length >= 5) {
      // Misspellings: only for words of 5+ letters, so "tank" never matches "bank".
      for (const r of fuse.search(gram)) {
        const kw = r.item;
        if (kw.includes(' ') || kw.length < 5) continue;
        strengths.set(kw, Math.max(strengths.get(kw) || 0, 1 - r.score));
      }
    }
  }
  for (const kw of keywords.filter((k) => !isLatin(k))) {
    const stem = kw.slice(0, Math.max(3, kw.length - 2));
    if (part.includes(kw)) strengths.set(kw, 1);
    else if (part.includes(stem)) strengths.set(kw, 0.8);
  }

  const found = [...strengths.entries()].sort((a, b) => b[1] - a[1]);
  if (!found.length) return { score: 0, hits: [] };
  // One good keyword is already a strong sign; more of them add a little.
  const score = Math.min(1, found[0][1] + 0.1 * (found.length - 1));
  return { score, hits: found.map(([k]) => k) };
}

// Words we must never "correct" (units, numbers, everyday words).
const PROTECTED = new Set(['metre', 'metres', 'meter', 'meters', 'cubic', 'kilos', 'bags', 'numbers', 'pieces', 'houses', 'today', 'yesterday', 'near', 'along', 'from', 'with', 'done', 'finished', 'completed']);

// Fixes small spelling mistakes by replacing a word with the closest project keyword
// ("colums" -> "columns", "exavation" -> "excavation"). Returns { text, fixes: ["colums -> columns"] }.
export function fixSpelling(part, vocabulary) {
  const known = new Set(vocabulary);
  const fuse = new Fuse(vocabulary, { includeScore: true, threshold: 0.25, ignoreLocation: true });
  const fixes = [];
  const text = part.replace(/[a-z]{5,}/g, (w) => {
    if (known.has(w) || PROTECTED.has(w) || known.has(w.replace(/s$/, ''))) return w;
    const best = fuse.search(w)[0];
    if (!best) return w;
    fixes.push(`${w} -> ${best.item}`);
    return best.item;
  });
  return { text, fixes };
}

// Text with numbers and unit words removed, so the meaning score is about the *work*.
export function meaningText(part, ignoreWords = [], unit = '') {
  const ignore = new RegExp(`\\b(?:${ignoreWords.join('|') || '(?!)'})\\b`, 'g');
  return part
    .replace(ignore, ' ')
    .replace(/\d+(?:\.\d+)?/g, ' ')
    .replace(/\b(?:cu m|cum|bags?|kgs?|kilos?|nos|metres?|mtrs?|m|percent)\b|%/g, ' ')
    .replace(unit === 'm' ? /\bmeters?\b/g : /(?!)/g, ' ') // "meters" is a unit only when it is a length
    .replace(/\b(?:the|a|an|of|in|on|at|to|for|from|with|by|is|was|were|are|today|more|about|near)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// What the part's meaning is compared with: the name, and the name plus English keywords.
const targetTexts = (c) => {
  const kws = c.keywords.filter(isLatin);
  const name = c.name.toLowerCase();
  return [name, kws.length ? `${name}: ${kws.join(', ')}` : name, ...kws];
};

// Scores every candidate (task or material). `extracted` is the result of extractQuantity.
// Returns candidates sorted best first: { ref, name, score, reasons, parts }.
export async function scoreCandidates(part, candidates, extracted, ignoreWords = []) {
  const text = meaningText(part, ignoreWords, extracted.unit) || part;
  const lists = candidates.map(targetTexts);
  const sims = await meaningScores(text, lists.flat());
  let at = 0;
  return candidates
    .map((c, i) => {
      const own = sims.slice(at, (at += lists[i].length));
      // name or name+keywords count fully; a single keyword counts a little less
      const meaning = Math.max(own[0], own[1], 0.85 * Math.max(0, ...own.slice(2)));
      const kw = keywordScore(part, c.keywords);
      const unit = unitFit(extracted.unit, c.unit);
      const score = WEIGHTS.meaning * meaning + WEIGHTS.keywords * kw.score + WEIGHTS.unit * unit;
      const reasons = [`meaning ${meaning.toFixed(2)}`];
      if (kw.hits.length) reasons.push(`words: ${kw.hits.slice(0, 3).join(', ')}`);
      if (!extracted.unit) reasons.push('unit not written');
      else if (unit === 1) reasons.push(`unit matches (${c.unit})`);
      else if (unit > 0) reasons.push(`unit close (${extracted.unit} ~ ${c.unit})`);
      else reasons.push(`unit differs (${extracted.unit} vs ${c.unit})`);
      return { ref: c, name: c.name, score, reasons, meaning, keywordHit: kw.score > 0 };
    })
    .sort((a, b) => b.score - a.score);
}
