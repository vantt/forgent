# Retained Land candidates in doctor (owner decision: doctor visibility only)

Date 2026-10-21, branch `git/followups`. Supersedes the earlier NEEDS_CONTEXT version of this report.

## What changed

- Rust read (`packages/git/rust/src/recovery.rs`): `list_retained_land` lists live terminal Land chains. A chain is compacted only after Work's acknowledgement releases the candidate, so a terminal live Land chain is the retention marker. Each row: operation id, candidate worktree path, whether it is still on disk, candidate pin ref, WAL last-change time (ms). No WAL yet means an empty list. Read-only.
- Addon: one dispatch arm `listRetainedLand` in `packages/git/node-addon/src/git/recovery.rs`, next to `listPending`; Node name added to `src/git/recovery.mjs`. Not touched: `lib.rs`, `Cargo.toml`, `native.mjs`, `git.rs` (the Recovery dispatch lives in `git/recovery.rs`, outside the files the coordinator reserved).
- Doctor: `checkLandRetainedCandidates` in `src/setup/git-checks.mjs`, registered as check `git-land-recovery` (the id of the existing fix, so one row has check and fix). Pass when none; pass with a `warning:` message (the repo's warn convention) listing id, path, pin and age when any exist; the message states no manual release command exists today and the sweep comes with the Work lane. Never fails for retention.
- Reused: Recovery port and addon door, `listPending`'s scan, `fixLandRecovery` row id. No new scanner, no release verb, no cleanup.
- Spec: new `git-land-recovery` row in the doctor table, `listRetainedLand` in the Recovery contract text, and a "Deferred: release of retained Land candidates" paragraph. CHANGELOG line, doctor registry doc list, mutation census regenerated (`--write-census`).

## Proofs (principle 8)

- Rust owning proof: extended `current_target_is_pinned_after_destination_acquisition_and_replays_after_cleanup` (tests/land.rs): listed after publish, empty after acknowledgement.
- Node wiring proof: `doctor warns, never fails, about a finished Land whose candidate is still retained` (test/git/recovery.test.mjs): pass before, warning after.
- `test/setup/checks.test.mjs` registered-id list gained `git-land-recovery`.

## Gates

- `cargo clippy --workspace --all-targets -- -D warnings`: clean. `cargo test -p fgos-git`: all ok.
- Full `npm test` with the tracked `.fgos/config.json` restored for the run (stub restored and skip-worktree re-set afterwards, not committed): 8678 pass, 0 fail.
- `suite: 581 files, 8088 test() calls, 489 s wall (baseline 581 / 8087 / 202 s at 78334ff1d)`

## Notes

- A candidate whose worktree was already removed but whose chain is not yet compacted shows as "already gone".
- Compaction of an interrupted release is outside this read; such a chain still lists until Land resumes it.

Status: DONE

## Review fixes

- Pins: Land holds three pins, `refs/fgos/git-operations/<id>/candidate`, `<id>/source/candidate`, `<id>/target/candidate` (land.rs install loop and the publish check). The read now resolves each and returns `pins` with only those present; doctor prints them.
- False positives: a Land chain with no intent record (refusal before the candidate exists) is terminal in the scan, so it is now skipped via `known_id` (it would also have errored in `inspect`). A chain whose worktree and all pins are already gone is skipped too. The Rust test asserts the three pins; the Node test asserts the pins text.
- Gates: clippy clean, `cargo test -p fgos-git` ok, `test/git/recovery.test.mjs` 4/4, census regenerated.

Status: DONE
