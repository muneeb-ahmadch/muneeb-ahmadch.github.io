// Text utilities shared by the browser, the Worker and the tests. No dependencies.

export function normalize(s) {
  return String(s ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[‘’‛′]/g, "'")
    .replace(/[“”‟″]/g, '"')
    .replace(/[‐-―−]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

// Words for matching: letters/digits, keeps $ . % inside numbers, splits everything else.
export function words(s) {
  return normalize(s)
    .replace(/n't\b/g, ' not')
    .replace(/'(s|re|ve|ll|d|m)\b/g, ' ')
    .replace(/[^a-z0-9.$%+]+/g, ' ')
    .split(' ')
    .map(w => w.replace(/^[.+]+|[.+]+$/g, ''))
    .filter(Boolean);
}

export function stem(w) {
  if (w.length <= 3 || /\d/.test(w)) return w;
  if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y';
  if (w.endsWith('ing') && w.length > 5) return w.slice(0, -3);
  if (w.endsWith('ed') && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('ly') && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('es') && w.length > 4 && /(ss|sh|ch|x|z)es$/.test(w)) return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) return w.slice(0, -1);
  return w;
}

export const STOP = new Set(`a an the and or but if then than so as of in on at to for from by with without into onto over under
about above below after before between through during within across per via up down out off again further once here there
when where why how what which who whom whose this that these those it its itself is am are was were be been being have has
had having do does did doing done will would shall should can could may might must i me my mine myself we us our ours you
your yours yourself he him his she her they them their theirs what's also just only very too more most much many some any
all both each every either neither few other such own same s t not no nor ever yet still even already let lets`.split(/\s+/));

// Words the model may use to join facts without adding a claim.
export const GLUE = new Set(`yes sure okay ok well usually typically generally normally often sometimes always first second third
then next finally also including include includes example instance such kind type way ways thing things part parts help helps
helped work works worked working use uses used using make makes made get gets got need needs want wants like happy glad
answer answers answered question questions ask asked tell told show shows showed share shared give gives given provide
provides offer offers offered send look see check checks try tried keep kept start starts started run runs ran find found
build built fix fixed fixes result results case cases problem problems approach approaches mean means called note notes
say says said currently now today recent recently mostly main mainly key important specific specifically directly clear
simple simply plain short small real actual actually exactly available happy`.split(/\s+/).map(stem));

export const NEGATIONS = new Set(['not', 'no', 'never', 'none', 'nothing', 'nobody', 'without', 'cannot', 'neither', 'nor', "won't", "don't"]);

export function contentStems(s) {
  return words(s).filter(w => !STOP.has(w) && !/^\$?\d/.test(w)).map(stem).filter(w => w.length > 1);
}

export function hasNegation(s) {
  return words(s).some(w => NEGATIONS.has(w));
}

const NUMBER_WORDS = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11,
  twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100,
  thousand: 1000, dozen: 12, half: 0.5, first: 1, second: 2, third: 3, fourth: 4, fifth: 5, once: 1, twice: 2,
  single: 1, double: 2,
};

// Every number a text states, normalised: "$0.002174" -> "0.002174", "1,820" -> "1820", "2.1 s" -> "2.1",
// "1.32x" -> "1.32", "n=50" -> "50", "0.255%" -> "0.255", "UTC+5" -> "5", "eight" -> "8".
export function numbers(s) {
  const out = new Set();
  const t = normalize(s).replace(/(\d),(\d{3})/g, '$1$2');
  for (const m of t.matchAll(/\d+(?:\.\d+)?/g)) out.add(String(Number(m[0])));
  for (const w of words(t)) if (w in NUMBER_WORDS) out.add(String(NUMBER_WORDS[w]));
  return out;
}

// Capitalised tokens that are not sentence-initial and not "I": names, products, places.
export function properNouns(s) {
  const out = new Set();
  const parts = String(s).split(/(?<=[.!?:])\s+/);
  for (const p of parts) {
    // Whole tokens only, so "8B" or "3.1" never yields a stray letter; numbers are checked separately.
    const toks = (p.match(/[A-Za-z0-9][A-Za-z0-9.+#'’-]*/g) || []).map(t => t.replace(/['’]s$/, '').replace(/[.'’-]+$/, ''));
    toks.forEach((tok, i) => {
      if (i === 0 || tok === 'I' || !/^[A-Za-z]/.test(tok)) return;
      if (/^[A-Z]/.test(tok) || /[A-Z].*[A-Z]/.test(tok)) out.add(tok.toLowerCase());
    });
  }
  return out;
}

export function sentences(s) {
  return String(s).split(/(?<=[.!?])\s+(?=[A-Z0-9"'(])/).map(x => x.trim()).filter(Boolean);
}

export function wordCount(s) {
  return String(s).trim().split(/\s+/).filter(Boolean).length;
}

export async function sha256hex(s) {
  const data = new TextEncoder().encode(s);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
