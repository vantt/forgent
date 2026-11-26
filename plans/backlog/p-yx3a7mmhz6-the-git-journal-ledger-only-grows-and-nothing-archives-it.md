---
id: p-yx3a7mmhz6
title: "The Git journal's compaction ledger only grows and nothing archives it, so every machine reaches the scan bound sooner or later (git, priority high)"
status: proposed
priority: P1
area: git
created: 2026-11-26
---

# Why

On 2026-11-26 on fg-server, the compaction ledger (`fgos/git/compacted` in the repository's common directory) held 99,773 entries and 313 operation chains were retained, so one journal scan reached its bound of 100,000 entries, reported an incomplete scan, and every operation that needs a complete scan (worktree, event sync, repository config, event-store writes) refused with `git-wal-unreadable`. A plan lead could neither file an owner question nor read an owner's answer from another machine.

The ledger grew by about 2,800 entries a day from 2026-10-22; nothing removes or archives an entry. The bound was raised to one named constant of 1,000,000 (`WAL_SCAN_BOUND`), which only moves the wall by about a year and makes each scan slower as the ledger grows. fg-server2 and every other machine will reach the same wall.

# Done when

The owner decides how long ledger evidence stays in the scan path, and a door (a verb of the git component, not hand deletion) moves ledger entries older than that out of the scanned directory into an archive that keeps them readable, with the move recorded and reversible; a scan of a repository whose ledger is mostly archived is short; `fgos doctor` names the ledger size and the days left before the bound instead of failing only when the bound is reached. One test at the lowest layer proves the move keeps every entry readable and changes nothing a scan reports for retained chains.

# Notes

Decision needed from the owner: the retention period (for example 30 days in the scan path). Evidence: `fgos git status` (journal retention), the file counts of the ledger directory, `packages/git/rust/src/wal.rs` (`scan`, `WAL_SCAN_BOUND`, `LEDGER_WARN_ENTRIES`). Not caused by plan 261125-1631-agent-context-engine; recorded here because mess outside a plan's scope becomes its own item.
