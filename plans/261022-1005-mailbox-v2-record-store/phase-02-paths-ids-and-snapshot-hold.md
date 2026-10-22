---
phase: 2
title: "Paths, id source and the snapshot hold"
status: completed
depends_on: [1]
---

# Phase 2: Paths, id source and the snapshot hold

## Context

- Plan: architecture section, decisions 1, 3, 7, 12.
- Spec §6.4 ("Every mutation ... take the mailbox mutex, read the snapshot, change it in memory, install the new snapshot, release the mutex"; versioning rules), §5.3 last line of the check order ("the store installs the snapshot after a refusal too").
- Core API: `MailboxState::{new, send, claim, finish, register}`, `SnapshotVersion::check`, `SnapshotVersionError::{Newer, UnsupportedOlder}`, version enforced by `deserialize_with = "current_schema_version"` (`core/src/state.rs:30-80,88,113-119`), `IdSource` (`core/src/ids.rs:9`).
- Holder-lock: `LockScope::seeded(vec![])` then `.acquire("mailbox", &params, wait)` (`packages/holder-lock/rust/src/scope.rs:62,120`); errors `ScopeError::{Acquire(Box<Acquire>), Registry(..), ...}`; `Acquire::{Held, Timeout, Unavailable}` (`port.rs:142`).
- Durable file: `replace_durably_observed(dir, name, bytes, observe)` and `ReplacePoint` (`packages/durable-file/rust/src/lib.rs:179-202`).
- Randomness precedent: `packages/event-store/rust/src/identity.rs:74-80` (`/dev/urandom`).
- V1 review items closed here: "The `IdSource` must be random or otherwise unique across processes" and L7 (version enforced in `Deserialize`, now asserted on disk).

## Requirements

1. `src/record/paths.rs`: `Paths::new(fgos_dir)` with `mailbox_dir`, `record_dir` (`<mailbox_dir>/record`), `snapshot`, `bodies_dir`, `body(&MessageId) -> Option<PathBuf>` (None for an id outside `[0-9a-f]+`), `lock_params() -> BTreeMap<String,String>` (`fgosDir`), `is_known(&OsStr) -> bool` (the snapshot name and the bodies directory name). File names are `const`s private to this module.
2. `src/record/os_ids.rs`: `OsIds::open() -> io::Result<OsIds>`, `impl IdSource`, `failed() -> bool` (plan architecture).
3. `src/record/mod.rs` + `snapshot.rs`: `Record::open`, `Record::hold`, `Record::hold_observed`, the public `Step` enum (phase 4's table) and `Held<R> { value, wrote, warning }`. `RecordError` with stable `code()` strings: `lock-busy` (Held/Timeout, carries waited ms), `lock-unavailable`, `lock-registry` (only for a registry fault; a `create_dir_all` I/O failure that `ScopeError::Registry` wraps is reported as `io`), the core's `SnapshotVersionError::code()` values (`snapshot-newer`, `snapshot-unsupported-older`; no store copy), `snapshot-unreadable`, `ids-unavailable`, `record-dir-untrusted`, `body-exists` (phase 3), `observer`, `io` (step + source). **Every error is raised before the rename and leaves the installed snapshot as it was; a failure at or after the rename returns `Held` with `wrote: true` and a `warning`** <!-- Updated: Red Team: commit point -->.
4. Directories are created with mode 0700; `Record::open` syncs the parent of each directory it created (`sync_directory`). Every hold checks `record_dir` and `bodies_dir` (real directory, not a symlink, owned by the current user) before anything else.
5. No path literal outside `paths.rs`, tests included: tests build `Paths` from their temporary `.fgos`.
6. `record/mod.rs` starts with `#![deny(clippy::unwrap_used, clippy::expect_used, clippy::panic)]`, like `hook/mod.rs:3`: the record runs inside the hook, which must never panic <!-- Updated: Red Team -->.

## Tests first — `tests/record_snapshot.rs` (owning file for the hold)

Shared support `tests/common/record.rs`: a temporary `.fgos` directory per test (under `std::env::temp_dir()`, removed on drop), `Limits` and `HookLimits` loaded the way V3's `tests/limits_contract.rs:8` does (`serde_json::from_value(common::config_section(&common::limits_contract()))`), real `OsIds`.

| # | Test name (behaviour in words) | Asserts |
|---|---|---|
| 1 | `a first hold on an empty record creates the snapshot through the mailbox lock` | after a registering hold, `paths.snapshot()` exists, mode 0600, parses to a state with the binding. That the hold really takes the registry's `mailbox` lock is owned by phase 4 (a) and phase 5 test 5, where the parent takes the same lock through `LockScope::acquire("mailbox", &paths.lock_params(), ..)`; no test spells the lock path |
| 2 | `a hold whose closure changes nothing installs nothing` | snapshot file's inode and mtime unchanged after a hold that calls `claim` on an address with no mail; the closure's return value is still returned |
| 3 | `a refused send is still saved` | `send` to an unknown name returns `Refusal::UnknownName`; a fresh `Record` in the same `.fgos` sees the bumped per-reason counter |
| 4 | `a newer snapshot is refused and left byte for byte` | write a snapshot with `schema_version` 2 (bytes built by editing a real serialized snapshot's version field); `hold` returns `snapshot-newer`; bytes on disk identical |
| 5 | `an older snapshot is refused as unsupported` | version 0 -> `snapshot-unsupported-older`; bytes unchanged |
| 6 | `an unreadable snapshot is refused and never overwritten` | truncated JSON -> `snapshot-unreadable`; bytes unchanged |
| 7 | `a snapshot that is a symlink is never followed` | `snapshot.json` is a symlink to a file outside the record; hold returns `snapshot-unreadable`; target untouched |
| 7b | `a snapshot that is a FIFO never blocks the hold` | `mkfifo` at `paths.snapshot()`; the hold returns `snapshot-unreadable` within a deadline (the test fails, not hangs, by running the hold on a thread joined with a timeout) and the lock is free afterwards <!-- Updated: Red Team --> |
| 7c | `a symlinked record directory is refused before any write` | `record_dir` replaced by a symlink to a scratch directory: the hold returns `record-dir-untrusted` and no file appears in the scratch directory |
| 7d | `a failure after the rename is reported as written` | `hold_observed` whose observer errs at `Renamed`: the result is `Ok(Held { wrote: true, warning: Some(..) })` and the new snapshot is on disk; an observer error at `Synced` gives `Err(observer)` and the old bytes |
| 8 | `the frozen version-1 snapshot still reads` | `contracts/fixtures/record/snapshot.v1.json` (committed in this phase, produced once by a real hold with every field populated: a binding, a message in each state, a notice, counters, budget, lifetime, exchange, wake lifetime) reads into a `MailboxState` and re-serializes to the same `serde_json::Value` |
| 9 | `ids drawn by two processes do not collide` | two child processes (support runner, phase 4 shape) each draw `limits.queue.cap` ids through `OsIds`; the union has no duplicate. (One owning proof for "unique across processes"; a body collision is phase 3's) |

`OsIds` failure (`ids-unavailable`) has no test: the only way to make `/dev/urandom` fail is a test switch, which the rules forbid; the branch is reviewed instead and stated in the phase report.

## Steps

1. Write tests 1-3 (red). Implement `paths`, `os_ids`, `Record::open`, `hold` (lock, read, closure, compare, `replace_durably_observed` with a no-op observer, release). Green.
2. Tests 4-7d (red); implement the version pre-read, the `O_NOFOLLOW|O_NONBLOCK` open with `fstat` before any read, the per-hold directory check, `Step` with `hold_observed`, and the commit-point rule. Green.
3. Test 8: produce the fixture with a one-off run of the test in a "write fixture" mode is **not** allowed (test switch). Instead: build the fixture state in the test with core calls, serialize it once, review it by hand, commit it, and keep the test comparing the committed file against a fresh read-and-reserialize. Green.
4. Test 9 with the child runner from `tests/common/record.rs` (role passed by environment to the test binary's own `child_entry` test, the precedent in `packages/distribution/rust/tests/activation_lock_multiprocess.rs:20-60`).
5. Census, commit `feat(mailbox): keep the record snapshot under the mailbox mutex`.

## Gates

- Start/end sync and HARDEN drift line as in phase 1.
- `cargo test -p fgos-mailbox`; `cargo test -p fgos-mailbox-core`; clippy `-D warnings` and fmt for both crates.
- `rg -n '"snapshot.json"|"bodies"|"record"|mailbox\.lock|runtime/mailbox' packages/mailbox/rust --glob '!**/record/paths.rs'` returns nothing.
- `git push origin mailbox/v1-v3`.

## Done when

The nine tests are green on a fresh main merge and the path literal search is empty.

## Risk and rollback

- `LockScope` returns `ScopeError::Acquire(Box<Acquire>)`; map `Held` and `Timeout` to `lock-busy` and `Unavailable` to `lock-unavailable`. If HARDEN changed `LockScope`, adapt here and note it under "API drift".
- Rollback: revert the phase commits; nothing outside the crate depends on `record` yet.

## API drift

None: no commit on `packages/holder-lock`, `packages/durable-file`, `packages/process`, `src/holder-lock` or `src/runner/dispatch/confinement` between `978fa28e7` and `487f58426`. The V3 API changes (`TestedClis` as a `begin` parameter, `state_changed` on drain results, `QuietReason::WriterMismatch`, `NameDoesNotFit` before the sweep) touch nothing the hold uses: the hold runs any closure and decides the write by byte equality, so `state_changed` is not needed by the store.

## Deviations

- `Record::hold(wait, mutate)` and `hold_observed(wait, observe, mutate)` take no `now` and `limits` yet: nothing in the hold reads them until phase 6's pruning. Phase 6 adds both parameters.
- `lock-registry` also covers a failure to create the lock directory. `ScopeError::Registry` carries only a string for both, so the store cannot tell them apart without matching message text. Splitting them needs a typed error in holder-lock; that is recorded as an idea, not built.
- `unsafe`: no shared leaf offers the current uid or `unlinkat`, which the plan's descriptor-based deletion needs. `lib.rs` goes from `forbid(unsafe_code)` to `deny`, and only `record/sys.rs` allows it, with one call per function (precedents: `packages/secrets/rust/src/file_source.rs:82`, `packages/git/rust/src/driver.rs`). Three crates now hold their own copy of `geteuid`; one shared leaf for it is recorded as an idea (RUL11), outside this lane.
- The `record` module and its tests are `#[cfg(unix)]` (no-follow opens, uid, `unlinkat`).
- `Paths::lock_params()` returns `Option` (`None` for a non-UTF-8 `.fgos` path, reported as `lock-registry`). `Paths::lock_name()` is public so a test can take the same lock without spelling it.
- `Step::Collected` is observed in every writing hold from this phase on. Phase 3 adds the work behind it.
- Test 2 also proves the empty-record case: a hold that changes nothing on an empty record creates no snapshot (the comparison is against the empty state's bytes). This is one behaviour with one test, not a tenth test.
- Tests make a FIFO with the `mkfifo` command, so test code needs no `unsafe`.
- The fixture was produced once by a throwaway test file that ran real holds (two heads, a message in each of the four states, a notice, counters, budget, lifetime, exchange, wake lifetime), reviewed by hand, committed, and the throwaway file deleted. The test also fails if a fixture field becomes empty or a message state is missing.

## Proof

- `cargo test -p fgos-mailbox -p fgos-mailbox-core`: 136 passed, 0 failed. `tests/record_snapshot.rs` holds 12 tests plus `child_entry`.
- Mutants against `record_snapshot`: 9 tried, 6 killed (no-write rule, directory check, version pre-read, no-follow open, non-blocking open, commit point). 3 survived:
  - owner check: proving it needs a directory of another uid, which needs root.
  - regular-file check: for a FIFO or a directory, the read or the parse refuses anyway. The check keeps a hostile FIFO's bytes unread, as plan decision 6 requires.
  - `ids.failed()`: the plan states this branch is reviewed, not tested, because forcing it needs a test switch.
- The path-literal search is empty.

