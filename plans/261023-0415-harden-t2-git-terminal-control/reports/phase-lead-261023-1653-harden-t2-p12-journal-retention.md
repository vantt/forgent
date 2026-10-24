# HARDEN T2 phase 12 report: retained-chain count and oldest age in `git-operation-journal`

Branch `harden/t2-p12-journal-retention` from `fd734fa2b`. Status: DONE (OPC review of the addon diff still owed).

## What changed
- `packages/git/rust/src/wal.rs` `Backlog`: two fields, `retained_terminal` (finished chains still on disk) and `oldest_retained` (oldest directory mtime among them). A compacted leftover has no mtime, so it never counts. Existing `retained_bytes`, `ledger_entries`, `ledger_capacity_warning` are reused, not duplicated.
- `packages/git/node-addon/src/git.rs` `inspect_git`: journal object adds `retainedChains`, `oldestRetainedAtMs` (number), `ledgerEntries`, `ledgerCapacityWarning`; the not-initialized object carries the same keys.
- `src/setup/git-retention-note.mjs` (new, 9 lines, pure): the sentence. `src/setup/git-checks.mjs` 167 -> 169 lines (within 172).
- `docs/platform/git/spec.md` journal row (section 14 table) and the journal facts paragraph; `CHANGELOG.md` one line; `docs/architecture-manifest.json` one row for the new file.

## Decisions
- Threshold: the phase file says `warning:`, so past 64 retained chains, an oldest older than 7 days, or the ledger capacity warning the row passes with a `warning:` sentence (never a failure). Below that it adds an `info:` line with the same facts. Constants `retentionLimits = {chains: 64, days: 7}` in the new module; no config key.
- New module instead of growing `git-checks.mjs` past its ceiling: it is a pure formatter, so its limits are unit-testable without a repository.
- The warning's next step says Worktree and Refs chains are not compacted yet, so the person reports the row; it does not promise a compaction that does not exist. No backlog id in the message.
- Oldest age was not derivable from existing fields (`oldest_unresolved` covers only unresolved chains), hence the one extra field.
- A directory with no intent file counts as a finished chain (the scan already calls it terminal); it is retained bytes either way.

## Tests (design principle 8)
- Rust owner: `wal::tests::scan_counts_only_finished_chains_still_on_disk` (compacted + finished + pending chains; only the finished one counts, oldest equals its mtime). No existing case covered the retained count.
- Node: `the journal row warns when finished operations keep piling up and only informs below the line` (limits, boundary 64/7.0 stays info, age unknown, ledger warning), and one wiring proof on a real journal (`...reports the retained finished operations of a real journal...`). Both extend `test/setup/git-checks.test.mjs`. No tests retired; 1 Rust + 2 Node added; no new host spawns.

## Results
- `cargo test --no-fail-fast -p fgos-git --lib`: 73 passed, 0 failed.
- `-p fgos-git --test land --test land_crash_matrix --test recovery_matrix --test publication --test worktree --test inspect`: all `test result: ok` (7, 18, 15, 34, and the single-case targets).
- `cargo test -p fgos-node-addon`: ok. `cargo clippy -p fgos-git -p fgos-node-addon --all-targets -- -D warnings`: clean.
- Node one-file (git-checks, checks, native-load): 81 tests, 80 pass, 1 skipped (win32), 0 fail. `test/architecture.test.mjs`: 31/31 after the manifest row.
- Census: regenerated (commit "regenerate the mutation census after the journal scan edit"); 5 unresolved-binary sites, unchanged set.
- Note: `cargo fmt -p fgos-git` reformats about 30 files because the crate is not rustfmt-clean; I reverted that and hand-formatted only my lines.

## Example on this checkout (main repo journal, read-only)
message: `warning: 356 finished Git operation(s) retained (2384 KiB, oldest 4.4 days), past 64 operations or 7 days; Worktree and Refs chains are not compacted yet, so report this row to schedule it`
detail.journal: `{"initialized":true,"complete":true,"pendingCount":0,"retainedBytes":2441023,"retainedChains":356,"oldestRetainedAtMs":1792367730544,"ledgerEntries":28,"ledgerBytes":8261,"ledgerCapacityWarning":false,"oldestUnresolved":null}`

Note: the chain count on this machine will make the row warn from now on; that is the intended signal.

## Unresolved
- OPC review of `wal.rs` and `git.rs` before merge.
- The convention tool names reports under `plans/reports/`; I used the track's `reports/` directory as briefed.
