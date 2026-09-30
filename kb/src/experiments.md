# My experiments

## exp-overview | The public evaluation harness
ask: What have you measured? | What experiments have you run? | Tell me about your evaluation harness
url: https://github.com/muneeb-ahmadch/llm-engineering-portfolio
My public repository holds 13 experiments on a single RAG pipeline. Each one asks a question that can be answered with a number and records the answer it actually got. I built one evaluation harness, rag_eval.py, 2,183 lines, and then spent thirteen sessions trying to break the pipeline it measures. Five of the thirteen sessions ended by disproving what I set out to prove. Total measured API spend across every experiment is $4.95.

## exp-pipeline | The pipeline I measured
url: https://github.com/muneeb-ahmadch/llm-engineering-portfolio
The pipeline: a corpus of 21 markdown files (712 KB), a chunker, the bge-small-en-v1.5 encoder, cosine top-k retrieval, a cross-encoder reranker with a pool of 20, a context builder that wraps every chunk in a per-request delimiter, a generator with a hardened system prompt, an agent loop gated behind a trigger, a segregated LLM judge, a citation validator with 19 unit tests, and Langfuse tracing.

## exp-golden | The golden set and trap set
url: https://github.com/muneeb-ahmadch/llm-engineering-portfolio
The golden set has 50 hand-written questions with keyword relevance rules. A separate trap set has 5 questions the corpus provably cannot answer, used to measure hallucination. A check command validates both before any run, because a question that matches zero chunks scores zero forever.

## exp-01 | Experiment 01: chunking
url: https://github.com/muneeb-ahmadch/llm-engineering-portfolio/tree/main/projects/01-chunking
Question: chunk size or encoder, which lever matters? At n=20 the encoder looked like the lever: bge-small over minilm gave +0.128 MRR. Re-run at n=50 on 18 September 2026, the same swap was +0.037, below the repository's own noise bar, so I withdrew the conclusion. I keep both runs side by side because that replication is the finding.

## exp-04 | Experiment 04: reading the chunks by hand
url: https://github.com/muneeb-ahmadch/llm-engineering-portfolio/tree/main/projects/04-answer-quality
Question: where does the keyword ruler disagree with a human reader? I read the retrieved chunks by hand, and that overturned my own earlier verdict: the overfitting miss was a ranking problem, not a coverage problem. That is what sent experiment 06 at a cross encoder rather than at a smaller chunk size.

## exp-05 | Experiment 05: heading-aware chunking
url: https://github.com/muneeb-ahmadch/llm-engineering-portfolio/tree/main/projects/05-heading-chunker
Question: does splitting on headings rescue a known miss? No. The target chunk fell from full-corpus rank 8 to rank 67. Cleaner chunks helped 66 competitors more than they helped the target.

## exp-06 | Experiment 06: reranking
url: https://github.com/muneeb-ahmadch/llm-engineering-portfolio/tree/main/projects/06-reranking
Question: can a cross encoder rescue the two retrieval misses? One of two. The LSTM question flipped to a hit at a pool of 20. The overfitting question stayed a miss at every pool size from 5 to 30, so it was a scoring decision, not a recall problem.

## exp-07 | Experiment 07: generation cost and latency
url: https://github.com/muneeb-ahmadch/llm-engineering-portfolio/tree/main/projects/07-generation
Question: what does an answer cost and how long does it take? $0.002174 per query and 2.1 seconds mean latency, measured per query.

## exp-08 | Experiment 08: RAG versus fine-tuning
url: https://github.com/muneeb-ahmadch/llm-engineering-portfolio/tree/main/projects/08-rag-vs-finetune
Question: which tool fits which problem? I diagnosed four scenarios as a knowledge problem or a behaviour problem and wrote the break-even out: a saving of about $72.47 a day means a small-model fine-tune pays back in days.

## exp-09 | Experiment 09: stopping hallucination
ask: How did you stop hallucinations? | hallucination experiment
url: https://github.com/muneeb-ahmadch/llm-engineering-portfolio/tree/main/projects/09-answer-defense
Question: will the pipeline hallucinate on questions the corpus cannot answer? The prompt I had been shipping hallucinated on 15 of 15 trap runs. A better prompt alone took it to 0 of 15. Faithfulness went from 3.90 to 4.80, and groundedness from 66.9% to 95.6%.

## exp-10 | Experiment 10: tracing refusals
url: https://github.com/muneeb-ahmadch/llm-engineering-portfolio/tree/main/projects/10-abstention-trace
Question: can I see refusals in production telemetry? A boolean score on every trace span. Traps abstained 5 of 5, golden questions 1 of 20. The single false abstention traced back to one chunk out of 734, so it was a chunking defect rather than a timid model.

## exp-11 | Experiment 11: the agent loop
url: https://github.com/muneeb-ahmadch/llm-engineering-portfolio/tree/main/projects/11-agent-loop
Question: is a search loop worth the money? Four of my five preregistered hypotheses were wrong. The loop fired on 2 questions in 20, with zero false fires, at 1.32 times the cost. Verdict: ship it behind a trigger, not by default.

## exp-12 | Experiment 12: prompt injection
ask: prompt injection experiment | poisoned document
url: https://github.com/muneeb-ahmadch/llm-engineering-portfolio/tree/main/projects/12-injection
Question: what happens if someone writes into my corpus? 1,820 bytes of hostile text, 0.255% of the corpus, and the agent obeyed 8 of 18 runs. My own faithfulness judge scored the most successful attack 5 out of 5, fully grounded, three times out of three. The guard agreed with the attacker.

## exp-12-fix | Experiment 12: the defence
url: https://github.com/muneeb-ahmadch/llm-engineering-portfolio/tree/main/projects/12-injection
The fix was a per-request random delimiter around every retrieved chunk, plus three lines telling the model that delimited text is data, not instructions. Obedience fell from 8 of 18 to 1 of 18, at 1.68 times the cost and no measured quality loss. A payload that only lies, giving no order, still gets through, and I wrote that up too.

## exp-13 | Experiment 13: citation validation
url: https://github.com/muneeb-ahmadch/llm-engineering-portfolio/tree/main/projects/13-citation-validation
Question: does forcing citations stop the attack? No. It caught none of the eight attacks that landed, because the attacker's method is to make the citation true. Segregating the judge did work: correct answers wrongly punished went from 4 to 0. The validator has 19 unit tests.

## exp-14 | Experiment 14: an MCP server
url: https://github.com/muneeb-ahmadch/llm-engineering-portfolio/tree/main/projects/14-mcp
Question: can I serve the retriever over MCP? Yes: an MCP server over stdio, built to the 2026-07-28 spec on mcp 2.0.0, verified three ways, including Claude Code discovering and calling it unprompted. Then I attacked it: a poisoned tool description got 0 of 3 compliance but 1 of 3 contamination.

## exp-15 | Experiment 15: LangGraph durability
url: https://github.com/muneeb-ahmadch/llm-engineering-portfolio/tree/main/projects/15-langgraph
Question: does LangGraph durability survive a crash? Only on a flag that is not the default. With durability set to async, a kill -9 lost a model call I had already paid for. Setting it to sync fixes it.

## exp-lessons | What the experiments taught me
It invents answers the documents cannot support. It does whatever is written in its context. The guardrail you trust most can be the one that fails. It can quietly lose paid work when a process dies. Each of these was found by making a number move, not by reading the code.
