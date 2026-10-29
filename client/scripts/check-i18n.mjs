// npm run check:i18n
// 1. Every key in en.json must exist in hi.json and te.json (and have text).
// 2. No JSX file may contain hard-coded user-visible English: text between tags, text-like props
//    (title, label, placeholder, alt, aria-label...), strings passed to toast() / confirm(), and
//    string values of label / text / title / detail / message keys. Brand names such as ANVYRA are allowed.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import * as espree from 'espree';

const root = new URL('..', import.meta.url).pathname;
const failures = [];

// ---------------------------------------------------------------- 1. locale files
const load = (l) => JSON.parse(readFileSync(join(root, 'src/i18n/locales', `${l}.json`), 'utf8'));
const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? flat(v, `${p}${k}.`) : [[`${p}${k}`, v]]));
const en = Object.fromEntries(flat(load('en')));
// plural forms (key_one / key_other) are allowed to differ between languages
const base = (k) => k.replace(/_(one|other|zero|few|many)$/, '');
for (const lang of ['hi', 'te']) {
  const other = Object.fromEntries(flat(load(lang)));
  const have = new Set(Object.keys(other).map(base));
  for (const k of Object.keys(en)) if (!have.has(base(k))) failures.push(`${lang}.json is missing the key "${k}"`);
  for (const [k, v] of Object.entries(other)) {
    if (!(k in en) && !Object.keys(en).some((e) => base(e) === base(k))) failures.push(`${lang}.json has an extra key "${k}"`);
    if (typeof v !== 'string' || !v.trim()) failures.push(`${lang}.json key "${k}" is empty`);
  }
}

// ---------------------------------------------------------------- 2. hard-coded English in JSX
const ALLOWED = new Set(['ANVYRA', 'English', 'हिन्दी', 'తెలుగు', 'MongoDB']);
const TEXT_PROPS = new Set(['title', 'subtitle', 'label', 'placeholder', 'alt', 'aria-label', 'hint', 'text', 'description']);
const TEXT_KEYS = new Set(['label', 'text', 'title', 'detail', 'message', 'placeholder', 'subtitle', 'hint', 'description']);
const CALLS = new Set(['toast', 'confirm', 'alert', 'setError']);

// "English text" = contains a run of 3+ Latin letters outside of the allowed words.
function isEnglish(str) {
  let s = str;
  for (const a of ALLOWED) s = s.split(a).join(' ');
  return /[A-Za-z]{3,}/.test(s);
}

function files(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : p.endsWith('.jsx') ? [p] : [];
  });
}

function report(file, node, what, text) {
  failures.push(`${relative(root, file)}:${node.loc.start.line}  ${what}: "${text.trim().replace(/\s+/g, ' ').slice(0, 60)}"`);
}

function walk(node, file, visit) {
  if (!node || typeof node.type !== 'string') return;
  visit(node);
  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'range' || key === 'parent') continue;
    const v = node[key];
    if (Array.isArray(v)) v.forEach((c) => c && walk(c, file, visit));
    else if (v && typeof v.type === 'string') walk(v, file, visit);
  }
}

// String literals that can end up on screen from an expression (a ? 'x' : 'y', a && 'x', a || 'x').
function literalsIn(expr, out = []) {
  if (!expr) return out;
  if (expr.type === 'Literal' && typeof expr.value === 'string') out.push(expr);
  else if (expr.type === 'ConditionalExpression') { literalsIn(expr.consequent, out); literalsIn(expr.alternate, out); }
  else if (expr.type === 'LogicalExpression') { literalsIn(expr.left, out); literalsIn(expr.right, out); }
  else if (expr.type === 'TemplateLiteral') expr.quasis.forEach((q) => out.push({ ...q, value: q.value.cooked, loc: q.loc }));
  return out;
}

for (const file of files(join(root, 'src'))) {
  const ast = espree.parse(readFileSync(file, 'utf8'), {
    ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true }, loc: true,
  });
  walk(ast, file, (n) => {
    if (n.type === 'JSXText' && isEnglish(n.value)) report(file, n, 'text in JSX', n.value);
    if (n.type === 'JSXExpressionContainer') {
      // Only expressions used as children (not attribute values) are checked here.
      // (attribute values are handled in the JSXAttribute branch below)
    }
    if (n.type === 'JSXElement' || n.type === 'JSXFragment') {
      for (const c of n.children) {
        if (c.type === 'JSXExpressionContainer') {
          for (const lit of literalsIn(c.expression)) if (isEnglish(String(lit.value))) report(file, lit, 'string shown on screen', String(lit.value));
        }
      }
    }
    if (n.type === 'JSXAttribute' && n.name?.name && TEXT_PROPS.has(n.name.name) && n.value) {
      const lits = n.value.type === 'Literal' ? [n.value] : n.value.type === 'JSXExpressionContainer' ? literalsIn(n.value.expression) : [];
      for (const lit of lits) if (isEnglish(String(lit.value))) report(file, lit, `prop ${n.name.name}`, String(lit.value));
    }
    if (n.type === 'CallExpression' && n.callee.type === 'Identifier' && CALLS.has(n.callee.name)) {
      for (const lit of literalsIn(n.arguments[0])) if (isEnglish(String(lit.value))) report(file, lit, `${n.callee.name}()`, String(lit.value));
    }
    if (n.type === 'CallExpression' && n.callee.type === 'MemberExpression' && n.callee.property.name === 'confirm') {
      for (const lit of literalsIn(n.arguments[0])) if (isEnglish(String(lit.value))) report(file, lit, 'confirm()', String(lit.value));
    }
    if (n.type === 'Property' && n.key && (n.key.name || n.key.value) && TEXT_KEYS.has(n.key.name || n.key.value)) {
      for (const lit of literalsIn(n.value)) if (isEnglish(String(lit.value))) report(file, lit, `value of ${n.key.name || n.key.value}`, String(lit.value));
    }
  });
}

if (failures.length) {
  console.error(`check:i18n FAILED (${failures.length} problem${failures.length === 1 ? '' : 's'}):\n`);
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}
console.log(`check:i18n passed: ${Object.keys(en).length} keys in en/hi/te, no hard-coded English in JSX.`);
