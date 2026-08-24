---
type: explanation
title: Why the verify-fail-post-merge playbook retries through awaiting-approval, not proposed
tags: [merge-loop, status-fsm, playbook, prose-fix]
source_capture_ids: [tsk-3q8]
authoritative_for: why the verify-fail-post-merge playbook's retry step moves a blocked item to awaiting-approval rather than a non-existent proposed status
---
# Why the verify-fail-post-merge playbook retries through `awaiting-approval`, not `proposed`

`plugins/fgOS/skills/merge-loop/SKILL.md`'s `verify-fail-post-merge`
playbook (step 5) documented `fgos move <id> --to proposed` as the FSM
recovery door from `blocked` back to a retryable state. `proposed` does
not exist in `status-fsm.mjs` — confirmed both by grep (no match) and
live, while driving `tsk-1wr`: `fgos move tsk-1wr --to proposed --expect
blocked` was refused outright: `no transition from blocked to proposed
for work tsk-1wr -- valid targets from blocked are: todo, doing,
awaiting-approval, delivered, wontfix`.

The correct door, proven live on the same item: `fgos move tsk-1wr --to
awaiting-approval --expect blocked` succeeded, and the retried `approve`
landed cleanly. `awaiting-approval` is the status `approve`'s own case in
`bin/fgos.mjs` reads to attempt a merge in the first place — the natural
re-entry point for "retry the merge," not a separate staging status that
was never built.

The fix scoped to exactly this: the state name in both the command and
its own FSM-door description at `SKILL.md` lines 204-206, nothing else in
the playbook's logic.
