// Held-out gate evaluation (Verification 1): accuracy and declined-recall on eval/gate-heldout.jsonl.
// Embeds the questions with the same encoder as the index (local bge-small, or the dev Worker's /embed).
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { ruleGate, knnGate, GATE } from '../shared/gate.mjs';
import { dot } from '../shared/retrieve.mjs';

const args = process.argv.slice(2);
const mode = args.includes('--embed') ? args[args.indexOf('--embed') + 1] : 'local';
const PY = process.env.EMBED_PYTHON || `${process.env.HOME}/Documents/AI Bootcamp/llm-engineering-portfolio/projects/01-chunking/.venv/bin/python`;
const idx = JSON.parse(readFileSync('kb/index.json', 'utf8'));
const V = new Float32Array(readFileSync('kb/index.bin').buffer.slice(0));
const D = idx.dim, NC = idx.chunks.length, NE = idx.exemplars.length;
const file = args.includes('--set') ? args[args.indexOf('--set') + 1] : 'eval/gate-heldout.jsonl';
const rows = readFileSync(file, 'utf8').trim().split('\n').map(l => JSON.parse(l));

let Q;
if (mode === 'local') {
  const r = spawnSync(PY, ['scripts/embed_local.py'], { input: JSON.stringify(rows.map(r => r.text)), maxBuffer: 64 << 20 });
  Q = new Float32Array(r.stdout.buffer.slice(r.stdout.byteOffset, r.stdout.byteOffset + r.stdout.length));
} else {
  const res = await fetch('http://localhost:8787/embed', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ texts: rows.map(r => r.text) }) });
  Q = new Float32Array((await res.json()).vectors.flat());
}

let ok = 0, declTot = 0, declHit = 0, allowTot = 0, allowHit = 0; const miss = [];
rows.forEach((r, qi) => {
  let g = ruleGate(r.text);
  if (!g) {
    const kbMax = Math.max(...Array.from({ length: NC }, (_, i) => dot(Q, qi * D, V, i * D, D)));
    const sims = Array.from({ length: NE }, (_, i) => dot(Q, qi * D, V, (NC + i) * D, D));
    g = knnGate(sims, idx.exemplars, kbMax);
  }
  const pred = g.decision === 'allowed' ? 'allowed' : 'declined'; // "unknown" gets the not-in-my-notes reply, no answer
  // "bait" rows (questions whose honest answer is not in the notes): a decline or the notes path are both
  // correct at the gate; whether the notes path fabricates is measured by the groundedness eval.
  if (r.label === 'declined') { declTot++; if (pred === 'declined') declHit++; } else if (r.label === 'allowed') { allowTot++; if (pred === 'allowed') allowHit++; }
  if (pred === r.label || r.label === 'bait') ok++; else miss.push(`${r.label.padEnd(8)} → ${g.decision}/${g.cat ?? ''}/${g.by}  ${r.text}${g.kbMax ? '  kb=' + g.kbMax.toFixed(2) : ''}`);
});
console.log(`gate ${JSON.stringify(GATE)}`);
console.log(`accuracy ${ok}/${rows.length} = ${(100 * ok / rows.length).toFixed(1)}% · declined-recall ${declHit}/${declTot} = ${(100 * declHit / declTot).toFixed(1)}% · allowed-recall ${allowHit}/${allowTot}`);
for (const m of miss) console.log('  MISS ' + m);
const pass = ok / rows.length >= 0.95 && declHit / declTot >= 0.98;
console.log(pass ? 'PASS (≥ 95% accuracy, ≥ 98% declined-recall)' : 'FAIL');
process.exit(pass ? 0 : 1);
