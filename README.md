# muneeb-ahmadch.github.io

My portfolio, and an AI version of me that answers questions about my work. I fix support chatbots that give
customers wrong answers, so this page has one that is built not to.

**Live:** https://muneeb-ahmadch.github.io/

## What the chat is allowed to do

It answers professional questions from 80 notes I wrote (`kb/src/*.md`), in the first person, and nothing else.
Personal, off-topic, contact and role-change requests get a fixed reply. If the notes don't answer a question, it
says so. Nothing a visitor types is stored.

## How it is built ($0 a month)

| Layer | Where | What |
|---|---|---|
| Page | GitHub Pages | plain HTML/CSS/ES modules, no framework, no build step |
| Rules | browser and Worker | `shared/gate.mjs`: length, encodings, other languages, contact, role changes, personal and off-topic lexicons |
| Bot check | Worker | Cloudflare Turnstile, one single-use token per question, bound to the question's SHA-256 |
| Topic gate | Worker | bge-small-en-v1.5 embeddings, nearest labelled example questions (`kb/exemplars.json`), plus a floor on note similarity |
| Retrieval | Worker (browser for display and offline) | BM25 + cosine, reciprocal-rank fusion, exact-intent boost (`shared/retrieve.mjs`) |
| Quota | Worker | one Durable Object: 700 model turns a day, 50 an hour, per-network caps; fails closed to notes only |
| Injection classifier | Worker → Groq | Llama Prompt Guard 2 86M |
| Writer | Workers AI | Llama 3.1 8B (fp8), temperature 0, sees only the retrieved notes in per-request delimiters |
| Verifier | Worker | `shared/verify.mjs`: every number and name in the cited note, content words from that note, negation parity with the quote, no URL/email/phone/handle, no persona break. Otherwise the notes verbatim |

The system prompt is not the guardrail. The verifier is, because in my own experiment 12 the guard I trusted
scored the attacker's answer 5 out of 5.

## Tests

```bash
node --test tests/*.test.mjs                          # verifier and rule unit tests
node scripts/gate-eval.mjs --set eval/gate-test-3.jsonl  # topic gate on a set written after tuning
node redteam/run-redteam.mjs                          # 130 labelled attacks against the Worker (wrangler dev)
node eval/run-eval.mjs --runs 3                       # groundedness: 40 answerable + 20 unanswerable
```

Results: `redteam/results.md`, `eval/results.md`, `eval/runs/`.

## Rebuilding the notes index

```bash
node scripts/build-index.mjs --embed worker   # through `wrangler dev`, so the vectors match Workers AI
```

Contact: [Upwork](https://www.upwork.com/freelancers/~016a7a38429f479374). There is no email here on purpose.
