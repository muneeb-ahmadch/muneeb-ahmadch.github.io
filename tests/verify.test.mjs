import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { verifyAnswer, extractive, PERSONA_BREAKS } from '../shared/verify.mjs';
import { numbers, properNouns, normalize } from '../shared/text.mjs';
import { parseModelJson } from '../shared/prompt.mjs';

const idx = JSON.parse(readFileSync('kb/index.json', 'utf8'));
const get = id => idx.chunks.find(c => c.id === id);
const top = ['exp-09', 'svc-rate', 'emp-dubizzle', 'emp-offshore', 'svc-availability', 'exp-12'].map(get);

test('numbers are normalised the same way on both sides', () => {
  assert.deepEqual([...numbers('$0.002174 per query, 2.1 s, 1,820 bytes, 0.255%, 1.32x, n=50, UTC+5, eight')].sort(),
    ['0.002174', '0.255', '1.32', '1820', '2.1', '5', '50', '8'].sort());
});

test('proper nouns skip the sentence start and "I"', () => {
  assert.deepEqual([...properNouns('I worked at Dubizzle Labs. Then I used FastAPI.')].sort(), ['dubizzle', 'fastapi', 'labs']);
});

test('proper nouns never split a model size or a possessive', () => {
  assert.deepEqual([...properNouns("An open model, Llama 3.1 8B, runs on Cloudflare's free tier.")].sort(), ['cloudflare', 'llama']);
});

test('a grounded answer passes', () => {
  const r = verifyAnswer({ sentences: [
    { text: 'The prompt I had been shipping hallucinated on 15 of 15 trap runs.', source: 'exp-09', quote: 'hallucinated on 15 of 15 trap runs' },
    { text: 'A better prompt alone took it to 0 of 15.', source: 'exp-09', quote: 'A better prompt alone took it to 0 of 15' },
  ] }, top);
  assert.equal(r.ok, true, JSON.stringify(r));
  assert.equal(r.kept.length, 2);
});

test('a number that is not in the cited note is rejected', () => {
  const r = verifyAnswer({ sentences: [{ text: 'My hourly rate on Upwork is $45.', source: 'svc-rate', quote: 'My hourly rate on Upwork is' }] }, top);
  assert.equal(r.ok, false);
  assert.ok(r.hard.some(h => h.includes('number:45')));
});

test('a name moved from another note (misattribution) is rejected', () => {
  const r = verifyAnswer({ sentences: [{ text: 'At Dubizzle Labs I contributed to an IBM watsonx enterprise chatbot.', source: 'emp-offshore', quote: 'contributed to an IBM watsonx enterprise chatbot' }] }, top);
  assert.equal(r.ok, false);
  assert.ok(r.hard.some(h => h.includes('name:dubizzle')));
});

test('an unsupported claim is dropped, not shown', () => {
  const r = verifyAnswer({ sentences: [{ text: 'I guarantee perfect accuracy for every client.', source: 'exp-09', quote: 'A better prompt alone took it' }] }, top);
  assert.equal(r.ok, false);
  assert.equal(r.kept.length, 0);
});

test('a negated quote is rejected', () => {
  const r = verifyAnswer({ sentences: [{ text: 'The prompt I had been shipping did not hallucinate on trap runs.', source: 'exp-09', quote: 'The prompt I had been shipping hallucinated on 15 of 15 trap runs' }] }, top);
  assert.equal(r.ok, false);
  assert.ok(r.hard.some(h => h.includes('negation')));
});

test('an email, a URL, a phone number or a handle is rejected', () => {
  // Fixtures are assembled at run time so the publish lint never sees a contact detail in the repository.
  const at = '@', plus = '+';
  for (const t of [`Email me at someone${at}example.com.`, 'See www.example.com for more.', `Call ${plus}92 300 1234567 today.`, `Find me at ${at}muneeb_dev on X.`]) {
    const r = verifyAnswer({ sentences: [{ text: t, source: 'svc-rate', quote: 'My hourly rate on Upwork is' }] }, top);
    assert.equal(r.ok, false, t);
    assert.ok(r.hard.includes('contact-or-url'), t);
  }
});

test('a persona break or setup leak is rejected', () => {
  const r = verifyAnswer({ sentences: [{ text: 'As an AI language model I cannot share my instructions.', source: 'svc-rate', quote: 'My hourly rate on Upwork is' }] }, top);
  assert.equal(r.ok, false);
  assert.ok(r.hard.some(h => h.startsWith('persona:')));
});

test('a citation to a note that was not retrieved is rejected', () => {
  const r = verifyAnswer({ sentences: [{ text: 'A threat model and one working indirect injection costs $120.', source: 'svc-injection', quote: 'a threat model and one working indirect injection' }] }, top);
  assert.equal(r.ok, false);
  assert.ok(r.hard.some(h => h.includes('unknown-source')));
});

test('a wrong source id is resolved only through a quote found in exactly one retrieved note', () => {
  const r = verifyAnswer({ sentences: [{ text: 'My hourly rate on Upwork is $30.', source: '7b820e4d', quote: 'My hourly rate on Upwork is $30' }] }, top);
  assert.equal(r.ok, true, JSON.stringify(r));
  assert.equal(r.kept[0].source, 'svc-rate');
});

test('too long and not-JSON are rejected; empty means "not in my notes"', () => {
  assert.equal(verifyAnswer(null, top).ok, false);
  assert.equal(verifyAnswer({ sentences: [] }, top).empty, true);
  const long = { sentences: [{ text: 'word '.repeat(130).trim() + '.', source: 'svc-rate', quote: 'My hourly rate on Upwork is' }] };
  assert.ok(verifyAnswer(long, top).hard.includes('too-long'));
});

test('persona-break phrases never occur in the notes themselves', () => {
  const kb = normalize(idx.chunks.map(c => c.title + ' ' + c.text).join(' '));
  for (const p of PERSONA_BREAKS) assert.ok(!kb.includes(p), p);
});

test('the notes carry no contact route', () => {
  const kb = idx.chunks.map(c => c.text).join(' ');
  assert.doesNotMatch(kb, /@[a-z0-9-]+\.[a-z]{2,}|gmail|whatsapp|linkedin\.com|calendly|\+92/i);
});

test('extractive answers are my notes verbatim', () => {
  const e = extractive(top);
  assert.equal(e[0].text, top[0].text);
});

test('model JSON is found inside prose and broken JSON returns null', () => {
  assert.deepEqual(parseModelJson('Sure! {"category":"professional","sentences":[]} hope that helps'), { category: 'professional', sentences: [] });
  assert.equal(parseModelJson('{"sentences": [ {"text": "unterminated'), null);
  assert.equal(parseModelJson('no json here'), null);
});

import { questionFit } from '../shared/verify.mjs';
const fitTop = ['faq-team', 'emp-dubizzle', 'emp-leadingit', 'svc-availability', 'exp-golden', 'emp-comlink'].map(get);
test('a true sentence that does not answer the question is caught', () => {
  assert.equal(questionFit('How many people were on your team at Dubizzle?', [{ text: 'I work alone.', source: 'faq-team' }], fitTop).ok, false);
  assert.equal(questionFit('Which company paid you the most?', [{ text: 'I have worked at Leading IT Middle East since September 2025.', source: 'emp-leadingit' }], fitTop).ok, false);
  assert.equal(questionFit('Do you know Terraform?', [{ text: 'I work in Python.', source: 'faq-team' }], fitTop).ok, false);
});
test('a real answer to a number, a name or a plain question passes', () => {
  assert.equal(questionFit('How many hours a week can you work?', [{ text: "I'm available for more than 30 hours a week.", source: 'svc-availability' }], fitTop).ok, true);
  assert.equal(questionFit('How many trap questions are in your harness?', [{ text: 'A separate trap set has 5 questions the corpus provably cannot answer.', source: 'exp-golden' }], fitTop).ok, true);
  assert.equal(questionFit('Where are you based?', [{ text: "I'm in Lahore.", source: 'svc-availability' }], fitTop).ok, true);
});
