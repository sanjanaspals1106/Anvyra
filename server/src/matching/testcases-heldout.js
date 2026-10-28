// HELD-OUT test set: 20 updates written after the matcher was tuned.
// Nothing in the matching code or the keywords was changed to fit these cases.
// Same format as testcases.js. Run with:  npm run test:heldout
import { H, W, C, E } from './testcases.js';

export const cases = [
  // ------------------------------------------------------------- Government Houses
  { project: H, text: 'Casting of roof slab finished for 2 houses, 450 kg steel consumed',
    expect: [{ task: 'Roof slab', qty: 2 }, { material: 'Steel', qty: 450 }] },
  { project: H, text: 'Lintel level brickwork completed in 5 houses', expect: [{ task: 'Walls up to lintel', qty: 5 }] },
  { project: H, lang: 'hi', text: '3 घरों में फर्श का काम हुआ', english: 'Flooring work done in 3 houses',
    expect: [{ task: 'Flooring', qty: 3 }] },
  { project: H, lang: 'hi', text: 'आज 2000 ईंटें इस्तेमाल हुईं', english: '2000 bricks were used today',
    expect: [{ material: 'Bricks', qty: 2000 }] },
  { project: H, text: 'Plaster work completed in 1 house, 25 bags cement used',
    expect: [{ task: 'Plastering', qty: 1 }, { material: 'Cement', qty: 25 }] },
  { project: H, text: 'Visited the site with the sarpanch, everything was fine', expect: [] },

  // ------------------------------------------------------------- Overhead Water Tank
  { project: W, text: 'Dug another 40 cu m of earth for the base', expect: [{ task: 'Excavation', qty: 40 }] },
  { project: W, text: 'Tank wall casting reached 45%', expect: [{ task: 'Tank slab and walls', qty: 45 }] },
  { project: W, lang: 'te', text: '30 మీటర్ల పైపులైన్ వేశాము', english: 'Laid 30 metres of pipeline',
    expect: [{ task: 'Pipeline laying', qty: 30 }] },
  { project: W, text: 'Installed 1 water pump', expect: [{ task: 'Pump installation', qty: 1 }] },
  { project: W, text: 'Pressure test for leaks was carried out once', expect: [{ task: 'Leak testing', qty: 1 }] },

  // ------------------------------------------------------------- Canal
  { project: C, text: 'Concrete lining of 75 m canal stretch done, 90 bags cement used',
    expect: [{ task: 'Canal lining', qty: 75 }, { material: 'Cement', qty: 90 }] },
  { project: C, lang: 'te', text: '3 గేట్లు బిగించాము', english: 'Fixed 3 gates', expect: [{ task: 'Sluice gates', qty: 3 }] },
  { project: C, lang: 'hi', text: 'नहर की 220 मीटर खुदाई हो गई', english: '220 metres of canal excavation is done',
    expect: [{ task: 'Earth excavation', qty: 220 }] },
  { project: C, text: '10 cu m stone and 12 cu m sand used for the culvert',
    expect: [{ material: 'Stone', qty: 10 }, { material: 'Sand', qty: 12 }] },
  { project: C, text: 'Completed work worth 100 m today', ambiguous: true, expect: [{ qty: 100 }] },

  // ------------------------------------------------------------- Electric Lines
  { project: E, text: 'Installed 2 transformers at the school', expect: [{ task: 'Transformer installation', qty: 2 }] },
  { project: E, text: 'Fixed 45 energy meters', expect: [{ task: 'Meter installation', qty: 45 }] },
  { project: E, lang: 'te', text: '60 ఇళ్లకు విద్యుత్ కనెక్షన్ ఇచ్చాము', english: 'Gave electricity connection to 60 houses',
    expect: [{ task: 'House connections', qty: 60 }] },
  { project: E, lang: 'hi', text: '8 खंभे लगाए', english: 'Erected 8 poles', expect: [{ task: 'Pole erection', qty: 8 }] },
];
