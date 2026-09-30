# Live demos

## demo-about | Why I build demos
ask: What demos have you built? | Show me your demos
I build a small working demo before applying to a job, so a client can try the hard part of their own project before hiring me. Each demo runs in the browser with stand-in data, is built from the job post and not from the client's code, and says so on the page.

## demo-when-not | Demo: an AI assistant that knows when not to use AI
url: https://muneeb-ahmadch.github.io/demos/when-not-to-use-ai/
An assistant that sends prices to plain code, answers policy questions from documents with a citation, and declines what the documents don't cover. Real Python runs in the browser. With its safeguards on it passes 12 of 12 stand-in edge cases; with every safeguard switched off, the same code passes 4 of 12. It ships with 16 passing tests.

## demo-inquiry | Demo: an inquiry agent with guardrails
url: https://muneeb-ahmadch.github.io/demos/inquiry-agent-guardrails/
An inquiry desk that answers customers from an approved fact sheet, fills a lead sheet, and sends discounts, refunds and custom quotes to the owner with a draft ready instead of promising them. You press play and watch it handle a morning of 12 stand-in inquiries. The approval routing is plain code in front of the model, so a model mistake cannot send a promise nobody approved.

## demo-booking | Demo: a booking service that can't double-book
url: https://muneeb-ahmadch.github.io/demos/booking-race/
A meeting-room booking service with the hard part working: two people pressing Book at the same moment. It stages the race between the usual first version and mine, and checks 5 edge cases live. In Postgres the database itself refuses overlapping bookings with an exclusion constraint.
