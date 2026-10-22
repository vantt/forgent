# Code review: Mailbox V2, the record store

Independent, read-only review. Branch `mailbox/v1-v3` at `9a53299e1`, diff `430dd1bf0..9a53299e1` over `packages/mailbox`, `packages/holder-lock`, `src/holder-lock`, `test/holder-lock`, `docs`. Reviewed 2026-10-22 (Asia/Saigon). Nothing was edited or committed in the repository. All builds, probes and mutations ran in a `git archive` copy at `/tmp/fgos-work/mbx-v2` (build dir `/tmp/fgos-work/mbx-v2-build`, `CARGO_BUILD_JOBS=4`, `--test-threads=4`).

## Scope

- Production code: `packages/mailbox/rust/store/src/record/{mod,paths,os_ids,snapshot,bodies,prune,sys}.rs` (about 1,030 LOC), `store/src/head.rs`, `store/src/hook/limits.rs`, and core changes in `names.rs`, `policy.rs`, `delivery.rs`, `registry.rs`, `counters.rs`.
- Tests: `store/tests/record_{snapshot,bodies,crash,contention,prune,ceiling}.rs`, `tests/common/record.rs`, core tests. Example: `store/examples/mailbox-record-cost.rs`.
- Contracts: the `mailbox` row in `packages/holder-lock/contracts/lock-registry.v1.json`, the schema owner enum, `limits.v1.json`.

## Gates I ran

| Check | Result |
|---|---|
| `cargo test -p fgos-mailbox -p fgos-mailbox-core` | green: 88 store tests, 98 core tests |
| record tests repeated 10 times (`record_{crash,contention,bodies,snapshot,prune}`, 4 threads) | no failure |
| `cargo clippy -p fgos-mailbox -p fgos-mailbox-core --all-targets -D warnings`, `cargo fmt --check` | clean |
| `cargo test -p fgos-holder-lock --test scope_rank`, `-p fgos-event-store --test registry_rows` | green |
| `node --test test/holder-lock/registry-contract.test.mjs` | 24/24 |
| `node --test test/setup/holder-lock-checks.test.mjs` | not runnable here: needs `FGOS_HOST_BIN`. By reading the code: `cutOverLockFiles` covers only `CUTOVER_OWNERS` (4.2/4.3/4.4), so the `mailbox` row never reaches the `LOCK_FILES` throw. Phase 1 reports the file green under the full `npm test`. |
| `unsafe` | only in `record/sys.rs` (`geteuid`, `unlinkat`). Both are sound. The crate is `deny(unsafe_code)`. |
| 24 hand-written mutants (below) | 22 caught, 2 survived |

## Overall assessment

The hold itself is right. There is one write path. The commit point is the rename, and every step before it returns an error while every step after it returns a warning. I checked this against the state machine of `durable-file`'s `write_durably` (`installed: Some` exactly from `name-installed` on). The body is installed before the snapshot that names it. The lock is a CLOEXEC kernel lock on an open file description, and the scope is dropped on every early return. The kill matrix uses a real SIGKILL (`Child::kill`) on a child parked inside the observer at each of the nine steps, and its checks (lock free, old bytes before the rename, exactly the change after it, no header without a body, no orphan after the next send) match its claims. The writes driven by the change report are correct for every core op I traced. Mutation testing shows that the tests catch real breaks.

Two defects block "done". Both come from the edges added at V2: the Q2(b) dead-key skip and the trust check on the record directories.

## Critical issues

None.

## High

### H1. The exact name of a dead head now goes to a different live head (Q2(b) regression). CONFIRMED

- **Where:** `packages/mailbox/rust/core/src/names.rs:115-123` (`resolve_skipping`), used by `policy.rs` `admit` and fed by `store/src/record/mod.rs:374` (`dead_keys: prune::dead_keys(state)`).
- **Failure.** `live()` removes dead bindings from the exact-name step too, so an exact name that belongs to a dead head falls through to the prefix step. Take a dead head named `forgent-codex-9c` that still holds its name, and a new head of the same CLI that wanted suffix `9c`. The new head is given a drawn 3-character suffix. When that suffix starts with `9c` (for example `forgent-codex-9c5`), a send to `forgent-codex-9c` is accepted and recorded for the other, live head.
- **Why it matters.** Before V2 this was impossible: the core has a test for exactly this shape, `exact_short_name_wins_over_a_longer_name_it_prefixes` (core `tests/names.rs:19`). Q2(b) breaks that invariant. Mail written for one agent is silently delivered to another, which is a data-exposure bug between agents. The odds per collision are about 1/256, but the collision itself is the common case: a dead head keeps its name until it is pruned 24 h later.
- **Proof.** A throwaway core test registers `k1` with suffix `9c`, then registers `k2` with suffix `9c` using an id source that draws `0x9c5`. It then sends to `forgent-codex-9c` with `dead_keys={k1}`. Result: `Ok(SendOutcome { to: "forgent-codex-9c5" ... })`, delivered to `k2`. The probe is saved at `/tmp/claude-1000/-home-vantt-projects-forgent/f2c6f8ce-4eb8-43b7-a95a-cd8c36997d45/scratchpad/core_review_probe.rs`.
- **Fix.** The exact step must look at every binding. When the exact match is a skipped (dead) key, refuse with `UnknownName` (or a dedicated `DeadName`) and do not fall through. Skipping should apply only to the prefix and key steps and to the candidate list. Add the probe's case to `core/tests/names.rs` next to the exact-wins test, which owns this behaviour.

## Medium

### M1. A symlinked parent of `record/` steers the sweep and the writes outside `.fgos`. CONFIRMED

- **Where:** `store/src/record/mod.rs:484-510` (`check_dirs`), `mod.rs:552` (`create_below`), `bodies.rs:117` (`open_dir`), and every path-based I/O call (`snapshot::read`/`install`, `bodies::install`, `unnamed` at `bodies.rs:97`).
- **Failure.** `check_dirs` runs `symlink_metadata` on `record/` and `record/bodies/` only, which leaves the final component unfollowed but follows `runtime/` and `runtime/mailbox/`. `open_dir` uses `O_NOFOLLOW` on the last component only, and its dev/ino is compared with the same followed path, so it agrees. `Record::open` treats an existing symlink as `AlreadyExists`.
- **Proof.** A probe made `runtime/mailbox` a symlink to an outside directory holding `record/precious.txt` and `record/bodies/also-precious`, then ran `Record::open`, one registering hold and one `send`. Result: `snapshot.json` was created in the outside directory and the sweep deleted `precious.txt` (assertion failed). The probe is saved at `/tmp/claude-1000/-home-vantt-projects-forgent/f2c6f8ce-4eb8-43b7-a95a-cd8c36997d45/scratchpad/review_probe.rs`.
- **Why Medium, not High.** The attacker needs write access to `.fgos/runtime/` and a target directory that already has a `record/bodies/` shape. Spec §8 item 6 already accepts that an unconfined worker can rewrite the snapshot. But the module's own doc (`mod.rs:480-483`: "a worker that can write `runtime/` must not steer the record's reads, writes or deletions elsewhere") and spec §6.4 claim this protection, and only the last component is protected.
- **Fix.** Prefer descriptor-relative I/O: open `<fgosDir>` once, then `openat` each of `runtime`, `mailbox`, `record`, `bodies` with `O_DIRECTORY|O_NOFOLLOW`, check uid on each, and do every read, temp file, rename, link and unlink relative to those descriptors. This needs dirfd variants in `durable-file`; that is the `tsk-1lx` leaf. The minimum fix inside V2 is to apply the same `symlink_metadata` + uid check to `runtime/` and `runtime/mailbox/` in `check_dirs`, and to list through the checked descriptor (`fdopendir` or `/proc/self/fd/N`) instead of `read_dir(path)`. Add one row to `tests/record_bodies.rs` next to `a_symlinked_bodies_directory_is_never_swept`.

### M2. The snapshot read has no size cap, and every hook reads it whole. PLAUSIBLE

- **Where:** `store/src/record/snapshot.rs:24` (`read_to_end`).
- **Failure.** `body()` caps its read at `maxBodyBytes`, but the snapshot read has no cap at all. The plan's outcome item 7 says so ("its read has no byte cap"). A snapshot made large by a worker or by a bug that forgets to retire headers makes every hook on the machine allocate and parse the whole file. A large enough file runs the hook out of memory, and the hook has to fail quietly. The cost report already measures 7.8 MB at 100 saturated heads, and the hook does that read on every call.
- **Fix.** Cap the read at a ceiling derived from the limits contract (the per-identity header ceiling × bytes per header × the binding bound, or a new contract key with its source written down). Over the cap, return `snapshot-unreadable`, which is never overwritten. This is an owner-visible number, so ask the owner: a decision question, not an invented default.

## Low

- **L1. Two prune clauses survive mutation and look unreachable** (`prune.rs:16`, `prune.rs:22`). Dropping the notice clause from `named` survives. So does replacing `max(last_seen, last_drain_at)` with `last_seen`. Header retention is `max(loop.windowSec, ttlSec, bodyRetentionSec) ≥ ttlSec`, and a notice is created at the same moment its header changes, so a notice never outlives the header that names the same key. A drain stamps `last_drain_at` only while a header or notice names the key. Either add a test that reaches each clause or delete the clause (KISS). As written, they are untested guards. CONFIRMED (mutants survived); reachability PLAUSIBLE.
- **L2. Pruning resets others' "never reset" wake lifetime toward the pruned key** (`core/src/forget.rs:31-32`, `involves(key, None, true)`). A takeover (`drop_generation_records`, `as_recipient=false`) keeps the peers' wake lifetime counts toward the key. A prune followed by re-registration of the same key (for example a Claude session resumed with the same session id after 24 h) clears them. The two ways of losing a head therefore treat the cap differently. Q2 accepts `forget_key` as-is, so this is for the owner to confirm. PLAUSIBLE.
- **L3. Liveness is judged twice per send** (`mod.rs:374` `dead_keys`, `mod.rs:445` `prune`). Both judge stored heads through `/proc`. Compute `dead_keys` once and pass it to `prune`. The cost report's "dead-bindings send" row is the one this affects.
- **L4. Duplicate proof (design principle 8).** `record_snapshot.rs:382` `a_failure_after_the_rename_is_reported_as_written` proves the same behaviour as the `observer_fails_at` rows `Synced` and `Renamed` in `record_crash.rs`, which own it. Retire it and name `record_crash.rs` as the owner.
- **L5. The ceiling test is a core proof in the store crate** (`record_ceiling.rs:51-87`). It builds the whole population with direct `state.send/claim/finish` calls in a single hold and writes once, so the record path is exercised only by the final read-back. Header growth is observable in the core. Either move the test to a core test or drive the windows through `Record::send`, which is what the "record ceiling" name implies.
- **L6. Plan and spec drift on listing.** Plan decision 5 says the send sweep lists "through the checked directory descriptors", but the code lists with `read_dir(path)` (the phase 3 deviation records this). The harm is nil today because `unlinkat` refuses directories and only non-kept names are removed. Close it together with M1.
- **L7. "Only Rust takes it" is not enforced.** The holder-lock spec says only Rust takes `mailbox`, but its `v3Path` is a plain `<fgosDir>` template, so Node's `resolveLock('mailbox')` succeeds. `repo-config` has the same pattern. Reword the spec line, or have Node refuse rows owned by `mailbox`.
- **L8. `check_dirs` does not check mode.** A `record/` directory owned by the user but group- or world-writable passes. Another uid could then plant a non-regular entry and block the sweep (garbage collection only), or replace bodies; body reads are already guarded. Refuse `mode & 0o022 != 0`.

## Focus answers

1. **Crash safety.** I found no torn snapshot, no header naming a missing body, no lost update and no unreleased lock on the process-crash model. "Error before rename, warning after" holds on every path: `snapshot.rs:60-78` maps `installed.is_some()` to a warning, and `bodies::install` failures happen before the rename and only leave an orphan. A failure after `install_once` has linked the body (`temp-removed` or `parent-fsync`) still aborts before the snapshot, which is correct and leaves an orphan for the next send. The kill matrix is real SIGKILL at every observer point. It cannot kill inside `durable-file` between its own points, but those gaps are equivalent to the neighbouring rows for a process crash.
2. **Change report.** `register` returns before any mutation for every refusal and for `Refreshed`; `JudgementMismatch` after the sweep cannot be reached. `claim` returns `changed=false` only before its sweep. `finish` sets `changed = touched`. `send` always counts the attempt. `begin` ORs registration, `note_stop` and the claim together. `note_stop` reports an actual change. Mutants `refreshed-writes`, `finish-always-changed`, `refused-send-unsaved` and `always-write` were all caught. No mutation slips through unwritten.
3. **Concurrency.** Two processes, the wait cap, `lock-busy` with nothing changed, and distinct generations are all proven with real processes and no timing assumptions; 10 repetitions showed no flake. The open-and-check of the snapshot and bodies is safe: `O_NOFOLLOW|O_NONBLOCK` plus `fstat` before any read, and the symlink and FIFO mutants were caught. The weakness is the parent directories (M1).
4. **Pruning and Q2(b).** Liveness is safe: a different host or pid namespace gives `Unknown`, a pid that was reused is caught by start time, and `Unknown` is never pruned. Pruning cannot drop a head that has mail owed, because any header naming the key keeps it. Dead-key skipping creates the misdelivery in H1.
5. **Lock-registry row.** Rank 80 (a leaf) and fence `none` are right: the store takes nothing inside the hold, and there is no legacy path to fence. The Node registry contract, the Rust scope and event-store row tests, and the `cutOverLockFiles` filter all accept the row. The spec tables are updated.
6. **Quality.** Paths are defined once (`paths.rs`). No number is invented in the store: `lockWaitMs` and the Q1 retention are in the contract with their sources. `unsafe` is confined and sound. The tests bite (22 of 24 mutants caught), with L1 and L4 to fix.

### Mutation table

Each mutant ran the whole `cargo test -p fgos-mailbox --tests`. Cargo stops at the first failing test binary, so the "caught by" column names only the first binary that failed.

| Mutant | Result |
|---|---|
| always write / refused send unsaved / `Refreshed` writes / finish always changed | caught |
| no prune / prune ignores liveness / prune ignores named headers / prune ignores idle | caught |
| prune ignores notices / prune ignores `last_drain_at` | **survived** (L1) |
| dead keys empty | caught |
| dir identity unchecked / sweep accepts non-regular entries / `is_known` forgets `bodies` | caught |
| dropped bodies not collected outside a send / collect after a warning / post-rename failure treated as an error / body installed after the snapshot | caught |
| snapshot open blocking / follows symlinks / dir check follows symlinks / body cap removed / body size unchecked / version check removed | caught |

## Recommended actions

1. Fix H1 in `resolve_skipping` and add the case to `core/tests/names.rs`.
2. Fix M1 at least to the minimum (check every component from `<fgosDir>` down, list through the checked descriptor) and add one test row. Open or extend `tsk-1lx` for dirfd-relative I/O in `durable-file`.
3. Raise M2 with the owner as a decision question: the cap on snapshot bytes and where its number comes from.
4. L1: prove or delete the two prune clauses. L4: retire the duplicate test. L3: judge liveness once per send.

## Verdict

**V2 does not yet meet its rung.** Its own proofs pass: atomic visibility and process-crash safety, real lock release on kill, contention and the wait cap, and costs measured against S0. But H1 is a correctness regression that sends mail to the wrong agent, introduced by the Q2(b) wiring that this rung added. M1 contradicts a safety claim made in the module doc and in spec §6.4.

- **Blocks the rung:** H1.
- **Should land with it, or be re-scoped in the spec:** M1. Either fix it, or narrow the claim to "the record directories themselves" and record the parent-directory gap with an owner and item.
- **Does not block:** M2 and everything in Low.

## Unresolved questions

- M2: what cap on snapshot bytes does the owner accept, and from which contract number is it derived?
- L2: should a prune-then-re-register keep the peers' wake lifetime counts toward the key, as a takeover does?
