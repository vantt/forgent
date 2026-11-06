# HARDEN T5 phase 10: execution core cut (the parts outside `assignment.mjs`) and the lost-brief retry

Branch `harden/t5-p10`, worktree `/home/vantt/projects/forgent-worktrees/harden-t5-p10`, fast-forwarded to origin/main `bf3546fdd`. Phase file: `plans/261106-0950-harden-t5-execution-core/phase-10-execution-core-cut.md`. Not pushed. P09 has not run, so `src/runner/dispatch/assignment.mjs` is untouched; what needs it is listed under "After P09".

Commits (after the rebase onto `92095f40a`):

- `02f0f4f3a` refactor(runner): cut the unit run into named steps and share one bind ask with the dry bind
- `5ecf5f2ba` fix(runner): launch a seat once more when its brief never reached the agent (the coordinator's addition, a separate behaviour change)
- `5f2b23988` test(run-supervisor): the refund case reads the first launch's receipt

## What changed

### The cut (`02f0f4f3a`)

- `runUnitBody` (1 036 lines) is gone. In its place:
  - `runUnitBody` builds one run context (≈50 lines).
  - `loadResumedUnit` (92 lines) and `admitFreshUnit` (159) live in the new `src/runner/execution/unit-run-start.mjs`.
  - Back in `run.mjs`: `openUnitRun`, `settleUnitRun`, `seatStateOf`, `historyOf`, `verifyUnit`, `runCollaboration`.
  - The seat path: `runRole` (once-only `arrive`) → `runRoleBody` (103) → `bindSeat`, `bindInQueue`, `finishPendingCommit`, `commitRound`, `launchCeilingSpent`, `runAttempt` (84), `writesSinceLaunch`.
  - The pure, exported `answerProviderLimit` returns `{ stop } | { rebind } | { walk: { rotation?, step, faultPool?, accountRotations? } }`; `runRoleBody` performs the answer. Order and limits are unchanged: lease conflict first, then partial writes, then the pinned account, then rotation, then the walk step.
  - `unitAssignmentOf`, `contextRefsOf` and `dispatchBound` stay in `run.mjs`.
  - The closures over `unitRecord`, `scope`, `rebindKeys`, `seatLedger` and the rest are now the explicit `ctx` (run) and `role` (seat) objects.
- **One shared ask.** `askFor(request, ledger, unitContext)` in `bind.mjs` is the one ask builder. `run.mjs` and `dry-bind.mjs` both call it, and it carries `dependentExecutors`, so independence holds both ways. The dry bind also calls `noteDependence`, binds a blind unit blind, and arrives at its group barrier from a `finally`. `bindContextOf` is deleted.
- **Builders moved to `commit-unit-work.mjs`:**
  - `seatRoundCommitArgs`: the old `commitWork` closure body. The `commitUnitWork(...)` call itself stays in `run.mjs`, because `test/architecture.test.mjs` `RUN_DOOR_CALLERS` allows only `run.mjs` to call it.
  - `settleCommitOperation`.
  - `recheckWriteConsent`: the old `writeGate`.
- **Duplicates removed:**
  - `unit.writes.length > 0 || sync` → `writesWorktree`.
  - The `--force-shared-cwd` error, built twice → `sharedCwdRefusal`.
  - The assignment id built at two sites → `attemptSuffix` / `assignmentIdOf`.
  - `readAttemptReceipt` and `readLeaseReceipt` → `readAttemptJson`.
  - The five near-identical collaboration-pin throws → one `refuse`.
  - The JSON-then-YAML parse, written twice → `readUnitSource`.
  - The policy-refusal object, written six times → `refusedSeat`.
  - The two never-used imports `seatLaunchesOf` and `resolveSeats`.
  - The `(A4 boundary)` label in the `run.mjs` header.
- **First `unit.json` write** now goes through `publishMutableProjection`. The record is replaced moments later by `openUnitRun`, so the file is mutable rather than written once. The bytes are the same plus a trailing newline, like every later write.
- **Unreadable record on resume.** Both resume reads of `unit.json` go through `readUnitRecord`, which throws `RunnerConfigError` with code `unit-record-unreadable` and the path, instead of a bare `SyntaxError`.
- **Why a new file.** `unit-run-start.mjs` exists because `run.mjs` could not reach ≤ 1 150 lines otherwise: the assignment builder (about 60 lines) has to wait for P09, and the rest is real logic, not comments. Admission and resume form a real boundary: "how a unit run comes to exist". It is in `docs/architecture-manifest.json` as `use-case`; plan.md assigns manifest rows to the phase that adds the file.
- **No import cycle.** The new file gets `snapshotRunnerConfig`, `assertRepositoryForWrites` and `detectHerdrPresent` through the run context (`snapshot`, `assertRepository`, `herdrPresent`) instead of importing `run.mjs`. Those three stay exported from `run.mjs`, so the outside importers (`case-start.mjs`, `workflow/runner.mjs`, `executor-posture-coverage.mjs`, tests) are unchanged.
- **One rename.** `runPattern` became `runCollaboration`, because `test/architecture.test.mjs` forbids the old vocabulary symbol.
- `CHANGELOG.md` has one line for the dry bind and the unreadable record.

### Lost brief (`5ecf5f2ba`, coordinator's addition, backlog `p-d2dc4f2e`)

- **Trigger.** An attempt marked `briefNotDelivered` (from `briefNeverReached(receipt)`: `abandoned*`, or `terminal:foreground-not-agent`) whose outcome is neither `pass` nor `provider-limit` now goes to `answerProviderLimit` with `briefNotDelivered: true`. Before, it returned at the `outcome !== 'provider-limit'` check.
- **The answer:**
  - The partial-writes stop applies first, the same rule as after a provider limit. For a writing seat, `changed` comes from `writesSinceLaunch`.
  - Otherwise the answer is `{ rebind: { continuity: bound, from: bound, reason: 'brief-not-delivered' } }`: the same candidate again, through `bindInQueue`, as a new launch.
  - It is bounded by `MAX_BRIEF_RETRIES = 1`, counted as `briefNotDelivered` attempts of the seat round. Past that, the answer is a stop with `fallbackExhausted.reason: 'brief-not-delivered'` and the outcome stays `execution-failure`.
  - The pinned-account stop does not apply here: the retry is the same account.
- **What is not retried.** A brief whose delivery is unknown (`terminal:delivery-unknown`, receipt `cancelled`) is not `briefNotDelivered` and is not retried.
- **Recording.** `bind.mjs` `fallbackFrom` records `kind: 'brief-not-delivered'`, like `lease-conflict`. It is not a walk step: `triedBindingsOf`, `credentialFaultPools` and the rotation count read only `next-candidate` and `account-rotation`.
- The rotation view is not read for a lost brief.
- `CHANGELOG.md` has one line for this change.

## Red → green

| Proof | Red on the old code (stash of `src`) | Green |
|---|---|---|
| `test/runner/execution/bind.test.mjs` "the bind ask holds a seat to the executor of a seat bound earlier that must differ from it" (new) | file fails: `askFor` not exported | pass |
| `test/runner/execution/run.test.mjs` "... a resume refuses a record from a newer release or one that does not parse" (extended) | fail: bare SyntaxError, no `unit-record-unreadable` | pass |
| `test/runner/execution/run-brief-not-delivered.test.mjs` (new, real host + fake herdr) — (1) lost brief then healthy → `pass`, two attempts on `alpha`, first `briefNotDelivered`, second `fallbackFrom.kind brief-not-delivered`, two tabs; (2) writing seat that changed the worktree → `execution-failure`, `partial-writes` naming `probe-worktree.txt`, one attempt, `retryStopped`; (3) lost twice → `execution-failure`, `fallbackExhausted.reason brief-not-delivered`, two tabs | 3/3 fail (no retry; no `fallbackExhausted`) | 3/3 pass |

The phase file's dry-bind case ("the dry bind refuses a seat that only the reverse independence forbids") cannot be built through `simulateUnitBindings`. With the registered loops, a seat never binds after a seat that named it, because the dry bind returns `pass`, so there is no second round and no rebind. The one place reverse independence shows is the ask itself, so the owning proof is the `askFor` case in `bind.test.mjs`. The run and the dry bind both go through `askFor`.

The coordinator asked for the lost-brief proofs "next to `run-case-admission.test.mjs`". They are in a new file in that directory because they need the terminal harness (`test/run-supervisor/support/terminal-harness.mjs`). A headless attempt cannot end `abandoned-not-started` from the worker side.

## Tests

- **Focused set (phase list plus everything that imports or names the changed modules, 41 files including `architecture`, `doc-health`, `check-decision-citation-drift`, failover, terminal-fallback, terminal-cutover):** 707/707 pass after the cut. After the fix, 271/271 pass for run, failover, case-admission, bind, account-rotation, terminal-fallback, terminal-cutover, run-herdr and architecture. The new file passes 3/3.
- `node --expose-internals scripts/check-undefined-names.mjs`: clean.
- `node scripts/git-one-door-scan.mjs --root .`: 0 undeclared. The census was regenerated in both commits.
- Rebased onto origin/main `92095f40a`. CHANGELOG conflicts kept both sides; the census was taken from main and regenerated at each step.
- After the rebase, main's new refund case in `test/run-supervisor/terminal-fallback.test.mjs` ("a seat whose pane shell never gave up the foreground is handed back to the case frame") failed. Its seat is now launched twice, and `project.attemptDir()` sorts `producer/1-fb1` first, so it read the second launch's receipt (`start-refused:terminal-launch-not-started`). The coordinator approved the fix: both receipt reads now name the first launch's directory (commit `5f2b23988`). The refund assertions are unchanged and still hold: the frame counts no dispatch, and nothing was typed in either launch. Terminal-fallback: 6/6 pass.
- **Focused set after the rebase (41 files, now including `run-brief-not-delivered` and `terminal-cutover`):** 719/719 pass.
- **Full suite** (`node scripts/run-tests.mjs`, queued, on the rebased branch): tests 8 653, pass 8 620, fail 1, skipped 32, no `run-tests: ERROR` line. The one failure is the known red "frozen V7n addendum".
- **Retired tests:** none.
- **Changed tests:**
  - `run-herdr.test.mjs` guard regex now names the new walk call: `bind(role.ask(), bindCtxOf(ctx, role, attemptNo + 1), { walk:`. No behavioural test proves transport, so I kept this guard rather than retire it.
  - The `run.test.mjs` title is extended to name the unreadable-record case.

## Net size against the phase budget

| | Phase estimate | Measured |
|---|---|---|
| Node, cut commit | −250 | **−29** (+1 268 / −1 297) |
| Node, lost-brief fix | (not in estimate) | +13 |
| Tests | −50 | +30 (cut: askFor case +21, unreadable record +10) and +91 (lost-brief file) |
| Rust | 0 | 0 |

| Budget | Target | Now | Met? |
|---|---|---|---|
| `run.mjs` | ≤ 1 150 (was 1 641) | 1 052 | yes |
| Longest function in the files I cut | under 300 | `admitFreshUnit` 159 | yes |
| `bind.mjs` | ≤ 520 (was 564) | 590 | no: `askFor` +27 lives there as the owner of the ask; no other line in `bind.mjs` can go without a behaviour change |
| `src/runner/execution` (with subfolders) | ≤ 7 000 (was 7 683) | 7 667 | no |

Why the Node figure is far from −250:

- `legacyPersonaProjection` (−20) and the assignment builder move both wait for P09.
- Most comments in `run.mjs` are reasons, not history or labels. Only one label was found.
- The new module costs 32 lines of header and imports.

Two functions in the execution layer are over 300 lines, both outside P10's files: `patterns/catalog.mjs` `resolveCollaboration` (516) and `checkCatalog` (375). They are for P13 or another item.

## Finding recorded only (no behaviour change)

A read-only unit's run-result category becomes the unit outcome in `run.mjs` `dispatchBound`, through its last line `outcome: outcomeOfRunResult(runResult)`. That function is `src/runner/execution/unit-run-history.mjs:18-33`. There, category `verdict` maps to `findings` only when `assessment.verdict === 'findings'`, so a `verdict`/inconclusive result falls through to `execution-failure`. Owner decision 68 (commit `340113b76`) already settled the cause on the settlement side, `isSubstantiveReportText`, and assigned it to P09.

## After P09 (left out: needs `src/runner/dispatch/assignment.mjs`)

1. **Move the assignment builder.** `unitAssignmentOf` (and `contextRefsOf` if wanted) moves to `assignment.mjs`; it is already a free-standing function in `run.mjs`.
2. **Delete `legacyPersonaProjection`.** It is unreachable for every record that can still be resumed:
   - Its only input is `options.persona.pinnedText` (`assignment.mjs:697`), filled from `policy.personaPin.text` (`assignment-runner.mjs:1668`). That comes from `run.mjs` `pinnedPersonaFor`, which reads `unitRecord.personaPin` or an override's `personaPin` (`src/workflow/unit-handoff.mjs:190`).
   - Both are pinned from `resolveAgentDefinition`. It refuses parse errors and non-text sections through `shapeProblemOf` / `nonTextPersonaValues` (`agent-definitions.mjs:200`), a check in place since `fd430a8a4` (2026-10-16).
   - A resume needs `seatSchema ≥ 1` (`legacy-seat-read.mjs:115`). Seat records exist only from `d9b7026d5` (2026-10-21), after the parser change.
   - So no resumable record carries text only the legacy reader can render. Delete it together with its fallback in `renderPersonaSection`, and close `p-3e6b1a52` (P13).

## Deviations from the phase file

- `unit-run-start.mjs` is a new file, which the phase allows when the line budget forces it; justified above.
- `bind.mjs` and `src/runner/execution` budgets are not met (see the size tables).
- The dry-bind proof is in `bind.test.mjs`, not `seat-binding-dry-bind.test.mjs` (reason above).
- Added beyond the phase: `blind` in the dry-bind ask. The phase lists `blind` among the fields `askFor` carries, so the dry bind now binds a blind unit blind; this is in the CHANGELOG line.
- The rotation view is now read once per provider-limit attempt even when the answer then stops on partial writes. That keeps `answerProviderLimit` pure. The read is read-only and prints a stderr note only when the account state cannot be read.
- The lease-conflict flag is now written in the same `unit.json` write as the attempt outcome, not in a second write. The final state on disk is identical.
- Files outside the lead's list:
  - `docs/architecture-manifest.json`: one row for the new file.
  - `packages/git/contracts/mutation-census.v1.json`: regenerated.
  - `test/runner/execution/run-brief-not-delivered.test.mjs`: new.
- GitNexus MCP tools were not available in this session, so blast radius comes from `rg` over importers. Only `runUnit`, `resolveGitRoots`, `snapshotRunnerConfig`, `assertRepositoryForWrites`, `detectHerdrPresent` and `readAccountInventory` are imported from `run.mjs`, and all six are unchanged.

## For other phases

- **P12:**
  - `answerProviderLimit` is exported from `run.mjs` for the in-process failover proofs. Its signature now includes `briefNotDelivered`.
  - The `run-herdr.test.mjs` source guard can be retired once a behavioural transport proof exists.
- **P13:**
  - Re-measure the layer budgets.
  - `patterns/catalog.mjs` functions over 300 lines.
  - Close `p-3e6b1a52` after the deletion above.
  - Close backlog `p-d2dc4f2e` when `5ecf5f2ba` lands.

Status: DONE_WITH_CONCERNS
Summary: `runUnitBody` is cut into named steps under one run context, with a pure `answerProviderLimit` and one `askFor` shared by the run and the dry bind; the brief-not-delivered retry is its own commit with three red-then-green proofs. Focused tests pass 719/719 and the full suite has only the known V7n failure.
Concerns/Blockers: the `bind.mjs` (590 > 520) and `src/runner/execution` (7 667 > 7 000) budgets are not met, and the Node net is −29 + 13, not −250. The assignment builder move and the `legacyPersonaProjection` deletion wait for P09. For COOK: `fgos-cook` (`628c81c8e`) also reruns a dispatch whose brief was lost, so a seat that loses its brief every time can now launch up to 4 times.
