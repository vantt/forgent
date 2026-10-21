# Phase lead report: HARDEN T0 phase 3, process sites onto the door

Branch `harden/t0-p03-process-sites` (base `b6896d7a3`). One code commit `205f8a584`, plus this report. Not pushed, not merged. Cargo target on ext4 (`/home/vantt/projects/forgent-worktrees/harden-t0-p03-target`).

## Sites (file | after | policy | owning proof)

- `src/runner/gateway-control.mjs`. Registry entry carries `record` (the full tuple from `observe(child.pid)` right after spawn; an absent or zombie child reads as the existing "exited immediately" failure, an unreadable one is `gateway-start-identity-unreadable`). `startGateway` refuses on `judge(entry.record ?? entry)`: `alive` as before, `unknown` as `gateway-start-identity-unknown` (names the registry file to delete). `stopGateway`: `dead` clears, `unknown` throws `gateway-stop-identity-unknown` and signals nothing, `alive` goes `signalByIdentity` term, wait, kill, wait; `unsupported` on term escalates to kill, `identity-mismatch`/`not-found` re-judge, `denied`/`failed` throw. Only a `dead` verdict clears the registry; `unknown` after the signal throws `gateway-stop-unresolved`, `alive` after kill throws `gateway-stop-failed`. `gatewayStatus` reports `running: null, staleRegistry: false, identity: 'unknown'`. P2. Proof: `test/runner/gateway-control.test.mjs` (20 pass): the three phase-1 cases, the escalation case with a full record, a reused-pid case (cleared, no signal), a status `unknown` case, a start `unknown` refusal case. The test's own `isAlive` now asks the door (a zombie awaiting its reaper is dead there).
- (superseded by the follow-up below for the launcher part) `src/runner/dispatch/stop-processes-inside.mjs`. `processesInside` returns `scan` views filtered in Node (exe/cwd inside, minus `process.pid`/`ppid`); `stopProcessesInside` signals `view.tuple` with `signalByIdentity` (term, `graceMs`, kill, `graceMs`) and returns `{found, stopped, left}`. `left` holds views still alive or without a tuple. Callers refuse over a non-empty `left`: `confinement/cleanup.mjs` throws `confinement-dir-in-use` (the existing `removal-failed` outcome carries it), `worker-home.mjs` throws `WorkerHomeError('worker-home-in-use')`. `scripts/run-rust-dev-host.mjs` gets exported `stageLauncherDoor()` (existing `ensureGitAddon(process.env, checkoutRoot)`), called before `pruneRunDirs`. P2. Proof: `test/runner/stop-processes-inside.test.mjs`, `test/scripts/run-rust-dev-host-staging.test.mjs` (new case: the launcher's scan works with no `FGOS_*` variables and no run directory).
- `src/runner/lock-fence.mjs`. `startTimeOf`/`cmdlineOf`/`identityOf`/local `signalByIdentity` deleted. `fenceLock` observes each listed pid between two `lockHolders` listings and keeps pids in both; an unreadable or zombie observation refuses `lock-fence-identity-unknown`. One `terminateHolders` (term, wait, kill, wait) serves both paths: outcomes `'sent'` only count, `unsupported` on term escalates at once, `denied`/`failed` throw `lock-fence-signal-refused`. `fenceHotRecord` uses `seen.record` as the tuple and polls `judge(record)`. `bin/fgos.mjs` `confirmFence` prompt drops the command line (no test asserted it). Proof: `test/cli/fgos-lock-fence.test.mjs` (11 pass). RT-M3 through the production path: the existing "died between judge and signal" case now also asserts `terminated`/`killed` are empty (the door sent nothing); new case "record whose holder is already dead" returns at once, asks nothing, signals nothing.
- `src/runner/session.mjs`: `resolveHolderLiveness(entry.record ?? {pid}) === 'dead'`; new entries carry `record: selfRecord()`. P1. Proof: `session.test.mjs` (fixtures that mark a pid dead now rewrite `record` too; `:483` case extended with a pid-only live entry that is kept).
- `provider-credential-renewal.mjs` `stagingWriterAlive` is `resolveHolderLiveness({pid}) !== 'dead'`. Proof: new zombie-writer case in `provider-credential-renewal.test.mjs`.
- `provider-capacity.mjs`: lease gains `record: selfRecord()` (keeps `pid`, `processStartTime`); reclaim judges `lease.record ?? {pid, processStartTime}`. Proof: `provider-capacity.test.mjs` unchanged expectations.
- `cancel-registry.mjs`: `selfTuple = selfRecord` (pidNs `pid:[N]`/`none`). `direct-launch.mjs`: `bootId: selfRecord().bootId ?? 'unknown-boot'`. Proof: `cancel-registry.test.mjs`, `direct-cutover.test.mjs`.
- `run-lock.mjs`: `isProcessAlive` is `observe(pid).kind !== 'absent'` (kept for `assignment-runner.mjs`, SEAT); `buildRunControlHolder` spreads `selfRecord()` plus `processStartTime`; `resolveHolderLiveness` is a re-export of the client's. `os` import dropped (`selfRecord().host` equals `os.hostname()`, checked). Proof: `run-lock-identity.test.mjs`.
- `registrations.mjs` (3 lines + 1 import): `Number.isInteger(pid) && pid > 0 && resolveHolderLiveness({pid}) !== 'dead'` (kept the integer guard so a non-pid marker is still an orphan, as before). Proof: `confinement-doctor-checks.test.mjs`.
- `hot-lock.mjs` (T0 range only): `judgeHotRecord(record)` is `judge(record)`; `observeViaHost`, `liveReadings`, `hotObserver`, `HOST_OBSERVE_TTL_MS`, `hostStartTimeOfSelf` deleted; `recordOfSelf` builds `{v, pid, startTime?, bootId?, pidNs?}` from the door's `selfRecord`, the local cache renamed `cachedRecord`; reclaim and wait loop call `judgeHotRecord(record)`. Callers `lock-fence.mjs`, `lock-record-checks.mjs` dropped the extra args. Proof: new `judgeHotRecord` case in `hot-lock-multiprocess.test.mjs`.
- `driver.mjs` `runProcessObserveRoute` and the `index.mjs` import/export deleted.
- `hold-transport.mjs`: `helperAlive` is `!reaped(child) && observe(pid).kind === 'live'`; sweep uses `resolveHolderLiveness({pid: ownerPid}) !== 'dead'`; `pidAlive` deleted. `fences.mjs` `isPidAlive` one line (keeps the integer guard). Proof: `windows-facade.test.mjs` and the holder-lock suite (see below).
- `process-identity.mjs`: six forwarders deleted; 27 lines, 6 exports. All test importers moved to `selfRecord`/`observe`.
- `dispatch-reconciliation-import-graph.test.mjs`: `SIGNAL_ZERO_PROBE` removed; the fixture now asserts signal-0 is caught.
- `test/process/one-door.test.mjs` allowlist: `process-identity.mjs` removed from both lists; `registrations.mjs` added to both (the claim probes the plan leaves in place), matching the plan's grep list.
- Census regenerated (`node scripts/git-one-door-scan.mjs --write-census`: 0 undeclared); `CHANGELOG.md` line; `docs/platform/holder-lock/spec.md` (§15 hot-lock sentence) and `docs/specs/reading-map.md` updated: Node no longer reads the process-observe route.

## Red tests, what I saw

Command shape: `node <scratchpad>/run.mjs <files>` = `ensureGitAddon(env, cwd)` then `node --test <files>`.
- `gateway-control.test.mjs`: 20 pass, 0 fail (cases at the old :255, :281, :321 included).
- `stop-processes-inside.test.mjs`: pass. `cancel-registry.test.mjs`: pass. `test/process/one-door.test.mjs`: 3 pass.
- 23-file focused batch (phase verification groups plus architecture, git one-door, e3-census, native-load, process vectors): 308 tests, 299 pass, 0 fail, rest skipped.
- Broader batch of 108 files that mention a touched module: 1978 tests, 1952 pass, 8 fail, 18 skipped. All 8 are environmental: 4 `fences-rust-locks`/`fences-v1` cases need a release `fgctl`, 4 `test/rust-host/release-tree.test.mjs` cases need `cargo build --release` (`Compiled native addon not found ... release/libfgos_node_addon.so`). Not run on the base.
- `npm run fgos:dev -- doctor --help` (env without `FGOS_HOST_BIN`, no dev-host directory beforehand) ran through the launcher and exited normally.
- Greps: `rg "process\.kill\(" src bin` leaves only `transport.mjs`, `provider-credential-probe.mjs`, `holder-lock/index.mjs:452`, `registrations.mjs:6020,6062,6115`; `rg "/proc/" src bin` leaves only the planned files; `runProcessObserveRoute|observeViaHost|HOST_OBSERVE_TTL_MS` has no match in `src test scripts`.

## Retired tests and new owners

- `test/state/hot-lock-host-judge.test.mjs` deleted here, not in the next phase (the plan said later): it imports `observeViaHost`/`hotObserver`, which no longer exist, so leaving it would be a red import. Its two behaviours moved into `hot-lock-multiprocess.test.mjs` (`judgeHotRecord` case, via the door); the route's own refusal case is owned by `apps/fgos/tests/internal_lock_routes.rs:472`; the Windows cache/host-run cases test deleted code.
- `SIGNAL_ZERO_PROBE` exemption: behaviour removed.

## Test edits beyond the plan

- `test/state/hot-lock-known-exec-sites.test.mjs` builds a tree from an old commit; the door refuses a payload it is not part of, so the tree's `process-identity.mjs` is a one-line re-export of this checkout's client.
- `stop-processes-inside.test.mjs`: the phase-1 assertion `mine.startTime` became `mine.tuple.startTime` (the view is `{pid, tuple, ...}`, as the plan's own shape says); the return value is now an object.

## Δ lines (`git diff --numstat b6896d7a3 HEAD`, code commit only)

Node (src, bin, scripts): +246 / -302 = -56. Rust: 0. Tests: +234 / -161 = +73. Docs, changelog, census: +54 / -60.

## Not done / concerns

- `hot-lock.mjs:310` still calls `recordOfSelf(writer, fgosDir)` (outside the T0 range, WORK's region); the extra argument is ignored. WORK should drop it.
- No case for "a view without a readable identity is left and reported" and none that a non-empty `left` blocks `worker-home`/`cleanup` removal: neither can be produced from a test (an unreadable `/proc/<pid>/stat` or a process surviving SIGKILL); the code path is two lines each.
- `provider-credential-renewal` zombie case failed once (fixture timed out waiting for the zombie) in one run, then passed in 10 later runs (6 targeted, 3 whole-file); cause not found.
- Not posted on the board: SEAT (`registrations.mjs`, 3 lines + 1 import) and WORK (`hot-lock.mjs` lines above) notices. Full `npm test`, `cargo test --workspace`, GitNexus `impact`/`detect_changes` not run.
- `provider-capacity.mjs:567` comment still names `pidExists`.

## Follow-up: regressions found by the big lead's verification

1. `test/rust-host/dev-host.test.mjs` (5 failures, `ENOENT .../checkout/Cargo.toml`) and 2. `test/distribution/native-addon.test.mjs:144`. Root cause: my launcher called `ensureGitAddon`, which runs cargo and reads `Cargo.toml` and the workspace sources; the dev door's fixture checkout has neither. Fix in `scripts/run-rust-dev-host.mjs`: `stageLauncherDoor(targetDir)` builds nothing; it copies the host and addon cargo just built (already selected by `main`) into the persistent `gitAddonDirectory(checkoutRoot)` (bytes rewritten only when they differ, through the launcher's own `atomicWrite` and `assertLocalPath`), writes the manifest with the existing `devHostManifest`, and points the launcher's environment at it, before `pruneRunDirs`. The persistent copy (not the per-run one) is used so the launcher can still delete its run directory while the addon is loaded (Windows). `native-addon.test.mjs` copies a fixed script list into its fixture; `scripts/lib/git-addon-stage.mjs` (the launcher's new import) was added to it. Seen: `dev-host.test.mjs`, `native-addon.test.mjs`, `run-rust-dev-host-staging.test.mjs`: 20 pass, 0 fail.
3. `cargo test -p fgos-event-store --test three_clones`: not caused by this branch. The branch has no Rust or Cargo change against the base (`git diff b6896d7a3 HEAD -- '*.rs' Cargo.toml Cargo.lock` is empty), and the test runs the Rust git driver only (no Node). It is flaky with different panic sites (`three_clones.rs:27`, `sync_support/mod.rs:185`, `git-command-failed`, `path-read-failed`): 2 failures in 11 runs on this branch, 2 in 12 runs on a detached worktree of `b6896d7a3` (same target dir, load average about 10). I did not find the underlying race; it is for the Git/event-store lane.
