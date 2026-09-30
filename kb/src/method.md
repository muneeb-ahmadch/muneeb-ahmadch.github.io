# How I work

## method-steps | My method, in four steps
ask: What is your process? | How do you work?
1. I reproduce the failure with a test set built from your real questions, not toy examples.
2. I measure before touching anything: answer accuracy, faithfulness to your documents, cost per query.
3. I fix the root cause (retrieval, chunking, prompts, tool calls, guardrails), not the symptom.
4. I re-run the same tests and give you the numbers, plus tracing so you can see what the model does in production after I'm gone.

## method-support-bot | How I would fix a support chatbot that gives wrong answers
ask: How would you fix my support bot? | Our chatbot gives customers wrong answers | How do you fix a chatbot that hallucinates?
For a support chatbot that gives customers wrong answers, I do three things. First, I take 20 to 30 of your real customer questions and count how many come back wrong today. Second, I fix the biggest cause, which is usually retrieval, the instructions, or a missing rule for when not to answer. Third, I run the same questions again and hand you the before and after table. The number tells you it's done, not me.

## method-what-i-fix | What I fix
ask: What kind of problems do you fix? | What do you fix?
Chatbots and RAG assistants that hallucinate or give wrong answers. Retrieval that pulls the wrong documents, or none. Agents that loop, stall, or break on real user input. LLM apps with runaway token costs, no error handling, or no visibility into what the model is doing. Half-finished integrations of OpenAI, Anthropic or open-source models into an existing Python backend.

## method-first-step | How an engagement starts
ask: How do we start? | What is the first step?
I start with a fixed-price diagnostic and a written findings report. You decide whether to continue from there, and you keep the report whether or not you hire me for the fix.

## method-measure | Why I measure first
None of the failures in my repository were found by reading code. They were found by building something that produces a number, then trying to make the number move. The order is measure, instrument, fix, measure again, and keep the runs that proved me wrong.

## method-new-builds | Building a new assistant
I also build small assistants on a client's own documents when done can be measured as right answers out of a set of their real questions. The tests exist from the first day, the way they do in my demos.

## method-honesty | What I will not claim
A finding I cannot evidence is labelled a hypothesis, never presented as a cause. Stand-in data is called stand-in data. If a result contradicts what I predicted, the prediction stays in the write-up next to the result.
