# Remove dead Git checkpoint operation and cutover grant

Branch `harden/dead-git-checkpoint-grant`, code commit `86b503ab5` (one commit, 27 files, +137 / -746, net -609).
Reviewer: OPC (Git owner). Source rows: audit-261028-1448-harden-recheck-t2 (T2-1, T2-2), -t3 (T3-3).

## Deletions, one per row (check each)

| Surface | Where | Change |
|---|---|---|
| Checkpoint Rust op | `packages/git/rust/src/scoped_commit.rs` | `checkpoint_tracked_files` and `CheckpointRequest` deleted |
| Checkpoint addon arm | `packages/git/node-addon/src/git/scoped_commit.rs` | `"checkpointTrackedFiles"` arm deleted; unused `strings` import dropped |
| Checkpoint facade | `src/git/scoped-commit.mjs` | method name removed from the list |
| Checkpoint contract | `packages/git/contracts/ports.v1.json` | `ScopedCommit.checkpointTrackedFiles` removed (pinned by `test/git/native-load.test.mjs`, green) |
| Grant request field | `scoped_commit.rs` | `CutoverGrant` struct, `CommitRequest.cutover_grant`, the grant/seal/fence branch in commit selection, `validate_cutover_seal` deleted |
| Grant WAL record | `packages/git/rust/src/wal.rs` | `CutoverGrantRecord` deleted; field becomes the null-only `retired_cutover_grant` (see WAL below) |
| Grant check | `packages/git/rust/src/grant.rs` (deleted), `lib.rs` (`mod grant`, exports) | whole file |
| Driver support | `packages/git/rust/src/driver.rs` | `hook_deletions` (only caller was the grant check) deleted; the now-dead `hook_index` param folded: `invoke_context` became `invoke_input`, wrapper removed |
| Host route | `packages/distribution/rust/src/git_grant.rs` (deleted), `lib.rs`, `apps/fgos/src/main.rs` | `fgos internal git-grant-check` gone |
| Route contract | `packages/git/contracts/internal-route.git-grant-check.v1.json` | deleted |
| Hook branch | `.githooks/pre-commit` | `scopedGrantAllows` deleted; staged `.fgos` deletions (not carried by a merge) are refused outright. Same outcome as before: no grant could ever be allowed. |
| WAL schema | `packages/git/contracts/wal-record.v1.schema.json` | `cutoverGrant` now `type: null`, described as retired, no longer required |
| Callers | `src/runner/execution/commit-unit-work.mjs`, `scripts/knowledge-migration.mjs`, `scripts/git/e1-power-cut.mjs`, `scripts/git/e3-bench.mjs`, 4 test files | `cutoverGrant: null` dropped (new `CommitRequest` is `deny_unknown_fields`, so this is required) |
| Tests | `test/git/cutover-grant.test.mjs`, `test/suite-baseline.json` row | deleted |

Kept on purpose: `libc` dependency of `fgos-distribution` (removing it broke `install_lock_multiprocess` test which uses it).

## WAL compatibility (decided from evidence, no version change)

- `ScopedCommitIntent` is `deny_unknown_fields`, and `Chain::validate` re-serializes each record to recompute its digest (`wal.rs` `record_digest`). Every intent the current release wrote carries `"cutoverGrant": null` (plain `Option`, no skip). Removing the field outright would break both parse and digest, so recovery would refuse interrupted commits.
- Fix in the existing pattern (as `ConfigChange.config_sequence` / `RemoteFetch.targets` "preserve historical digests"): `#[serde(default, rename = "cutoverGrant", skip_serializing_if = "Option::is_none", deserialize_with = "present_null")] retired_cutover_grant: Option<()>`. `null` reads as `Some(())` and writes back as `null`, so the digest matches; new intents omit the key; a non-null grant is refused (none was ever produced).
- The stored request string inside the intent is already read tolerantly (`StoredCommitRequest`, message only).
- `recovery_matrix.rs` generates its chains live; there are no on-disk WAL fixtures with the key.
- Known limit (same as the earlier `legacyEvents` removal): a *same-operationId commit retry* spanning the upgrade compares request digests, and the old digest included `cutoverGrant: null`, so that retry gets `operation-id-reused` instead of the recorded outcome. Recovery (`recover`) still reconciles. Not changed; flagged below.

## Tests

- `cargo test -p fgos-git`: 316 passed, 0 failed, 9 ignored (53 binaries). `fgos-distribution` 107/0, `fgos` 104/0, `fgos-node-addon` 5/0.
- `cargo clippy --all-targets -D warnings` on all four crates: clean (only third-party `arraydeque` warnings).
- `cargo check` for `x86_64-pc-windows-msvc` and `aarch64-apple-darwin` (fgos-git, fgos-distribution, fgos): no errors; remaining warnings existed before (`shim.rs:189`, unrelated fields).
- Node focused (run-tests): scoped-commit, sync, lock-handover, commit-parent-death, native-load, githooks event-layout + census-drift, setup git-checks, runner commit-unit-work, architecture: 157 tests, 156 pass, 0 fail, 1 skip (Windows-only), no ERROR lines. Plus e2e main-checkout-activity-beacon and distribution native-addon: 11/11.
- Census regenerated: 0 undeclared sites (two hook spawn sites gone, line shifts, digests).
- impact-analysis: GitNexus tools not available in this session; blast radius checked with `rg` (acceptance commands below).

## Retired tests and new owners

- `test/git/cutover-grant.test.mjs`, `cutover_commit_of_a_thousand_legacy_shards_...`, `baseline_only_cutover_commits_the_event_fence`: behaviour removed.
- `noop_is_durable_and_checkpoint_selects_only_non_event_tracked_files`: checkpoint half removed with the op; noop half kept as `noop_commit_is_durable_and_a_retry_stays_unchanged`.
- The thousand-path bounded-record case still exists for ordinary commits: kept as `commit_of_a_thousand_paths_in_a_dirty_worktree_stays_within_the_record_bound`.
- New owning proof: `wal::tests::scoped_commit_intent_written_with_a_null_cutover_grant_keeps_its_digest`. Wiring proof: the existing `recovery_reconciles_an_attempt_stored_with_the_retired_legacy_events_field` fixture now writes the null key as the earlier release did.

## Acceptance rg

`rg -n 'checkpoint_tracked_files|checkpointTrackedFiles'` outside docs/plans/archive: empty.
`rg -n -i 'cutover.?grant|git_grant|gitGrant|cutoverGrant|validate_cutover_seal'` outside docs/plans/archive: only
- `wal.rs` retired null-only field + its test, `scoped_commit.rs` `retired_cutover_grant: None` in 4 intent builders, `scoped_commit_sync.rs` fixture (earlier-release bytes): required for WAL compatibility;
- `wal-record.v1.schema.json` retired `null` key;
- `CHANGELOG.md:351` history.

CHANGELOG: no line. Nothing a user sees changes: the route was internal and unlisted, no doctor row existed, and the hook outcome is unchanged.

## Docs lines for DOC (`docs/platform/git/spec.md`)

- :121 Checkpoint adapter row: remove, or mark "removed 2026-10-28 (no caller)".
- :148 "non-event main Checkpoint": add dated note that Checkpoint was removed.
- :335 hook ordering: "tracked `.fgos` deletion (non-event; event-file deletion only in authorized cutover grant)" -> "tracked `.fgos` deletion refused (no grant path; removed 2026-10-28)".
- :337 "Event-file cutover grant (P-CUTOVER fold)" paragraph: dated removal note (no producer after the Work cutover; WAL keeps a null-only `cutoverGrant` key for digests of earlier intents).
- :351 "Only the existing cutover grant admits store paths" -> "No path admits store paths".
- :765, :801, :846, :938 (item 6), :1249, :1306: G-166/G-223/P-CUTOVER effective rule -> "all tracked `.fgos` deletion refused; cutover grant removed 2026-10-28".
- :1074 "Kept on purpose" list: optionally add the WAL null-only `cutoverGrant` key.

## Open questions

1. `commit_message` still passes `-c fgos.operationId=<id>` to `git commit`, with the comment "where the hook reads it". The repo hook no longer reads it. A Sync test pins that hooks can see it (`scoped_commit_sync.rs` ~:279). Should it stay as a hook-visible value for consumer hooks, or be removed? OPC to decide. Not changed here.
2. Same-id commit retry across the upgrade (see WAL limit): accept, as the `legacyEvents` removal did, or teach `CommitRequest::is_recorded_as` the earlier digest form?

Status: DONE_WITH_CONCERNS
