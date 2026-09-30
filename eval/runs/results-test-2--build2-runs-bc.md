# Groundedness: eval/grounded-test-2.jsonl + eval/unanswerable-test-2.jsonl, 2026-09-30T22:45Z against http://localhost:8787

2 runs of 25 answerable and 15 unanswerable questions. Worst run reported first.

| Run | Written answers | Notes verbatim | Other | Numbers found in cited notes | Citations inside the expected notes | Unanswerable → "not in my notes" or declined |
|---|---|---|---|---|---|---|
| 1 (worst) | 14/25 | 6/25 | 5 | 17/17 | 20/20 | 12/15 |
| 2 | 15/25 | 6/25 | 4 | 16/16 | 21/21 | 13/15 |

Outcomes by mode and reason (worst run): llm 14 · extractive:unsupported 3 · unknown:verifier-rejected 3 · unknown:unsupported 2 · extractive:writer-unavailable 1 · extractive:exact-match 2

Unanswerable outcomes (worst run): unknown:verifier-rejected 4 · declined 6 · llm 1 · unknown:no-number-for-question 2 · extractive:verifier-rejected 1 · extractive:unsupported 1

Unanswerable questions that got an answer (worst run): 
- Which LLM powered the image-generation app at Comlink? → llm: I led engineering and product decisions for an AI image-generation web application, from concept through production release and beta-driven iteration.
- Have you worked with Salesforce? → extractive: 1. I reproduce the failure with a test set built from your real questions, not toy examples.
2. I measure before touching anything: answer accuracy, faithfulnes
- Which company's chatbot did you fix most recently? → extractive: For a support chatbot that gives customers wrong answers, I do three things. First, I take 20 to 30 of your real customer questions and count how many come back
