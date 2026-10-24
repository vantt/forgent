# Work cutover: ScopedCommit grant record bound (2026-10-24)

## Cause and measurements

`Wal::begin` installs record 0 (the whole `ScopedCommitIntent`) with a 64 KiB bound. The intent held the
same data several times and the whole preflight dirty list:

| field (escaped JSON size) | 97 paths, 0 dirty | 97 paths, 100 dirty | 1000 paths, 0 dirty |
|---|---|---|---|
| `paths` (selected + fence) | 7.6 KB | 7.6 KB | 78 KB |
| `request` string (writes + cutoverGrant.exactPaths + message) | 7.9 KB | 7.9 KB | 78 KB |
| `cutoverGrant.exactPaths` | 7.7 KB | 7.7 KB | 78 KB |
| `baseline` string (`dirty` = path + sha256 per entry, ~150 B each) | 0.2 KB | 14 KB | 0.2 KB |
| record total (estimate, node model of the serde shape) | ~24 KB | ~39 KB | ~238 KB |

Paths are tripled (paths, request, grant), so paths alone cross 64 KiB at about 270 shards. Dirt costs ~160 B
per dirty entry, so ~400 dirty entries alone cross it. The real run: the main checkout currently reports
1792 dirty entries (`git status --porcelain -uall`, read-only) -> ~290 KB baseline alone, which is what tripped
the bound at 97 paths. Rehearsal (`--check`) never reached ScopedCommit; the existing grant test uses 2 paths.

## Design (Git crate is reviewed by OPC: summary below)

The record is bounded by construction; MAX_RECORD is unchanged (raising it would only move the cliff).
Everything recovery needs is kept, bound by digest:

- `ScopedCommitIntent.paths`: `PathSet` = `Listed(Vec<String>)` (historical records, empty no-op) or
  `Digest{count, sha256}` (new; sha256 = canonical digest of the sorted, de-duplicated list). Recovery only
  ever compared this list with the live staged set / the commit's changed paths and then reset the staged
  set; it now calls `paths.matches(&actual)` and resets the matched `actual` set. Order-insensitive.
- `ScopedCommitIntent.cutover_grant`: `CutoverGrantRecord` with `exact_paths: PathSet`; the pre-commit hook
  check (`grant.rs`) compares the staged deletions with `matches` (digest).
- `ScopedCommitIntent.baseline`: now `{head, reference, worktree, authority, dirtyDigest}`. Recovery reads
  only head/reference (`StoredBaseline`, ignores the rest, so full historical baselines still parse).
- `ScopedCommitIntent.request`: now `{message, digest}` (recovery reads only `message`, already a tolerant
  view). Operation-id reuse accepts the bounded form or the full legacy serialization
  (`is_recorded_as`). Intent `request_digest` (the binding) is unchanged.
- Historical records read unchanged (serde untagged `PathSet`; legacy strings accepted). The existing
  `interrupted()` fixture still writes a legacy-shaped record and drives recovery over it.
- `WalError::RecordTooLarge` (cause `wal-record-too-large`, `Refused`): `Wal::begin` now builds record 0 and
  checks the bound BEFORE creating the operation directory, so an oversized intent leaves nothing behind.
  Only `begin` raises it (so it always means "nothing recorded"); later-record installs keep
  `corrupt("record byte bound")`. A commit message up to its 1 MiB limit can still exceed the bound; that is
  now a typed pre-attempt refusal that Git already rolls back (unstage + restore of producer bytes).
- `Wal::known_id` made `pub` (false for an intent-less directory, same rule `scan` uses).
- event-store `cutover_operation_id`: uses `known_id`; an intent-less directory (or a free id) is reused, no
  manual deletion. Begin already tolerates an existing empty directory.
- `migrate.mjs` `cutoverFailure`: `wal-record-too-large` joins the pre-attempt set, so the files, fence and
  `.gitattributes` are restored. A pre-migrate bound check is unnecessary: the only unbounded input left is
  the constant plan message.
- Schema `wal-record.v1.schema.json`: `paths` and `cutoverGrant.exactPaths` become array | digest object.
- Recovery unstage: the two branches that guard on "staged set == recorded set" now use `matches` and reset
  the staged set. The effect-unknown rejection branch used to reset the recorded list unconditionally (keeping a
  human's extra staging); a digest cannot name paths, so it uses `recorded_paths`: the listed paths of a
  historical record, or `changed_paths(baseline head, intent.tree)` (the intent's tree is the index as staged
  for its paths) for a digest record. Foreign staging is still preserved.

## Git-crate diff summary (OPC)

`wal.rs`: `PathSet`/`PathDigest`/`CutoverGrantRecord`, `RecordTooLarge`, bound check before mkdir in `begin`,
`known_id` pub, intent validation via `PathSet::validate`. `scoped_commit.rs`: `StoredBaseline`,
`CommitBaseline::record`, `CommitRequest::record`, `is_recorded_as`, four recovery call sites use
`matches`. `grant.rs`: digest compare. `lib.rs`: error class. Schema file. No change to locks, ordering or
effect sequence.

## Proofs (each owned once, lowest layer)

| behaviour | test | fails without fix |
|---|---|---|
| 1000 realistic paths + 600 dirty entries grant commit records and commits | `tests/scoped_commit_sync.rs::cutover_commit_of_a_thousand_legacy_shards_in_a_dirty_worktree_stays_within_the_record_bound` | yes, mutations a (full baseline), b (listed paths), c (full request), d (listed grant) each fail it |
| oversized intent refused before any directory/record; worktree and index untouched; retry with same id works | `wal.rs::oversized_intent_is_refused_before_an_operation_directory_exists`, `tests/scoped_commit_sync.rs::commit_whose_intent_exceeds_the_record_bound_is_refused_before_any_record_and_retries_cleanly` | yes (mutation e: bound check removed -> both fail) |
| effect-unknown recovery of a bounded record unstages only its own paths | `tests/scoped_commit_sync.rs::recovery_of_a_bounded_record_unstages_only_its_own_paths` (historical form: existing `unknown_replay_keeps_cause_and_recovery_preserves_foreign_staging`) | yes (mutation h: digest branch returns no paths -> fails) |
| path digest semantics + historical listed form | `wal.rs::path_set_digest_matches_the_same_paths_in_any_order_and_listed_records_still_read` | n/a (new type) |
| intent-less operation dir does not block the next cutover attempt | `event-store tests/legacy_import.rs::a_cutover_operation_directory_without_an_intent_does_not_block_the_next_attempt` | yes (mutation f: old inspect path) |
| migrate restores the tree for `wal-record-too-large` | `test/event-store/migrate.test.mjs` cutover restoration test (one added assertion) | yes (mutation g: code removed from set) |

Node working-tree restoration end to end is already proven by the real-hook rejection test; no way to hit
the new refusal through real migrate remains by design (record bounded), so the classifier assertion plus the
Git-level untouched-worktree test split that proof.

## Verification

- `cargo test -p fgos-git -p fgos-event-store` (final tree): 83 suites incl. doctests, 485 passed, 0 failed. (An intermediate tree failed `unknown_replay_keeps_cause_and_recovery_preserves_foreign_staging`; fixed by `recorded_paths`, see above.)
- `cargo clippy -p fgos-git -p fgos-event-store --all-targets -- -D warnings`: clean. `cargo check --target aarch64-apple-darwin` (both crates): ok (pre-existing dead-code warnings in process/holder-lock only).
- Node via fr.sh: test/event-store, test/git, test/setup/event-store-*: 334 tests, 333 pass, 1 skipped, 0 fail.
- `git-one-door-scan --check`: exactly 5 `unresolved-binary`; census and `test/suite-baseline.json` regenerated in the same commit.
- CHANGELOG `[Unreleased]` line added.

## Not done / follow-ups

- The real fg-server2 cutover has not been re-run; the dev host must be rebuilt from this branch. The empty
  `event-store-cutover-9f371889a9167ffe482a6a0799f7d26f-1` directory on the main checkout needs no manual
  deletion: the next migrate reuses it (item 4).
- The grant `exactPaths` literal check on historical `Listed` records now goes through the same path
  validator as `paths` (all `.fgos/...` literals, so no behavioural change expected).
