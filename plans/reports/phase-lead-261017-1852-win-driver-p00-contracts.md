# Phase report: Windows driver P00, contracts and dependencies

Status: DONE. Integration head: see done file (merge of `win-driver/p00-contracts`).

## Changed
- `holder-lock.port.v1.json`: Windows guarantee row (`lockfileex`/kernel/job-scoped/holders unsupported, unlistable), remote-volume rule (`exclusion: none`), Windows file/unlock rules, `FGOS_LOCK_JOB` env, borrower check (4 conditions, 5 `NotBorrowerReason` names), errors `lock-release-stuck` and `borrow-busy`, helper roles + `HelperExe`.
- `predecessor.v1.json`: `windows-job.domainId` object shape, job view, contender view (3 cases, cross-session, fail closed, 2 quiet snapshots), keeper exit rule; `v` stays 1.
- `internal-route.lock-fd.v1.json`: `--probe`, `--predecessor-state`, Windows `--borrowed-check`, new reasons, `predecessor` result.
- New `internal-route.lock-hold.v1.json`.
- `internal-route.lock-borrow-vectors.v1.json`: per-platform assertions.
- `windows-sys =0.61.2` in `[workspace.dependencies]` with the 8 features; `cfg(windows)` dep in holder-lock and process crates.
- 7 new contract tests in `test/holder-lock/registry-contract.test.mjs`.

## Decisions
- D3 confirmed (amendment block in 6.2 phase-02 is on main): kept as is, nothing to delete.
- `predecessor-other-session` stays an internal contender-view reason; it surfaces as `predecessor-domain-not-empty`.
- `--predecessor-state` exits 0 for every state (read-only report).

## Evidence
- `node --test test/holder-lock/registry-contract.test.mjs`: 21 pass, 0 fail (phase and integration worktrees).
- `node --test` with `main-checkout-borrow-contract`, `driver-unavailable`, `registry-contract`: 25 pass, 0 fail, 1 skipped.
- `cargo test --offline -p fgos-holder-lock -p fgos-process`: all result lines ok, 0 failed.
- `cargo check -p fgos-process -p fgos-holder-lock --target x86_64-pc-windows-msvc`: green.
- Sonnet review: no blocking findings; two low findings fixed.
- GitNexus impact: no code symbols edited (contracts, Cargo, test only).

## Follow-ups for later phases
- `predecessor.rs` still parses a string `windows-job` domainId, and Rust `NotBorrowerReason` has only 4 POSIX variants: P02 and P04 must change both with their tests.

## Unresolved
None.
