---
type: explanation
title: Why fgos checks repo invariants at return and merge instead of running the full test suite
tags: [return, approve, merge, verify, invariant-check, setup, doctor]
source_capture_ids: [tsk-516]
---
# Why `fgos` checks repo invariants at `return` and merge instead of running the full test suite

`fgos approve`/`fgos-coding-implement`'s re-verify only ever re-ran one
item's own narrow `item.verify` command, never the full `npm test`
suite (`runGoalCheck` spawns exactly `item.verify`, confirmed by reading
`src/runner/goal-check.mjs` directly). That let a real regression land on
`main`: `70a88ffd` (`tsk-1m0`) added `src/report/enduser-index-generate.mjs`
with no matching row in `docs/architecture-manifest.json`.
`test/architecture.test.mjs` went red on `main` after the merge, but
`tsk-1m0`'s own narrow verify never touched that test file, so both
`return` and the post-merge re-verify stayed green and the item landed
normally. `main` stayed red across several unrelated commits until a
person tripped over it and opened a separate one-line fix (`2e15dc30`).
The test that would have caught it already existed and was correct — the
gap was that nothing ran it at the right moment, which this repo's own
product priority #2 ("Release con người" — nobody should have to sit and
notice a red main by hand) explicitly rules out.

## Why not just run the full suite everywhere

Measured directly in this repo: `npm test` takes **163.1s** (2827
tests); `node --test test/architecture.test.mjs` alone takes **0.14s**
(3 tests) — roughly an 1165x difference. Verify already runs twice per
item; adding the full suite at both points would add ~326s per item,
every time, and reintroduce a known full-suite flake
(`tsk-3ld`) that this item's own scope deliberately stayed out of. The
full suite costs a thousand times more to catch exactly the class of bug
that a 0.14s invariant check already catches — real test debt by the
repo's own standard (D1), not a fix for the gap.

## The chosen shape: a narrow, deterministic "repo invariant check"

A **repo invariant check** is defined narrowly: a deterministic,
pure-file-reading command with no spawn/timing/network dependency, whose
pass/fail never depends on which item is currently running. Today this
repo has exactly one candidate: `test/architecture.test.mjs` (manifest
completeness + one-directional import checks) — conceptually closer to a
lint/invariant than a slow test. It runs at **both** `return` and
post-merge (D3): `return` catches the problem for the session that
caused it, at the point where fixing it costs nothing extra; post-merge
guards the actual tree that is about to land, covering the case where
`main` moved between `return` and merge.

Unlike the existing advisory checks (`frozenJudgeHits`/`footprintDiffHits`,
which never block a return on their own because they're heuristic), the
invariant check **hard-blocks** at both points (D4). The `tsk-1m0`
incident is the direct argument: an advisory check would have let the
exact same regression land anyway, since nobody was forced to look at
it. The check is deterministic — a manifest row exists or it doesn't, an
import points down or up — so there is no false-positive risk to guard
against by making it advisory. The cost asymmetry reinforces the choice:
a wrongly-blocked return costs one manifest line (`2e15dc30` was
literally a 1-line fix); an unblocked regression cost several days of a
red `main` plus a whole separate cleanup item.

## Why the second run is often skipped

D5: the post-merge invariant run is skipped when the merged tree is
provably identical to the tree already verified at `return` — `main`'s
HEAD is an ancestor of the branch, and the branch tip equals
`branchHeadAtReturn`. In that case post-merge would be a pure re-run of
data already known from `return`, on the exact same tree. When `main`
has advanced since `return`, the second run still happens — it is
checking something the first run genuinely couldn't have seen (a change
underneath the branch, not inside it). In the common case (`main`
unchanged), the invariant check effectively runs once, at `return`; the
two call sites in D3 exist specifically to cover the case where `main`
moved.

## Why the check command is configured, not hardcoded

The invariant check command is declared through `.fgos/config.json`
(D6), registered into `fgos setup`'s config-merge and `fgos doctor`'s
check registry, rather than hardcoding `test/architecture.test.mjs` into
the runner. fgOS is a platform other projects install — a project using
fgOS has no `test/architecture.test.mjs` of its own, so hardcoding this
repo's own test layout into the mechanism would be the wrong layer. An
absent `invariantChecks` config section reads as zero commands (fails
open, not closed) so this stays behaviorally opt-in for a project that
hasn't configured it yet.

## Related

- `docs/history/tsk-516-approve-reverify-scope/CONTEXT.md` — the full
  decision record (D1-D6) and the `tsk-1m0` incident evidence.
- `docs/how-to/diagnose-a-verify-fail-post-merge-block-on-approve.md` —
  the existing manual playbook this item's fix now partially automates.
