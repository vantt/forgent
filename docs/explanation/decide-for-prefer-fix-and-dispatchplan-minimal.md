---
authoritative_for: fgos dispatch.mjs decide --for calling resolveExecutorIdForPurpose and never reading capabilities.<name>.prefer via resolveExecutorAndOverrides, so decide --for fgos-coding-implement returned unavailable despite a configured prefer; fixed by routing --for through resolveExecutorAndOverrides, plus a minimal DispatchPlan module (compileDispatchPlan) wrapping the existing routing decision rather than re-deriving it
---

# `decide --for` ignored the exact config field it was supposed to read

`tsk-5x7-1` is the first of `tsk-5x7`'s three dependency-free children —
the piece proving `DispatchPlan`'s own seam works, landing the first green
proof.

## The bug

`decide --for` (`cli.mjs:685`) called `resolveExecutorIdForPurpose`,
which never reads `capabilities.<name>.prefer` — that field is only read
via `resolveExecutorAndOverrides`. So `.fgos/config.json`'s
`"fgos-coding-implement": { "prefer": "agy" }` had no effect:
`decide --for fgos-coding-implement` returned `unavailable` even though a
real preferred executor was configured.

## What shipped, in the order the item specified

**(0a) Fix the live behavior first.** `decide --for` now routes through
`resolveExecutorAndOverrides` — the same function `decide <executorId>`
already used — instead of `resolveExecutorIdForPurpose`. Characterization
tests for all four selector forms were written BEFORE the change, per the
item's own ordering. Post-fix: `decide --for fgos-coding-implement`
returns `executorId: agy`, `out-of-process`, `configured: true`.

**(0b) Then, a MINIMAL `DispatchPlan`.** A new module,
`src/runner/dispatch/plan.mjs`, exposes `compileDispatchPlan()`. It calls
the EXISTING `decideDispatchMechanism`/`decideExecutorDispatchMechanism`
(`mechanism.mjs:42,82`) rather than re-deriving any routing rule of its
own — `DispatchPlan` packages `selector`/`caller`/`mechanism`/
`executorId`/`capability`/`invocation`/`reasonCodes` around that existing
decision. Per `tsk-5x7`'s D6, "minimal" here meant deliberately NOT
porting every dispatch caller in this piece — `decideExecutorCli` alone is
enough to prove the seam; `spawnWorker`/`fanoutBatchExecutorCli`/the
PreToolUse hook only get ported once something actually needs them.

**(0c) A hoisted piece of the governance work, done generically.** At the
footprint-overlap gate, a person decided to hoist the dispatch-audit-event
work into this piece rather than the sibling governance piece
(`tsk-5x7-2`), since this piece already owns `cli.mjs` and already builds
`plan.governance`. `logExecutorDispatch` (`cli.mjs:298`) now records the
real spawned command alongside the self-declared provider label (both
fields already existed, per `tsk-5td` D9 — no new schema), and writes
whatever `plan.governance` carries into the event GENERICALLY — empty but
correct until the governance piece populates it. Writing it generically
is what keeps the two sibling pieces genuinely independent: no ordering
dependency, because this piece never needs to know the egress
descriptor's own shape.

## Landing note

Merged into `fgw/tsk-5x7` (the parent's own integration branch, not main
directly) — this is a decomposed child; the parent's own `sync-root`
later carries the combined change to main.

## The deferred `fanoutBatchExecutorCli` porting landed (`tsk-4jo`)

This doc's own §(0b) named `fanoutBatchExecutorCli` as deliberately NOT
ported in the minimal piece — only `decideExecutorCli` proved the seam.
`tsk-4jo` did that deferred porting: `fanoutBatchExecutorCli`
(`src/runner/dispatch/cli.mjs:687-701`) stopped hand-computing mechanism
via `executorIdForWork` +
`decideDispatchMechanism`/`decideExecutorDispatchMechanism` directly, and
now calls the same canonical `compileDispatchPlan(cfg, { work, workItem,
hasLiveTaskAccess })` every other dispatch caller uses — one function-body
swap, output contract unchanged (`fired`/`mechanismChanged`/`unavailable`/
`deferred`). A new test asserts a governance-blocked candidate is never
reported dispatchable through this path either. Verified: `node --test
test/runner/dispatch.test.mjs`, 328/328 passing, plus an independently
confirmed red-before/green-after Iron Law transcript for the new test.

**Why this item's own fgOS lifecycle record starts mid-stream.** The
original `tsk-4jo`'s `.fgos` event-log history was destructively lost —
an unrelated `git reset --hard` on the main checkout during recovery from
a broken out-of-process dispatch that had committed straight to main
instead of this item's own worktree branch. The real implementation,
its test, and the Iron Law evidence were already committed on
`fgw/tsk-4jo` (commits `1e878dda`/`163ef53`) before the event-log loss and
remained independently verifiable, so the item was re-submitted under the
same id (the store had no record of the old one) rather than fabricating
a from-scratch discovery/planning narrative for work already done.
