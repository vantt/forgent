---
id: p-aot44rcjaf
title: "`fgos events migrate --check` passes a workspace that the real migrate then fails half-way"
status: done
priority: P2
area: event-store
created: 2026-10-25
---

# Why

When a project's `.gitignore` ignores the fence file `.fgos/events` (mdview had `/.fgos/*` with only `!/.fgos/events.jsonl` re-included), the real run creates `refs/fgos/legacy` and then fails at staging with `literal-path-staging-failed`, whose stderr is printed as a byte array (`src/verbs/events/migrate.mjs`, `packages/git/rust/src/scoped_commit.rs`). An empty untracked `.fgos/events.jsonl` also blocks `--check` with `dirty or untracked migration path` (`packages/event-store/rust/src/legacy_import.rs:686`), although it holds no history. Found by SEAT cutting over mdview and mcp-skill-hub on design-lap (board log 2026-10-25 12:58); SEAT worked around both by hand.

# Done when

`--check` refuses by name when the fence path is git-ignored, before any ref is written; staging failures print git's stderr as text; an empty untracked legacy file counts as absent (parked, not refused); one Rust proof per case in `tests/legacy_import.rs` and one wiring proof

# Notes

Migrated from the legacy backlog table. Original status: done.
