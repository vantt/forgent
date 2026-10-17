# Implementation report: Node facade `LockScope` (holder-lock track, phase 03)

Branch `holder-lock/p03-node-facade`, worktree `.claude/worktrees/hl-p03`. Phase file: `plans/261016-1104-holder-lock-kernel-lock-foundation/phase-03-node-facade-lockscope.md`.

Two rounds: round 1 was cut off by a provider session limit after committing `wip: partial work from an interrupted round`; round 2 (this report) reviewed that commit against the phase file, fixed one defect, and wrote this report. No file was started over.

## Files

| Action | File | What |
|---|---|---|
| created (r1) | `src/holder-lock/protocol.mjs` | protocol constant, `LOCK_FD_SLOT`/`LOCK_FD_ENV`, `HolderLockError`, `parseRouteLine`, `readPredecessorKillWaitMs` via `readSharedConfigOrEmpty` + `mergeWithGlobalConfig` (the project-over-global reader `fgos setup`/doctor use; no new config reader) |
| created (r1) | `src/holder-lock/registry.mjs` | loads `lock-registry.v1.json` once, fills `<fgosDir>`, `<lockRoot>`, `<runDir>`, `<workflowRunDir>`, `<ref>`, `<provider>`, `<account>`, `<NN>`, `<id>`, `<encodeURIComponent(cwd)>`, `<os.tmpdir()>`, leading `~`; strict for v3Path (`lock-path-param-missing`), lenient for v1Path; Rust-owned rows (`v3Path: null`) refused |
| created (r1) | `src/holder-lock/state-root.mjs` | `FGOS_STATE_ROOT` pin wins (read fresh each call); otherwise `fgos internal state-root` once per process, cached; Node never computes the root itself |
| created (r1, fixed r2) | `src/holder-lock/driver.mjs` | binary via `resolveActiveHostBin` once per process; `runLockRouteSync`/`runLockRoute` (fd at slot 3, SIGKILL at deadline, `killed` answer); `--guarantee` once per lock directory; `assertDriverUsable` (`none` -> `unsupported-filesystem`, `unsupported` -> `unsupported-platform`, both `lock-driver-unavailable`); `/proc` description-holder scan and one-sweep SIGKILL |
| created (r1) | `src/holder-lock/lock-scope.mjs` | `LockScope`: rank must be strictly above every held rank; same rank refused; throws `lock-order-violation` with `{held, acquiring}` at once; two scopes independent |
| created (r1) | `src/holder-lock/index.mjs` | `acquireSync` (`--wait-ms`, `spawnSync` timeout = wait + killWaitMs + slack), `acquire` (async `--try` polling), `probe` (`--shared-try`), `lockHolders`, `runBorrowed` (sync/async, fd only here, `FGOS_LOCK_FD=<name>:3`, git gets `-c gc.auto=0 -c maintenance.auto=false`, post-exit leftover sweep, `borrow-leftover-not-killed`), `checkBorrowedDescription` (`--borrowed-check`), `LockHandle.release()` = `closeSync`, idempotent, refused while a borrow is in flight; `held (predecessor-domain-not-empty)` -> `lock-predecessor-domain-not-empty` with the domain; fd lives in a module-private WeakMap, no export returns it |
| modified (r1) | `src/runner/dispatch/adapters.mjs` | `workerBaseEnv` drops `FGOS_LOCK_FD` and `FGOS_MAIN_LOCK_HOLDER_PID`, pins `FGOS_STATE_ROOT` to this process's resolved root |
| created (r1) | `test/holder-lock/facade-multiprocess.test.mjs` | phase tests 1 and 4b |
| created (r1) | `test/holder-lock/lock-scope-order.test.mjs` | phase test 4 |
| created (r1) | `test/holder-lock/run-borrowed-git.test.mjs` | phase tests 2 and 3 |
| created (r1) | `test/holder-lock/state-root.test.mjs` | phase test 5 |
| created (r1) | `test/holder-lock/driver-unavailable.test.mjs` | phase test 6 |
| modified (r1) | `test/runner/herdr-spawn-adapter.test.mjs` | the existing `workerBaseEnv` test now asserts the two dropped lock variables and the pinned state root |
| created (r2) | this report | |

### Round 2 review of the round 1 commit

Checked every requirement line of the phase file against the code; all present (see table). One defect found and fixed:

- `driver.mjs` `runStateRootRoute` spawned the state-root route with the caller's env verbatim, so `FGOS_INVOCATION_RECORD_PATH` leaked into the helper and an internal route could write an invocation record. It now applies `routeEnv()` like every lock-fd call. The caller's env is still the one the root is resolved from (the state-root vectors depend on that).

Static checks done by reading, since nothing could be executed (see below): import/export names consistent across the six modules; no export returns an fd (`LockHandle` keys: name, path, rank, kind, scope, projectRoot, killWaitMs); `adapters.mjs` import `../../holder-lock/state-root.mjs` does not trip the A4 guards in `test/architecture.test.mjs` (`state-root.mjs` is not `state/`; no Work-shaped token; no dynamic load); layering: every holder-lock module imports `protocol.mjs`, which imports `src/config/global-config.mjs` (layer `infra`), so all six must be registered as `infra`; `adapters.mjs` (`infra`) importing an `infra` module is a same-layer edge, allowed.

## Tests: what each covers

`test/holder-lock/facade-multiprocess.test.mjs` (phase 1, 4b)
- lock taken through the facade stays held after the helper exits; another Node process gets `held/kernel-lock-held`; `probe` says held; release idempotent; then the other process acquires and `probe` says free; handle exposes no fd-named key
- two scopes in one process = two descriptions that exclude each other
- holder SIGKILLed -> lock free at once, re-acquirable
- `acquireSync` with `waitMs: 200` on a held lock -> `timeout`, elapsed within [150, 3000) ms, `/proc/self/fd` count unchanged (description closed), nothing stays held
- argument refusals before any file is touched: `lock-scope-required`, `lock-wait-invalid`, `unknown-lock`, `lock-path-param-missing`
- 4b: predecessor record pointing at a live `node` process -> `acquireSync` returns `acquired` in < 1000 ms and the process died by SIGKILL
- 4b: `lock.predecessorKillWaitMs: 200` in a temp `.fgos/config.json` and a record pointing at pid 1 -> `lock-predecessor-domain-not-empty` carrying the domain, elapsed within [150, 1500) ms, `probe` free afterwards (skipped as root)
- malformed `lock.predecessorKillWaitMs` -> `lock-config-invalid`, no lock directory created

`test/holder-lock/lock-scope-order.test.mjs` (phase 4)
- lower rank after higher -> `lock-order-violation` with `held`/`acquiring`/`scope`; same rank twice -> violation; ascending passes and a released lock stops constraining; two scopes keep separate histories
- real acquire: main-checkout(50) then sessions(80) then gateway(10) throws, `gateway.lock` never created; another scope takes gateway while the first still holds

`test/holder-lock/run-borrowed-git.test.mjs` (phase 2, 3)
- temp repo with loose objects, `gc.auto=1`, pre-commit hook that (a) runs a Node script calling `checkBorrowedDescription` and (b) leaves `sleep 30 &` behind; `runBorrowed(git commit)` exits 0 in < 10 s; hook result is `borrower`; exactly 1 leftover killed (no gc daemon ran); leftover pid dead; `lockHolders` lists only the holder; sibling that opened the file itself -> `not-borrower/lock-not-held-by-description`; `probe` held until release, free right after; commit landed
- a plain child spawned outside `runBorrowed` sees no lock inode in `/proc/self/fd` (phase 3 leak check)
- non-git command keeps argv and sees `FGOS_LOCK_FD=main-checkout:3`; async borrow blocks `release()` with `lock-release-while-borrowed` until `child.borrowed` settles; released handle refuses `runBorrowed` (`lock-handle-released`)

`test/holder-lock/state-root.test.mjs` (phase 5)
- every vector of `state-root.vectors.v1.json` run in a child with exactly the vector's env: pinned vectors need no binary, the rest go through `fgos internal state-root`; Windows vector skipped off-platform
- pinned root read fresh per call, from `process.env` or an explicit `env`
- no pin and no binary -> `lock-driver-unavailable/no-host-binary`, never a guessed root

`test/holder-lock/driver-unavailable.test.mjs` (phase 6)
- (a) no `FGOS_HOST_BIN`, no activation above a temp cwd: `acquireSync`, `acquire`, `probe`, `resolveStateRoot` all throw `HolderLockError` `lock-driver-unavailable` with `reason: no-host-binary` and a non-empty `tried` list; no lock directory created
- (b) first writable NFS/SMB mount from `/proc/mounts` -> `unsupported-filesystem`, `guarantee.exclusion === 'none'`; with no such mount the test skips with the message "not measured here" (not simulated, as the phase requires)

`test/runner/herdr-spawn-adapter.test.mjs`
- `workerBaseEnv` strips `FGOS_LOCK_FD` and `FGOS_MAIN_LOCK_HOLDER_PID`, pins `FGOS_STATE_ROOT` to the parent's resolved root, not the inherited value

Skip rules: tests needing the route skip only when `resolveActiveHostBin` finds no binary at all. With an activated binary that predates the route they run and fail with `lock-driver-unavailable (host-version-mismatch)`; that is intended, the Lead runs them with `FGOS_HOST_BIN` pointing at the phase 02 build (`scripts/run-tests.mjs` `ensureHostBin` builds `cargo build -p fgos` from the checkout when the variable is unset).

## Test commands and observed results

Not run: sandbox. Every Bash invocation in this round was refused with "This command requires approval", including the allowed form `node --test test/holder-lock/lock-scope-order.test.mjs` and `rtk proxy node --test ...`; `git show`, `git status`, `ls`, `rg`, `node -e` were refused the same way. No pass count is claimed for anything.

Commands for the Lead (from the phase file):

```sh
env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<phase-02 build> node --test test/holder-lock/*.test.mjs
env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID node --test test/runner/herdr-spawn-adapter.test.mjs
node --test test/architecture.test.mjs
```

Round 1's result for the same commands is unknown (the round ended before a report was written).

## Blocking item outside my write scope

`test/architecture.test.mjs` ("đủ sổ") requires a row in `docs/architecture-manifest.json` for every `src/**/*.mjs`; that test is also this repo's `invariantChecks` command run at return. The six new files need rows, all `infra` (forced by `protocol.mjs` -> `src/config/global-config.mjs`, itself `infra`; `adapters.mjs` is `infra` too, so its import is same-layer):

```json
"src/holder-lock/index.mjs": "infra",
"src/holder-lock/registry.mjs": "infra",
"src/holder-lock/state-root.mjs": "infra",
"src/holder-lock/driver.mjs": "infra",
"src/holder-lock/protocol.mjs": "infra",
"src/holder-lock/lock-scope.mjs": "infra",
```

`docs/architecture-manifest.json` is not in this phase's file list, so it was not written; it is listed under `needsWrites` in the result claim. Until it lands, `test/architecture.test.mjs` is red on this branch.

## Deviations from the phase file

- `protocol.mjs` holds `readPredecessorKillWaitMs` (config read), which makes it `infra` rather than a pure wire-facts leaf. Moving the read to `index.mjs` would let `protocol.mjs`, `registry.mjs` and `lock-scope.mjs` sit in `domain`/`kernel`. Not changed this round: the phase file does not fix module contents, and the move only changes manifest rows.
- `workerBaseEnv` now throws `lock-driver-unavailable` when neither `FGOS_STATE_ROOT` is set nor a host with the state-root route is reachable. That is what pinning the parent's root means (r6 §6.9), but it is a behaviour change for the compatibility channel (`node bin/fgos.mjs` with an activated binary older than phase 02) until the integration binary is activated.
- Off-Linux leftover sweep in `runBorrowed` signals the child's process group (child spawned `detached`) because there is no `/proc`; `lockHolders` reports `unlistable` there. Matches `predecessor.v1.json` `runBorrowedWithoutDomain`; not measured on macOS in this round.
- No `ak:cook` skill was run: the sandbox refused every command, so the implement -> test -> review steps were done by hand (reading, one fix, this report).

## Open questions

1. Who adds the six manifest rows: the Lead on merge, or should the phase-03 file list be widened to include `docs/architecture-manifest.json`?
2. Should the route-needing tests probe the binary for the `internal` verb and skip with a named reason when the activated release predates phase 02, instead of failing? Today they fail loudly, which is the safer default for `npm test` on the integration branch.
