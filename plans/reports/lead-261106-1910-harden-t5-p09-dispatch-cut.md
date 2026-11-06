# HARDEN T5 phase 09: dispatch cut, owner decision 68, and the two P10 items that needed `assignment.mjs`

Branch `harden/t5-p09`, worktree `/home/vantt/projects/forgent-worktrees/harden-t5-p09`, from origin/main `6f85f0272`. Phase file: `plans/261106-0950-harden-t5-execution-core/phase-09-dispatch-cut.md`. Not pushed.

## Commits

| Commit | What |
|---|---|
| `c18459902` | fix(dispatch): a one-word read-only answer counts as a reported answer (decision 68) |
| `36a7d959f` | `admitRunAttempt` and `isSupervisedAttemptStillWorking` move to `src/runner/dispatch/run-admission.mjs` |
| `c5b8e88bc` | `loadImmutableAssignment` |
| `a5e620fd7` | `leaseAccountForAttempt` (runner) and `settleRefusedLease` (`settlement.mjs`) |
| `27e7d386c` | one `attempt` object; `buildLaunch`, `awaitBinding`, `resumedRunOutcome`, `closeAttempt` |
| `4ca7657cf` | label and history comments trimmed in the cut files |
| `1f5811938` | P10 item 1: the unit-run assignment builder moves to `assignment.mjs` (`buildUnitRunAssignment`) |
| `715102278` | P10 item 2: `legacyPersonaProjection` deleted |

## What changed

**Decision 68 (behaviour change).** `isSubstantiveReportText` (`settlement.mjs`) no longer lists OK, YES, NO as generic words; TODO, TBD, N/A, NONE, PLACEHOLDER and the heading words stay refused. The read-only brief line (`assignment.mjs`) now reads `... -- REQUIRED for this read-only operation: write one sentence stating what was answered or done; a "done" status with no report artifact ...`; the `-- REQUIRED` anchor that `brief.mjs` rewrites is unchanged. CHANGELOG line added.
- Proof: new test `a one-word answer report (ok) with a done claim is a reported pass, not placeholder text` in `test/runner/assignment-runresult.test.mjs`, next to the placeholder case. The existing assertion in `test/runner/assignment.test.mjs` (read-only brief line) is extended to the new sentence; no new test there.
- Red: with the previous `settlement.mjs` restored, the new test fails `actual: 'verdict', expected: 'ok'` (1 fail / 49 pass, `/dev/shm/p09-red.log`). Green: 249 pass / 0 fail across `assignment-runresult`, `assignment`, `dispatch-brief`, `operation-choice` tests.

**Dispatch cut (no behaviour change).** `executeAssignment` 1 137 → 277 lines. It now reads: set up paths, `loadImmutableAssignment`, compile plan and resolve executor/adapter, admit, `openAttempt`, then under `try`: attempt locks + intent, `leaseAccountForAttempt` (refusal → `settleRefusedLease`), effective contract, `resumedRunOutcome`, dispatched marker, prompt, dirty/HEAD capture, run control, `buildLaunch`, `awaitBinding`; `finally` → `closeAttempt(attempt)`, which reads only the attempt object (locks, terminalPrep, lease, control, intent flags, handedOver, settled, result, custody, lease runtime dir). The order rule (pane and private home given back under the attempt lock before the intent goes) is unchanged, line for line.
- `admitRunAttempt` goes to its own module with its staging cleanup and the liveness probe shared with the lease reclaim; its duplicated generation-validity closure is one helper (`currentValidRunId`). No importer outside the runner existed (it was not exported); guard key in `test/runner/assignment-enumerator-guard.test.mjs` re-pointed to `run-admission.mjs: admitRunAttempt`; manifest row added.
- Removed while cutting: the two no-op `catch (err) { throw err; }`; the second `dispatchBatchKey` expression and the `unitRunIdOf` re-derivation (one `declaredUnitRunId`); the dispatch-plan digest computed twice; the always-false `executorRedirected` (the executor id was never redirected; `settle-attempt.mjs` already records `false` when the context lacks it); the `credential-provisioning-unsupported` branch, which could not fire because every adapter other than cli-spawn and herdr-spawn is refused before admission; the unused `matchedOp` return of the legality check; 13 unused imports.
- Comments: plan, step, phase, ADR and finding labels in `assignment-runner.mjs`, `settlement.mjs` and the new module are gone; each keeps the invariant it stated. The mutating-assignment gate's doc described a protocol-stamp check the code no longer makes; it now describes the checks the code makes.

**P10 item 1.** `unitAssignmentOf` (+ `pinnedPersonaFor`, its only user) moved from `run.mjs` to `assignment.mjs` as `buildUnitRunAssignment`. The caller passes `writes: effectiveWriteScope(unitRecord)`, so `assignment.mjs` imports nothing from `execution/`. `contextRefsOf` stays in `run.mjs`: it copies hand-off files through `handoff-refs.mjs` (execution I/O), not assignment shape.

**P10 item 2.** Re-verified on this tree: pinned text comes only from `resolveAgentDefinition` (`unit-run-start.mjs:44` unit pin, `case-start.mjs:203` workflow seat personas → `unit-handoff.mjs:190`); `resolveAgentDefinition` throws on `shapeProblemOf` (parse error, non-text value); that refusal exists at `d9b7026d5` (`agent-definitions.mjs:194,196,224` there) and `fd430a8a4` is an ancestor of `d9b7026d5`; a resume refuses records without `seatSchema ≥ 1` (`unit-run-start.mjs:286`). So no resumable record carries text the legacy reader alone could render. Deleted with its fallback; pinned text and a file now go through one parse path (a pinned text that fails would now render the same could-not-parse / cannot-be-rendered line a file does).

## Tests retired (behaviour removed)

In `test/runner/assignment.test.mjs`: `persona text pinned by an earlier release that the parser rejects still renders as it did`, `pinned persona text with a list item that reads as a mapping renders through the legacy projection`, `pinned persona text with a mapping under voice renders through the legacy projection, not as nothing` — the legacy rendering they pinned is deleted. What remains is owned by `pinned persona text that parses is read by the parser, and wins over the file` and the two file-refusal tests in the same file. Test cost: +1 test (decision 68, one spawn like its neighbour), −3 tests, no new spawn otherwise.

## Size

| | Phase estimate | Measured (`git diff --numstat origin/main..HEAD`) |
|---|---|---|
| Node `src` | −300 | −375 (+1 270 / −1 645), incl. P10 items (builder move ±0, legacy reader −67) |
| Tests | −50 | +9 (+30 decision-68 proof, −20 legacy tests, ±) |
| Rust | 0 | 0 |

Budgets: `executeAssignment` 277 ≤ 300; `assignment-runner.mjs` 1 472 ≤ 1 500; largest new function `buildLaunch` 232; Dispatch outside `confinement/` 16 937 ≤ 19 000; `run.mjs` 975. Functions over 300 in the layer that this phase did not create: `compileDispatchPlan` (`plan.mjs`, 421) and `settleRunOutcome` (`settlement.mjs`, 338).

## Verification

- Focused set after each extraction (FR one-liner, `HERDR_*`/`CLAUDE*` unset, private cargo dir): the phase's set (`assignment-dispatch`, `assignment-runresult`, `assignment-enumerator-guard`, `run-lock-identity`, `provider-pool-lease`, `attempt-steps`, `direct-cutover`, `terminal-cutover`, `run-provider-failover`, `architecture`) 233/0; every test importing the runner (20 files) 663/0; lease set 198/0; execution set after the builder move 250/0; `assignment`, `dispatch-brief`, `agent-definitions`, `doc-health`, `check-decision-citation-drift`, `architecture` after the deletion 133/0; `scripts/check-undefined-names.mjs` clean.
- `node scripts/git-one-door-scan.mjs --root .`: 0 undeclared; census regenerated in each commit.
- Full suite: `node scripts/run-tests.mjs` on `715102278`: 8 653 tests, 8 620 pass, 1 fail, no `run-tests: ERROR` lines. The one failure is the known pre-existing red (`the frozen V7n addendum ...`).

## Deviations from the phase file

- Module name: `fgos convention name` covers reports, plans and journals only (`invalid-kind: unsupported convention kind 'module'`), so the module is named kebab-case by hand: `run-admission.mjs`.
- `loadImmutableAssignment` stays in `assignment-runner.mjs`: its only caller is there.
- Extraction commits: lease and refused-lease settlement are one commit (the refusal is the lease step's outcome); `buildLaunch`, `awaitBinding` and the attempt object are one commit (both steps write the attempt object, so neither compiles without it). Focused tests ran after each commit.
- Removed beyond the phase list, each behaviour-neutral as stated above: `executorRedirected`, the unreachable `credential-provisioning-unsupported` branch, the unused legality return, unused imports.

## Items for other phases

- P13: close backlog row `p-3e6b1a52` (its CoS is met by `715102278`).
- P11 or later: `compileDispatchPlan` (421 lines) and `settleRunOutcome` (338) are over the 300-line target; the runner still re-exports settlement primitives and the effective-contract helpers (`assignment-runner.mjs` export blocks) for old importers — a barrel to retire with its callers.
- Not done here: a direct and a pane smoke and the guide section belong to the landing window.

Status: DONE
Summary: executeAssignment is cut into named steps over one attempt object (277 lines, runner 1 472), admission has its own module, the refused lease settles in settlement.mjs, decision 68 landed red-then-green, and the P10 builder move and legacy persona reader deletion are done; full suite green except the known V7n red.
