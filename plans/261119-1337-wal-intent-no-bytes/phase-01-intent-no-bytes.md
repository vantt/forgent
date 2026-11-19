# Phase 1: Land and Sync intents record path + blob OID

## Context
`MAX_RECORD` is 64 KiB (`packages/git/rust/src/wal.rs:12`). `LandIntent.request` is a full `crate::LandRequest`
(`land.rs:21`) and `SyncIntent.files` is `Vec<crate::LandFile>` (`wal.rs:252`); `LandFile.bytes: Option<Vec<u8>>`
serializes as a JSON number array (~3.6x). A conflicted `mutation-census.v1.json` (264 KB) alone breaks a land.
Facts read: Land applies `req.files` from the caller's request (`land.rs:584`), Sync applies `files` from its caller
argument (`sync.rs:291`, `apply_declared_files`); no recovery path rewrites declared bytes from the WAL. The WAL bytes
are used only for identity: Sync id-reuse compares `payload.files == files` (`sync.rs:121`); Sync's compacted check
compares `canonical_digest(&(kind, writer))` (`sync.rs:98-111`, `175`); Land's request digest is
`canonical_digest(&(req, writer))` (`land.rs:377`). Compact reconstructions use `files: vec![]` (`land.rs:1198,1567`,
`sync.rs:635`).

## Prior art
`git log -S'bytes: Option<Vec<u8>>'`: 78429d1dd (dormant Land prepare/publish) put bytes in LandFile and the request
into the intent; 7d931a0a2 added Sync declarations with the same type. No earlier path/OID form existed; the bytes in
the WAL were never a recovery input, only an identity input. Reuse: `GitDriver::hash_object` (read-only, `driver.rs:4485`)
for blob OIDs; existing `canonical_digest`.

## Requirements
1. A WAL-side declared-file record `{path, blob: Option<String>}` (blob OID per Intent.objectFormat; `None` = absent),
   validated on read like other OIDs. `SyncIntent.files` and the Land intent's request carry it instead of bytes.
   `LandRequest`/`LandFile` stay the caller API unchanged.
2. Blob OIDs computed without writing objects (`hash_object`, or the same in-process blob hash if the driver is not in
   reach; one helper, used by both Land and Sync).
3. Request digests unchanged in value: Land keeps hashing `(req, writer)` with full bytes; Sync hashes the full-bytes
   kind form it hashes today, so compacted ids from older releases still match.
4. Sync id-reuse on a live chain compares path + blob OID.
5. An old-shape record (`bytes`) still deserializes and its chain inspects, recovers and compacts. Keep one reader
   type (e.g. accept legacy `bytes` and turn it into the OID at validation), not a second code path per caller.
6. Tests (extend owning files, no new files): Land with a >1 MiB declared file prepares+publishes and its intent file
   is < 64 KiB; Sync.prepare with a >1 MiB declared file, same-id retry same bytes continues, other bytes refused;
   an old-shape record fixture parses and compacts.
7. `docs/platform/git/spec.md`: one settled-fact line (intents carry path + blob OID; bytes never in the WAL) and a
   decision-history line citing the 2026-11-19 lead:OPC decision.
8. The caller API stays, so consumers (`packages/supervision/rust/src/land.rs`) change only if compile needs; the
   node-addon (`packages/git/node-addon/**`, S6A's footprint) must not need an edit.

## Validation
`cargo test -p fgos-git` (+ the supervision crate and node-addon build), `cargo clippy --workspace -- -D warnings`,
`cargo fmt --check`, `cargo check --target x86_64-pc-windows-msvc -p fgos-git` and `aarch64-apple-darwin`,
`node scripts/git-one-door-scan.mjs --root .` (0 undeclared; the census is S6A's file: if it needs regenerating, the lead does it at land time),
`node scripts/run-tests.mjs test/setup/git-mutation-census.test.mjs`.

## Risk / rollback
Digest drift → requirement 3 + test. Revert the landing commit before activation.
