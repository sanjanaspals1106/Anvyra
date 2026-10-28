// Meaning score: sentence embeddings from Xenova/all-MiniLM-L6-v2 (runs locally, no API key).
// The model is loaded once (singleton) and every text's vector is cached.

let extractorPromise = null;
const cache = new Map(); // text -> Float32Array (384 numbers, length 1)

function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = import('@xenova/transformers')
      .then(({ pipeline, env }) => {
        env.allowLocalModels = false;
        return pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      })
      .catch((err) => {
        console.error('Could not load the embedding model, using word overlap instead:', err.message);
        return null;
      });
  }
  return extractorPromise;
}

// Call at server start so the first real request is fast.
export const warmUp = () => getExtractor();

async function embed(texts) {
  const extractor = await getExtractor();
  if (!extractor) return null;
  const missing = [...new Set(texts)].filter((t) => !cache.has(t));
  if (missing.length) {
    const out = await extractor(missing, { pooling: 'mean', normalize: true });
    const size = out.dims[1];
    missing.forEach((t, i) => cache.set(t, out.data.slice(i * size, (i + 1) * size)));
  }
  return texts.map((t) => cache.get(t));
}

const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);

// Rescale cosine so unrelated text is about 0 and a close match is about 1.
const LOW = 0.2;
const HIGH = 0.7;
const rescale = (cos) => Math.max(0, Math.min(1, (cos - LOW) / (HIGH - LOW)));

// Fallback if the model is not available: share of shared words.
function wordOverlap(a, b) {
  const A = new Set(a.split(/\W+/).filter(Boolean));
  const B = new Set(b.split(/\W+/).filter(Boolean));
  if (!A.size || !B.size) return 0;
  return [...A].filter((w) => B.has(w)).length / Math.min(A.size, B.size);
}

// Returns one 0-1 score per target: how close the part's meaning is to the target text.
export async function meaningScores(partText, targets) {
  if (!partText.trim()) return targets.map(() => 0);
  const vectors = await embed([partText, ...targets]);
  if (!vectors) return targets.map((t) => wordOverlap(partText, t));
  const [p, ...rest] = vectors;
  return rest.map((v) => rescale(dot(p, v)));
}
