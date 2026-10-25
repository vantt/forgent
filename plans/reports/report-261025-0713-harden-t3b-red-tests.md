# HARDEN T3 part 04b: RED tests for Event Store bugs

Branch `harden/t3b-red-tests` from main `779f27941`. Every test below fails on that commit for the stated reason, run with a private Cargo output dir. Every other test in the touched files passes (reader_review_regressions 17 of 21, checkpoint 5 of 6, registry_identity_layout 8 of 9, facade 13 of 14); the failures are exactly the new tests.

Commands (private Cargo output dir, `PATH=$HOME/.cargo/bin:$PATH`):
- `cargo test -p fgos-event-store --test reader_review_regressions`
- `cargo test -p fgos-event-store --test checkpoint`
- `cargo test -p fgos-event-store --test registry_identity_layout`
- `runChosenTests(['test/event-store/facade.test.mjs'])`

| # | File | Test | Behaviour | Failing assertion text |
|---|---|---|---|---|
| 1 | `packages/event-store/rust/tests/reader_review_regressions.rs` | `read_without_a_store_root_is_empty_history` | a missing store root (`fgos/events` under the common dir) reads as empty history | `the read failed: event-store-io: NotFound: No such file or directory (os error 2)` |
| 2a | same | `foreign_mirror_with_an_invalid_machine_name_is_skipped_not_fatal` | mirror `.../events/EVIL` is skipped, the other machine's event is still read; the same content as own ref stays an error | `one bad foreign mirror (EVIL) failed the whole read: event-store-integrity: invalid machine in ref` |
| 2b | same | `foreign_mirror_whose_header_names_another_machine_is_skipped_not_fatal` | header names another machine | `... failed the whole read: event-store-ref-tampered: tip machine/scope differs from ref` |
| 2c | same | `foreign_mirror_with_an_oversized_segment_is_skipped_not_fatal` | `events.jsonl` of 32 MiB + 1 byte (smallest blob over the cap; made in about 1 s) | `... failed the whole read: event-store-io: Git: blob-too-large` |
| 3 | `packages/event-store/rust/tests/checkpoint.rs` | `a_rewound_peer_mirror_does_not_silently_drop_the_events_it_already_authenticated` | after a peer mirror rewinds, the peer's event 2 stays in the answer | `the rewind dropped the peer's event 2 without a trace (checkpoint report: CheckpointReport { continued: false, ignored: Some("event-store-mirror-rewound: mirror no longer descends from previous tip"), written: true, .. })` |
| 4 | `packages/event-store/rust/tests/registry_identity_layout.rs` | `a_clone_moved_to_another_path_keeps_its_store_id` | `rename` of the clone (same inode) opens with the same store id | `a moved clone ... must keep its store: event-store-store-moved: machine or Git common-directory identity changed; explicit move confirmation required` |
| 5 | `test/event-store/facade.test.mjs` | `a write refused by a transient Git failure is admitted once the failure clears` | the first append fails while the refs directory has mode 000 (`event-store-io: Git: git-command-failed (exit 128): fatal: not a git repository`); after the mode is restored the second append must succeed | the second append (`facade.test.mjs:200`) throws the same cached `event-store-io ... not a git repository` |

## Notes

- **2: the own-ref half is not proven yet.** The foreign assertion fails first, so the "own ref stays fail-closed" assertion in each test never ran. It becomes live once the foreign half passes.
- **2c error code:** the read fails with `event-store-io: Git: blob-too-large` (not `git-output-limit`). No test asserts a code; they only require the read to succeed.
- **3 owner:** `checkpoint.rs`, because only the checkpointed read has the walk-from-zero fallback (`read.rs:473-479`). `cursor_incremental.rs` `mirror_rewind_refuses_and_preserves_the_previous_cursor` owns the retained-cursor refusal and is unchanged; WORK's fix may change that refusal too.
- **3 pins one design:** the assertion is "events the peer's earlier tip authenticated stay in the answer" (what sync does). If WORK chooses "drop but name", change the assertion. Without a result field no naming assertion is possible yet.
- **5 layer:** no Rust layer can observe the memo without a test seam. The Node test uses the real addon and a real I/O fault, no seam. The first admission failed as intended (chmod worked). The test cannot tell a transient error from a settled refusal beyond this one case; after the fix, a second case could pin that a settled refusal stays memoized.
- **Not written:**
  - Write refusal on a missing root: `locks.rs` already refuses with `event-store-lock-dir-invalid`, asserted in `append_recovery.rs:338-351`. I did not check whether its message names `fgos setup`.
  - Shared machine id: `identity_is_stable_and_copies_moves_and_machine_changes_refuse` already asserts that a changed machine id refuses. WORK's decision keeps that refusal and removes the advice from the spec, so there is no code bug to pin.
  - The 775 refusal name (moved to Git).
- **Side observation:** `registry_identity_layout.rs` has no `#![cfg(target_os = "linux")]` although it calls the Linux-only `dev_ino`. Left alone.

## Proposed result fields for the fixes

- `ReadResult.skipped_mirrors: Vec<SkippedMirror { ref_name, machine, code, detail }>`, filled for bad name, tampered header, oversize blob and rewind. Tests 2a to 2c and 3 then gain one assertion naming the ref.
- Rewind reason: reuse `event-store-mirror-rewound` as the `code`.
- Admission: no new field; `write_admission` stores only a settled answer.
