// The output verifier: the real guardrail. The model's answer is shown only if every sentence is supported
// by the notes retrieved for this question. Hard failures reject the whole answer; soft failures drop a sentence.
import { normalize, words, stem, contentStems, numbers, properNouns, hasNegation, wordCount, sentences, GLUE } from './text.mjs';

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

// Does a verified answer actually answer the question? Every sentence can be true and still mislead as an answer
// ("How many people were on your team?" → "I work alone."). These checks turn such answers into "not in my notes".
const HOW_MANY = /\bhow many\s+(?:of\s+)?(?:your\s+|the\s+)?([a-z-]+)/i;
const NUMERIC_Q = /\b(how many|how much|how long|how old|how big|how often|what year|which year|when did|what (?:was |is )?(?:the |your )?(?:score|rank|ranking|percentage|accuracy|salary|gpa|revenue)|score|ranking|gpa|salary|revenue|stars|reputation|accuracy)\b/i;
const ZERO = /\b(no|none|zero|not yet|never)\b/i;
const SUPERLATIVE = /\b(most|least|best|worst|highest|lowest|favou?rite|biggest|largest|smallest)\b/i;
const ENTITY_Q = /^\s*(?:which|who)\b|^\s*what (?:company|companies|client|clients|model|llm|framework|frameworks|tool|tools|database|cloud|university|spec|language|languages)\b|\bname (?:the|your|three|two|a)\b/i;

export function questionFit(q, kept, retrieved) {
  const answer = kept.map(s => s.text).join(' ');
  const cited = retrieved.filter(c => kept.some(s => s.source === c.id)).map(c => `${c.title}. ${c.text}`).join(' ');
  const notes = retrieved.map(c => `${c.title}. ${c.text}`).join(' ');
  const noteWords = new Set(words(notes).map(stem));
  // 1. A named thing in the question that none of the retrieved notes mention.
  const qNames = [...properNouns(q)].filter(n => words(n).every(w => w.length > 1));
  const missing = qNames.filter(n => !words(n).every(w => noteWords.has(stem(w))));
  if (missing.length) return { ok: false, why: 'not-in-notes:' + missing.join(',') };
  // 2. A number is asked for: the answer must give one about the thing asked (or say none).
  if (NUMERIC_Q.test(q)) {
    const qNums = numbers(q);
    const hm = q.match(HOW_MANY);
    const noun = hm ? stem(hm[1].toLowerCase()) : null;
    const sents = sentences(answer);
    const good = sents.some(s => {
      const hasNum = [...numbers(s)].some(n => !qNums.has(n)) || ZERO.test(s);
      return hasNum && (!noun || words(s).map(stem).includes(noun));
    });
    if (!good) return { ok: false, why: 'no-number-for-question' };
  }
  // 3. A comparison is asked for: the cited notes must make it.
  const sup = q.match(SUPERLATIVE);
  if (sup && !new RegExp(`\\b${sup[1]}\\b`, 'i').test(cited)) return { ok: false, why: 'comparison-not-in-notes' };
  // 4. A named thing is asked for: the answer must name something the question did not.
  if (ENTITY_Q.test(q)) {
    const qw = new Set(words(q).map(stem));
    const fresh = [...properNouns(answer)].some(n => words(n).some(w => !qw.has(stem(w)))) || [...numbers(answer)].some(n => !numbers(q).has(n));
    if (!fresh) return { ok: false, why: 'no-named-answer' };
  }
  return { ok: true };
}
