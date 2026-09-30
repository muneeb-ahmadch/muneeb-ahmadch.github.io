// The topic gate. Deterministic: regex rules first, then (on the Worker) nearest-neighbour over labelled
// example questions plus a floor on how well the notes match. No model decides what gets answered.
import { normalize, words } from './text.mjs';

export const MAX_CHARS = 500;

export const REPLIES = {
  personal: "I keep this page to professional questions. Ask me about my work, my method or what I offer.",
  contact: "I don't share contact details here. Upwork asks that we talk on the platform before a contract, so message me on Upwork and the real me will answer.",
  meta: "I'm an AI version of Muneeb with one job: answering professional questions from my notes. I won't change roles or show my setup, but the \"For your developer\" section on this page explains how I'm built.",
  offtopic: "That's outside what I answer here. I keep this chat to my work: my experiments, demos, method and what I offer.",
  code: "I don't write code or homework in this chat. It's here to answer questions about my work and what I offer.",
  sensitive: "I don't give opinions or advice on that here. Ask me about my work instead.",
  harmful: "I won't help with that.",
  others: "I only speak for myself here, and I don't name clients or discuss other people. Ask me about my own work.",
  nonenglish: "I answer in English on this page. Ask me about my work, my method or what I offer.",
  encoded: "I only answer plain questions here. Ask me about my work, my method or what I offer.",
  toolong: "Please keep questions under 500 characters.",
  empty: "Ask me about my work, my method or what I offer.",
  unknown: "I don't have that in my notes, so I won't guess. The real me answers on Upwork.",
  // A nearest-neighbour decline can't tell "off-topic" from "a work question my notes don't cover", so its reply is
  // honest for both.
  notcovered: "That isn't in my notes, so I won't guess. I keep this chat to my work: my experiments, demos, method and what I offer.",
  // Small talk gets one fixed reply each, so "hey" is answered the same way every time.
  hello: "Hi! Ask me about my work: what I've measured, how I'd fix your support bot, or what I charge.",
  thanks: "You're welcome. Ask me anything else about my work, or message the real me on Upwork.",
  ack: "Ask me about my work: what I've measured, how I'd fix your support bot, or what I charge.",
};

const RULES = [
  ['contact', /\b(e-?mail|gmail|outlook\.com|phone|cell ?number|mobile number|your number|whats ?app|telegram|skype|signal app|linked ?in|instagram|insta\b|facebook|twitter|x\.com|discord|contact (details|info|information)|reach you (off|outside)|off[- ]upwork|outside (of )?upwork|off (the )?platform|home address|your address|calendly|zoom link|meet link)\b/i],
  ['meta', /\b(ignore|disregard|forget|override|bypass)\b[^.?!]{0,60}\b(instruction|instructions|rules?|prompt|above|previous|prior|guidelines?|polic(y|ies)|restrictions?)\b/i],
  ['meta', /\b(you were told|everything (above|before)|(have|with|there are) no rules|no rules|you are (chatgpt|gpt|claude|gemini|llama|an? (ai|assistant|bot|chatbot) (now|that|without|with no))|answer anything|say anything|prompt you were given|what (were|are) you (told|instructed)|system (prompt|message|instructions?)|your (instructions|rules|guidelines|configuration|setup prompt)|your (system |hidden |initial )?prompt\b(?! injection)|hidden prompt|initial prompt|pre-?prompt|developer mode|dev mode|god mode|\bdan\b|do anything now|jail ?break(?!ed|ing|s)|jailbreak (it|this|you)|pretend (to be|you are|you're|that you)|role-?play|act as (an?|my|if)\b|you are now\b|from now on,? you|repeat (the |everything )?(text|words|above|everything)|print (everything|your|the text)|word for word|verbatim|without (any )?(rules|restrictions|filters)|no restrictions|unrestricted|unfiltered|what rules were you given|what are you not allowed)/i],
  ['harmful', /\b(hack(ing)? (a|into|the)|malware|ransomware|keylogger|phishing|ddos|bomb|explosive|weapon|scam|steal|stolen|credit card numbers?|bypass upwork|avoid (paying )?(upwork )?fees|avoid paying tax|evade tax|fake reviews?|launder)\b/i],
  ['personal', /\b(how old|your age|date of birth|birthday|married|wife|husband|girlfriend|boyfriend|single\??$|dating|kids|children|your (family|parents|father|mother|brother|sister)|religion|religious|muslim|christian|atheist|pray|your salary|how much do you (make|earn)|your income|net worth|hobbies|weekends?|favou?rite (food|movie|colou?r|song|book)|what car|your health|are you (sick|healthy)|where exactly|which street|home town|personal life|something personal|how tall|your height|your weight|star sign|zodiac|horoscope|do you (smoke|drink|vape)|seeing anyone|in a relationship|relationship status|your (mum|mom|dad|son|daughter|wife's|husband's)|mum's|mom's|dad's|crush|are you (cute|handsome|pretty))\b/i],
  ['sensitive', /\b(election|vote|voting|politic|government|prime minister|president of|israel|palestin|abortion|is god|god real|medicine|medical advice|headache|flu\b|diagnos(e|is) (me|my)|legal advice|lawyer|invest(ing|ment)? (in|advice)|stocks?\b|crypto|bitcoin|taxes|\bwar\b|military|ibuprofen|paracetamol|dosage|symptoms?|therapy|depress)\b/i],
  ['code', /\b(write (me )?(a|an|my) (python|javascript|js|sql|java|c\+\+|react|script|function|program|essay|cover letter|homework|poem|story|song|love letter|letter|email to|tweet|blog)|build me (a|an)|make me (a|an) (app|website|script)|code (me|for me)|debug (this|my)|fix my (css|code|html)|leetcode|homework|solve this)\b/i],
  ['offtopic', /(\b(capital of|weather|world cup|recipe|poem|haiku|limerick|joke|funny story|meaning of life|movie|translate|quantum|richest|bitcoin price|price of bitcoin|best phone|news today|squared|times \d|holiday|vacation|travel destination|who (painted|wrote|invented|discovered)|love letter)\b|\b\d+ ?[-+*/x×^] ?\d+ ?[=?]?\s*$)/i],
  ['others', /\b(your (boss|manager)|other freelancers|competitors?|elon musk|is (openai|google|microsoft|anthropic) better|name (your|the) clients|your clients at|clients did you have|which companies did)\b/i],
];

export function ruleGate(q) {
  const raw = String(q ?? '');
  const text = raw.trim();
  if (!text) return { decision: 'declined', cat: 'empty', by: 'rule' };
  if (text.length > MAX_CHARS) return { decision: 'declined', cat: 'toolong', by: 'rule' };
  // Encoded payloads: long unbroken base64/hex runs.
  if (/[A-Za-z0-9+/]{24,}={0,2}/.test(text.replace(/https?:\/\/\S+/g, '')) && !/\s/.test(text.slice(0, 40)) ||
      /\b[0-9a-f]{32,}\b/i.test(text) || /(?:\\x[0-9a-f]{2}){6,}|(?:%[0-9a-f]{2}){6,}/i.test(text))
    return { decision: 'declined', cat: 'encoded', by: 'rule' };
  // Non-English: non-Latin scripts, or accented letters / inverted punctuation typical of other languages.
  const letters = text.match(/\p{L}/gu) || [];
  const nonAscii = letters.filter(c => c > '\u007f').length;
  if (letters.length && (nonAscii / letters.length > 0.15 || /[¿¡]/.test(text) || (nonAscii >= 1 && /[àâçéèêëîïôûùüÿñæœáíóú]/i.test(text))))
    return { decision: 'declined', cat: 'nonenglish', by: 'rule' };
  const n = normalize(text);
  for (const [cat, re] of RULES) if (re.test(n)) return { decision: 'declined', cat, by: 'rule' };
  return null;
}

// Small talk: a message made only of greetings, thanks or acknowledgements (plus filler like "there" or a name).
// Checked after ruleGate, so "hi, what's your email?" is still a contact decline. Never reaches the model.
const SMALL = [
  ['hello', /^(?:h+i+|h+e+l+o+|he+y+|heya|hiya|yo+|sup|wass?up|whats ?up|howdy|greetings|salaa?m|(?:as+)?salaa?m(?: ?[uo])? ?(?:wa ?)?[ao]?lai?kum|aoa|good (?:morning|afternoon|evening|day)|how are (?:you|u|things)(?: doing| today)?|how r u|hows it going|hows everything|anyone (?:there|home)|you there|test(?:ing)?)(?= |$)/],
  ['thanks', /^(?:thank (?:you|u)|thanks?|thanx|thx|ty|cheers|much appreciated|appreciate (?:it|that)|good ?bye|bye+|see (?:you|ya)(?: later)?|cya|take care|thats (?:all|it)|have a (?:good|nice|great) (?:day|one))(?= |$)/],
  ['ack', /^(?:ok(?:ay)?|k+|cool|nice|great|awesome|perfect|sounds good|all ?right|got it|lol|haha+|hmm+|wow|interesting|fine|sure|yes|yeah|yep|no|nope|oh|ah|i see)(?= |$)/],
  ['', /^(?:there|muneeb|ahmad|clone|bot|buddy|bro|man|mate|sir|everyone|all|again|so much|very much|a lot|lots|then|and|dear|friend|today|guys|folks)(?= |$)/],
];

export function smallTalk(q) {
  if (/[^\u0000-\u007f\u2018-\u201d]/u.test(String(q ?? '').replace(/\p{Extended_Pictographic}|\ufe0f/gu, ''))) return null;
  let s = String(q ?? '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (s.length > 80) return null;
  const kinds = new Set();
  while (s) {
    const hit = SMALL.find(([, re]) => re.test(s));
    if (!hit) return null;
    if (hit[0]) kinds.add(hit[0]);
    s = s.replace(hit[1], '').trim();
  }
  return kinds.has('thanks') ? 'thanks' : kinds.has('hello') ? 'hello' : 'ack';
}

// Nearest-neighbour gate over labelled example questions (Worker, embeddings).
// sims: cosine of the question to each exemplar; ex: [{label, cat}]; kbMax: best cosine to any note.
export const GATE = { minDeclineSim: 0.72, margin: 0.04, kbFloor: 0.52, kbFloorFollowup: 0.48 };

export function knnGate(sims, ex, kbMax, { followup = false } = {}) {
  let bestAllow = -1, bestDecl = -1, declCat = null;
  sims.forEach((s, i) => {
    if (ex[i].label === 'allowed') { if (s > bestAllow) bestAllow = s; }
    else if (s > bestDecl) { bestDecl = s; declCat = ex[i].cat; }
  });
  if (bestDecl >= GATE.minDeclineSim && bestDecl - bestAllow >= GATE.margin)
    return { decision: 'declined', cat: declCat, by: 'knn', bestAllow, bestDecl, kbMax };
  if (kbMax < (followup ? GATE.kbFloorFollowup : GATE.kbFloor))
    return { decision: 'unknown', cat: 'unknown', by: 'kb-floor', bestAllow, bestDecl, kbMax };
  return { decision: 'allowed', by: 'knn', bestAllow, bestDecl, kbMax };
}

// Browser-only fallback gate when the Worker is unreachable: rules, then a BM25 floor.
export const BM25_FLOOR = 4.0;

export function isFollowup(q) {
  const w = words(q);
  return w.length <= 7 || /\b(that|it|this|those|them|these|he|she|they|the same|and what|what about|how about|more|else)\b/i.test(q);
}
