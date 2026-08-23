# Why the "stage-axis driving loop and status-axis pool-sweep stay separate" decision got superseded

`docs/history/stage-status-driving-coordination/CONTEXT.md` (produced by
tsk-1bl/tsk-2xt, after "two rounds of independent advisory review" with
file:line evidence) locked a decision: `fgos-coding-driving`'s stage-axis
loop and `retro-next`/`cleanup-next`'s status-axis pool-sweep must never
become one unified driving mechanism. Four concrete structural reasons
were quoted (D2 a-d): a per-item loop cannot own `fgos retrospective`'s
whole-pool sweep; `fgos-coding-compounding` doesn't self-advance status;
`cleanup`'s TTL gate parks `cleanup -> blocked` in a way a naive loop would
misread as failure; stage-axis work runs in a worktree while
`approve`/`cleanup` run at the main checkout. Plus one survivor: the
`awaiting-approval -> delivered` human merge gate, "never automated by any
driving loop regardless of how the loop's handler-resolution logic is
designed."

tsk-3cx started by asking almost exactly the question that decision had
already answered "no" to — and its own first research pass (round 1)
walked straight into that locked record without at first noticing the
answer had already been given.

## Round 1's framing was inverted

Round 1 treated `status`'s post-merge chain
(`retrospective -> cleanup -> done`) as a tail segment bolted onto the
"real" lifecycle, and the driver's `awaiting-approval` stop as a wall nothing
could legitimately cross. Under that framing, delegating `retro-next` to
the driver looked identical to the thing D1-D3 rejected, and the round
returned `unclear` to a person.

## The correction: status is the whole lifecycle, stage is the sub-axis

The user rejected that framing outright and supplied the vocabulary this
item ended up locked around: **orchestrator** (chooses and coordinates
across many items), **launcher** (activates one item, sets its ceiling),
**driver** (drives the process on one item — skip what's already passed,
land on the current step, stop at the ceiling).

Re-derived against that vocabulary, `src/state/status-fsm.mjs`'s
`TRANSITIONS` table covers `todo -> doing -> awaiting-approval -> delivered
-> retrospective -> cleanup -> done` (plus `blocked`/`awaiting-human`/
`wontfix`) — ten values spanning the entire item lifetime. `stage`
(`clarify -> discovery -> exploring -> decompose -> executing`) only
carries meaning while `status` is one of `todo`/`doing`/`blocked`/
`awaiting-human`, and freezes from `awaiting-approval` onward. Round 1 had
it backwards: `status` was called "the post-merge chain" when it is
actually the full axis stage sits inside of.

## Re-examining the four "structural breaks" under launcher/driver — three dissolve, one becomes a table entry

- **(b) "sweeps the whole `delivered` pool, not one id"** — dissolves.
  Pool-sweep-and-pick-one is the **launcher's** job, never the driver's.
  Round 1 had mistaken a launcher responsibility for evidence against the
  driver.
- **(a) "`fgos-coding-compounding` does not self-advance status"** — not a
  law. The driver already carries this exact documented exception for
  stage `discovery`, where `fgos-researching` likewise refuses to write
  state and the driver applies the returned verdict on its behalf
  (tsk-4b2 D4). A second instance of an established pattern, not a new
  class of problem.
- **(c) "TTL parks `cleanup -> blocked`, misread as failure"** — a missing
  **park vocabulary**, not an impossibility. `parkReasonForStatus` exists
  precisely as the indirection layer built for this. (Scout for tsk-3cx
  itself went further and found even the vocabulary gap wasn't needed:
  `pickNextCleanupItem` already pre-filters so only TTL-elapsed items ever
  reach the driver — the launcher, not the driver, absorbs this case.)
- **(d) "worktree vs main checkout"** — the driver already reads
  `domain.worktreeBacked` and branches its claim path on it.
- **(D1) the human merge gate** — the one survivor. It stays protected, but
  as a **ceiling** (something the driver already supports as first-class
  input) rather than a hardcoded refusal baked into the loop.

## The decisive evidence D1-D3 never had

`src/state/workflow-stage-graphs.mjs`'s `skillMap` had already unified the
two axes: one frozen object holding five `stage` names *and* one `status`
name (`retrospective`) side by side, put there deliberately by decision
record `0027` D5, which recorded that "the two vocabularies never collide"
and that which lookup table a key belongs to is the caller's own concern.
The registry both the driver and every launcher read was already an
"item's current position -> skill to run" map mixing stage and status.
Only the driver's own loop hadn't caught up — its advance-axis was still
hardcoded to `domain.stages`. `stage-status-driving-coordination`'s D1-D3
had reasoned about merging two **loops**; it never considered that the
**registry both loops read** had already merged the two vocabularies.

## What this changed, and what it left standing

Per `AGENTS.md`, a locked decision is never edited in place — it is
superseded. `stage-status-driving-coordination/CONTEXT.md` stays as
written; `docs/history/retro-next-shared-driving/CONTEXT.md` records the
supersession and the reasoning above. The actual mechanism this unlocked —
the driver resolving each iteration's next step from the item's current
position instead of `domain.stages`, and `awaiting-approval` becoming a
default, overridable ceiling instead of an unconditional stop — is
documented separately in
[why `awaiting-approval` became an overridable ceiling](why-awaiting-approval-became-an-overridable-ceiling.md).
This document is about the narrower, procedural question: why a locked
"no" from two rounds of independent review was still correctly reopened —
new evidence the original review never had (the registry's own prior
unification), not a re-litigation of the same facts.

## An incidental friction, resolved safely

Landing this item's own root branch hit one recorded friction: a
`sync-root` merge of `fgw/tsk-3cx` into `main` conflicted mid-merge. The
merge was aborted and `main` was left unchanged (`disposition: blocked`,
`errorClass: merge-conflict`) — no content was lost or silently discarded;
the conflict simply had to be resolved in a later pass before the branch
could land.
