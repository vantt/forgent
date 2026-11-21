---
id: p-hzyvmj3zyf
title: A branch land with large files is refused `wal-record-too-large` (git, priority high for the S6a lane; seen 2026-11-19)
status: done
priority: P1
area: git
created: 2026-11-19
---

# Why

`fgos land s6/p06b` (about 1.1 MB of golden-vector JSON in 32 files) hit `MAX_RECORD` 64 KiB in `packages/git/rust/src/wal.rs` when the Land intent was written; recovered with `fgos git recover`, landed through land-branch.sh. Most S6a phases carry such vectors.

# Done when

The Land intent records paths or digests rather than file contents (or is chunked), so a land of any size writes its intent; decided by the Git reviewer (lead:OPC), proven by a land test with files over the record limit. Done: plan 261119-1337 (fix a02856095, tests cc63a3e14, in main 28b6a9b86); live with the next release.

# Notes

Migrated from the legacy backlog table. Original status: done.
