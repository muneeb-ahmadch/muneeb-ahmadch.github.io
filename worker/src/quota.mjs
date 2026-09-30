// One global counter object. Counts only turns that reach the model. Resets at 00:00 UTC, when the
// Workers AI free allocation resets.
import { DurableObject } from 'cloudflare:workers';

export class Quota extends DurableObject {
  async consume(prefix, lim) {
    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    const hour = now.toISOString().slice(0, 13);
    const burst = Math.floor(now.getTime() / 600000);
    const st = this.ctx.storage;
    if ((await st.get('day')) !== day) { await st.deleteAll(); await st.put('day', day); }
    const k = { d: 'd', h: 'h:' + hour, p: 'p:' + prefix, b: `b:${burst}:${prefix}` };
    const m = await st.get(Object.values(k));
    const v = key => m.get(k[key]) || 0;
    if (v('d') >= lim.daily) return { ok: false, reason: 'daily' };
    if (v('h') >= lim.hourly) return { ok: false, reason: 'hourly' };
    if (v('p') >= lim.prefixDaily) return { ok: false, reason: 'visitor-daily' };
    if (v('b') >= lim.prefixBurst) return { ok: false, reason: 'visitor-burst' };
    await st.put({ [k.d]: v('d') + 1, [k.h]: v('h') + 1, [k.p]: v('p') + 1, [k.b]: v('b') + 1 });
    return { ok: true, leftToday: lim.daily - v('d') - 1 };
  }
}
