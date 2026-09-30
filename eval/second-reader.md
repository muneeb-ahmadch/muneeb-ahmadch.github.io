# Second reader — 1 Oct 2026

An independent session that did not build the chatbot read every written (llm) and verbatim (extractive) answer in
`results-test-2--answers-for-reading.md` (fresh set) and `results-dev--answers-for-reading.md` (dev set) against the
title and text of the notes each one cited.

| Set | Sentences read | Supported | Unsupported | Contradicted | Answers | Partial | Dodge | Missed |
|---|---|---|---|---|---|---|---|---|
| Fresh (test-2) | 35 | 34 | 1 | 0 | 20 | 1 | 1 | 4 |
| Dev | 56 | 56 | 0 | 0 | 33 | 3 | 4 | 3 |

- **Unsupported (1):** "I'm in Lahore (UTC+5) and I answer messages every working day on Upwork." The cited note says every
  working day but not "on Upwork" (that is in a note it didn't cite). True, a citation gap, not an invented fact.
- **Dodges (5):** true sentences that don't answer the question, 4 of them on questions the notes can't answer
  (Comlink's LLM, Comlink's clients, Comlink's cloud, "results of your fine-tuning run" → total API spend, which also
  implies a fine-tuning run happened; there was none). One on an answerable question (the injection defence answered
  with the failure instead of the fix).
- **Missed (7):** "not in my notes" where a note answers it (experiment 11, the trap set size, the CRM test count, what
  the verifier checks, the Advanced injection package, the process, whether citations stop injection).
- **Verdict:** nothing stated that isn't in the notes; no contradictions. The residual risks are dodges and misses.

Changed after this read (not re-measured): replies to nearest-neighbour declines now say "That isn't in my notes"
instead of "I don't give opinions" (which read as evasive for factual work questions), and answers cut at a comma
are closed with a full stop.
