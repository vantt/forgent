# Report: write admission, Linux gating, wording, macOS backlog (branch harden/t3b-admission-platform)

## Changes per item
1. **Write admission** (`packages/git/node-addon/src/event_store.rs`, `write_admission`, field doc, new private `is_repository_state`): no error-code classification existed (`errors.rs` has only the generated `ErrorCode` enum), so a two-code predicate lives beside `write_admission`. Cached: admitted, `event-store-migration-required`, `event-store-refspec-missing`. Any other error (`event-store-io`, Git failures, integrity) is returned with its code and not cached. Tests in `test/event-store/facade.test.mjs`: the red transient-failure case now passes; new case "a write refused for a repository state stays refused after that state changes" (commit retired legacy file, refused, retire it, still refused). No existing test proved the cache (migrate.test.mjs only checks the refusal itself).
2. **Linux gate**: `#![cfg(target_os = "linux")]` added to `append_recovery, kill_append, offline_sync, reader_seal_stress, seal_cas_race, seal_publication, shared_machine_id, sync_review, three_clones, v_event, registry_identity_layout`. `refs.rs` unit-test module gated `cfg(all(test, target_os = "linux"))`. `export.rs`: the `mut` builder is now created only on unix, with a plain builder otherwise. `tests/common/mod.rs` `cfg(unix)` left as is: it is used by gated targets and by the ungated `branch_local_refs`, `framing_prefixes`, `p02_review` where unix is the real meaning.
3. **Wording**: CHANGELOG and ES spec §22 (support matrix), §25 (out of scope), "Work cutover proof gate" now say every platform other than Linux, macOS included. Other grep hits (holder-lock, terminal-control, process, packaging) are about other components and are correct as written. §14 and read-result text untouched.
4. **Backlog**: `p-zsy3fmbcpd` row (proposed, owner Event Store), near the top of `docs/backlog.md`. Minted from the main checkout's cwd (`fgos identity mint backlog --json`), because the worktree has no `.fgos/installation`; main's git status was unchanged.

## Commands and results
- `cargo check -p fgos-event-store --all-targets --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin` (both targets installed): clean, no warnings from the crate (only third-party `arraydeque` warnings, not ours).
- `cargo clippy -p fgos-event-store -p fgos-node-addon --all-targets -- -D warnings`: clean.
- `cargo test -p fgos-event-store --no-fail-fast` on Linux: all targets pass except 5 red tests that belong to other items and are in files this branch does not touch: `checkpoint::a_rewound_peer_mirror_does_not_silently_drop_the_events_it_already_authenticated`, `reader_review_regressions::{read_without_a_store_root_is_empty_history, foreign_mirror_with_an_invalid_machine_name_is_skipped_not_fatal, foreign_mirror_whose_header_names_another_machine_is_skipped_not_fatal, foreign_mirror_with_an_oversized_segment_is_skipped_not_fatal}` (red tests from b32333500). The gated targets pass as before.
- `runChosenTests(['test/event-store/facade.test.mjs'])`: 15/15 pass.
- Pre-commit census: regenerated with `git-one-door-scan --write-census`, included in the item 1 commit.

## Not done
- Windows and macOS were only compile-checked, never run.
- The 5 red tests above are left for the lanes that own them.
