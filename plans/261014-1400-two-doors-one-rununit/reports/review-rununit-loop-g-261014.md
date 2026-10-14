# Independent review: lane loop-g (phase 09, loop worker and fan-out on runUnit)

Scope: `git diff main...HEAD` (88b5af76f, 01f626427), 16 files, +1445/-1920. I read the code and did not edit it. Repros are in the session scratchpad. Their fixtures live under `/var/tmp`.

## Checks I ran

- `spawn-worker`, `loop-rununit`: green.
- `loop.test`, `e2e/runner-loop`, `dispatch-confinement-authority`, `dispatch-production-call-sites`: 164/164 green.
- `fanout-batch-runner-commit.test.mjs`: **fails to load** (H1).
- The done grep (`executeThroughConfinement|commitUnitWork|executeExecutorCli` in the three files) returns 0. The `loop.mjs` re-export is gone and has no remaining importer.

## High

**H1. `test/runner/fanout-batch-runner-commit.test.mjs` is committed with a syntax error.** The test "the fanout command the fgos-fanout skill teaches…" (line 152) never closes. `});` is missing before `/** A repo with executors…` (line ~170). `node --check` reports `SyntaxError: Unexpected end of input` at :253. None of the 8 fanout tests run, so `npm test` is red. When I added the brace in a scratch copy, all 8 passed.
- Fix: add `});`, then rerun the file.

**H2. Goal-check judges uncommitted files, so an item can be proposed on a branch that does not hold the verified change.**
- How it happens: `runUnit` commits only when the seat outcome is `pass` (`run.mjs` runRole). For any other outcome, `spawnWorker` returns `commit: 'none'` (`work-dispatch.mjs:174`) and leaves the worker's edits dirty in `wt.path`. `loop.mjs:1118` then runs `runGoalCheck` in that dirty worktree and proposes when `check.passed && facts.aheadCount > 0`. The other outcomes are a non-zero exit, `findings`, `blocked`, or an inconclusive claim.
- Before this change, `commitWorkerChanges` always committed before goal-check, so the worktree and the branch matched.
- Reproduced:
  1. An item was rejected back to `todo`, with a `bad` commit already on `fgw/item-j`.
  2. The re-dispatched worker wrote `good` and exited 1.
  3. Result: `commit none`, verify `grep -q good output.txt` passed on the dirty tree, and `"item-j" proposed on branch fgw/item-j (1 commit(s))`. The item went to `awaiting-approval` with the branch file still `bad`.
- The same thing happens to a leaf on a root branch that already has sibling commits (`aheadCount > 0` without any commit of its own).
- On a first attempt the work is lost (`removeDispatchWorktree --force`). The log then says "verify passed but the worker changed nothing", which is false.
- Fix options:
  - (a) In `spawnWorker`, when the outcome is not `pass`, reset the worktree to `HEAD` (`git reset --hard` + `git clean -fd`, not touching `.fgos`), so goal-check judges the branch. Log the discarded paths.
  - (b) In the loop, treat a non-`pass` worker outcome with a dirty tree as a failure class and skip the proposal.
  - Add a red test for the repro above.

**H3. A worker-side contract or policy failure halts the whole runner.**
- `outcomeOfRunResult` maps classification category `policy` to `policy-refusal`. That category covers more than bind refusals. It also includes post-run results:
  - `invalid-agent-result-claim`: a malformed or incomplete `result-N.json`;
  - `contradictory-worker-claim`;
  - attribution refusals (`outside-write-scope`);
  - `cancelled`;
  - `corrupt-result`.
- `spawnWorker` (`work-dispatch.mjs:153-159`) sends every `policy-refusal` except `foreign-staged-index` to `confinement-policy-error`. That class is not in `ERROR_CLASSES`, so the runner halts.
- Reproduced: a worker wrote `{"status":"done"}` (an incomplete claim) to its outbox. Result: `confinement-policy-error ... no executor may run this work: refused`, `halting`. Both items in the wave halted.
- Before this change, `confinement-policy-error` came only from building the confinement request before spawn. A bad or hostile worker output now stops the runner for every item.
- Fix: use `confinement-policy-error` only when `seat.refused` is set (bind refused before spawn, no `runResult`). A `policy-refusal` that carries a `runResult` should take the worker-failure path (a retry class, or `commit: 'none'` plus a clean tree per H2). Add a test.

**H4. A step capability with no `prefer` pool now halts the runner instead of falling back to `runner.executor`.**
- `bind` with `headless: true` refuses with `headless-no-executor`. That maps to `confinement-policy-error`, which halts.
- The curated `code:implement` slot that `fgos setup` writes has no `prefer` (`setup/registrations.mjs:2327`). The step executor id (`fgos-coding-implement`) is a skill name and is not registered as an executor.
- So in a project still on default setup config, the first item halts the runner. These are mission #1 projects, where fgOS is installed globally.
- On forgentX's own config, `code:implement` resolves to `prefer:["gemini"]`, which is fine. The discovery capability `discover` has no pool, so the discovery sweep can no longer run anything. The lane report flags that (open item 1). I confirmed it by running `workUnitFor` against the real config.
- The lane report's Spec delta records the halt, but not that it hits default setup configs. Lead should decide before merge:
  - map `headless-no-executor` / `no-candidate` to `park`, so the runner keeps serving other items;
  - add a `fgos doctor` check: "a step capability has no pool";
  - add `capabilities.discover` to forgentX's own config.

## Medium

**M1. The live-log pointer names a file that exists only after settle.**
- `workerRunPointer` (`loop.mjs:347`) points at `producer/*/runs/*/stdout.log`. `settlement.mjs:545` writes that file at settle.
- While the worker runs, its output is in `runs/NN/protected/capture/<launchCommandId>/stdout.log` (`detached-run-supervisor.mjs:347`).
- The comment at `loop.mjs:42` says `tail -f` follows live output. It does not: the pointer shows nothing until the worker exits, so P39 live visibility is lost.
- The converted "live log" test checks only the pointer text, not that the file exists or grows while the worker runs.
- Fix: point at the capture path (or both), and fix the comment.

**M2. `fgos-runner --config <file>` no longer drives the worker.** `runUnit` snapshots `<repoRoot>/.fgos/config.json`, so executors, timeout and models come from disk. The in-memory config still drives goal-check timeout and `prefer`. The two can disagree silently, for example a `timeoutMs` that differs between goal-check and worker. The author flagged this as a decision question. It needs a decision before merge, and if the flag stays, a warning when it is passed.

**M3. A failed runner commit re-runs the agent.** `worktree-fail` leads to a retry with a fresh Unit run plus `reset --hard`/`clean`, so the agent's work is thrown away and redone. `runUnit` already supports committing again without respawning (`commitPending` on resume). This costs spend, not correctness. It is a candidate for a follow-up.

**M4. Commit subject regression (flagged by the author, open item 3).** Runner commits become `chore(work-<id>-executing): producer changes` whenever the worker writes no claim, which is normal for loop workers. The item title is gone from merged history.

## Low

- **L1.** `checkoutPathOf` (`loop.mjs:353`) re-implements the exported `findCheckoutPath` (`worktree.mjs:362`), which also handles realpath and blank-line resets. Reuse it.
- **L2.** `appendWorkerLog(..., { unitRunId })` (`loop.mjs:1106`, `:1181`, `:1476`): `worker-log.mjs` `formatEntry` ignores `unitRunId`, so the field is dropped. Only the pointer line carries the id. Either render it in the header or stop passing it.
- **L3.** A killed round now always leaves a dirty checkout. `relocateOrphanedCheckout` refuses dirty checkouts, and its message ("a real one is clean, its commit already landed") still assumes the old model where the worker committed. Re-dispatching that item gives `worktree-fail` twice and then parks. That behaviour is acceptable, but the message misleads.
- **L4.** `spawnWorker` derives `repoRoot` from `dirname(opts.fgosDir)`. The loop has `repoRoot` and should pass it. With `runOnce({dir})` pointing somewhere other than `<repoRoot>/.fgos`, `runUnit` reads the wrong config and assignments root.
- **L5.** `describeBinding` swallows every error. For an executor that declares `carries`, `resolveExecutorConfig` throws, so the audit event gets `command`/`provider`/`governance` = null with no trace.
- **L6.** `spawnWorker` and `fanout-batch` discard `workUnitFor(...).warnings` (refs that were dropped as unsafe). They should be logged.
- **L7.** `executor.dispatch` (with `unitRunId`) is emitted only when `spawnWorker` resolves. Failure paths (timeout, `provider-limit`, refusal) leave no audit event. That matches the old behaviour, but requirement 4's traceability is partial.
- **L8.** `commit: 'self'` (`work-dispatch.mjs:147`) is now unreachable, because a mutating Unit is always confined. Dead branch.
- **L9.** Fanout `wtPath = pickedData.data?.worktree?.path || cwd` (pre-existing): if `pick` returns no worktree, a `['**']` Unit runs and commits in the caller's cwd, which can be the main checkout. It would be better to refuse.

## Tests: converted or weakened

- I compared the removed assertions with the lane report table:
  - commit subjects, `self` → round fail, crash-idempotency now 0 commits → `blocked`, and live tee → pointer are all listed with reasons;
  - the H1/MED-1/MED-5 confinement tests are covered by `run-posture` / `spawn-worker:409`;
  - the fanout concurrency and R1 tests were rewritten (rendezvous-based) but do not run because of H1.
- Nothing was loosened silently. Two gaps remain:
  - the live-log test does not prove liveness (M1);
  - no test covers a non-`pass` outcome with a dirty tree (H2) or a post-run `policy-refusal` (H3).

## Plan follow-ups

Requirements 2-6 are structurally met, and the done grep returns 0. Merge is blocked on:
1. H1 (suite red);
2. H2 and H3 (correctness, with red tests);
3. Lead decisions on H4 and M2;
4. a real item run on `WTP`, still UNPROVEN.

Status: DONE_WITH_CONCERNS
Summary: The fanout test file is committed with a syntax error, so the suite is red. I reproduced two correctness bugs: a non-pass worker outcome leaves uncommitted files that goal-check approves (an item reached awaiting-approval on a branch without the verified change), and a malformed worker claim halts the whole runner as `confinement-policy-error`. A step capability without a pool now halts the runner on default-setup configs.
