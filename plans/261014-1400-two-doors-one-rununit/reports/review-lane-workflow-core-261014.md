# Review: workflow lane core (bước B, items 1-5)

Reviewer: code-reviewer (independent, not the author). Diff `main...feat/rununit-workflow` (e924c4bd5, fafdcaf45).
Spec: `phase-05-workflow-units.md` § "Lõi (bước B)" items 1-5, `protocol.md`.

## Scope

- Files: `src/workflow/{units-source,definition,checked,runner,store,index}.mjs`, `docs/architecture-manifest.json`, `test/workflow/units-{source,runner}.test.mjs`. About 590 LOC added.
- Checks run:
  - `node --test test/workflow/*.test.mjs` passed, 106/106, exit 0.
  - I wrote two probe tests in a session scratchpad, not the repo. Both reproduced the findings marked "reproduced" below.
- Impact analysis: not re-run by the reviewer. I checked callers with `rg` instead.
  - `validateWorkflow` has 7 callers. Only `units-source` passes `source`.
  - `unit.prefer` and `unit.persona` have no consumer in `src/runner/execution` other than `unit.mjs`.

## Overall

The work matches items 1, 2, 3 (with one deviation) and 5. The write-chain rule in item 4 is implemented and tested for the main path: a chain through read-only units, and refusal when a unit builds on two writing units.

Two production problems, both **reproduced**:
- Out-of-scope detection gives false positives for non-ASCII paths.
- A writer can bypass the out-of-scope guard through a write chain.

The remaining problems are smaller: around the integrate step and fallbacks that fail silently.

## Critical

None.

## High

### H1. Out-of-scope check flags in-scope files whose path has non-ASCII bytes, and fails the run (reproduced)

`src/workflow/runner.mjs:264-277` (`outOfScopeWrites`) checks `result.commit.files` against `matchesWriteScope`. Those names come from `commitUnitWork`, which runs `git diff --cached --name-only` (`src/runner/execution/commit-unit-work.mjs:49`). Git's default `core.quotePath=true` returns `"docs/r\303\251sum\303\251.md"`: quoted and backslash-escaped. `matchesWriteScope` rejects any path that contains `\` (`write-scope.mjs:131`).

- **Scenario:** a units file has a writer with `writes: ['docs/**']` that creates `docs/résumé.md`. Vietnamese file names are routine for this owner.
- **Probe result:** `status: failed`, `outOfScope: ["\"docs/r\\303\\251sum\\303\\251.md\""]`.
- **Impact:** a correct unit is turned into `findings`, and the whole workflow fails with `out-of-scope-writes`.
- **Fix options:**
  - List files with `git -c core.quotePath=false diff --cached --name-only -z` and split on `\0`. This has to change in `commitUnitWork`, which lane 02 owns, so coordinate with that lane.
  - Or, in the runner, compute the changed set from git directly: `git diff --name-only -z <baseSha> <branch>`.
- **Missing test:** none covers a non-ASCII in-scope path.

### H2. Out-of-scope writes bypass the "never reaches the target" guard through a write chain

The guard is `runner.mjs:455`. The base selection is `runner.mjs:531`. `outOfScope` only demotes `pass` to `findings` (`runner.mjs:600`). A `reviewed` writer template may set `acceptOutcomes: ['pass','findings']` (`definition.mjs`), and then the step completes.

Failure sequence:
1. Writer A (reviewed, accepts findings) commits `stray.txt` outside its scope. A ends `findings`, which is accepted.
2. Writer B depends on A. `writeBaseOf` picks A, and B's worktree starts on A's branch, which contains `stray.txt`.
3. B's own check sees only B's commit files. It passes.
4. Integrate step I depends on B. Line 455 skips A's branch only if A is a *direct* dependency of I. I merges B's branch, and `stray.txt` lands on the target.

This also happens without a chain: if I depends on A directly, A's branch is skipped, but nothing records or surfaces that skip. `catch {}` at `runner.mjs:464` handles the merge errors and the skip is a silent `continue`.

Fix options:
- Treat `out-of-scope-writes` as never acceptable, whatever `acceptOutcomes` says: fail the step.
- Or refuse to use a base whose unit carries `outOfScope`.
- Or run the scope check at integrate time over `git diff <baseSha>..<branch>`.

Missing test: the existing test "its branch is not integrated" only passes because the workflow already failed at step `w`. The skip at line 455 is never executed by any test, so that test is a phantom for its stated claim.

## Medium

### M1. A writer after an integrate step starts from the main checkout's `HEAD`, not from the integration target

`runner.mjs:217-243` and `runner.mjs:531`. When the walk stops at an integrate step, `writeBaseOf` returns null and the base becomes `'HEAD'` of `mainRoot`. The comment says "what came before it is on the integration target". That is only true when the target equals the branch checked out in the main checkout. `resolveIntegrationTarget` (`integrate.mjs:76`) prefers a declared `target`, then `origin/HEAD`, then the checkout's own branch.

- **Scenario:** `A(write) → I(integrate, target: integration) → B(write)`. I merges A into `integration`. B forks from `main` and does not see A's work.
- **Fix:** when the walk crossed an integrate step, base B on `resolveIntegrationTarget(...)`.
- **Missing test:** none covers writer → integrate → writer.

### M2. The write-chain refusal now applies to plan-source workflows, and its advice cannot be followed there

`assertWriteChains` runs for every definition (`runner.mjs:892`). `plan-source.mjs` turns `dependencies: [1, 2]` into a step that depends on two phases, and it never emits integrate steps.

- **Scenario:** a plan whose phase 3 depends on phases 1 and 2, all three with `writes:` in frontmatter. Before this change it started, with every writer on `HEAD`. Now the start is refused with "merge these units into one or add an integrate step", which a plan author cannot do.
- Chained plan phases also now fork from the previous phase's branch instead of `HEAD`. This is a silent behaviour change on an existing door.
- Item 4 does not limit the rule to units files, so this may be intended. Either way it needs:
  - a CHANGELOG/spec delta in the lane report
  - a test for the plan door
  - plan-specific advice in the message, or a decision to limit the rule to units files.

### M3. A failed base resolution or worktree creation silently drops the chain

`runner.mjs:531-543`.

- If the base writer has no recorded `branch`, `|| 'HEAD'` forks B from HEAD without saying so.
- If the base branch has disappeared, `rev-parse` returns null. `createWorkflowWorktree` then throws and the existing `catch { unitWorktree = worktreePath; }` runs the writer in the run's shared worktree.

Probe, with the main checkout as cwd: the dispatch guard refuses the unit, with the message "cwd resolves to the main checkout" (reproduced). That message points away from the real cause.

From a linked-worktree cwd, which is how this repo is normally driven, I expect the guard not to fire. The writer would then commit onto the user's current branch. I did not verify this.

The catch is older than this diff, but chaining adds new ways to reach it. Fix: when a writer's base is required, or its worktree cannot be made, fail the unit with the real cause instead of falling back.

### M4. Unit ids from a units file are not checked for use in a branch name

`units-source.mjs:58,62`. `validateUnit` accepts any non-empty id. The id becomes `wf/<run>/<id>` (`runner.mjs:526`).

- **Scenario:** a units file contains `id: "fix login"`.
- **Probe result (reproduced):** `git worktree add -b` fails and M3's fallback runs.
- **Impact:** the run fails with the misleading main-checkout message instead of "invalid unit id".
- **Fix:** units files are user-written input at a system boundary. Validate ids with `git check-ref-format --branch`, or a conservative `[A-Za-z0-9._-]` pattern, in `translateUnitsToWorkflow`.

### M5. Out-of-scope detection misses commits outside `result.commit`

`runner.mjs:264-277` only sees files that went through the runner's `commitUnitWork` in this process's `results`. Two kinds of change are missed:
- After a controller crash and resume (`resumeUnitRunId`), commits made by rounds before the crash may not be in `results`.
- A producer that is not confined and commits by itself leaves `commitUnitWork` with `no-changes`.

The diff `baseSha..branch` (already recorded at `runner.mjs:532`) is the full answer and costs one git call. The same change also removes H1 if run with `-z` and `core.quotePath=false`.

## Low

- **L1:** `seats.mjs:166` re-validates an expanded draft without `source`, so a units workflow with `prefer` plus `seats` would fail with a G2 "prefer" error. The CLI will refuse `--seats` with `--units` (item 6), but the core API `startWorkflow({unitsPath, seats})` gives a confusing error. Refuse the combination in `resolveStart` with a clear message.
- **L2:** `runner.mjs:208` adds `reasoningEffort` to the unit-scoped persona override (`origin:'workflow'`). bind's first match uses it, so provenance reports `reasoningEffort.source = override:workflow`, although the owner asked for it through the CLI. `fgos run --effort` behaves the same way (`bin/fgos.mjs:2705-2710`), so this is consistent. It goes away once the persona override is removed.
- **L3:** `createWorkflowWorktree` reuses an existing `wf/<run>/<id>` branch and ignores `baseRef` (`integrate.mjs:53-54`). When a unit restarts fresh because its worktree is gone, the recorded `baseRef`/`baseSha` describe a fork that did not happen.
- **L4:** `writeBranches` (`store.mjs:289`) keeps `worktreePath` for units whose worktrees `settleUnitWorktrees` has since removed. Mark them removed, or join with `state.worktrees`.
- **L5:** `definition.mjs` accepts `prefer` without checking its shape when `source==='units-file'`, relying on `validateUnit`. `validateWorkflow` is exported publicly, so a direct caller passing that source skips the shape check until run time. Acceptable, but worth noting in the JSDoc.
- **L6:** `unit.prefer` currently has no effect on binding: bind reads only `capConfig.prefer`. The first test in `units-runner` asserts only that `prefer` was copied into `unit.json`. That is fine because it depends on phase 04, but the CLI step must not ship `--units` with `prefer` before 04 merges, or it will be silently ignored.

## Deliberate deviations

### Persona override kept in `unitOverridesOf` (requirement 3)

**Verdict: accept, temporarily.** Verified:
- bind has no `unit.persona` consumer today (`rg` over `src/runner/execution` finds only `unit.mjs`). Removing the override now would drop template personas for every preset or plan workflow unit.
- The two `workflow-runner` tests depend on the override.

Keeping it is harmless after 04 merges, because an override still wins first match. The risk is that the removal gets forgotten, so record it as an explicit open item in the lane report and the step-C checklist.

### `outOfScope` read from both `commit.outOfScope` and `commit.files`

**Verdict: reasonable as a bridge**, but see H1 and M5. Once lane 02 lands, `commit.outOfScope` will probably come from the same quoted `--name-only` list unless 02 fixes the quoting. The `baseSha..branch` diff would serve as the only source of truth and make both fields unnecessary.

## Areas checked and found sound

- **G2/source spoofing:** `source` is only a parameter. Data fields `source`/`origin` on the workflow, step or template have no effect (tested). `units-source` copies only known fields. Resume uses the stored definition without re-validating, so `prefer` survives a resume.
- **Effort:** checked with `assertReasoningEffort` before any run exists. It is stored in `workflow.start` and projected. Resume and detached advance both read `state.effort`. The override shape matches `fgos run --effort`: the effort goes onto every override, plus a trailing unscoped `human-cli` override. Tests prove effort reaches the launched argv.
- **Write-chain algorithm:**
  - The nearest-writer filter is correct for chains, including transitive `dependsOn: [w-a, w-b]` where w-b builds on w-a.
  - The integrate step ends the walk.
  - Refusal happens before any run dir exists (tested).
  - Two writing units in one ancestor step are refused, which matches the spec.
- **Concurrency:** steps advance sequentially under the advance lock. `writeBaseOf` reads state that is already projected. No new race found.
- **Existing behaviour:** all 106 `test/workflow` tests pass. `writeBranches` and `effort` are additive projection fields that appear only when present.

## Test quality

- `units-runner`: the chain and refusal tests are real. Worktree content is observed through `EXPECT:`, and ancestry is checked with `merge-base`.
- The out-of-scope integrate assertion is a phantom (see H2).
- Missing tests:
  - non-ASCII path (H1)
  - accepted-findings chain leak (H2)
  - writer → integrate → writer (M1)
  - plan door refusal (M2)
  - invalid unit id (M4)
- The "resume keeps effort" test goes through `answerWorkflow` after a park. That is adequate.

## Recommended actions

1. Fix H1: no quoting, and `-z` on the file list. Better: compute out-of-scope from `git diff -z baseSha..branch`, which also fixes M5. Add a non-ASCII test.
2. Fix H2: make `out-of-scope-writes` non-acceptable, or block chaining or integrating such a branch. Add a test that actually executes the integrate skip.
3. Fix M1: base on the integration target after an integrate step. Add a test.
4. M2: decide whether the plan door is in scope, then add a test and a CHANGELOG/spec delta.
5. M3/M4: validate units-file ids, and fail instead of falling back when a writer's worktree cannot be made.
6. Track removal of the persona override for step C, after 04 merges.

## Unresolved questions

- Is the write-chain refusal meant to apply to plan-source workflows (M2)?
- Will lane 02's `commit.outOfScope` be computed from an unquoted list (H1)?

Status: DONE_WITH_CONCERNS
Summary: Items 1-5 are implemented, and the existing workflow suite is green (106/106). Two reproduced High defects in the out-of-scope guard need fixing before merge: non-ASCII paths are flagged as out of scope, and out-of-scope writes can reach the target through a write chain. There are also Medium gaps around the integrate step base, plan-door refusal, and silent fallbacks.
