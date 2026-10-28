// HELD-OUT SET 2: 20 new updates, written AFTER the last matching fixes.
// No matching code or keyword was changed after writing these. Run: npm run test:heldout2
import { H, W, C, E } from './testcases.js';

export const cases = [
  // ------------------------------------------------------------- Government Houses
  { project: H, text: 'Foundation work for 4 houses completed', expect: [{ task: 'Foundation', qty: 4 }] },
  { project: H, lang: 'hi', text: '5 घरों में दरवाज़े और खिड़कियाँ लग गईं', english: 'Doors and windows fitted in 5 houses',
    expect: [{ task: 'Doors and windows', qty: 5 }] },
  { project: H, text: 'Used 3 cu m sand and 50 bags cement in plastering',
    expect: [{ material: 'Sand', qty: 3 }, { material: 'Cement', qty: 50 }] },
  { project: H, text: 'Wiring and fitting done in 6 houses', expect: [{ task: 'Electrical fitting', qty: 6 }] },
  { project: H, text: 'Weather was cloudy and 5 labourers were absent', expect: [] },

  // ------------------------------------------------------------- Overhead Water Tank
  { project: W, text: 'Concreting of the raft foundation 25 cu m done', expect: [{ task: 'Foundation concrete', qty: 25 }] },
  { project: W, lang: 'te', text: '2 స్తంభాలు పూర్తి చేశాము', english: 'Completed 2 pillars', expect: [{ task: 'Columns', qty: 2 }] },
  { project: W, text: 'Laid 180 m of pipe, used 200 m of pipes',
    expect: [{ task: 'Pipeline laying', qty: 180 }, { material: 'Pipes', qty: 200 }] },
  { project: W, text: 'Used 20 bags cement and 300 kg steel for the tank slab',
    expect: [{ material: 'Cement', qty: 20 }, { material: 'Steel', qty: 300 }] },
  { project: W, text: '1 leak test completed', expect: [{ task: 'Leak testing', qty: 1 }] },

  // ------------------------------------------------------------- Canal
  { project: C, text: 'Dug 90 m near the road', expect: [{ task: 'Earth excavation', qty: 90 }] },
  { project: C, lang: 'hi', text: '2 पुलिया बन गईं', english: '2 culverts built', expect: [{ task: 'Culverts', qty: 2 }] },
  { project: C, lang: 'te', text: '50 మీటర్లు లైనింగ్ చేశాము', english: 'Lined 50 metres', expect: [{ task: 'Canal lining', qty: 50 }] },
  { project: C, text: 'Sand 8 cu m and stone 6 cu m were used', expect: [{ material: 'Sand', qty: 8 }, { material: 'Stone', qty: 6 }] },
  { project: C, text: 'Installed 2 sluice gates and built 1 culvert',
    expect: [{ task: 'Sluice gates', qty: 2 }, { task: 'Culverts', qty: 1 }] },

  // ------------------------------------------------------------- Electric Lines
  { project: E, text: 'Strung 600 m of conductor', expect: [{ task: 'Wire stringing', qty: 600 }] },
  { project: E, lang: 'te', text: '1 ట్రాన్స్‌ఫార్మర్ బిగించాము', english: 'Fitted 1 transformer',
    expect: [{ task: 'Transformer installation', qty: 1 }] },
  { project: E, text: 'Used 400 m wire and 10 energy meters', expect: [{ material: 'Wire', qty: 400 }, { material: 'Energy meters', qty: 10 }] },
  { project: E, lang: 'hi', text: '20 घरों को बिजली कनेक्शन दिया', english: 'Gave power connection to 20 houses',
    expect: [{ task: 'House connections', qty: 20 }] },
  { project: E, text: 'Called the contractor 3 times about the delay', ambiguous: true, expect: [{ qty: 3 }] },
];
