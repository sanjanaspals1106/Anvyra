// Translation step. Kept small and swappable: pick a provider with an env var.
//   GEMINI_API_KEY       -> Google Gemini (free tier available)
//   GOOGLE_TRANSLATE_KEY -> Google Cloud Translation
// With no key, or if the call fails, we return the original text with ok:false.
// The matcher still runs (native keywords work) but the update is flagged "needs_check".

// Language is detected from the script the text is written in.
export function detectLanguage(text) {
  if (/[ఀ-౿]/.test(text)) return 'te'; // Telugu
  if (/[ऀ-ॿ]/.test(text)) return 'hi'; // Devanagari (Hindi)
  return 'en';
}

const LANGUAGE_NAMES = { hi: 'Hindi', te: 'Telugu' };

async function viaGemini(text, lang) {
  const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const prompt =
    `Translate this ${LANGUAGE_NAMES[lang]} construction site report into plain English. ` +
    `Keep every number and unit exactly. Reply with the translation only.\n\n${text}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0 } }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Gemini returned ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('').trim();
}

async function viaGoogleTranslate(text, lang) {
  const url = `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ q: text, source: lang, target: 'en', format: 'text' }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Google Translate returned ${res.status}`);
  const data = await res.json();
  return data.data?.translations?.[0]?.translatedText?.trim();
}

// Returns { text, ok }. Never throws.
export async function translateToEnglish(text, lang) {
  if (lang === 'en') return { text, ok: true };
  try {
    let out;
    if (process.env.GEMINI_API_KEY) out = await viaGemini(text, lang);
    else if (process.env.GOOGLE_TRANSLATE_KEY) out = await viaGoogleTranslate(text, lang);
    else return { text, ok: false };
    return out ? { text: out, ok: true } : { text, ok: false };
  } catch (err) {
    console.error('Translation failed:', err.message);
    return { text, ok: false };
  }
}
