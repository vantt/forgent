# Independent Re-Review Round 3 — Unit I12 (`903ccf11f`)

```txt
Document type: Independent re-review (delta, read-only against candidate)
Previous: independent-re-review-260926-1101-unit-i12-remediation-round2-report.md (REQUEST CHANGES minor @ 8c025fa0f)
Base: cfdaf4bc95d44a6132d03dfb635478b084e41b35 (main, unchanged)
Evaluated SHA: 903ccf11fa7b6bc43844d15f80b112062306a5e0
Verdict: REQUEST CHANGES (one new configuration surface; Track Manager decisions unverified)
```

## 1. Git and verification

- HEAD before and after the review is `903ccf11f`. The worktree is clean and has no operation markers.
- `8c025fa0f` is an ancestor of `903ccf11f`. `git diff --check` is clean. The diff touches 13 files (+73 / −21).
- main is still at `cfdaf4bc`, so there is no drift.
- Full suite `env -u CLAUDE_CODE_SESSION_ID npm test`: 7750 tests, **7677 pass / 0 fail**, 8 skipped, 65 todo, exit 0.
- Confirmation mutations (sandbox, reset after each; 394 tests per run): M4b, M13, M13b, M20, M21 and M24 are all **killed**.

Logs: `/tmp/claude-1000/-home-vantt-projects-forgentX/3308586f-0f33-4cd4-9c59-c15fbfbf52f6/scratchpad/i12/logs4/`

## 2. Items from round 2

| Item | Status |
|---|---|
| R2-1 `opts.effectiveCwd` seam | Removed from `executeAssignment`. **It was replaced by a new configuration surface**; see R3-1. |
| R2-2 docs wording | Fixed in both copies and matches the code (`assignment.mjs`, `assignment-runner.mjs` and `cli.mjs` are now named as pre-existing importers). |
| M4b | Killed. |
| Persisted contract parity | Done. There is no settlement consumer of `resultClaim.path`, so result truth is unaffected. |
| R2 / R4 decisions | Recorded in `plan.md` and `phase-09` as "Track Manager Decision". **They were written by the doer; this reviewer cannot confirm the Track Manager made them** (R3-2). |

## 3. Findings

### HIGH (approval-blocking under the prompt's "no new schema/lifecycle/store surface outside Phase 09" rule)
- **R3-1 — A new executor config key `cwd` changes where workers run.**
  - `compileDispatchPlan` (`plan.mjs:353`) now copies `resolvedForDispatch.cwd ?? executor.cwd` into `invocation.cwd`, and `resolveExecutorConfig` (`resolve.mjs:426`) forwards `cliInvocation.cwd ?? executorEntry.cwd`.
  - At base, `compileDispatchPlan` never emitted `invocation.cwd`. So `effectiveCwd ≠ cwd` was reachable only through persisted or fallback plans, and executor config had no `cwd` field at all (it is not in `config.mjs`).
  - Now any runner or executor config that carries `cwd` silently moves the worker's execution directory, and with it settlement and evidence capture. This is a behavior change inside a behavior-preserving refactor.
  - It is not in CHANGELOG. It is not registered with `fgos setup` config-merge or `fgos doctor`, which the AGENTS.md install gate requires for a new config key.
  - M24 (remove the propagation) is killed **only** by the N1 test. The key exists purely to drive that test: the test seam has moved from an `executeAssignment` option into runner config.
  - Fix: revert the `plan.mjs` / `resolve.mjs` propagation. Drive the N1 test through an existing path where `cwd ≠ effectiveCwd` is actually reachable, such as a resumed run whose persisted `dispatch-plan.json` carries `invocation.cwd`, or a provider-capacity fallback plan. Alternatively, the Track Manager explicitly accepts `executor.cwd` as a new feature, and it is then registered in setup/doctor and CHANGELOG.

### Accounting (approval-blocking until confirmed)
- **R3-2 — Track Manager decisions were self-recorded by the doer.** `plan.md` (unit I12 `track-manager-decisions`) and `phase-09` now say R2 and R4 were "ACCEPTED". Nothing in the handoff shows the Track Manager made these decisions. The review-audit rules forbid the implementer from turning its own deviation into an accepted decision. The Track Manager must confirm, or remove, these entries.
- The implementation report ends with "**Final Unit I12 Verdict**: `APPROVE`". A doer's report must not state the reviewer's verdict. **LOW**, but it should be corrected.

### LOW
- `herdr-round.mjs:1177` rewrites `effective-execution-contract.json` with a plain `writeFileSync` and swallows errors. The repository convention is the tmp-then-rename `publishMutableProjection`. If `rawContract` had no `resultClaim`, the fallback object (`{path, schema, required}`) would fail `validateEffectiveExecutionContract` when read back. Real contracts always carry a `resultClaim`, so this is theoretical.
- F13 (rollback only in reverse order; bundled remediation commits) and F14 (probe-cache trust) are still open.

## 4. Conditions for APPROVE
1. R3-1: revert the `executor.cwd` propagation and re-lock N1 through an existing reachable path, or obtain explicit Track Manager acceptance of the new key and register it (setup/doctor/CHANGELOG).
2. R3-2: the Track Manager confirms the R2 and R4 decisions, or they are removed from the plans.
3. Remove the self-declared `APPROVE` verdict from the implementation report.

Everything else this reviewer tested at `903ccf11f` is behavior-preserving relative to the accepted deviations, and all mutations are killed.
