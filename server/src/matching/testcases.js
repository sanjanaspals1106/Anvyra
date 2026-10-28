// Sample supervisor updates with the items the matcher should find.
// In the test run, translation is replaced by the stored `english` text, so no internet is needed.
//
// expect: list of items, each { task | material, qty }. [] means "nothing should be found".
// ambiguous: true  -> the update must be flagged needs_check (and still produce at least one item).
// seedProgress: true -> use the progress/stock of the demo data (default: a fresh project with 0 done).

export const H = 'Government Houses';
export const W = 'Overhead Water Tank';
export const C = 'Canal';
export const E = 'Electric Lines';

export const cases = [
  // ------------------------------------------------------------- Government Houses
  { project: H, text: 'Walls up to lintel completed for 4 houses', expect: [{ task: 'Walls up to lintel', qty: 4 }] },
  { project: H, text: 'Roof slab cast for 3 houses, 600 kg steel used',
    expect: [{ task: 'Roof slab', qty: 3 }, { material: 'Steel', qty: 600 }] },
  { project: H, text: 'Plastering finished in 5 houses', expect: [{ task: 'Plastering', qty: 5 }] },
  { project: H, text: 'Fixed doors and windows in two houses', expect: [{ task: 'Doors and windows', qty: 2 }] },
  { project: H, text: 'Brickwork done up to lintel in 3 houses, 3000 bricks used',
    expect: [{ task: 'Walls up to lintel', qty: 3 }, { material: 'Bricks', qty: 3000 }] },
  { project: H, text: 'Used 60 bags cement today', expect: [{ material: 'Cement', qty: 60 }] },
  { project: H, text: 'Floring completed for 2 houses', expect: [{ task: 'Flooring', qty: 2 }] },
  { project: H, text: 'Electrical wiring done in 4 houses and flooring in 1 house',
    expect: [{ task: 'Electrical fitting', qty: 4 }, { task: 'Flooring', qty: 1 }] },
  { project: H, text: 'Handed over 2 houses to beneficiaries', expect: [{ task: 'Handover to beneficiary', qty: 2 }] },
  { project: H, lang: 'hi', text: '4 घरों में प्लास्टर पूरा हुआ', english: 'Plastering completed in 4 houses',
    expect: [{ task: 'Plastering', qty: 4 }] },
  { project: H, lang: 'hi', text: '120 बोरी सीमेंट लगी', english: '120 bags of cement used',
    expect: [{ material: 'Cement', qty: 120 }] },
  { project: H, lang: 'hi', text: '२ घरों की दीवारें लिंटल तक बनीं और ३००० ईंटें लगीं',
    english: 'Walls up to lintel built in 2 houses and 3000 bricks used',
    expect: [{ task: 'Walls up to lintel', qty: 2 }, { material: 'Bricks', qty: 3000 }] },
  { project: H, text: 'Completed the work in 3 houses today', ambiguous: true, expect: [{ qty: 3 }] },

  // ------------------------------------------------------------- Overhead Water Tank
  { project: W, text: 'Completed 2 columns, used 40 bags cement',
    expect: [{ task: 'Columns', qty: 2 }, { material: 'Cement', qty: 40 }] },
  { project: W, text: 'Excavation of 30 cu m done', expect: [{ task: 'Excavation', qty: 30 }] },
  { project: W, text: 'Dug 45 cubic metres for the tank base', expect: [{ task: 'Excavation', qty: 45 }] },
  { project: W, text: 'Exavation finished for 25 m3', expect: [{ task: 'Excavation', qty: 25 }] },
  { project: W, text: 'Poured 20 cu m foundation concrete, used 120 bags cement and 800 kg steel',
    expect: [{ task: 'Foundation concrete', qty: 20 }, { material: 'Cement', qty: 120 }, { material: 'Steel', qty: 800 }] },
  { project: W, text: 'Laid 250 m of pipeline towards the main road', expect: [{ task: 'Pipeline laying', qty: 250 }] },
  { project: W, text: 'Fixed the pump and motor, installed 1 pump', expect: [{ task: 'Pump installation', qty: 1 }] },
  { project: W, text: 'Three colums casted yesterday', expect: [{ task: 'Columns', qty: 3 }] },
  { project: W, text: 'Tank slab 30% complete', expect: [{ task: 'Tank slab and walls', qty: 30 }] },
  { project: W, text: 'Used 300 m pipes', expect: [{ material: 'Pipes', qty: 300 }] },
  { project: W, text: 'Leak test done once, no leaks found', expect: [{ task: 'Leak testing', qty: 1 }] },
  { project: W, lang: 'hi', text: '2 कॉलम पूरे किए और 25 बोरी सीमेंट लगी',
    english: 'Completed 2 columns and 25 bags of cement used',
    expect: [{ task: 'Columns', qty: 2 }, { material: 'Cement', qty: 25 }] },
  { project: W, lang: 'hi', text: '150 मीटर पाइपलाइन बिछाई', english: 'Laid 150 metres of pipeline',
    expect: [{ task: 'Pipeline laying', qty: 150 }] },
  { project: W, lang: 'hi', text: '600 किलो सरिया लगा', english: '600 kg steel used',
    expect: [{ material: 'Steel', qty: 600 }] },
  { project: W, text: 'Excavation is done again for 10 cu m', seedProgress: true, ambiguous: true, expect: [{ qty: 10 }] },
  { project: W, text: 'Completed 6 columns', seedProgress: true, expect: [{ task: 'Columns', qty: 6 }], overPlanned: true },

  // ------------------------------------------------------------- Canal
  { project: C, text: 'Dug 200 m of the canal', expect: [{ task: 'Earth excavation', qty: 200 }] },
  { project: C, text: 'Excavated 150 metres near the fields', expect: [{ task: 'Earth excavation', qty: 150 }] },
  { project: C, text: 'Canal lining completed for 100 m, used 150 bags cement',
    expect: [{ task: 'Canal lining', qty: 100 }, { material: 'Cement', qty: 150 }] },
  { project: C, text: 'Built 2 culverts, 80 kg steel used', expect: [{ task: 'Culverts', qty: 2 }, { material: 'Steel', qty: 80 }] },
  { project: C, text: 'Installed 1 sluice gate', expect: [{ task: 'Sluice gates', qty: 1 }] },
  { project: C, text: 'Used 20 cu m sand and 15 cu m stone', expect: [{ material: 'Sand', qty: 20 }, { material: 'Stone', qty: 15 }] },
  { project: C, text: 'Excavtion of canal 120 m done', expect: [{ task: 'Earth excavation', qty: 120 }] },
  { project: C, text: 'Lined 60 m of canal with concrete', expect: [{ task: 'Canal lining', qty: 60 }] },
  { project: C, lang: 'te', text: 'కాలువ 180 మీటర్లు తవ్వాము', english: 'Dug 180 metres of canal',
    expect: [{ task: 'Earth excavation', qty: 180 }] },
  { project: C, lang: 'te', text: '2 కల్వర్టులు పూర్తి చేశాము', english: 'Completed 2 culverts',
    expect: [{ task: 'Culverts', qty: 2 }] },
  { project: C, lang: 'te', text: '100 బస్తాల సిమెంట్ వాడాము', english: 'Used 100 bags of cement',
    expect: [{ material: 'Cement', qty: 100 }] },
  { project: C, text: 'Work done for 100 m near the temple', ambiguous: true, expect: [{ qty: 100 }] },

  // ------------------------------------------------------------- Electric Lines
  { project: E, text: 'Erected 20 poles along the school road', expect: [{ task: 'Pole erection', qty: 20 }] },
  { project: E, text: 'Put up 15 poles and strung 1000 m of wire',
    expect: [{ task: 'Pole erection', qty: 15 }, { task: 'Wire stringing', qty: 1000 }] },
  { project: E, text: 'Used 12 poles and 500 m wire', expect: [{ material: 'Poles', qty: 12 }, { material: 'Wire', qty: 500 }] },
  { project: E, text: 'Fixed 30 meters in the houses', expect: [{ task: 'Meter installation', qty: 30 }] },
  { project: E, text: 'Strung 500 meters of wire near the canal', expect: [{ task: 'Wire stringing', qty: 500 }] },
  { project: E, text: 'Installed 20 energy meters', expect: [{ task: 'Meter installation', qty: 20 }] },
  { project: E, text: 'Transformer installation done, 1 transformer fitted', expect: [{ task: 'Transformer installation', qty: 1 }] },
  { project: E, text: 'Gave electricity connection to 25 houses', expect: [{ task: 'House connections', qty: 25 }] },
  { project: E, text: 'Polls erected: 10 poles', expect: [{ task: 'Pole erection', qty: 10 }] },
  { project: E, lang: 'te', text: 'ఈరోజు 12 స్తంభాలు వేశాము', english: 'Erected 12 poles today',
    expect: [{ task: 'Pole erection', qty: 12 }] },
  { project: E, lang: 'te', text: '40 ఇళ్లకు కనెక్షన్ ఇచ్చి 40 మీటర్లు బిగించాము',
    english: 'Gave connections to 40 houses and fixed 40 meters',
    expect: [{ task: 'House connections', qty: 40 }, { task: 'Meter installation', qty: 40 }] },
  { project: E, lang: 'hi', text: '800 मीटर तार खींचा', english: 'Strung 800 metres of wire',
    expect: [{ task: 'Wire stringing', qty: 800 }] },
  { project: E, lang: 'hi', text: '1 ट्रांसफार्मर लगाया', english: 'Installed 1 transformer',
    expect: [{ task: 'Transformer installation', qty: 1 }] },

  // ------------------------------------------------------------- Unrelated text
  { project: H, text: 'The weather was very hot and the tea was good', expect: [] },
  { project: E, text: 'Meeting with the sarpanch tomorrow morning', expect: [] },
  { project: W, text: 'Ten workers came to the site today', expect: [] },
];
