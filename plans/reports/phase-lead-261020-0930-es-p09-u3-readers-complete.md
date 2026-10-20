# Event Store phase 09 / unit 3

Requirement 6 is complete for active Work readers. Node docs indexing and Rust WorkSource/LegacyFrictionSource use the Event Store; Rust shares one in-process adapter, preserves legacy cursor tokens, rejects incomplete/corrupt history, and accepts Work cache schema 5. The adapter has real imported-ref and v4 acknowledged-corruption proofs. No commits or lifecycle verbs.

Reused the crate's `legacy::parse_file`/`order` through a thin facade export for migration and rollback parity; frozen vectors remain the ordering oracle. Cache parity authenticates HEAD inventory bytes. Deleted `readAllEventsFromDir`, both replay filesystem rebuild paths, snapshot discovery and dead byte/tail readers. Replay now contains only reducer/fingerprint logic. Prior-art search found the old discovery reader in `69313c04d`; its removal is explicitly required by phase 09 §6/§9 and spec §19. Impact-analysis: inactive (zero providers).

Observe generation appends current Work types through the store and writes a derived `work-events.jsonl` golden snapshot outside `.fgos`. Retired `work.friction` migration records are preserved as a frozen **Observe** journal fixture, then native Observe writers add current records. Two actual generator runs were byte-identical. No store mocks or bypasses. One shared helper stages a real host/payload/addon descriptor for replay and related fixtures; it also supplies isolated real Git repositories and a writable native state root.

Script decisions: **deleted** `migrate-actor-to-role.mjs`, `migrate-status-proposed-to-awaiting-approval.mjs`, and `backfill-status-category.mjs`: each only rewrote the retired Work file layout. Their two dedicated test files were retired with that mechanism. No facade replacement is needed for historical in-place rewrites.

## Reader census

```sh
node --test --test-name-pattern='^Work reader census' test/event-store/work-readers.test.mjs
```

Result: **0 unclassified active Work event readers outside the facade; 1 test passed**. The test searches the phase patterns across `src`, `bin`, `scripts`, `packages`, and `apps`, strips comments, and excludes Rust test sections. Named allowed classes:

- Owning Event Store facade/crate and combined addon marshaling.
- Explicit migration/export inventories and frozen/test fixtures; metadata path labels.
- Independent workflow/coordination/assignment/Observe journals.
- Requirement 7's separate porting consumer, pending its own cutover.
- Requirement 9 removal families only: legacy append/repair/compaction/truncation, their two doctor checks, checkpoint, and Land/restore handling. These remain live until that unit; this report does not claim their deletion.

A second `rg -n 'readAllEventsFromDir|readEventsFromByte|readLastLineBefore' src bin scripts packages/work-state --glob '*.mjs' --glob '*.rs'` returns no matches. The census is classification evidence, not a claim that the later removal unit has landed.

## Validation

- `node --test test/event-store/*.test.mjs test/state/replay.test.mjs test/state/domain-registry.test.mjs test/architecture.test.mjs` — 208 passed, 0 failed, 5 existing PID-namespace migration-gate skips.
- `node --test test/event-store/work-readers.test.mjs test/event-store/export-legacy-parity.test.mjs test/state/backward-compat.test.mjs test/state/replay.test.mjs test/observe/observe-contracts-fixtures.test.mjs` — 103 passed, 0 failed (includes the added archived-shard inventory proof).
- `node --test test/event-store/work-readers.test.mjs test/state/work-size-rigor.test.mjs test/state/show-list-move-consistency.test.mjs test/report/enduser-index.test.mjs test/observe/observe-contracts-fixtures.test.mjs` — 36 passed, 0 failed. Unavailable docs-index history now refuses before altering an existing manifest.
- `node --test --test-name-pattern='^(discoverWriterFiles|findColdWriterFiles|mergeAndDedupeEvents|verifyCompactionCandidate)' test/state/events-compaction.test.mjs` — 9 passed.
- `FGOS_STATE_ROOT=/tmp/fgos-work/u3-state cargo test --locked -p fgos-work-state` — 8 passed; that state directory was created mode 0700.
- `FGOS_STATE_ROOT=/tmp/fgos-work/u3-state cargo test --locked -p fgos-work-state -p fgos-observe --test fixture_test` — Observe golden fixture passed.
- `FGOS_STATE_ROOT=/tmp/fgos-work/u3-state cargo clippy --locked -p fgos-work-state -p fgos-node-addon --all-targets -- -D warnings` — passed.
- `node --import ./test/helpers/work-store-release.mjs scripts/regenerate-observe-fixtures.mjs` — passed twice; SHA-256 inventories of every generated fixture matched across runs.
- `node --test test/event-store/migrate.test.mjs` — 9 passed after the final inventory-anchor cleanup.
- `git diff --check` and selective `rustfmt --check --edition 2021 --config skip_children=true` over the five formatted changed Rust modules pass. Workspace-wide fmt finds pre-existing unrelated differences (for example apps/fgctl); no unrelated formatting was changed. No full npm test.

**Retained red checks:** `node --test test/state/events-compaction.test.mjs` has 9 passes and 4 failures: both `compactColdWriterFiles` no-op cases, its archive case and its gate-red case. Their file-only fixtures enter the now-native Work gate and fail `event-store-no-repository`. They exercise the still-live requirement-9 compaction mechanism, so they were neither skipped nor retired here. The removal unit owns this family. The five real migration-gate skips require the host namespace gate before landing.

## Reader-test disposition

Each entry names the former case by its distinguishing feature in `test/state/replay.test.mjs`, except the final two compaction entries. RETIRED means its byte/file mechanism was deleted; RETARGETED identifies the replacement proof.

| Former case | Disposition |
| --- | --- |
| Single-file per-writer fallback/no sibling snapshot | RETIRED: single-file fast path |
| Single-file zero-read equals full fold | RETARGETED: real Work cache/full-fold parity |
| Single-file incremental append equals full fold | RETARGETED: native Work gate/cursor tests |
| Growing per-writer file forces exactly one read | RETIRED: byte-read-count mechanism |
| Single-file shrink invalidates snapshot | RETIRED: file snapshot |
| repairTruncatedLastLine preserves prefix | RETIRED: replay's file-repair integration |
| Resort/resequence fingerprint invalidation | RETIRED: file snapshot |
| Wholesale union-merge reorder invalidation | RETIRED: file snapshot |
| Missing snapshot fallback | RETARGETED: real Work stale-cache rebuild |
| Malformed snapshot fallback | RETIRED: deleted snapshot schema |
| Zero-read caller mutation isolation | RETARGETED: real Work cache isolation |
| Realistic multi-field snapshot round-trip determinism | RETARGETED: native consumer/full-fold parity |
| human-advisor handoff normalization | RETARGETED: pure reducer, same assertions |
| Baseline + shards, same-ts collision, repeated rebuild | RETARGETED: frozen facade vectors + migration parity |
| Hash identity dedupe across files | RETARGETED: frozen facade vectors |
| Raw legacy line identity dedupe | RETARGETED: frozen facade vectors |
| archive/ structural exclusion | RETARGETED: real HEAD inventory ignores archived malformed shard |
| Whole-repository legacy repeated rebuild | RETARGETED: migration's real tracked-history parity test |
| Multi-file exact-snapshot zero-read | RETIRED: T4 file snapshot |
| Multi-file append after snapshot | RETARGETED: native consumer cursor tests |
| New writer file invalidates snapshot | RETIRED: T4 discovery |
| Shrunk writer file invalidates snapshot | RETIRED: T4 discovery |
| Timestamp <= maxTs invalidates snapshot | RETIRED: T4 watermark |
| Snapshot maxTs across files | RETIRED: deleted snapshot builder |
| Absent baseline snapshot size/lastLine | RETIRED: deleted snapshot builder |
| Compaction archive + whole-directory before/after fold | RETARGETED: owning compaction merge/candidate bytes; all archive assertions retained |
| Compaction crash leaves duplicate baseline + originals | RETARGETED: frozen hash/raw dedupe vectors; archive inventory proof |

The basic historical fold, revision, serialization, default injection, Work-size and show/list/move consistency proofs are retained through pure folds or real facade reads. Export parity compares actual exported Work bytes decoded through the facade, while porting remains with its owner.

Convention lookup returned a 09:39 report path; the assignment explicitly requires this 09:30 path. The platform program-board row is outside write scope and was not edited. MDView preview failed with a read-only database.

Status: DONE_WITH_CONCERNS
Summary: All active Work history readers use the facade/crate, and the obsolete replay readers are deleted with their callers migrated. Focused Node/Rust and deterministic fixture proofs pass; retained compaction and host-only migration gates remain for their assigned units.
Concerns/Blockers: Four retained compaction checks remain red until requirement 9; five migration gates require the host namespace. Coordinator must update the out-of-scope program-board row.
Context refs:
- (none)
