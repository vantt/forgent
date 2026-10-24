# HARDEN T3 part 04b council: speed seat (Event Store)

HEAD `52149c6cd` (branch `main`; the brief named `c7522c86d` or later, and the later commits are docs only: `git diff c7522c86d 52149c6cd --stat` touches the board log, the brief, a guide and the baseline). 2026-10-25 00:18 to 01:20 (Asia/Saigon). Seat: speed and weight. Read-only in `/home/vantt/projects/forgent`: no verb that appends, seals, syncs, fetches, migrates or rebuilds was run there, and no file except this report was written. Everything that ran was in throwaway clones under `/home/vantt/projects/forgent-worktrees/t3b-seat-speed-*` (ext4) with a private `FGOS_STATE_HOME`, a private bare "remote" on disk, and two private Cargo targets (`t3b-seat-speed-target`, `t3b-seat-speed-target-base`). All of them are deleted at the end (see "Cleanup").

## What I ran

- Source read: `bin/fgos.mjs` lifecycle (4804-4831, 5230-5300), `src/event-store/{maintenance,native,seal-coalescing,consumers}.mjs`, `src/state/{hot-lock,consumer-event-gate,work-event-store}.mjs`, `src/cli/detached-child.mjs`, `src/verbs/events/{sync,seal,context,status}.mjs`, the Rust `append.rs`, `fsio.rs`, `locks.rs`, `seal.rs` (first 330 lines), `sync.rs` (first 330 lines), `read.rs` (read entry), `receipt.rs`, the addon `event_store.rs` (first 260 lines), `packages/holder-lock/rust/src/port.rs` (acquire), the Git driver's timeouts, and the benchmark `scripts/event-store/v-spawn-bench.mjs` plus `store-increment-worker.mjs` (all of both) before running it.
- The repository's own work-gate benchmark, `node scripts/event-store/v-spawn-bench.mjs --work-gate --strace --sessions 1,10,15,20`, in a clone, with the addon rebuilt as **release** (the script always builds debug: `scripts/lib/git-addon-stage.mjs:40` and `:46`; in my clone only, I changed those two lines to `--release` and the `release` directory).
- A harness of mine (`scratchpad/bench/harness.mjs`) that reuses the benchmark's fixture and its worker byte for byte but spawns the workers without `strace`, so strace is separable from the result. 12 runs at 20 sessions, plus 6 runs under strace.
- An interleaved A/B (base and one prototype, section 3.4), 11 pairs at 20 sessions and 5 pairs at 1 session.
- A store-only worker that takes no Node hot mutex (section 3.5), 3 runs at 20 sessions.
- `strace -f -T -yy` on fsync per append; `strace -f -ttt -e execve,exit_group,fsync` for the git census of `list`, `sync`, `seal` and the seal child; `strace -c -f` for `list`; `node --cpu-prof` for `list`.
- The release host (`cargo build --release -p fgos`) staged next to the staged addon, against a clone of this repository with `refs/fgos/*` fetched from the local repository (no network, no remote): 12 timed runs each of `fgos list`, `fgos show tsk-5ui`, `fgos help`.
- `cargo test -p fgos-event-store --test p02_review --test append_recovery --test kill_append` in the prototype clone (private target).
- Not run: `perf` (refused, no permission), the activated-release `fgos` against any real project (every legacy-node verb that is safe needs a project, and `list`/`events status` sync), `npm test`, `cargo test --workspace`.

Load average (1 min) beside each group: the machine is shared with other sessions, so the floor was 3 to 7 during my runs and the 20-session runs add about 20 Node processes of their own. Per group: first official benchmark 6.4 to 6.5; 12 no-strace runs at 20 sessions 6.6 to 9.3 (the first single run before them, `a`, was at 3.7); 6 strace runs 10.9 to 15.7; interleaved A/B 3.4 to 7.7; read-path timings 3.0 to 3.3; sync and seal probes 0.9 to 1.0. Where it matters I say so.

## Answers in one table

| Question | Answer | Evidence |
|---|---|---|
| What do the 11 git children of `fgos list` do, which repeat? | 2 `var`, 2 `config --list`, 1 `rev-parse`, 1 `for-each-ref`, 3 `cat-file --batch -Z`, 1 `cat-file -t`, 1 `ls-tree -r -t`. Repeats: the two `var`, the two `config`, and the three `cat-file --batch` (one process could serve all three). Each is wrapped in a `bwrap` (12 `bwrap` plus one `bwrap /bin/true` probe). | section 1.1 |
| Why does a read verb sync, whose rule is it? | The store's rule is "a trigger runs at the start and end of every command that opens the store" (spec 16). `opensEventStore` (`bin/fgos.mjs:4826-4831`) includes every Work read verb, and the end trigger (`bin/fgos.mjs:5299`, `src/event-store/maintenance.mjs:44-46`) runs the sync **inline in the main process**, after the answer is printed but before exit. The placement is the CLI's choice; the seal already moved to a detached child. Cost when not due: 1 to 3 ms. When due (once per 300 s per clone): 0.77 to 0.90 s locally with 96 git children and 166 fsyncs, 2.1 s with the real remote (baseline). | section 2 |
| Per-append fsyncs, are they all needed? | 3 per append: store root directory, stream directory, active file. Each of the root-directory and file fsyncs costs 5.2 to 7.9 ms on this ext4; the stream-directory one costs about 0.01 ms. The two directory fsyncs are redundant once any earlier writer has finished the same chain (proof in 3.3). Removing them took append p50 from 16.2 to 8.4 ms (1 session) and hold p50 at 20 sessions from 50.4 to 34.3 ms. | section 3.2 to 3.4 |
| 20-session `hot-lock-timeout`: real limit or artefact? | **Real limit, not a dev-profile or strace artefact.** Reproduced on a release addon without strace in 21 of 24 runs (87 %), under load 3.7 to 9.3. The cause is an unfair polling lock: wait times are exponential-shaped (p50 0.2 to 0.3 s, p95 2.4 to 3.6 s, max 4.2 to 5.0 s against a 5.0 s bound), and a hold of about 50 ms over 19 competitors predicts a failure in most 200-acquire runs. About 40 % of the hold is the 8.5 MB view write, which is not store work. | section 3.1 |
| Does the Event Store still need the Node hot mutex? | Not for its own invariants: the append lock (rank 70) and the own-position check (`append.rs:197-203`, `StaleCursor`) already serialize and detect a stale cursor. A store-only worker with no hot mutex did 200 mutations from 20 sessions in 2.6 s with 0 timeouts (the same fixture under the mutex: 7.8 to 11 s and failures). The state store still needs the mutex for the files and claims it writes. | section 3.5 |
| Node startup (0.45 s) against store work | Not reproduced. Staged release host to Node start: 44 ms. `node bin/fgos.mjs help`: 122 to 141 ms (bare `node -e 0`: 16 to 26 ms). In a `list` profile (806 ms), `readWorkState` is 574 ms (71 %); of that, native `store.read` is 465 ms, `foldEvents` 107 ms. ESM compile and import is 88 ms (11 %). The 240 ms host gap in the baseline timeline was not reproducible with a staged host and I could not run the activated one safely. | section 4 |
| Detached seal child | Bounded and cannot loop: it takes the seal lock with a 5 s wait, every git call has a 30 s deadline (transport 120 s), no timer. 655 to 683 ms wall for one open event (32 git children, 63 fsyncs, 11 runs, load 0.9); 158 to 240 ms when nothing is open. It is a detached session leader by design, so it survives its parent; it cannot outlive roughly one second of work unless git hangs for 30 s. It about doubles the CPU of a Work command. | section 5 |
| Fresh clone `event-store-io: NotFound` | One missing `NotFound` arm: `packages/event-store/rust/src/receipt.rs:91`. | section 6 |

## Part A: target shape (speed lens only)

Target: **the store does nothing on the CLI's critical path that a user cannot see the point of.** Within existing code:

- **Authority.** The store stays the authority for append durability, the seq/cursor rule, seal, sync and the read verification. The pacing of triggers (when a sync runs, in which process) is a CLI policy and moves out of the main process: the main process appends, prints, hands the seal to the detached child (already so) and also hands a due sync to a detached child. The store keeps `opportunistic` (try the seal lock, skip when held; `src/event-store/native.mjs` `sync`, `locks.rs:75-105`, used by `sync.rs:272`) as its one mechanism for this.
- **Ports and the Rust/Node boundary.** Unchanged. The two measured Node costs on the hot path that belong to the facade are `JSON.stringify(folded)` per read (`native.mjs:97`; 11 ms stringify plus 4 ms parse for 1000 events of 8.5 KB, long-lived processes only, a fresh CLI passes `[]`) and `historical()` re-parsing every legacy `raw` (30 ms in the `list` profile). Both fall away with the legacy mirror (H33 and import); neither needs a new mechanism.
- **Per-append durability cost.** 1 fsync (the active file) in steady state, 3 only until the stream's first event exists, or when the stream directory is created (S-1 below). Append p50 near 8 ms instead of 16 ms on this disk.
- **Hot gate.** The hold of the state mutex is the store's append plus the consumer's persist. Target hold at most 35 ms p50 at 20 sessions (measured 34 ms with S-1 alone), and no timeout under the spec's own acceptance row. The mutex stays the state store's; two bounded shapes for it are listed under S-2.
- **Node budget.** No new Node file. The speed changes touch `bin/fgos.mjs` (a sync hand-off beside `handSealsToChild`) and `src/event-store/maintenance.mjs` (one branch), net about +15 lines and no new export; the Rust changes are `append.rs` (about +4 lines) and the `NotFound` arms.
- **Delete list (speed lens).** The inline sync call in `maintainEventStore` once it moves (`maintenance.mjs:44-46` keeps only the due check); the `retained`/`JSON.stringify(folded)` round trip when the legacy mirror is gone.
- **Doctor rows kept.** All ten. `event-store-sync` and `event-store-unsealed` already report what the hand-off leaves behind; no new row.
- **Size target.** No growth; the changes above are net about +20 lines.

## Part B: findings

Each finding: id, axis (A to G of the criteria proposal), severity, reproduced or inferred, `file:line`, what goes wrong, fix shape.

### S-1 Two redundant directory fsyncs on every steady append

- **Axis C. Severity Medium. Reproduced.**
- `packages/event-store/rust/src/append.rs:135-151` (`prepare_stream`, called from `append.rs:196`): lines 148 and 150 fsync the store root and the stream directory on every append. Measured by `strace -f -T -yy` (40 appends, one writer): per append `fsync(.git/fgos/events)` 5.2 to 7.9 ms, `fsync(.../project)` 0.01 ms (once or twice 5 ms), `fsync(.../project/active.jsonl)` 5.2 to 8.1 ms. The root-directory fsync costs as much as the file fsync although nothing in it changed (the strace window between two appends contains no create, rename or unlink in that directory).
- The comment above the lines says why: a predecessor may have died after `mkdir` but before the sync. That reason holds only while no event of the stream exists. **Proof by induction:** every writer runs `prepare_stream` to completion before it writes its first byte (`append.rs:196` then `:253-270`), so bytes in `active.jsonl`, or a receipt `sealed.json` (written by a seal, which runs `prepare_stream` first, `seal.rs:141`), prove an earlier writer finished both syncs, and a durable directory entry stays durable. The two syncs are needed only when the stream directory was just created, or when no event or receipt exists yet.
- **Prototype (clone only, not in the repository):** skip both syncs when `!created && (active.jsonl is non-empty || sealed.json exists)`. Four lines. strace per append: 1 fsync instead of 3 (41 fsyncs for 40 appends). Interleaved A/B, release addon, same fixture:

  | | append p50 | hold p50 / p95 (state mutex) | elapsed, 200 mutations | runs with a timeout |
  |---|---|---|---|---|
  | 1 session, base (5 runs) | 16.2 ms | 35.1 / 44.4 ms | 21.1 s | 0 of 5 |
  | 1 session, prototype (5 runs) | 8.4 ms | 25.7 / 35.9 ms | 19.3 s | 0 of 5 |
  | 20 sessions, base (11 runs) | 27.2 ms | 50.4 / 62.8 ms | 10.9 s | 9 of 11 |
  | 20 sessions, prototype (11 runs) | 11.2 ms | 34.3 / 44.1 ms | 7.8 s | 4 of 11 |

  Load 3.4 to 7.7 over the pairs (interleaved, so both variants saw the same load). The 1-session elapsed is dominated by the outside-the-gate work (about 105 ms per mutation against a 35 ms hold), so it moves little.
- **Tests.** Of the three crate suites I ran against the prototype, one test fails by design: `tests/p02_review.rs:76-111`, `steady_append_performs_three_real_fsyncs_and_no_hint_replacement` (`assert_eq!(count.0.get(), 3)`), the pinned count. `interrupted_stream_creation_requires_root_barrier_before_ack` (`p02_review.rs:147`, a stream with `closed/` and no `active.jsonl`) and the whole kill matrix (`append_recovery`, `kill_append`: 19 plus 9 tests) stay green. SIGKILL tests do not prove power-loss durability (the spec says so, `docs/platform/event-store/spec.md:648`); the argument is the induction above, so WORK should review it as a semantic change (owner rule: WORK owns store semantics). The pinned count is a recorded decision, so reversing it needs the new evidence this finding carries (a measured 5.3 ms per append for a sync that proves nothing).
- Mechanism of the 5 ms is **not proven**: it is consistent with a device cache flush on a directory fsync of a clean inode on ext4/NVMe; I measured only the durations.
- **Fix shape.** The four-line condition in `prepare_stream`, the pinned test changes to name two cases (steady: 1 fsync; first event or created stream: 3), nothing else.

### S-2 The 20-session acceptance row fails with `hot-lock-timeout`: a real limit of an unfair polling lock

- **Axis B (and the spec acceptance row 17(a)). Severity Medium (High for the spec row; real use is far below this load). Reproduced on a release build, without strace.**
- `src/state/hot-lock.mjs:198-212` (`acquireRecord`): every waiter retries `link()` every 10 ms (`:33`) and gives up at 5 000 ms (`:32`). There is no queue, so each release is a lottery among about 19 pollers. Observed per-acquire waits at 20 sessions (no strace, 12 runs, load 6.6 to 9.3): p50 189 to 254 ms, p95 2.3 to 3.6 s, max 3.8 to 5.0 s. A fair queue would give every wait about 19 times the hold (0.95 s) and a max near 1.2 s; the observed spread (median far below that, tail far above) is the exponential shape of a lottery. Back of envelope: mean wait 0.95 s, P(wait > 5 s) is about e^-5.3 = 0.5 % per acquire, so 200 acquires fail at least once with probability about 63 %. Observed: 12 of 12 runs had at least one failed worker (27 failed workers in total), and across all 24 no-strace runs at 20 sessions 21 failed (87 %); only one run at load 3.7 passed (its max wait was 4 894 ms, 106 ms short).
- **Not artefacts:** the official benchmark on the release addon under strace failed at the 15-session row (`worker 13: hot-lock-timeout`, `scratchpad/bench/rel-strace-1.log`); under strace 2 of 6 runs at 20 sessions failed, without strace 21 of 24 did. The baseline's dev-profile run failed once; the release profile does not fix it. The spec's acceptance row is "200 mutations in 60 s with 0 spawns and p95 store increment at most 50 ms"; elapsed (about 11 s) and p95 pass, the failure is a worker throwing.
- What holds the gate (release, 20 sessions, medians): hold 50 ms = append 27 ms (3 fsyncs, contended) + `cacheWrite` 20 ms + 3 ms. `consumer-event-gate.mjs:68-79` runs `store.append` (`:71`) and then `persist` (`:79`) inside `withStateTx`; `work-event-store.mjs:76-82` writes the whole serialized view (8.46 MB in the benchmark fixture) to `.fgos/state.json` while the mutex is held, though the events are already durable at the ack. The mutex is held across both fsyncs and a multi-megabyte write.
- **Fix shapes (bounded, the mutex stays the state store's; WORK and the state-store owner decide):**
  1. S-1 alone cut the hold by 32 % and the timeout runs from 9 of 11 to 4 of 11.
  2. Take the view write out of the mutex, or write only what changed. Arithmetic, not measured: removing the 20 ms of `cacheWrite` from a 34 ms hold would leave about 14 ms, which makes the lottery's mean wait about 0.27 s and a 5 s timeout vanishingly rare. The consumer already validates its cache against the read's cursor (`work-event-store.mjs:30-38`, `sameFoldedHistory`), so a stale or missing cache costs a refold, not a wrong answer. This is a state-store change, so I only name it.
  3. A fair hand-off in `acquireRecord` (a ticket directory or a queue file, lowest live ticket tries) would bound the wait at about N times the hold. It is a new mechanism on the state store's lock, so it is listed under proposed additions, not recommended first.
  4. Do not raise the 5 s bound: it only moves the cliff.

### S-3 A due sync runs inline on the critical path of a read verb

- **Axis C and B. Severity Medium. Reproduced (cost); the worst case is inferred.**
- Placement: `bin/fgos.mjs:4826-4831` (`opensEventStore`) returns true for every verb in `STORE_MISSING_WARNING_VERBS` (`:4804`, `list`, `show`, `ready`, `graph`, ...); the `finally` block (`:5293-5300`) runs `handSealsToChild()` and then `maintainEventStore(..., { end: true })`, which calls `store.sync({ opportunistic: true })` (`maintenance.mjs:44-46`) when `syncDue` (`maintenance.mjs:11-17`, interval 300 s from `src/event-store/config.mjs`). The answer is already printed, but the process does not exit until the sync ends, so a caller that waits for exit (a script, a harness, an agent tool call) waits.
- Cost, measured in a fixture with a local bare remote (so it excludes network): steady sync with nothing to publish, 12 runs, 766 to 904 ms (median about 830 ms, load 1.0); `strace -f`: 96 git children (44 `bwrap`), 166 fsyncs. Census by subcommand: 22 `for-each-ref` (the same ref listing repeated by each walk), 9 `symbolic-ref`, 7 `cat-file --batch` and 7 `--batch-check` (one spawn per walk page), 6 `config --show-scope`, 4 `remote`, 4+3 `rev-list` pages, 2 `fetch`, 3 `ls-remote`, 1 `push`, 3 `show-ref`, 2 `update-ref`. Measured with the real remote by the baseline: 2.97 s against 0.84 s for one `list`, so about 1.3 s of that is network and remote.
- When not due, the whole end trigger is 1 to 3 ms (`maintainEventStore` 1.1 ms inclusive in the profile), so this is a once-per-300-s cost per clone, not per command.
- Worst case, **inferred from the code**: every transport call has a 120 s deadline (`packages/git/rust/src/remote.rs:90`, `driver.rs:578-619`), and a sync does a fetch and then a push. A black-holed network can therefore hold a finished `fgos list` for up to about 240 s, once per interval, because a failed attempt still counts as an attempt (`maintenance.mjs:11-17` compares the last attempt, not the last success; the spec says "last successful push" at section 14, which is a mismatch in the safe direction).
- Spec: section 16 already moved the seal to a detached child ("a CLI command no longer waits for the seal", 2026-10-24); the sync stayed inline.
- **Fix shape.** In `finally`, when a sync is due, hand it to a detached child the same way (`spawnDetachedCli({ args: ['events', 'sync', ...] })`, `src/cli/detached-child.mjs`). The child must not queue behind a held seal lock and must re-check "due" under it, or a burst of commands spawns a burst of full syncs. The facade already has that mode (`sync({ opportunistic })`, `native.mjs`), but the verb `events sync` (`src/verbs/events/sync.mjs:2-6`) does not expose it: the minimal change is one option on that verb. That is a tiny addition, so it is also listed under proposed additions; the alternative with no flag is to keep the inline call but only in the lifecycle verbs (`events`, `doctor`, `setup`, ...), which loses the read-triggered freshness. The dispatched-worker rule (never pushes) is unchanged.

### S-4 `list` re-reads, re-verifies and re-folds the 15 MB legacy mirror in every process

- **Axis C. Severity Medium. Reproduced (the cost); the split inside native read is inferred.**
- A migrated clone has `refs/fgos/legacy` with 94 files, 15 418 993 bytes (`events.jsonl` 11 282 071). `fgos list` p50 **873 ms** (12 runs, p95 920, load 3.3; `show` 817 ms; `help` 41 ms). The Node-only profile (806 ms, `--cpu-prof`): `readWorkState` 574 ms, of which native `store.read` 465 ms (the git children are about 200 ms wall: 3 `cat-file --batch`, one of them 84 ms for the legacy blobs, plus `ls-tree -r -t` and `cat-file -t`; the remaining about 270 ms is Rust verifying and hashing), `historical()` 30 ms, `foldEvents` 107 ms, so about 490 ms of 870 (56 %) is legacy history processed again in each process. The store itself holds no events in this clone, so no other history exists to explain it.
- Neither the history checkpoint nor the view cache skips it: `list` is read-only and writes neither (`.fgos/cache` stayed empty after 24 runs), and `legacyUnchanged` (`native.mjs:100-101`) is per process.
- The legacy commit is content-addressed, so a per-process result keyed by its object id is always valid. WORK's open follow-up (import of stray shards, then H33) removes the legacy read path altogether, which is the real fix; until then the cost is paid by every Work command.
- **Fix shape (within existing code).** Do not add a cache. Let the first read after migration import (the existing `events migrate` already imports it), or finish H33 so the mirror is no longer read: then a read of a migrated store is the checkpoint continuation that `read_checkpointed` already implements (`read.rs:448`).

### S-5 A read on a store that does not exist yet fails with `event-store-io: NotFound` (fresh clone)

- **Axis A/F. Severity High (mission 1: every user clone). Reproduced.** Owned by another seat; the file:line is here because it ends in the speed trace.
- `packages/event-store/rust/src/receipt.rs:91` (`own_bounds`) calls `std::fs::read_dir(&layout.root)` with only `.map_err(io)`; its siblings tolerate `NotFound` (`identity.rs:72-76`, `diagnostics.rs:12-16`, `open_read.rs:193-197`). `own_bounds` is reached from the reader at `read.rs:569` and `read.rs:702`. `strace` of `fgos list` in a fresh clone (with `refs/fgos/*` fetched, a machine id set) shows `openat(".git/fgos/events") = ENOENT` immediately after the git preamble and the process exits 1 with `fgos: event-store-io: NotFound: No such file or directory (os error 2)`. The same missing arm exists at `seal.rs:616` (`known_receipt_tip`, reached only with an own ref) and `sync.rs:123` (`streams`).
- The user pays the whole preamble first (11 git children, about 280 ms) and then gets an opaque error that names no path.
- **Fix shape.** A read of an absent store is an empty history: add the `NotFound` arm in `own_bounds` (and the two siblings). Writes keep refusing with `event-store-lock-dir-invalid` and the existing setup fix `event-store-lock-dirs` (`src/setup/event-store-fixes.mjs:28`).
- A related fact that I reproduced but did not diagnose: in the same fresh clone the opportunistic sync failed and recorded `git-wal-unreadable: repository-identity-changed` in `sync.json` (so, as the baseline found for writes, the WAL refuses). `packages/git/rust/src/wal.rs:1232-1241` (`open_existing`) maps every missing or untrusted directory to `Untrusted`, whose name is `repository-identity-changed` (`wal.rs:43`): a missing `.git/fgos/git/operations` directory and a changed repository identity give the same code. That makes a missing setup step look like tampering. Not isolated by me; naming the step ("run `fgos setup`") belongs to the Git seat.

### S-6 The seal child costs as much CPU as the command that spawned it

- **Axis C. Severity Low (Medium under a saturating load). Reproduced.**
- `bin/fgos.mjs:4821-4825` spawns one `node bin/fgos.mjs events seal --stream project --dir <root>` per Work command with a lifecycle event (`seal-coalescing.mjs:44-49` dedups only inside one process). Measured with one open event in a clone fixture: 655 to 683 ms wall (11 runs, load 0.9), 32 git children (14 `--no-replace-objects` driver calls, 18 publication calls), 63 fsyncs, one Node process; with nothing open: 158 to 240 ms (8 runs), i.e. the price of Node boot, config, repo resolution and the early return. A Work command costs about 0.9 s (S-4), so the child adds about 75 % to its CPU. At the benchmark's saturating 20 mutations per second that is on the order of 13 cores of seal children (inferred from 20 per second times 0.65 s); real use is a few commands a minute.
- Bounded: a seal lock wait of 5 s (`locks.rs:13`, `APPEND_WAIT_MS`), every git call has a 30 s deadline, no timer, no loop. A lost child loses nothing (spec 16). It is a session leader (`detached-child.mjs:24`), so deleting a worktree or ending a session does not kill it; a dispatched worker seals inline (`bin/fgos.mjs:5124`).
- **Fix shape.** None needed now. The 63 fsyncs and the 18 publication git calls per seal are the Git component's (publication WAL and object writes); I list the number for that seat.

### S-7 Smaller items

- **Axis C. Low. Reproduced.** Every git child is wrapped in `bwrap` (12 per `list`, 44 per steady sync): about 3 to 5 ms each and 13 extra process launches before the first useful git call. The wrapper is the Git driver's containment, so this is for the Git seat; the saving for `list` would be about 40 ms.
- **Axis C. Low. Reproduced.** The four driver-startup children (`var` x2, `config --list` x2, plus `rev-parse`) run in every process before any store work: about 5 children and 40 to 60 ms (timeline 258 to 320 ms of the strace run). They repeat per process by construction, so only a long-lived process amortizes them.
- **Axis F. Low. Reproduced.** `src/event-store/native.mjs:11` and `src/event-store/consumers.mjs:8` throw `event-store-unsupported-platform` for any platform but Linux, while the project policy (memory: macOS is supported) and the Rust crate compile for it (baseline: aarch64-apple-darwin clean). Stated plainly so the Windows/macOS seat can decide; no speed relevance.
- **Axis B. Low. Inferred.** `packages/event-store/rust/src/locks.rs:113-127`: on a non-unix target `validate_directory` is `false`, so every append and seal fails with `event-store-lock-dir-invalid` on Windows. It is a named refusal, not a silent difference.

## Evidence

### 1. Read path

#### 1.1 The 11 git children of one `fgos list` (strace -f, release host staged against a clone, load 3.3)

Timeline of one traced run (strace-inflated: 1 101 ms end to end against 873 ms untraced; relative order is what matters): host `execve` 49 ms; Node starts 93 ms; first `bwrap` probe 239 ms; children as listed; last git exit 533 ms.

| # | At (ms) | Child | What it is for |
|---|---|---|---|
| 1 | 258 | `git var GIT_CONFIG_SYSTEM` | driver start: where the system config is |
| 2 | 265 | `git var GIT_CONFIG_GLOBAL` | driver start: global config |
| 3 | 274 | `git config --null --show-origin --list` | driver start: effective config (global scope) |
| 4 | 289 | `git config --null --show-origin --list` (repo `--git-dir`) | repo config; same command as 3, different scope |
| 5 | 320 | `git rev-parse --show-object-format --show-ref-format` | repo handle |
| 6 | 370 | `git for-each-ref ... refs/fgos/events/ refs/fgos/branch...` | the store's refs |
| 7 | 398 | `git cat-file --batch -Z` | read objects (tip facts) |
| 8 | 417 | `git cat-file --batch -Z` | second object reader |
| 9 | 428 | `git cat-file -t <legacy commit>` | type of the legacy tip |
| 10 | 438 | `git ls-tree -r -t -z --full-tree <legacy commit>` | the legacy tree (94 files) |
| 11 | 449 | `git cat-file --batch -Z` (84 ms) | the legacy blobs (15 MB) |

Repeated work: 1+2 are the same probe, 3+4 the same command, 7+8+11 three processes of the same long-lived reader (one `cat-file --batch -Z` could serve all three). So 11 children could be 8 with no change of meaning. Other execs in the run: 12 `bwrap` (one per git) and one `bwrap /bin/true` probe, one `node`.

`strace -c -f` of `node bin/fgos.mjs list`: 33 253 syscalls, 2 859 `futex`, 3 767 `read`, 2 177 `close`, 60 `execve`, 54 `pivot_root` (the `bwrap` children). Not a syscall-bound command; the wall is Node CPU plus waiting on children.

#### 1.2 Timings (12 runs each, release host and release addon, clone, load 2.7 to 3.3)

| Verb | min | p50 | p95 | max |
|---|---|---|---|---|
| `fgos help` | 37 | 41 | 70 | 70 |
| `fgos list` | 855 | 873 | 920 | 920 |
| `fgos show tsk-5ui` | 777 | 817 | 869 | 869 |

This matches the baseline (843 / 777 in the real repository), so my staging reproduces its warm numbers.

### 2. Sync cost (fixture with a local bare remote, `scratchpad/bench/sync-probe.mjs`, load 1.0)

| Measure | Value |
|---|---|
| First sync (200 seeded events, push of own ref) | 866 ms |
| Steady sync, nothing new (12 runs) | 766 / 776 / 800 / 814 / 819 / 826 / 827 / 846 / 849 / 870 / 874 / 904 ms |
| Git children, steady sync (strace) | 96 (44 `bwrap`); 22 `for-each-ref`, 14 `cat-file`, 9 `symbolic-ref`, 6 `config --show-scope`, 7 `rev-list` pages, 2 `fetch`, 3 `ls-remote`, 1 `push`, 2 `update-ref` |
| fsyncs, steady sync | 166 |
| Trigger cost when not due | 1 to 3 ms |

Each repeated `for-each-ref` is the same `refs/fgos/remotes/origin/` listing: `crate::refs::list` is called per mirror and per walk (`sync.rs:157`, `refs.rs:28-61`). This is what the sync would cost inside a read verb after S-3 moves; the hand-off removes it from the verb, and listing the refs once per sync would remove about 20 of the 96 children, but that is Git-driver-shaped work I did not prototype.

### 3. Write path

#### 3.1 Benchmark, release addon, 20 sessions

`scripts/event-store/v-spawn-bench.mjs --work-gate --strace` (release addon in my clone): 1 session PASS (store increment p50 21.7 ms; p95 235 ms from one fsync stall), 10 sessions PASS (p50 29.3, p95 41.6, convoy max about 2 s), **15 sessions FAIL: `hot-lock-timeout` after 5 000 ms in worker 13**, the 20-session row never ran (load 6.4 to 6.5). Repeated at 20 sessions with my no-strace harness (same worker, same fixture):

| Run set | Runs | Runs with at least one `hot-lock-timeout` | Wait p50 | Wait p95 | Wait max | Load (1 min) |
|---|---|---|---|---|---|---|
| single run before the set (`a`) | 1 | 0 (max wait 4 894 ms) | 216 | 2 386 | 4 894 | 3.7 |
| no strace, release, `h.sh` | 12 | 12 (27 workers failed) | 189 to 254 | 2 303 to 3 605 | 3 828 to 5 001 | 6.6 to 9.3 |
| strace -f on writes | 6 | 2 (4 workers) | 190 to 280 | 2 029 to 3 659 | 3 464 to 4 995 | 10.9 to 15.7 |
| A/B base | 11 | 9 (12 workers) | 215 to 317 | 2 745 | 4 654 (median) | 3.7 to 7.3 |

Total at 20 sessions on the base release build without strace: 24 runs, 21 with a timeout (87 %). The closed loop has no think time, so this is a saturating load by construction; the failing mechanism, an unfair lock with 19 competitors and a 50 ms hold, is as above.

#### 3.2 What one append and one hold cost (release, medians over the runs)

| | 1 session | 20 sessions |
|---|---|---|
| `readInGate` | 0.7 ms | 0.7 ms |
| `append` (3 fsyncs) | 16.2 ms | 27.2 ms |
| `fold` | 0.9 ms | 1 to 2 ms |
| `cacheWrite` (8.46 MB view, in the mutex) | 16.5 ms | 19.9 ms |
| hold (mutex held) | 35.1 ms | 50.4 ms |

Per append at the syscall level (strace, one writer): `fsync(store root)` 5.2 to 7.9 ms, `fsync(stream dir)` about 0.01 ms, `fsync(active.jsonl)` 5.2 to 8.1 ms (the disk is an NVMe on ext4; fsync cost varied with other sessions' I/O). The benchmark counts 3 fsyncs per append, one append of 200 had 4 (rotation).

#### 3.3 Why the two directory fsyncs can go (induction)

Claim: once an earlier writer has completed `prepare_stream` for a stream, every later writer's two directory fsyncs are redundant. Facts: (1) `append_with_fs` calls `prepare_stream` (`append.rs:196`) before it opens or writes `active.jsonl` (`:253-270`); (2) `seal_guarded` and `rotate_guarded` call it before touching the stream (`seal.rs:141`, `rotate.rs:49`); (3) `prepare_stream` returns only after the root and stream-directory fsyncs succeeded (`append.rs:148-150`), or `created` handled them; (4) a durable directory entry stays durable. So any bytes in `active.jsonl`, or any `sealed.json`, imply some process finished the chain; the missing case is exactly the one `interrupted_stream_creation_requires_root_barrier_before_ack` (`p02_review.rs:147`) tests, a stream with `closed/` and no active file, which the prototype still syncs (test green). This holds on any POSIX filesystem that honors directory fsync; it does not lean on ext4's ordered journal.

#### 3.4 A/B protocol and a trap I fell into

Two clones, two private Cargo targets, interleaved base and prototype runs. My first A/B was **invalid**: both clones shared one Cargo target directory, so the staged addon of the prototype clone was the base binary (the staging step copies `release/libfgos_node_addon.so` and Cargo does not re-link a fresh unit; fsync count per append showed 3 in both). I discarded it, gave each clone its own target, deleted the staged addon, and confirmed by strace (41 fsyncs in 40 appends for the prototype, 121 for base) before the numbers above. Anyone who shares a target directory between two checkouts of this repository will hit the same trap.

#### 3.5 Does the store need the Node hot mutex? (store-only worker, no `withStateTx`)

`scratchpad/bench/nolock-worker.mjs`: the same fixture and store, each worker reads once, then per mutation `readInGate` then `append` with its own-position cursor, retrying on `stale-cursor` and doing a full read on `catch-up-required`. No hot mutex, no cache write. 20 sessions, 200 mutations, 3 runs (load 11 to 12 while they ran): elapsed 2.7 / 2.6 / 2.7 s, per-mutation p50 11.1 to 11.3 ms, p95 about 0.8 s (queueing on the append lock and stale-cursor retries), max 1.9 to 2.1 s, **0 failures, 0 timeouts**. The same fixture through the Work gate (hot mutex plus cache write) takes 7.8 to 11 s and loses workers at 20 sessions. So the append lock (rank 70, `locks.rs:12`, 5 s wait) with the own-position check (`append.rs:197-203`, `ErrorCode::StaleCursor`) serializes a single stream correctly and cheaply; the retry the consumer already has (`catch-up-required` handling in `consumer-event-gate.mjs:89-95`) is the optimistic path. What the state mutex still arbitrates is the state store's own files (the view, staged claims), which the store has no part in. This answers "does the Event Store still need it": no. It does not say the state store can drop it.

### 4. Node startup against store work

| Measure | Value |
|---|---|
| Staged release host to Node `execve` | 44 ms (49 to 93 ms in the strace timeline) |
| `node -e 0` (10 runs) | 16 to 26 ms |
| `node bin/fgos.mjs help` (113 static imports; 10 runs) | 122 to 141 ms (median 127) |
| `list`, Node-only profile, ESM compile and import | 88 ms of 806 (11 %) |
| `list`, `readWorkState` inclusive | 574 ms (71 %); native `store.read` 465 ms, `foldEvents` 107 ms |
| `list`, `knowledge-registry` `getActiveDocs` and `assertCurrentPathUnique` | about 30 ms each, neither store work |
| `list`, `getMainFgosDir` / `resolveMainCheckoutRoot` | 30 ms |
| End trigger when no sync is due | 1 to 3 ms |

So the fixed cost before the first useful git call is about 130 to 250 ms, not the 0.45 s of the baseline sentence; the dominant cost is reading the legacy history (S-4). The baseline's 240 ms between the host and Node was not reproduced; with the release host staged the way `fgos:dev` stages it, it is 44 ms. I could not run the activated host (the shim refuses outside a project, and every safe legacy-node verb needs one), so the gap may come from activation work that my staging skips. Not measured.

### 5. The detached seal child

Measured in the sync-probe fixture (200 seeded events plus the runs): with one open event, 11 runs, 655 to 683 ms, `strace -f -ttt`: first git at 177 ms, last git exit 1 277 ms (strace-inflated), 32 git children, 63 fsyncs, one `node`, 15 `bwrap`. With nothing open: 158 to 240 ms (8 runs). Code: `src/cli/detached-child.mjs:20-31` (`detached: true`, `stdio` ignored or a log file, `child.unref()`, a failed spawn returns `{ pid: null, error }`); lock wait `locks.rs:13` and `:75-105` (`Wait::Ms(5000)` for the explicit verb, `Try` for opportunistic); git deadlines `driver.rs:315, 404, 578-619`, `remote.rs:90, 487`.

- Bounded in time: yes. 5 s lock wait plus a seal of about 0.5 s; a stuck git is cut at 30 s.
- Bounded in number: no cap, but each child exits within about a second once it has the lock; after a 5 s lock wait it exits 0 (`seal.rs:64-80`, `busy: true`). With N commands per second the live children are about N times 0.7 s.
- Orphaned: it is a session leader on purpose, so it outlives its parent, its worktree and its terminal; if the worktree is deleted during that second the seal fails and the events stay in the open batch (spec 16 covers it). A dispatched worker never hands off (`bin/fgos.mjs:5124`).

### 6. Fresh clone (read side only)

Reproduced: clone of this repository (docs-only drift from `c7522c86d`), `refs/fgos/*` fetched, `git config fgos.machineId`, release host staged. `fgos list` exits 1 with `fgos: event-store-io: NotFound: No such file or directory (os error 2)` after the 11-child preamble. strace order: `statx .git/fgos/events/store.json` ENOENT, `statx .fgos/cache/event-history.json` ENOENT, `openat .../project/active.jsonl` ENOENT, `openat .../project/closed` ENOENT (tolerated by `open_read.rs:193`), then `openat .git/fgos/events` (directory) ENOENT and exit. The only untolerated directory read on that path is `receipt.rs:91`. After `mkdir -p -m 700 .git/fgos/events/locks` the same `list` works and the sync trigger runs and fails with `git-wal-unreadable: repository-identity-changed` (recorded in `sync.json`).

### 7. Node twins and Windows (speed-relevant sightings only)

- Node twins that decide what the store decides: the sync-due rule (`maintenance.mjs:11-17`) beside the store's `opportunistic` try-lock; `ranksOf`/`outsideGate` (`native.mjs:12-28`) beside `validate_seal_context` (`locks.rs:150-164`); the `DAMAGED_HISTORY` code list (`work-event-store.mjs:16`). All three are cheap guards, none is a hot cost; the baseline lists the rest (config defaults, refspec overlap, legacy decoding).
- Windows: `locks.rs:113-127` returns `false` off unix; the Node facade refuses non-Linux first (`native.mjs:11`). I did not run the msvc check (the baseline did: 11 targets).

## Tables

### Migration (speed lens)

| Item | From | To | Receiving layer |
|---|---|---|---|
| Due-sync placement | inline in the end trigger, `bin/fgos.mjs:5299`, `maintenance.mjs:44-46` | a detached child, like the seal (S-3) | CLI layer (WORK/ES owns the trigger policy, spec 16) |
| Gate hold of the view write | `persist` inside the mutex, `consumer-event-gate.mjs:79`, `work-event-store.mjs:76-82` | outside the mutex or incremental | state store (owner of `hot-lock.mjs`) |
| Fair lock hand-off | polling lottery, `hot-lock.mjs:198-212` | queue or ticket (a proposal, S-2 option 3) | state store; moves to Rust with it |
| Legacy mirror re-read per process | every Work command | gone after import / H33 | WORK/ES (H33 and the import follow-up) |
| Repeated driver-start children | per process (5) | none unless a long-lived process | Git |

### Delete list (speed lens)

| What | Where | When |
|---|---|---|
| inline `store.sync(...)` call in the trigger | `src/event-store/maintenance.mjs:44-46` | with S-3 |
| `JSON.stringify(folded)` and the `JSON.parse(retained)` re-slice | `src/event-store/native.mjs:97, 106` | when the legacy mirror and the long-lived retained history are gone, or earlier if the consumer passes a handle instead of the history |
| pinned fsync count 3 | `tests/p02_review.rs:76-111` | rewritten with S-1 (named below) |

Nothing else of mine is a deletion; the baseline's Node twins list is the other seats'.

### Doctor

Ten store rows kept, no new row, none removed. `event-store-unsealed` and `event-store-sync` already cover what the hand-offs leave behind (an unsealed tail, an overdue sync); with S-3 a missing sync child just looks like an overdue sync, which row `event-store-sync` reports (warns after 24 h with unpublished events).

### Tests (owning proof per behaviour)

| Behaviour | Owning proof now | Change |
|---|---|---|
| steady append fsync count | `packages/event-store/rust/tests/p02_review.rs:76-111` (pinned 3) | S-1: the same test names two cases, steady 1 fsync, and a first-event or created-stream append 3; no second copy elsewhere |
| stream chain durable before the ack of the first event | `p02_review.rs:147` (`interrupted_stream_creation_requires_root_barrier_before_ack`) | unchanged; it is the proof that the induction's first step still syncs |
| 20-session gate acceptance | `scripts/event-store/v-spawn-bench.mjs --work-gate` (not in `npm test`) | after S-2, make it fail on any worker error, which it already does; no new test |
| read of an absent store | none today | one Rust test in `tests/reader_review_regressions.rs` for S-5: a read of a layout with no root returns an empty history |
| sync hand-off | `test/event-store/background-seal.test.mjs` (proves the seal hand-off, spec 16) | extend it, do not copy: one case that a due sync is handed off and a dispatched worker still never pushes |

## Proposed additions (each adds something, so the owner picks)

1. **A fair hand-off in the state store's hot lock** (S-2 option 3). Problem: an unfair 10 ms polling lottery fails 87 % of saturating 20-session runs even after the cheaper fixes. Evidence: waits are exponential-shaped (p50 0.2 s, max 5 s) with a mean of 0.95 s. Benefit: a bounded wait of about 19 times the hold, so the spec's 20-session acceptance row holds with margin. It is a new mechanism, and it belongs in the Rust move of the state store, so I would not start it before S-1 and the view-write change.
2. **An opportunistic flag on `fgos events sync`** (S-3). Problem: a hand-off needs the child to try-lock and to re-check "due" under the lock; the verb exposes only `--no-push` and a waiting lock. Evidence: `src/verbs/events/sync.mjs:2-6` against `native.mjs` `sync({ opportunistic })`. Benefit: moves 0.8 s (local) to 2.1 s (network) off a read verb's exit. One option, no new layer.
3. **One `cat-file --batch` reader per read and one ref listing per sync.** Problem: 3 reader processes in a read, 22 `for-each-ref` in a sync. Evidence: the censuses above. Benefit: 2 of 11 children per read, about 20 of 96 per sync. Git-driver work; I did not prototype it.

## Rejected hypotheses

- **"The 20-session timeout is a dev-profile or strace artefact."** Rejected: release addon, no strace, 21 of 24 runs time out; the official benchmark on a release build fails at 15 sessions; strace runs fail less often (2 of 6), not more. Verification: `scratchpad/bench/rel-strace-1.log`, the harness logs.
- **"A lock is held across a git call inside the gate."** Rejected: the benchmark records 0 spawns inside the gate in every row, and the gate holds only `readInGate`, `append`, `fold`, `persist`. It is held across 3 fsyncs and an 8.5 MB write, which is the finding, not a spawn.
- **"The hot lock's polling is expensive."** Not the cause: each poll is one read and one liveness judge; the waits are queueing, not CPU. Not measured as a CPU cost, so I call it unlikely, not disproved.
- **"The Node startup is 0.45 s of every read."** Rejected as stated: 44 ms host, 88 to 130 ms Node boot and imports in my staging (section 4); the unreproduced 240 ms host gap is unexplained, not disproved for the activated release.
- **"The end trigger is expensive on every command."** Rejected: 1 to 3 ms when no sync is due.
- **"The three-fsync design is a mistake."** Rejected as stated: the third (file) fsync is the ack and is needed; the two directory fsyncs are needed only until the chain is proven, which is S-1.
- **"The seal child is unbounded or loops."** Rejected: no timer or loop; bounded by a 5 s lock wait and git deadlines (`detached-child.mjs`, `locks.rs:13`, `driver.rs`).

## Not measured

- The activated release's host-to-Node gap, and any `fgos` verb against a real project (read-only rule).
- Sync cost against the real remote (the baseline's 2.1 s stands); my numbers use a local bare remote.
- The `cacheWrite`-out-of-the-mutex effect (arithmetic only); a fair lock (not prototyped).
- Power-loss durability of S-1 (SIGKILL tests cannot show it; the induction is the argument).
- The cause of `git-wal-unreadable: repository-identity-changed` in a fresh clone.
- `perf` profiles (refused by the kernel setting).

## Cleanup

Deleted at the end: `/home/vantt/projects/forgent-worktrees/t3b-seat-speed-{clone,base,remote,sp,fp,run-*,h-*,ab-*,state,target,target-base}`. The scratchpad (`/tmp/claude-1000/.../scratchpad/bench`) holds the harness, workers, probes and raw logs; it is session-local and not durable, so the numbers that matter are copied into this report.

Status: DONE_WITH_CONCERNS
Summary: Read-only speed review of the Event Store at `52149c6cd`: the 20-session `hot-lock-timeout` is a real limit (21 of 24 release runs, no strace), caused by an unfair polling lock plus a 50 ms hold of which two redundant directory fsyncs and an 8.5 MB view write are most; a four-line prototype of S-1 cut append p50 16.2 to 8.4 ms and timeout runs from 9 of 11 to 4 of 11; a due sync runs inline on every Work read verb (0.8 s locally, 96 git children); the fresh-clone `NotFound` is one missing arm at `receipt.rs:91`.
Concerns/Blockers: S-1 changes a pinned test and a durability argument that SIGKILL tests cannot prove, so WORK must review it; the host-to-Node 240 ms gap and the sync cost against the real remote were not reproduced; the machine was shared (load 3 to 15), so absolute times carry that noise, but the interleaved A/B and the failure rates do not depend on it.
