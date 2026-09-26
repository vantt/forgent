# Independent Review — Unit I12 / Phase 09 Boundary Simplification

```txt
Document type: Independent review report (read-only against candidate)
Reviewer session: fresh independent reviewer (no doer chat history used as truth)
Base: cfdaf4bc95d44a6132d03dfb635478b084e41b35 (main, unchanged during review)
Candidate code SHA: 94eb5b92ff2439c0fc63806d28929e0ddcf9a667
Candidate docs/report tip (evaluated SHA): c9bd9cdff1215feca2f189a7c64e0142f50d4f5e
Branch: dispatch-hardening-i12-boundary-simplification
Worktree: .claude/worktrees/dispatch-hardening-i12-boundary-simplification
Verdict: REQUEST CHANGES
```

## 1. Git reconstruction

| Check | Result |
|---|---|
| HEAD before / after review | `c9bd9cdff` / `c9bd9cdff` (unchanged) |
| Worktree `git status --short` before / after | empty / empty |
| Operation markers (MERGE_HEAD, REBASE_HEAD, CHERRY_PICK_HEAD, REVERT_HEAD, BISECT_LOG, sequencer) | absent |
| main / origin/main | `cfdaf4bc` / `b39898aa`; `origin/main...main` = `0 38` |
| base ⊑ code ⊑ docs tip; I11 `7d7dc2750` ⊑ base | all exit 0 |
| `git diff --check base..tip` | clean |
| Diff scope | 43 files, +3827 / −3174 |
| Stale-to-main | main has not moved since base; no drift |

Cell map (each parent = previous commit): R1 `f4d6fb708` · R2 `33e5b6c04` · R3 `598e5b43b` · R4 `5b8a1b2a0` · R5 `91d9109f5` · R6 `78de9c055` · R7 `ace4bbfc4` · R8 `f528dabbc` · R9 `94eb5b92f` · Docs `4504a7923` · Report `c9bd9cdff`. Order R1→R9 respected.

## 2. Handoff completeness

- The raw-log directory was not provided. The report cites counts only, with no log paths and no per-cell full-suite evidence. The phase requires `npm test` green after each R.
- No GitNexus evidence at all. The phase step 1 requires `impact` for every moved symbol plus `detect_changes` before each commit. Neither is recorded.

## 3. GitNexus / impact

GitNexus is registered as `present`, but its index covers the main checkout, not the candidate. `impact(collectEvidence)` returned "not found" even though the symbol exists, so GitNexus is **degraded** here. The reviewer did the following manual analysis instead:
- **Static import-graph SCC scan (reviewer script), base vs every cell.** Base has one 2-module dispatch cycle. R1 adds a 3-module cycle: `cli.mjs ↔ fanout-batch.mjs ↔ assignment-runner`. From R2 on there is a **14–15-module SCC**: `resolve.mjs → operation-choice.mjs → assignment-runner.mjs → … → resolve.mjs`, also covering `plan.mjs`, `transport.mjs`, `settlement.mjs`, `reconcile-cli-spawn.mjs` and `fanout-batch.mjs`.
- **Caller grep:**
  - `collectEvidence` has two callers: `recover.mjs:112` (observe) and `recover.mjs:299` (apply).
  - `computeHerdrResourceIncarnation` has five callers.
  - `renderBrief` has one production caller, `herdr-round.mjs:1159`.
  - `executorIdForWork`, `buildPrompt` and `resolveCapabilityIdentityDetails` are still called from dispatch core: `cli.mjs:302/320/373/695` and `plan.mjs:113`.

## 4. Adjudication R1–R9

| R | Verdict | Key evidence |
|---|---|---|
| R1 | **Partial** | `fanoutBatchExecutorCli` moved and the blocked-handback works (mutation M2 is killed). However, `dispatch/cli.mjs` still imports and re-exports `../fanout-batch.mjs` and `../dispatch-log.mjs`, which creates a new cycle, and the `fanout-batch` subcommand still lives in the dispatch core CLI. The grep test is textual only: M1b (import `settleClaim` into dispatch core) and M1c (build a `'return'` verb string dynamically) both stay green. There is also an unrequested behavior change: the fgos binary resolution order flipped from `resolveFgosBin(REPO_ROOT)` first to `FGOS_BIN` env, then local `bin/fgos.mjs`. A new public CLI surface was added: `fgos return --to blocked\|--blocked --reason`. It is mandated by R1 and recorded in CHANGELOG, but `--blocked` is not in the registry and there is no CLI-level test of the flag. |
| R2 | **Fail (boundary)** | The moved code is byte-identical (reviewer sorted-line diff). But dispatch core (`resolve.mjs`, `prepare.mjs`) now re-exports from `operation-choice.mjs`, which imports `assignment-runner.mjs`. That is a dependency inversion and it creates the 14-module import cycle. The dispatch core call sites are unchanged, so the Work lookups have not actually left the dispatch core call graph. |
| R3 | **Partial + drift** | `settleRunOutcome` unifies the inline path and the receipt path. `settleFailedRunFromOutcome` remains a separate third copy, so this is 2 of 3. Undeclared drift: see F4, F6, F9. Old exports are still present. |
| R4 | **Partial** | `assessAndPrepare` is shared by both doors (M3 is killed). The argv/bwrap parser was **not deleted**: it is still the authority when `driverClaims` is absent, including the completed-phase attestation. The prepared attestation now reports channels `covered` with the detail "observed hand-written bwrap sandbox" based on driver claims, which is inaccurate wording. `authority.mjs` dropped its herdr-agent and cli-spawn-supervisor imports, but no test locks this: M4 (add a `herdr-round.mjs` import to authority) stays green across 6 suites. |
| R5 | **Partial + drift** | `herdr-reconcile.mjs` was extracted and `publishHerdrCompletionReceipt` is shared. On the settled path, a publish error used to propagate (fail-closed). It is now swallowed unless it is `confinement-mismatch` (F3). |
| R6 | **Fail** | `effectiveContract` is never populated on the production herdr ctx: `transport.mjs:840` passes no such field, so the contract section never renders in production. M6 stays green because the test calls `renderBrief` directly. The regex strip deletes the prompt guardrail "Do not call Work lifecycle verbs…" (probe confirmed). The conflicting `agent-result.json` claim path still survives via the "Effective execution contract:" section, so there is still not "one result path" (F2). The argv size guard is present, but M7 (drop the guard) stays green. `prepareDispatch` has 0 callers, so removing it is OK. |
| R7 | **Fail (regression)** | Every non-authority file in `controller/` becomes `unknown` evidence and triggers `park`. `controller/evaluator-baseline.json` is written for every supervised cli-spawn Assignment run. On such a run, `fgos dispatch recover` with intent `resume` now parks where base recommended an action. The probe reproduces this: base evidence is `[liveness]`, candidate evidence is `[liveness, unknown]` and the result is park (F1). `gatewaySessionId` comes from `process.env.HERDR_GATEWAY_SESSION_ID` or a client field, which is not an authoritative source, and it now participates in `matchIncarnations`. The existing outbox-rejection test is weak because it passes for the wrong reason. M8b (base semantics restored) is killed, but M8 (read authority from both dirs) stays green. The handback docs comment is fine. |
| R8 | **Pass** | The stamp is present and M9 is killed. |
| R9 | **Pass with note** | The probe cache is keyed by a fingerprint of policy, driver version, config, and a platform digest (OS release plus `bwrap --version`), with a TTL. M10a and M10b are killed. The `allRuns` memo is scoped with AsyncLocalStorage, the apply re-check path gets a fresh scope, and M10c is killed. The platform digest does not cover userns sysctl changes or the binary hash within the TTL, and a disk cache record is trusted if it parses: **LOW**. |

## 5. Mutation proof (reviewer sandbox: `git archive` copy, candidate untouched)

| ID | Mutation | Result |
|---|---|---|
| M1a | `appendEvent` import in `dispatch/plan.mjs` | killed |
| M1b | `settleClaim` lifecycle import in dispatch core | **survived** |
| M1c | dynamic `'re'+'turn'` spawn in dispatch core | **survived** |
| M2 | drop return-blocked on execute failure | killed |
| M3 | bypass `assessAndPrepare` in launch door | killed |
| M4 | adapter (`herdr-round`) import into `authority.mjs` | **survived** |
| M5 | herdr settled receipt skips `commitCommandOutcome` | killed |
| M6 | `effectiveContract: null` at herdr `renderBrief` | **survived** |
| M7 | drop argv MAX_ARG_STRLEN guard | **survived** |
| M8 | read replacement-authority from outbox too | **survived** |
| M8b | read replacement-authority from outbox (base semantics) | killed |
| M9 | drop legacy contract stamp | killed |
| M10a/b | probe cache ignores TTL (memory/disk) | killed |
| M10c | `allRuns` global cross-call memo | killed |
| M11 | settled-path receipt publish throws | killed |
| M12 | classify cwd back to `opts.cwd` | **survived** |

After each mutation the sandbox was reset with `git checkout -- .`, and the final sandbox status was clean. Logs: `scratchpad/i12/logs/mut-*.log`.

## 6. Verification matrix

| Run | Command | Result |
|---|---|---|
| Full candidate | `env -u CLAUDE_CODE_SESSION_ID npm test` at `c9bd9cdff` | 7733 tests, **7660 pass / 0 fail**, 8 skipped, 65 todo, exit 0 (380 s) |
| Full base | same, on a `git archive cfdaf4bc` copy | see §9 |
| Focused R1–R9 + I11 safety (23 files: deferred-probes, dag-concurrency, dag-corrupt-evidence, cold-resume, session-engine, driver-authorization, herdr*, cli-spawn-reconciliation, assignment-dispatch, brief, r9, import-graph, production-call-sites, confinement authority/p03/p04/p05, runtime-inspect, reconciliation, dispatch-recovery, architecture) | `node --test …` | 485 / 485 pass, exit 0 |

A green suite does not show the absence of drift here: F1–F3 and F5 are real behavior changes that no existing test observes.

Raw logs (reviewer scratch, not committed): `/tmp/claude-1000/-home-vantt-projects-forgentX/3308586f-0f33-4cd4-9c59-c15fbfbf52f6/scratchpad/i12/logs/` — `full-candidate.log`, `full-base.log`, `focused-candidate.log`, `mut-*.log`.

## 7. Findings

### BLOCKER
- **F1 — R7 recovery regression (implementation defect, behavior drift).** `collectEvidence` in `recovery-planner.mjs` turns every non-authority file in `controller/` into `unknown` evidence. As a result, any run carrying `controller/evaluator-baseline.json` (every supervised cli-spawn Assignment run) is parked by both `recover` observe and apply. Base recommended an action for the same snapshot. Probe: `scratchpad/i12/probe-recover.mjs`. No test covers this.

### HIGH
- **F2 — R6 drops a worker guardrail and misses the requirement.** The `renderBrief` regex removes the whole "Result artifact:" block from the prompt. That includes "Do not call Work lifecycle verbs…" and the read-only report-REQUIRED instruction (probe: `probe-brief.mjs`). The conflicting claim path still survives, and `effectiveContract` never reaches `renderBrief` in production (M6 survives). This changes prompt authority.
- **F3 — R5 fail-open on settled receipt.** In `herdr-round.mjs`, the settled path now wraps `publishHerdrCompletionReceipt` in a catch that swallows everything except `confinement-mismatch`. A receipt publish I/O failure now returns `status: 0` success with no receipt on disk. Base propagated this error. This is result-truth drift.
- **F4 — New dependency inversion and import cycles (R1, R2).** `resolve.mjs` and `prepare.mjs` (dispatch core) re-export from `operation-choice.mjs`, which imports `assignment-runner.mjs`. This produces a 14–15-module SCC. `dispatch/cli.mjs` imports the Work Driver module `fanout-batch.mjs`. Dispatch core still calls the Work lookups. The docs claim the opposite (F8).
- **F5 — R3 settlement truth drift (undeclared).** In `executeAssignment` settlement, `computeChangedFiles`, the dirty-snapshot re-hash and `classifyRunEvidence` now use `effectiveCwd` where base used `opts.cwd`. When the plan's invocation cwd differs (for example after a fallback redirect), `changedFiles`, `mutatedDirtyBeforeFiles` and status can differ. M12 survives, so the change is unlocked. Arguably this fixes base's inconsistency, but it is a silent change inside a "no-behavior-change" refactor. It must be reverted, or declared and tested.

### MEDIUM
- **F6 — R3 other drift:**
  - `executeAssignment` now also rewrites `run.json` to `status: 'settled'`.
  - `finalizeConfinementResources` runs twice.
  - Receipt-path finalize errors are now swallowed (base let them propagate).
  - Receipt `runtime` now includes `executionError: null`.
  - The failed/receipt root resolution prefers `opts.repoRoot`.
  - The failed path is still a separate third copy.
- **F7 — R4 incomplete.** The argv parser was not deleted, the prepared-attestation channel detail is mislabeled, and M4 survives (no import lock on `authority.mjs`).
- **F8 — Docs and CHANGELOG claims contradict the code.**
  - "Dispatch core contains zero references to Work lifecycle": `cli.mjs` imports `fanout-batch`.
  - "zero workflow/stage lookups in core": core still calls them.
  - "replacing heuristic argv parsing": the parser is retained.
  - "passed effectiveContract": not wired.
  - The Source Inventory lists `operation-choice.mjs` under Dispatch Core while calling it Work Driver compatibility.
- **F9 — R7 `gatewaySessionId`** is sourced from an env var or a client field, which is not authoritative, and it now participates in incarnation matching across processes.
- **F10 — R1 unrequested bin-resolution precedence change** in `fanout-batch.mjs` (`resolveBinFgos`).
- **F11 — Evidence/accounting gaps.** No raw logs, no per-cell full-suite evidence, no GitNexus `impact`/`detect_changes` records. The doer's report claims "authority.mjs contains 0 adapter layer imports" as verified, but no test enforces it.

### LOW / documentation debt
- **F12 — Regression-lock gaps** (survived mutations): M1b, M1c, M4, M6, M7, M8, M12.
- **F13 — Cell rollback.** Cells stack on each other's files. Reverting R1, R2, R4 or R5 alone at the tip conflicts; R5 edits `proof-helpers.mjs`, which R4 created. Rollback is only possible in reverse order. R1 commit also bundles docs and CHANGELOG. R3 touches `authority.mjs`, which is R4's area.
- **F14 — R9 cache trust.** The disk cache is trusted if it parses, and the fingerprint does not cover userns sysctl or the binary hash within the TTL.
- **F15 — `--blocked` alias** is used in `bin/fgos.mjs` but is not registered in `command-registry`.

No component-boundary change was made by this review; the boundary claims in the docs need correcting (F8).

## 8. Required to reach APPROVE
1. Fix F1: only `replacement-authority--*` files in `controller/` count as evidence; ignore controller-owned bookkeeping. Add a test with `evaluator-baseline.json` present.
2. Fix F2: resolve the claim-path conflict without deleting the guardrail text. Wire `effectiveContract` through `transport.mjs` into `runHerdrRound` and test it at the herdr level.
3. Fix F3: restore fail-closed publish on the settled path, and add a test.
4. Fix F4: break the cycles. Dispatch core must not import `operation-choice`, `fanout-batch` or `dispatch-log`. Move the `fanout-batch` and `log` CLI entry points out of the dispatch core CLI, or document an explicit exception. Add an import-graph lock (a cycle and upward-import ban, not a text grep).
5. Fix F5 and F6: either restore base semantics or declare and test each change.
6. Fix F7–F11, re-run per cell, and provide raw logs plus GitNexus (or degraded manual) evidence.

## 9. Base comparison

The full suite on a `git archive cfdaf4bc` copy (single-commit git init, branch `master`) gave 7725 tests: 7591 pass, **61 fail**, exit 1.

The failures are **environment, not baseline**. They are old-binary/DAG migration-matrix, Phase 07 mixed-version, and fgctl-init/main-checkout-lock tests, which need real git history or repository context that the scratch copy lacks. So this run is **not** a valid baseline comparison. Its test count, 7725 (candidate 7733, a difference of 8), does confirm the doer's claim of 8 new tests. The base pass projection (7652, recorded at I11 verification) was not reproduced independently. A valid base run needs a real `git worktree` at `cfdaf4bc`, which this reviewer did not create in order to leave repository metadata untouched.

## Unresolved questions
- Is the `effectiveCwd` classification (F5) an intended fix that the Track Manager wants declared, or must I12 stay strictly behavior-preserving?
- Is the `fanout-batch` and `log` subcommand staying in `dispatch/cli.mjs` an accepted exception?
