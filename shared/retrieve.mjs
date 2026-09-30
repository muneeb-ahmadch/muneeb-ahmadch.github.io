// Hybrid retrieval: BM25 plus (when vectors exist) cosine, fused by reciprocal rank, plus an exact-intent
// boost when the question closely matches one of a note's listed questions.
import { buildBM25 } from './bm25.mjs';
import { contentStems, normalize } from './text.mjs';

// Questions compared as plain lowercase words, so "Who are you?" matches its listed question even with no content words.
const flat = s => normalize(s).replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let i = 0;
  for (const x of a) if (b.has(x)) i++;
  return i / (a.size + b.size - i);
}

export function makeRetriever(chunks) {
  const bm = buildBM25(chunks.map(c => `${c.title}. ${c.title}. ${(c.ask || []).join(' ')} ${c.text}`));
  const askSets = chunks.map(c => (c.ask || []).map(a => new Set(contentStems(a))));
  const askFlat = chunks.map(c => new Set((c.ask || []).map(flat)));
  // A listed question asked word for word scores 1; a content-word overlap scores at most 0.99, so it never ties one.
  const intent = q => {
    const qs = new Set(contentStems(q)), qf = flat(q);
    return askSets.map((list, i) => askFlat[i].has(qf) ? 1 : Math.min(0.99, Math.max(0, ...list.map(s => jaccard(qs, s)))));
  };
  return {
    bm25(q) { return bm.score(q); },
    retrieve(q, { cos = null, k = 6 } = {}) {
      const b = bm.score(q);
      const it = intent(q);
      const rank = arr => {
        const order = arr.map((s, i) => [s, i]).sort((x, y) => y[0] - x[0]);
        const r = new Array(arr.length);
        order.forEach(([, i], pos) => { r[i] = pos; });
        return r;
      };
      const rb = rank(b);
      const rc = cos ? rank(cos) : null;
      const fused = chunks.map((_, i) => 1 / (60 + rb[i]) + (rc ? 1 / (60 + rc[i]) : 0) + (it[i] >= 0.5 ? 0.05 * it[i] : 0) + (it[i] === 1 ? 0.05 : 0));
      const top = fused.map((s, i) => [s, i]).sort((x, y) => y[0] - x[0]).slice(0, k).map(([, i]) => i);
      return top.map(i => ({ ...chunks[i], bm25: b[i], cos: cos ? cos[i] : null, intent: it[i] }));
    },
  };
}

export function dot(a, ao, b, bo, dim) {
  let s = 0;
  for (let j = 0; j < dim; j++) s += a[ao + j] * b[bo + j];
  return s;
}
