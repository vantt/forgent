# Phase 03 report: hot record door in holder-lock

Status: DONE_WITH_CONCERNS. Branch `rust-verb-migration-program/s2-p03`. No verb flips.

## What moved
- `packages/holder-lock/rust/src/hot_record.rs` (new): `paths`, `read`/`read_record` (Missing | Retry | Unreadable{token} | Ok{record,token}), `unlink_if_unchanged`, `reclaim_dead`, `clear`. Bytes are an opaque token; reclaim lock taken by path (`acquire`, 1000 ms), judge = `fgos_process::facts::judge_here`.
- Addon (`holder_lock.rs`): `hotRecordRead`, `hotRecordUnlinkIfUnchanged`, `hotRecordReclaim`, `hotRecordClear`; token crosses as `Buffer`. ABI: `holderLock` 2 -> 3 (`lib.rs`, `src/native/door.mjs`, pinned by `test/git/native-load.test.mjs`) - OPC to review.
- `src/state/hot-lock.mjs`: same export names; the four bodies call the addon. `readHotRecord` returns `token` (Buffer) and `raw` (decoded text, messages only). Clear functions accept a token, a read, or text; text (kept only by `lock-fence.mjs` until its port) is matched against the record's current bytes and then cleared by those bytes. Writer, `withStateTx`, `judgeHotRecord` unchanged.
- Contract `hot-lock.v1.json`: `vectors.read` (14 rows), `vectors.clear` (6 rows, incl. invalid-UTF-8 and changed-since-read), `cleanup.reclaimWaitMs`.

## Behaviour notes
- Invalid UTF-8 is `unreadable` in Rust (fail closed); Node decoded lossily and could parse a record with a bad byte inside a string value. The writer never emits such a record.
- Windows `retry` codes map 5 -> EPERM, 32/33 -> EBUSY (libuv's mapping).

## Doors row "read and clear a hot mutex record"
Patterns: Node definitions, `\.reclaim\.lock`, `\bhotRecord(?:Read|UnlinkIfUnchanged|Reclaim|Clear)\b` (the addon entry names; the `.hot` name is a template literal). Allowed: `hot_record.rs`, `holder_lock.rs`, `src/state/hot-lock.mjs`. Debt: `src/runner/lock-status.mjs` (until 04). `retiredBy` S7 writer. Negative case: scratch `src/zz-negative-door.mjs` with `export function clearHotRecord() {}` failed the row ("does the job outside its door"); removed.

## Contended path (requirement 3)
Two processes x 2000 `withStateTx` on `state`, slower process, median of 9, interleaved old/new modules in one tree: old 195.05 / 195.97 ms, new 195.60 / 196.72 ms = +0.3 %. Under 5 %. Per read cost: 4.5 us -> 40 us (addon call + serde to JS), paid only on a collision beside a 10 ms poll.

## Retired tests -> owner now
| Retired (`test/state/hot-lock-tx.test.mjs`) | Owner now |
|---|---|
| a record that changed after it was judged dead is never reclaimed | `hot_record.rs` `a_record_that_changed_after_it_was_judged_dead_is_never_reclaimed` (+ `a_dead_holders_record_is_reclaimed_once`, `an_unreadable_record_is_never_reclaimed_even_with_its_own_bytes`) |
| clearing a record removes only the bytes the person saw | `hot_record.rs` `every_clear_vector_removes_the_record_only_when_its_bytes_are_the_token` over the contract rows; Node keeps one wiring proof (`a torn record that is not valid UTF-8 is read and cleared by its bytes through the addon`) |
`hot-lock-guard.test.mjs` had no judge cases: unchanged. `hot-lock-multiprocess`, `windows-hot-lock`: unchanged, green through the addon.

## Gates
fmt clean; clippy -D warnings (holder-lock, node-addon) clean; `cargo test -p fgos-holder-lock` green (8 new); msvc and darwin `cargo check --locked` of both crates clean; census regenerated (0 undeclared, classes unchanged). 15 Node test files (the phase list plus state-cutover, facade, inspect, propose-classify): 190 tests, 183 pass, 7 skipped (Windows), 0 fail.

## Proposed CHANGELOG line
None needed (no user-visible change).

## Concerns
1. ABI bump above. 2. `lock-fence.mjs` still passes decoded text; phase 05 should pass `seen.token` and drop the text form of `tokenOf`. 3. Docs (holder-lock spec section 15 wording "taken through this facade") left to the close phase.
