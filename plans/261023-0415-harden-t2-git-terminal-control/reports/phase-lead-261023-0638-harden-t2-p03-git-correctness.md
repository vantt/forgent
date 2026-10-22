# Phase lead report: Git correctness (phase 03)

Branch `harden/t2-p03-git-correctness` (from `harden/t2-git-terminal-control` 9d935588c). Cargo target `/home/vantt/projects/forgent-worktrees/t2-p03-target`. CF07 closed as not reproduced: no slice. WAL compaction stays out of T2.

## Commits (Git area = OPC review)

| Commit | Subject | Git area |
|---|---|---|
| `6716931fa` | fix(git): failed-write temporaries never count against the WAL record bound | yes |
| `e7d037593` | fix(git): finish config durability before acknowledging a recovered change | yes |
| `0eaa381f0` | fix(git): a sequence push the remote refuses keeps the remote's reason | yes |
| `2d38cac97` | fix(git): a claim lost to a concurrent claim on the remote is still a lost lease | yes (corrects 0eaa381f0, see CF08) |
| `5dcfd19ba` | fix(git): a local counter claim is durable before it is reported | yes |
| `e19156374`, `db87f571b` | chore(git): regenerate the mutation census | no |

## Per finding

- **CF06** (`wal.rs`): `inspect`, the pre-intent scan (`has_intent`) and the per-operation byte count in `scan` now apply `is_durable_temporary` (the one existing function) before counting against the bound. Unknown names still refuse; nothing deleted. Green: `wal::tests::failed_write_temporaries_never_count_against_the_record_bound`.
- **CF05** (`repository_config.rs`): one helper `observed_config_outcome` serves both the dead-writer recovery loop and the failure handler. Value installed -> sync config file then parent (`fgos_durable_file::sync_directory`) then a `config-synced` checkpoint; acknowledged only if all pass, else `Transfer{acknowledged:false, unknown:true}` (pending evidence). Not installed -> unknown as before. Never replayed, no second journal.
  - Same-id replay unchanged: it can now only see an acknowledgement that followed a completed sync.
  - The red test asserted "never acknowledged", which cannot hold once recovery completes the sync (phase 2 report item 3 anticipated this). Replaced by two cases with an observable proof: acknowledged only when `config-synced` ran before the acknowledging record; with `config-synced` failing the outcome is unknown, not acknowledged. The no-replay and no-lock assertions stay; dead-writer case untouched and green.
  - The failure answer is the existing `config-change-resolved-without-success` for replay of an unknown chain; I did not rename it.
- **CF08** (`sequence.rs`): `is_stale_lease_row` matches only rows whose reason is one of git's expected-value-not-held spellings. Verified on git 2.53.0:
  - client lease: `[rejected] (stale info)` (also for a wrong expected tip);
  - remote CAS, lost to a concurrent claim: `[remote rejected] (incorrect old value provided)` (update race, 11 of 12 parallel pushes), `[remote rejected] (reference already exists)` (create race), and `(reference does not exist)`;
  - hook: `[remote rejected] (pre-receive hook declined)` keeps its stderr.
  - Deviation: the phase text named only the lease reasons. My first cut did that and broke `fgos-identity concurrent_claims_from_different_clones...` (real lost races reported as `sequence-push-failed`); `fetch first` is a non-fast-forward spelling, not a lease verdict, and is not matched. Fixed in the follow-up commit; identity green 3 runs.
  - Green: `ssh_transport::a_push_the_remote_refuses_for_another_reason_keeps_that_refusal`. One unit case pins the spellings.
- **CF09** (`sequence.rs`, local home): commit-tree runs with `-c core.fsync=all`; `objects::sync_loose_objects(..., false)` before the ref moves; `update-ref` with `-c core.fsync=all`; `refs::sync_refs` before `Claimed`. No WAL, no new seam. Witness type: reading review by OPC. No unit witness; E1 power-cut not run (not root, uid 1000). Sequence and identity suites green.

## Verification (result lines)

- `cargo test --no-fail-fast -p fgos-git --test repository_config --test sequence --test publication --test land_crash_matrix --test recovery_matrix --test refs_remote --test worktree --test ssh_transport`: repository_config 10 pass; sequence 6; ssh_transport 6; refs_remote 17; worktree 9; land_crash_matrix 15 pass (2 ignored); recovery_matrix 31 filtered cases pass; publication 32 pass / 2 red.
- `cargo test -p fgos-git --lib`: 69 pass / 1 red. `-- wal::`: 21 pass (earlier run).
- `cargo test -p fgos-identity`: all green. `cargo clippy -p fgos-git -p fgos-identity --all-targets -- -D warnings`: clean.
- Node one-file `test/git/repository-config.test.mjs test/git/recovery.test.mjs`: 5/5.
- Remaining reds are exactly the phase-5 ones: `publication_names_a_busy_wal_like_every_other_port`, `a_borrow_that_is_unavailable_has_one_cause_name_whichever_check_finds_it`, `driver::tests::a_failed_read_names_the_layout_cause_whichever_read_hits_it`.
- Census regenerated; the scan still prints 5 pre-existing `unresolved-binary` sites in Node files I did not touch.

## Delta lines (vs 9d935588c)

| Part | + | - | net | plan |
|---|---|---|---|---|
| Node | 0 | 0 | 0 | 0 |
| Rust src (wal, repository_config, sequence) | 110 | 48 | +62 | +45 |
| Rust tests (repository_config.rs; unit case in sequence.rs counted in src) | 50 | 23 | +27 | +10 |

Over estimate: CF08 grew for the remote CAS spellings (+constant, unit case in src), CF05 helper plus failure-path unification.

## Test-cost line

Added 2 cases (config: acknowledged-only-after-sync, unknown-when-sync-fails; both replace the one phase-1 case) plus 1 sequence unit case pinning the porcelain spellings; retired 0; strengthened 0. Local counter claim gains about 3-4 fsyncs (cold path).

## For OPC / IDENT

- CF09: reading review only; check `sequence.rs` Local branch order (object sync, update-ref fsync, sync_refs, Claimed).
- IDENT told: mint calls this code; CF08 changes which refusals surface (hook/policy now `sequence-unreachable` with git's reason instead of retry). Needs a board line from the big lead.
- Unresolved: the CF08 spelling set is git 2.53.0 evidence; floor-version spellings not probed.
