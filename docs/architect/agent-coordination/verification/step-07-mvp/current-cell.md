# Current Cell: P02.5

Status: closed
Owner: Coordinator (independent verification complete, cell closed)
Last updated: 2026-09-01
Next action: prepare P03.1 (Phase 03, R1-R2: harness seam + non-driving rule)

## Goal

Land ADR-006 R8: migrate mission-lite onto the inline Assignment path.
`createMissionAssignment` builds an inline contract (role from the mission
role, `mutation: 'read-only'`, `evidence.required: 'reported'`, objective
and context refs from the mission) instead of a declared
`domain+stage+operation` shape. Stop the duplicate-write pattern:
`.fgos/missions/<id>/assignments/*.json` and
`.fgos/missions/<id>/results/*.json` currently hold FULL COPIES of what
`executeAssignment()` already writes canonically under
`.fgos/assignments/<assignmentId>/`; mission-lite's own records
(`thread.jsonl`) should store assignment/run IDs as references instead.
`thread.jsonl`/`mission.json` themselves are unchanged (they stay the
ledger prototype).

## Why This Is Its Own Cell

Split from the plan's suggested "R7+R8" back in P02.4's own prep, because
R8 needs `validateAssignmentLegality` (`assignment-runner.mjs`) to accept
inline-shaped Assignments at all — confirmed again just now by reading the
function directly: it unconditionally calls `operationsForStage(asgn.domain,
asgn.stage, ...)` and throws "unknown operation" for ANY Assignment with no
`domain`/`stage`/`operation`, which is exactly what an inline Assignment
looks like (`buildInlineAssignment` sets none of these). This is a real
prerequisite change to the same function P02.4 just spent 3 rounds
hardening — read that history (`P02.4.md`) before touching this function
again.

## Non-Goals

Phase 03 work (harness seam, CLI `--contract` door, live proofs). Do not
change `mission.json`/`thread.jsonl`'s own schema or `appendThreadMessage`/
`getMission`/`listMissions` (unchanged per R8's own text). Do not change
anything about the mutating-inline-rejection rule (`execution-contract.mjs`,
P02.1, closed — stays fail-closed).

## Must Read

- `plans/260831-1637-step07-inline-assignment-mvp/phase-02-assignment-provenance-and-stamped-snapshot.md`
  — R8 only (its Tests subsection references specific test line numbers
  from BEFORE this track's own P02.1-P02.4 work; those line numbers are
  now stale — match by test NAME/behavior described, not the stale line
  numbers)
- `docs/architect/agent-coordination/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md`
  §4 (minimum inline contract fields), §5 ("Same stores and governance...
  Both classes use `.fgos/assignments/`")
- `docs/architect/agent-coordination/verification/step-07-mvp/P02.4.md`
  — READ THIS FULLY before touching `assignment-runner.mjs` again. This
  function (`validateAssignmentLegality`/`executeAssignment`) was just
  hardened across 2 Review + 2 Red-Team rounds for a real bug class
  (raw-read-back bypassing the normalizer). Do not undo any of that work;
  build on top of it.
- `src/runner/dispatch/assignment-runner.mjs`:
  - `validateAssignmentLegality()` (~line 483-514) — the declared-operation
    legality check (`operationsForStage`/`matchedOp`) must be SKIPPED for
    an inline Assignment (`asgn.provenance?.kind === 'inline'`); the
    mission-lite refusal gate (`isMission && !isReadOnlyAssignment(asgn)`)
    stays, unchanged, applying to both shapes. `matchedOp`'s return value
    is never used by either call site (confirmed: both calls are bare
    statements) — for inline, returning `undefined` is fine.
- `src/runner/dispatch/assignment.mjs`:
  - `buildInlineAssignment` (from P02.1) — the exact accepted contract
    shape; `createMissionAssignment` needs to construct one of these
    instead of the current declared-shape call.
  - `execution-contract.mjs` (P02.1) — confirms inline contracts are
    ALREADY fail-closed against `mutation: 'mutating'` at build time, so
    mission-lite's own read-only refusal check becomes defense-in-depth,
    not the only gate (same "advisory only" relationship P02.4 already
    established between `isReadOnlyAssignment` and the stamped field).
- `src/runner/dispatch/mission-lite.mjs`:
  - `createMissionAssignment` (~line 228-283) — the declared-shape call to
    rewrite; currently ALSO writes `assignment.json` directly to
    `missionDir/assignments/<id>.json` (~line 268-270) — this is one half
    of the "duplicate write" R8 wants stopped, since `executeAssignment()`
    ITSELF writes the canonical copy under `.fgos/assignments/<assignmentId>/
    assignment.json` (`assignment-runner.mjs:560-563`) the moment
    `runMissionAssignment` is later called on the same assignment. Confirm
    this duplication yourself before removing the write — don't assume.
  - `runMissionAssignment` (~line 300-375) — currently writes the FULL
    `runResult` object a second time to
    `missionDir/results/<assignmentId>.json` (~line 359-360) — the other
    half of the duplicate-write pattern; `executeAssignment()` already
    persists the canonical `result.json` under
    `.fgos/assignments/<assignmentId>/runs/<NN>/result.json`. Replace with
    a reference (assignmentId + runId, or a path pointer) in the
    `thread.jsonl` RESULT message instead of a full copy — that message
    already carries `resultRef: 'results/<assignmentId>.json'`; change
    what it points to (or add a companion field) once the full copy is
    gone, so nothing reading `thread.jsonl` silently breaks.

## May Inspect

`test/runner/mission-lite.test.mjs` (existing tests — the phase file's own
description: 4 tests currently exercise one-shot role assignments and must
keep passing, ported onto the inline shape with an added assertion that no
`stage`/`operation` appears on the resulting Assignment; identify the
debate/synthesis-shaped tests by behavior, not stale line numbers, and if
genuinely multi-step/out-of-scope for this MVP slice, mark pending with a
reason rather than deleting — but only if actually inapplicable, don't mark
pending just to avoid fixing them), `test/runner/assignment-provenance.test.mjs`
(P02.1's inline-shape test patterns, for reference).

## Do Not Touch

`execution-contract.mjs`/`assignment-normalizer.mjs` (P02.1, closed — the
inline validation rules stay exactly as accepted); `operation-choice.mjs`
(P02.2/P02.3/P02.4, closed); anything in `assignment-runner.mjs` beyond the
one `validateAssignmentLegality` branch (its tamper-detection/read-back
logic was just hardened across 4 adversarial rounds in P02.4 — do not
disturb); `mission.json`/`thread.jsonl` schema; `getMission`/`listMissions`/
`appendThreadMessage`/`readThreadMessages`.

## Tests First

- Port the existing one-shot mission-lite tests onto the inline shape;
  each must assert the resulting Assignment carries `provenance.kind ===
  'inline'` and NO `stage`/`operation` fields.
- New test: `validateAssignmentLegality` accepts an inline Assignment
  (skips the declared-operation check) but still enforces the mission-lite
  read-only refusal gate.
- New test: confirm `.fgos/assignments/<assignmentId>/assignment.json` (the
  canonical location) is the ONLY place the assignment is written —
  `missionDir/assignments/` no longer gets a duplicate; confirm
  `missionDir/results/` no longer gets a full `result.json` copy, only a
  reference persists in `thread.jsonl`.
- Golden: full `test/runner/mission-lite.test.mjs` plus
  `test/runner/**` + `test/architecture.test.mjs` before/after.
- Run: `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/runner/**/*.test.mjs' 'test/architecture.test.mjs'`.

## Acceptance

- `createMissionAssignment` builds an inline contract (no `stage`, no
  `operation`); `validateAssignmentLegality` accepts inline Assignments.
- No duplicate `assignment.json`/full `result.json` under
  `.fgos/missions/<id>/`; `thread.jsonl` carries references instead.
- `mission.json`/`thread.jsonl` schema and their own read/write helpers
  unchanged.
- Golden battery passes with no outcome changes beyond what R8 itself
  intends (the inline-shape assertion, the reference-not-copy storage
  change).
- Run: `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/runner/**/*.test.mjs' 'test/architecture.test.mjs'`
  — no new failures beyond the recorded baseline.

## Bug Taxonomy

Given this cell's own prerequisite is a second change to
`validateAssignmentLegality` (the function P02.4 spent 4 rounds hardening
against a "raw read-back bypasses the normalizer" bug class): re-introduce
that EXACT bug class here if the inline branch skips legality checking in
a way that also accidentally skips the `mutation` backfill/read-only gate;
confirm the inline branch still goes through the SAME `isMission &&
!isReadOnlyAssignment(asgn)` check, unconditionally, for both shapes.
Removing the duplicate-write without confirming the canonical write
genuinely always happens first/reliably (a real Assignment must still be
recoverable even if a caller only ever looks under
`.fgos/missions/<id>/`, via the reference, not by re-deriving from
nothing). Breaking `thread.jsonl`'s consumers by changing `resultRef`'s
shape without checking who reads it.

## Trace Update

Doer writes Proof Matrix (R8 row), Commands, Gaps in
`docs/architect/agent-coordination/verification/step-07-mvp/P02.5.md`. Doer
does not write Review/Red-Team sections.

## Closure

Cell closed. Full history (Doer → Coordinator Verification → Review [2
MEDIUM, both fixed] → Red-Team [1 MEDIUM TOCTOU race, fixed] → Coordinator
Verification of the Red-Team fix) is in `P02.5.md`. R8 done; Phase 02
(R1-R8) is now complete. See `index.md` for the updated Phase/Requirement
Matrix and Follow-Ups.
