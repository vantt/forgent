# Git phase 01 landing fixes

2026-10-19, Asia/Saigon. Both landing defects are fixed without changing a platform law or component boundary.

Git RepositoryConfig now owns the canonical mirror mappings. Event Store, Publication and Node setup/doctor consume that policy through the existing crate/addon door. The legacy wildcard tolerates an absent remote ref and preserves the exact legacy mirror when present. The existing journaled config writer removes only the obsolete exact mapping, including when both forms exist; user config and push settings are preserved. Setup/doctor honor the effective `eventStore.remote` rather than hard-coding origin.

The registered `git-driver-directories` fix creates the designated state root safely and tightens existing current-user-owned root/hooks directories. Repairs use a no-follow directory descriptor, preserve parent permissions, reject foreign ownership/symlinks and populated hooks, and run before WAL/refspec setup. Driver-created hooks/probe directories use explicit safe modes. Doctor reports the directory, mode/owner, cause and registered fix.

Prior art: reused RepositoryConfig's native config.lock/WAL machinery introduced in `d8b339fd4`/`d1d4ec7ee`, and the driver trust checks from `dc6c91249`. Those mechanisms were not removed; the missing pieces were optional-source refspec policy, migration and setup permission repair. Impact-analysis: inactive (zero registered providers). Relevant specs, setup registry contract and Unreleased changelog are updated.

Validation on Linux, Git 2.53.0:

- `cargo test --locked --no-fail-fast -p fgos-git -p fgos-event-store -p fgos-distribution -- --test-threads=1`: exit 0; 299 passed, 0 failed, 2 ignored. Includes ordinary fetch/pull against an initially ref-free bare remote, legacy mirroring, exact/both-form migration, provenance and Event Store sync.
- `cargo clippy --locked -p fgos-git -p fgos-event-store -p fgos-distribution -p fgos-node-addon --all-targets -- -D warnings`: exit 0.
- `node --test test/setup/*git*.test.mjs test/setup/checks.test.mjs test/git/*.test.mjs test/architecture.test.mjs`: 153 passed, 0 failed, one Windows-only skip. Includes a real umask-002 child, read-only diagnosis, setup repair/idempotence, symlink refusal and configured-remote migration.
- `git diff --check`: clean. Final logs: `/tmp/fgos-p01-final-{cargo,clippy,node}.log`. Earlier overlapping builds invalidated two self-respawning crash-test executables; the final complete Rust invocation above passed.

Limits: macOS/Windows execution and installed-release activation were not exercised. MDView preview failed because its database is read-only. The program-board lane update is outside the assignment's write scope and is listed in the result's `needsWrites`. No repository add/commit or CARGO_TARGET_DIR-hardcoding script was introduced.

Status: DONE_WITH_CONCERNS
Summary: Both Git landing defects are repaired and all requested Linux checks pass.
Concerns/Blockers: Preview unavailable; program-board update requires a separately scoped write.
Context refs:
- (none)
