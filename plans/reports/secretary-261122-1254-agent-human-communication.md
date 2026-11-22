# How agents talk to the owner: what exists, what is missing, what this session taught

Written 2026-11-22 12:54 by the secretary (Miu) at the owner's request. Input for a shaper discussion, not a decision.

## What already exists

`core/skills/_shared/decision-question.md` (53 lines, also `core/instructions/decision-question.md`) covers one case only: **a question that asks the owner to choose a direction**. Five parts (what is happening, cause, options with gain/harm/cost, recommendation, scope of the answer), an approved-frame rule, and "make it easy to answer" (plain words, recommendation first, costs in numbers, what happens if there is no answer). `fgos questions ask` checks the measurable parts. AGENTS.md priority 2 says: decide and report when the analysis already chose one option; ask only when options are truly equal or depend on the owner's intent; batch questions.

## What it does not cover (gaps seen on 2026-11-22, with evidence)

1. **Asking permission to do read-only work.** Miu ended messages with "I have not read it closely, do you want me to present it in the five-part form?" (about q-y24ukwgfpo) and "shall I check the questions against current state?". The owner got no information to decide on and had to spend a turn saying "yes, just do it". Rule missing: read-only work (reading, checking, drafting a presentation) is done first; the owner receives findings plus a recommendation.
2. **Status reports that rest on a flag, not on activity.** `leadLive: true` was reported as "the lead is running" while the lead had written nothing for 20+ minutes (owner caught it twice, 10:40 and 12:27). Rule missing: a status report names its source and its age, shows evidence of activity (last write, last land), and states what was not checked.
3. **Stale decision requests.** Of 8 open owner questions, 5 were moot (plan already done, index already clean, owner already approved the same thing via another door). Only the asker can cancel (`not-asker`), the store does not refresh when the underlying state changes. Rule missing: the asker withdraws a question the moment it is moot; whoever presents a question first re-checks it against live state.
4. **Opaque names.** The owner asked "who is OPC?" and "which list is not refreshed?". Ids (`q-…`, `p-…`), lane names, event kinds and field names (`coordination-help`, `leadLive`) reached the owner unexplained, and the owner met a supervisor line ("asked OPC to handle it, passed question 2 to the stability lead") that named a role and a numbered question with no pointer to either. Rule missing: the first mention of a role, lane, id or term gives one plain phrase; a pointer to a numbered item states which item.
5. **Answer friction.** Owner answers were "A", "ok", "ok duyệt". The shortest reply works when options are lettered, the recommended one is marked, and a default is stated ("if you do not answer I choose A"). Several messages made the owner type a sentence or re-read a long block.
6. **Report shape outside questions.** No shared shape for a progress report or an incident report. The secretary's own rule (10 lines, detail in a file) is the only one, and it is not shared by supervisor, leads or workers. Useful shape seen working: outcome first, what was done (with ids), what was checked and what was not, what the owner must decide (one decision per item, recommendation first), nothing else.
7. **One agent's memory is not shared.** A feedback memory saved by one head helps only that head. The owner wants one place all agents read.

## Proposed landing place (for the shaper to settle)

Extend `core/skills/_shared/decision-question.md` or add a sibling `core/skills/_shared/owner-communication.md` referenced from `core/instructions/` (always loaded, so every head, lead and worker sees it) and from each head skill. Open design points the shaper should settle with the owner: one file or two (questions vs reports); which rules a program can check in `fgos questions ask` (for example a headline that is a decision, a lettered recommended option, a stated default) and which stay prose; how stale-question withdrawal is enforced (asker duty, or a watcher that flags a question whose `ref` plan is done).

## Not decided here

Whether the checks go into the `fgos questions ask` validator (code), and whether withdrawing stale questions needs a new door. Both are mechanism choices for the owner.
