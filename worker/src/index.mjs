// The clone's proxy: bot check, rules, topic gate, retrieval, quota, injection classifier, generation, verifier.
// Every path that fails ends in one of two safe places: a fixed reply, or my notes verbatim.
import INDEX from '../../kb/index.json';
import VECS from '../../kb/index.bin';
import { ruleGate, smallTalk, knnGate, REPLIES, isFollowup } from '../../shared/gate.mjs';
import { makeRetriever, dot } from '../../shared/retrieve.mjs';
import { verifyAnswer, extractive, questionFit } from '../../shared/verify.mjs';
import { buildMessages, parseModelJson, CATEGORIES } from '../../shared/prompt.mjs';
import { sha256hex } from '../../shared/text.mjs';
export { Quota } from './quota.mjs';

const V = new Float32Array(VECS);
const D = INDEX.dim, CH = INDEX.chunks, EX = INDEX.exemplars, NC = CH.length, NE = EX.length;
const retriever = makeRetriever(CH);
const MODEL = '@cf/meta/llama-3.1-8b-instruct-fp8-fast';
const EMBED = '@cf/baai/bge-small-en-v1.5';
// Notes are shown verbatim after a rejected draft only when the top note clearly matches the question
// (set 1 Oct 2026 from the eval set: no unanswerable question reached 0.75; 16 of 40 answerable did).
const STRONG_MATCH = 0.75;
const enc = new TextEncoder();

const withTimeout = (p, ms, label) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(label + ' timeout')), ms))]);

function cors(origin, env) {
  const ok = env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).includes(origin);
  return ok ? { 'access-control-allow-origin': origin, 'vary': 'Origin', 'access-control-allow-methods': 'POST, GET, OPTIONS', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '600' } : null;
}

async function hmac(key, msg) {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', k, enc.encode(msg));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function ipPrefix(ip) {
  if (!ip) return 'unknown';
  if (ip.includes(':')) return ip.split(':').slice(0, 3).join(':') + '::/48';
  return ip.split('.').slice(0, 3).join('.') + '.0/24';
}

async function embed(env, texts) {
  const r = await withTimeout(env.AI.run(EMBED, { text: texts, pooling: 'cls' }), 6000, 'embed');
  return r.data.map(v => { let n = 0; for (const x of v) n += x * x; n = Math.sqrt(n) || 1; return Float32Array.from(v, x => x / n); });
}

const cosTo = (q, offset, count) => Array.from({ length: count }, (_, i) => dot(q, 0, V, (offset + i) * D, D));

async function turnstileOk(env, token, q, ip) {
  if (!token || typeof token !== 'string' || token.length > 2048) return false;
  const form = new FormData();
  form.append('secret', env.TURNSTILE_SECRET);
  form.append('response', token);
  if (ip) form.append('remoteip', ip);
  const r = await withTimeout(fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form }), 5000, 'turnstile');
  const j = await r.json();
  if (!j.success) return false;
  if (env.DEV === '1') return true;
  const hosts = env.TURNSTILE_HOSTNAMES.split(',').map(s => s.trim());
  return hosts.includes(j.hostname) && j.cdata === (await sha256hex(q)).slice(0, 32);
}

async function promptGuard(env, q) {
  if (!env.GROQ_KEY) return { status: 'skipped' };
  const call = () => withTimeout(fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'authorization': `Bearer ${env.GROQ_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'meta-llama/llama-prompt-guard-2-86m', messages: [{ role: 'user', content: q }] }),
  }), 4000, 'guard');
  let r = await call();
  if (r.status === 429) { // free tier: 30 requests a minute; one short retry, then fail closed
    const wait = Math.min(3000, 1000 * (parseFloat(r.headers.get('retry-after')) || 1.5));
    await new Promise(res => setTimeout(res, wait));
    r = await call();
  }
  if (!r.ok) throw new Error('guard http ' + r.status);
  const j = await r.json();
  const content = String(j?.choices?.[0]?.message?.content ?? '').trim();
  const num = parseFloat(content);
  const score = Number.isFinite(num) ? num : /malicious|jailbreak|injection|unsafe/i.test(content) ? 1 : 0;
  return { status: 'ok', score, malicious: score >= 0.5, ...(env.DEV === '1' ? { raw: content.slice(0, 80) } : {}) };
}

function sourcesFor(ids) {
  return ids.map(id => CH.find(c => c.id === id)).filter(Boolean).map(c => ({ id: c.id, title: c.title, url: c.url || null }));
}

async function handleAsk(req, env, emit) {
  const ip = req.headers.get('cf-connecting-ip') || '';
  let body;
  try { body = await req.json(); } catch { return emit({ t: 'final', mode: 'error', reply: 'Bad request.' }); }
  const q = typeof body?.q === 'string' ? body.q.trim() : '';
  const final = async (mode, extra = {}) => {
    const a = (extra.sentences || []).map(s => s.text).join(' ') || extra.reply || '';
    const mac = env.MAC_KEY && q ? await hmac(env.MAC_KEY, q + '\n' + a) : null;
    return emit({ t: 'final', mode, mac, ...extra, sources: sourcesFor((extra.sentences || []).map(s => s.source)) });
  };

  // 1. Bot check, one single-use token per question, bound to the question text.
  emit({ t: 'stage', stage: 'bot-check', status: 'run' });
  let human = false;
  try { human = await turnstileOk(env, body?.token, q, ip); } catch { human = false; }
  emit({ t: 'stage', stage: 'bot-check', status: human ? 'ok' : 'fail' });
  if (!human) return final('blocked', { reply: 'The bot check did not pass. Refresh the page and try again.' });

  // 2. Rules: length, encodings, other languages, contact, role changes, personal, off-topic.
  const rule = ruleGate(q);
  emit({ t: 'stage', stage: 'rules', status: rule ? 'declined' : 'ok', detail: rule?.cat });
  if (rule) return final('declined', { cat: rule.cat, by: 'rules', reply: REPLIES[rule.cat] });
  // Greetings, thanks and "ok": one fixed reply each, no model, never part of the conversation history.
  const talk = smallTalk(q);
  if (talk) return final('hello', { cat: talk, reply: REPLIES[talk] });

  // 3. Earlier turns are used only if they carry this Worker's signature (the client cannot rewrite them).
  const history = [];
  if (Array.isArray(body.history) && env.MAC_KEY) {
    for (const h of body.history.slice(-2)) {
      if (typeof h?.q !== 'string' || typeof h?.a !== 'string' || typeof h?.mac !== 'string') continue;
      if (h.q.length > 500 || h.a.length > 1500) continue;
      if ((await hmac(env.MAC_KEY, h.q + '\n' + h.a)) === h.mac && !ruleGate(h.q)) history.push({ q: h.q, a: h.a });
    }
  }
  // A question my notes were written to answer is read on its own, so it gets the same answer whatever came before.
  const exact = retriever.retrieve(q, { k: 1 })[0]?.intent >= 0.8;
  const followup = history.length > 0 && !exact && isFollowup(q);
  const rq = followup ? `${history.at(-1).q} ${q}` : q;

  // 4. Topic gate: nearest labelled example questions, and how well my notes match at all.
  emit({ t: 'stage', stage: 'gate', status: 'run' });
  let qv, rv;
  try { [qv, rv] = await embed(env, followup ? [q, rq] : [q]); rv = rv || qv; } catch { return final('error', { reply: 'Something went wrong on my side. Try again in a moment.' }); }
  const cosChunks = cosTo(rv, 0, NC);
  const kbMax = Math.max(...cosChunks);
  const g = knnGate(cosTo(qv, NC, NE), EX, kbMax, { followup });
  emit({ t: 'stage', stage: 'gate', status: g.decision, detail: g.cat, score: Number(kbMax.toFixed(3)) });
  if (g.decision === 'declined') {
    const clear = ['personal', 'contact', 'meta', 'harmful'].includes(g.cat);
    return final('declined', { cat: g.cat, by: 'gate', reply: clear ? REPLIES[g.cat] : REPLIES.notcovered });
  }

  // 5. Retrieval from this Worker's own index (the client's retrieval is display only).
  const top = retriever.retrieve(rq, { cos: cosChunks, k: 6 });
  emit({ t: 'stage', stage: 'retrieve', status: 'ok', notes: top.map(c => ({ id: c.id, title: c.title })) });
  if (g.decision === 'unknown') return final('unknown', { reply: REPLIES.unknown, suggest: top.slice(0, 3).map(c => c.title) });
  // The question is one my notes were written to answer: the note itself is the best answer, and needs no model.
  if (exact && top[0].intent >= 0.8) return final('extractive', { sentences: extractive(top), reason: 'exact-match' });

  // 6. Quota: counts only turns that reach the model; any failure means no model, and my notes instead.
  emit({ t: 'stage', stage: 'quota', status: 'run' });
  let quota;
  try {
    // `wrangler dev --remote` cannot run Durable Objects; dev runs skip the counter, production never does.
    if (env.DEV === '1' && env.DEV_SKIP_QUOTA === '1') throw Object.assign(new Error('skip'), { skip: true });
    const stub = env.QUOTA.get(env.QUOTA.idFromName('global'));
    quota = await withTimeout(stub.consume(ipPrefix(ip), { daily: +env.DAILY_LLM, hourly: +env.HOURLY_LLM, prefixDaily: +env.PREFIX_DAILY, prefixBurst: +env.PREFIX_BURST }), 1500, 'quota');
  } catch (e) { quota = e?.skip ? { ok: true, reason: 'dev-skip' } : { ok: false, reason: 'unavailable' }; }
  emit({ t: 'stage', stage: 'quota', status: quota.ok ? 'ok' : 'limit', detail: quota.reason });
  if (!quota.ok) return final('quota', { sentences: extractive(top), reason: quota.reason });

  // 7. Injection classifier (Llama Prompt Guard 2, 86M).
  emit({ t: 'stage', stage: 'guard', status: 'run' });
  let guard;
  try { guard = await promptGuard(env, q); } catch { guard = { status: 'error' }; }
  emit({ t: 'stage', stage: 'guard', status: guard.status === 'ok' ? (guard.malicious ? 'declined' : 'ok') : guard.status, score: guard.score, ...(guard.raw !== undefined ? { raw: guard.raw } : {}) });
  // The classifier also flags questions that are ABOUT injection (my own specialty). Those get my notes verbatim,
  // never the model; anything else it flags is declined.
  if (guard.malicious) {
    if (/\b(prompt[- ]injection|injection|jailbreak\w*|guardrails?|red[- ]?team\w*|poison\w*|attacks?)\b/i.test(q))
      return final('extractive', { sentences: extractive(top), reason: 'injection-suspected' });
    return final('declined', { cat: 'meta', by: 'guard', reply: REPLIES.meta });
  }
  if (guard.status === 'error') return final('extractive', { sentences: extractive(top), reason: 'guard-unavailable' });

  // 8. The writer: an open 8B model, temperature 0, sees only the retrieved notes.
  emit({ t: 'stage', stage: 'write', status: 'run' });
  // The delimiter is secret (keyed hash) but fixed per question, so the same question gets the same prompt and answer.
  const nonce = env.MAC_KEY ? (await hmac(env.MAC_KEY, 'delim\n' + q)).slice(0, 12) : crypto.randomUUID().slice(0, 12);
  const messages = buildMessages({ q, notes: top, history, nonce });
  let out = null;
  for (let attempt = 0; attempt < 2 && !out; attempt++) {
    try {
      const r = await withTimeout(env.AI.run(MODEL, { messages, max_tokens: 380, temperature: 0 }), 20000, 'write');
      const text = typeof r?.response === 'string' ? r.response : r?.choices?.[0]?.message?.content ?? r?.response ?? r;
      out = parseModelJson(text);
    } catch { out = null; }
  }
  emit({ t: 'stage', stage: 'write', status: out ? 'ok' : 'fail' });
  if (!out) return final('extractive', { sentences: extractive(top), reason: 'writer-unavailable' });

  // 9. The model may only decline more: a non-professional category ends in a fixed reply.
  const cat = String(out.category || '').toLowerCase();
  if (CATEGORIES.includes(cat) && cat !== 'professional')
    return final('declined', { cat, by: 'model', reply: ['personal', 'contact', 'meta', 'harmful'].includes(cat) ? REPLIES[cat] : REPLIES.notcovered });

  // 10. The verifier: every sentence must be supported by the note it cites.
  const rep = verifyAnswer(out, top);
  emit({ t: 'stage', stage: 'verify', status: rep.ok ? 'ok' : rep.empty ? 'empty' : 'fail', checks: rep.checks, dropped: rep.soft.length, hard: rep.hard.length, ...(env.DEV === '1' ? { debug: { out, hard: rep.hard, soft: rep.soft } } : {}) });
  if (rep.empty) return final('unknown', { reply: REPLIES.unknown, suggest: top.slice(0, 3).map(c => c.title) });
  if (!rep.ok) {
    const reason = rep.hard.length ? 'verifier-rejected' : 'unsupported';
    if ((top[0].cos ?? 0) >= STRONG_MATCH || top[0].intent >= 0.5) return final('extractive', { sentences: extractive(top), reason });
    return final('unknown', { reply: REPLIES.unknown, suggest: top.slice(0, 3).map(c => c.title), reason });
  }
  // 11. The answer has to answer the question asked, not a neighbouring one.
  const fit = questionFit(q, rep.kept, top);
  emit({ t: 'stage', stage: 'fit', status: fit.ok ? 'ok' : 'fail', detail: fit.why });
  if (!fit.ok) return final('unknown', { reply: REPLIES.unknown, suggest: top.slice(0, 3).map(c => c.title), reason: fit.why });
  // A sentence cut at max length can end in a comma; close it cleanly.
  const tidy = rep.kept.map(k => ({ ...k, text: k.text.replace(/[,;:\s]+$/, '').replace(/([^.!?])$/, '$1.') }));
  return final('llm', { sentences: tidy, checks: rep.checks, dropped: rep.soft.length });
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const origin = req.headers.get('origin') || '';
    const ch = cors(origin, env);
    if (req.method === 'OPTIONS') return ch ? new Response(null, { status: 204, headers: ch }) : new Response(null, { status: 403 });
    if (url.pathname === '/health') return Response.json({ ok: true, notes: NC }, { headers: ch || {} });
    if (url.pathname === '/embed' && env.DEV === '1' && req.method === 'POST') {
      const { texts } = await req.json();
      const vecs = await embed(env, texts);
      return Response.json({ vectors: vecs.map(v => Array.from(v)) });
    }
    if (url.pathname !== '/ask' || req.method !== 'POST') return new Response('Not found', { status: 404 });
    if (!ch) return new Response('Forbidden', { status: 403 });
    if (+(req.headers.get('content-length') || 0) > 8192) return new Response('Too large', { status: 413, headers: ch });
    const { readable, writable } = new TransformStream();
    const w = writable.getWriter();
    const emit = ev => w.write(enc.encode(JSON.stringify(ev) + '\n'));
    ctx.waitUntil((async () => {
      try { await handleAsk(req, env, emit); }
      catch { await emit({ t: 'final', mode: 'error', reply: 'Something went wrong on my side. Try again in a moment.' }); }
      finally { await w.close(); }
    })());
    return new Response(readable, { headers: { ...ch, 'content-type': 'application/x-ndjson', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
  },
};
