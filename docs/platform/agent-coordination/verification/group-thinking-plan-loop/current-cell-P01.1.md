# Current Cell: P01.1 (Mutation Unlock)

Status: in-progress
Owner: Doer (to be dispatched)
Last updated: 2026-09-04
Next action: dispatch Doer

## Goal

Let a declared `operation` step dispatch as a real, mutating worker under
a narrow, testable four-condition rule (R1-R6), without weakening the
existing read-only guarantee for reviewer/red-team/consult/researcher/
advisor roles. Fix the `store.mjs` cwd/root session-path bug (R8).

## Non-Goals

- No CLI-layer change of any kind (that is P02.1's lease).
- No change to `dispatchPrimaryTask`'s or `proposeConsult`'s own hard
  read-only assertions.
- No speculative fix to `operation-choice.mjs` unless R6c's own
  investigation proves it's genuinely reachable with an inline mutating
  Assignment.

## Must Read

- `plans/260904-2329-group-thinking-plan-loop/phase-01-mutation-unlock.md` (full — this is the requirement source)
- `docs/architect/agent-coordination/verification/group-thinking-plan-loop/P01.1.md` (this cell's trace — grounding notes section has verified line numbers)
- `src/runner/coordination/session-engine.mjs`
- `src/verbs/coordination/schema.mjs`
- `src/runner/coordination/store.mjs`
- `src/runner/paths.mjs`
- `src/runner/dispatch/execution-contract.mjs`
- `src/runner/dispatch/assignment-normalizer.mjs`
- `src/runner/dispatch/operation-choice.mjs`
- `src/runner/dispatch/assignment-runner.mjs`
- `src/runner/dispatch/config.mjs`
- `src/runner/dispatch/cli.mjs` (real location of the file the phase calls `src/cli.mjs` — read-only, do not edit)

## May Inspect

Anything else under `src/runner/`, `src/verbs/`, `test/` for context.

## Do Not Touch

- `bin/fgos.mjs`, `src/cli/command-registry.mjs`, any `test/cli/**` file (P02.1's exclusive lease — no exception).
- `core/protocol-packs/group-thinking.json`.
- `src/verbs/coordination/chain.mjs`, `src/verbs/coordination/launch-master-loop.mjs`, `.agents/skills/fgos-plan-loop/**`.
- `docs/specs/runner.md`'s stop-gate paragraph.
- Any ADR file.
- `docs/architect/agent-coordination/verification/group-thinking-plan-loop/index.md`, `current-cell-P02.1.md`, `P02.1.md` — Coordinator/other-cell-owned.

## Tests First

Write the 7 "Tests First" items from phase-01-mutation-unlock.md as real,
failing tests before implementing. All engine-level (call
`runCoordinationUseCase`/`dispatchDeclaredOperation` directly with
explicit `ctx.cwd`/`ctx.repoRoot`), never through `bin/fgos.mjs`. Use a
real temp git repo with a real linked worktree for R3's check.

## Acceptance

Exactly phase-01-mutation-unlock.md's own Acceptance section — all 7
Tests First items pass (independently re-run by Coordinator), R9's smoke
command passes, zero regression in the focused
coordination/dispatch/assignment-dispatch/architecture suite (excluding
`test/cli/coordination.test.mjs`), independent Reviewer AND Red-Team both
APPROVE, R6c/R7/R8 investigations shown with real evidence in the report.

## Bug Taxonomy

Kernel-level. Watch for: false-success (grading `verified` on a delta
that isn't really there — R7's own named risk), fail-open on an
unresolvable cwd (R3), a second path that can set `isReadOnlyMode: false`
outside `runExecutorAttempt` (R5/R6b's whole point), silently widening
scope beyond `operation` steps (R1 must stay scoped).

## Trace Update

Doer writes to `P01.1.md`'s Proof Matrix, Commands, and Gaps sections
only (this file). Never edit Review/Red-Team sections. Never edit
`index.md` or `current-cell-P02.1.md`.

## Report

Write a short report to
`plans/260904-2329-group-thinking-plan-loop/reports/doer-260905-0000-p01-1-mutation-unlock-report.md`
(role, cell, outcome, paths touched, whether any shared-lease file was
touched (must be none), R6c/R7/R8 evidence). End with:
`Status: DONE | DONE_WITH_CONCERNS | BLOCKED` and a two-line summary.
