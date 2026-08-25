---
type: explanation
title: Why move needed an --answer flag to reach wontfix from awaiting-human
tags: [move, status-fsm, awaiting-human, wontfix]
source_capture_ids: [tsk-2lc]
authoritative_for: why fgos move gained an --answer flag, closing the last unreachable edge out of awaiting-human
---
# Why `move` needed an `--answer` flag to reach `wontfix` from `awaiting-human`

`tsk-2lc`, re-scoped 2026-08-14 during an install/setup/config/doctor
audit — its original premise (a `proposed -> wontfix` 2-hop workaround)
had already been resolved separately by `tsk-2ub`, which added
`todo`/`doing`/`blocked -> wontfix` transitions plus a fourth
`awaiting-human -> wontfix` door to `status-fsm.mjs`, and made the
refusal message name valid targets explicitly.

## The remaining real gap

`transitionWork` requires a non-empty `answer` for *any* exit from
`awaiting-human` — but `move`'s own CLI case never exposed an `--answer`
flag at all, so the `awaiting-human -> wontfix` edge was unreachable
through `move` even though it existed in the transition table. `fgos
answer` is the only other door out of `awaiting-human`, and it only ever
resumes to `todo`/`doing` (per `statusAtAsk`), never `wontfix` — so there
was no single-verb path to close out a parked item as won't-fix.

Reproduced live while closing a stale item in the same session:
`move --to wontfix` from `awaiting-human` failed with `"answer is
required"`; the only working path was a 2-hop workaround (`answer` first,
then `move`).

## The fix

`move` now forwards an `--answer` flag through to `transitionWork`,
making the `awaiting-human -> wontfix` edge actually reachable in one
call — matching what the transition table already declared as valid but
the CLI surface never exposed.
