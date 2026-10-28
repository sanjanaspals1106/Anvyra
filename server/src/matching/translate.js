// Translation step. Kept small and swappable: providers are tried in this order,
// and each one is used only if its key is set in .env:
//   GROQ_API_KEY         -> Groq (Llama model, set GROQ_MODEL to change it)
//   GEMINI_API_KEY       -> Google Gemini (free tier available)
//   GOOGLE_TRANSLATE_KEY -> Google Cloud Translation
// If no key is set, or every provider fails, we return the original text with ok:false.
// The matcher still runs (native keywords work) but the update is flagged "needs_check".

// Language is detected from the script the text is written in.
export function detectLanguage(text) {
  if (/[ఀ-౿]/.test(text)) return 'te'; // Telugu
  if (/[ऀ-ॿ]/.test(text)) return 'hi'; // Devanagari (Hindi)
  return 'en';
}

const LANGUAGE_NAMES = { hi: 'Hindi', te: 'Telugu' };

const INSTRUCTION = (lang) =>
  `Translate this ${LANGUAGE_NAMES[lang]} construction site report into English. ` +
  'Reply with only the English translation, with no explanations or quotes. ' +
  'Keep every number and unit exactly as written.';

// Groq speaks the OpenAI chat format.
async function viaGroq(text, lang) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      temperature: 0,
      messages: [
        { role: 'system', content: INSTRUCTION(lang) },
        { role: 'user', content: text },
      ],
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Groq returned ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim();
}

async function viaGemini(text, lang) {
  const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const prompt = `${INSTRUCTION(lang)}\n\n${text}`;
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
  const providers = [
    [process.env.GROQ_API_KEY, 'Groq', viaGroq],
    [process.env.GEMINI_API_KEY, 'Gemini', viaGemini],
    [process.env.GOOGLE_TRANSLATE_KEY, 'Google Translate', viaGoogleTranslate],
  ];
  for (const [key, name, run] of providers) {
    if (!key) continue;
    try {
      const out = await run(text, lang);
      if (out) return { text: out, ok: true };
    } catch (err) {
      console.error(`${name} translation failed:`, err.message); // try the next provider
    }
  }
  return { text, ok: false };
}
