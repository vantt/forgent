# Phase lead report: 05A, Git errors, driver, WAL, readers, refs/worktree/remote, config/inspect

Branch `harden/t2-p05a-git-errors-wal` (from `fee2fd6de`), pushed after each slice. Cargo target `/home/vantt/projects/forgent-worktrees/t2-p05a-target`. Status: DONE_WITH_CONCERNS (see Concerns).

Δ lines are Rust `src` (inline test modules included, each under ±10) / Rust `tests/`. Slice 3 also edits `packages/durable-file/rust/src/lib.rs` (+6, trait bound and blanket impl).

| # | SHA | Folded | Δ src / tests |
|---|---|---|---|
| 1 | `a59d6889c` | six constructors and the inline literal → `classified/failure/failed/recovery/stale/busy` in lib.rs; one `From<WalError>`; `WalError::Display` no longer Debug; `repository_config` cause sniffing gone; `.map_err(failure)` on WAL errors → `?` in every port; deferred compaction → optional `Receipt.warnings` | −128 / +17 (schema +6) |
| 2 | `d3df8bf85` | `layout_cause` + `object_gap_cause` (6 ladders); unsafe `readdir_r` check gone, `hooks_empty`, `new` creates hooks through the setup creator, one pipe helper, stale allow, duplicate import, `Clone` on the floor verdict; borrowed and contained limit failures share `git-timeout`/`git-output-limit` with `detail.path`; provenance read refuses instead of dropping a chain | −61 / +3 |
| 3 | `e28fdee24` | WAL on `fgos_durable_file::FileSystem` (`Send + Sync`, blanket for `&T`); FaultAdapter/OsFileSystem/FileSystem copies gone; directory fsyncs through `sync_directory` on the pinned fd path; `Wal::open_with` ×8; one `Attribution`; one ledger digest function; one removal tail; `ObservedRef::Unknown`, `Recovery::Unprepared`, two redundant arms | −87 / 0 |
| 4 | `2464b7cc2` | `read_ref_value` (Publication and `resolve_ref`); `ref_dirs`/`sync_ref_dirs(concurrent)`; driver `candidate_intact` requires a commit | −44 / +8 |
| 5 | `eef312c22` | one `byte_path`, one `zero_oid` (4 copies), `registered_topology` (Refs inventory and worktree add), name grammar through `wal::valid_id` | −30 / +9 |
| 6 | `a939981c9` | `config_listing` (4 readers), `paths_at_revision` alias removed (4 callers moved), `literal_paths` uses `fgos_scope_literal` | −19 / 0 |
| 6b | `38cd9ea16` | Publication's missing-object read uses `object_gap_cause` (`promisor-object-unavailable` now written once) | −4 / 0 |
| 7 | `aae0aa00d`, then the fix commit | `resolve_head` with fewer children (big lead's addition); the first version was rejected by OPC and replaced by a bracketed two-step read | −24 vs original / +50 (new test file) |
| 8 | final | census | — |

Total (slices 1–6b, 7): Rust src about −404, Rust tests +37, contract JSON +6. Every slice paid; none was dropped whole. Sub-folds dropped are listed below.

## Red targets
`driver::tests::a_failed_read_names_the_layout_cause_whichever_read_hits_it` green in slice 2 (`layout_cause`); `publication_names_a_busy_wal_like_every_other_port` and `a_borrow_that_is_unavailable_has_one_cause_name_whichever_check_finds_it` green in slice 1 (the `From<WalError>` mapping).

## Behaviour-preservation proof
Verified on the final tree, paste:
```
cargo test --no-fail-fast -p fgos-git                       passed 291 failed 0 ignored 9 (50 binaries, incl. land_crash_matrix, recovery_matrix, publication, refs_remote, worktree, sequence, repository_config, ssh_transport, inspect, land)
cargo test --no-fail-fast -p fgos-event-store -p fgos-identity -p fgos-node-addon -p fgos-durable-file -p fgos-terminal-control -p fgos-run-supervisor
                                                            passed 451 failed 0 ignored 3 (71 binaries)
cargo clippy --workspace --all-targets -- -D warnings       Finished, no warnings
Node one-file: test/git/*.test.mjs test/setup/git-checks.test.mjs test/runner/worktree-admin-multiprocess.test.mjs test/runner/land-vs-manual-commit.test.mjs
                                                            tests 193 pass 192 fail 0 skipped 1; run-tests: ERROR lines 0
```
Windows check (`cargo check --target x86_64-pc-windows-msvc`) fails on the same two symbols as before the slices (`custody_lock_path`, `libc`) and on no others.

Named answer changes, each with a test: (1) WAL failures (`busy`, `operation-id-conflict`, `repository-identity-changed`, `publication-borrow-unavailable` are refusals; corrupt/io/fence/recovery are recovery-required with free text in `detail.diagnostic`): `tests/contracts.rs::every_wal_failure_is_named_by_one_kebab_cause_and_code_in_every_port` plus the two red cases; two `safe_restore` assertions moved to `git-wal-io` + diagnostic. (2) Borrowed timeout reads `git-timeout`/`detail.path=borrowed`: `tests/publication.rs` transport-timeout case; contained side in the driver case. (3) `resolve_ref` on a dangling symbolic ref is symbolic, was absent: `tests/inspect.rs::inspect_real_repositories...` (red before, green after). (4) driver `candidate_intact` refuses a tree or blob: the real-git WAL case (its candidate was a blob; now a commit, with the non-commit assertion). (5) remote and mapping names longer than 80 bytes refused: `tests/repository_config.rs::a_remote_name_is_the_crate_name_grammar_everywhere_it_is_checked`. (6) Publication read of a shallow repository names `shallow-history-incomplete` (it fell to `git-command-failed`). (7) `head-changed-during-read` kept, now with one leading observation.

## F-5 caller list
Searched `recovery-required|RecoveryRequired|publication-wal|Busy|OperationIdConflict|borrow-deadline|borrow-output-limit|hooks-config-read-failed` over `src`, `bin`, `scripts`, `test`, `packages/{git,event-store,identity,run-supervisor}`. No caller switches on a changed answer, so none moved:
- Event Store reads only `ResultCode::Stale` (`promote.rs:168`, `seal.rs:273`, `reconcile.rs:85`), unchanged; Identity prints `e.cause` as detail text (`mint.rs:131,212`, `project.rs:165,250`).
- Node: `src/runner/merge.mjs:103` already maps `git-output-limit`; a borrowed output limit now reaches it too. `src/git/land.mjs`, `src/setup/git-checks.mjs:135` read land causes only.
- Moved because of the removed alias: `restore.rs`, addon `git/inspect.rs`, `tests/inspect.rs`, and Identity `project.rs` (import of `Inspect` and the call name; tell IDENT).
- Receipt schema gained an optional `warnings` array; `src/` consumers read none of it.

## resolve_head children per call
Original: born 3 (symbolic-ref, rev-parse, symbolic-ref), unborn 4 (those three plus the ref listing), detached with a missing commit 3. Now: born 2 (symbolic-ref, then `rev-parse HEAD^{commit} --symbolic-full-name HEAD`), unborn 3 (symbolic-ref, failed rev-parse, listing), detached with a missing commit 2.
`aae0aa00d` used one child for a born HEAD and was wrong: that rev-parse reads HEAD several times, so a switch in the middle paired one branch's commit with another's name (OPC reproduced it). The fix commit restores `head-changed-during-read` with the leading `symbolic-ref` as the observation and refuses when the two names differ; a trailing check alone would not bracket it. Proof: `tests/head_switch.rs` puts a wrapper git first on PATH that switches HEAD to another branch once, just before the `rev-parse`, and asserts the refusal, then a consistent read afterwards. It is its own test binary because the driver resolves its git once per process. `resolve_head` net versus the original is −24 lines. Owning tests green: `tests/head_tree.rs`, `tests/inspect.rs`, driver layout case, Node git files.

## Collisions
- `read_paths_at`: only its two error ladders changed (`layout_cause`, `object_gap_cause`); no restructure.
- WORK overlap: lib.rs (constructors after `Result`, `Receipt.warnings`, `pub use wal::Attribution`, floor derives); scoped_commit.rs (import line and single-line `?` conversions); grant.rs (import line and `?` conversions; the Windows arm stays because WORK deletes the file); restore.rs one call name. driver.rs `refusal(` is now `failure(`: code WORK adds to driver.rs that calls `refusal(` needs the rename after the merge. `ports.v1.json`, `recovery_matrix.rs`, `scoped_commit_sync.rs`, addon `scoped_commit.rs` untouched.
- MAIL overlap: driver.rs hunks are the pipe helpers, `new`, the ladders and `resolve_head`.

## Sub-folds not done
- Two uid checks (owner-only vs owner-and-mode: different predicates).
- `Backlog.ledger_entries`/`ledger_capacity_warning` kept: owner picked A1.
- `publication.rs` `starts_with("directory-fsync")` and git-stderr `"but expected"` matching stay: `WalError::Io` and `Output` carry no typed field, a marker type costs more than it saves. `BoundReader` collapse stays: `RecoveryReader` returns `WalError`, which now reaches callers as one named cause.
- `#[cfg(not(unix))]` arms: they keep the Windows build one step from compiling; about 25 lines saved at the price of breaking that path further.
- Second `canonicalize` in worktree remove/move: resolves the final component, which `canonical_destination` (parent only) does not.
- restore.rs:1111 scan: "path inside a registered worktree", not a branch scan.
- Byte-path validation of `snapshot_writes` and `attributes`: different input and strictness; one rule would refuse an accepted attribute path.
- Digest half of E-22: kept by evidence (the leaf writes numbers through f64 and orders keys by UTF-16; the WAL digest keeps integers exact and orders by bytes). `fgos-git` gains no `fgos-canonical-json` dependency. E-23 v1 branch is phase 8's.
- `wal.rs` real-git case kept (retargeted, not retired).

## Concerns
- `tests/sequence.rs::a_local_claim_asks_git_to_flush_even_when_the_repository_configures_writeout_only` is flaky (2 of 10 on the untouched base, about 1 of 4 on this branch): the floor probe's `update-ref` lands in the shared log when this test is the first in the process to probe. Not mine; phase 3 owns it.
- `/tmp/fgos-land-<pid>-<n>` leftovers from earlier runs can make `restore_crash_child` fail once with "File exists" (pid reuse); a rerun passes.
- Slice 1 touches many single lines in `scoped_commit.rs`, `sync.rs`, `land.rs`, `restore.rs` (the `?` conversions); 05B restructures those files, so rebase before it starts.
- The census was regenerated twice (a stale commit `8f7c425e1` before slice 6b and 7, then the final one).

## Test-cost line
Added 6 cases (WAL mapping table, borrowed timeout assertion, dangling symbolic ref assertion, remote name grammar, non-commit candidate assertion, `safe_restore` helper); retired 0; no new CLI or host spawn.

Status: DONE_WITH_CONCERNS
