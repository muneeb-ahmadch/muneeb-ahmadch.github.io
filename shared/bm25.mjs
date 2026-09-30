// BM25 over the knowledge-base chunks (port of the when-not-to-use-ai demo's retriever, k1 1.4, b 0.75).
import { words, stem, STOP } from './text.mjs';

const toks = s => words(s).filter(w => !STOP.has(w)).map(stem);

export function buildBM25(docs, { k1 = 1.4, b = 0.75 } = {}) {
  const tf = docs.map(d => {
    const m = new Map();
    for (const t of toks(d)) m.set(t, (m.get(t) || 0) + 1);
    return m;
  });
  const len = tf.map(m => [...m.values()].reduce((a, c) => a + c, 0));
  const avg = len.reduce((a, c) => a + c, 0) / Math.max(1, len.length);
  const df = new Map();
  for (const m of tf) for (const t of m.keys()) df.set(t, (df.get(t) || 0) + 1);
  const N = docs.length;
  const idf = t => Math.log(1 + (N - (df.get(t) || 0) + 0.5) / ((df.get(t) || 0) + 0.5));
  return {
    score(query) {
      const q = [...new Set(toks(query))];
      return tf.map((m, i) => {
        let s = 0;
        for (const t of q) {
          const f = m.get(t);
          if (!f) continue;
          s += idf(t) * (f * (k1 + 1)) / (f + k1 * (1 - b + b * len[i] / avg));
        }
        return s;
      });
    },
  };
}
