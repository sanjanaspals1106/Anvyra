// LIVE test: sends Hindi and Telugu samples through the real translation provider (needs a key in .env)
// and checks the matched items. Kept apart from the offline tests.   npm run test:translate
import 'dotenv/config';
import { projects } from '../seed/data.js';
import { matchUpdate } from './index.js';
import { warmUp } from './embeddings.js';
import { translateToEnglish } from './translate.js';
import { cases } from './testcases.js';

if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY && !process.env.GOOGLE_TRANSLATE_KEY) {
  console.log('No translation key set in .env, nothing to test.');
  process.exit(0);
}

// Same project data as the offline tests (fresh project, plenty of stock), with the project type for the glossary.
function buildContext(name) {
  const p = projects.find((x) => x.project.name === name);
  return {
    projectName: p.project.name,
    projectType: p.project.type,
    tasks: p.tasks.map((t) => ({ id: t.name, ...t, doneQty: 0 })),
    materials: p.materials.map((m) => ({ id: m.name, ...m, stock: 1e6 })),
  };
}

const samples = [
  'कॉलम', '120 बोरी', '150 मीटर', 'కాలువ 180', 'కల్వర్టులు', 'స్తంభాలు',
].map((k) => cases.find((c) => c.lang && c.text.includes(k)));

await warmUp();
let pass = 0;
for (const c of samples) {
  const r = await matchUpdate({ text: c.text, context: buildContext(c.project), translate: translateToEnglish });
  const want = c.expect.map((e) => `${e.task || e.material}=${e.qty}`).sort().join(' + ');
  const got = r.items.map((i) => `${i.kind === 'task' ? i.taskId : i.materialId}=${i.quantity}`).sort().join(' + ');
  const ok = r.matchStatus === 'matched' && !r.translationFailed && want === got;
  if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.text}\n      english: ${r.englishText}\n      wanted: ${want}   got: ${got || '(nothing)'} [${r.matchStatus}]`);
}
console.log(`\n${pass}/${samples.length} live samples correct (model: ${process.env.GROQ_MODEL || 'openai/gpt-oss-120b'})`);
process.exit(pass === samples.length ? 0 : 1);
