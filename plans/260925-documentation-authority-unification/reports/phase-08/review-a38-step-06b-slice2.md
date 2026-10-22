# Review: documentation-cutover lease, slice 2: dispatch and Land admission (6c5c821ea..e8c1df31c)

Verdict: **rework**

Gate placement in `bind()`, `runUnitBody` and `resolveStart` is before their own side effects, and no token reaches env, argv or records. Three defects reproduced on e8c1df31c, and a fourth follows from one of them in the code:

- A holder in a linked worktree cannot land.
- A second Land door publishes scoped files with no gate.
- `bind()` falls back to the process cwd, which turns doctor red.
- That same cwd fallback, traced through the code, refuses the holder's writing runs midway.

Repro scripts: `scratchpad/6b2-review/repro.mjs` (`holder-land`, `wf-land`, `bind-cwd`) and `edge.mjs`, plus `out-*.log`. All fixtures are temp repos under `scratchpad/6b2-review/tmp`. Nothing was written to the worktree.

Note: the worktree was at 8b20f5185 for part of this review (a Lead baseline run). Every result below was re-run after it returned to e8c1df31c.

## Findings

### H1: a holder in a linked worktree can never land scoped files

- **Where.** `src/runner/merge.mjs` `landRunnerItem` gate calls `leaseAdmission({ repoRoot, paths: landedFiles })` with no worktree.
  - The module resolves the holder from `checkoutFacts(repoRoot).worktreeRoot`.
  - Every caller passes the main checkout as `repoRoot`: `approve.mjs:543/705`, `sync-root.mjs:130`, `promote-engine.mjs:75`.
  - Per L12-105 ruling 2 the token is never in main, so the holder is never recognised.
- **Repro** (`repro.mjs holder-land`). Holder is a linked worktree; `leaseAdmission({worktreePath: holder})` returns `{"allowed":true,"holder":true}`. `landRunnerItem(mainRoot, …, {branch:'docsrc'})` returns `documentation-cutover-lease` (refused).
- **Impact.** L12-108 item 7 says holder cutover edits reach main only through `landRunnerItem`, and raw ref moves stay refused for everyone. That leaves no door at all for the cutover landing.
- **Why tests pass.** `merge-land.test.mjs` "its holder can land scoped files" acquires with `repoRoot: f.repo`, which makes the main checkout the holder. That shape is not the real one and hides the defect.
- **Fix.** Land needs an explicit caller checkout, for example `landRunnerItem(..., { leaseWorktree })` threaded from the approve CLI's own cwd worktree. Pass it as `leaseAdmission({ repoRoot, worktreePath: leaseWorktree, paths })`. Rewrite the test so the holder is a linked worktree. See Q1 for the trust question.

### H2: workflow integration Land bypasses the merge gate

- **Where.** `src/workflow/runner.mjs:592` `mergeWorkflowBranch` calls `createGitLand().prepare/publish` directly into `resolveIntegrationTarget()`, which defaults to the trunk, i.e. main. It is called from the `integrate` step at `runner.mjs:225`. Land runs with hooks off (L12-94 a), so the reference-transaction hook does not catch it either.
- **Repro** (`repro.mjs wf-land`). Held lease, non-holder main. `leaseAdmission` refuses, yet `mergeWorkflowBranch({repoRoot, sourceBranch:'docsrc', targetBranch:'main'})` returns `merged=true`, and `main:docs/x.md = "x"`.
- **Reachability.** A workflow admitted before acquire (units already done), or one advanced through `resumeWorkflow`/`answerWorkflow`/`*Detached` (`case-verbs.mjs:222-340`, which never pass `resolveStart`), reaches its integrate step and publishes docs onto main while the lease is held.
- **Fix.**
  - Call the same gate in `mergeWorkflowBranch` before `createGitLand`, with the branch's merge-base diff (`renames:false`). Better still, extract the 4-line block from `landRunnerItem` into one `admitLand(repoRoot, pinned, source, worktreePath)` helper that both Land doors call.
  - Also grep for any other `createGitLand(...).prepare` caller. Today there are only these two; `merge.mjs:1318` and `runner.mjs:622` are recover-only.

### H3: `bind()` without `ctx.lease` reads `process.cwd()`, so doctor turns red during every lease

- **Where.** `bind.mjs` uses `ctx.lease?.worktreePath ?? ctx.worktreePath` and otherwise falls back to the module's `process.cwd()`. Callers that pass no lease:
  - `setup/executor-posture-coverage.mjs:72` (doctor);
  - `setup/seat-binding-checks.mjs:178` via `dry-bind` (doctor);
  - `workflow/case-start.mjs:237`, `workflow/runner.mjs:371` and `execution/run.mjs:423` via `simulateUnitBindings`;
  - `runner/loop.mjs:1599`;
  - `dispatch/assignment-runner.mjs:452`.
- **Repro** (`repro.mjs bind-cwd`).
  - Same ask and ctx with no lease: cwd=holder gives `bound claude`; cwd=main gives `documentation-cutover-lease`.
  - `checkExecutorPostureCoverage(mainRoot)` returns `{"passed":false,"message":"… execute: documentation-cutover-lease …; code:implement: documentation-cutover-lease …"}`.
- **Impact.** Every non-holder `fgos doctor` reports a false hard failure, "lack executors capable of applying required postures", for the whole lease. Results also depend on the ambient cwd, not on the doctor's `cwd` argument.
- **Fix.** The gate belongs at the doors that dispatch (`runUnit`, workflow start/resume/answer), not inside the pure seat-choice function. Remove it from `bind()`. If a whole-call refusal inside `bind` must stay, make it run only when `ctx.lease` is present, never from `process.cwd()`.
  - This also removes the duplicate check: `runUnit` already gates, then `bind` re-reads main for every attempt.

### H4 (code-traced, not run end-to-end): the holder's writing runs are refused midway, after side effects

- **Writing runs from a cwd other than the holder.** `assignment-runner.mjs:452` re-binds every mutating assignment with `{ runnerConfig, session }`, with no lease. Under H3, a holder `runUnit({writes, worktree: holder})` started from a process whose cwd is not the holder (the main checkout, a detached runner, the CLI from main) passes the `runUnit` gate. It then fails at replay with `recomputed binding refused: documentation-cutover-lease`. By then unit.json, custody and the assignment already exist.
  - The new holder proof uses a read-only Unit, so it never reaches this replay.
- **Workflow writing units.** `workflow/runner.mjs:308` `createWorkflowWorktree` makes a fresh `wf/<run>/<unit>` worktree and branch first. It then calls `runUnit({worktree: unitWorktree})`, which gates on that fresh worktree. That worktree has no token, so the unit is refused:
  - For the holder: holder workflows with writing units can never run. `prepareWorkflowRun` admits them and the first writing unit fails.
  - For a non-holder on a resumed or answered workflow: a worktree and branch are created before the refusal. This is the side-effect-before-refusal case the brief forbids.
- **Fix.**
  - Thread `lease: { repoRoot, worktreePath }` from the unit record or admission into the replay `bind` (or remove the gate from `bind` per H3).
  - Workflows need the holder's identity carried from the admitting checkout, not re-derived from each generated unit worktree. Q1 bears on this too.
  - Gate `resumeWorkflow`, `answerWorkflow`, `resumeWorkflowDetached` and `answerWorkflowDetached` before `takeAndRecord`, the advance lock or `spawnDetachedAdvance`.

### M1: the gate costs about 10 ms when no lease exists, not one read

- **Measured** (`edge.mjs`, load ~3.5). No-lease `leaseAdmission` takes 10.3 ms per call; held takes 18-36 ms. Each call does `resolveRepo` + `resolveRef` + `pathsAtRevision`.
- **Count.** `bind` runs per seat attempt, plus once per seat in each dry-bind, plus doctor loops over capabilities and workflows. That multiplies the 10 ms on hot paths.
- **Fix.** Gate once per door (H3). If more than one call is needed, pass the resolved admission down rather than re-reading.

### L1: `run.mjs` now throws from `resolveGitRoots` before the attempt sweep

The removed `rootsFailure` deferral let `sweepAttempts` run before a roots error propagated. The comment above still claims that behaviour. Any non-`notARepository` roots error now skips the reclaim. Either restore the deferral or update the comment.

### Checked and found sound

- **No token in env, argv, records or binding.** `ctx.lease` carries only paths.
- **Read-only units refused.** No `paths` reach `bind`; the run test covers write, read-only and resume.
- **Gate order** in `runUnitBody` (before sweep, config, port, custody) and in `resolveStart` (before config, frame, ledger).
- **Merge-gate path set.** `renames:false` merge-base diff of the explicit `branch`; the case tests pass. Its reuse as `landedFiles` for post-land drift is a semantic widening: delete-side paths of renames now appear. That is harmless for drift classification but unmentioned.
- **Fail-closed reads** inherit the module (unreadable means corrupt means refuse). An empty repo and a `master`-only repo both return `allowed`. Non-git throws `not-a-repository`, which `bind` swallows; `run`/`resolveStart` skip it via `notARepository`.

## Interaction with the module's L12-108 tightening

- **The token stays a file; only the hooks tighten.** Slice 2 is unaffected except through H1/H4: every holder decision depends on which checkout path the gate is handed. Any further holder-proof tightening, for example "committing worktree's token" semantics, must use the same caller-checkout notion that H1 and H4 still lack.
- **Corrupt sidecar (NEW-4) now blocks everything.** All dispatch is refused (`documentation-cutover-lease-corrupt`) in every checkout, holder included, along with doctor (H3) and all lands, not only commits. Whatever repair door the module adopts must not itself go through `bind`/`runUnit`.

## Test gaps

1. Holder in a **linked** worktree lands scoped files through `landRunnerItem` from the main root (would fail today, H1).
2. `mergeWorkflowBranch`/integrate step refused for scoped paths while held (H2).
3. A holder **writing** Unit started from a non-holder cwd reaches the worker (H4). The current proof is read-only only.
4. A holder workflow with a writing unit, and a non-holder `resume`/`answer` refused with no worktree, branch or ledger write (H4).
5. Doctor `executor-posture-coverage` and seat-binding checks stay correct while a lease is held (H3).

## Lead questions

1. **Holder identity for Land and workflows.** "Token in the caller's worktree" needs a defined caller checkout. For `fgos approve`/Land, is it the CLI process's cwd worktree, or an explicit flag? Either way, any local process can name the holder worktree (the same as `runUnit --worktree holder` today). Is file-possession-equals-holder accepted as the trust model for gates as well as hooks (single-owner repo)?
2. **Placement.** Should the dispatch gate leave `bind()` entirely, as door-only gates in `runUnit`, workflow start/resume/answer, Land and workflow Land (H3)? Or stay in `bind` under an explicit `ctx.lease` only?
3. **Integration.** Should integrate-step Land into main by a holder be allowed (holder workflow), or is `landRunnerItem` the only holder door, with `mergeWorkflowBranch` refusing all scoped paths while held?
