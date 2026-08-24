---
type: explanation
title: Why the verify-fail-post-merge playbook retries through awaiting-approval, not proposed
tags: [merge-loop, status-fsm, playbook, prose-fix]
source_capture_ids: [tsk-3q8, tsk-63jf]
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

## Two more stale references, same class (`tsk-63jf`)

Found in the same post-batch audit that surfaced `tsk-3q8`: two more
text-only stale references, both fixed together since they're the same
class (a description or comment citing something that has since changed
or was never quite right, with the *described behavior* itself remaining
correct):

1. `merge-loop/SKILL.md`'s ungathered-root carve-out cited its own
   5-status list's source as `TAIL_RESOLVED_STATUSES` — but that real
   constant (`frontier.mjs`) only holds 4 values
   (`delivered`/`retrospective`/`cleanup`/`done`); `wontfix` is a separate
   `LEGACY_CANCELED_STATUS`, folded in only via the `isResolvedStatus`
   helper function (which also accepts `statusCategory === 'canceled'`).
   The described *behavior* was correct — `wontfix` genuinely counts as
   finished — only the cited source name was wrong. **Fix**: cite
   `isResolvedStatus`, not the narrower constant.
2. `status-fsm.mjs`'s own doc comment — in the module that *defines* the
   FSM, the place a reader trusts most — still said "needs to return to
   `proposed` directly," even though `proposed` had already been renamed
   to `awaiting-approval` (the same rename `tsk-3q8` had already fixed
   inside `merge-loop/SKILL.md`'s own playbook text). Same root error,
   different location — this time landing inside the defining module's
   own comment rather than a consuming skill's prose. **Fix**: `proposed`
   → `awaiting-approval` in that comment.

Both fixes are text-only — no logic or behavior changed, and neither
touches any module in the Iron Law's `MODULE_RULES` except
`status-fsm.mjs` itself, which still trips the Iron Law's equals rule on
any edit to that file, comment-only or not.
