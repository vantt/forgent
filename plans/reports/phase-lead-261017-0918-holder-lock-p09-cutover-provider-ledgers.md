# Phase lead report: holder-lock P09 — cutover provider state and account locks

- Plan: `plans/261016-1104-holder-lock-kernel-lock-foundation/plan.md`, phase file `phase-09-cutover-provider-ledgers.md`
- Branch `holder-lock/p09-cutover-provider-ledgers` (worktree `.claude/worktrees/hl-p09`, from integration `8917cd837`), merged into `holder-lock/integration` as `ed17b2dec` (`--no-ff`).
- Impact analysis (GitNexus, index stale; cross-checked with grep): **`withFileLock` HIGH** (4 direct callers in `provider-capacity.mjs`: lease acquire/release, quarantine, clear; flows `dispatchBound`, `executeAssignment`, `settleRunOutcome`, `runDispatchCli`). Kept its behaviour (sync, 30 s default, `ProviderCapacityLockError` code `provider-capacity-lock-stale`). `acquireAccountLock`, `runCredentialProbe`: not in the index → grep: callers `provider-credential-renewal.mjs:1023,1040,1078`, `provider-capacity.mjs` probe loop, `execution/run.mjs:613` (`createCredentialProbe()`), `assignment-runner.mjs:1669`.

## Commits

| Commit | Change |
|---|---|
| `97a8c95cb` | provider-state and provider-account become machine mutexes through the facade (`<lockRoot>/provider-state.lock`, `<lockRoot>/provider-account/<p>/<a>.lock`, registry rows). Deleted the whole generation ledger (`GENERATION_FILE_RE`, `currentGeneration`, `acquire/tryAcquire/recordGenerationChild/releaseGenerationLock`, fsync temp helpers, the GC trade-off and C2c/S3 history comments), `recordChild`, `isPidAlive` export (lease reclaim now uses `pidExists`), `lockDir` of `providerCapacityStatePaths`. `withFileLock(lockDir, fn)` → `withProviderStateLock(fn)` (only test callers outside). D6: the account handle is `{dir, spawnHolding, release}`; `spawnHolding` = `runBorrowed(handle, spec, {sync:false})`; renewal (`renewInScratch`) and the unlock probe start their call through it. `runCredentialProbe` judges a borrowed child only after its `borrowed` promise settled, so the release never races the leftover sweep. Facade: `runBorrowed` honours `spec.detached` (the probe kills its process group on timeout). Import-graph test: lock-door exemption (below). |
| `a83514dd7` | review fixes H1, M2, M3, M4 |

## Decisions (lead)

1. **One commit for both locks**, not one per lock: their v1 code is the one shared generation-ledger primitive, deletable only once both are cut over.
2. **Reconcile import closure reaches the lock door.** `reconcile.mjs` writes provider state (quarantine/clear) and is called only by `bin/fgos.mjs`, which no phase may edit, so injecting the lock from outside the closure (the P10 fallback) is not available; a lazy edge would need async use cases and a wiring module for every caller. Chosen: `provider-capacity.mjs` imports the facade statically; the test adds the 6 holder-lock modules + `src/util/host-bin-path.mjs` to `EXPECTED_CLOSURE`, and `LOCK_DOOR_FILES` (`src/holder-lock/index.mjs`, `driver.mjs` only) may load `child_process` and contain spawn/kill. Pinned further (M3): no other closure file names `runBorrowed`/`spawnHolding`, and reconcile's entry files never name the account-lock calls. **P10 can reuse this exemption** for `reconcile.lock` and the cwd `probe` in `reconciliation-planner.mjs`.
3. Account lock path follows the registry (`provider-account/<p>/<a>.lock`), not the phase file's `provider-account--<p>--<a>.lock`.
4. The lock is keyed by machine (lockRoot + provider + account), no longer by `runtimeDir`. No production caller passes a non-default `runtimeDir` (reviewer confirmed); tests did, and one test leaked handles that the old per-runtimeDir lock hid (fixed).
5. `tryAcquireAccountLock` returns `null` for `lock-predecessor-domain-not-empty` (busy); the waiting doors map it to `ProviderCapacityLockError` (M2), keeping `assignment-runner.mjs:1134,1695` branches intact.
6. `inspectProviderCapacityLock()` kept (doctor check `provider-capacity-lock-stale` in `registrations.mjs`, P11-owned, still imports it) and reimplemented on `lockHolders`: a listed holder is always alive. P11 deletes check + function together.
7. The probe seam renamed `onSpawn` → `spawnHolding` (spawn signature). `createCredentialProbe({spawnFn})` keeps `spawnFn` as the test seam; default is now the lock's spawn, then plain `spawn`.
8. Tests pin a private `FGOS_STATE_ROOT` per file (`provider-capacity`, `provider-credential-renewal`), inherited by every child.
9. Host binary: hardlinked P07's phase build (Rust tree unchanged since P06; RAM rule) into `.fgos/runtime/tmp/cargo-p09`; the worktree `target` symlink points there for the staged-release tests.

## Review (code-reviewer, Sonnet) — `plans/reports/code-reviewer-261017-0918-holder-lock-p09-provider-ledgers-review.md`

| # | Finding | Action |
|---|---|---|
| H1 | account dir `mkdirSync` after the lock was held → a throw leaks a held lock | Fixed: dir made before acquire |
| M1 | six other test files use the machine lock root (run-tests strips the pin) | Not changed: outside this phase's files; suite green; real lock files are harmless, contention is ms-long. Concern below |
| M2 | waiting doors throw raw `lock-predecessor-domain-not-empty` | Fixed (decision 5). No direct test: needs a predecessor record whose domain cannot be killed (P03 covers the facade side) |
| M3 | exemption path-tight but "reconcile never borrows" not enforced | Fixed: assertions in the import-graph test |
| M4 | sweep rejection discarded a successful probe answer | Fixed: the answer stands |
| Low | swallowed release errors would hide `lock-release-while-borrowed` for a custom probe; timeout-kill/error-after-spawn untested; facade + probe module outside the owned-file list | Noted. Facade change is one additive field |

## Tests (`env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<phase build>`)

Phase tests (all real processes, real route):

| Test | File | Result |
|---|---|---|
| account holder SIGKILL while its probe child (`node`, 2 s) lives → `tryAcquire` null; waiting acquire gets it only after the child exited | `provider-capacity.test.mjs` | pass; **negative control** (spawnHolding = plain spawn) red: "the live child keeps the lock for its dead holder" |
| account holder SIGKILL with no child → free at once | same | pass |
| holder in `bwrap --unshare-pid --die-with-parent` with the pinned root excludes the host; free once gone | same | pass |
| state-lock holder SIGKILL → next lease selected at once, `inspectProviderCapacityLock` lists then clears the holder | same | pass |
| 10 processes × 10 trials lease race, no lost lease; 10 × 15 marker exclusivity | same | pass |
| lease waits only `lockWaitMs` (error carries holder pid), default outlasts a 1.5 s hold | same | pass |
| dead runner with a live renewal call (real processes) → `lock-busy`, no second renewal; renewed once the call ended | `provider-credential-renewal.test.mjs` | pass |
| renewal without injected spawn: stand-in `pi` on PATH sees `FGOS_LOCK_FD=provider-account:3` and fd 3; lock free after | same | pass |
| probe answers only after the call let go of the lock | `provider-credential-probe.test.mjs` | pass |

- Narrow, phase branch: import-graph + provider-capacity + renewal + probe **177/177** (provider-capacity file 7.5 s, was minutes with the ledger trials). Related files (per-cli sources, credential-copies, quarantine-probe, reconcile-operation, runtime-inspect, cli inspect, account-rotation, provider-failover, unit-run-outcome, auth-failure, setup/checks, holder-lock/*, architecture): 343 tests, 340 pass + the one probe test rewritten, 2 skipped.
- Full `npm test` run 1 (target symlink still on main's shared build): 7934 tests, 7811 pass, 35 fail — all staged-release/fgctl tests staging main's old `fgos` (no `internal` route). Not a code failure; fixed by the symlink (decision 9), as P07/P08 did.
- Full `npm test` run 2 (final code): **7934 tests, 7843 pass, 3 fail, 13 skipped**. Each failure classified: `fences-stop-check` "clean workspace is fenced" — its machine-wide process scan saw a parallel test file's own `holder-lock-state-root-*/resolve.mjs` process (P08 noted this class); 7/7 alone. `spawn-worker` output-budget kill — 18/18 alone (load). `release-tree` R1&R2 — red alone too: `convention-conformance` reports 1 post-cutoff violation from misnamed `plans/reports/*-261008.md` already on the base (P07 confirmed on integration `1ae02d846`); pre-existing, not this phase.
- Integration after merge: integration `ed17b2dec`: import-graph, provider-capacity, renewal, probe, per-cli sources, credential-copies, quarantine-probe, reconcile-operation, registry-contract, fences-v1-ledger, architecture: **277/277**.
- "S1 live probe": not hit (`executeAssignment … (S1 live probe)` passed in run 2).

## Concerns

- **P11 docs** (old lock text):
  - `docs/specs/runner.md:73` "lock ở `~/.fgos/runtime/provider-capacity/state.lock`" → kernel mutex `<stateRoot>/locks/provider-state.lock`, machine scope.
  - `docs/specs/runner.md:1100` (RUL75 account lock: "same append-only generation format … holder records the pid of the renewal child") → kernel mutex `<stateRoot>/locks/provider-account/<provider>/<account>.lock`; the renewal/probe call runs through the lock (`spawnHolding` = `runBorrowed`), so a dead holder with a live call keeps it; the account directory still holds pending copies, scratch homes, cooldown.
  - `docs/specs/distribution.md:67` row 5d ("plus lock `state.lock`", "the per-account lock" under `account-locks/`) and `:71` `provider-capacity-lock-stale` description.
  - `src/setup/registrations.mjs:2235` comment + check `provider-capacity-lock-stale`: delete with `inspectProviderCapacityLock`.
- **P11 CHANGELOG** (phase file line): "Changed: lock tài khoản provider và lock trạng thái capacity là kernel lock phạm vi máy; thư mục thế hệ không còn lớn dần. Release cũ thấy "held by pid 1" trên các lock này." Add: the lock is now per machine, not per runtime dir.
- **P10:** reuse decision 2's `LOCK_DOOR_FILES` exemption; keep the M3 assertions green (planner may name `probe`/`acquireSync`, not `runBorrowed`).
- M1: six test files still lock on the machine's real root during `npm test`.
- No plan/journal sync: the controller owns `plan.md`.

## Unresolved questions

None.
