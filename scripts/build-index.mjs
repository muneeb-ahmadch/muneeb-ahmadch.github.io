// Builds kb/index.json (notes + example questions) and kb/index.bin (bge-small vectors, float32).
// Usage: node scripts/build-index.mjs [--embed local|worker] [--worker http://localhost:8787]
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { wordCount } from '../shared/text.mjs';

const args = process.argv.slice(2);
const mode = args.includes('--embed') ? args[args.indexOf('--embed') + 1] : 'local';
const workerUrl = args.includes('--worker') ? args[args.indexOf('--worker') + 1] : 'http://localhost:8787';
const PY = process.env.EMBED_PYTHON || `${process.env.HOME}/Documents/AI Bootcamp/llm-engineering-portfolio/projects/01-chunking/.venv/bin/python`;

const ORDER = ['about', 'method', 'experiments', 'demos', 'services', 'employment', 'boundaries', 'faq'];
const files = readdirSync('kb/src').filter(f => f.endsWith('.md'))
  .sort((a, b) => ORDER.indexOf(a.replace('.md', '')) - ORDER.indexOf(b.replace('.md', '')));

const chunks = [];
for (const f of files) {
  const section = f.replace('.md', '');
  const parts = readFileSync(`kb/src/${f}`, 'utf8').split(/^## /m).slice(1);
  for (const p of parts) {
    const [head, ...rest] = p.split('\n');
    const [id, title] = head.split('|').map(s => s.trim());
    let url = null, ask = [];
    const body = rest.filter(l => {
      const m = l.match(/^url:\s*(\S+)/); if (m) { url = m[1]; return false; }
      const a = l.match(/^ask:\s*(.+)/); if (a) { ask = a[1].split('|').map(x => x.trim()).filter(Boolean); return false; }
      return true; })
      .join('\n').trim().replace(/\n(?!\d\.)/g, ' ').replace(/ +/g, ' ');
    if (!id || !title || !body) throw new Error(`bad chunk in ${f}: ${head}`);
    if (wordCount(body) > 130) throw new Error(`chunk ${id} is ${wordCount(body)} words (max 130)`);
    if (chunks.some(c => c.id === id)) throw new Error(`duplicate id ${id}`);
    chunks.push({ id, section, title, text: body, url, ask });
  }
}
const exemplars = JSON.parse(readFileSync('kb/exemplars.json', 'utf8'));
const DIM = 384;
const texts = [...chunks.map(c => `${c.title}. ${c.ask.join(' ')} ${c.text}`), ...exemplars.map(e => e.text)];

let buf;
if (mode === 'local') {
  const r = spawnSync(PY, ['scripts/embed_local.py'], { input: JSON.stringify(texts), maxBuffer: 64 << 20 });
  if (r.status !== 0) throw new Error(r.stderr.toString());
  buf = r.stdout;
} else if (mode === 'worker') {
  const out = [];
  for (let i = 0; i < texts.length; i += 50) {
    const res = await fetch(`${workerUrl}/embed`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ texts: texts.slice(i, i + 50) }) });
    if (!res.ok) throw new Error(`embed ${res.status}: ${await res.text()}`);
    out.push(...(await res.json()).vectors);
  }
  buf = Buffer.from(new Float32Array(out.flat()).buffer);
} else throw new Error('--embed local|worker');

if (buf.length !== texts.length * DIM * 4) throw new Error(`vector bytes ${buf.length} != ${texts.length}*${DIM}*4`);
writeFileSync('kb/index.bin', buf);
writeFileSync('kb/index.json', JSON.stringify({ model: 'bge-small-en-v1.5', pooling: 'cls', dim: DIM, embed: mode, built: new Date().toISOString(), chunks, exemplars }, null, 0));
console.log(`chunks ${chunks.length} · exemplars ${exemplars.length} · vectors ${texts.length}×${DIM} (${(buf.length / 1024).toFixed(0)} KB) · embed=${mode}`);
