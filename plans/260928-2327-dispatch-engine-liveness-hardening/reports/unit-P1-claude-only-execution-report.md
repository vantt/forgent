# Phase 1 (Unit P1) — Claude-only parallel execution report

Runbook: `runbook-claude-only-parallel-execution.md`. Branch `unit/P1`,
worktree `.claude/worktrees/dispatch-engine-liveness-p1-judge-consolidation`,
base `main@3a08b5b59`, integrated `main@647e23a5c`.

Root-cause phase (audit finding C2): consolidate the process-liveness
comparison logic that the audit found duplicated across 9+ call sites onto
one correctly-built, reusable implementation.

## A real blocked-and-corrected premise (twice)

Lead's own plan text for this phase was wrong on two counts, both caught
by the implementer's own discipline (stop and escalate rather than force a
fix past an explicit stop condition) rather than by a separate review
round:

1. `resolveHolderLiveness` returns only `'held' | 'dead'`, never the third
   `'ambiguous'` value the plan's prose claimed.
2. It is not pure — it calls `isProcessAlive(holder.pid)`
   (`run-lock.mjs:34-42`), which calls `process.kill(pid, 0)`, a real
   syscall `process-identity.mjs`'s own header commits to never containing
   ("fs-only leaf: no child_process, no spawn/kill"), enforced by
   `test/runner/dispatch-reconciliation-import-graph.test.mjs`'s
   `BANNED_CALL_PATTERN`. Moving the function in unchanged would have
   violated that standing invariant.

Lead independently verified both claims directly against source
(`isProcessAlive`'s real body, the exact `BANNED_CALL_PATTERN` regex, the
exact two-value return) before deciding — both confirmed exactly as
reported.

## Decision: split pure judge from liveness probe (not a workaround)

Rather than shrink the phase's scope (the implementer's own offered
fallback option), Lead decided to split the design: promote a function
into `process-identity.mjs` taking an INJECTED `isAlive` fact — containing
only the bootId/processStartTime comparison logic (zero process-control
dependency) — while `run-lock.mjs` keeps its own `isProcessAlive` exactly
where it is, and its own `resolveHolderLiveness(holder)` becomes a thin
backward-compatible wrapper computing `isProcessAlive` locally and
delegating. This is architecturally BETTER than the original plan, not a
compromise: it correctly separates the data-plane concern (record
comparison — the actual scattered inconsistency the audit's C2 finding
names) from the control-plane concern (pid liveness probing, legitimately
caller-specific), and lets any of Phase 2-4's call sites that already have
their own local liveness probe adopt the same correct comparison semantics
without also being forced to adopt one specific probe implementation.

## Implementer (sonnet, fullstack-developer)

Implemented the split exactly as decided. `process-identity.mjs` grew from
32 to 71 lines (added `resolveHolderLiveness(holder, isAlive)` with a full
decision-table docstring, byte-identical comparison logic to the
original). `run-lock.mjs`'s own `resolveHolderLiveness(holder)` shrank to
a 3-line wrapper delegating to the promoted function. Added 9 new direct
unit tests (`test/runner/process-identity.test.mjs`) covering live pid,
dead pid, `isAlive=false` short-circuit, pid reuse (mismatched
processStartTime), missing/unreadable processStartTime, missing/mismatched
bootId, and no-pid-at-all. Confirmed none of the other 9+ liveness call
sites were touched or affected. Symlinked `target/` from the main checkout
(no Rust source touched) to get a genuinely complete full-suite baseline
in the worktree.

Self-caught and cleanly reverted one process error: an early edit
accidentally landed in the main checkout instead of the worktree — caught
via `git status`/`git diff` before any other tool ran, reverted with `git
checkout --`, confirmed clean, redone correctly in the worktree. Lead
independently confirmed the main checkout was genuinely clean (only
pre-existing untracked items) before merging.

## Lead final verification and merge

Independently read both `process-identity.mjs`'s new function and
`run-lock.mjs`'s new wrapper in full, confirmed the split matches the
decision exactly (injected `isAlive`, byte-identical comparison table,
backward-compatible single-arg wrapper). Ran the 3 touched test files
myself: 42/42 pass. Ran the full suite myself: 7991 tests, 7918→7918 pass
depending on run, 0 fail on the final clean run (the implementer's own
report noted one flaky, timing-sensitive `coordination-dag-concurrency`
failure under full-suite load, independently confirmed as unrelated and
non-reproducing — it did not appear in Lead's own rerun either).

`git -C /home/vantt/projects/forgentX merge --no-ff unit/P1` from the main
checkout onto post-runbook main, `ort` strategy, clean auto-merge, no
conflicts. `integratedSha = 647e23a5c068e1a0e8c16182d6606b6324596457`.
Reran the 3 key suites on the merged tree: 42/42 pass.

## Process note

This is the same discipline the previous track (`coordination-skill-
harness-simplification`) relied on throughout: an implementer that stops
at a genuinely uncertain fork rather than guessing, a Lead that
independently re-verifies the claim before deciding rather than trusting
the report, and a decision that improves on the original plan rather than
just patching around the surprise. The corrected design here is a direct
result of that discipline, not a lucky accident.

## Next

Phase 2 and Phase 3 are both unblocked (their only dependency was Phase 1)
and are file-disjoint from each other — dispatching both in parallel next,
per the runbook's own wave plan (Wave B).
