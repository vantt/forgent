---
phase: 05
title: "one run-supervisor door to run a command under worktree custody, and one Execution door that runs a verify under custody and classifies it; workflow stops naming the custody mechanisms"
status: completed
depends_on: ["04 landed (layer order)", "COOK's unit-run-result contract text (branch cook/unit-run-result, tip 444dd1b1b: section 7 names both doors)", "owner decision 85 (approved)"]
parallel: "T4 (Execution layer); beside P19 (file-disjoint); touches no bin/fgos.mjs range"
effort: ~1.5d
net_size: "Node about -35 (custody door +30, seven call sites -30; verify door +25, two classifiers and the gate's own digest -60); Rust 0; tests about +40 (estimate)"
---

# Phase 05 - Custody door and classified verify door (COOK step 3; authority audit AU-06, AU-12) - approved (owner decision 85), landed

**Approved by owner decision 85.** COOK's text exists (`docs/platform/runner/contracts/unit-run-result.md` on branch `cook/unit-run-result`, §7) and names both doors; this phase cites it for the exact signatures. If the text names a different shape, step 1 stops and reports.

**Authority moved:** worktree custody (T4 run-supervisor) stops being taken by Workflow directly; "run the verify command and turn its exit into a verdict or an infrastructure failure" moves from two copies (Execution `verifyUnit`, Workflow `runCaseGate`) to one Execution door.

## Context

Layer names (decision 81): Execution, Workflow, Domain; Workflow sits above Execution. Today `src/workflow` reaches into the custody mechanism directly:

| Site | What it does |
|---|---|
| `src/workflow/case-gate.mjs:18-19,85,106` | `createLockScope('unit-custody')`, `admitSuccessor(...)`, `recordCustodyHandoff(custody, result)` to run a gate command under worktree custody |
| `src/workflow/case-close.mjs:20,190` | `dispatchCwdHolder(fgosDir, record.worktree)` as the `custody-held` close blocker |
| `src/workflow/case-runtime.mjs:13,73` | `dispatchCwdHolder(...)` before it reuses a worktree |
| `src/workflow/case-bindings.mjs:17,19,54,149` | `cwdDevIno(worktree)` (key of the dispatch-cwd lease) and `dispatchCwdHolder(...)` for "attempt-not-quiet" |
| `src/workflow/unit-handoff.mjs:15,406` | `createLockScope('workflow-worktree')` default of `createWorkflowWorktree` |

`src/workflow/case-lock.mjs:9,28-59` takes Workflow's own `advance` lock on Workflow's own ledger through the T1 holder-lock door. That is a correct downward dependency and **stays** (decision 83 ii, audit AU-06): this phase does not move it and P11's rule does not forbid it.

The verify (audit AU-12): `verifyUnit` (`src/runner/execution/run.mjs:382`) and `runCaseGate` (`src/workflow/case-gate.mjs:85-131`) both resolve the command through `verifyCommandOf` (`src/runner/execution/loops/verify.mjs`), run `runCommand` (`src/runner/goal-check.mjs:51`, already takes `{ custody }`) under custody, and map a timeout or "could not run" to `findings`. So an infrastructure failure of the verify becomes a verdict and `resume` never reruns it. The gate also hashes its own output (`case-gate.mjs:125`) and classifies the exit code itself (`:114-115`).

Owner decision 83 (AU-12 a): a verify that times out or cannot run is `infrastructure`, and `resume` reruns it; Execution gets one door that runs a verify under custody and classifies it as `{ verdict: pass | findings } | { infrastructure: timeout | not-run }`; both `verifyUnit` and `case-gate` call it.

Reused: `src/run-supervisor/cwd-lock.mjs` exports (`dispatchCwdHolder`, `admitSuccessor`, `recordCustodyHandoff`), `src/holder-lock/index.mjs` scopes, `runCommand`, `verifyCommandOf`. Architecture manifest classes workflow files `infra` (`docs/architecture-manifest.json:322-338`).

## Requirements

1. **Custody door** in `src/run-supervisor/` (a function in `cwd-lock.mjs` unless the contract text requires a file): run a command under worktree custody (admit, run, record the hand-off), and answer "is custody held on this worktree" and "the identity key of this worktree". Signatures from COOK's text.
2. **All five custody sites move** to the door in this one change (L10): afterwards `rg -n "cwd-lock|unit-custody|workflow-worktree" src/workflow` finds nothing. `case-lock.mjs` and its `createLockScope('advance')` are untouched.
3. **Classified verify door** in Execution (beside `runCommand` in `src/runner/goal-check.mjs` or as an export of the module that owns `verifyUnit`; step 1 picks the existing home, no new file unless the text requires one). It resolves the command (`verifyCommandOf`), runs it through the custody door, hashes the output once, and answers `{ verdict: 'pass' | 'findings', outputDigest }` or `{ infrastructure: 'timeout' | 'not-run', outputDigest? }`. `verifyUnit` and `runCaseGate` both call it; `case-gate.mjs` keeps only admission and settle, and its own exit-code classifier and digest go.
4. **Behaviour change (owner 83):** a verify timeout or a failure to run settles the Unit as the infrastructure class of Execution's outcome vocabulary (`execution-failure` today; P20 names it in the outcome module), never as `findings`; the case gate settles its step the same way, so `resume` reopens it (decision 71 4a). Exit code of `fgos run` changes from 14 to 11 for that case. CHANGELOG line.
5. No other behaviour change: the same locks, the same scope strings, the same hand-off record.

## Files

**Create:** none unless the contract text requires a file in `src/run-supervisor/`.

**Modify:** `src/run-supervisor/cwd-lock.mjs` (or the module the text names), `src/runner/goal-check.mjs` (verify door, or the module step 1 picks), `src/runner/execution/run.mjs` (`verifyUnit` only), the five `src/workflow/*.mjs` sites above (imports and call sites), `src/workflow/case-gate.mjs` (classifier and digest out), their tests (`test/workflow/*`, `test/run-supervisor/*`, `test/runner/execution/*` verify cases: find by `rg -l "dispatchCwdHolder|admitSuccessor|createLockScope|verifyUnit|runCaseGate" test`), `docs/architecture-manifest.json` (no new row if no new file), `CHANGELOG.md` (one line: a verify that times out or cannot run is an infrastructure failure; `resume` reruns it).

**Delete:** the five direct custody imports in `src/workflow`; the gate's exit-code classifier and output hash; the timeout-to-`findings` mapping in `verifyUnit`.

**Tests to retire:** none; cases that stub `dispatchCwdHolder` inside Workflow tests are re-pointed at the door and keep their assertions. The verify classification cases move to the door's owning test in `test/runner/` (one place); the gate and `verifyUnit` keep one wiring case each. Cases that asserted `findings` for a verify timeout change their expected value (behaviour changed by owner 83) and say so in the commit body.

## Red tests first

- A Workflow unit case drives the gate path with the custody door replaced by a recording double and asserts the order admit, run, record; it fails today because the path imports the lock modules directly.
- The verify door's owning test: exit 0 gives `pass`, a non-zero exit gives `findings`, a timeout gives `infrastructure: timeout`, a missing command gives `infrastructure: not-run`. The last two fail today (both give `findings`).
- One scan, recorded failing: `rg -c "cwd-lock|unit-custody|workflow-worktree" src/workflow` counts the custody lines today.

## Steps

1. Re-read COOK's §7 and the contract fixtures; enumerate every site with `rg`; reconcile with the table above; stop on a mismatch.
2. Red tests and scan; custody door; custody sites.
3. Verify door; `verifyUnit` and `runCaseGate` call it; their classifiers and the gate digest go.
4. Smoke on a built host: a workflow case with a gate step and a worktree runs to settle; a Unit whose verify sleeps past its timeout settles as infrastructure and `fgos workflow resume` reruns it.

## Validation (focused)

FR the workflow, run-supervisor and execution verify tests found in step 1; `test/architecture.test.mjs`; land gate. COOK reviews both doors against the text; OPC glances at the lock scopes (T1).

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| A lock scope string changes and an older release holds the other side | L x H | scope names are moved verbatim; a test pins the strings |
| The door hides a lock acquired under the hot mutex | L x H | the door adds no spawn and no lock beyond today's; `exec-under-hot-lock` rule (HARDEN plan risk summary) checked in the report |
| A flaky verify now loops through `resume` instead of stopping as `findings` | M x M | `resume` is a human or Workflow decision, never automatic (decision 71 4a: no new automatic retry); the infrastructure kind (`timeout`/`not-run`) is shown |

## Rollback

Revert the merge commit; a verify timeout is `findings` again.

## Done when

Red then green; the scan prints 0; one verify classifier left (`rg -n "verifyCommandOf|runCommand" src/workflow` nothing); COOK confirms against the text.
