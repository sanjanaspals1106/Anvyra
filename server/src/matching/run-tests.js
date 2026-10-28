// Runs every sample update through matchUpdate and prints a table with the accuracy.
// Translation is replaced by the stored English text, and the project data comes from the
// demo data file, so this test needs no internet and no database.
//   npm run test:matching            (tuning set, must reach 90%)
//   npm run test:heldout             (held-out set, report only)

import { projects } from '../seed/data.js';
import { matchUpdate } from './index.js';
import { warmUp } from './embeddings.js';
// Default: the tuning set. With --heldout: the separate held-out set (reported only, never used for tuning).
const heldout = process.argv.includes('--heldout');
const { cases } = await import(heldout ? './testcases-heldout.js' : './testcases.js');

const PASS_MARK = 90;

// Builds the project info the matcher needs from the seed data.
// fresh = nothing done yet; otherwise progress and stock of the demo history.
function buildContext(projectName, fresh) {
  const p = projects.find((x) => x.project.name === projectName);
  const done = {};
  const used = {};
  const got = {};
  if (!fresh) {
    p.updates.forEach((u) => u.items.forEach((it) => {
      if (it.task) done[it.task] = (done[it.task] || 0) + it.qty;
      else used[it.material] = (used[it.material] || 0) + it.qty;
    }));
    p.receipts.forEach((r) => { got[r.material] = (got[r.material] || 0) + r.quantity; });
  }
  return {
    projectName: p.project.name,
    tasks: p.tasks.map((t) => ({ id: t.name, ...t, doneQty: done[t.name] || 0 })),
    materials: p.materials.map((m) => ({ id: m.name, ...m, stock: fresh ? 1e6 : (got[m.name] || 0) - (used[m.name] || 0) })),
  };
}

// Name of the item's chosen match, or its best guess (marked with ?) when it needs a check.
const chosen = (i) => (i.kind === 'task' ? i.taskId : i.materialId) || i.matches[0]?.name;
const describe = (items) =>
  items.map((i) => `${chosen(i)}=${i.quantity}${i.matchStatus === 'needs_check' ? '?' : ''}`).join(' + ') || '(nothing)';

// A case passes when the found items equal the expected ones.
function check(c, result, native) {
  if (c.ambiguous) {
    return result.matchStatus === 'needs_check' && result.items.length > 0 && result.items.some((i) => i.quantity === c.expect[0].qty);
  }
  if (c.expect.length === 0) return result.items.length === 0;
  if (result.items.length !== c.expect.length || result.matchStatus !== 'matched') return false;
  const key = (kind, name, qty) => `${kind}:${name}:${qty}`;
  const want = c.expect.map((e) => key(e.task ? 'task' : 'material', e.task || e.material, e.qty)).sort();
  const got = result.items.map((i) => key(i.kind, native ? i.matches[0]?.name : chosen(i), i.quantity)).sort();
  return want.every((w, i) => w === got[i]);
}

async function run({ native }) {
  let pass = 0;
  const rows = [];
  for (const c of cases) {
    const ctx = buildContext(c.project, !c.seedProgress);
    // native mode: pretend translation failed, so the matcher only sees Hindi/Telugu text
    if (native && !c.lang) continue;
    const translate = async (text) => (native ? { text, ok: false } : { text: c.english || text, ok: true });
    const result = await matchUpdate({ text: c.text, context: ctx, translate });
    // when translation "failed" the update is always needs_check, so only compare the items
    const view = native ? { ...result, matchStatus: 'matched' } : result;
    const ok = check(c, view, native) && (!c.overPlanned || result.warnings.some((w) => /more than the planned/.test(w)));
    if (ok) pass++;
    rows.push({ ok: ok ? 'PASS' : 'FAIL', project: c.project.slice(0, 12), text: c.text.slice(0, 48), found: describe(result.items) });
  }
  return { pass, total: rows.length, rows };
}

await warmUp();
const main = await run({ native: false });
console.table(main.rows);
const accuracy = (main.pass / main.total) * 100;
console.log(`\n${heldout ? 'HELD-OUT' : 'Tuning-set'} matching accuracy: ${main.pass}/${main.total} = ${accuracy.toFixed(1)}%${heldout ? "" : `  (needs ${PASS_MARK}%)`}`);

const native = await run({ native: true });
console.log(`Without translation (Hindi/Telugu words only): ${native.pass}/${native.total} = ${((native.pass / native.total) * 100).toFixed(1)}%  (information only)`);
if (process.argv.includes('--native')) console.table(native.rows.filter((r) => r.ok === 'FAIL'));

if (heldout) {
  const wanted = (c) => (c.ambiguous ? 'needs_check, qty ' + c.expect[0].qty : c.expect.map((e) => `${e.task || e.material}=${e.qty}`).join(' + ') || '(nothing)');
  const failed = cases.filter((_, i) => main.rows[i].ok === 'FAIL');
  console.log(`\nFailures (${failed.length}), not fixed:`);
  failed.forEach((c) => console.log(`- [${c.project}] "${c.text}"\n    expected: ${wanted(c)}\n    found:    ${main.rows[cases.indexOf(c)].found}`));
  process.exit(0);
}
process.exit(accuracy >= PASS_MARK ? 0 : 1);
