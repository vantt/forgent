# Independent Re-Review — Unit I12 Remediation (`205d112e4`)

```txt
Document type: Independent re-review (read-only against candidate)
Previous review: plans/reports/independent-review-260926-0756-unit-i12-boundary-simplification-report.md
Base: cfdaf4bc95d44a6132d03dfb635478b084e41b35 (main, unchanged)
Previous tip: c9bd9cdff1215feca2f189a7c64e0142f50d4f5e
Evaluated SHA: 205d112e4acb017a459f49ec3f67a27fc68de18d (code + docs + report in one commit)
Branch / worktree: dispatch-hardening-i12-boundary-simplification
Verdict: REQUEST CHANGES
```

## 1. Git state

- HEAD before and after the review is `205d112e4`, and the worktree is clean both times. No operation markers are present.
- `c9bd9cdff` is an ancestor of `205d112e4`. `git diff --check` is clean. The diff touches 28 files (+1054 / −404).
- main is still at `cfdaf4bc`, so there is no stale-to-main drift.
- The fix commit bundles code, tests, docs, CHANGELOG and the report, so it cannot be rolled back per finding. **LOW**.

## 2. Verification

| Run | Result |
|---|---|
| `env -u CLAUDE_CODE_SESSION_ID npm test` @ `205d112e4` | 7745 tests: **7672 pass / 0 fail**, 8 skipped, 65 todo, exit 0 (405 s). Matches the doer's figures. |
| Import-graph SCC scan (reviewer script) | Back to the base shape: only the pre-existing `assignment-runner ↔ cli` 2-cycle remains inside dispatch. |
| F1 probe (`probe-recover.mjs`) | evidence `[liveness]`, no park. Identical to base. |
| F2 probe (`probe-brief2.mjs`) | In production (null contract), the guardrail and the REQUIRED line are kept and there is a single result path. With a real contract (`resultClaim.path = runDir/agent-result.json`), the brief names **two** result paths. |

Logs: `/tmp/claude-1000/-home-vantt-projects-forgentX/3308586f-0f33-4cd4-9c59-c15fbfbf52f6/scratchpad/i12/logs2/` (`full-candidate.log`, `mutation-summary.txt`, `mut-*.log`).

## 3. Mutation proof, round 3

Each mutation ran against all 18 relevant suites (389 tests). The sandbox is a `git archive` copy and was reset after every mutation.

| Result | Mutations |
|---|---|
| Killed (15) | M1a, M1b, M2, M3, M4, M6 (transport seam), M7, M8, M9, M10a, M10c, M12, M14 (controller files → unknown), M17 (guardrail strip), M19 (run.json always settled) |
| **Survived (7)** | **M13 / M13b**: after-state captured in `effectiveCwd` again (base semantics)<br>**M15**: swallow the settled-receipt publish error in `herdr-round`, i.e. revert the F3 fix<br>**M18**: swallow receipt-path finalize errors<br>M1c: `['re','turn'].join('')`<br>M1d: `store['settle'+'Claim']`<br>M4b: dynamic `import('../herdr-round.mjs')` in authority |

## 4. Status of previous findings

| Finding | Status | Evidence |
|---|---|---|
| F1 BLOCKER | **Fixed + locked** | Controller bookkeeping is ignored. Probe matches base and M14 is killed. |
| F2 HIGH | **Partial** | The guardrail is kept and production uses a single path (M17 killed). `effectiveContract` is still **not** wired in production; see N3. |
| F3 HIGH | **Fixed, not locked** | The settled path is fail-closed again, but M15 survives: no test forces a publish failure on that path. |
| F4 HIGH | **Fixed by undoing R2** | The cycles are gone because the lookups were moved back into `resolve.mjs` / `prepare.mjs`; see N2. |
| F5 HIGH | **Over-corrected: new drift** | See N1. |
| F6 MEDIUM | Mostly fixed | Duplicate finalize removed, run.json projection conditional (M19 killed), `executionError` omitted when absent. Receipt-path finalize propagation is unlocked (M18). `resolveSafeRoot`'s last fallback is `runDir` where base used `process.cwd()` (LOW). |
| F7 MEDIUM | Label fixed; M4 locked | The argv parser is kept as a fallback, which is now disclosed honestly in CHANGELOG. R4's "delete the parser" is still unmet and needs a Track Manager decision. M4b survives. |
| F8 MEDIUM | **Partial** | New false claims; see N2 and N3. |
| F9 MEDIUM | Fixed | The env fallback was removed. |
| F10 MEDIUM | **Partial** | The order is back to `resolveFgosBin` then local, but a **new** `FGOS_BIN` env override sits in front of it. It does not exist in base and is not registered in setup/doctor, as the AGENTS.md install gate requires. |
| F11 MEDIUM | Partial | Still no raw logs. The doer's summary is inconsistent: dispatch-recovery is reported as "40/40" in one place and "30/30" in another. |
| F12 LOW | Mostly | 3 of the 7 original survivors are now killed; weaker variants still survive. |
| F13 / F14 LOW | Not addressed (not claimed) | — |
| F15 LOW | Fixed | `--blocked` is registered and tested. |

## 5. New / remaining findings

### HIGH
- **N1 — Settlement truth drift (F5 over-corrected).** `executeAssignment` still captures `gitBefore` / `dirtyBefore` / `dirtyBeforeSnapshots` in `effectiveCwd` (`assignment-runner.mjs:1993-2004`). It now captures `gitAfter` / `dirtyAfter` in `cwd` (`:2533-2535`). Base captured both before and after in `effectiveCwd`. When `cwd ≠ effectiveCwd` (fallback redirect or plan invocation cwd), `changedFiles` compares HEADs and dirt from two different directories, which can wrongly mark a read-only run as mutated or change its status. M13 and M13b (restoring base semantics) stay green, so no test observes this.
  - The new M12 test calls `settleRunOutcome` directly with a synthetic `dirtyBefore: []` / `gitBefore: null`. It does not exercise the real `executeAssignment` before/after pairing.
- **N2 — R2 reverted, lock deleted, docs and CHANGELOG false.**
  - `resolve.mjs` and `prepare.mjs` define `executorIdForWork`, `resolveCapabilityIdentityDetails` and `buildPrompt` again, and import `workflow-stage-graphs` directly. `operation-choice.mjs` only re-exports them.
  - The R2 boundary test ("dispatch core does not import workflow-stage-graphs") was **deleted**.
  - CHANGELOG still says the lookups were "Relocated … into operation-choice.mjs". `dispatch-control-plane.md:281/285` still says "zero direct `workflow-stage-graphs` imports (verified by boundary test)".
  - Net effect: R2's goal is unmet and a regression lock was removed. Getting R2 without a cycle needs a structural choice: break `operation-choice → assignment-runner`, or keep the lookups in core as a documented exception. The Track Manager must decide, and the docs must state the truth.
- **N3 — R6 `effectiveContract` still not wired in production; CHANGELOG says it is.**
  - `executeAssignment → executeExecutorCli` does not pass `effectiveContract` (grep: 0 occurrences in that call). `transport.mjs:858` only forwards an `opts` / `invocation` field that production never sets.
  - The new test injects the contract straight into the herdr adapter seam, so the production path is still unlocked.
  - Latent defect: with a real contract, `targetResultPath` becomes `runDir/agent-result.json`. The contract section and the rewritten "Claim path:" then point there, while "When you finish" still says `outbox/result-N.json`, which is the file the herdr round polls. The probe confirms two result paths. Wiring the contract as-is would leave workers unsure where to write and could stall settlement.

### MEDIUM
- **N4 — F3 has no regression lock** (M15 survives).
- **N5 — New `FGOS_BIN` env var** in `fanout-batch.mjs`: an unrequested behavior change and an unregistered env var (install/doctor gate).
- **N6 — Receipt-path finalize error propagation is unlocked** (M18).

### LOW
- The textual lifecycle/adapter locks can be bypassed by trivial obfuscation (M1c, M1d, M4b). A module-graph lock would be stronger.
- The `renderBrief` docstring still says the prompt is passed "verbatim -- this function … never rewrites it", but it now rewrites the prompt with 4 regexes.
- F13 and F14 are open. The single remediation commit makes per-finding rollback impossible.

No component-boundary change was made by this review; the boundary docs must be corrected (N2).

## 6. Required to reach APPROVE
1. **N1:** capture before and after state in the same directory, matching base (after in `effectiveCwd`, compare with `cwd` as base did), or declare the change and test it through `executeAssignment` with `cwd ≠ effectiveCwd`.
2. **N2:** the Track Manager decides the R2 shape. Restore a truthful boundary lock, and correct CHANGELOG and `dispatch-control-plane.md`.
3. **N3:** either wire `effectiveContract` from `executeAssignment` through `executeExecutorCli` to herdr, with one consistent result path in the brief (align `resultClaim.path` with the polled outbox file, or the reverse), and test it via `executeAssignment`; or remove the "wired into production briefs" claim and mark R6's contract item open.
4. **N4–N6:** add locks for M15 and M18, and drop or register `FGOS_BIN`.

## Unresolved questions
- R2: can the Work lookups stay in dispatch core as a documented exception, or must `operation-choice → assignment-runner` be broken so they can move out?
- R4: is keeping the argv parser as a fallback (now disclosed) acceptable?
