# Red-team: feat/rununit-loop-g (loop worker + fan-out batch on runUnit)

Scope: `git diff main...HEAD` (01f626427), mainly `src/runner/work-dispatch.mjs`, `src/runner/loop.mjs`, `src/runner/fanout-batch.mjs`, `src/runner/recovery.mjs`, plus the tests that changed with them.
Method: I read the code, then ran real confined (bwrap) probes. They import the worktree's `src/` and use its fixture helpers (`seedFileLocalBwrapRegistry`, `confinedRunnerConfig`, `makeFixtureDir` under /var/tmp). The probes live in `/tmp/claude-1000/redteam-loop-g/*.test.mjs` and run with `env -u CLAUDE_CODE_SESSION_ID node --test <file>`. Nothing in the repo was edited.
Cross-check: I read the lane report `lane-loop-g-261014-2045.md`. Some hits below were already disclosed there (marked **disclosed**). The rest are new.

## Summary table

| # | Attack | Result | Severity |
|---|---|---|---|
| X1 | Committed test file does not parse | **HIT** | Critical |
| X2 | Fresh project (default config) halts the runner on its first item | **HIT** (partly disclosed) | Critical |
| X3 | A worker's non-pass self-report throws away work that verify would accept (D3) | **HIT** | High |
| 7 | Stray write into the main checkout reaches the loop log | **HIT**: the warning is never produced | High |
| X4 | `--config` is ignored for the worker, and runUnit writes default keys into the repo config | **HIT** (first half disclosed) | High |
| X5 | Discovery sweep on the real config | **HIT** (disclosed) | High (needs a config fix before merge) |
| 3/5 | Runner SIGKILL: orphaned detached worker, and its private home reaped | **HIT** (residual) | Medium |
| X6 | The item log's "live output" pointer names a file that does not exist while the round runs | **HIT** | Medium |
| X7 | `blocked` outcome mapped to verify-miss | **HIT** | Medium |
| X8 | Warning objects printed as `[object Object]` | **HIT** (latent) | Low |
| X9 | Fixture leak in /tmp/fgos-worktrees from the e2e crash test | **HIT** | Low |
| 1 | Crash, then resume by unitRunId | MISS (residual is written down; see note) | — |
| 2 | Two items in parallel | MISS | — |
| 4 | herdr without stdout.log | MISS | — |
| 6 | Governance blocks the item's executor | MISS | — |
| 8 | verifiedSha vs runner commit | MISS | — |
| 9 | Fan-out: item stuck in `doing` | MISS (one pre-existing best-effort gap) | — |
| X10 | Executor command missing gets mapped to the wrong error class | MISS | — |

---

## Critical

### X1. `test/runner/fanout-batch-runner-commit.test.mjs` is syntactically broken at HEAD: HIT

- I ran it: `node --check test/runner/fanout-batch-runner-commit.test.mjs` gives `SyntaxError: Unexpected end of input` at line 253. The test at about line 152 ("the fanout command the fgos-fanout skill teaches runs as written…") never closes. After `assert.equal(listWork(fgosDir).work.cand1.status, 'awaiting-approval');` the next line is `/** A repo with executors … */ function setupExecutors(`, with no `});` in between.
- Result: none of the fan-out tests run. The file reports one `testCodeFailure`. `node --test test/runner/loop-rununit.test.mjs test/runner/spawn-worker.test.mjs test/runner/fanout-batch-runner-commit.test.mjs` gives tests 25, pass 24, fail 1, exit 1. The lane report says "Fanout có `fired[0].unitRunId`: `fanout-batch-runner-commit.test.mjs` (5 ca + 2 ca …)", and `## npm test` is still "(điền sau)". The fan-out half of the change is unproven.
- Red test: the file itself. Fix the brace, then re-run. Every attack in section 9 below that relies on those fan-out tests is backed only by reading the code until it passes.

### X2. A project on the default config halts `fgos-runner` on its first item: HIT

- Before this change, `spawnWorker` fell back to the global `runner.executor`. `bind()` has no such fallback (`bind.mjs` has no `runnerConfig.executor` path, so it refuses with `headless-no-executor`). `DEFAULT_RUNNER_CONFIG` (`src/runner/dispatch/config.mjs:185`) has `executor: claude` but no `executors` and no `capabilities`. Every project bootstrapped by `ensureRunnerConfigForDir` is in exactly this state, which makes this mission #1 (`AGENTS.md`).
- Chain: `policy-refusal` → `spawnWorker` throws `confinement-policy-error` → `resolveAction` finds no entry, so `halt` with `unknown-error-class` → the whole runner stops with exit 1.
- Evidence (`probe-default.mjs` against a fresh `git init` dir with isolated HOME):
  `caps [] executors []` · `cap code:implement prefer undefined` · `bind {"reason":"headless-no-executor",…}` · `resolveAction('confinement-policy-error') → halt / unknown-error-class`.
  Loop probe B (`probe-loop.test.mjs`): config `{ executor: <node script> }` only → `{"exitCode":1,"d":{"outcome":"halted","errorClass":"confinement-policy-error"}}`.
- The lane report says "Bind không có nhánh executor toàn cục … halt". It does not say that this hits every default-config project, not only this repo's `discover` gap. The tests hide it: `confinedRunnerConfig` (`loop-worker-fixture.helper.mjs`) registers the global executor under each step id **and** adds a capability pool, and `test/e2e/runner-loop.test.mjs` now writes every config through it. No test runs the loop against a config shaped like the shipped default. This is a phantom-fixture pattern.
- Minimal red test: `runOnce` with `persistRunnerConfig(repo, { executor: {command: node, args:[script,'{prompt}']}, modelPolicies })` (no `executors`, no `capabilities`). Assert `dispatched[0].outcome !== 'halted'` and `exitCode === 0`.
- Options, which are a decision for the Lead: (a) let `bind` treat `runner.executor` as the last candidate of an empty pool. (b) Have `fgos setup` / `ensureRunnerConfigForDir` write `executors` plus `capabilities.code:implement` and `discover` pools into the default, and add a `fgos doctor` check for "step capability with no pool". (c) Classify `confinement-policy-error` as `park` rather than `halt`, so one unbindable item cannot stop the whole runner. At minimum, (c) or (b) has to land with this change.

## High

### X3. The worker's own outcome now decides whether its work is committed (D3 regression): HIT

- Before, `commitWorkerChanges` committed whatever the worker left, whatever its exit, and goal-check decided. Now `runRole` commits only when `outcome === 'pass'` (`run.mjs` around line 612). For an exit ≠ 0, a `findings` verdict or `blocked`, `spawnWorker` returns `commit: 'none'`. The loop then runs goal-check on a worktree whose verify can pass on the **uncommitted** files, sees `aheadCount 0`, and records `verify-miss` with the message "verify passed but the worker changed nothing". That message is false. The `finally` then removes the worktree and the work is gone. Each retry repeats this, and each one also counts against the breaker.
- Evidence:
  - Probe A (worker writes `output.txt`, then `process.exit(1)`; verify `test -f output.txt`): `{"outcome":"parked","errorClass":"verify-miss","attempts":2}`, logs `commit for "item-a": none | goal-check miss … verify passed but the worker changed nothing`. On main this item reaches `awaiting-approval`.
  - Probe F (worker writes the file and claims `assessment.verdict: 'findings'`): bindings `[["findings",null]]` twice, parked `verify-miss` with the same false message.
- The `spawnWorker` doc comment ("A worker that ran and exited non-zero is not an error here: per D3 only `verify` decides") is no longer true: the worker's status now decides whether there is anything for verify to judge. Fan-out has the same issue, since `outcome !== 'pass'` returns the item blocked.
- Minimal red test: probe A as a `loop-rununit.test.mjs` case. Expect `awaiting-approval`, or at least an honest error class and a message that is not "changed nothing".
- Fix options: commit the in-scope files after any round that ran (exit ≠ 0, findings or blocked) and let goal-check decide, which matches the old contract. Or keep the gate and give a not-pass outcome its own class (for example `worker-reported-failure`) with a truthful message, and say in the spec that the worker's self-report now gates the commit.

### 7. Stray write into the main checkout: the warning never reaches the loop log: HIT

- `spawnWorker` forwards `runResult.warnings`, and the loop logs `worker.warnings`. For a loop worker that list is always empty, because the round runs in the detached-supervisor branch of `executeAssignment` (`assignment-runner.mjs` around lines 2573-2590). That branch builds `rawResult` from the capture files and never runs `watchWritesOutsideWorkspace`. Only the legacy `executeExecutorCli` branch (`cli.mjs:792/890`) does that, and it is not taken here. The "fgos: dispatch capability=…" line `executeExecutorCli` prints never shows up in the probe output.
- Evidence (probe D, `probe-d.test.mjs`): while the worker sleeps, the test changes tracked `seed.txt` in the main checkout (and, in a second run, adds an untracked `stray.txt`). The main checkout's `git status` afterwards shows ` M seed.txt`. `result.json` `warnings: None`, no `fgos: warning: paths outside…` on stderr, no `warning for` line in the loop log. On main, `spawnWorker` wrapped every worker in `watchWritesOutsideWorkspace` (`main:src/runner/work-dispatch.mjs:172`).
- The confined worker cannot write the main checkout itself, so the threat is reduced to "another session wrote during the round". The lane D signal is still lost for every loop and fan-out worker, and for `fgos run` itself.
- Minimal red test: probe D (poll for `output.txt` in the item worktree, then write into `repoRoot`). Assert that some loop log line matches `stray-write|outside the worker's workspace` and names the path.

### X4. `fgos-runner --config <file>` no longer governs the worker, and runUnit writes into the repo config: HIT (first half disclosed)

- `runUnit` calls `snapshotRunnerConfig(mainRoot)`, which calls `ensureRunnerConfigForDir(mainRoot)`. The in-memory `config` the loop hands `spawnWorker` is used only for `workUnitFor` (capability and `prefer`). Executors, pools, `timeoutMs`, confinement and governance all come from `.fgos/config.json`. The lane report discloses this. What is not disclosed:
  1. The two configs can disagree inside one run. `prefer` and the capability are derived from `--config`, and binding uses the repo file. A `--config` executor that is missing from the repo config silently drops out of `prefer` (only `preferId` when `cfg.executors[...]` exists).
  2. **Side effect:** when the repo has no runner block, the first `runUnit` **writes a full default runner config into `<repo>/.fgos/config.json`**. When the block exists but is incomplete, it "added missing default config keys … coordination, executor, modelPolicies.claude, rigorToTier, confinement, parallel, patterns, generatedPaths" (seen in every fixture run). The binding then uses that default, which falls into X2 and halts.
- Evidence (probe C): `--config`-style in-memory config with a valid pool, no repo config → `{"exitCode":1,"d":{"outcome":"halted","errorClass":"confinement-policy-error"},"configBefore":false,"configWrittenByRun":true}`. The e2e helper `writeExplicitRunnerConfigFile` now writes the same config to **both** places, which hides this.
- RUL48 says an explicit `--config` path is intentional and must never be auto-generated around. Writing the default repo config during a `--config` run goes against that intent.
- Minimal red test: probe C. Expect either `--config` to govern the binding, or `fgos-runner --config` to refuse up front with a clear message (the lane's option (a)). Either way, nothing may be written to `.fgos/config.json`.

### X5. Discovery sweep on the real dogfood config never runs research: HIT (disclosed, still blocks merge)

- I read `/home/vantt/projects/forgentX/.fgos/config.json` (read-only). `capabilities` has `coding:discover`, but not `discover`. `workUnitFor` for a `discovery` item gives `cap= discover prefer= undefined`, and bind gives `{"refused":{"reason":"headless-no-executor",… "discover"}}` (`probe-cap.mjs`). The executing step binds correctly (`gemini / agy-cli-bwrap-mucdong / cli`).
- In addition: every sweep pass and every `--watch` poll creates a new, refused `unit-run-*` directory under `.fgos/assignments/` per discovery item. That growth has no bound, and it is invisible except in the item log.
- Minimal red test: a loop fixture whose config has `coding:discover` but no `discover`. Run `runOnce` 3×. Assert that research ran or that a single actionable error was raised, and that `unitRuns(repo).length <= 1`.

## Medium

### 3 and 5. Runner SIGKILL: the worker keeps running detached, and its private home can be reaped from under it: HIT (residual)

- Facts from the probe (`probe-kill.test.mjs`):
  - After SIGKILL of the runner child, the worker went on and wrote `output.txt` 5 s later ("worker kept running after runner SIGKILL? … = true"). The loop's worker is now a `detached: true` supervisor (`detached-run-supervisor.mjs:854`), where before it was an attached child.
  - The dispatch cwd lock `dispatch--<encoded wt>.lock` stays in `.fgos/` after the kill.
- Floor 5 (lock until TTL): **miss**. The next attempt uses a new `mkdtemp` worktree path, so it never contends for that lock, and a resume reclaims a dead-pid lock right away (S2). The stale lock file is never pruned, though (low).
- Floor 1 resume guard: **miss**. A resume while the orphan was still alive was refused by `admitRunAttempt` ("prior attempt … has not settled and its control holder is alive … refusing a new attempt"), so no second worker started.
- Floor 3 (reap): **residual hit**, based on reading the code. I could not reproduce it with a fixture executor, because a non-credentialed executor gets no private home: the worker saw `HOME=<fixture home>`. `bwrap.mjs:484` writes the ownership marker with `pid = process.pid` of the **runner** (`prepareConfinementForLaunch` runs in `assignment-runner.mjs:2410`, inside the runner). `reapOrphanedConfinementResources` (`cleanup.mjs:427-440`) reaps when `processDead || expired` and never checks the detached supervisor or worker. So after a runner SIGKILL, or a second SIGINT under `--watch` (`process.exit(130)`), the next `runUnit` on the machine, from any session's `fgos run` or the next loop start, deletes the private home and login copy of a worker that is still running. In-process parallel workers are safe (same live pid) unless a round runs past `maxAgeMs` = 1 h (the repo has `timeoutMs` 2100000, which is fine today).
- Red test: a unit test on `reapOrphanedConfinementResources` with a marker whose `pid` is dead while `runDir/protected/supervisor-binding` names a live pid (use `process.pid`). Expect the home to be skipped. Fix by writing the supervisor or worker pid into the marker, or by consulting `isCliSpawnRunStillWorking`.

### X6. The item log's "live output" pointer names a file that does not exist while the round runs: HIT

- `workerRunPointer` writes `.fgos/assignments/<id>/producer/*/runs/*/stdout.log`, and the `loop.mjs` header says `tail -f` "points at the live output". Probe L (`probe-l.test.mjs`) polled during a 3 s round. The only file that held the live line was `runs/01/protected/capture/cmd_<…>/stdout.log`. The `runs/01/stdout.log` the pointer names appears only after settle, and never after a SIGKILL, which is the case the pointer exists for.
- Red test: probe L. Assert that a file matching the pointer glob contains the worker's first line before `runOnce` resolves. Either fix the pointer (name the capture path, or a stable symlink), or correct the comment and the CHANGELOG delta.

### X7. A `blocked` outcome (worker waiting on a person, or an inline binding) becomes verify-miss: HIT (by reading)

- `spawnWorker` maps `pass`, `policy-refusal`, `provider-limit`, `execution-timeout` and spawn failures. `blocked` (`outcomeOfRunResult` category `blocked`, or `pending-inline.json`) falls through to `{commit:'none'}`. The loop then reports verify-miss, retries the item, and adds a breaker miss for something that was not a miss. The retry hits the same blocker, and `pending-inline.json` stays in the unit dir.
- Red test: an executor whose adapter reports `adapterOutcome: 'blocked'` (the herdr-door test fixtures produce one). Expect a park with its own class (for example `worker-blocked`), not `verify-miss`.

## Low

- **X8:** the warnings are objects (`strayWriteWarning` returns `{code, level, …}`, and so does `provider-adapter.mjs:327+`), but `loop.mjs` logs `` `…warning for "${item.id}": ${warning}` ``, which prints `[object Object]` once X7/7 are fixed. Log `warning.code` and `warning.paths`, or use `JSON.stringify`.
- **X9:** `/tmp/fgos-worktrees/item-crash-ho2Kzo` and `item-crash-jaL9pJ` (2026-10-14 20:36 and 20:38, holding `.started .go output.txt`) were leaked by the rewritten e2e crash test. It uses the runner's default worktree dir outside the fixture and removes the checkout only on its last line, so any earlier failed assert leaks it. Use `try/finally`, or point the runner at a fixture `worktreeDir`.
- `spawnWorker` discards `workUnitFor`'s `warnings` (`work-ref-skipped`, `work-docsRef-skipped`), so an item whose refs were dropped gets no signal in its log.
- If the supervisor spawn itself fails (`assignment-runner.mjs:2473-2489`), a raw error is re-thrown. It escapes `spawnWorker` without an `errorClass`, the loop re-throws it as a bug, and the item sits in `doing` until the next reap. This is rare.

---

## Floor attacks: misses with evidence

1. **Crash, then resume.** The loop never resumes by itself. It learns the unitRunId only through the item log line (the e2e test proves the line is written before the worker runs), and `unit.json` stays `running`. Startup reap then moves the item to `blocked` (`runner-crash-reclaim`) and keeps the dirty checkout (new `checkoutPathOf` branch). Re-dispatching the same item later fails with `relocateOrphanedCheckout`'s "refusing to reclaim … uncommitted changes" (worktree-fail ×2, then park), which tells the person what to do. The unblock path is written down only in the lane report (residual 4: `fgos run --resume <unitRunId>`, or commit/discard and then `fgos move`). It is not in the runner spec, the CHANGELOG or the error text. Add it to the spec delta. Also note that a resume commits any partial files the killed round left, because `preExistingInScope` is taken from the first launch.
2. **Two items in parallel.** Probe P: two items in one wave, each worker sleeping 1.5 s. The total time was 2.58 s, both items reached `awaiting-approval`, the two Unit runs started 0.5 s apart, and each had its own worktree and cwd lock. `runUnit`'s synchronous parts (`ensureRunnerConfigForDir`, `commitUnitWork`) are serialized in-process. Worker slots are counted per `doing` as before. Miss.
4. **herdr without stdout.log.** The loop passes `herdrPresent:false`, and the probe confirmed `via=cli`. For a herdr-pinned run, `workerOutput` takes the first non-empty source among the report, `stdoutLog` and `agentClaim.summary`, so a fence is never read twice. The new `run-herdr.test.mjs` case pins that a pane run's `stdout.log` holds the settled report. Miss.
6. **Governance-blocked executor.** The `loop-rununit.test.mjs` case "an executor governance blocks is passed over…" passes (part of the 24 passes above). The event records `beta`, the executor that actually ran. Miss.
8. **verifiedSha.** Fan-out no longer passes `--worker-verified-sha`, and `return` judges the runner's commit. A worker that changed nothing gives unit `pass` with a `no-changes` commit, `return` refuses, and the item is returned `blocked`. Miss (the code agrees with 0052).
9. **Fan-out never leaves an item in `doing`.** An in-process candidate goes to `mechanismChanged` before `pick`. When slots are full the batch is `deferred` before `pick`. A failed `pick` means `picked=false` and the item is untouched. A throw from `runUnit` or `workUnitFor` (inside the try after `pick`) goes to the catch, which calls `return --to blocked`. A miss by reading the code, but **X1 means none of this is test-proven right now**. One pre-existing gap: `return --to blocked` is best-effort (`catch {}`), so if it fails the item stays in `doing` with no log line.
- **X10: the executor command does not exist.** Probe G: `worker-spawn-fail` ×2, then parked `blocked` (mapped via exit 127). Miss.

## Recommended order

1. Fix X1 and get the fan-out tests passing.
2. Decide X2 and X5 together: a binding fallback or seeded pools, plus `confinement-policy-error` as park (decision question for the Lead).
3. Fix X3: commit what a non-pass round left and let verify decide, or give it an honest class and message.
4. Fix 7: put the outside-write watch on the supervisor path in `executeAssignment`.
5. Fix X4: refuse `--config`, or thread it through; stop runUnit from writing the repo config during a loop run.
6. Fix X6 and X7, then the low items. Add the crash/resume unblock path and the reap residual to the spec delta.

Unresolved questions:
- Is the worker's self-report gating the commit (X3) intended under the 0052 design? If so, D3's wording in the spec and in the `spawnWorker` doc has to change.
- Is the detached supervisor outliving a killed runner (3/5) accepted for the loop? It is new behavior for loop workers.

Status: DONE_WITH_CONCERNS
Summary: Of 9 floor attacks, 7 miss on evidence. Floor 7 is a hit (the stray-write warning is never produced on the supervisor path) and the reap residual (3/5) holds. My own attacks found two critical issues (a committed fan-out test file that does not parse, and a default-config project halting the runner on its first item), a D3 regression where a non-pass worker's verified work is discarded with a false "changed nothing" message, and the `--config` / repo-config side effects. Every finding has a probe that reproduces it.
