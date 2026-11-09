---
phase: 05
title: "PROPOSED - AWAITING OWNER APPROVAL: one run-supervisor door to run a command under worktree custody; workflow stops importing holder-lock and cwd-lock"
status: pending
depends_on: ["04 landed (layer order)", "COOK's unit-run-result contract text written", "owner approval of COOK's four-step split (decision 81)"]
parallel: "T4 (Execution layer); alone in its layer; touches no bin/fgos.mjs range"
effort: ~1d
net_size: "Node about 0 (door +30, seven call sites -30); Rust 0; tests about +25 (estimate)"
---

# Phase 05 - Custody door (COOK step 3) - proposed - awaiting owner approval

**Not started and not gating** until the owner approves and COOK's `unit-run-result` text exists; this phase cites that text for the door's exact signature. If the text names a different shape, step 1 stops and reports.

## Context

Layer names (decision 81): Execution, Workflow, Domain; Workflow sits above Execution. Today `src/workflow` reaches into two lower mechanisms directly:

| Site | What it does |
|---|---|
| `src/workflow/case-gate.mjs:18-19,85,106` | `createLockScope('unit-custody')`, `admitSuccessor(...)`, `recordCustodyHandoff(custody, result)` to run a gate command under worktree custody |
| `src/workflow/case-close.mjs:20,190` | `dispatchCwdHolder(fgosDir, record.worktree)` as the `custody-held` close blocker |
| `src/workflow/case-runtime.mjs:13,73` | `dispatchCwdHolder(...)` before it reuses a worktree |
| `src/workflow/case-bindings.mjs:17,19,54,149` | `cwdDevIno(worktree)` (key of the dispatch-cwd lease) and `dispatchCwdHolder(...)` for "attempt-not-quiet" |
| `src/workflow/case-lock.mjs:9,28-59` | `acquireSync`, `createLockScope('advance')`, `lockHolders`, `probe`, `resolveLock` for the case advance lock |
| `src/workflow/unit-handoff.mjs:15,406` | `createLockScope('workflow-worktree')` default of `createWorkflowWorktree` |

`src/run-supervisor/cwd-lock.mjs` owns the custody mechanism; the scopes come from `src/holder-lock/index.mjs`. The owner's frame (decision 81): one run-supervisor door to run a command under worktree custody, so Workflow never names holder-lock or cwd-lock. Reused: `src/run-supervisor/cwd-lock.mjs` exports (`dispatchCwdHolder`, `admitSuccessor`, `recordCustodyHandoff`), `src/holder-lock/index.mjs` scopes. Architecture manifest classes workflow files `infra` (`docs/architecture-manifest.json:322-338`).

## Requirements

1. **One door** in `src/run-supervisor/` (existing directory; a function in an existing module unless the contract text requires a file): run a command under worktree custody (admit, run, record the hand-off) and answer "is custody held on this worktree" and "the identity key of this worktree". Signatures from COOK's text.
2. **All six sites move** to the door in this one change (L10): after it, `rg -n "holder-lock|cwd-lock" src/workflow` finds nothing. The `advance` lock and the `workflow-worktree` scope are included **only if** the contract text assigns them to the door; otherwise step 1 files the leftover with `file:line` and P11 carries an explicit exception list (unresolved question 5 of the plan).
3. No behaviour change: the same locks, the same scopes, the same hand-off record.

## Files

**Create:** none unless the contract text requires a file in `src/run-supervisor/`.

**Modify:** `src/run-supervisor/cwd-lock.mjs` (or the module the text names), the six `src/workflow/*.mjs` files above (imports and call sites only), their tests (`test/workflow/*`, `test/run-supervisor/*`: find by `rg -l "dispatchCwdHolder|admitSuccessor|createLockScope" test`), `docs/architecture-manifest.json` (no new row if no new file).

**Delete:** the six direct imports.

**Tests to retire:** none; cases that stub `dispatchCwdHolder` inside Workflow tests are re-pointed at the door and keep their assertions.

## Red tests first

A Workflow unit case drives the gate path with the door replaced by a recording double and asserts the order admit, run, record; it fails today because the path imports the lock modules directly. One scan, recorded failing: `rg -c "holder-lock|cwd-lock" src/workflow` counts 8 import lines today (case-gate 2, case-bindings 2, case-close 1, case-runtime 1, case-lock 1, unit-handoff 1).

## Net size

Node about 0 (door +30, sites -30); tests about +25.

## Steps

1. Re-read COOK's contract text; enumerate every site with `rg`; reconcile with the table above; stop on a mismatch.
2. Red test and scan; door; sites.
3. Smoke: a workflow case with a gate step and a worktree runs to settle on a built host.

## Validation (focused)

FR the workflow and run-supervisor tests found in step 1; `test/architecture.test.mjs`; land gate. COOK reviews the door against the text; OPC glances at the lock scopes (T1).

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| A lock scope string changes and an older release holds the other side | L x H | scope names are moved verbatim; a test pins the strings |
| The door hides a lock acquired under the hot mutex | L x H | the door adds no spawn and no lock beyond today's; `exec-under-hot-lock` rule (HARDEN plan risk summary) checked in the report |

## Rollback

Revert the merge commit.

## Done when

Red then green; the scan prints 0 (or the named exception list); COOK confirms against the contract text.
