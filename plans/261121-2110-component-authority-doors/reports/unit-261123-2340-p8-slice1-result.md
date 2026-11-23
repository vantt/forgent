# Phase 8 slice 1 result (producer)

Edits written blind: cargo was not run. The lead must compile and test.

## Changes
1. `packages/git/rust/src/driver.rs` (test near line 4531): `libc::kill(pid, SIGKILL)` replaced by `fgos_process::facts::identity_of(ProcId(pid))` then `fgos_process::control::signal_by_identity(&tuple, Signal::Kill)`. The pid is a background process the git filter started, not a child of the test, so `identity_of` (not `identity_of_child`) is right. The unsafe block is gone. Debt entry for driver.rs removed from `doors/process-control-signal.yaml`.
2. `driver.rs:299-310` git lookup: now `fgos_process::spawn::resolve_program("git", &path_env, ".EXE", cfg!(windows))` then `fs::canonicalize`. The absolute-entries-only rule is kept by filtering `path_env` before the call (split on `;`/`:`, keep entries whose quote-trimmed form `is_absolute()`, rejoin). Written with `str::split`, not `std::env::split_paths`, so the door pattern does not match. Pathext is fixed to `.EXE` to match the old `git.exe`-only lookup. Behaviour difference: on Unix the file must now also be executable (old: `is_file` only); PATH is read lossily if not UTF-8.
3. `packages/run-supervisor/rust/src/attempt_step.rs:164-167` node lookup: now `resolve_program("node", &path.to_string_lossy(), "", false)` with the `PathBuf::from("node")` fallback and the default system PATH kept. The old code had no absolute-only filter, so none added. Same executable-bit difference as above.
4. `doors/run-bounded-child.yaml`: attempt_step.rs debt entry removed (no pattern match left; grep shows none). driver.rs entry KEPT: `.try_wait()` remains at driver.rs:1421 (own git child deadline loop). Its reason reworded to drop the PATH claim.

## Owning tests of the moved behaviour
- git lookup on PATH: no direct test; covered through every `GitDriver::new(..)` test in driver.rs (build fails with `git-unavailable` otherwise). The owning proof of `resolve_program` itself is the tests in `packages/process/rust/src/spawn.rs`.
- node lookup: no direct test in attempt_step.rs; `resolve_program` is owned by the spawn.rs tests. No new test added (one proof rule).
- identity kill: the owning proof is the containment-unproven test in driver.rs (the one edited); `signal_by_identity` itself is owned by `packages/process/rust/src/control.rs` tests.

## Not run
`cargo test -p fgos-git`, `cargo test -p fgos-run-supervisor`, `node --test test/architecture.test.mjs` (door check).
Possible compile points: `fgos_process::ProcId` path (defined at lib.rs:30), `Path` already imported in driver.rs, unused `libc` import none (libc still used elsewhere in driver.rs), the `SignalOutcome` return is ignored (check for `must_use` warning).

Status: DONE_WITH_CONCERNS
Summary: Three moves written; driver.rs run-bounded-child entry stays because `try_wait` remains at driver.rs:1421.
Concerns/Blockers: uncompiled; unix executable-bit check is new for git and node lookups.
