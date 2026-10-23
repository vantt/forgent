# Phase lead report: 05B, transaction skeleton, native_lock, ResultCode, addon/Node, ports contract

Branch `harden/t2-p05b-git-skeleton-surface` (from `026dd8ff0`), pushed after each slice. Slice 12 did not run (work/es-cutover is not on main). Status: DONE_WITH_CONCERNS (the Node re-run and census wait for the big lead's "resume"; see Open).

Δ lines: Rust src (inline tests included) / Rust tests / other.

| # | SHA | Folded | Δ |
|---|---|---|---|
| 7 | `ebb16759d` | `Intent::of`, `authority_gate`, `CommitResult::committed/unchanged`, `changed_paths`, `tracked_inventory`, `commit_message`, `is_store_path`, `require_no_index_lock`, one `NATIVE_STATE` list with `native_state_probe`; E-20: one public fn per verb | src −88 (production about −129; the unit tests added in src are +41) / tests +25 |
| 8 | `16ef4b46f` | native_lock: directory syncs through `sync_directories`, one `exchange`, one `parent_of` | src −9 |
| 9 | `e6a1bdadf` | six `ResultCode` variants and their contract rows | src −6, tests −6, JSON −6 |
| 10 | `8668f8e69` | Node native-lock door, `nativeError` to `door.mjs`, `hotLockDepth` import, refusal text | Rust −53, Node src −18, Node tests −32, manifest −1 |
| 11 | `0e05bb68f` | `ports.v1.json` made true, runtime pin | JSON +27, Node tests +42 |

Total Rust src −156 (production about −197), Rust tests +19, Node src −18, Node tests +10. Slice 12 not run. No slice dropped whole.

## Slice 7 detail
- Folded (file/site): intents built 9× by hand in scoped_commit, sync, land, restore; authority checks ×4 (scoped recover, scoped known-id, sync, restore); CommitResult ×9; diff-name-only ×6; ls-files -v parser ×2 (scoped, sync); commit argv ×2; index.lock probe ×3; native lists in land, restore, worktree removal; `.fgos` prefix test ×7.
- Not folded, and why: `replay_known_id` stays four equality checks (they compare different request types: JSON strings, fields, digest, request struct; a digest compare would break Sync replay after HEAD moves). Cause name unified only (see below). `restore.rs` flag reader and `worktree.rs`/`apply_declared_files` single-path `ls-files -v` read raw flags for another question. Index digest ×4, compact prologue ×5 (each builds its own kind; `Intent::of` shortened them). Intent literals in refs, worktree, remote, repository_config, publication (other port files; ~−4 lines each, left).
- Unified behaviour, each with a test: Sync commit hook sees `fgos.operationId` (`scoped_commit_sync.rs`); native list (`scoped_commit.rs` unit test states it; Land and Worktree removal now also refuse on HEAD.lock and sequencer, Land on index.lock first); SafeRestore says `operation-id-reused`, so the one kept name is `operation-id-reused` (three of four ports, Rust and Node tests already asserted it). Callers: `rg operation-id-conflict src bin packages test` found one Node test (`test/git/safe-restore.test.mjs`), moved in the same commit. `operation-id-conflict` remains in worktree.rs ×3, remote.rs, repository_config.rs and the WAL mapping (other ports; a crate-wide pick is a separate decision). SafeRestore's gate now also accepts the plain-worktree resource form; no restore chain carried it.
- E-20 done for the four files: `prepare_land/publish_land(…, filesystem, wait_ms)`, `acknowledge_land`, `apply_restore`, `acknowledge_restore`, `scoped_commit`, `recover_scoped_commit`, `preflight_commit(…, Option<(writer, id)>)`; `WalReader` and `has_conflict_markers` re-exports gone (the markers test moved inline to sync.rs). Test callers moved mechanically (~120 sites). Not done: the other ladders of E-20 in refs, remote, repository_config, wal, publication (other port files).
- Behaviour-preserving proof: `cargo test --no-fail-fast -p fgos-git` 51 binaries, passed 293 failed 0 ignored 9 (baseline before slice 7: 291/0/9; +2 = Sync hook case and the native-list case).

## E-3
Moved: `src/native/door.mjs` owns `nativeError` (durable-file errors use it), `src/git/native.mjs` re-exports it; `src/setup/git-checks.mjs` and `src/runner/merge.mjs` (diffFailureMessage) use it, answers unchanged. Listed for T5/WORK (parse differs on a plain error, so not trivially equal): `src/runner/merge.mjs` ~959 (`detail.cause` compared later), `src/runner/worktree.mjs` ~1098, `src/verbs/merge/approve.mjs` ~165, `src/verbs/events/migrate.mjs` ~242 (returns `cause`), `src/event-store/native.mjs` ~33, `scripts/git/e3-bench.mjs` ~94.

## E-7 on-disk check
`ResultCode` is not referenced by `wal.rs`; `Outcome`, `Receipt`, `CompactReceipt` hold no result code (grep `ResultCode` over packages/git/rust/src: lib, publication, refs, remote, scoped_commit only, all constructing errors or results returned to callers). `OperationError` is serialized to Node, never stored. Node: no `src`/`bin` consumer reads the six strings from a Git code (the `'created'`, `'cancelled'`, `'conflicted-open'` hits are GitHub, run results and Sync states). Sync's `conflicted-open`/`conflict-aborted` stay `SyncResult.state`.

## E-1 and retired test
Rust inspection stays. `test/git/native-lock-repair.test.mjs` retired; owner `native_lock.rs::unknown_external_lock_has_inspection_report_and_is_never_moved`. It lacked two things the Node file asserted (report path/inode/state digest, dangling-symlink case); both were added to it and each was shown to fail under a mutation (observed inode dropped; symlink removed). The refusal now reads `native-index-lock-unowned: follow Git spec §11 retained index.lock runbook`; Rust and Node assertions moved. `repair_native_index_lock` is one fn taking the filesystem.

## F-1
Deviation from the brief: pinned at run time in `test/git/native-load.test.mjs` (phase file), not in `tests/contracts.rs`, because `fgos-git` cannot see the addon and no Rust source is parsed. Each port is built on a temp repo; every listed operation is called and must not answer the port's "unknown … method" refusal; each port refuses one unlisted name with it; Land is checked by `typeof`; `functions` by export. Shown to fail when a bogus operation is added. `tests/contracts.rs` keeps the result-code pin. The `legacyEvents` row is untouched. Spec line 530 and §2 line 105 still name the deleted Node door and the six codes: DOC lane.

## Collisions with WORK
lib.rs: two re-export lines and the ResultCode enum; scoped_commit.rs: helpers and call sites, legacyEvents and checkpoint paths untouched (`checkpoint_tracked_files` stays, uses the new `is_store_path`); addon scoped_commit.rs: call arguments; ports.v1.json: ports object only. grant.rs untouched.

## Verification (private target t2-p05b-target)
```
cargo test --no-fail-fast -p fgos-git                      51 binaries, passed 293 failed 0 ignored 9
cargo test --no-fail-fast -p fgos-event-store -p fgos-identity -p fgos-node-addon   37 binaries, passed 207 failed 0 ignored 2
cargo clippy --workspace --all-targets -- -D warnings      Finished, no warnings
Node one-file (git/*, setup/git-checks, worktree-admin-multiprocess, land-vs-manual-commit, runner/merge, architecture) at slice 10: tests 309 pass 306 fail 2 (both the operation-id name assertion, fixed in slice 7 and re-run: safe-restore 4/4)
```

## Concerns
- History rewrites on this branch: slice 7 first swept three deletions of slice 10 and slice 8 had a clippy `collapsible_if`; both fixed by rebuilding the commits (force-with-lease on my own branch). Final SHAs are the ones above.
- Runs up to slice 10 used the worktree-local build directory (a variable-name slip), not t2-p05b-target; it was deleted; the final runs above use the private target.
- Test-cost: added 4 (Sync hook id, native list, ports pin, two Rust assertions extended), retired 1 file; one `git init` spawn in the ports pin.

## Open (waiting for "resume")
Final Node one-file re-run on the final tree, and the census regeneration (last commit; must list exactly CFG's 5 `unresolved-binary` sites: a trial run before the last commits did).

Status: DONE_WITH_CONCERNS
