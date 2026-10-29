// Hindi and Telugu names for the demo projects, tasks and materials, keyed by the English name.
// seed.js copies them into nameHi / nameTe. The matcher never reads these: it works on `name` and `keywords`.

export const projectNames = {
  'Government Houses': { hi: 'सरकारी मकान', te: 'ప్రభుత్వ ఇళ్లు' },
  'Overhead Water Tank': { hi: 'ऊँची पानी की टंकी', te: 'ఎత్తైన నీటి ట్యాంక్' },
  Canal: { hi: 'नहर', te: 'కాలువ' },
  'Electric Lines': { hi: 'बिजली की लाइनें', te: 'విద్యుత్ లైన్లు' },
};

export const projectDescriptions = {
  'Government Houses': {
    hi: 'ग्रामीण आवास योजना के तहत परिवारों के लिए 20 मकान।',
    te: 'గ్రామీణ గృహ పథకం కింద కుటుంబాల కోసం 20 ఇళ్లు.',
  },
  'Overhead Water Tank': {
    hi: 'गाँव में पीने का पानी पहुँचाने के लिए पाइपलाइन सहित ऊँची टंकी।',
    te: 'గ్రామానికి తాగునీరు అందించడానికి పైప్‌లైన్‌తో కూడిన ఎత్తైన ట్యాంక్.',
  },
  Canal: {
    hi: 'टंकी के बाँध से खेतों तक 2 किमी लंबी सिंचाई नहर।',
    te: 'ట్యాంక్ గట్టు నుంచి పొలాల వరకు 2 కి.మీ. సాగునీటి కాలువ.',
  },
  'Electric Lines': {
    hi: '150 घरों को बिजली कनेक्शन देने के लिए नए खंभे, लाइनें और एक ट्रांसफार्मर।',
    te: '150 ఇళ్లకు విద్యుత్ కనెక్షన్లు ఇవ్వడానికి కొత్త స్తంభాలు, లైన్లు, ఒక ట్రాన్స్‌ఫార్మర్.',
  },
};

export const taskNames = {
  Foundation: { hi: 'नींव', te: 'పునాది' },
  'Walls up to lintel': { hi: 'लिंटल तक दीवारें', te: 'లింటెల్ వరకు గోడలు' },
  'Roof slab': { hi: 'छत की स्लैब', te: 'పైకప్పు స్లాబ్' },
  Plastering: { hi: 'प्लास्टर', te: 'ప్లాస్టరింగ్' },
  'Doors and windows': { hi: 'दरवाज़े और खिड़कियाँ', te: 'తలుపులు, కిటికీలు' },
  Flooring: { hi: 'फर्श', te: 'ఫ్లోరింగ్' },
  'Electrical fitting': { hi: 'बिजली की फिटिंग', te: 'విద్యుత్ ఫిట్టింగ్' },
  'Handover to beneficiary': { hi: 'लाभार्थी को सौंपना', te: 'లబ్ధిదారుకు అప్పగింత' },
  Excavation: { hi: 'खुदाई', te: 'తవ్వకం' },
  'Foundation concrete': { hi: 'नींव की कंक्रीट', te: 'పునాది కాంక్రీట్' },
  Columns: { hi: 'कॉलम', te: 'కాలమ్‌లు' },
  'Tank slab and walls': { hi: 'टंकी की स्लैब और दीवारें', te: 'ట్యాంక్ స్లాబ్, గోడలు' },
  'Pipeline laying': { hi: 'पाइपलाइन बिछाना', te: 'పైప్‌లైన్ వేయడం' },
  'Pump installation': { hi: 'पंप लगाना', te: 'పంపు బిగింపు' },
  'Leak testing': { hi: 'लीकेज की जाँच', te: 'లీకేజీ పరీక్ష' },
  'Earth excavation': { hi: 'मिट्टी की खुदाई', te: 'మట్టి తవ్వకం' },
  'Canal lining': { hi: 'नहर की पक्की परत', te: 'కాలువ లైనింగ్' },
  Culverts: { hi: 'पुलिया', te: 'కల్వర్టులు' },
  'Sluice gates': { hi: 'पानी के फाटक', te: 'నీటి గేట్లు' },
  'Pole erection': { hi: 'खंभे खड़े करना', te: 'స్తంభాలు నాటడం' },
  'Wire stringing': { hi: 'तार खींचना', te: 'తీగలు లాగడం' },
  'Transformer installation': { hi: 'ट्रांसफार्मर लगाना', te: 'ట్రాన్స్‌ఫార్మర్ బిగింపు' },
  'House connections': { hi: 'घरों के कनेक्शन', te: 'ఇళ్ల కనెక్షన్లు' },
  'Meter installation': { hi: 'मीटर लगाना', te: 'మీటర్ల బిగింపు' },
};

export const materialNames = {
  Cement: { hi: 'सीमेंट', te: 'సిమెంట్' },
  Steel: { hi: 'सरिया (स्टील)', te: 'స్టీల్' },
  Bricks: { hi: 'ईंटें', te: 'ఇటుకలు' },
  Sand: { hi: 'रेत', te: 'ఇసుక' },
  Stone: { hi: 'गिट्टी', te: 'కంకర' },
  Pipes: { hi: 'पाइप', te: 'పైపులు' },
  Poles: { hi: 'खंभे', te: 'స్తంభాలు' },
  Wire: { hi: 'तार', te: 'తీగ' },
  'Energy meters': { hi: 'बिजली मीटर', te: 'విద్యుత్ మీటర్లు' },
};

// Adds nameHi / nameTe (and descriptionHi / descriptionTe) to a seed record.
export function withNames(record, table, descriptions) {
  const n = table[record.name] || {};
  const d = descriptions?.[record.name] || {};
  return {
    ...record,
    nameHi: n.hi || '', nameTe: n.te || '',
    ...(descriptions && { descriptionHi: d.hi || '', descriptionTe: d.te || '' }),
  };
}
