// The output verifier: the real guardrail. The model's answer is shown only if every sentence is supported
// by the notes retrieved for this question. Hard failures reject the whole answer; soft failures drop a sentence.
import { normalize, words, stem, contentStems, numbers, properNouns, hasNegation, wordCount, GLUE } from './text.mjs';

export const MAX_WORDS = 120;
export const MAX_SENTENCES = 5;

// Phrases that never occur in the notes; seeing one means the model left the persona or leaked its setup.
export const PERSONA_BREAKS = [
  'as an ai language model', 'an ai language model', "i'm just an ai", 'i am just an ai', 'my instructions', 'my programming',
  'my system prompt', 'system prompt says', 'system prompt is', 'system message', 'my guidelines', 'i cannot comply', "i can't comply", 'developer mode',
  'do anything now', 'jailbroken', 'jailbreak mode', 'as a large', 'i was trained', 'my training data', 'openai policy',
  'meta platforms', 'nonce', '<<<', '>>>', 'note-', 'json', 'here is the answer', 'according to the notes',
  'the notes say', 'the note says', 'based on the notes', 'in the notes provided', 'the context provided',
];

const CONTACT = [
  /https?:\/\/|www\.|\b[a-z0-9-]+\.(com|io|net|org|dev|me|ai|co|pk)\b/i,
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
  /(?:\+|\b00)\d[\d\s().-]{7,}\d|\b\d{3,4}[\s-]\d{3}[\s-]\d{4}\b/,
  /(^|\s)@[a-z0-9_]{3,}/i,
];

function quoteSupport(quote, chunkText) {
  const q = words(quote), c = words(chunkText);
  if (q.length < 3) return 0;
  const cs = ' ' + c.join(' ') + ' ';
  if (cs.includes(' ' + q.join(' ') + ' ')) return 1;
  // Longest contiguous run of the quote inside the chunk, as a share of the quote.
  let best = 0;
  for (let i = 0; i < q.length; i++)
    for (let j = q.length; j > i + best; j--)
      if (cs.includes(' ' + q.slice(i, j).join(' ') + ' ')) { best = j - i; break; }
  return best / q.length;
}

export function verifyAnswer(out, retrieved) {
  const byId = new Map(retrieved.map(c => [c.id, c]));
  const sents = Array.isArray(out?.sentences) ? out.sentences : null;
  const report = { ok: false, hard: [], soft: [], kept: [], checks: { numbers: [0, 0], names: [0, 0], quotes: [0, 0], sentences: [0, 0] } };
  if (!sents) { report.hard.push('not-json'); return report; }
  if (sents.length === 0) { report.empty = true; return report; }
  if (sents.length > MAX_SENTENCES) report.hard.push('too-many-sentences');
  const fullText = sents.map(s => String(s?.text ?? '')).join(' ');
  if (wordCount(fullText) > MAX_WORDS) report.hard.push('too-long');
  const nt = normalize(fullText);
  for (const p of PERSONA_BREAKS) if (nt.includes(p)) report.hard.push('persona:' + p);
  for (const re of CONTACT) if (re.test(fullText)) report.hard.push('contact-or-url');

  // The source is the cited note id; tolerate "id: x" or "id=x", else the one note that contains the quote.
  const resolve = s => {
    const raw = String(s?.source ?? '').trim();
    if (byId.has(raw)) return byId.get(raw);
    const hit = retrieved.find(c => raw.includes(c.id));
    if (hit) return hit;
    const scored = retrieved.map(c => [quoteSupport(String(s?.quote ?? ''), c.text), c]).filter(([q]) => q >= 0.9);
    return scored.length === 1 ? scored[0][1] : null;
  };
  for (const [i, s] of sents.entries()) {
    const text = String(s?.text ?? '').trim();
    const src = resolve(s);
    const tag = `s${i + 1}`;
    report.checks.sentences[1]++;
    if (!text) { report.soft.push(tag + ':empty'); continue; }
    if (!src) { report.hard.push(tag + ':unknown-source'); continue; }
    // Numbers must appear in the retrieved notes.
    const srcFull = `${src.title}. ${src.text}`;
    const srcNums = numbers(srcFull);
    for (const n of numbers(text)) {
      report.checks.numbers[1]++;
      if (srcNums.has(n)) report.checks.numbers[0]++; else report.hard.push(`${tag}:number:${n}`);
    }
    // Names, products and places must appear in the retrieved notes.
    for (const p of properNouns(text)) {
      report.checks.names[1]++;
      const pw = words(p);
      const srcWords = new Set(words(srcFull)), srcStemSet = new Set(words(srcFull).map(stem));
      if (pw.every(w => srcWords.has(w) || srcStemSet.has(stem(w)))) report.checks.names[0]++;
      else report.hard.push(`${tag}:name:${p}`);
    }
    // The quote must come from the cited note, and must not flip its meaning.
    report.checks.quotes[1]++;
    const qs = quoteSupport(String(s?.quote ?? ''), src.text);
    if (qs >= 0.7) report.checks.quotes[0]++;
    const ref = qs >= 0.7 ? String(s.quote) : src.text;
    if (hasNegation(text) !== hasNegation(ref) && !(qs < 0.7 && hasNegation(src.text) && !hasNegation(text)))
      report.hard.push(`${tag}:negation`);
    // Every content word must be in the cited note (or be a neutral connecting word).
    const srcStems = new Set(contentStems(srcFull));
    const extra = contentStems(text).filter(w => !srcStems.has(w) && !GLUE.has(w));
    const thirdPerson = /\b(he|his|him|muneeb's)\b/i.test(text);
    if (qs < 0.7) report.soft.push(`${tag}:quote`);
    else if (extra.length) report.soft.push(`${tag}:unsupported:${extra.slice(0, 4).join(',')}`);
    else if (thirdPerson) report.soft.push(`${tag}:third-person`);
    else { report.kept.push({ text, source: src.id }); report.checks.sentences[0]++; }
  }
  report.ok = report.hard.length === 0 && report.kept.length > 0;
  return report;
}

// The fallback when the model is unavailable or its answer fails: my notes, verbatim.
export function extractive(retrieved) {
  const [a] = retrieved;
  return a ? [{ text: a.text, source: a.id }] : [];
}
