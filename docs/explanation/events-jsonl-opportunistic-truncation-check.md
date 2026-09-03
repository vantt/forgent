---
authoritative_for: events-jsonl-truncation-guard real-world efficacy gap, runOpportunisticMainCheckoutChecks, merge-abort hypothesis falsification, tsk-1ji implementation for tsk-24e's D1/D2
---

# The truncation guard existed but nobody ran it — now it runs itself

`tsk-1ji` is the implementation item deferred from [`tsk-24e`'s
investigation](events-jsonl-concurrent-data-loss-investigation.md)
(D1 detect-and-warn, D2 periodic auto-commit). It diagnosed *why* the
data loss kept happening despite an existing detector already being in
place, then shipped the actual fix.

## The detector already existed — it just never ran

`tsk-4oq`'s ~26-event history vanishing from `.fgos/events.jsonl` turned
out to be a live, real-world reoccurrence of a failure class an earlier
item (`tsk-cgg`, done) had already diagnosed and built a detector for: a
`git stash`/`checkout`/`reset`/`clean` on the shared main checkout
silently reverting the tracked, uncommitted-tail `events.jsonl` to an
older committed snapshot while `fgos` verbs kept appending on top.
`src/state/events-jsonl-truncation-guard.mjs`'s mark-and-content-hash
mechanism (registered as `fgos doctor`'s `events-jsonl-not-truncated`
check) was correctly implemented — but had a real efficacy gap this
session live-confirmed: **it only ran when a human or session explicitly
invoked `fgos doctor`.** Nothing in the normal pick/return/approve/submit
flow ever called it.

## The gap, made concrete

The sidecar mark was last legitimately advanced at `seq 21929`
(`2026-08-20T05:46:23Z`). Nobody ran `fgos doctor` again until roughly
2.5 hours and dozens of other items' worth of concurrent activity later —
at which point the check reported `passed:true`, mark still holding, even
though `tsk-4oq`'s real events (spanning roughly `seq 22069-22178`, well
after the marked position) had already been silently truncated and that
seq range re-filled by unrelated concurrent activity. The mark-and-hash
design (checking one fixed position, advanced only on a clean check) is
structurally unable to catch a truncation whose cut point lands after the
last mark but whose resulting gap gets papered over by enough subsequent
legitimate growth before the next `doctor` run — exactly what happened.
This was named explicitly as a real-world efficacy gap in a deliberately
detection-only design, not a flaw in `tsk-cgg`'s own original
implementation.

## A hypothesis tested and falsified before the real fix

The first planning pass assumed the mechanism was `git merge --abort`
silently discarding a concurrent `.fgos/events.jsonl` append, and planned
a fix around that. `fgos-coding-validating` reproduced that assumption
against three throwaway git fixtures — **none showed `git merge --abort`
silently discarding a concurrent append.** The reality gate failed on
Assumptions (NOT READY), routing back through planning's material-gap
hand-back to exploring, where the plan was redesigned around `tsk-24e`'s
own D1/D2 instead. A concrete instance of this repo's own gate discipline
working as intended: a wrong root-cause hypothesis was caught by
empirical testing before code shipped against it, not after.

## What shipped

`runOpportunisticMainCheckoutChecks` (`src/state/events-jsonl-
truncation-guard.mjs`): runs the truncation-guard check (and the D2
periodic fallback auto-commit) automatically at real main-checkout-lock
acquisition points — wired into `src/runner/claim-port.mjs` (pick) and
`src/runner/merge.mjs` (approve/merge, at two call sites) — shrinking the
detection window from "whenever a human happens to run `fgos doctor`"
(hours) to "the next pick or approve call" (single-digit verb calls).
Never blocks: a detected break is recorded as a warning
(`recordMainCheckoutGuardWarning`) and fails closed on the fallback
auto-commit (refuses to advance the mark or auto-commit past an
unacknowledged break), but never refuses the pick/approve operation
itself — consistent with D1's detect-and-warn-never-block decision.

## Where the module has gone since

`src/state/events-jsonl-truncation-guard.mjs` has been touched by further
iteration after `tsk-1ji` landed — its current header attributes the
module to a different item id than `tsk-1ji`, evidence of later rework
this doc does not attempt to fully trace. This doc covers `tsk-1ji`'s own
diagnosis-and-opportunistic-wiring scope only, not every subsequent
change to that file.
