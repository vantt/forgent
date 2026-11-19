---
contract: plan-v1
title: "Land and Sync intents record declared files as path + blob OID, never bytes (backlog p-hzyvmj3zyf)"
status: running
lead: lead:WAL-INTENT
priority: P1
blockedBy: []
footprint:
  - plans/261119-1337-wal-intent-no-bytes/**
  - packages/git/rust/src/wal.rs
  - packages/git/rust/src/land.rs
  - packages/git/rust/src/sync.rs
  - packages/git/rust/src/lib.rs
  - packages/git/rust/tests/land.rs
  - packages/git/rust/tests/scoped_commit_sync.rs
  - packages/supervision/rust/src/land.rs
  - docs/platform/git/spec.md
base: 0bd0f572a8e62f6f1d7343f4052b945552b5f594
source:
  - plans/261017-1313-fgos-platform-program-board/log.md
  - docs/backlog.md
created: 2026-11-19
---

# Land and Sync intents without declared bytes

## Outcome
`fgos land` and Sync.prepare write their WAL intent whatever the size of the consumer-declared files. The intent
records each declared file as `{path, blob OID of its bytes | absent}`; the bytes live only in the caller's request and
the candidate tree. Decision by lead:OPC (Git owner), board line 2026-11-19 13:37.

## Acceptance criteria
- A Land with a declared file over 1 MiB prepares and publishes; its intent record is under 64 KiB (`packages/git/rust/tests/land.rs`).
- A Sync.prepare with a declared file over 1 MiB commits; same-id retry with the same bytes continues, with other bytes is `operation-id-reused` (`packages/git/rust/tests/scoped_commit_sync.rs`).
- The Land request digest still hashes the full bytes; a compacted Sync id from before the change still matches its retry (digest computed from the full-bytes form).
- An old-shape intent record (files with `bytes`) still parses and its chain still recovers/compacts.
- `cargo test -p fgos-git`, consumers (`fgos-supervision`, git node-addon), clippy -D warnings, fmt, msvc and aarch64-apple-darwin checks, one-door scan 0 undeclared, census test green.

## Non-goals
Chunking or raising MAX_RECORD; changing LandRequest/LandFile as the caller-facing API; any other intent kind.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Intent records path + blob OID](phase-01-intent-no-bytes.md) | - | packages/git/rust/src/{wal,land,sync,lib}.rs, packages/git/rust/tests/{land,scoped_commit_sync}.rs, packages/supervision/rust/src/land.rs, docs/platform/git/spec.md | 1 | running |

## Owner questions
None (decided by lead:OPC).

## Shared files
`packages/git/contracts/mutation-census.v1.json` and `packages/git/node-addon/**` belong to plan 261118-1341 (S6A).
The caller API (`LandRequest`/`LandFile`) is unchanged, so the node-addon needs no edit; if the one-door census must be
regenerated it is done at land time on top of main, coordinated with lead:S6A.

## Risks and rollback
Digest drift would make in-flight or compacted ids read as `operation-id-reused`: guarded by the compat acceptance rows.
Rollback: revert the single landing commit; old records stay readable by the old reader only if no new-shape record was
written, so revert before activation or settle chains (`fgos git recover`) first.
