---
title: "Mailbox V2: the record adapter in crate fgos-mailbox"
description: "Build rung V2 of the Agent Mailbox ladder: the metadata snapshot under the holder-lock `mailbox` mutex written with durable-file, immutable body files with garbage collection, a kill matrix at every write step, two-process contention with the wait cap, the Q2 pruning of dead bindings, and the size ceiling and costs measured against S0, proven by cargo test -p fgos-mailbox on branch mailbox/v1-v3 only."
status: pending
priority: P2
effort: ~3.5d (8 phases, strictly sequential)
branch: main (plan only); all code on branch mailbox/v1-v3 in linked worktree /home/vantt/projects/forgent-mailbox, never merged to main until the owner says feasibility is proven
tags: [mailbox, rust, storage, holder-lock, durable-file, crash-safety, tdd]
blockedBy: [261022-0007-mailbox-v3-hook-payload-contract]
blocks: []
created: 2026-10-22
---

# Mailbox V2: the record adapter in crate `fgos-mailbox`

Planned on main `8e27162e6` (2026-10-22 10:05 Asia/Saigon). Branch `mailbox/v1-v3` at `7fb7c4f4b` when drafted and `1ad03e9d2` after the red team (V3 commits keep landing; phase 1 records the base it starts from). V3 is still being built on the branch by another lead (its phases 4 to 7); **V2 starts only after V3 closes** (phase 1 checks this).

- Spec: [`docs/platform/agent-mailbox/spec.md`](../../docs/platform/agent-mailbox/spec.md) — read the **branch** copy: `git -C /home/vantt/projects/forgent-mailbox show HEAD:docs/platform/agent-mailbox/spec.md`. Sections used: §4 rule 4, §5.1, §6.1, §6.4, §8 items 6-8, §9, §10, §11 (Core suite items marked V2), §12, §14 row V2 and its prerequisites.
- Earlier plans: V1 [`../261021-2255-mailbox-v1-core-crate/plan.md`](../261021-2255-mailbox-v1-core-crate/plan.md) (risks section; final review `reports/code-review-final-v1.md` section "Readiness for V2 and V3"), V3 [`../261022-0007-mailbox-v3-hook-payload-contract/plan.md`](../261022-0007-mailbox-v3-hook-payload-contract/plan.md).
- Cost baseline: [`../reports/research-261020-1612-mailbox-s0-hook-and-record-costs.md`](../reports/research-261020-1612-mailbox-s0-hook-and-record-costs.md) (H3: one read-modify-write cycle p50 10.3 ms / p95 11.0 ms, fsync dominated; 100 addresses x 50 headers, 808,801 bytes: p50 13.4 ms / p95 28.3 ms; contention: an unlucky prober waited up to 1.26 s).
- Board row `MAIL` in [the program board](../261017-1313-fgos-platform-program-board/plan.md); the controller updates it, not the implementer.

## Outcome

`cargo test -p fgos-mailbox` proves, on the mailbox's own path and with real files and real processes:

1. **One hold, one total order.** Every mutation is: take the `mailbox` mutex from the holder-lock registry, read the snapshot, change it in memory with the core, install the new snapshot with `durable-file`, release. A hold whose closure changes nothing writes nothing.
2. **Versions.** A snapshot of a newer version is refused and never overwritten; an older one is refused as unsupported; a frozen version-1 snapshot fixture keeps reading.
3. **Bodies.** A body is an immutable file installed before the snapshot that references it; a body no installed snapshot references is removed; a body file is read only if it is a regular file no larger than its header says.
4. **Process-crash safety.** A process killed (SIGKILL) at any step of a hold leaves: the lock free at once, the snapshot whole (the old one before the rename, the new one after), no header pointing at a missing body, and orphans that the next sending hold removes.
5. **Contention.** Two processes never lose an update, never both spend one remaining wake allowance, never claim the same message, and two heads registering at once never share a generation. A hold that cannot get the lock within the wait cap (`mailbox.hook.lockWaitMs`) returns a typed busy error and changes nothing.
6. **Q2 pruning.** A binding is forgotten only when its head is judged `Dead`, it has been idle past `record.ttlSec`, and no header or notice names it; a later registration starts at generation 1.
7. **Per-identity header ceiling and cost.** The retained headers of the shared unregistered identity stop growing at a ceiling derived from `limits.v1.json`, and a registered head generation is bounded by `session.lifetimeCap`; the snapshot as a whole is **not** bounded (it grows with the number of head generations within the header horizon, and its read has no byte cap), which owner Q1 now covers; the cost of every hold kind is measured at the S0 populations and at the steady-state week, and reported against S0 and the 50 ms hook target.

V2 does **not** prove: any hook payload or CLI (V3/V4), the shell's write-then-finish order and its exit code (V4), the hook cost through the host (V5), the main-checkout resolver (V5: the store takes the `.fgos` directory as a parameter), power-loss durability (spec §6.4 claims none), the circuit breaker (V5).

## Decided inputs (never reverse)

- **Owner Q2 (2026-10-21).** Prune a binding only when the store judges its head `Dead` (through `fgos_process`), it has been idle past `record.ttlSec`, and no header or notice names it. Pruning calls `MailboxState::forget_key`. A later registration starts at generation 1.
- **The lock row is ours to add.** A `mailbox` row (kind `mutex`, rank 80, the leaf group) in `packages/holder-lock/contracts/lock-registry.v1.json`, on the branch. Precedent: the GIT lane (`d1d4ec7ee`, `repo-config`) and the Event Store (`b34e4060e`, `event-seal`/`event-append`). Lanes 4.2, 4.4a and 4.3-R have landed; no lane holds the file.
- **HARDEN coordination.** Build on the current holder-lock, durable-file and process APIs; at the start of every phase run `git log --oneline <last-seen>..origin/main -- packages/holder-lock packages/durable-file packages/process src/holder-lock`. If the HARDEN lane changed an API this plan uses, adapt, record it in the phase file's "API drift" line, and keep going.
- **Branch rules.** Code only on `mailbox/v1-v3`, never merged to main. Sync once at the start and once at the end of each phase (`git fetch origin && git merge --no-edit origin/main`). Never rebase; never re-merge while gates are running. A phase is done only when its proof is green on a fresh main merge.
- **Quality.** TDD (failing test first, every phase). Hexagonal: the core stays pure; the store is a plain module (spec §4 rule 5: one implementation, no port). One owning proof per behaviour. No fakes, mocks or test-only switches. No invented numbers: every policy number comes from `packages/mailbox/contracts/limits.v1.json`. `cargo clippy -p fgos-mailbox -p fgos-mailbox-core --all-targets -- -D warnings`; `cargo fmt -p fgos-mailbox -p fgos-mailbox-core --check`.
- **Convention (owner, 2026-10-22).** Every report, plan or journal path comes from `fgos convention path --kind <report|plan|journal> --slug ...`; never hand-built. Each phase gate runs `fgos convention check --all --json` and requires no violation naming a file the phase added (checked 2026-10-22 11:20: the activated release refuses explicit paths, `fgos convention check -- <path>` answers `invalid-path` even for `plans/.../plan.md`, so `--all` is the working form; the plan's own files pass it with 0 violations). The broken explicit-path form is a Convention defect for its own item, not V2's. Convention does **not** own `.fgos` storage resolution (convention spec §2 "Must not own"): the store receives the `.fgos` directory as a parameter, and every mailbox file name and layout lives in exactly one module, `record/paths.rs`; the lock path comes from the registry row's `v3Path` through `fgos_holder_lock::LockScope::acquire`, never written a second time.

## Phases

| # | Phase | Proof | Status |
|---|---|---|---|
| 1 | [Preconditions and the `mailbox` lock row](phase-01-preconditions-and-lock-row.md) | Node registry contract test pins the row; `cargo test -p fgos-holder-lock` | pending |
| 2 | [Paths, id source and the snapshot hold](phase-02-paths-ids-and-snapshot-hold.md) | `tests/record_snapshot.rs`: hold, no-write when unchanged, versions, frozen v1 fixture, refused send persisted | pending |
| 3 | [Immutable bodies, safe reads and garbage collection](phase-03-bodies-and-garbage-collection.md) | `tests/record_bodies.rs` | pending |
| 4 | [Kill matrix at every write step](phase-04-kill-matrix.md) | `tests/record_crash.rs` (SIGKILL per step) | pending |
| 5 | [Two processes contending, with the wait cap](phase-05-two-process-contention.md) | `tests/record_contention.rs` | pending |
| 6 | [Q2 pruning, the dead-binding consequence and the handle bound](phase-06-q2-pruning-and-handle-bound.md) | `tests/record_prune.rs`; core `tests/registry.rs` | pending |
| 7 | [Size ceiling and costs against S0](phase-07-size-ceiling-and-costs.md) | `tests/record_ceiling.rs`; cost report from `examples/mailbox-record-cost.rs` | pending |
| 8 | [Branch docs, full gates, review, hand-off](phase-08-branch-docs-gates-and-handoff.md) | workspace cargo gates and `npm test` green on the branch | pending |

Strictly sequential: every phase adds to `src/record/` and to the shared test support.

## Architecture in one screen

- **Placement.** Module `record` in crate `fgos-mailbox` (`packages/mailbox/rust/store/src/record/`), beside V3's `hook`, `adapters` and `head` (spec §4.1 assigns the record adapter to this crate). The core `fgos-mailbox-core` stays serde-only; V2 changes it in one place only (the handle bound, phase 6).
- **Dependencies added to `fgos-mailbox`:** `fgos-holder-lock` and `fgos-durable-file` (spec §4: the first slice imports `fgos-process`, `fgos-holder-lock`, `fgos-durable-file`, `fgos-session-identity` only). `libc` only if `O_NOFOLLOW` reading needs it (it is already a workspace dependency).
- **The record's one input is the `.fgos` directory** (`fgos_dir: &Path`), the directory V5's wiring resolves with `resolve_workspace_root(cwd)?.join(".fgos")` (spec §6.4). Tests pass a temporary directory. The store never resolves `.fgos`.
- **`record/paths.rs` — the one place for names and layout.** `Paths::new(fgos_dir)` gives: `mailbox_dir()` = `<fgosDir>/runtime/mailbox` (spec §6.4 option A; reserved for files written without the mutex, such as V5's breaker file), `record_dir()` = `<mailbox_dir>/record` (written **only** by a holder of the mutex), `snapshot()` = `<record_dir>/snapshot.json`, `bodies_dir()` = `<record_dir>/bodies`, `body(&MessageId)` = `<bodies_dir>/<id>.body` (refuses an id outside `[0-9a-f]`), `lock_params()` = the `{"fgosDir": ...}` map that `LockScope::acquire("mailbox", ...)` fills into the registry's `v3Path`, and `is_known(entry)` for the garbage collector. Tests, the cost example and the crash children derive every path from it; no path literal appears anywhere else.
- **`record/os_ids.rs` — `OsIds`, the id source unique across processes.** Opens `/dev/urandom` once per hold (precedent: `packages/event-store/rust/src/identity.rs` `random_id`) and reads 8 bytes per `next_u64`. The core trait is infallible, so a failed read marks the source failed and returns 0; the hold checks `failed()` after the closure and aborts without installing anything (`RecordError::Ids`). A body id collision is caught by `install_once` returning `AlreadyExists` and aborts the send.
- **`record/snapshot.rs` and `record/mod.rs` — the hold.**
  - `Record::open(fgos_dir) -> Result<Record, RecordError>` creates `mailbox_dir`, `record_dir` and `bodies_dir` (mode 0700) and syncs their parents once. **Every hold** first checks, before reading or writing anything, that `record_dir` and `bodies_dir` are real directories (not symlinks) owned by the current user (`record-dir-untrusted` otherwise) and keeps their dev/inode; deletions go through a directory descriptor opened with `O_DIRECTORY|O_NOFOLLOW` whose dev/inode must match, with `unlinkat`, so a directory swapped after the check is never used for deletion.
  - `Record::hold(wait, now, limits, |state, ids| ...) -> Result<Held<R>, RecordError>`: acquire `mailbox` through `LockScope` (`Wait::Ms(...)` from the caller), read `snapshot.json` with `O_RDONLY|O_NOFOLLOW|O_NONBLOCK|O_CLOEXEC` and `fstat` requiring a regular file before any read (a FIFO never blocks the hold; missing means `MailboxState::new()`), read `SnapshotVersion` first (`Newer` -> `RecordError::SnapshotVersion(SnapshotVersionError::Newer)`, never overwritten; `UnsupportedOlder` likewise; the store reuses `SnapshotVersionError::code()`, no second code), then the whole `MailboxState` (version enforced inside deserialization), run the closure, and serialize. **Equal bytes: release, no write** (V3 decision: the shell compares bytes; the core has no `changed` flag). Different bytes: apply Q2 pruning (phase 6), re-serialize, install with `replace_durably_observed`, delete the bodies this install stopped referencing (phase 3), release. **Commit point = the rename.** `RecordError` is returned only for failures before the rename, and then nothing changed. A failure at or after the rename (parent fsync, deletion, an observer error from `Renamed` on) is not an error: the hold returns `Held { value, wrote: true, warning: Some(..) }`, because the new snapshot is live and a caller that retried would send twice (`durable-file` `InstallError.installed`, `lib.rs:27-29`).
  - `Record::send(req, wait, now, limits) -> Result<Held<Result<SendOutcome, Refusal>>, RecordError>` (the body is `req.body`): one hold in which the core `send` runs, then (accepted only) the body is installed with `install_once`, then the snapshot (installed after a refusal too: the budget, lifetime and counters changed, spec §5.3), then the orphan sweep of `record_dir` and `bodies_dir` (never `mailbox_dir`).
  - `Record::body(&MessageId, expected_bytes, &Limits) -> Option<String>`: read outside the mutex, `O_NOFOLLOW|O_NONBLOCK`, `fstat` regular file before reading, at most `expected_bytes + 1` bytes and never more than `mailbox.maxBodyBytes`, length equal to `expected_bytes` (taken by the shell from `state.message(id)` inside hold 1, since `ClaimedItem` carries no size); anything else is `None`, which V3's `render_reply` frames with the contract's `[message.body-missing]` line.
  - `Record::hold_observed(...)` / `send_observed(...)`: built in phase 2 (phase 4 only adds the kill rows): the same paths with an observer called at each real step (`Step::{Locked, Read, Mutated, BodyInstalled, Written, Synced, Renamed, DirectorySynced, Collected}`), mirroring `durable-file`'s `replace_durably_observed`; `hold` and `send` pass a no-op. It is a parameter on the one code path, never an environment switch, and it skips nothing.
- **How V4/V5 use it (not built here):** hold 1 `record.hold(.., |s, ids| hook::begin(s, &call, now, limits, hook, ids))`; bodies through `record.body`; render; write stdout; hold 2 `record.hold(.., |s, _| hook::finish(s, &ticket, now))`.
- **Lock.** `fgos_holder_lock::LockScope::seeded(vec![])?.acquire("mailbox", &paths.lock_params(), wait)`; the scope is dropped at the end of the hold, which closes the description. A kernel lock on an open file description: a killed holder frees it at once (proven in phase 4 on this path).

## Files V2 owns, and overlap with V3

| File | V2 action | Shared with V3? |
|---|---|---|
| `packages/mailbox/rust/store/src/record/{mod,paths,os_ids,snapshot,bodies,prune}.rs` | create | no |
| `packages/mailbox/rust/store/tests/record_{snapshot,bodies,crash,contention,prune,ceiling}.rs` | create | no |
| `packages/mailbox/rust/store/tests/common/record.rs` (child-process role runner, temp `.fgos`) | create | no |
| `packages/mailbox/rust/store/examples/mailbox-record-cost.rs` | create | no (V4 adds a different example, `mailbox-test-hook.rs`) |
| `packages/mailbox/contracts/fixtures/record/snapshot.v1.json` | create | no |
| `packages/mailbox/rust/store/Cargo.toml` | add two deps | V3-created; edited after V3 closes |
| `packages/mailbox/rust/store/src/lib.rs` | add `pub mod record;`, update the crate doc | V3-created; after V3 closes |
| `packages/mailbox/rust/store/src/head.rs` | extract `stored_liveness(&Binding) -> Liveness` used by both `judge_stored` and the pruner (one door) | V3-created; after V3 closes |
| `packages/mailbox/rust/store/src/hook/limits.rs` | add `lock_wait_ms` (key `mailbox.hook.lockWaitMs`) | V3-created; after V3 closes |
| `packages/mailbox/rust/store/tests/common/mod.rs`, `tests/limits_contract.rs` | `mod record;`; the new key's missing-key case | V3-created; after V3 closes |
| `packages/mailbox/contracts/limits.v1.json` | add `mailbox.hook.lockWaitMs` (100, reader `hook`, spec §12) | shared contract; after V3 closes |
| `packages/mailbox/rust/core/src/registry.rs`, `core/tests/registry.rs` | handle bound (phase 6) | V1/V3 touched; after V3 closes |
| `packages/holder-lock/contracts/lock-registry.v1.json`, `lock-registry.schema.v1.json`, `test/holder-lock/registry-contract.test.mjs`, `docs/platform/holder-lock/spec.md` | the `mailbox` row | no (outside the mailbox) |
| `docs/platform/agent-mailbox/spec.md` (branch), `packages/git/contracts/mutation-census.v1.json`, `Cargo.lock` | update / regenerate | yes, sequential only |

V3's files (`src/hook/drain.rs`, `src/adapters/*`, `tests/hook_payloads.rs`, `tests/fixtures_contract.rs`, `contracts/adapters.v1.json`, `contracts/fixtures/hooks/**`) are not touched. Because V2 starts after V3 closes, no file is edited by both leads at once.

## Hiện trạng tiền đề (kiểm 2026-10-22 10:05)

| Prerequisite / component | Exists? | Where | Effect on V2 |
|---|---|---|---|
| V1 core, `forget_key`, version check inside `Deserialize` | yes | `packages/mailbox/rust/core/src/forget.rs:26`, `state.rs:88,113-119` | Q2 calls `forget_key`; V2 adds a store-level proof that the version holds on disk |
| V3 drain (`begin`/`render_reply`/`finish`), `head::judge_stored` | being built (phases 4-7) | `store/src/hook/drain.rs`, `store/src/head.rs` | V2 starts after V3 closes (phase 1 gate) |
| `mailbox` row in the lock registry | **no** | `packages/holder-lock/contracts/lock-registry.v1.json` | phase 1 adds it |
| `LockScope::acquire(name, params, wait)` resolving `v3Path` | yes | `packages/holder-lock/rust/src/scope.rs:57,62,120-170` | the store's only lock door |
| `acquire`, `Acquire`, `Wait`, `Mode` | yes | `packages/holder-lock/rust/src/port.rs:43,52,142,700` | `ScopeError::Acquire(Box<Acquire>)` maps to `RecordError::Busy`/`Unavailable` |
| `replace_durably_observed`, `ReplacePoint`, `install_once`, `sync_directory` | yes | `packages/durable-file/rust/src/lib.rs:65,179,187,398` | snapshot install, body install, directory sync |
| `Record`, `ProcTuple::to_record`, `judge_here`, `Verdict`, `identity_of`, `self_identity` | yes | `packages/process/rust/src/facts.rs:19,50,65,242,285,290` | pruning liveness, crash-test children |
| Node registry facade and doctor | yes | `src/holder-lock/registry.mjs` (resolves `<fgosDir>`), `src/holder-lock/fences.mjs:39` (`CUTOVER_OWNERS` = 4.2/4.3/4.4: a `mailbox`-owned row is not cut over, so no fence target and no `LOCK_FILES` entry in `src/setup/holder-lock-checks.mjs:368`) | only the schema owner enum and the contract test change |
| Rust registry readers | yes | `packages/holder-lock/rust/src/scope.rs:40` (embedded), `packages/event-store/rust/tests/registry_rows.rs` (its own rows only) | adding a row breaks neither |
| `is_attempt_writer_id` | no | session identity | not needed by V2 |
| Main-checkout resolver | partly (`resolve_workspace_root`) | `packages/distribution/rust/src/workspace.rs` | not needed by V2 (`.fgos` is a parameter) |
| HARDEN T0/T1 on these crates | active on main (`1c7b6f8c5` durable-file, `fd176750d` holder-lock, `c0c861fc5`/`f3b0da583` process) | board row MAIL announcement `efba97e1f` | every phase checks drift first |

## Decisions taken in this plan (agent decisions inside the signed frame)

Phase 8 records these in the branch spec §17, attributed to the planning lead (agent). None reverses a §17 decision.

1. **Store input is the `.fgos` directory, not the record directory.** The lock row lives at `<fgosDir>/locks/mailbox.lock` like every repo leaf (`sessions`, `observe`, `repo-config`), so the store needs `<fgosDir>`; the record directory is derived from it in `paths.rs`. Spec §6.4 says "the mailbox crates take the resolved directory as a parameter": the resolved directory is the main checkout's `.fgos`.
2. **Lock row:** `{name: "mailbox", kind: "mutex", scope: "repo", rank: 80, v3Path: "<fgosDir>/locks/mailbox.lock", v1Shape: null, v1Path: null, fence: "none", owner: "mailbox"}`; the schema's owner enum gains `"mailbox"` (precedent: `event-store`, `git`). Fence `none` needs no `fenceNote` (that rule binds only owner `4.2` rows). The rank-80 note in the registry and the holder-lock spec list it among the leaves.
3. **No write when nothing changed**, decided by byte equality of the re-serialized snapshot with the bytes read (V3 decision: no `changed` flag in the core). Pruning and garbage collection run only in holds that already write, so they never turn a no-mail hook into a write. **Reversed 2026-10-22 by the plan owner (agent) after phase 7:** the hold now writes exactly when the core's own answer reports a change (`ReportsChange`), with no encode and no comparison on an unchanged hold; the re-encode was about half of a no-mail hold at a week of headers. See phase 7.
4. **Body before snapshot.** In a send hold the body is installed (`install_once`, which syncs `bodies/`) before the snapshot that references it. A kill between the two leaves an unreferenced body, which is garbage; never a reference to a missing body.
5. **Garbage collection in two parts, inside `record/` only.** The snapshot and the bodies live in `runtime/mailbox/record/`, which only a holder of the mutex writes; `runtime/mailbox/` itself is left for files written without the lock (V5's breaker file, spec §4.1, which must work exactly when the lock is busy), and the sweep never lists it. (a) Every installing hold deletes, after the install, the bodies that the previous snapshot referenced (`body_kept`) and the new one does not: no directory listing. (b) Every send hold lists `record_dir` and `bodies_dir` (through the checked directory descriptors) and deletes every regular file that `paths.is_known` does not name and the installed snapshot does not reference. Before any listing or deletion the hold checks, with `symlink_metadata` (never following), that `record_dir` and `bodies_dir` are real directories owned by the current user and not symlinks, and it deletes only entries whose own `file_type()` (not followed) is a regular file; anything else aborts the sweep with `RecordError::RecordDirUntrusted` and deletes nothing. <!-- Red Team: a symlinked directory must never steer deletion --> This removes bodies left by a killed send and `durable-file` temporaries (`.durable-file-<pid>-<seq>.tmp`) left by a killed writer: under the mailbox mutex no other mailbox writer can be between its temp and its rename, so the store needs no knowledge of durable-file's private temp format.
6. **Safe reads.** The snapshot and every body are opened with `O_NOFOLLOW|O_NONBLOCK` and `fstat`ed as regular files before any read (a planted FIFO never blocks a hold); a body is read with a cap of `mailbox.maxBodyBytes` and must match its header's `body_bytes`. A planted symlink to a secret therefore never reaches a frame (spec §8 item 6: an unconfined worker can write the record directory).
7. **An unreadable snapshot is refused, never overwritten** (`RecordError::SnapshotUnreadable`): overwriting would reset caps that are never reset. The hook stays quiet (V3/V5 fail-quiet); `status` and the V7 doctor check surface it; recovery is a manual removal. The kill matrix proves a process crash never produces one.
8. **Observed holds mirror `replace_durably_observed`.** The kill matrix needs to stop a child at each real step; the store exposes the observer as a parameter of its one write path (the `durable-file` precedent), not an environment switch.
9. **Pruning:** idle means `now` is past `max(last_seen, last_drain_at) + record.ttlSec`; "named" means any retained header (`from` or `to`) or notice (`to` or `about_to`). Liveness comes from `head::stored_liveness`, extracted from `judge_stored` so registration and pruning share one judgement.
10. **Handle bound:** the core's `register` refuses a `handle` longer than `mailbox.frame.maxHeaderChars` (`RegisterRefusal::HandleTooLong`), the bound the contract already gives writer keys; a Codex handle is the writer key itself. The contract's `meaning` text for that key is extended to say so. `head` is written only by `head::head_text` from a process `Record`, so its length is bounded by construction; a hand-written snapshot is bounded only by the snapshot itself (owner question 1).
11. **The wait cap key.** `mailbox.hook.lockWaitMs` (100, spec §12, reader `hook`) is added to `limits.v1.json` and to `HookLimits`; the store takes the wait as a parameter and never reads configuration.
12. **Schema version stays 1** and is frozen by a committed fixture `contracts/fixtures/record/snapshot.v1.json` (spec §6.4: "V2 freezes version 1 when it first writes one"). Any later change to the snapshot shape fails that test until the version is bumped with a migration decision.
13. **Body-file naming is not a Convention kind now.** Convention owns repository-relative artifact names and explicitly not `.fgos` storage (convention spec §1-§2); the body name `<id>.body` is a runtime storage format under `.fgos` and the id's uniqueness is the store's allocation. It is recorded as a *candidate* (section below), not built.

## Convention candidates (recorded, not built)

| Candidate | Why it might qualify | Why not now |
|---|---|---|
| Mailbox runtime layout (`runtime/mailbox/record/snapshot.json`, `record/bodies/<id>.body`) | a deterministic format used by a state owner (convention spec §1: "may become a later convention kind") | it lives under `.fgos`, which Convention must not own (§2); Convention's rules are repository-relative; uniqueness is allocation, which stays with the state owner. It qualifies only if Convention later admits runtime-path kinds, a separate owner decision |

## Ideas not built (RUL104: owner chooses)

| Idea | Real problem and evidence | Benefit |
|---|---|---|
| Sync the body and the snapshot in one journal commit (`install_ordered`-style `alongside`) | a send pays two fsync chains (body, snapshot); S0 H3 measured about 10 ms per chain | about one fsync less per send |
| A `durable-file` function that recognises its own temporary names, used by the Event Store's `sweep_temps_under_append_lock` | `packages/event-store/rust/src/identity.rs` re-parses durable-file's private temp format; V2 avoids it by listing known names instead | one owner for the temp format (separate item outside this lane, RUL11) |
| A core `changed` flag on mutations | the no-write rule serializes the snapshot on every hold to compare bytes; phase 7 measures what that costs | removes one serialization from the no-mail hook path |

## Câu hỏi cho owner

**Owner answered 2026-10-22 11:10:** Q2 → option **(b)**: name resolution ignores a binding the store judged `Dead` (the store passes the dead keys into `send`). Q1 stays on its provisional default (a), measure first, and returns to the owner only if phase 7 exceeds 50 ms. In the same answer the owner also decided two core items from the V1 final review: **M2 → A** (a message offered more than `loop.windowSec` ago no longer counts as a derived parent), and **self-send → B** (a head sending to its own key is refused with reason `self`).

Both questions let the plan continue on the provisional default; only the owner's answer changes it.

### Q1. If a week of headers makes the no-mail hook slower than 50 ms, which lever?

**Answered by the owner 2026-10-22: option (b).** `mailbox.record.bodyRetentionSec` defaults to 86,400 s, the value of `record.ttlSec`, in `limits.v1.json` on the branch; the header horizon becomes one day. Recorded in branch spec §12, §16 and §17; measured at the new default in phase 7's second re-run.

- **What is happening.** Settled headers are kept `max(loop.windowSec, record.ttlSec, record.bodyRetentionSec)` = 7 days (`core/src/sweep.rs` `retire_settled_messages`). The shared `~unregistered` sender (the runner, the `fgos` CLI) has no lifetime cap (owner Q3) and may be accepted `session.budget` (20) times per `human.fallbackWindowSec` (600 s), so it alone can leave about 20 x 604800 / 600 = 20,160 headers; each registered head generation adds at most `session.lifetimeCap` (200). Every hook call reads and parses the whole snapshot, and S0 measured 2.2 ms of read and parse for 0.8 MB. Phase 7 measures the real numbers; the provisional estimate for one saturated sender is several MB and tens of ms.
- **Cause.** The body retention (7 d) sets the header retention, and nothing bounds the number of retained headers per sender other than the send rate.
- **Options and cost.** (a) Keep everything; V5 measures the real hook and the breaker bounds the worst case. Cost: none now; risk that a busy week breaks the 50 ms target. (b) Keep headers only `max(loop.windowSec, record.ttlSec)` (24 h) and drop the body with its header. Cost: one core rule change; spec §5.3 "bodies 7 d" becomes 24 h. (c) A new key bounding retained settled headers per sender (oldest settled dropped first). Cost: a new number the owner must choose, one core rule. (d) A snapshot byte ceiling key: the hold refuses to read a larger snapshot (quiet hook, `status` signal) and sends are refused near it. Cost: a new number; refusals the sender sees. Note: today the snapshot read has no cap at all, and a planted or runaway multi-MB file is read and parsed under the lock on every hook; the wait cap `hook.lockWaitMs` bounds only the poll for the lock, not the read, the parse, nor `settle_release` on release (up to `DEFAULT_KILL_WAIT_MS` = 2000 ms, `packages/holder-lock/rust/src/port.rs:33,200-205`).
- **Recommendation.** (a) for V2: measure and report; decide at V5 with the real hook numbers. If phase 7 already shows the steady state for one sender over 50 ms, (b) is the smallest change.
- **Scope of the answer.** Header retention and snapshot size only; it does not change any send policy.
- **Provisional default.** (a): V2 measures and reports; no core change.
- **Measured at phase 7 (2026-10-22, [`research-261022-1145-mailbox-v2-record-costs.md`](../reports/research-261022-1145-mailbox-v2-record-costs.md), record alone, release build, ext4 on NVMe).**
  - The one-sender steady week (20,140 headers, 7.0 MB): no-mail claim hold p50 30.0 ms, p95 42.5 ms.
  - Plus 10 registered heads at their lifetime cap: p95 49.5 ms.
  - Plus 100 such heads (39,940 headers, 13.8 MB): p50 58.0 ms, p95 64.2 ms. That is over 50 ms.
  - The cost is the read and parse (about 14 ms at 7 MB) plus the re-encode for the no-write comparison (about 15 ms). Both grow linearly with the snapshot.
  - The host's own cost per call comes on top of these record-only numbers.
  - `mailbox.hook.lockWaitMs` bounds only the poll for the lock, not the hook's wall time (read, parse, re-encode, release).
  - The default (a) is kept; no lever was picked. The answer is due now.
- **Re-measured after decision 3 was reversed (the hold no longer re-encodes; same report, re-run section).**
  - No-mail p50 / p95: one-sender week 22.6 / 36.8 ms; plus 10 heads 17.2 / 36.0 ms; plus 100 heads 44.1 / 49.7 ms.
  - Measured only: with `record.bodyRetentionSec` set to the `record.ttlSec` value (86,400 s), the steady week holds 2,880 headers (1.0 MB) and the no-mail hold is 2.2 ms.
  - The contract value is unchanged pending the owner's answer.

### Q2. Dead bindings stay addressable until pruned, which can take up to the header retention. Keep that?

- **What is happening.** Under Q2 a dead binding is pruned only when no header or notice names it, and headers live up to 7 days. Until then: a prefix such as `forgent-codex` becomes ambiguous after a second Codex session, and mail to a name whose only binding is dead is recorded and waits for its record TTL (24 h) instead of being refused as unknown (V1 plan risks).
- **Cause.** Name resolution in the core sees every binding; liveness is judged only by the store, at registration and at pruning.
- **Options and cost.** (a) Keep Q2 as written; the delivery report and `status` (V7) show the dead recipient. Cost: none now; confusing names for up to 7 days. (b) Name resolution ignores a binding the store judged `Dead` (the store passes the dead keys into `send`). Cost: one new input to the core's `send`, one judge per binding per send. (c) Prune a dead binding even when headers name it, keeping those headers. Cost: reverses part of Q2.
- **Recommendation.** (b): it fixes both symptoms without touching Q2's pruning rule, and `send` is not on the hook hot path.
- **Scope of the answer.** How `send` resolves names; registration and pruning do not change.
- **Provisional default.** (a), because (b) adds an input to a decided core contract; phase 6 proves today's behaviour with a test named for it, so a later (b) changes one owning test.

## Risks the implementer must know

- **V3 still running.** Do not start phase 1 until V3's `plan.md` says `completed` on the branch and its phase 7 commit is pushed. Never edit V3's files while its lead works.
- **Ceiling test runtime.** Driving 20,160 sends through the core in a debug test sweeps every retained header on every send (O(H) per operation). If `tests/record_ceiling.rs` takes more than about 60 s in debug, keep the structural assertion in the test with a population the test can afford only if the bound is still reached (it is per sender, so one sender suffices) and move timing to the release-built example. Never weaken the bound.
- **Kill-matrix flakiness.** The child signals "at step X" by installing a ready file (durable rename) and then blocks; the parent SIGKILLs only after it sees the file. Never `sleep` to synchronise.
- **Mutation census.** Every new `.rs` under `packages/` is hashed in `packages/git/contracts/mutation-census.v1.json`; each code commit regenerates it with `node scripts/git-one-door-scan.mjs --write-census` in the same commit.
- **`Cargo.lock`** changes with the two new dependencies; CI uses `--locked`.
- **Node tests touched.** The registry change runs through `test/holder-lock/registry-contract.test.mjs` and `test/setup/holder-lock-checks.test.mjs`; both must stay green on the branch.
- **Board.** The implementer reports to the controller, who updates row `MAIL`.
- **Lock order for V5.** `LockScope::seeded(vec![])` (the `repo-config` precedent, `packages/git/rust/src/repository_config.rs:172`) checks no rank against locks the caller already holds; V5's wiring must seed the scope with what it holds, or document that the mailbox is taken with nothing else held.
- **Residual directory trust.** `durable-file` writes through a path (`lib.rs:3`: the directory must stay trusted), so a worker that swaps `record/` between the hold's check and an install can still redirect that one write. The check narrows the window; the boundary is confinement (spec §8 item 6, the hidden-roots prerequisite of V4), not the store.

## Long commands: exit must be observable

`cargo test --workspace`, `npm test`, `cargo clippy --workspace` and the cost example run either through the harness's background facility with exit notification, or in the foreground under `timeout` with output teed to `.fgos/runtime/tmp/mailbox-v2/<step>.log` and `; echo "exit=$?"`. Never a bare `&`.

## Validation Log

### Session 1 — 2026-10-22

**Trigger:** `ak-plan validate` after drafting. The planning lead cannot ask the owner, so every question that the spec, the reports or the code answer was resolved from them; only the two owner-intent questions went to "Câu hỏi cho owner" (Q1, Q2), each with a provisional default.
**Questions raised:** 11. Resolved from evidence: 9. Sent to the owner: 2.

| # | Question | Resolution | Source |
|---|---|---|---|
| V1 | Is the store's input the record directory or the `.fgos` directory? | `.fgos` (decision 1): every repo leaf lock lives at `<fgosDir>/locks/`, and the record directory is derived in `paths.rs` | registry rows `sessions`/`observe`/`repo-config`; spec §6.4 "the mailbox crates take the resolved directory as a parameter" |
| V2 | Which `owner` does the row carry, and does it need a fence? | `mailbox`, fence `none`, no legacy path (decision 2); Node treats it as not cut over | schema `$defs.lock.owner` (`event-store`, `git` precedents); `fences.mjs:39` `CUTOVER_OWNERS`; `holder-lock-checks.mjs:392` |
| V3 | Does any Rust reader break on a new row? | No: `scope.rs` looks rows up by name; `event-store/tests/registry_rows.rs` asserts only its own | `scope.rs:36-55`; `registry_rows.rs` |
| V4 | Where does the wait cap come from? | `mailbox.hook.lockWaitMs` (100, spec §12) added to the contract with reader `hook`; the store takes the wait as a parameter (decision 11) | spec §8 item 7, §12; V3 contract rule "each key names its one reader" |
| V5 | Schema version 1 or 2? | 1, frozen by a fixture (decision 12). The V3 plan's "1 to 2" was superseded on the branch | `core/src/state.rs:30` (`SNAPSHOT_SCHEMA_VERSION = 1`); branch spec §6.4 "the schema version stays 1 ... V2 freezes version 1" |
| V6 | Is an observer on the write path a test switch? | No: a parameter of the one code path that skips nothing, as `durable-file` does (decision 8) | `packages/durable-file/rust/src/lib.rs:179-202` (`replace_durably_observed`), `:56-80` (`FileSystem` checkpoints) |
| V7 | What happens to an unreadable snapshot? | Refused, never overwritten (decision 7) | spec §6.4 (a cap "that is never reset"); §10 crash row |
| V8 | What is "the size ceiling"? No key exists | A per-sender header ceiling derived from the contract (phase 7); a byte cap would be a new number, so it is owner Q1 option (d) | `limits.v1.json` (no size key); `sweep.rs` header horizon |
| V9 | How are `head` and `handle` bounded? | `handle` by `frame.maxHeaderChars` in the core (decision 10); `head` by construction | `core/src/registry.rs:31-55`, `store/src/head.rs` `head_text` |
| V10 | Does body naming become a Convention kind? | Not now; recorded as a candidate (decision 13) | convention spec §1 admission rule, §2 "Must not own" |
| V11 | Who removes durable-file temporaries left by a kill? | The send-hold sweep, by listing known names (decision 5b), without parsing durable-file's private format | `durable-file/src/lib.rs:261-264` (temp name), `event-store/src/identity.rs` (the copy V2 avoids) |
| Q1 | Header retention against the 50 ms hook target | owner question Q1, provisional default (a) measure and report | intent: retention policy |
| Q2 | Dead bindings addressable until pruned | owner question Q2, provisional default (a) keep | intent: name resolution semantics after a decided Q2 |

### Verification Results

- Tier: Full (8 phases). Claims checked: 41 (paths, line numbers, symbols, helper functions, test files, commands).
- Verified: 37 | Failed: 4 (all fixed) | Unverified: 1.
- Failures fixed: (1) `self_identity()` returns a `ProcTuple`, not a `Record`; the dead-head recipe now uses `identity_of(pid)...to_record()` (`facts.rs:50,285`). (2) `common::limits_contract()` returns the raw contract `Value`; the loader is `serde_json::from_value(common::config_section(..))` as in `tests/limits_contract.rs:8`. (3) Phase 2 test 1 asserted the lock path through a handle the hold does not expose; the lock is now proven where a second party takes it (phase 4 (a), phase 5 test 5) and no test spells the path. (4) Line references corrected: `state.rs:88,113-119`, `holder-lock-checks.mjs:392`.
- Unverified (left to phase 7): whether the ceiling test fits a debug test run; the plan's risk names the fallback.

### Whole-Plan Consistency Sweep

Searched all files for `limits_contract()` (one loader), `self_identity` (only V3's own-process use), lock-path literals (none outside `paths.rs` and the registry), `schema version 2` (none), `lockWaitMs` (phase 1 adds, phases 5 and 8 use), `Step::` names (phase 4 table equals the plan's architecture list). No contradiction left.

## Red Team Review

### Session 1 — 2026-10-22

Four lenses, run as two hostile `code-reviewer` agents (Security Adversary + Failure Mode Analyst; Assumption Destroyer + Scope & Complexity Critic; dispatch decided `in-process` by `fgos dispatch decide --for review --needs-soul --has-live-task-access`) plus the planning lead's own pass. Every finding below carried a `file:line` citation, so none was rejected by the evidence filter. 26 raw findings, deduplicated to 15. Accepted 15, rejected 0 (two partly, see the notes). The owner was not asked: the planning lead cannot ask the owner, and no finding reverses a decided input.

| # | Severity | Finding | Disposition | Applied to |
|---|---|---|---|---|
| 1 | Critical | Sweep and 5(a) deletion could follow a symlinked `record/` or `bodies/` and delete outside the record; check-then-use on paths | Accept: per-hold directory check before any write, deletion only through a dev/inode-checked `O_DIRECTORY|O_NOFOLLOW` descriptor with `unlinkat`, regular files only. Residual: `durable-file` writes by path, so the boundary stays confinement (risk line) | decisions 5-6, architecture, phase 2 req 4 + test 7c, phase 3 test 10 |
| 2 | High | A FIFO at `snapshot.json` or a body blocks `open` under the mutex and stops mail project-wide | Accept: `O_NONBLOCK` + `fstat` regular file before reading | decision 6, phase 2 test 7b, phase 3 test 7 |
| 3 | High | An error after the rename was reported as "nothing happened", so a retried send duplicates mail and budget | Accept: commit point = rename; `RecordError` only before it; after it `Held { wrote: true, warning }` | architecture, phase 2 req 3 + test 7d, phase 4 |
| 4 | High | V5's breaker file lives beside the snapshot and is written without the mutex; the sweep would delete its temporaries | Accept: snapshot and bodies move to `runtime/mailbox/record/`, written only under the mutex; `runtime/mailbox/` stays for lock-free writers and is never swept | decision 5, paths, phase 3 test 5, phase 8 §6.4 |
| 5 | High | Phase 4 could not recompute the "new" state (random ids) | Accept: before `Renamed` bytes equal old; from `Renamed` the change is checked structurally | phase 4 row 1 |
| 6 | High | Phase 7 ceiling assumed a registered head could send at the budget rate for a week; `session.lifetimeCap` caps a generation at 200 | Accept: the saturated sender is `~unregistered`; per-generation bound stated; Q1 text corrected | phase 7, Q1 |
| 7 | Medium | "Size ceiling" bounds one identity, not the snapshot; the snapshot read has no cap; the wait cap does not bound release (`settle_release` up to 2000 ms) | Accept (partly): outcome renamed to a per-identity ceiling; snapshot-wide cap and wall-time facts added to owner Q1 option (d); no new number invented | outcome 7, Q1 |
| 8 | Medium | Phase 5 test 5 asserted unchanged bytes after releasing a child paused with a pending write | Accept: child paused at `Locked`; bytes checked before release, child's single change after | phase 5 test 5 |
| 9 | Medium | Phase 5 test 4 flakes: the winner exits and becomes `Dead` before the loser judges it | Accept: children block after writing their outcome until the parent has read both | phase 5 test 4 |
| 10 | Medium | Phase 5 test 1's 2x budget holds only for registered senders with distinct accounts | Accept | phase 5 test 1 |
| 11 | Medium | Phase 3 test 4 asserted `body_kept == false`, a state the contract values never produce, through a hold that does not sweep | Accept: header horizon equals body retention; assert header and body gone after a sweeping registration hold | phase 3 test 4 |
| 12 | Medium | `Record::body`/`send` signatures open and inconsistent; `send_observed` used in phase 3 before phase 4 built it; a second error code for an older snapshot | Accept: `body(id, expected_bytes, limits)` with sizes read in hold 1; `send(req, ..)`; `Step`/observed holds in phases 2-3; reuse `SnapshotVersionError::code()` | architecture, phases 2-4 |
| 13 | Medium | Duplicate proofs: phase 1 hook-key case, phase 4 registering-hold rows, phase 6 TTL refusal and lifetime re-proof | Accept: existing V3 test covers the key; one wiring kill case; phase 6 keeps store facts only, citing the core owners | phases 1, 4, 6 |
| 14 | Medium | Cost scenarios missed contended holds and pruning on the drain pair; the example could write into a live `.fgos` | Accept: `contended` and `dead-bindings` x claim+finish added, acquire/critical/release reported apart; example builds and removes its own `.fgos` | phase 7 |
| 15 | Medium | Phase 1 read V3's status on the branch before merging main (plans close on main); the drift base was stale | Accept: sync first, read status from `origin/main`; drift base updated | phase 1 |

Planning-lead items folded in as well: test-binary `child_entry` per spawning file, ready files outside the record directory, the record module denies `unwrap`/`expect`/`panic` (`hook/mod.rs:3`), and the Convention gate uses `check --all` because explicit paths fail in the activated release.

Not raised as findings, recorded as risks: `LockScope::seeded(vec![])` checks no rank against locks the caller already holds (V5 wiring); `ScopeError::Registry` also wraps `create_dir_all` I/O errors (mapped to `io`, phase 2 req 3).

### Whole-Plan Consistency Sweep

Decision delta: layout `runtime/mailbox/record/`; commit point at the rename; `Held<R>`; `O_NONBLOCK` reads; per-hold directory check; observed holds from phase 2; core version codes reused; unregistered saturated sender. Searched every file for `snapshot-older`, `SnapshotOlder`, `Every error leaves`, `runtime/mailbox/snapshot`, `send(req, body`, `Record::body(&MessageId, &Limits)`, `7fb7c4f4b` as a base, `paused at \`Mutated\``, `registered sender sends`: none left outside history lines. The phase 7 title keeps the spec's own words "size ceiling", and its body defines the per-identity ceiling. No unresolved contradiction.
