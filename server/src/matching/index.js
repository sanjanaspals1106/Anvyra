// The ANVYRA matching engine.  matchUpdate({ text, projectId }) ->
//   { language, englishText, translationFailed, parts, items[], matchStatus, warnings[] }
//
// Steps: translate -> normalise -> split into parts -> find quantity + unit ->
//        task or material? -> score candidates -> decide -> explain -> checks.

import { detectLanguage, translateToEnglish } from './translate.js';
import { normalise, splitParts, extractQuantity, hasUseWord } from './parser.js';
import { scoreCandidates, keywordScore, fixSpelling } from './scorer.js';
import { loadContext } from './context.js';

export const THRESHOLDS = {
  minScore: 0.6, // top candidate must score at least this ...
  minLead: 0.1, //  ... and be this far ahead of the second one
  ignoreBelow: 0.3, // a part with no keyword and a lower score is not about our work
};

const round2 = (n) => Math.round(n * 100) / 100;

// Decide for one ranked list: matched only if clearly the best.
function decide(ranked) {
  const [top, second] = ranked;
  if (!top) return { status: 'needs_check', winner: null };
  const lead = top.score - (second ? second.score : 0);
  if (top.score >= THRESHOLDS.minScore && lead >= THRESHOLDS.minLead) return { status: 'matched', winner: top };
  return { status: 'needs_check', winner: null };
}

// options.translate and options.context can be replaced (the tests do this to run offline).
export async function matchUpdate({ text, projectId, translate = translateToEnglish, context = null }) {
  const ctx = context || (await loadContext(projectId));
  const language = detectLanguage(text);

  // 1. Translate. If it fails we keep the original and force needs_check.
  const tr = await translate(text, language);
  const translationFailed = language !== 'en' && !tr.ok;
  const englishText = tr.text;

  // 2. Normalise and 3. split into sentences (full stops) and then into parts (commas, "and", ...).
  // A part with no number ("fixed doors") belongs to the next part that has one ("windows in 2 houses").
  // Every part remembers whether its sentence has a "use" word anywhere.
  const parts = [];
  for (const sentence of normalise(englishText).split(/\s*(?:\.(?=\s|$)|[;।])\s*/).filter(Boolean)) {
    const raw = splitParts(sentence);
    const sentenceUse = raw.some(hasUseWord);
    let pending = '';
    for (const p of raw) {
      if (/\d/.test(p)) {
        parts.push({ text: `${pending} ${p}`.trim(), sentenceUse });
        pending = '';
      } else {
        pending = `${pending} ${p}`.trim();
      }
    }
    if (pending) parts.push({ text: pending, sentenceUse });
  }

  // Words of this project, used to repair spelling mistakes.
  const vocabulary = [...new Set([...ctx.tasks, ...ctx.materials].flatMap((c) =>
    [...c.name.toLowerCase().split(/\s+/), ...c.keywords.filter((k) => /^[a-z ]+$/i.test(k)).flatMap((k) => k.toLowerCase().split(' '))])
    .filter((w) => w.length >= 5))];
  // Words of the project name ("canal", "tank") say nothing about which task it is.
  const projectWords = (ctx.projectName || '').toLowerCase().split(/\s+/).filter((w) => w.length >= 4 && !/^houses?$/.test(w));

  const projectHasMeters = [...ctx.tasks, ...ctx.materials].some((c) =>
    c.keywords.some((k) => /meter|मीटर|మీటర్/.test(k)));
  const materialsNamed = (part) => ctx.materials.some((m) => keywordScore(part, [m.name, ...m.keywords]).score >= 0.8);

  const items = [];
  const warnings = [];

  // A part that names a material but has its own work verb ("erected 20 poles") is work done, not material used.
  const WORK_VERB = /\b(?:completed?|done|finished|built|laid|erected|installed|fixed|fitted|poured|cast|casting|dug|dig|excavated|put up|strung|lined|constructed|made|handed|gave|started)\b/;

  for (const { text: rawPart, sentenceUse } of parts) {
    const { text: part, fixes } = fixSpelling(rawPart, vocabulary);
    const q = extractQuantity(part, { projectHasMeters });
    const ownUse = hasUseWord(part);
    // A "use" word anywhere in the sentence ("used 40 bags cement and 1200 kg steel",
    // "10 cu m stone and 12 cu m sand used") applies to every material named in that sentence.
    const useWord = ownUse || (sentenceUse && q.hasNumber && !WORK_VERB.test(part) && materialsNamed(part));

    // 5. Material item when a material is named with a "use" word; otherwise match tasks.
    const isMaterial = useWord && (materialsNamed(part) || q.hasNumber);
    const candidates = isMaterial ? ctx.materials : ctx.tasks;
    if (!candidates.length) continue;

    // 6. Score every candidate of this project. Tasks that are already 100% are set aside.
    const ranked = await scoreCandidates(part, candidates, q, projectWords);
    const open = ranked.filter((r) => isMaterial || r.ref.doneQty < r.ref.plannedQty);
    const finished = ranked.filter((r) => !open.includes(r));
    const anyKeyword = ranked.some((r) => r.keywordHit);
    // A part without a quantity and without any keyword is not about our work.
    // A part WITH a quantity is never dropped: if nothing fits, the officer picks the task.
    if (!q.hasNumber && !anyKeyword) continue;
    const noMatch = !anyKeyword && ranked[0].score < THRESHOLDS.ignoreBelow;

    // Part with no number that points at a task we already have: it only repeats ("excavation complete").
    const topRef = String(open[0]?.ref.id);
    if (!q.hasNumber && items.some((it) => it.kind === (isMaterial ? 'material' : 'task') && it.topRef === topRef)) continue;

    // 7. Decide. A finished task that would have ranked first blocks an automatic match.
    let { status, winner } = decide(open);
    const blockedBy = finished.find((f) => f.score > (open[0]?.score ?? 0));
    if (blockedBy) {
      status = 'needs_check';
      winner = null;
    }
    if (!q.hasNumber || noMatch) {
      status = 'needs_check';
      winner = null;
    }

    // 8. Explain: top 3 with scores and reasons.
    const top3 = ranked.slice(0, 3).map((r) => ({
      refId: r.ref.id,
      name: r.name,
      score: round2(r.score),
      reasons: finished.includes(r) ? [...r.reasons, 'already complete'] : r.reasons,
    }));

    const item = {
      kind: isMaterial ? 'material' : 'task',
      text: rawPart,
      topRef,
      reportedQty: q.hasNumber ? q.quantity : undefined,
      quantity: q.quantity,
      unit: q.unit,
      matchStatus: status,
      matches: top3,
      warnings: [],
    };
    if (noMatch) top3[0].reasons.push(`no matching ${isMaterial ? 'material' : 'task'} found`);
    if (fixes.length) top3[0].reasons.push(`spelling fixed: ${fixes.join(', ')}`);
    if (winner) item[isMaterial ? 'materialId' : 'taskId'] = winner.ref.id;

    // 9. Checks (they never block saving).
    if (noMatch) item.warnings.push(`No matching ${isMaterial ? 'material' : 'task'} found. Please choose one.`);
    if (!q.hasNumber) item.warnings.push('No quantity found in this part.');
    else if (!q.hasUnit) item.warnings.push('No unit written, please check the quantity.');
    if (winner && q.hasNumber) {
      const c = winner.ref;
      if (!isMaterial && c.doneQty + q.quantity > c.plannedQty) {
        item.warnings.push(`${c.name}: ${c.doneQty + q.quantity} ${c.unit} would be more than the planned ${c.plannedQty} ${c.unit}.`);
      }
      if (isMaterial && q.quantity > c.stock) {
        item.warnings.push(`${c.name}: ${q.quantity} ${c.unit} used is more than the stock of ${c.stock} ${c.unit}.`);
      }
    }
    if (blockedBy) item.warnings.push(`Looks like "${blockedBy.name}", which is already complete.`);
    items.push(item);
  }

  items.forEach((it) => delete it.topRef);
  if (translationFailed) warnings.push('Could not translate this update. Please read the original text.');
  for (const it of items) warnings.push(...it.warnings);

  const matchStatus = translationFailed || items.some((i) => i.matchStatus === 'needs_check') ? 'needs_check' : 'matched';
  if (!items.length) warnings.push('Nothing about the project work was understood in this text.');
  return {
    language,
    englishText,
    translationFailed,
    partsFound: parts.length,
    items,
    matchStatus: items.length ? matchStatus : 'needs_check',
    warnings,
  };
}
