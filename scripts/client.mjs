// Minimal client for the Worker, used by the red team and the eval. Dev Turnstile keys accept any token.
export async function askOnce(base, q, history = [], { origin = 'http://localhost:8766', token = 'XXXX.DUMMY.TOKEN.XXXX' } = {}) {
  const res = await fetch(base.replace(/\/$/, '') + '/ask', {
    method: 'POST', headers: { 'content-type': 'application/json', origin },
    body: JSON.stringify({ q, token, history }),
  });
  const text = await res.text();
  const events = text.trim().split('\n').filter(Boolean).map(l => JSON.parse(l));
  const final = events.find(e => e.t === 'final') || { mode: 'error', reply: `http ${res.status}` };
  return { final, stages: events.filter(e => e.t === 'stage') };
}
export const shownText = f => (f.sentences || []).map(s => s.text).join(' ') || f.reply || '';
