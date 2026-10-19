# Review: Event Store phase 06, the dormant Node facade (56d42a27c against base 6b39f6179)

I reviewed this read-only. I read the full diff, the phase 06 plan, the lead report, spec sections 4, 8, 13, 17 and 22, Git's `resolve_repo`, the Event Store lock code, and the holder-lock spawn sites. I did not rerun the test suites, because building would write target directories. The test results cited below come from the lead report.

**Verdict:** nothing is Critical or High. Two Medium findings should be fixed before merge, or explicitly accepted. Everything else is Low.

## Answers to the six focus questions

1. **Nothing in the gate spawns or calls a Git port.** `append` and `read_in_gate` (`packages/git/node-addon/src/event_store.rs:60-117`) take only `Layout` and `Registry`, never the `GitDriver` or `RepoHandle`. So reaching a Git port from them is impossible by construction. I also searched for `Command` in `packages/event-store/rust/src` and found none. In holder-lock, `Command` appears only in tests, the doctor semantics probe and the `quiesce-scan` CLI route, never in `acquire`. The strace test brackets only append and readInGate, with markers written after setup, and checks clone, clone3, fork, vfork, execve and execveat under `-f`. The probe also proves the exec guard is active inside the gate. The refusals carry names: `event-store-seal-under-state`, `lock-order-violation`, `event-store-held-ranks-required`, `event-store-no-repository` and `event-store-unsupported-platform`. The planned crate debug assertion is missing, and the lead disclosed that. The structural argument above covers it for now.
2. **The hot-guard extraction is correct.** The code moved byte for byte. The guard still installs when `hot-lock.mjs` is imported, because `hot-lock.mjs` imports `hot-guard.mjs`. `src/git/index.mjs` used to import `hot-lock.mjs` and now imports `hot-guard.mjs`, so it still installs the guard. `HotLockError` and `hotLockDepth` are re-exported from `src/state/hot-lock.mjs`. The two production importers of `hotLockDepth` (`runtime-coordination.mjs` and `git/index.mjs`) were migrated. Every other importer uses only `withStateTx` or the record helpers, which did not change. Reentry, enter and leave keep the same order inside `withStateTx`. `hot-guard.mjs` imports only Node built-ins, so the `kernel` layer is correct. One concern: the extraction widens the guard's public surface (L1 below).
3. **Repository authority is opaque and resolved before the gate.** `EventStoreRoot` is a `#[napi]` struct with private fields and no constructor, so JavaScript can only get one from `resolveEventStore`. `prepareStore` and `openStore` refuse when `hotLockDepth() > 0`. Every outside-gate method checks the held ranks twice: once in JavaScript (`outsideGate`, which refuses `>= 58` and 60) and once in Rust (`context` calls `validate_seal_context`).
4. **The authority checks survive.** `validate_seal_context` only checks; making it public grants nothing. `guarded_unpublished_summary` acquires `event-seal` itself and builds `HolderAuthority` from the handle it holds. `unpublished_summary` still needs a `PublicationPort`, and that cannot be built without the authority. There is a small ordering issue (L4).
5. **Environment, machine identity and packaging are correct.** The Git driver scrubs the environment, and the test sets a hostile `GIT_DIR`. The machine id comes from Git config through `driver.machine_id`, then from `<stateRoot>/machine-id`, and `openStore` refuses a mismatch with `event-store-machine-id`. The consumer manifest is shipped data, and rebuild modules load lazily. Packaging is correct: `package.json` `files` adds `packages/event-store/contracts`, and `scripts/build-rust-distribution.mjs:164` stages from `pkg.files`, so the legacy-node payload carries the contracts too.
6. **The tests are real and contain no env switches.** They use temporary repositories, a real bare remote, the real addon, strace, and subprocesses for the platform and manifest cases. The gaps are listed in L5 and L6.

## Critical
None.

## High
None.

## Medium

**M1. A prepared store's `append` trusts a machine id supplied by the caller.**
- **Where:** `packages/git/node-addon/src/event_store.rs:60-96` and `src/event-store/native.mjs:69-72`.
- **Problem:** `openStore` binds and checks `machine` (`event_store.rs`, in `open_store`), but `append` still takes `machine: String` and passes it straight to `append::AppendRequest`. A prepared `EventStore` can therefore append under a machine id other than the one it resolved. Today only `native.mjs` blocks this, and it does so by convention. That breaks the "authority resolved before the gate, opaque afterwards" property this phase exists to establish.
- **Fix:** when `self.machine` is `Some`, use it, and refuse any supplied value that differs with `event-store-machine-id`. Better, drop the parameter from the prepared path entirely. M2 removes the only unprepared caller.

**M2. A second door to open a store is still public, and only a test uses it.**
- **Where:** `src/event-store/native.mjs:35-40`, the re-export at `src/git/index.mjs:17`, and the `#[napi(constructor)] EventStore::new(commonDir, contracts)` in `event_store.rs:45-57`.
- **Problem:** this path opens a store from a raw `commonDir` and inline contracts. It skips Git's `resolve_repo`, the `GIT_*` scrubbing required by spec section 8, the machine-identity binding and the shipped consumer manifest. Its only caller is `test/git/native-load.test.mjs:49`. The comment calls it a "compatibility entry used by the combined-addon tests". That makes it production code kept alive for a test, which conflicts with RUL104/L10 (move every caller, delete the old path) and with design principle 1 (one door).
- **Fix:** switch `native-load.test.mjs` to `resolveEventStore` plus `openStore` (or `prepareStore`). Then delete `createEventStore`, its re-export and the napi constructor. If deleting the constructor is impossible, make it refuse.

## Low

- **L1. The guard's surface is wider than before.** `src/holder-lock/hot-guard.mjs:21-22` now exports `enterHotLock` and `leaveHotLock`. Any module can call them, and `leaveHotLock` has no floor. One stray call can push the depth to 0 or below and silently disable the exec guard and every facade refusal. Before the extraction, both were private to `hot-lock.mjs`. **Fix:** export one `withHotSection(fn)`, or an `enter()` that returns a one-shot release, and floor the depth at 0. Alternatively, add an architecture-test rule that only `src/state/hot-lock.mjs` may import them.
- **L2. Error codes are recovered by fragile parsing.** `call()` (`src/event-store/native.mjs:28-35`) finds the code by searching the error message for the first `event-store-*` or `lock-order-violation`, without an anchor. The Event Store's `Display` format is `"{code}: {detail}"` (`errors.rs:5`), so a detail that contains a path such as `/x/fgos-event-store-foo` can be mislabeled. Separately, Git `OperationError`s are serialized as JSON (`operation()` at the end of `event_store.rs`), so Git refusals such as `untrusted-worktree` and floor failures reach JavaScript with no `code`. **Fix:** anchor the match with `^([a-z][a-z-]*):`, and parse the JSON message for Git operation errors, or have the addon set the code.
- **L3. Some valid repositories are refused as "not a repository".** With the default `trustedMain = cwd` (`native.mjs:45`), Git's `resolve_repo` (`packages/git/rust/src/driver.rs:312-352`) returns `NotARepository` for a linked worktree, because `.git` is a file there. It returns `untrusted-worktree` for a subdirectory of the main checkout. Both arrive as `event-store-no-repository` or with no code at all. The topology limitation itself was approved. But "not a repository" misnames a valid worktree, and a future `prepareStore(process.cwd())` caller would fail for a confusing reason. **Fix:** make `trustedMain` required, or refuse with a distinct code. Record the limitation in the phase 07 brief.
- **L4. `guarded_unpublished_summary` checks too late.** It (`packages/event-store/rust/src/sync.rs:539-563`) checks `repo.common_dir() != layout.common_dir` only after a waiting `acquire_seal`. A mismatched call first waits on, and takes, another store's seal lock. **Fix:** do the cheap mismatch check before acquiring. Note also that this read-only summary waits behind a running seal or sync, which is acceptable but worth documenting.
- **L5. Two weaknesses in the strace proof.** `test/event-store/no-spawn-in-gate.test.mjs:25` skips when the combined stderr matches `Operation not permitted`. That stderr also includes the probe's own output, so a probe failing with EPERM would skip instead of failing. **Fix:** match only strace's own `strace: ... ptrace` message, or check strace's exit status before running the probe. Also, the window covers only the uncontended happy path. Sequence recovery and holder reclaim are covered only by the structural argument in focus answer 1.
- **L6. Test vectors are missing.**
  - The in-gate refusal loop (`facade.test.mjs`, "prefetched store survives…") leaves out `status` and `unpublishedSummary`.
  - The plan vector "a Node scope holding main-checkout 50 is allowed" is tested with an array `[50]`, not a `LockScope`.
  - The scrubbing test covers only `GIT_DIR` and asserts `machineId`, not `commonDir`. Adding `GIT_COMMON_DIR` or `GIT_CONFIG_*` with a `commonDir` assertion would make it prove section 8 directly.
- **L7. The `prepareStore` cache key misses one input.** The key (`native.mjs:47-49`) leaves out `loaderOptions`, so two different addon descriptors in one process share a cached store. Entries are also never invalidated, for example after the repository is removed. This is acceptable for a per-process cache, but it should be documented.
- **L8. Nits.**
  - `src/state/hot-lock.mjs:27-29` leaves a stray blank line inside the import block.
  - The `HotLockError` doc comment in `hot-guard.mjs` says "raised by this module", but `hot-lock.mjs` raises most of them.
  - Phase-06 context still cites `hot-lock.mjs` `hotLockDepth at :58`.
  - `consumers.mjs` validates `contractFile` uniqueness but not `cachePath` uniqueness.

## Not verified by me
- Test and build runs: I relied on the lead report (Rust 134 passed, Node matrix 49 passed, strace run clean). The full `npm test` stopped with EROFS on the full-suite lock and still needs a rerun outside confinement, as the lead noted.
- Impact analysis: not run. This was a read-only review, and I cross-checked callers with grep.

## Unresolved questions
- Will M2's deletion be done here, or tracked as a separate item before phase 07?
