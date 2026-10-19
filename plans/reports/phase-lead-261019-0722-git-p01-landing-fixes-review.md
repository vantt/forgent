# Git landing review fixes

2026-10-19, Asia/Saigon. Addressed M1–M4 and L1–L5 from `review-261019-0721-git-p01-landing-fixes.md`.

Mirror readers strip exactly one remote segment and ignore reserved legacy suffixes; a real-reader regression proves a valid event commit under `legacy/events/...` creates no phantom tip. Doctor reports reserved legacy mirrors with cleanup guidance. Specs reserve every nonempty `refs/fgos/legacy` suffix.

Doctor and setup detect and migrate obsolete exact mappings on historical origin alongside a configured custom remote, through the existing journaled `ensure_fetch_mapping` door. One exported obsolete-mapping helper owns that form, and policy consumers no longer use positional indexes. The setup registry declares `eventStore.remote: origin`; explicit choices remain intact. Obsolete-mapping diagnostics explain the fetch failure and registered fix.

Driver and repair canonicalize symlinked state roots. Existing-root chmod requires canonical basename `fgos` or the driver's existing regular floor-record marker; unrelated unsafe roots are refused. Hooks are opened without following symlinks before descriptor-based enumeration, ownership checks and chmod. Populated/unreadable hooks messages name the path and remedy. Tests cover these behaviors, including symlinked hooks and repair idempotence.

Reused RepositoryConfig's config.lock/WAL writer and the existing permission-repair door from `8573c8b34`; earlier foundations remain in `d8b339fd4`, `d1d4ec7ee`, and `dc6c91249`. No new dependency, bypass switch, hardcoded Cargo-target script, git add or commit. Impact-analysis: inactive (zero registered providers). Relevant specs, registry contract and Unreleased changelog are updated.

Validation, all exit 0:

- `cargo test --locked --no-fail-fast -p fgos-git -p fgos-event-store -p fgos-distribution -- --test-threads=1`: 301 passed, 0 failed, 2 ignored; `/tmp/fgos-review-cargo-final.log`.
- `cargo clippy --locked -p fgos-git -p fgos-event-store -p fgos-distribution -p fgos-node-addon --all-targets -- -D warnings`: `/tmp/fgos-review-clippy.log`.
- `node --test test/setup/*git*.test.mjs test/setup/checks.test.mjs test/setup/registrations*.test.mjs test/git/*.test.mjs test/architecture.test.mjs`: 211 passed, 0 failed, one Windows-only skip; `/tmp/fgos-review-node-final.log`.
- `git diff --check`: clean.

Status: DONE_WITH_CONCERNS
Summary: All review findings are fixed and the required Linux checks pass.
Concerns/Blockers: macOS/Windows were not exercised; MDView preview failed with a read-only database. The program-board lane update is outside the permitted write scope and is listed in needsWrites.
Context refs:
- (none)
