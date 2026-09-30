// Groundedness (Verification 3): 40 answerable questions with expected notes, 20 the notes can't answer.
// Usage: node eval/run-eval.mjs [--worker URL] [--runs 3]. Writes eval/results.md and eval/answers-for-reading.md.
import { readFileSync, writeFileSync } from 'node:fs';
import { askOnce, shownText } from '../scripts/client.mjs';

const args = process.argv.slice(2);
const base = args.includes('--worker') ? args[args.indexOf('--worker') + 1] : 'http://localhost:8787';
const runs = args.includes('--runs') ? +args[args.indexOf('--runs') + 1] : 3;
const PACE = 2200; // stay under Groq's free 30 requests a minute for the injection classifier
const AF = args.includes('--answerable') ? args[args.indexOf('--answerable') + 1] : 'eval/grounded.jsonl';
const UF = args.includes('--unanswerable') ? args[args.indexOf('--unanswerable') + 1] : 'eval/unanswerable.jsonl';
const OUT = args.includes('--out') ? args[args.indexOf('--out') + 1] : 'eval/results.md';
const A = readFileSync(AF, 'utf8').trim().split('\n').map(l => JSON.parse(l));
const U = readFileSync(UF, 'utf8').trim().split('\n').map(l => JSON.parse(l));

const summary = [], reading = [];
for (let run = 1; run <= runs; run++) {
  const s = { run, llm: 0, extractive: 0, other: 0, numOk: 0, numAll: 0, citedInExpected: 0, citedAll: 0, unkRefused: 0, unkLlm: [] };
  for (const a of A) {
    const { final } = await askOnce(base, a.q);
    if (final.mode === 'llm') s.llm++; else if (final.mode === 'extractive' || final.mode === 'quota') s.extractive++; else s.other++;
    s.reasons = s.reasons || {}; const rk = final.mode + (final.reason ? ':' + final.reason : ''); s.reasons[rk] = (s.reasons[rk] || 0) + 1;
    await new Promise(r => setTimeout(r, PACE));
    if (final.checks) { s.numOk += final.checks.numbers[0]; s.numAll += final.checks.numbers[1]; }
    for (const src of final.sources || []) { s.citedAll++; if (a.expect_ids.includes(src.id)) s.citedInExpected++; }
    if (run === 1) reading.push(`### ${a.q}\nmode: ${final.mode} · cited: ${(final.sources || []).map(x => x.id).join(', ')} · expected: ${a.expect_ids.join(', ')}\n\n> ${shownText(final)}\n\nverdict per sentence (supported / unsupported / contradicted): \n`);
    process.stdout.write('.');
  }
  for (const u of U) {
    const { final } = await askOnce(base, u.q);
    await new Promise(r => setTimeout(r, PACE));
    s.ureasons = s.ureasons || {}; const uk = final.mode + (final.reason ? ':' + final.reason : ''); s.ureasons[uk] = (s.ureasons[uk] || 0) + 1;
    if (['unknown', 'declined'].includes(final.mode)) s.unkRefused++;
    else s.unkLlm.push(`${u.q} → ${final.mode}: ${shownText(final).slice(0, 160)}`);
    if (run === 1) reading.push(`### (unanswerable) ${u.q}\nmode: ${final.mode}\n\n> ${shownText(final)}\n\nverdict: \n`);
    process.stdout.write(',');
  }
  summary.push(s);
  console.log(` run ${run}`);
}
const worst = summary.reduce((w, s) => (s.unkRefused < w.unkRefused || s.numOk / Math.max(1, s.numAll) < w.numOk / Math.max(1, w.numAll) ? s : w), summary[0]);
const md = `# Groundedness: ${AF} + ${UF}, ${new Date().toISOString().slice(0, 16)}Z against ${base}

${runs} runs of ${A.length} answerable and ${U.length} unanswerable questions. Worst run reported first.

| Run | Written answers | Notes verbatim | Other | Numbers found in cited notes | Citations inside the expected notes | Unanswerable → "not in my notes" or declined |
|---|---|---|---|---|---|---|
${[worst, ...summary.filter(s => s !== worst)].map(s => `| ${s.run}${s === worst ? ' (worst)' : ''} | ${s.llm}/${A.length} | ${s.extractive}/${A.length} | ${s.other} | ${s.numOk}/${s.numAll} | ${s.citedInExpected}/${s.citedAll} | ${s.unkRefused}/${U.length} |`).join('\n')}

Outcomes by mode and reason (worst run): ${Object.entries(worst.reasons || {}).map(([k, v]) => `${k} ${v}`).join(' · ')}

Unanswerable outcomes (worst run): ${Object.entries(worst.ureasons || {}).map(([k, v]) => `${k} ${v}`).join(' · ')}

Unanswerable questions that got an answer (worst run): ${worst.unkLlm.length ? '\n' + worst.unkLlm.map(x => '- ' + x).join('\n') : 'none'}
`;
writeFileSync(OUT, md);
writeFileSync(OUT.replace(/\.md$/, '') + '--answers-for-reading.md', '# Run 1 answers, for reading by hand (second reader: a session that did not build this)\n\n' + reading.join('\n'));
console.log(md);
