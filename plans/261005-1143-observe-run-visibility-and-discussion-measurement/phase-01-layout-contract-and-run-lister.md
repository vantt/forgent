---
phase: 1
title: "Run definition, Node lister, and the seven readers"
status: completed
priority: P1
effort: "1.5d"
dependencies: []
---

# Phase 1: Run definition, Node lister, and the seven readers

## Overview

Write the single run definition (see plan.md "What is a run"), give Node one lister, and bring every reader of the assignments tree onto it, separating readers that only list (safe) from readers whose behavior changes once nested runs become visible (reconciler, running-run check, operation choice). Fixes `show-run`, inspection and a live bug: a crashed nested panelist stays `running` forever.

Execution evidence: [layout inventory](../reports/observe-run-layout-261005.md)
and [rebaseline](../reports/observe-rebaseline-261005.md). Reader migration and
behavioral coverage are implemented and committed in `0b06824a7`. The original
source-enumerator guard was first declined (the cited policy belongs to one agent runtime, not to the repository) and was then written in `5608387d3` together with the exact import-closure assertion, hardened afterwards; see plan.md for its stated blind spots.


## Requirements

- Functional: a run under `assignments/unit-run-X/<role>/<round>/runs/<NN>/` is found by run id, listed by inspection, reported by `findRunningRuns` when it claims to run, and carries its full assignment id.
- Functional: flat legacy runs and runs without `assignment.json` (for example `asgn-deepseek-1791185611935`) keep working through the same rule, with role/adapter null.
- Functional: the walk stops at `runs/`, never follows symlinks, has a depth cap, skips unreadable dirs.
- Non-functional: no new store or index; cost measured before and after (the stop rule should cut the walk from about 13,000 directories to about 2,000).
- Non-functional: fixtures are synthetic and contain no `controlToken`, secrets or real discussion text.

## Architecture

`src/runner/dispatch/assignment-layout.mjs` exports `listAssignmentRuns(fgosDir)` (iterator of `{assignmentId, attempt, runDir, hasAssignmentJson}`), `findRunDir(fgosDir, runId)`, and `assignmentDir(fgosDir, assignmentId)` (containment check that compares **real paths**, not strings, because the existing guard at `runtime-inspection.mjs:26-30` only compares spelling). The rule is exactly the one in plan.md. A shared JSON fixture `test/fixtures/run-layout/expected.json` (flat, nested depth 2, no `assignment.json`, fallback `-fb1`, symlinked run, run planted inside an outbox, inline record with no `runId`) is read by the Node test now and by the Rust test in phase 2, so the two implementations cannot drift.

Readers, in two groups:

| Reader | Group | Notes |
|---|---|---|
| `runtime-inspection.mjs` `allRuns` (:69-81), cache kept | list only | return shape unchanged; `assignmentId` may now contain `/` |
| `show-run.mjs` `findRunDir` | list only | |
| doctor check at `registrations.mjs:569` | list only | currently hardcodes `runs/01` |
| `assignment.mjs:150` | audit | read first; may be an id allocator that must keep seeing flat ids |
| `visibility-session.mjs:234` `findRunningRuns` (also `dispatch-runs` root) | **behavior-changing** | live bug; surfaces nested runs to the reconciler |
| reconciliation planner (`--cwd` inspection view, around `reconciliation-planner.mjs:561-566`) | **behavior-changing** | nested orphans become active; main checkout is already blocked by 5 flat orphans |
| `operation-choice.mjs:109` | **behavior-changing or leave** | decides how the driver picks gate verdicts; change only with a test showing the nested case |
| `unit-run-history.mjs` | owner of unit semantics | stays; phase 4 reuses its rules (latest fallback wins, outcome mapping) |

## Related Code Files

- Create: `src/runner/dispatch/assignment-layout.mjs`, `test/runner/assignment-layout.test.mjs`, `test/fixtures/run-layout/` (fixture tree + `expected.json`).
- Modify: `src/runner/dispatch/runtime-inspection.mjs`, `src/verbs/dispatch/show-run.mjs`, `src/setup/registrations.mjs` (:569), `src/runner/dispatch/visibility-session.mjs`, reconciliation planner and `operation-choice.mjs` if the audit says so, `docs/specs/runner.md` (extend the nested-layout text at :1427 and :3077 with the run definition; do not add a parallel section), `docs/specs/observe.md` (link), `packages/run-result/contracts/run-result.read.v1.json` text (phase 2), `docs/architecture-manifest.json` (new module row), `CHANGELOG.md`.

## Implementation Steps

1. Prior-art: `git log -S"runs/"` on the walkers and `git log -S"unit-run-history"`; record what each reader assumed in `plans/reports/`.
2. Inventory report: every enumerator of the assignments tree (`readdir*`, `dirs(`, loops over a `roots` array) and every direct path builder whose id may now contain `/`: `recover.mjs:228` (deletes a file at a path built from the id), `operation-choice.mjs:701`, `worker-home.mjs:115` (temp-dir name from a run id). For each builder: containment check present? Reproduce first whether `worker-home.mjs:115` already breaks nested claude seats; fix only what reproduces.
3. Spec: extend the existing nested-layout text with the run definition, stop-at-`runs/`, symlink rule, `dispatch-runs` root, and the skip reasons.
4. Implement the module and its tests from the shared fixture (including the planted-run and symlink cases).
5. Switch the list-only readers; keep their tests green.
6. Behavior-changing readers one at a time. Before each: list what changes using the 4 nested runs that have `run.json` but no `result.json` (`find .fgos/assignments -path '*/runs/*/run.json'` minus those with `result.json`) and run `node bin/fgos.mjs dispatch reconcile plan` dry-run before and after; write the result into the report and the policy answer into the plan's open questions. Test `findRunningRuns` with a nested running run and a nested settled run.
7. Guard test: an allow-list of known direct enumerators, each with a reason (for example `unit-run-history.mjs`: owner semantics); fails for any new enumerator, including `roots` loops. The allow-list is expected to shrink, not hide.
8. Measure `allRuns` time before and after on this repo; manifest row, CHANGELOG line; narrow tests then `npm test` once.

## Success Criteria

- [x] `show-run`, inspection, doctor reader and `findRunningRuns` handle flat, nested and `assignment.json`-less runs through one module.
- [x] A run planted inside a worker outbox is not listed; a symlinked run is skipped.
- [x] Inventory report committed; guard test green with a justified allow-list; spec text extended in place.
- [x] Reconcile dry-run before/after recorded; policy for nested orphans decided, not assumed.

Evidence: [`observe-run-layout-261005.md`](../reports/observe-run-layout-261005.md), [`observe-rebaseline-261005.md`](../reports/observe-rebaseline-261005.md), and [acceptance repairs](../reports/observe-acceptance-fixes-261006.md). The original guard criterion is restored verbatim and unchecked. No owner waiver or equivalent permanent prevention is claimed.

Acceptance repairs: `c439264cd` adds independent result admission, owner-settlement fallback and ambiguous-ID refusal; shared Unicode ordering regressions pass in Node/Rust. The original source guard above remains unchecked because of runtime test policy, not a repository law or owner waiver.

## Risk Assessment

- Behavior change of the reconciler may block worktrees of workflow units and mdview: dry-run first, switch last, one reader per commit so a revert is one commit.
- `operation-choice.mjs` change could alter gate verdict selection: leave it on the allow-list unless a nested-case test proves a need.
- Signal it broke: a flat run missing from inspection, or reconcile reporting many new active runs; response: fix the rule or the policy, not add a per-reader branch.
