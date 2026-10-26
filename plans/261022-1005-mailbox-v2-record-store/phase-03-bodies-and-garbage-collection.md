---
phase: 3
title: "Immutable bodies, safe reads and garbage collection"
status: completed
depends_on: [2]
---

# Phase 3: Immutable bodies, safe reads and garbage collection

## Context

- Plan: decisions 4, 5, 6.
- Spec §5.1 (`body`: "immutable once written and stored apart from the snapshot"), §6.4 ("a body no snapshot references is garbage"; "Directories are only a cache ... never read to decide a state"), §5.5 and V3 decision 3 (a body the store cannot read is framed with `[message.body-missing]`).
- Core: `Header.body_kept`, `Header.body_bytes` (`core/src/envelope.rs:69-71`); the sweep clears `body_kept` after `record.bodyRetentionSec` and removes headers after the header horizon (`core/src/sweep.rs:107-131`); `forget_key` removes headers (`core/src/forget.rs:26`).
- Durable file: `install_once(dir, name, bytes) -> Result<Installed, InstallError>`, `Installed::{Created, AlreadyExists}` (`packages/durable-file/rust/src/lib.rs:15,65`); it creates with `O_NOFOLLOW` and mode 0600 and syncs `dir`.
- V1 review "Readiness for V2" item 2 (body garbage collection, deferred by V1 decision 16): decided here as plan decision 5; the core needs nothing new.

## Requirements

1. `Record::send(req, wait, now, limits)` (the body is `req.body`) and `send_observed`: one hold; core `send`; on `Ok` install `paths.body(id)` with `install_once`; `AlreadyExists` aborts the hold with `RecordError::BodyExists` (code `body-exists`) and installs nothing; then the snapshot; then the orphan sweep (decision 5b). Returns `Ok(Held { value: Ok(outcome) | Err(refusal), .. })`.
2. Every installing hold, after the install, deletes the bodies referenced before and not after (decision 5a). A failed delete is not an error of the hold (the next send sweep retries); it is returned as a count in a `Collected` value for the observer and the cost example.
3. `Record::body` (decision 6): `O_NOFOLLOW|O_NONBLOCK`, `fstat` regular file before reading, read at most `min(expected_bytes, max_body_bytes) + 1` bytes, valid UTF-8, length equal to `expected_bytes`. Signature: `Record::body(&self, id: &MessageId, expected_bytes: u64, limits: &Limits) -> Option<String>`. `ClaimedItem` carries no size, so the shell reads `state.message(&id).map(|h| h.body_bytes)` inside hold 1 and builds V3's `bodies: &dyn Fn(&MessageId) -> Option<String>` closure from it <!-- Updated: Red Team -->.
4. `src/record/bodies.rs` holds 1-3; the hold in `mod.rs` calls it.

## Tests first — `tests/record_bodies.rs` (owning file for bodies)

| # | Test name | Asserts |
|---|---|---|
| 1 | `an accepted send installs its body before the snapshot that names it` | after `send`, `paths.body(id)` exists with the exact bytes and mode 0600; the snapshot header has `body_kept` and `body_bytes` equal; through `send_observed`, the `BodyInstalled` step comes before `Written` |
| 2 | `a refused send writes no body` | `bodies_dir` listing unchanged |
| 3 | `a body is never overwritten` | pre-create `paths.body(id)` for the id a send will mint is impossible to predict, so: install a body file by hand under an id, then call the module's install with that id and different bytes -> `body-exists`, file bytes unchanged, snapshot unchanged (calls the `bodies` function the hold uses, through its public name) |
| 4 | `a body whose header retires is deleted by the install that retires it` | send, claim, finish (offered), then a registration of another head (a hold that sweeps and writes) at `now` past the header horizon: with the contract values the header horizon equals `record.bodyRetentionSec`, so the header is gone (no `body_kept == false` state exists to check), the body file is gone after that same install, and no directory listing happened (no send) <!-- Updated: Red Team --> |
| 5 | `a send removes bodies and temporaries no snapshot names` | plant `<bodies_dir>/<hex>.body` (unreferenced), `<bodies_dir>/.durable-file-1-0.tmp` and `<record_dir>/.durable-file-1-0.tmp` (all paths from `Paths`), plus a file in `mailbox_dir`; after one send the first three are gone, the `mailbox_dir` file stays, and the new body stays |
| 6 | `a hold that only reads leaves orphans for the next send` | same plants; a no-mail claim hold leaves them (no listing on the hook path) |
| 7 | `a planted symlink or FIFO body is never read` | replace a referenced body by a symlink to a file outside the record: `None`; replace it by a FIFO (`mkfifo`): `None` within a deadline (run on a thread joined with a timeout) <!-- Updated: Red Team --> |
| 8 | `a body longer than its header says is not read` | append bytes to a referenced body: `None` |
| 9 | `a body that is not UTF-8 is not read` | `None` |
| 10 | `a symlinked bodies directory is never swept` | <!-- Updated: Red Team --> replace `bodies_dir` by a symlink to a scratch directory holding a regular file; a send returns `record-dir-untrusted` **before** the body install, no new file appears in the scratch directory, the scratch file still exists, and the snapshot is unchanged |

## Steps

1. Tests 1-3 red; implement `bodies::install`, `Record::send`. Green.
2. Tests 4-6 red; implement the diff delete and the send sweep. Green.
3. Tests 7-10 red; implement the safe read and the descriptor-based deletion (`unlinkat` on the checked directory descriptor). Green.
4. Census, commit `feat(mailbox): keep message bodies as immutable files and collect the unreferenced`.

## Gates

As phase 2 (sync, drift, crate tests, clippy, fmt, path-literal search, push).

## Done when

The nine tests are green on a fresh main merge; no listing happens outside send holds (asserted by test 6).

## Risk and rollback

- Deleting every unknown entry in the record directories is safe only because every writer of those directories holds the mailbox mutex; document that invariant in `bodies.rs`. A future file beside the snapshot (V5's breaker file, spec §4.1) must be added to `Paths::is_known` in the same change, or the sweep deletes it; phase 8 writes this into spec §6.4.
- Rollback: revert; phase 2 behaviour stays.

## API drift

None (main unchanged since `487f58426` at the start of this phase).

## Deviations

- The deletion counts are on `Held` (`collected: Collected { deleted, failed }`), because the observer receives a `Step` only.
- A sweep that finds an entry it cannot judge (not a regular file), or a record directory whose identity changed since the hold checked it, deletes nothing. It returns a warning at `Step::Collected`, not `RecordError::RecordDirUntrusted`: the sweep runs after the rename, and the commit-point rule (phase 2) turns every later failure into a warning on a written hold. The per-hold directory check before any write still returns `record-dir-untrusted` (test 10).
- Listing goes through the path (`read_dir`); every deletion goes through a descriptor of the checked directory (`O_DIRECTORY|O_NOFOLLOW`, device and inode equal to the hold's check) with `unlinkat` and no flags, which never follows a symlink and refuses a directory. A `fstatat` regular-file check before `unlinkat` was written and then removed: no test could tell it apart, because the listing already judged each entry and `unlinkat` alone cannot reach outside the directory.
- `bodies::install` is public (module `record::bodies`) so test 3 calls the function the hold uses. Its doc states that only a holder of the lock may call it.
- `Record::body` also runs the per-hold directory check, so a symlinked `bodies/` is never read through. That case was added to test 7.
- Test 8 also proves the `mailbox.maxBodyBytes` cap: a body over the cap is not read even when its header claims that size. It is renamed `a_body_longer_than_its_header_says_or_than_the_cap_is_not_read`.
- Test 4 also proves that a writing hold which is not a send lists nothing: the planted orphans survive it. Test 6 keeps the non-writing hook hold.
- Two tests added for plan decision 5 and red-team finding 1, which no listed test proved:
  - `a_send_that_finds_an_entry_it_cannot_judge_deletes_nothing`.
  - `a_bodies_directory_swapped_during_a_hold_is_never_used_for_deletion`, which uses the observer to swap `bodies/` for another real directory after the check.
- Test isolation: running `record_bodies` 40 times gave 4 runs with `LockBusy` under `Wait::Try`. The cause was a fork in another test of the same binary (the `mkfifo` command, the id-drawing children), which copies open lock descriptions until the child execs. The fix: `TempFgos` holds one guard per test binary for the test's life, and FIFOs are made with `libc::mkfifo`, so no child process is involved. Afterwards, 30 runs of both files had no failure. The production hook is not affected: it runs one hold at a time in its own process.

## Proof

- `cargo test -p fgos-mailbox -p fgos-mailbox-core`: 148 passed, 0 failed. `tests/record_bodies.rs` has 12 tests.
- Mutants against `record_bodies`: 13 tried, 12 killed. They covered `body-exists`, the send-only sweep, the sweep's regular-file rule, the directory identity, the body length, the body cap, the body directory check, the body install, and the snapshot read reused by the bodies. The survivor is counting every header as referenced instead of only those with `body_kept`. It is equivalent under the contract values, because the header horizon equals the body retention, so no header exists with `body_kept == false`.
- After the test-isolation fix, the phase 2 mutants were rerun: the same 6 are killed, each by the test named for its behaviour.

## Later change

Review fix M1 (2026-10-22): the trust check now covers every directory from `.fgos` down, with modes, and the sweep lists through the checked descriptor; see phase 8, "Review fixes".
