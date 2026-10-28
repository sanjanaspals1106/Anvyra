// Demo data for one village (Ramapuram) with 4 projects.
// All names, places and figures are fictional, made up for the demo.
// Updates refer to tasks and materials by name; seed.js turns names into ids.

export const VILLAGE = 'Ramapuram';
export const DEMO_PASSWORD = 'password123';

export const officer = {
  name: 'Ravi Kumar',
  email: 'officer@anvyra.test',
  role: 'officer',
  language: 'en',
};

// Shared material definitions (each project gets its own copy).
const M = {
  cement: { name: 'Cement', unit: 'bags', keywords: ['cement', 'सीमेंट', 'సిమెంట్'] },
  steel: { name: 'Steel', unit: 'kg', keywords: ['steel', 'rod', 'rods', 'sariya', 'सरिया', 'స్టీల్', 'ఇనుము'] },
  bricks: { name: 'Bricks', unit: 'nos', keywords: ['brick', 'bricks', 'eent', 'ईंट', 'ईंटें', 'ఇటుక', 'ఇటుకలు'] },
  sand: { name: 'Sand', unit: 'cu m', keywords: ['sand', 'ret', 'रेत', 'ఇసుక'] },
  stone: { name: 'Stone', unit: 'cu m', keywords: ['stone', 'metal', 'gitti', 'गिट्टी', 'पत्थर', 'రాయి', 'కంకర'] },
  pipes: { name: 'Pipes', unit: 'm', keywords: ['pipe', 'pipes', 'पाइप', 'పైపు', 'పైపులు'] },
  poles: { name: 'Poles', unit: 'nos', keywords: ['pole', 'poles', 'khamba', 'खंभा', 'खंभे', 'స్తంభం', 'స్తంభాలు'] },
  wire: { name: 'Wire', unit: 'm', keywords: ['wire', 'wires', 'conductor', 'taar', 'तार', 'తీగ', 'వైర్'] },
  meters: { name: 'Energy meters', unit: 'nos', keywords: ['energy meter', 'meter', 'meters', 'मीटर', 'మీటర్'] },
};

export const projects = [
  // ---------------------------------------------------------------- 1. Housing
  {
    project: {
      name: 'Government Houses',
      type: 'housing',
      description: '20 houses for families under the rural housing scheme.',
      startDate: '2026-07-15',
      endDate: '2027-01-31',
      sanctionedAmount: 2600000,
    },
    supervisor: { name: 'Meena Devi', email: 'housing@anvyra.test', language: 'hi' },
    tasks: [
      { name: 'Foundation', unit: 'houses', plannedQty: 20, keywords: ['foundation', 'base', 'neev', 'नींव', 'పునాది'] },
      { name: 'Walls up to lintel', unit: 'houses', plannedQty: 20, keywords: ['wall', 'walls', 'lintel', 'brickwork', 'deewar', 'दीवार', 'दीवारें', 'లింటెల్', 'గోడ', 'గోడలు'] },
      { name: 'Roof slab', unit: 'houses', plannedQty: 20, keywords: ['roof', 'slab', 'chhat', 'छत', 'स्लैब', 'పైకప్పు', 'స్లాబ్'] },
      { name: 'Plastering', unit: 'houses', plannedQty: 20, keywords: ['plaster', 'plastering', 'प्लास्टर', 'ప్లాస్టరింగ్'] },
      { name: 'Doors and windows', unit: 'houses', plannedQty: 20, keywords: ['door', 'doors', 'window', 'windows', 'darwaza', 'khidki', 'दरवाजा', 'खिड़की', 'తలుపు', 'కిటికీ'] },
      { name: 'Flooring', unit: 'houses', plannedQty: 20, keywords: ['floor', 'flooring', 'tiles', 'farsh', 'फर्श', 'ఫ్లోరింగ్'] },
      { name: 'Electrical fitting', unit: 'houses', plannedQty: 20, keywords: ['electrical', 'wiring', 'fitting', 'bijli', 'बिजली', 'వైరింగ్'] },
      { name: 'Handover to beneficiary', unit: 'houses', plannedQty: 20, keywords: ['handover', 'handed over', 'beneficiary', 'सौंपा', 'అప్పగించాము'] },
    ],
    materials: [
      { ...M.cement, lowStockLevel: 100 },
      { ...M.steel, lowStockLevel: 300 },
      { ...M.bricks, lowStockLevel: 2000 },
      { ...M.sand, lowStockLevel: 5 },
    ],
    receipts: [
      { material: 'Cement', quantity: 250, date: '2026-07-30', note: 'From district depot' },
      { material: 'Sand', quantity: 40, date: '2026-07-30', note: '' },
      { material: 'Bricks', quantity: 12000, date: '2026-09-08', note: 'Local kiln' },
      { material: 'Cement', quantity: 150, date: '2026-09-25', note: '' },
      { material: 'Steel', quantity: 2000, date: '2026-10-05', note: 'For roof slabs' },
    ],
    updates: [
      { date: '2026-08-05', lang: 'en', text: 'Foundation completed for 6 houses, used 120 bags cement',
        items: [{ task: 'Foundation', qty: 6 }, { material: 'Cement', qty: 120 }] },
      { date: '2026-08-19', lang: 'en', text: 'Foundation done for 8 more houses',
        items: [{ task: 'Foundation', qty: 8 }] },
      { date: '2026-09-02', lang: 'en', text: 'Completed foundation of remaining 6 houses, 110 bags cement used',
        items: [{ task: 'Foundation', qty: 6 }, { material: 'Cement', qty: 110 }] },
      { date: '2026-09-16', lang: 'hi', text: '5 घरों की दीवारें लिंटल तक पूरी हुईं, 4000 ईंटें लगीं',
        english: 'Walls up to lintel completed for 5 houses, 4000 bricks used',
        items: [{ task: 'Walls up to lintel', qty: 5 }, { material: 'Bricks', qty: 4000 }] },
      { date: '2026-09-30', lang: 'en', text: 'Walls up to lintel done in 6 houses, used 5000 bricks and 90 bags cement',
        items: [{ task: 'Walls up to lintel', qty: 6 }, { material: 'Bricks', qty: 5000 }, { material: 'Cement', qty: 90 }] },
      { date: '2026-10-14', lang: 'en', text: 'Roof slab cast for 4 houses, 800 kg steel used',
        items: [{ task: 'Roof slab', qty: 4 }, { material: 'Steel', qty: 800 }] },
      { date: '2026-10-21', lang: 'hi', text: '3 घरों की छत की स्लैब डाली गई',
        english: 'Roof slab laid for 3 houses',
        items: [{ task: 'Roof slab', qty: 3 }] },
    ],
    issues: [
      { type: 'labour', description: 'Masons unavailable during festival week, work slowed down.',
        raisedAt: '2026-09-20', status: 'resolved', resolvedAt: '2026-09-27', resolutionNote: 'Masons back from 27 Sep.' },
    ],
    expenses: [
      { amount: 300000, date: '2026-08-10', note: 'Foundation materials and labour' },
      { amount: 250000, date: '2026-09-20', note: 'Bricks and wall labour' },
      { amount: 150000, date: '2026-10-20', note: 'Steel for roof slabs' },
    ],
  },

  // ---------------------------------------------------------------- 2. Water tank
  {
    project: {
      name: 'Overhead Water Tank',
      type: 'water_tank',
      description: 'Overhead tank with pipeline to supply drinking water to the village.',
      startDate: '2026-08-01',
      endDate: '2027-02-28',
      sanctionedAmount: 4500000,
    },
    supervisor: { name: 'Arjun Singh', email: 'watertank@anvyra.test', language: 'hi' },
    tasks: [
      { name: 'Excavation', unit: 'cu m', plannedQty: 120, keywords: ['excavation', 'excavate', 'excavated', 'dig', 'digging', 'khudai', 'खुदाई', 'తవ్వకం'] },
      { name: 'Foundation concrete', unit: 'cu m', plannedQty: 60, keywords: ['foundation', 'concrete', 'pcc', 'raft', 'नींव', 'कंक्रीट', 'కాంక్రీట్'] },
      { name: 'Columns', unit: 'nos', plannedQty: 8, keywords: ['column', 'columns', 'pillar', 'pillars', 'कॉलम', 'కాలమ్', 'స్తంభం'] },
      { name: 'Tank slab and walls', unit: '%', plannedQty: 100, keywords: ['tank', 'container', 'tank slab', 'tanki', 'टंकी', 'ట్యాంక్'] },
      { name: 'Pipeline laying', unit: 'm', plannedQty: 1500, keywords: ['pipe', 'pipeline', 'pipes', 'पाइप', 'पाइपलाइन', 'పైపు', 'పైప్‌లైన్'] },
      { name: 'Pump installation', unit: 'nos', plannedQty: 1, keywords: ['pump', 'motor', 'पंप', 'मोटर', 'పంపు', 'మోటార్'] },
      { name: 'Leak testing', unit: 'nos', plannedQty: 1, keywords: ['leak', 'test', 'testing', 'water test', 'लीक', 'టెస్ట్'] },
    ],
    materials: [
      { ...M.cement, lowStockLevel: 100 },
      { ...M.steel, lowStockLevel: 500 },
      { ...M.sand, lowStockLevel: 10 },
      { ...M.pipes, lowStockLevel: 200 },
    ],
    receipts: [
      { material: 'Cement', quantity: 400, date: '2026-08-20', note: '' },
      { material: 'Steel', quantity: 3000, date: '2026-08-20', note: '' },
      { material: 'Sand', quantity: 60, date: '2026-08-22', note: '' },
      { material: 'Cement', quantity: 100, date: '2026-10-01', note: '' },
      { material: 'Pipes', quantity: 800, date: '2026-10-12', note: 'HDPE pipes, first lot' },
    ],
    updates: [
      { date: '2026-08-08', lang: 'en', text: 'Excavation of 50 cu m done for tank foundation',
        items: [{ task: 'Excavation', qty: 50 }] },
      { date: '2026-08-14', lang: 'en', text: 'Excavated 70 cu m, excavation complete',
        items: [{ task: 'Excavation', qty: 70 }] },
      { date: '2026-08-28', lang: 'en', text: 'Poured 30 cu m foundation concrete, used 180 bags cement and 1200 kg steel',
        items: [{ task: 'Foundation concrete', qty: 30 }, { material: 'Cement', qty: 180 }, { material: 'Steel', qty: 1200 }] },
      { date: '2026-09-10', lang: 'en', text: 'Foundation concrete 30 cu m completed, 170 bags cement used',
        items: [{ task: 'Foundation concrete', qty: 30 }, { material: 'Cement', qty: 170 }] },
      { date: '2026-09-25', lang: 'hi', text: '2 कॉलम पूरे किए, 600 किलो सरिया लगा',
        english: 'Completed 2 columns, 600 kg steel used',
        items: [{ task: 'Columns', qty: 2 }, { material: 'Steel', qty: 600 }] },
      { date: '2026-10-09', lang: 'en', text: 'Completed 2 columns, used 40 bags cement',
        items: [{ task: 'Columns', qty: 2 }, { material: 'Cement', qty: 40 }] },
      { date: '2026-10-20', lang: 'en', text: 'Laid 400 m of pipeline from the tank towards the main road, 400 m pipes used',
        items: [{ task: 'Pipeline laying', qty: 400 }, { material: 'Pipes', qty: 400 }] },
    ],
    issues: [
      { type: 'material', description: 'Pipe delivery late by 10 days, pipeline work could not start.',
        raisedAt: '2026-10-01', status: 'resolved', resolvedAt: '2026-10-12', resolutionNote: 'First lot of 800 m pipes received.' },
    ],
    expenses: [
      { amount: 700000, date: '2026-08-25', note: 'Excavation, cement and steel' },
      { amount: 500000, date: '2026-09-30', note: 'Foundation and columns' },
      { amount: 300000, date: '2026-10-15', note: 'Pipes, first lot' },
    ],
  },

  // ---------------------------------------------------------------- 3. Canal
  {
    project: {
      name: 'Canal',
      type: 'canal',
      description: '2 km irrigation canal from the tank bund to the fields.',
      startDate: '2026-07-01',
      endDate: '2027-01-31',
      sanctionedAmount: 6000000,
    },
    supervisor: { name: 'Lakshmi Rao', email: 'canal@anvyra.test', language: 'te' },
    tasks: [
      { name: 'Earth excavation', unit: 'm', plannedQty: 2000, keywords: ['excavation', 'excavated', 'dig', 'dug', 'digging', 'earthwork', 'khudai', 'खुदाई', 'తవ్వకం', 'తవ్వాము'] },
      { name: 'Canal lining', unit: 'm', plannedQty: 2000, keywords: ['lining', 'lined', 'concrete lining', 'पक्का', 'లైనింగ్'] },
      { name: 'Culverts', unit: 'nos', plannedQty: 4, keywords: ['culvert', 'culverts', 'pulia', 'पुलिया', 'కల్వర్టు'] },
      { name: 'Sluice gates', unit: 'nos', plannedQty: 3, keywords: ['sluice', 'gate', 'gates', 'फाटक', 'గేటు', 'గేట్లు'] },
    ],
    materials: [
      { ...M.cement, lowStockLevel: 100 },
      { ...M.sand, lowStockLevel: 10 },
      { ...M.stone, lowStockLevel: 10 },
      { ...M.steel, lowStockLevel: 100 },
    ],
    receipts: [
      { material: 'Cement', quantity: 400, date: '2026-09-05', note: '' },
      { material: 'Sand', quantity: 50, date: '2026-09-05', note: '' },
      { material: 'Stone', quantity: 80, date: '2026-09-10', note: '' },
      { material: 'Steel', quantity: 500, date: '2026-09-28', note: 'For culverts' },
    ],
    updates: [
      { date: '2026-07-20', lang: 'en', text: 'Earth excavation done for 300 m',
        items: [{ task: 'Earth excavation', qty: 300 }] },
      { date: '2026-08-03', lang: 'en', text: 'Excavated 350 m of canal',
        items: [{ task: 'Earth excavation', qty: 350 }] },
      { date: '2026-08-24', lang: 'te', text: 'కాలువ 250 మీటర్లు తవ్వాము',
        english: 'Dug 250 metres of canal',
        items: [{ task: 'Earth excavation', qty: 250 }] },
      { date: '2026-09-15', lang: 'en', text: 'Canal lining completed for 200 m, used 300 bags cement',
        items: [{ task: 'Canal lining', qty: 200 }, { material: 'Cement', qty: 300 }] },
      { date: '2026-10-06', lang: 'en', text: 'Built 1 culvert near the temple road, used 150 kg steel',
        items: [{ task: 'Culverts', qty: 1 }, { material: 'Steel', qty: 150 }] },
    ],
    issues: [
      { type: 'weather', description: 'Heavy rain flooded the excavated stretch near the fields. Work stopped.',
        raisedAt: '2026-10-16', status: 'open' },
      { type: 'material', description: 'Cement delivery delayed by one week.',
        raisedAt: '2026-08-28', status: 'resolved', resolvedAt: '2026-09-05', resolutionNote: '400 bags received.' },
    ],
    expenses: [
      { amount: 1500000, date: '2026-08-01', note: 'Earthwork machinery and labour' },
      { amount: 1200000, date: '2026-09-15', note: 'Lining materials' },
      { amount: 900000, date: '2026-10-10', note: 'Culvert and labour' },
    ],
  },

  // ---------------------------------------------------------------- 4. Electric lines
  {
    project: {
      name: 'Electric Lines',
      type: 'electricity',
      description: 'New poles, lines and a transformer to give power connections to 150 houses.',
      startDate: '2026-09-01',
      endDate: '2026-12-31',
      sanctionedAmount: 3500000,
    },
    supervisor: { name: 'Suresh Reddy', email: 'electric@anvyra.test', language: 'te' },
    tasks: [
      { name: 'Pole erection', unit: 'nos', plannedQty: 80, keywords: ['pole', 'poles', 'erect', 'erected', 'khamba', 'खंभा', 'खंभे', 'స్తంభం', 'స్తంభాలు'] },
      { name: 'Wire stringing', unit: 'm', plannedQty: 4000, keywords: ['wire', 'wires', 'conductor', 'stringing', 'strung', 'taar', 'तार', 'తీగ', 'వైర్'] },
      { name: 'Transformer installation', unit: 'nos', plannedQty: 2, keywords: ['transformer', 'ट्रांसफार्मर', 'ట్రాన్స్‌ఫార్మర్'] },
      { name: 'House connections', unit: 'houses', plannedQty: 150, keywords: ['connection', 'connections', 'house connection', 'service line', 'कनेक्शन', 'కనెక్షన్'] },
      { name: 'Meter installation', unit: 'nos', plannedQty: 150, keywords: ['energy meter', 'meter', 'meters', 'मीटर', 'మీటర్'] },
    ],
    materials: [
      { ...M.poles, lowStockLevel: 10 },
      { ...M.wire, lowStockLevel: 500 },
      { ...M.meters, lowStockLevel: 10 },
    ],
    receipts: [
      { material: 'Poles', quantity: 50, date: '2026-09-08', note: '' },
      { material: 'Wire', quantity: 2500, date: '2026-09-20', note: '' },
      { material: 'Poles', quantity: 20, date: '2026-10-05', note: '' },
      { material: 'Energy meters', quantity: 50, date: '2026-10-15', note: 'First lot of meters' },
    ],
    updates: [
      { date: '2026-09-12', lang: 'en', text: 'Erected 20 poles along the school road',
        items: [{ task: 'Pole erection', qty: 20 }, { material: 'Poles', qty: 20 }] },
      { date: '2026-09-26', lang: 'te', text: 'ఈరోజు 25 స్తంభాలు వేశాము',
        english: 'Erected 25 poles today',
        items: [{ task: 'Pole erection', qty: 25 }, { material: 'Poles', qty: 25 }] },
      { date: '2026-10-10', lang: 'en', text: 'Put up 15 poles and strung 1000 m of wire',
        items: [{ task: 'Pole erection', qty: 15 }, { material: 'Poles', qty: 15 }, { task: 'Wire stringing', qty: 1000 }, { material: 'Wire', qty: 1000 }] },
      { date: '2026-10-22', lang: 'en', text: 'Installed 1 transformer near the panchayat office',
        items: [{ task: 'Transformer installation', qty: 1 }] },
      { date: '2026-10-26', lang: 'te', text: '30 ఇళ్లకు కనెక్షన్ ఇచ్చి 30 మీటర్లు బిగించాము',
        english: 'Gave connections to 30 houses and fixed 30 meters',
        items: [{ task: 'House connections', qty: 30 }, { task: 'Meter installation', qty: 30 }, { material: 'Energy meters', qty: 30 }] },
    ],
    issues: [
      { type: 'land', description: 'Landowner objected to two pole spots near the fields.',
        raisedAt: '2026-10-18', status: 'open' },
    ],
    expenses: [
      { amount: 600000, date: '2026-09-10', note: 'Poles and labour' },
      { amount: 400000, date: '2026-09-25', note: 'Wire' },
      { amount: 300000, date: '2026-10-22', note: 'Transformer' },
    ],
  },
];
