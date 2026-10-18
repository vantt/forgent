# Phase p05: launcher half of identity

Status: DONE_WITH_CONCERNS

## Landed
- `fgos-session-identity`: `mint_attempt_writer_id` (`att-<attemptId>`, contract + shared vectors), `launcher::scrub_and_set(env, writerId, parent)`, route `fgos internal identity mint-attempt --attempt <id> --protocol 1` (prints `{"writerId":...}`; exit 65 `invalid-attempt-id`, 3 version, 2 usage). Wired in `apps/fgos/src/main.rs`.
- The reference mint copy in the Rust vector test is gone; `tests/attempt_writer_id.rs` runs the real function over the shared vectors and asserts the contract's scrub list equals `SCRUBBED`.
- Node: `mintAttemptWriterId` in `src/util/session-identity.mjs` (the 5.1 facade; calls the route, refuses under a held state lock, caches). `workerBaseEnv` drops `FGOS_SESSION_ID`, `CLAUDE_CODE_SESSION_ID`, `CODEX_THREAD_ID`.
- `docs/platform/session-identity/spec.md` §5a. Contract `environment.scrubbed` now lists `FGOS_PARENT_WRITER_ID` too.

## Tests
- `cargo test -p fgos-session-identity`: 13 pass (3 unit, 6 attempt_writer_id, 4 golden).
- With `FGOS_HOST_BIN` = private build: `test/architecture.test.mjs`, `test/runner/herdr-spawn-adapter.test.mjs`, `test/runner/provider-adapter.test.mjs`, `test/util/session-identity.test.mjs`, `test/holder-lock/driver-unavailable.test.mjs`, `test/state/identity-before-lock.test.mjs`, `test/session-identity/*.test.mjs`: 185 tests, 182 pass, 0 fail, 3 skipped (pre-existing). Run again after the review fixes on the identity + architecture files: 31 pass.
- Independent Sonnet review: no blockers; fixed contract scrub list and NUL-in-id error type.

## For later phases (exact lines still setting/relying on `FGOS_SESSION_ID`)
- `src/runner/dispatch/transport.mjs:396` (sets dispatcher id) — P06 removes.
- `src/runner/dispatch/transport.mjs:723` (herdr path `fullEnv`, relied on the inherited id) — P06.
- `src/runner/dispatch/confinement/authority.mjs:1419-1422` (`workerBaseEnv()` + `FGOS_SESSION_ID: writerId`) — P07 removes the line; envelope `identity` from the mint route replaces it.
- Interim: until P06/P07, herdr (723) and confinement paths give the worker no session id and it resolves by process tree.

## Notes
- Delegation claim: no delegation writer exists in `src/` (grep), so "no caller"; nothing created.
- `impact` on `workerBaseEnv`: GitNexus index stale, cross-checked by grep: callers `transport.mjs` x2, `authority.mjs`, tests `herdr-spawn-adapter`, `holder-lock/driver-unavailable`. Risk MEDIUM, interim window above.
- Codex needs `-c shell_environment_policy.set={FGOS_SESSION_ID=...}` (P01); recorded in spec §5a.
- No new `src/**/*.mjs` file, so no manifest row. Windows/macOS CI push not requested: Rust crate is platform-neutral, route is plain stdout.
