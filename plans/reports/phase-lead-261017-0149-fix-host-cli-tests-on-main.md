# Host CLI tests on main: 4 failures did not reproduce on a fresh build

Branch `fix/cli-tests-main` (base `a61f227bc`). No production or test code changed.

## Finding
- `cargo test -p fgos --test cli_tests` after a fresh build: 26 pass, 0 fail (incl. the 3 identity tests and `test_native_version_succeeds_with_envelope`).
- `session-identity.resolve` is in `packages/host-runtime/rust/src/catalog.rs` CATALOG (7 ops); `command-routes.json` verb count matches `data.verbs`.
- `cli_tests` falls back to `target/debug/fgos` when `CARGO_BIN_EXE_fgos` is unset at runtime. `target/` is a symlink to the shared main target dir. A binary built before the catalog/route changes yields exactly the reported symptoms (op not in catalog, 75 vs 76 verbs).
- Likely cause: stale shared binary. Not proven by reproducing the stale binary; the suspect `4b80ec2d8` is not at fault (green after rebuild with it present).

## Evidence (CARGO_BUILD_JOBS=4 for builds, `env -u CLAUDE_CODE_SESSION_ID`)
- `cargo test -p fgos`: exit 0, 17 + 26 pass.
- `node --test test/cli/unknown-flag-rejection.test.mjs`: 146 tests, 145 pass, 1 skipped, 0 fail.
- `node --test 'test/rust-host/**/*.test.mjs'` with `FGOS_HOST_BIN=<repo>/target/debug/fgos`, `--test-concurrency=1`: 138 tests, 137 pass, 1 skipped, 0 fail.
  - Without `FGOS_HOST_BIN`: 4 fail by design (assert says set it). With default concurrency under RAM pressure: R5 hit its 15s timeouts.
  - `node --test test/rust-host` (directory form) errors on Node 24: needs a glob.

## Concerns
- `cargo test` does not rebuild the bin when run for a test-only target in some invocations; a shared symlinked `target/` lets another worktree's build leave a stale `fgos`. Consider having `fgos_bin()` use `env!("CARGO_BIN_EXE_fgos")`, which cargo guarantees fresh. Not done: outside the brief.

## Unresolved
- Which stale binary produced the original failures is unknown.
