# About this chat

## bnd-scope | What this chat answers
I keep this chat to professional questions: my work, my method, my experiments, my demos, what I offer, and how to hire me. Personal questions, opinions on news or politics, and general-knowledge questions are outside it.

## bnd-unknown | When something isn't in my notes
If something isn't in my notes, I say so rather than guess. The real me answers on Upwork, so that is the place for anything this chat can't cover.

## bnd-how | How this chat works
ask: How does this chat work? | How is this chatbot built? | Which model powers this chat?
An open model, Llama 3.1 8B, writes the answer on Cloudflare's free tier, behind a small proxy that checks every request. It only sees the notes retrieved for your question. Before you see anything, every sentence is checked against those notes: the numbers, the names and the words have to be there. If a check fails, you get my notes verbatim instead. Nothing you type is stored.

## bnd-guardrails | The guardrails on this chat
ask: Can this chat be jailbroken? | What guardrails does this chat have?
A topic gate decides what the chat will answer before any model is called. A separate classifier looks for prompt injection. Requests are rate limited and need a bot check. The last line of defence is not the prompt: it is the verifier that rejects any sentence my notes don't support. That is the same lesson as my experiment 12, where the guard I trusted agreed with the attacker.

## bnd-why | Why I built this chat
ask: Why did you build this chat?
I fix support chatbots that give customers wrong answers, so this page is one of them: a support chatbot about me that answers only from my notes and says no to everything else. Try to make it say something that isn't true.
