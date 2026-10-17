# Code review: holder-lock 4.2 integration branch, round 1

Range: `main...holder-lock/integration` (HEAD 86d3ef5f4, main 70a9d1134 merged at 14a13bc3e). 153 files, +14903/-2400. Read-only review: static reading plus git/grep. Nothing was built or run.

## High

**H1. `npm test` aborts before any test runs when the process has neither `FGOS_HOST_BIN` nor an activation. This is the CI case, and it breaks CI on every OS.**
- `scripts/run-tests.mjs:427` takes the queue (`queue({ env })`) before `runSelectedTests` -> `buildTestEnv` (`:305`) -> `ensureHostBin` (`:137-141`). The host binary is built only for the children's env, after the queue is already taken.
- `scripts/lib/full-suite-queue.mjs:62` calls `resolveLockRoot({ env })`. With no `FGOS_STATE_ROOT` (plain `node scripts/run-tests.mjs` sets none), that goes to `runStateRootRoute` -> `hostBin()` (`src/holder-lock/driver.mjs:32-44`). `hostBin()` reads `process.env.FGOS_HOST_BIN`, then an activation (`src/util/host-bin-path.mjs:68-95`).
- `.github/workflows/ci.yml:73-83` sets neither `FGOS_HOST_BIN` nor `FGOS_FULL_SUITE_QUEUE`, and `.fgos/installation/` is not tracked. The result is `lock-driver-unavailable (no-host-binary)`, which is rethrown at `full-suite-queue.mjs:77-78` and not caught in `run-tests.mjs` main, so the exit is non-zero.
- On the Windows runner, even with a binary, `assertDriverUsable` throws `unsupported-platform` (`driver.mjs:203`).
- Why it was not seen locally: every worktree sits under the main checkout, so the walk-up finds the main checkout's activation.
- `CHANGELOG.md:40` says the binary is one "which the test runner builds". That is not true for the queue.
- Fix:
  - In `runTests`, call `ensureHostBin` first and set `process.env.FGOS_HOST_BIN`, because `hostBin()` reads `process.env`, not the passed env.
  - When the queue gets `lock-driver-unavailable` with reason `unsupported-platform` or `no-host-binary`, warn and run unqueued. The alternative is to set `FGOS_FULL_SUITE_QUEUE=off` in ci.yml, where one VM runs one suite anyway.
  - Proof: a fresh clone in a temp dir, then `env -u FGOS_HOST_BIN -u FGOS_STATE_ROOT npm test`.

## Medium

**M1. Machine-wide fences are placed behind a gate that only checks this workspace, and plain `fgos setup` triggers them.** This was P11 review M2; it is still open.
- `fixLockFences` checks only `activatedHolderLockRelease(repoRoot)` (`src/setup/holder-lock-checks.mjs:493-507`).
- It also places the provider-ledger blocking generations under `~/.fgos/runtime/provider-capacity`, which every workspace shares.
- `registerFix({ id: 'lock-fences' })` (`src/setup/registrations.mjs:2258`) also runs inside `fgos setup` with no confirmation (`bin/fgos.mjs:3976`).
- Scenario:
  1. forgentX is activated and someone runs `fgos setup` there while mdview is idle on the old release. The scan is clean, because the scan only sees running processes.
  2. The pid-1 generations land.
  3. mdview's next lease or quarantine fails with "held by pid 1" until mdview is activated.
- The CHANGELOG says "activate in every workspace first", but nothing enforces it.
- Fix: leave `blocking-generation` targets out of the `setup` path (explicit `doctor --fix` only). Otherwise, say plainly in the fix output that the machine-wide ledgers were fenced. At minimum, P12 must activate all three workspaces before any setup or `--fix`.

**M2. The lock-order rule (decision A3, plan criterion 6) cannot fire in production.**
- Every call site creates a fresh scope for each acquire:
  - `cwd-lock.mjs:38`
  - `session.mjs:163`
  - `loop.mjs:217`
  - `gateway-control.mjs:88`
  - `workflow/runner.mjs:834`
  - `recover.mjs:146`
  - `reconciliation-planner.mjs:216`
  - `provider-capacity.mjs:362,436,454`
  - `full-suite-queue.mjs:63`
- `lock-scope.mjs:5-6` says two scopes do not see each other. So a dispatch holding `dispatch-cwd` (rank 30) that takes `provider-account` (80), or any nesting, is never checked.
- "Full npm test shows no violations" is therefore vacuous. `CHANGELOG.md:44` presents it as a working guard.
- Fix: thread one scope per invocation, for example a dispatch scope passed from `executeExecutorCli`/`executeAssignment` into the provider calls. Otherwise, reword the CHANGELOG and spec to "per explicit scope; call sites do not nest scopes yet" and record the gap for 4.3.

**M3. `lock-holders` treats exactly the leak it is meant to catch as benign.**
- `holderOrigin` (`holder-lock-checks.mjs:339-352`) returns `borrowed` for any process whose environ carries `FGOS_LOCK_FD=<lock>:`, and `fgos-host` for any process carrying `FGOS_STATE_ROOT`.
- A background daemon started by a borrowed CLI (the codex/pi probe through `spawnHolding`) inherits both variables.
- If the holder dies before its sweep (`index.mjs:461-469`), that daemon keeps the account lock indefinitely, and doctor reports "every holder a fgOS process or a borrowed child".
- The plan's risk table lists `lock-holders` as the mitigation for this exact case.
- Fix: count a `borrowed` holder as legitimate only while a live non-borrowed holder of the same description exists (or its parent chain reaches one); otherwise warn "orphaned borrower".

## Low

- **L1. CHANGELOG accuracy.**
  - `CHANGELOG.md:113` (Unreleased) still says every holder of "a dispatch worktree lock now records its own `ttlMs`". That is false in the same release.
  - `:40` has the H1 wording.
- **L2. Holder listing can wrongly report a lock as free.**
  - `descriptionHolders` skips any process whose `/proc/<pid>/fd` cannot be read (`driver.mjs:284-289`).
  - `dispatchCwdHolder` (`cwd-lock.mjs:62-63`) and `liveAdvanceHolder` (`workflow/runner.mjs:808-809`) trust a `list` answer, so a holder that is not dumpable reads as free. The resume guard (`execution/run.mjs:347`) would then pass.
  - Real fgOS dispatchers are dumpable, so this is an edge case. It does weaken the "guard no longer treats an unreadable lock as free" line at `CHANGELOG.md` Fixed.
  - Fix: count unreadable same-uid entries and fall back to `probe` when there are any.
- **L3.** `readPredecessorKillWaitMs` accepts values above 60000, which doctor fails (`protocol.mjs:79` vs `holder-lock-checks.mjs` `MAX_KILL_WAIT_MS`). This was P11 L5; it is still open.
- **L4.** `needs-attest` (macOS, where quiesce-scan answers `unavailable`) has no CLI door. The fix message says to call `fenceCutover` with `attested` (`holder-lock-checks.mjs` fix switch), so macOS cannot fence through the CLI.
- **L5. Concurrent borrows on one handle can kill each other's children.**
  - `runBorrowed` lets a handle lend to several children at once (`borrows` counter, `index.mjs:425,448`).
  - The first child's sweep SIGKILLs every other holder of the description (`index.mjs:358-384`), and that includes the other still-running borrowed child.
  - No caller does this today. Fix: refuse a second concurrent borrow (`borrows > 0` -> throw).
- **L6.** In advance and recovery, `existsSync(runDir)` is checked and then `ensureLockFile` runs `mkdirSync(..., {recursive:true})` (`index.mjs:147-150`). A run deleted between the two is recreated as `<runDir>/locks/` (`workflow/runner.mjs:829-834`, `recover.mjs:144-146`). This is cosmetic.
- **L7.** `docs/specs/runner.md:1238` still lists "khoá dispatch" among the readers of `run-timeout.mjs`. The cwd lock no longer reads it.
- **L8.** The related-tests CI job checks out shallow (`ci.yml:154`), while the fence tests need base `a9e48b67d` (`test/holder-lock/fixtures/extract-v1.mjs:23`). It fails only if the selector picks those tests. The p07 migration test has the same pre-existing pattern.

## Confirmed OK

1. **Description rule.**
   - Node opens lock files close-on-exec (libuv `O_CLOEXEC`).
   - The only fd-mapped spawns are the route helper (`driver.mjs:104,130`), `runBorrowed` (`index.mjs:419`) and the doctor probe's `sleep` (`holder-lock-checks.mjs:141`).
   - The Rust `internal` dispatch runs before any spawn (`apps/fgos/src/main.rs:148-156`) and seals slot 3 (`route.rs:33-45`). `spawn_with_fds` uses `F_DUPFD_CLOEXEC`.
   - Borrowed git gets `-c gc.auto=0 -c maintenance.auto=false` (`index.mjs:335-340`). `workerBaseEnv` drops `FGOS_LOCK_FD`.
   - Two descriptions in one process exclude each other through flock, and the sweep excludes only its own pid. No confusion found apart from L5.
2. **Stop-everything check.**
   - The order is scan, then place, then rescan (`fences.mjs:447-457`).
   - Every path is checked before anything is written; a lock that appears mid-loop returns the paths placed so far, as documented.
   - The fix acts only when the activated payload ships `packages/holder-lock/contracts/lock-registry.v1.json` (`holder-lock-checks.mjs:462-483`).
   - The scan matches any `fgos`/`bin/fgos.mjs` argv on the machine, any cwd under the workspace, and any `FGOS_STATE_ROOT` environ, and it excludes itself.
3. **No v1 path remains for the 10 locks** in `src/ scripts/ bin/ apps/`:
   - No `open('wx')`/unlink lock loops, `dispatch--`, composite identity, generation-lock functions, `recordChild`, `/tmp` full-suite lock, or old `advance.lock`/`.recovery.lock`/`{gateway,sessions,runner}.lock` file paths.
   - What remains is in fence code (`fences.mjs`), 4.3 files (`main-checkout-lock.mjs`, `events.mjs`, `runtime-coordination.mjs`), `run-lock.mjs` (attempt/control, 6.2), the v1 extractor in tests, and comments.
4. **Merge of main.**
   - The CLI flag registry needs no new lock verbs or flags: `internal` is handled in Rust before the route table, and `doctor --fix` and `dispatch reconcile plan --cwd` already exist; the `--cwd` description is updated.
   - CHANGELOG: every Unreleased bullet from both parents is present.
   - `distribution.md` row 7 keeps main's `domain-registry-compiled` wording plus the holder-lock checks; row 7b and RUL101 history are kept.
   - `run.mjs` imports merged both sides (`AgentNotFoundError`, `parseYaml`, `dispatchCwdHolder`).
5. **P10/P11 follow-ups.**
   - The `bin/fgos.mjs:2660-2665` comment is fixed (86d3ef5f4).
   - `docs/specs/runner.md` is updated at :21-23 (clear-cwd-lock), RUL86 (:1114), RUL96 (:1124), :3352 (`dispatch--` removed from the ttl writers), RUL75 account lock (:1101), :1490 advance lock, :812/:1222 sessions/runner.
   - `run-timeout.mjs` and `config.mjs` comments are updated.

## Unresolved questions (round 1)

- Is Windows CI expected to go red on lock-touching tests until 4.4, or should those tests skip on win32? H1 aborts the run before this question even comes up.

Round 1 status: DONE_WITH_CONCERNS. H1 blocked landing.

---

# Round 2 (final): fixes at 86db4d092

Commits checked: eaf88cd02, d159b9a37, 9f046b432, 9b9f13d64, and the merge 86db4d092 (main 36d5bf66f).

## (a) The fixes

- **H1: fixed.**
  - `scripts/run-tests.mjs:441-449` `queueWithHostBin` runs `ensureHostBin(process.env)` and sets `process.env.FGOS_HOST_BIN` before the queue. `hostBin()` reads `process.env`, so this is the right place.
  - The CLI door uses it (`:452`).
  - `buildTestEnv` later spreads the same `process.env` object, so the second `ensureHostBin` returns at once through its `version` check. There is no second build.
  - If cargo is missing, it warns and still tries the queue. With an activation above the checkout that still works; with neither, the error is named. That is acceptable.
- **The Windows path is correct.**
  - The route answers `--guarantee` before it touches any driver (`route.rs:184-188`). The Windows driver gives `exclusion: unsupported` (`driver/windows.rs:19-24`).
  - `assertDriverUsable` throws `lock-driver-unavailable` with `reason: 'unsupported-platform'` (`driver.mjs:203-204`, with `reason` assigned onto the error).
  - `full-suite-queue.mjs:80-83` matches exactly that error, warns and returns a no-op release.
  - `state-root` has no Windows dependency.
- **The H1 tests are adequate.** One unit test checks the order (env set before the queue) and the cargo-missing path. The Windows unsupported path is tested only on win32, which is the only place it can be proved.
- **L3: fixed.** `protocol.mjs:22,80` enforces 1 to 60000 at acquire, and doctor re-exports the same constant (`holder-lock-checks.mjs:30`). The test covers `'2s'`, 0 and 60001.
- **L1, L7 and the CHANGELOG half of M2: fixed.**
  - CHANGELOG :40 now describes resolve-then-queue, the cargo build and the Windows unqueued run. :44 says cross-door order is not checked yet. :113 no longer claims a ttl for the dispatch lock.
  - `runner.md:1238` now names the main-checkout ttl ceiling. I verified that claim: `main-checkout-lock.mjs:50` imports `RUN_TIMEOUT_MAX_MS`.
- **d159b9a37: fine.** The settle loop is now a 60 s time budget with 250 ms pauses. It still asserts that only foreign pids blocked the scan, so the test was not weakened. The worst-case added time is 60 s per settled scan, which is acceptable.

## (b) CI behaviour

- On Linux and macOS, ci.yml builds `--release --workspace`, then `ensureHostBin` builds `target/debug/fgos`, which the queue and the children use.
- That debug build is not new: before this change, `buildTestEnv` did the same build, only after the queue. CI cost is unchanged.
- Optional: set `FGOS_HOST_BIN=target/release/fgos` in the npm test step to skip the debug build (low priority).
- On Windows, the queue now warns and runs unqueued instead of aborting.

## New finding

**N1 (medium, not blocking). The host-binary build now happens outside the queue, so with a shared Cargo target dir it can swap the binary under a running suite.**
- Before this change the debug build ran under the queue, so two same-generation runs were serialized.
- Now run B in worktree B builds `<target>/debug/fgos` from B's source before it waits for the queue, while run A, which holds the queue, keeps exec'ing `FGOS_HOST_BIN=<target>/debug/fgos` for every spawn.
- With `target/` symlinked across worktrees (the owner's setup), A's remaining tests run B's host. That can mean a different internal protocol, or no `internal` route at all, which shows up as a `host-version-mismatch` or behaviour flake attributed to A.
- Branches from before 4.2 already build into the shared target outside the new queue, so this widens an existing hazard rather than creating a new class.
- Fix: after `ensureHostBin`, copy the binary into the run's own temp dir (run-tests already makes one per run) and point `FGOS_HOST_BIN` at the copy. The alternative is to only locate a binary before the queue and build after taking it.
- For P12: run the final suite with no concurrent suite in other worktrees, which P08 already advised.

## (c) Main merge 86db4d092

- Outside `docs/`, `.fgos/` and `plans/`, the merge changes no file. CHANGELOG is untouched by it, and there is one `## [Unreleased]`.
- No new issue.

## Items left open: agree none blocks landing

- **M1:** acceptable with the P12 order (all three workspaces activated before any setup or `--fix`). Condition: before the first setup or `--fix`, confirm that no other workspace on this machine still runs a pre-4.2 release that uses provider capacity. AGENTS.md says fgOS runs on more projects than these three, and the provider fences are machine-wide.
- **M2 (code half), M3, L2, L4, L5, L6, L8:** not blocking. Record M3 (orphaned borrower invisible to `lock-holders`) and M2 (no cross-door order check) explicitly as 4.3 follow-ups, because the spec and plan present both as safeguards.

Status: DONE_WITH_CONCERNS
Summary: H1, L1, L3, L7 and the CHANGELOG half of M2 are fixed correctly, the Windows unqueued path is right, and the main merge adds nothing. Nothing blocks landing. N1 (the host build now runs outside the queue and can swap the binary under a concurrent suite that shares `target/`) is a medium follow-up. M1 holds only if every workspace on the machine is on 4.2 before the first setup or `--fix`.
