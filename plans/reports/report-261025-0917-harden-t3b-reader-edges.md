# HARDEN T3 part 04b: Event Store reader edges (fixes for the red tests)

Branch `harden/t3b-reader-edges` from `harden/t3b-red-tests` `c04e220f8`. Code commits `40384475a` and the WORK review round after it (see "WORK review round"). For WORK review before landing. Written by the reader-edges lead; committed by the big lead, who re-ran `cargo test -p fgos-event-store` (all 30 targets green, load 0.2).

## Changes per item

1. **One stream listing; a missing root is empty.** `Layout::streams()` (`layout.rs`) lists the stream directories, sorted, and returns none when the open root is missing. The four old copies are deleted and every caller uses it: `receipt::own_bounds`, `seal::known_receipt_tip`, `sync` (stream loop and `unpublished_summary`), and `diagnostics` (`maintenance`, `status`). `read_without_a_store_root_is_empty_history` is green.
2. **Write refusal names `fgos setup`.** `locks.rs` said `locks must be an existing 0700 directory; run setup fix`. It now says `<dir> must be an existing 0700 directory; run fgos setup`. The existing `missing_wide_and_symlink_lock_dirs_refuse` (`append_recovery.rs`) asserts it on the missing-directory case. No new test.
3. **Skip and name.** New field `ReadResult.skipped_mirrors: Vec<SkippedMirror { ref_name, machine, code, detail }>`, serialized camelCase.
   - A peer's mirror (under `refs/fgos/remotes/`, for a machine other than `ReadRequest.machine`) that fails is left out of the answer and named. Every event ref outside `refs/fgos/remotes/`, the mirror of `req.machine`, and a mirror that names no machine stay fatal.
   - Applied in the ref listing (invalid machine name, symbolic ref), in the mirror walk through one `verify` closure (tampered header or scope, oversize blob, forged own-origin claim, any other verification error), and in the rewind check, which now runs before `verify_retained`.
   - A rewound or vanished peer mirror falls back to the tip the cursor or checkpoint already authenticated and is named `event-store-mirror-rewound`. `cursor.mirror_tips` keeps that tip, so a long-lived reader gets the same answer on its next read.
   - The four red tests are green, and each also asserts that the mirror is named with its code. The read memo stores and replays `skipped_mirrors`.
4. **Surface.**
   - The addon read result carries `skippedMirrors` (only the read `json!` changed).
   - `diagnostics::status` carries `skippedMirrors`; its stream-discovery walk skips refs it cannot walk, because the reader verifies every ref again and fails or names it.
   - The status already carried `sync.warnings`, but no doctor row read them. `event-store-integrity` now fails on persisted integrity errors, on each skipped mirror (`<code> <ref>: <detail>`) and on each sync warning (`sync: <warning>`), except `event-store-machine-ref-shared:`, which stays the machine-id row's warning.
   - `readWorkState` drops the retained catch-up when the store refuses a read, and writes each skipped mirror and any `checkpoint.ignored` to stderr as `fgos: warning: ...` once per process per distinct note.
5. **Setup fix modes.** `fixEventStoreLockDirs` checks `fgos`, `fgos/events` and `locks` in the Git common directory, creates any that is missing, and sets all three to 0700.

## Deviations, for WORK review

- **Red test 3 setup (`checkpoint.rs`).** Publishing the peer mirror through this fixture also writes and rewinds the local ref `refs/fgos/events/test-bb`, which must refuse because refs outside `remotes/` stay fail-closed, so the test could never pass. It now plants the mirror with `plant_foreign_mirror` (moved to `reader_support`). Its intent and the event-2 assertion are unchanged; it also asserts `checkpoint.continued` and the naming.
- **Own machine (superseded in the review round).** The first commit inferred "own" from the refs outside `remotes/`; WORK asked for the request to name it, which is now done (below).
- **Item 5 limit.** Git's WAL (`open_trusted`, mode & 0o022) refuses an existing group-writable `fgos` inside `eventStoreFacts`, before the fix can read the open root. Setup repairs `fgos/events`, `locks`, and an `fgos` that is not group-writable, and creates a missing tree private, but cannot reach an existing 775 `fgos`. The test pins that limit. It belongs with OPC's Git hand-off: the renamed refusal should name the `chmod`.

## Tests driven by each changed route

- **Reader** (`read`, `read_checkpointed`, `read_with_view`): Rust `append_recovery`, `checkpoint`, `cursor_incremental`, `kill_append`, `legacy_import`, `legacy_reader`, `offline_sync`, `reader_review_regressions`, `reader_seal_stress`, `read_head_children`, `read_memo`, `seal_checkpoint`, `shared_machine_id`, `sync_review`, `three_clones`, `v_event`, `walk_certified`, and `fgos-work-state`; Node `facade`, `work-gate`, `work-conflicts`, `topologies`, `verbs`, `store-hardening`, `migrate`, `import-legacy`, `background-seal`, `state/porting-store`. All green. Not run: `background-seal-confined`, `runner/merge-land`.
- **Status and the integrity row:** `setup/event-store-checks`, `setup/checks`, `event-store/verbs`, `reader_review_regressions`. Green.
- **`Layout::streams` users:** `sync_review`, `offline_sync`, `three_clones`, `seal_*`, `v_event`, `kill_append`. Green.
- **Lock-dir refusal:** `append_recovery::missing_wide_and_symlink_lock_dirs_refuse`.
- **Setup fix:** `setup/event-store-fixes`, `setup/event-store-checks`.

## Retired or adapted tests

- `cursor_incremental.rs` `mirror_rewind_refuses_and_preserves_the_previous_cursor` is replaced by `a_rewound_mirror_keeps_the_peer_baseline_and_refuses_for_the_own_machine`, which now owns the retained-cursor rewind behaviour: a peer mirror keeps its history over two reads and is named; the own machine refuses and leaves the cursor unchanged (the old assertions).
- Extended in their owning files: `work-gate.test.mjs`, `event-store-checks.test.mjs` (a real bad ref on the bare remote plus `syncUseCase`), `event-store-fixes.test.mjs`.

## Commands and results

Environment: `PATH=$HOME/.cargo/bin:$PATH CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/harden-t3b-reader-edges-target`.

| Command | Result |
|---|---|
| `cargo test -p fgos-event-store` | all green (1 ignored, as before) |
| `cargo test -p fgos-work-state` | 10 passed |
| review round: `cargo test -p fgos-event-store`; `-p fgos-work-state`; clippy `-p fgos-event-store -p fgos-node-addon -p fgos-work-state --all-targets -D warnings` | all green (regressions 22 incl. the new test); 10 passed; clean |
| review round: `runChosenTests` on all 13 Node files above | 170 pass, 1 fail: the same facade admission red test |
| `cargo clippy -p fgos-event-store -p fgos-node-addon --all-targets -- -D warnings` | clean (vendored `arraydeque` warnings only) |
| `runChosenTests`: `event-store-fixes`, `work-gate` | 26 pass |
| `runChosenTests`: `verbs`, `work-conflicts`, `topologies`, `store-hardening`, `migrate` | 42 pass |
| `runChosenTests`: `import-legacy`, `porting-store`, `background-seal`, `setup/checks`, `facade`, `event-store-checks` | 102 pass, 1 fail: the facade admission red test, fixed on `harden/t3b-admission-platform` |

## WORK review round

1. **Own = `ReadRequest.machine`.** New field `machine: &str` on `ReadRequest` (and `ExportRequest`, which builds one). Every construction moved in the same change:
   - production: the addon read and export (`self.machine` via `context`), `packages/work-state/rust/src/event_reader.rs` (its resolved machine id), `diagnostics::status` (its `machine`), `export::query` (`req.machine`);
   - tests: `checkpoint`, `cursor_incremental`, `legacy_import`, `legacy_reader`, `read_head_children`, `read_memo`, `reader_review_regressions`, `seal_checkpoint`, `sync_support` (`self.machine`), `v_event` (`a.machine`).
   The refs-outside-remotes inference (`Listed.own`) is deleted; `Listed::skip` takes `req.machine`. New test `a_tampered_mirror_of_the_own_machine_fails_a_clone_with_no_own_ref` (`reader_review_regressions.rs`): no own ref, a planted `refs/fgos/remotes/origin/events/test-aa` whose header names another machine, `req.machine = test-aa` → `event-store-ref-tampered`. The cursor rewind test now plants the mirror in both cases and picks `machine` (`test-aa` = peer, `test-bb` = own) instead of publishing an own ref.
2. **One walk per mirror.** Stops are chosen first: a mirror not in `retained_cursor.mirror_tips` gets empty stops, a seen one gets `certificates`; the one walk feeds both the events and `own_origin_bounded`. The full walk's events are still filtered by the coverage `base`, so it adds no event the stopped walk would not, and no duplicate of the retained history; `visited` is only collected. Equivalent to the code before this branch, which also verified an unseen mirror from its roots for the bound.
3. **Rewound baseline whose object was gc'd (from the code, no test).** After a rewind the tip is replaced by the baseline oid, and `descends` failing (missing object) is treated the same as a rewind. Then:
   - when the caller (or checkpoint) holds the history and the baseline is certified under that name (`unchanged`), the baseline is never read: its events come from the retained history, so they stay in the answer and the mirror is named once, `event-store-mirror-rewound`;
   - otherwise (no held history, or the baseline was not certified) the baseline is walked, the walk fails on the missing object, the tip is removed and named a second time with that error (`event-store-io`, Git), and its events drop out of the answer, as WORK described.

## Net line counts (code commit)

- Rust src: +262 / −194, net +68. The four deleted listings saved about 60 lines; `read.rs` grew about 90 net for the listing, skip and rewind fallback. Skip-and-name is new reader behaviour the owner approved (decision 33).
- Rust tests, Node code and Node tests: +240 / −94.
- Review round, Rust src incl. work-state and addon: +31 / −30, net +1. Branch total Rust src: +256 / −192, net +64.
