# Doer Report — Cell P01.1 (Mutation Unlock)

Role: Doer. Cell: P01.1. Track: group-thinking-plan-loop.
Outcome: DONE.

## Worktree / Branch

- Worktree: `/home/vantt/projects/forgentX/.claude/worktrees/agent-ab7ff2ac5eda7a106`
- Branch: `worktree-agent-ab7ff2ac5eda7a106`
- Note: this worktree's HEAD was stale at start (`aedfe0a3`, predates the
  Coordinator's own cell-prep commit `86d0106c` that added the cell docs
  themselves). Fast-forwarded (`git merge group-thinking-plan-loop
  --ff-only`) before starting — a clean fast-forward, no rebase/rewrite, no
  local commits existed yet to lose.

## Paths Touched (all within the cell's own "Files: may touch" list; zero Do-Not-Touch/shared-lease files touched)

- `src/verbs/coordination/schema.mjs` — R1
- `src/runner/coordination/session-engine.mjs` — R2/R3/R4/R5, PROTOCOL_OPERATION_STAMP_PREFIX import
- `src/runner/dispatch/execution-contract.mjs` — R6a
- `src/runner/dispatch/assignment-normalizer.mjs` — R6a
- `src/runner/coordination/store.mjs` — R8 (plus a second sibling fallback bug, see Gaps)
- `test/architecture.test.mjs` — R6b enumeration test
- `test/runner/coordination-mutation-unlock.test.mjs` — new, all 7 Tests First items + R1/R6c/R7/R8 evidence
- `test/runner/coordination-r7-work-isolation.test.mjs` — updated 2 stale tests + header comment (see Gaps)
- `docs/how-to/run-a-coordination-session.md` — corrected the false "whole CLI surface read-only in V1" line
- `docs/architect/agent-coordination/contracts/coordination-session.md` — new "Mutation Rule" section, fixed one stale `buildReadOnlyContract` mention
- `CHANGELOG.md` — one `## [Unreleased]` bullet
- `docs/architect/agent-coordination/verification/group-thinking-plan-loop/P01.1.md` — Proof Matrix/Commands/Gaps only (never Review/Red-Team/index.md/current-cell-P02.1.md)

Confirmed via `git status --porcelain`: no file outside this list was touched. `src/runner/dispatch/operation-choice.mjs` was NOT touched (R6c proved a non-issue). `src/verbs/coordination/run.mjs` was NOT touched (see Gaps — a real, named wiring gap, not this cell's scope). `bin/fgos.mjs`, `src/cli/command-registry.mjs`, `test/cli/**` — never opened.

## R1-R9 Summary

- **R1**: `src/verbs/coordination/schema.mjs`'s `assertMutationReadOnly` renamed `assertMutationAllowed`, takes an `{allowMutating}` option. `validateOperationStep` is the ONLY call site passing `allowMutating: true`; every other step/branch type is unchanged. `validateOperationStep`'s returned shape now also carries `mutation` (previously silently dropped) so a future CLI-layer wiring (Phase 02/03) has a real field to forward.
- **R2/R3**: New `assertMutatingDispatchAllowed(mutation, {operationId, operation, cwd})` in `session-engine.mjs`, called right after `resolveDeclaredOperationActor` inside `dispatchDeclaredOperation`, before any further materialization. R2 checks `operation.result?.kind === 'work-product'`. R3 checks `resolveMainCheckoutRoot(cwd) === resolveRepoRoot(cwd)` (main checkout, refused) and `resolveMainCheckoutRoot(cwd) === null` (outside git, refused), exactly the comparison the phase file specifies (never comparing against raw `cwd`).
- **R4**: `buildReadOnlyContract` renamed `buildSessionContract`, gained a `mutation = 'read-only'` parameter (byte-identical default for `dispatchPrimaryTask`/`proposeConsult`/`recordConsultDisposition`, none of which ever pass it). `dispatchDeclaredOperation` gained the same `mutation = 'read-only'` destructured parameter and forwards the already-validated value into `buildSessionContract`.
- **R5**: `runExecutorAttempt`'s single `executeAssignment(...)` call now computes `isReadOnlyMode: assignment.mutation !== 'mutating'` instead of the old hardcoded `true`. Still the ONE call site in this function (existing static test in `coordination-declared-consult.test.mjs` still passes unmodified).
- **R6a**: `execution-contract.mjs` gained `PROTOCOL_OPERATION_STAMP_PREFIX`/`carriesProtocolOperationStamp` (exported from there, the dispatch/infra layer, not session-engine.mjs, to respect the one-directional-layer rule — `session-engine.mjs` now imports the constant FROM `execution-contract.mjs` instead of declaring its own copy). `validateExecutionContract` accepts `mutation: 'mutating'` only when `contract.constraints` carries the stamp; `assignment-normalizer.mjs`'s `stampInlineAssignment` re-checks the identical condition as a defensive second gate.
- **R6b**: New codebase-wide enumeration in `test/architecture.test.mjs` — `findExecuteAssignmentCallTexts`/`checkExecuteAssignmentCallSitePostures` (exported, pure) grep every real `executeAssignment(` call site in `src/`+`bin/`, confirm exactly the 3 expected files (session-engine.mjs ×1, cli.mjs ×2, operation-choice.mjs ×1), and assert each site's own posture. A second test feeds synthetic broken input directly into the pure checker function to prove it actually flags a violation (Tests First #6's own requirement) — including a brand-new, uncovered file, which the checker also flags rather than silently passing.
- **R6c**: Investigated and closed as a verified non-issue. `operation-choice.mjs:2198`'s `executeAssignment(assignment, opts)` call's own `assignment` is built exactly 2 lines above by that SAME function's ONE `buildAssignment({work, stage, operation, contextRefs, expectedFiles, options: opts})` call — no `provenance` key anywhere in that call. `src/runner/dispatch/assignment.mjs`'s `buildAssignment` only ever builds an INLINE assignment when `params.provenance?.kind === 'inline'`; since this call never sets `provenance` at all, it can only ever build a DECLARED assignment — never inline, never mutating-by-forgery. Proven with a real, source-grounded test (`test/runner/coordination-mutation-unlock.test.mjs`, "R6c: ..."): asserts exactly one `buildAssignment(` call exists in the whole file, extracts its full call text by paren-balance, and asserts it never contains `provenance:`. `operation-choice.mjs` was NOT touched.
- **R7**: Investigated and closed as a verified non-issue for EVERY call path (not just declared-protocol coordination). Read `src/runner/dispatch/plan.mjs`'s `compileDispatchPlan` in full — every one of its 4 return statements either sets `invocation: null` or builds `invocation` as exactly `{ via: 'cli', adapter, protocol: 'prompt-stdout-v1' }` — no `cwd` field anywhere, on any branch. So `assignment-runner.mjs`'s `effectiveCwd = compiledPlan?.invocation?.cwd ?? compiledPlan?.cwd ?? cwd` always collapses to plain `cwd`. Proven with a real, persisted artifact assertion in Tests First #1(a): after a real mutating dispatch, reads the ACTUAL `dispatch-plan.json` this dispatch wrote to disk and asserts `'cwd' in (compiledPlan.invocation ?? {})` is `false` and `'cwd' in compiledPlan` is `false`. `assignment-runner.mjs`/`plan.mjs` were NOT touched. **Commit-policy decision (explicit, as required)**: the default executor config already permits `Bash(git add:*),Bash(git commit:*)` (`src/runner/dispatch/config.mjs` lines 110-122, confirmed) — a mutating Doer/Fixer MAY commit its own work on the cell's own worktree branch; the Lead still performs the final merge into the track branch, never the session itself. Tests First #1(b) proves a committing mutating dispatch also grades `verified`.
- **R8**: Confirmed the named bug exactly — `store.mjs`'s `resolveCoordinationPaths` computed `root` correctly but keyed `fgosDir` on raw `cwd`. Fixed: `fgosDirFromRoot(root)`. Grep of every `fgosDirFromRoot(` call site under `src/runner/coordination/**` and `src/runner/dispatch/**` (pasted in P01.1.md's Commands section, re-run at close) confirms exactly 9 real sites, all now correct — the 7 in `cli.mjs` and the 1 in `assignment-runner.mjs` needed no change (already passed `root`). **A SECOND, sibling bug found only by running the real test suite** (see Gaps below) — `resolveCoordinationPaths`'s own fallback chain, previously dead code, became live once R8's own fix made `fgosDir` depend on `root`, and broke ~10 pre-existing tests. Fixed in the same diff.
- **R9**: `node src/runner/dispatch.mjs decide --for smoke --needs-soul --has-live-task-access` re-run after every edit to `src/runner/dispatch/**`; still prints a real `mechanism` field (`{"mechanism":"in-process","configured":false}`) at close. Pasted in P01.1.md's Commands section.

## Tests

### Focused sweep (real output)

```
$ FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/runner/coordination-*.test.mjs' 'test/verbs/coordination-*.test.mjs' 'test/runner/dispatch-*.test.mjs' 'test/runner/assignment-dispatch.test.mjs' 'test/architecture.test.mjs'
ℹ tests 660
ℹ pass 659
ℹ fail 1
```

The 1 failure — `src/runner/coordination/** imports no Work lifecycle, merge, worktree, transport-spawn, or mission-lite module` (`test/runner/coordination-static.test.mjs`) — is a pre-existing, environment-caused false positive, NOT a regression. That test substring-matches `"worktree"` against each import's RESOLVED ABSOLUTE PATH; this agent's own isolated worktree checkout lives at `/home/vantt/projects/forgentX/.claude/worktrees/agent-ab7ff2ac5eda7a106/...`, which contains the literal substring `"worktrees"`, so the check fires on essentially every real import under `src/runner/coordination/**` regardless of content. Confirmed via `git stash` against the completely untouched worktree (before any of this cell's diff existed): identical failure mode, identical mechanism, present on the pristine baseline too. Not caused by my work; not fixable within this cell's own scope (would require the test's own path-matching to be sandbox-path-independent, an unrelated pre-existing test-infra concern).

`test/runner/dispatch-*.test.mjs`/`test/runner/coordination-*.test.mjs` initially surfaced 7 real, genuine regressions from my own R8 fix (the sibling fallback bug, see Gaps) plus 2 stale-assertion test failures (`coordination-r7-work-isolation.test.mjs`) — both classes fixed; final sweep is clean modulo the one environment-caused item above.

### Full suite (real output)

```
$ FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'
ℹ tests 5588
ℹ pass 5577
ℹ fail 4
```

4 failures, mapped against the Coordinator's 4 named baseline failures:

1. `ask/answer round-trip on a genuinely legacy durable-doing item...` — matches named baseline `test/cli/fgos-intake-4.test.mjs:318`. Unrelated to this cell.
2. `fgos docs-index tolerates a missing quadrant dir...` — matches named baseline `test/report/enduser-index.test.mjs:187`. Unrelated to this cell.
3. `src/runner/coordination/** imports no Work lifecycle, merge, worktree...` — the environment-path false positive above, NOT one of the 4 named baseline failures but confirmed pre-existing via `git stash`.
4. `coordination-example-requests-valid passes against this repo's own real, published example requests + protocols` — matches named baseline `test/setup/coordination-doctor-check.test.mjs:42`. Unrelated to this cell.

The named baseline failure `test/runner/codex-cli-glm-cli-live-executors.test.mjs:50` did NOT fail this run (external/network-dependent, not a concern either way).

**Net result: zero new failures introduced by this cell's diff**, beyond the one environment-path item explained above (itself pre-existing, not new).

### R9 smoke command (real output, re-run at close)

```
$ node src/runner/dispatch.mjs decide --for smoke --needs-soul --has-live-task-access
fgos: executor "gitnexus" declares no "providerModel"/"provider" and its command (none resolvable from its config) is not a recognized Claude CLI command -- its resolved provider family may be unreliable/inconsistent across dispatch code paths. Declare "providerModel" explicitly.
{"mechanism":"in-process","configured":false}
```

## R6c / R7 / R8 Evidence (also in P01.1.md's own Proof Matrix/Commands)

Covered in full detail above under "R1-R9 Summary." Both R6c and R7 are closed as verified non-issues with real, source-grounded and/or real-artifact-reading tests (not reasoning alone) — `operation-choice.mjs` and `assignment-runner.mjs`/`plan.mjs` were not touched. R8's grep output is real and pasted in P01.1.md.

## Gaps (also recorded in P01.1.md's own Gaps section)

1. **A second, sibling R8-class bug**, found only by running the real test suite (not by grep alone): `resolveCoordinationPaths`'s own fallback `root = resolveMainCheckoutRoot(cwd) ?? resolveMainCheckoutRoot(process.cwd()) ?? process.cwd()` was dead code before R8's fix (root wasn't consumed by `fgosDir`), so it was fully latent. Once `fgosDir` started depending on `root`, ~10 pre-existing tests broke — every one of them dispatches against a plain, non-git temp directory (no `git init`), and `resolveMainCheckoutRoot(cwd)` correctly returns `null` for a non-git `cwd`; the fallback then silently resolved `root` against the TEST RUNNER PROCESS's own `cwd` (this repo's real git checkout) instead of the caller's own workspace. Fixed by anchoring the fallback to `cwd` itself: `resolveRepoRoot(cwd, {strict: true})` (never shells out, just returns `cwd`), matching `assignment-runner.mjs`'s own already-correct fallback shape exactly (`opts.repoRoot ?? resolveMainCheckoutRoot(cwd) ?? resolveRepoRoot(cwd)`). This is squarely within R8's own stated scope ("fix every real instance found, not just the one already named... do not expand into unrelated refactoring of those files beyond the root-vs-cwd fix itself") — same function, same root-resolution logic.
2. **Two pre-existing tests in `test/runner/coordination-r7-work-isolation.test.mjs`** (that file's own "R7" is Phase 06's work-isolation R7, an unrelated, earlier phase) asserted the exact OLD, now-intentionally-superseded invariant ("dispatchPrimaryTask/dispatchDeclaredOperation/recordConsultDisposition accept NO mutation parameter at all"; "buildReadOnlyContract hardcodes mutation: 'read-only' as a literal"). Updated both tests plus that file's own header comment to state the new, correct, narrower invariant, and — honestly, not silently — named a genuinely NEW, currently-open question this cell's own R1-R9 never asked and does not answer: could two DIFFERENT `dispatchDeclaredOperation` calls (two actors) target the SAME linked-worktree `cwd` concurrently, both mutating? R3 only ever refuses the MAIN CHECKOUT; nothing here gives cross-actor workspace exclusivity. Flagged for whichever cell/ADR next addresses multi-actor workspace allocation — not decided in this cell, and no speculative fix attempted.
3. **`src/verbs/coordination/run.mjs` was intentionally NOT touched.** R1's schema change and `dispatchDeclaredOperation`'s new `mutation` parameter are both real and tested directly at the engine level (per this cell's own explicit instruction to test engine-level only, never through the CLI/request layer), but nothing in `run.mjs` currently reads a request's `step.mutation` and forwards it into `dispatchDeclaredOperation`'s call options — so `fgos coordination run`'s own CLI-driven request path cannot yet dispatch a mutating step end-to-end. `run.mjs` is not in this cell's own "Files: may touch" list, and the cell's Non-Goals explicitly disclaim any CLI-layer change. This is a real, named wiring gap for Phase 02/03, not silently assumed done here.
4. **One full-suite failure not in the Coordinator's named list of 4, but confirmed pre-existing** via `git stash`: the environment-path false positive in `coordination-static.test.mjs`, explained in detail under Tests above.

## Unresolved Questions

None blocking. The multi-actor-same-worktree-cwd question (Gap 2 above) and the `run.mjs` CLI wiring gap (Gap 3) are both real but explicitly out of this cell's own R1-R9 scope, named rather than silently absorbed or speculatively fixed.

Status: DONE
Summary: All 7 Tests First items + R1-R9 implemented, tested (real git worktree, real subprocess executor), and passing; R6c/R7 closed as proven non-issues, R8 fixed plus one sibling bug found via real test execution. Zero regressions beyond 3 already-named baseline failures plus one newly-confirmed-pre-existing environment-path failure.
