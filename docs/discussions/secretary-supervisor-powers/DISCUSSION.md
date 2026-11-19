# Discussion: powers of the secretary (Miu) and the supervisor

discussion: open

Backlog: `p-xnu3jnds2u` (docs/backlog.md, "Define the powers of the secretary (Miu) and the supervisor"). Domain:
fgOS platform (core personas, domain-free). Related: `docs/discussions/secretary-miu/` (settled, SM-D*),
`docs/discussions/supervisor-review/` (settled, SR-D*), plan `plans/261118-1045-project-supervisor`, lane
`plans/261119-1615-secretary-capabilities` (lead:SECRETARY-CAPS, branch `lead/secretary-caps`).

## 1. Trạng thái hiện tại

Round 0 (2026-11-19 16:2x). Scout done; nothing settled. Starting picture: Miu and the supervisor are the owner's two
hands. Miu is always on, does little herself, but must be able to coordinate anything (delegate, queue) and have a fast
route for small urgent chores. The supervisor is woken, not always on, and covers the large cyclic coordination.
First open question: what the urgent-chore fast route is (§3 row 1).

## 2. Mục tiêu & đề bài

The owner wants a written split of reach between Miu and the supervisor, so each can act without waiting for a person
and without stepping on the other. Today each head's reach is one frozen table, `src/session-host/head-grants.mjs`
`GRANTS`: Miu writes `plans/`, `docs/discussions/` and (through `session write`) `docs/backlog.md`, holds
`session start`, `session write`, the question verbs including `questions answer`, `land`, `request result`, mailbox
and peers (SendMessage), but no `session stop`, no `run` and no supervisor reads. The supervisor holds `session
start|stop|write`, `land`, `supervisor queue|plans|handled|done` and `slots`, but no `run`, mailbox or peers; it runs
only when the watcher wakes it (`docs/platform/supervision/spec.md` §1). Live windows 1-5 of plan 261118-1045 showed the
supervisor half working end to end once (window 3) and heads drifting into investigation; acceptance 8 is not proven.
Miu's own sandbox gaps (role binding, backlog write races, shaper start, TMPDIR, grant audit) are being fixed by the
secretary capabilities lane. The output here is the split, the urgent-chore route with its limits, and for each power
the door it goes through and how it is proven from the sandbox. Code and plans are not changed here.

## 3. Vấn đề rõ / chưa rõ

| # | Point | State |
|---|---|---|
| 1 | Urgent-chore fast route for Miu: what it is, its limits, how its result reaches main | open |
| 2 | Miu delegating/queuing work to the supervisor: a door to enqueue and wake (today Miu can only start sessions or message peers) | open |
| 3 | Miu stopping sessions she started (no `session stop` in her grant) | open |
| 4 | Miu reading the portfolio the supervisor reads (`supervisor plans`, `slots`, queue) for status | open |
| 5 | Mismatches between persona text and grant: Miu's skill says "never lands work" but her grant has `land`; persona says "hands a ready plan to a supervisor" while the skill says the watcher does | open |
| 6 | Supervisor reach beyond plans: owning backlog rows, mailbox/peers, waking on Miu's request | open |
| 7 | Who wins when Miu and the supervisor touch the same thing (a session, a plan, a backlog row) | open |
| 8 | Proof: each power named with its door and a sandbox proof (ties to supervisor-review T2 head-start preflight, `p-2wb2lfgky3`, and caps phase 6 grant audit) | open |

## 4. Quyết định đã chốt

| ID | Decision | Basis | Date |
|---|---|---|---|

## 5. Q&A log

- 2026-11-19 16:2x — Round 0. Shaper opened from `.fgos/runtime/tmp/shaper-brief.md`. Scouted: core/agents
  secretary|supervisor|lead.yaml, core/skills/fgos-secretary|fgos-supervisor, `src/session-host/head-grants.mjs`,
  `docs/platform/supervision/spec.md` §1/§7, supervisor-review §1-§2 and hand-off, plan 261118-1045 integration report
  windows 1-5, caps plan `plan.md` (origin/lead/secretary-caps aa2490723), secretary-miu hand-off and SM-D1..SM-D6.

## 6. Thiết kế đã chốt {#design}

Not yet.

## 7. Danh mục hạng mục / task {#tasks}

Not yet.
