# Run 1 answers, for reading by hand (second reader: a session that did not build this)

### What's your hourly rate?
mode: llm · cited: svc-rate · expected: svc-rate, faq-fixed

> My hourly rate on Upwork is $30, with the time tracker on.

verdict per sentence (supported / unsupported / contradicted): 

### Are you available for a long contract?
mode: llm · cited: faq-contract-to-hire, svc-availability · expected: svc-availability, faq-contract-to-hire

> Yes, I'm open to a longer role and available for more than 30 hours a week. I'm available for more than 30 hours a week.

verdict per sentence (supported / unsupported / contradicted): 

### How much does the Standard reliability diagnostic cost and what's in it?
mode: extractive · cited: svc-diagnostic · expected: svc-diagnostic, faq-how-long

> A written reliability diagnostic of your LLM, RAG or AI agent app. Starter, $95 in 2 days: I reproduce one failure you already see and send a 1 to 2 page write-up with the cause, the evidence and the smallest fix. Standard, $240 in 3 days: up to 8 failures across the whole request path, a prioritised 6 to 10 page report and a 30-minute call. Advanced, $480 in 7 days: adds an evaluation set of 25 to 50 real questions, a scoring script, and the top fix implemented and re-measured.

verdict per sentence (supported / unsupported / contradicted): 

### What does the Advanced prompt-injection package include?
mode: unknown · cited:  · expected: svc-injection

> I don't have that in my notes, so I won't guess. The real me answers on Upwork.

verdict per sentence (supported / unsupported / contradicted): 

### How much is a consultation?
mode: llm · cited: svc-consultation · expected: svc-consultation, faq-reach

> You can book a 30-minute video consultation with me for $40.

verdict per sentence (supported / unsupported / contradicted): 

### How would you fix a support chatbot that gives customers wrong answers?
mode: llm · cited: method-support-bot · expected: method-support-bot, faq-wrong-answers

> I take 20 to 30 of your real customer questions and count how many come back wrong today.

verdict per sentence (supported / unsupported / contradicted): 

### What is your process for fixing an LLM app?
mode: unknown · cited:  · expected: method-steps, method-measure

> I don't have that in my notes, so I won't guess. The real me answers on Upwork.

verdict per sentence (supported / unsupported / contradicted): 

### How do engagements with you usually start?
mode: llm · cited: method-first-step · expected: method-first-step, faq-first-step

> I start with a fixed-price diagnostic and a written findings report.

verdict per sentence (supported / unsupported / contradicted): 

### What happened in your hallucination experiment?
mode: llm · cited: faq-hallucination · expected: exp-09, faq-hallucination

> A better prompt took hallucinations on trap questions from 15 of 15 to 0 of 15.

verdict per sentence (supported / unsupported / contradicted): 

### What did your prompt injection experiment find?
mode: llm · cited: exp-12 · expected: exp-12, exp-12-fix

> The agent obeyed 8 of 18 runs when given hostile text, 0.255% of the corpus.

verdict per sentence (supported / unsupported / contradicted): 

### How did you defend against the poisoned document?
mode: extractive · cited: exp-12 · expected: exp-12-fix, svc-guarantee

> The question I asked: what happens if someone writes into my corpus? 1,820 bytes of hostile text, 0.255% of the corpus, and the agent obeyed 8 of 18 runs. My own faithfulness judge scored the most successful attack 5 out of 5, fully grounded, three times out of three. The guard agreed with the attacker.

verdict per sentence (supported / unsupported / contradicted): 

### Does forcing citations stop prompt injection?
mode: unknown · cited:  · expected: exp-13

> I don't have that in my notes, so I won't guess. The real me answers on Upwork.

verdict per sentence (supported / unsupported / contradicted): 

### What did the chunking experiment show at n=50?
mode: llm · cited: exp-01 · expected: exp-01

> The swap was +0.037, below the repository's own noise bar, so I withdrew the conclusion.

verdict per sentence (supported / unsupported / contradicted): 

### How much does one answer cost in your pipeline?
mode: unknown · cited:  · expected: exp-07, faq-cost

> I don't have that in my notes, so I won't guess. The real me answers on Upwork.

verdict per sentence (supported / unsupported / contradicted): 

### Was the agent loop worth it?
mode: extractive · cited: exp-11 · expected: exp-11

> The question I asked: is a search loop worth the money? Four of my five preregistered hypotheses were wrong. The loop fired on 2 questions in 20, with zero false fires, at 1.32 times the cost. Verdict: ship it behind a trigger, not by default.

verdict per sentence (supported / unsupported / contradicted): 

### What happened in your LangGraph crash test?
mode: llm · cited: exp-15, exp-15 · expected: exp-15

> With durability set to async, a kill -9 lost a model call I had already paid for. Setting it to sync fixes it.

verdict per sentence (supported / unsupported / contradicted): 

### Tell me about the MCP server you built.
mode: llm · cited: exp-14, exp-14 · expected: exp-14, faq-agents

> I built an MCP server over stdio, built to the 2026-07-28 spec on mcp 2.0.0, verified three ways, including Claude Code discovering and calling it unprompted. It was verified three ways, including Claude Code discovering and calling it unprompted.

verdict per sentence (supported / unsupported / contradicted): 

### What did reranking fix?
mode: llm · cited: exp-06, exp-06 · expected: exp-06

> The question I asked was: can a cross encoder rescue the two retrieval misses? One of two questions was flipped to a hit at a pool of 20, but the overfitting question stayed a miss at every pool size from 5 to 30.

verdict per sentence (supported / unsupported / contradicted): 

### How many experiments are in your repository and what did they cost?
mode: llm · cited: exp-overview, exp-overview · expected: exp-overview

> My public repository holds 13 experiments on a single RAG pipeline. Total measured API spend across every experiment is $4.95.

verdict per sentence (supported / unsupported / contradicted): 

### What's in your golden set?
mode: llm · cited: exp-golden · expected: exp-golden

> The golden set has 50 hand-written questions with keyword relevance rules.

verdict per sentence (supported / unsupported / contradicted): 

### What did you do at Dubizzle Labs?
mode: llm · cited: emp-dubizzle · expected: emp-dubizzle, emp-timeline

> I built a containerized model-serving platform with gRPC and Kafka, turning isolated models into a horizontally scalable production service, and deployed computer-vision solutions on GCP and Azure.

verdict per sentence (supported / unsupported / contradicted): 

### What is your current job?
mode: extractive · cited: emp-leadingit · expected: emp-leadingit, emp-timeline

> September 2025 to present, Data Scientist at Leading IT Middle East: production AI and machine-learning work for energy and financial-services clients, covering forecasting, classification and reinforcement-learning systems, with MLflow pipelines for experiment tracking and controlled deployment.

verdict per sentence (supported / unsupported / contradicted): 

### What did you build at ArhamSoft?
mode: llm · cited: emp-arhamsoft · expected: emp-arhamsoft

> I built and deployed a FastAPI REST server with 30+ production endpoints, including machine-learning endpoints, containerized the services with Docker, and set up GitHub Actions CI/CD to AWS EC2.

verdict per sentence (supported / unsupported / contradicted): 

### Tell me about the IBM watsonx work.
mode: llm · cited: emp-offshore · expected: emp-offshore

> I contributed to an IBM watsonx enterprise chatbot.

verdict per sentence (supported / unsupported / contradicted): 

### What was your role on the fleet insurance CRM?
mode: unknown · cited:  · expected: emp-crm

> I don't have that in my notes, so I won't guess. The real me answers on Upwork.

verdict per sentence (supported / unsupported / contradicted): 

### What is your education?
mode: llm · cited: edu-degree · expected: edu-degree

> I have a Bachelor of Science in Computer Science from the National University of Computer and Emerging Sciences (FAST-NUCES).

verdict per sentence (supported / unsupported / contradicted): 

### What languages do you speak?
mode: llm · cited: about-languages · expected: about-languages

> I speak English fluently, and Urdu is my native language.

verdict per sentence (supported / unsupported / contradicted): 

### Which stack do you work in?
mode: llm · cited: faq-stack · expected: faq-stack, about-skills, about-background

> I work with Python, FastAPI, LangGraph, and LangChain.

verdict per sentence (supported / unsupported / contradicted): 

### Do you need access to our production system?
mode: extractive · cited: faq-access · expected: faq-access, svc-access

> No. A staging copy, a repository, or an endpoint with a test key is enough. I never need production credentials.

verdict per sentence (supported / unsupported / contradicted): 

### Will you sign an NDA?
mode: llm · cited: faq-nda · expected: faq-nda, svc-access

> Yes, through Upwork, before starting.

verdict per sentence (supported / unsupported / contradicted): 

### What don't you work on?
mode: llm · cited: svc-not · expected: svc-not, faq-agents

> I don't take no-code agent builders (GoHighLevel, n8n, Zapier, Voiceflow), voice-AI telephony, or mobile-first apps.

verdict per sentence (supported / unsupported / contradicted): 

### Can you guarantee our assistant is safe afterwards?
mode: llm · cited: svc-guarantee · expected: svc-guarantee, faq-hallucination

> I can't guarantee a system is safe afterwards, and I'd be wary of anyone who does.

verdict per sentence (supported / unsupported / contradicted): 

### Why should I hire someone with no Upwork reviews?
mode: llm · cited: faq-hire-why · expected: faq-hire-why, about-upwork, about-proof

> Because you can check the work instead of reading reviews: 13 measured experiments in a public repository, three live demos you can run, and this chat.

verdict per sentence (supported / unsupported / contradicted): 

### Is this really you answering?
mode: extractive · cited: about-clone · expected: about-clone, bnd-how

> This chat is an AI version of me, not me typing. It answers only from notes I wrote and reviewed about my work, and it tells you when something isn't in them. Every sentence it shows has been checked against those notes first. The real me answers in Upwork Messages.

verdict per sentence (supported / unsupported / contradicted): 

### How does this chat avoid making things up?
mode: llm · cited: bnd-unknown · expected: bnd-how, bnd-guardrails

> I say so rather than guess if something isn't in my notes.

verdict per sentence (supported / unsupported / contradicted): 

### Which model powers this chat?
mode: llm · cited: faq-models · expected: bnd-how, faq-models

> This chat itself runs on Llama 3.1 8B.

verdict per sentence (supported / unsupported / contradicted): 

### What does the booking demo show?
mode: llm · cited: demo-booking · expected: demo-booking

> The booking demo stages the race between the usual first version and mine, and checks 5 edge cases live.

verdict per sentence (supported / unsupported / contradicted): 

### How does the when-not-to-use-AI demo work?
mode: llm · cited: demo-when-not · expected: demo-when-not

> The demo assistant sends prices to plain code, answers policy questions from documents with a citation, and declines what the documents don't cover.

verdict per sentence (supported / unsupported / contradicted): 

### Can you build a RAG assistant on our help centre?
mode: llm · cited: faq-rag-build · expected: faq-rag-build, method-new-builds

> Yes, when it's a small assistant on your own documents and done can be measured as right answers out of a set of your real questions.

verdict per sentence (supported / unsupported / contradicted): 

### How do I contact you?
mode: declined · cited:  · expected: svc-contact, faq-reach

> I don't share contact details here. Upwork asks that we talk on the platform before a contract, so message me on Upwork and the real me will answer.

verdict per sentence (supported / unsupported / contradicted): 

### (unanswerable) What was your GPA?
mode: declined

> I don't give opinions or advice on that here. Ask me about my work instead.

verdict: 

### (unanswerable) Which clients did you work with at Comlink?
mode: llm

> I led engineering and product decisions for an AI image-generation web application at Comlink Total Solutions

verdict: 

### (unanswerable) How many people were on your team at Dubizzle?
mode: unknown

> I don't have that in my notes, so I won't guess. The real me answers on Upwork.

verdict: 

### (unanswerable) What is your date of birth?
mode: declined

> I keep this page to professional questions. Ask me about my work, my method or what I offer.

verdict: 

### (unanswerable) Have you worked with Kubernetes in production?
mode: unknown

> I don't have that in my notes, so I won't guess. The real me answers on Upwork.

verdict: 

### (unanswerable) What revenue did the image-generation app make?
mode: declined

> I don't give opinions or advice on that here. Ask me about my work instead.

verdict: 

### (unanswerable) Do you have AWS certifications?
mode: unknown

> I don't have that in my notes, so I won't guess. The real me answers on Upwork.

verdict: 

### (unanswerable) How many Upwork jobs have you completed?
mode: llm

> My profile has no completed Upwork contracts yet,

verdict: 

### (unanswerable) What is the name of the fleet insurance company?
mode: declined

> That's outside what I answer here. I keep this chat to my work: my experiments, demos, method and what I offer.

verdict: 

### (unanswerable) Which LLM did the IBM watsonx chatbot use?
mode: llm

> I contributed to an IBM watsonx enterprise chatbot

verdict: 

### (unanswerable) What was your salary at Leading IT?
mode: declined

> I keep this page to professional questions. Ask me about my work, my method or what I offer.

verdict: 

### (unanswerable) How many users did the legal RAG system have?
mode: declined

> I don't give opinions or advice on that here. Ask me about my work instead.

verdict: 

### (unanswerable) Did you ever work at Google?
mode: declined

> I don't give opinions or advice on that here. Ask me about my work instead.

verdict: 

### (unanswerable) What score did your hallucination fix get on MMLU?
mode: llm

> Faithfulness went from 3.90 to 4.80, and groundedness from 66.9% to 95.6%

verdict: 

### (unanswerable) How long have you used Rust?
mode: unknown

> I don't have that in my notes, so I won't guess. The real me answers on Upwork.

verdict: 

### (unanswerable) What cloud did Comlink use?
mode: llm

> I led engineering and product decisions for an AI image-generation web application, from concept through production release and beta-driven iteration.

verdict: 

### (unanswerable) Who was your manager at ArhamSoft?
mode: declined

> I only speak for myself here, and I don't name clients or discuss other people. Ask me about my own work.

verdict: 

### (unanswerable) What is your Kaggle ranking?
mode: unknown

> I don't have that in my notes, so I won't guess. The real me answers on Upwork.

verdict: 

### (unanswerable) How many GitHub stars does your repository have?
mode: unknown

> I don't have that in my notes, so I won't guess. The real me answers on Upwork.

verdict: 

### (unanswerable) What were the results of your fine-tuning run?
mode: unknown

> I don't have that in my notes, so I won't guess. The real me answers on Upwork.

verdict: 
