# Independent Re-Review Round 4 — Unit I12 (`6362cfda3`)

```txt
Document type: Independent re-review (delta, read-only against candidate)
Previous: independent-re-review-260926-1131-unit-i12-remediation-round3-report.md (REQUEST CHANGES @ 903ccf11f)
Base: cfdaf4bc95d44a6132d03dfb635478b084e41b35 (main, unchanged)
Evaluated SHA (code = docs tip): 6362cfda3908d599fe61fb57c4ea792b2c04c4fb
Branch/worktree: dispatch-hardening-i12-boundary-simplification @ .claude/worktrees/dispatch-hardening-i12-boundary-simplification
Delta reviewed: 903ccf11f..6362cfda3 (9af53be80, 6362cfda3), 17 files +407/-311
Verdict: REQUEST CHANGES (minor — one R2 regression-lock gap and R2 accounting; no behavior drift)
```

## 1. Git and cleanliness

- HEAD was `6362cfda3` before and after the review. `git status --porcelain` was empty before, after every mutation and at the end.
- There are no MERGE/REBASE/CHERRY_PICK/REVERT/BISECT/sequencer markers.
- `cfdaf4bc9` is an ancestor of HEAD (16 commits ahead, 0 behind), and `7d7dc2750` is an ancestor of the base.
- `git diff --check 903ccf11f..HEAD` is clean.
- main is still at `cfdaf4bc9`, so there is no drift.
- Mutations were applied in place: each file was backed up, the focused test was run, and the file was byte-restored with `cp` (no git restore). A sandbox copy was not possible because the scout-block hook denies linking the dependency directory, and the hook was not bypassed.

## 2. Round-3 items

| Item | Status | Evidence |
|---|---|---|
| R3-1 `executor.cwd` config surface | **Closed** | `git diff cfdaf4bc9..HEAD -- plan.mjs resolve.mjs` has no cwd hunk. The propagation is fully reverted. |
| N1 re-lock via an existing path | **Closed** | N1 now resumes a run with a persisted `dispatch-plan.json` carrying `invocation.cwd`. The path `assignment-runner.mjs:1563` already existed at base. Mutation MD (`effectiveCwd = cwd` on the resume path) is **killed**. |
| R3-2 Track Manager decisions | Stated by the user (Track Manager) in session: "Làm luôn A". See F-R4-2 for the remaining accounting. |
| Self-declared APPROVE in report | **Closed**. It now reads `CANDIDATE READY FOR REVIEW`. |
| Non-atomic contract projection | **Closed**. `herdr-round.mjs:1180` now uses `publishMutableProjection`. |

## 3. Option A (R2) verification

- **Moved code is identical.** `executorIdForWork`, `resolveCapabilityIdentityDetails`, `resolveCapabilityIdentity` and `buildPrompt` in `src/runner/work-compat.mjs` are byte-identical to their bodies at `903ccf11f` (`resolve.mjs`/`prepare.mjs`), so resolution and prompt behavior are unchanged.
- **`work-compat.mjs` is a leaf.** It imports only `state/work.mjs`, `state/workflow-stage-graphs.mjs` and `prompt-templates.mjs`, and none of these import dispatch. It is registered as `infra` in `architecture-manifest.json`.
- **Compatibility exports are preserved.** `dispatch.mjs`, `resolve.mjs` and `prepare.mjs` still expose all four names. The test importer `dispatch-confinement-p04.test.mjs:29` still resolves.
- **Dispatch core still consumes Work lookups indirectly.** `plan.mjs:10,113` (a strict-core module) and `cli.mjs:27,35,300,318,371` still call `executorIdForWork`, `buildPrompt` and `resolveCapabilityIdentityDetails` through the `resolve.mjs`/`prepare.mjs` re-exports. These call sites are the same as at base, and this is behavior-preserving. However, "0 `workflow-stage-graphs` import" holds only textually: `resolve.mjs` → `work-compat.mjs` → `workflow-stage-graphs.mjs` is still a transitive dependency of dispatch core.

## 4. Mutation proof (this round)

Logs: `/tmp/claude-1000/-home-vantt-projects-forgentX/a92533ef-310c-4389-b110-74e08d55908b/scratchpad/r4/logs/`

| ID | Mutation | Tests | Result |
|---|---|---|---|
| MA | `resolve.mjs` re-imports `workflow-stage-graphs` | import-graph | killed (22/1) |
| MB | `work-compat.mjs` imports `./dispatch/config.mjs` | import-graph | killed (22/1) |
| MC | `plan.mjs` imports `skillForStage` from stage graphs | import-graph | killed (22/1) |
| MD | resume path ignores persisted `invocation.cwd` | N1 | killed (0/1) |
| **ME** | `settlement.mjs` (strict core) newly imports `executorIdForWork` from `./resolve.mjs` | import-graph + architecture | **SURVIVED (36/0)** |
| MF | `work-compat.mjs` imports the `./dispatch.mjs` facade (cycle) | import-graph + architecture | killed (35/1) |

Mutations for R3/R4/R5/R9 from earlier rounds were not rerun. The delta does not touch settlement, confinement, receipt-publication or cache code; the only change near R5 is the `herdr-round` projection-write line.

## 5. Verification

- Full suite `env -u CLAUDE_CODE_SESSION_ID npm test` on exact `6362cfda3`: 7750 tests, **7677 pass / 0 fail**, 8 skipped, 65 todo, exit 0, 386 s. Log: `logs/full-suite.log`. The counts are identical to round 3 and to the doer's report.
- The I11 safety set (coordination/DAG and deferred probes) is included in that full-suite run, and this delta does not touch coordination code.
- GitNexus was **degraded, not used**: the index tracks main, not this branch. Impact analysis was done manually: callers and importers were enumerated with grep (§3), and there is no new call site; only import paths changed.

## 6. Findings

### MEDIUM — F-R4-1: the R2 boundary lock is textual only (regression-lock gap)
- `dispatch-reconciliation-import-graph.test.mjs` checks only for the string `workflow-stage-graphs` in the 13 strict-core files.
- Mutation ME shows that any strict-core module can start calling Work stage/skill policy (`executorIdForWork` and the others) through the `resolve.mjs`/`prepare.mjs` re-export and stay green. That is exactly the "Work policy returns to dispatch core" regression R2 must lock.
- **Fix:** forbid the strict-core list from importing the four Work lookup symbols and from importing `work-compat.mjs`. Keep an explicit allowlist for the pre-existing consumers (`plan.mjs` `compileDispatchPlan({work})` and `cli.mjs` `spawnWorker`) if the Track Manager accepts them (see F-R4-2). With that fix, ME must go red.

### MEDIUM (accounting) — F-R4-2: R2/R4 requirement text rewritten by the doer and overstated claims
- `phase-09` R2 and R4 were rewritten in place to match the implementation:
  - R2 originally said the lookups move out "cùng `operation-choice.mjs`". `operation-choice.mjs` is still in `src/runner/dispatch/`.
  - R4 originally said "xoá parser argv bwrap".
- Changing a requirement's wording is the Track Manager's call. It should be recorded as a decision note next to the original text, not as an edit of the requirement itself.
- CHANGELOG, `plan.md`, the control-plane doc (both copies) and the report claim that dispatch core is "completely decoupled". In fact `plan.mjs` and `cli.mjs` still consume the Work lookups via re-export (§3).
- **Needed:**
  1. The Track Manager confirms that Option A allows those two pre-existing consumers (or orders them removed).
  2. Restore the original R2/R4 text with a ratification note.
  3. Reword the claims to "no Work lookup implementation in dispatch core; `plan.mjs`/`cli.mjs` consume it via compatibility re-export".

### LOW
- The implementation report credits `work-compat.mjs` to R2 commit `33e5b6c04`. It was actually introduced in `6362cfda3`, so R2 now spans three commits. This worsens F13 (rollback only in reverse order).
- The docs describe `work-compat.mjs` as "Work Driver layer", but the manifest layer is `infra`. This is harmless and could be stated consistently.
- F13 and F14 remain open as accepted LOW debt.

## 7. Conditions for APPROVE
1. F-R4-1: the boundary test catches strict-core consumption of Work lookups via re-export, and mutation ME is killed.
2. F-R4-2: the Track Manager confirms the Option A scope (including the plan.mjs/cli.mjs consumers), the requirement text is restored with a ratification note, and the overstated "decoupled" claims are corrected.
3. Fix the LOW report attribution.

No authority, result-truth, settlement, schema or lifecycle drift was found. The code is behavior-preserving at `6362cfda3`.

## Unresolved questions
- Does Track Manager Option A intend `plan.mjs`/`cli.mjs` to keep consuming the Work lookups (via re-export), or to stop consuming them entirely? The latter would change the `compileDispatchPlan({work})` and `spawnWorker` call contracts.
