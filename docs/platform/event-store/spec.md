# Event Store Component Specification

```txt
Document type: BA-grade area specification
Audience: Human reviewer, maintainer, implementation agent
Purpose: Define the single authority for how an fgOS event becomes durable, how it is sealed into git objects on per-machine refs, how it is shared across machines, and how it is read back
Design status: Draft v2, pending council confirmation and owner signature of the superseding decision
Implementation status: Not started
Canonical: No (becomes canonical when the owner signs the decision in section 26)

Owner: Event Store component
Source (planned): packages/event-store/rust (crate fgos-event-store); Node facade src/event-store/
Contracts (planned): packages/event-store/contracts/
Last reviewed: 2026-10-17
Supersedes on signature: L3 clauses 1 and 4 in docs/platform-foundations.md (D-ID ae461c8b); D-ADR0003 data layout
Related:
- docs/platform-foundations.md (L3, L7, L10)
- docs/platform/holder-lock/spec.md
- docs/platform/session-identity/spec.md
- docs/platform/component-boundary.md
- plans/261016-1306-main-checkout-single-door-hot-lock/plan.md (4.3-S)
- plans/261017-1313-fgos-platform-program-board/plan.md
- plans/reports/council-261017-1210-event-store-final-packet.md
- plans/reports/experiment-261017-1220-event-store-exp1-relocate-open-shards.md
- plans/reports/experiment-261017-1220-event-store-exp2-seal-first-merge-crash.md
- plans/reports/research-261017-1102-fgos-event-store-drift-history.md
- council run wf-run-1792216377992-d45c6038 (final packet round 2, red-team round 2)
```

Version 2 was written by run `wf-run-1792220971594-ec5449e2` from the draft that council `wf-run-1792216377992-d45c6038` rejected as an implementation contract. The changes from that draft and the questions still open for the owner are listed at the end. It awaits confirmation by a reopened architecture council.

## 1. Purpose

Event Store owns one decision: how an event of any fgOS domain becomes durable on the machine that wrote it, how it is sealed into immutable git objects on that machine's own ref, how those refs are shared between machines, and how the union of all of it is read back in one deterministic order. Work is the first consumer; porting, observe and decisions follow.

Event truth stops being files in the git work tree. An event is appended to an open log outside the work tree and acknowledged after `fsync`; it is then sealed, on a cadence, into a commit on `refs/fgos/events/<machine-id>` through git plumbing that touches no index, no work tree, no HEAD and no hook-running porcelain. Machines exchange events by pushing their own ref and fetching the others; the read side is the union by event hash. Views are caches owned by consumers and are rebuildable.

## 2. Decisions this spec implements

Owner decisions of 2026-10-17:

| Decision |
|---|
| Direction B "seal first" (the upstream repository-harness model), not a second operational database |
| The working database is a consumer-owned cache view, rebuildable from events |
| Claims and leases are runtime state, outside the event store |
| Hybrid publication scope per stream type: `project`, `branch`, `local`; Work is `project` |
| The core is one Rust crate shared system-wide with a thin Node facade; reducers stay with their consumers |
| Q1 (a): sealed events live as git objects on a dedicated ref per machine, `refs/fgos/events/<machine-id>`, never as files in the work tree |
| Q2: the owner develops on three machines; events are shared by pushing the own ref and fetching the others; the view is the union by hash |
| The view is readable through the usual verbs and refreshable by commands (sync, rebuild, status, export), with an incremental cache keyed by ref tips |
| Seal cadence default: on lifecycle events, else after 300 s (`eventStore.seal.intervalSec`), else at clean writer exit |

Decisions taken by this spec inside that frame (agent decisions, reported, not owner decisions): one open log per store and stream instead of one per writer (section 9); a per-store sequence and a `seen` vector instead of wall-clock order (section 12); the storage location is the git common dir with no override (section 8); a non-git directory is refused (section 8); publication never takes `main-checkout` or the Work gate (section 4); `fgos rebuild` stays the one rebuild door (section 15); fetch refspec is configured, push refspec is not (section 14).

The council rejected the draft as an implementation contract for six reasons, each fixed here: C1 (section 13), C2 (section 12), C3 (section 11), the overclaim of experiment 2 (section 24), the rollback against `src/state/replay.mjs:876-880` (section 18), and the O1-O7 labels (this section).

## 3. Ownership boundary

| Owns | Does not own |
|---|---|
| The envelope v4, canonical serialization and event hash; the v3 legacy reading rule | What an event means; reducers and views of each domain |
| The stream registry: type, scope, `sealOnWrite`, schema version | Which domain owns which type (the consumer registers it) |
| The machine id and the store id (section 5) | Writer identity (Session Identity) |
| Open logs: location, append, `fsync`, torn-tail repair, per-stream sequence | Business preconditions and the Work critical section (the consumer, under its own gate) |
| Sealing: rotation, git object layout, compare-and-swap ref update, receipt, recovery | Locks as a mechanism (holder-lock); Event Store only declares its two lock rows |
| Reading: the reader protocol, verification, dedupe, deterministic order, cursors | Claims, leases, worker slots (runtime) |
| Sharing: fetch refspec, push of the own ref, reconciliation of the own ref, mirrors | Work-tree commits, merges and land (Git component; today the 4.3-R main door) |
| The verbs `fgos events sync|status|export`, the store part of `fgos rebuild`, the doctor checks of section 21, the migration | Scheduling any process; there is no daemon |

There is one implementation of the core: the Rust crate `fgos-event-store`. The Node facade `src/event-store/` decides nothing. Rust consumers (observe, `fgos-work-state`) link the crate. Git access for `refs/fgos/*` goes through one publication port inside the crate; its git driver is the only code in fgOS that writes those refs, and it moves behind the Git component's port when that component exists (section 20).

## 4. Layering and locks

```text
consumers (Work, porting, observe ...)    register streams; own gates, reducers, caches
     |  read(cursor) / append(stream, events, cursor) / seal / sync / export
Event Store (fgos-event-store)            envelope, open logs, seal, reader, order, sharing
     |                 |                    |
holder-lock         Session Identity     publication port -> git object store (refs/fgos/*)
(event-append,      (writer id, src)      plumbing only: no index, no work tree, no HEAD,
 event-seal)                              no main-checkout lock, no main door
```

Event Store never imports a consumer. A consumer never writes an open log or a ref itself.

Two new registry rows in `packages/holder-lock/contracts/lock-registry.v1.json`, both kind `mutex`, scope `repo`, path template `<eventOpenRoot>/locks/<name>.lock` (a new template resolved by section 8):

| Lock | Rank | Held for | Taken by |
|---|---|---|---|
| `event-seal` | 58 | one seal or one sync | any process of the store, `try` for opportunistic triggers, wait for explicit verbs |
| `event-append` | 70 | one append (write + `fsync`) or one rotation rename | the crate, in process, never across a git call |

Rank order today (`docs/platform/holder-lock/spec.md:114-126`): `main-checkout` 50, git `index.lock` 55, `state` 60. Consequences, enforced by the rank rule (`docs/platform/holder-lock/spec.md:155`):

- An append may run inside the Work gate: `state` (60) then `event-append` (70).
- A seal or sync can never run inside the Work gate: `event-seal` (58) under `state` (60) throws `lock-order-violation`. The facade also refuses `seal` and `sync` with `event-store-seal-under-state` when the caller's `LockScope` holds `state`, because the gate and the route may live in different processes.
- Publication takes no rank-50 lock at all. It never calls `withMainCheckout`, never uses the `checkpointMainFgos` adapter, and never touches `main-checkout.lock`.
- No Event Store route ever takes `state`, so a process holding `state` that waits on `event-append` cannot deadlock with a sealer: the sealer holds `event-append` only for a rename and never waits for `state`.

## 5. Identities

| Identity | Meaning | Source |
|---|---|---|
| Machine id | Names the published ref `refs/fgos/events/<machine-id>` | 1. repository-local git config `fgos.machineId` (per clone, never tracked); 2. `<stateRoot>/machine-id`, minted once by the setup fix as `<hostname-slug>-<6 random base32>`. Format `^[a-z0-9][a-z0-9-]{1,62}$`. `stateRoot` is holder-lock's (`docs/platform/holder-lock/spec.md:168-178`), so a process with another state root is another machine, as holder-lock already defines |
| Store id (`origin`) | Ordering identity of one open root; one per clone | Minted at first append, random 128-bit, written once to `<eventOpenRoot>/store.json` with the machine id at creation. Moving the clone moves the file, so the store keeps its id |
| Stream | One sequence space inside a store: `project`, `local`, or `branch:<branch-key>` | Scope of the registered type; branch key below |
| Writer | Who wrote the event (`src`) | Session Identity `{id, source}`; recorded, never used for order or lock authority |

The ref is per machine because that is the unit of sharing; the store id is per clone because two clones on one machine have independent open logs and must not share a sequence space (section 14).

## 6. Envelope

One event is one JSON line.

| Field | Meaning |
|---|---|
| `v` | 4 (3 is the legacy shape, read by its own rule) |
| `type` | Registered stream type, `<domain>.<name>` or a legacy name such as `decision` |
| `scope` | `project`, `branch` or `local`, copied from the registry at append |
| `origin` | Store id |
| `stream` | `project`, `local` or `branch:<key>` |
| `seq` | Per (`origin`, `stream`) monotonic counter from 1, assigned by the store under `event-append`, never reset by sealing, restart or rotation |
| `seen` | Map `"<origin>:<stream>" -> seq`: the highest event of each other stream the writer's view had folded when it decided (section 12). Own stream omitted |
| `ts` | Writer wall clock, ISO 8601; informational and a last tie-break only |
| `src` | Writer id from Session Identity |
| `schemaVersion` | Payload version declared by the consumer |
| `payload` | Domain data, opaque to the store |
| `h` | Full SHA-256 hex of the canonical line without `h` |

Canonical serialization: keys sorted, no insignificant whitespace, UTF-8, one trailing newline. `h` is the event identity.

Legacy v3 lines (`{seq, ts, type, payload, v, src, h}` with a 16-hex `h` of `JSON.stringify` in insertion order, `src/state/events.mjs:480-498`; baseline lines with no `h`) are verified and deduplicated by their own rule (`src/state/replay.mjs:882-889`: `h` when present, else the raw line), never re-canonicalized and never rewritten.

## 7. Streams, scopes and refs

A consumer registers each type once in a versioned contract file of its own package: `type`, owning domain, `schemaVersion`, `scope`, and `sealOnWrite` (true for lifecycle types). Rules:

1. A type keeps one scope for its life; changing scope is a new type.
2. Shared truth is `project` only. Anything another session or machine must rely on (item status, answers, decisions, approvals, land results) may not be `branch`. Every `work.*` type and `decision` are `project`.
3. A `branch` event may name a `project` entity; a `project` event never points into branch content.
4. Appending an unregistered type is refused (`event-store-unregistered-type`).

| Scope | Sealed into | Pushed | Visible to |
|---|---|---|---|
| `project` | `refs/fgos/events/<machine-id>` | yes, by sync | every worktree of the clone at once (open log); other machines after seal, push and their fetch |
| `branch` | `refs/fgos/branch-events/<machine-id>/<branch-key>` | never | that branch's consumers; the project after promotion |
| `local` | `refs/fgos/local-events/<machine-id>` | never | this clone only |

Branch key: a slug of the worktree's branch name at the stream's first append, recorded in the stream; it survives a worktree move; a branch rename is not followed (known limit). Promotion at land is a `project` event `store.promote {stream, throughSeq, tip}` appended by the land operation (a consumer policy of the Git component, like the Iron Law gate); the seal commit that carries it has the branch tip as a second parent, so the branch objects travel with the project ref. Promoted branch events are ordered at the position of their promote event. Abandon deletes the branch ref and the branch open log; nothing in the project ever references them. A branch stream whose worktree is gone without land or abandon is an orphan: `fgos events status` and doctor list it, and nothing promotes it automatically. No consumer registers a `branch` type today; the contract is fixed now so the first one does not invent another path.

## 8. Open root (storage-location port)

`<eventOpenRoot>` is `<git-common-dir>/fgos/events`, resolved once per process with `git rev-parse --path-format=absolute --git-common-dir` (git 2.31 or newer), environment scrubbed of `GIT_*`. Every linked worktree of a clone resolves the same root, so all sessions of one clone share one store. There is no environment or config override; tests use real temporary repositories. This removes the two-override precedence gap the council found in the draft.

Layout:

```text
<eventOpenRoot>/
  store.json                       {v, storeId, machineId, createdAt}; written once
  locks/event-append.lock, locks/event-seal.lock
  <stream>/active.jsonl            the one log being appended
  <stream>/closed/<first>-<last>.jsonl   rotated, immutable, awaiting publication
  <stream>/hwm.json                {lastSeq} written at rotation (tmp, fsync, rename, fsync dir)
  <stream>/sealed.json             {lastSeq, commit} last receipt; a cache, verified against the ref
```

Topologies: a plain repository, a linked worktree (also on another filesystem, because the open root is in the common dir), `--separate-git-dir`, and a bare repository with worktrees resolve to one valid root (measured by experiment 1, `N-2`). A submodule has its own common dir and therefore its own store; that is correct and documented. A directory that is not a git repository is refused with `event-store-no-repository`; fgOS Work already depends on git worktrees and merges, so this spec does not add a second, non-git storage form. The open root must be on a local filesystem with atomic `rename` and directory `fsync`; holder-lock's `guarantee(path)` is asked for `<eventOpenRoot>/locks`, and `none` (NFS, SMB, CIFS) refuses with `event-store-unsupported-filesystem`.

Deleting a clone deletes its unsealed events. That is the price of keeping open logs with the repository they belong to; the seal cadence bounds it (section 16).

## 9. Append (the ack point)

`append(stream, events[], {cursor})`, one batch is one settlement unit:

1. Before any lock: validate types against the registry, resolve the writer id, canonicalize payloads.
2. Take `event-append` (in process, a kernel lock through the crate).
3. If `active.jsonl` ends without a newline, the bytes after the last newline belong to an appender that died before its ack: truncate them (the lock proves no live appender is mid-write). This is automatic recovery, not a doctor step.
4. Read the stream's last `seq` (tail of `active.jsonl`, else `hwm.json`). If `cursor` names this stream and its `seq` differs from the current last `seq`, refuse with `stale-cursor`: the caller decided on a view that missed an event of its own stream. This is a stream-level second net, never business CAS.
5. Assign consecutive `seq`, set `seen` from the cursor, compute `h`, write all lines with one `write`, `fsync` the file, and `fsync` the directory when the file was created.
6. Release. Return `{origin, stream, firstSeq, lastSeq, h[]}`.

The ack point is the end of step 5: the events survive a process crash and an operating-system crash on a filesystem that honors `fsync`. Until sealed they are L7 level D5 (this machine only, `docs/platform-foundations.md:184-190`); after seal they are D2 in the local object store; after push a remote copy exists. A batch is all-or-nothing for readers: they fold only complete lines, and a torn batch is never acked.

One open log per stream, not per writer: the per-writer files of today (`src/state/store.mjs:146-180`) existed so that tracked files would merge; outside the work tree that reason is gone, and one log under one lock gives the per-store total order section 12 needs.

## 10. Seal

`seal(stream)` runs under `event-seal`, never inside the Work gate (section 4). Steps:

1. **Rotate.** Under `event-append`: if `active.jsonl` is non-empty and ends with a newline, `fsync` it, rename it to `closed/<first>-<last>.jsonl`, `fsync` the directory, write `hwm.json`. The next append creates a new `active.jsonl`. Release `event-append`. Appends wait only for this rename.
2. **Publish**, for each closed segment in `seq` order, with no append lock held:
   1. Verify the segment: every line's `h`, `seq` contiguous, `first` equal to the own stream's last sealed `seq` plus one (read from the ref chain; `sealed.json` is only a cache). A gap stops with `event-store-chain-gap`.
   2. Write the objects of a sealed changeset:
      - blob `events.jsonl`: the segment bytes, unchanged;
      - blob `seal.json`: canonical `{v: 1, kind: "seal", origin, stream, scope, machineId, firstSeq, lastSeq, count, sha256}` where `sha256` is that of the segment bytes;
      - tree with exactly those two entries;
      - commit: parent is the ref's current tip (none for the first), plus the branch tip for a commit that carries a promote event; author and committer `fgOS Event Store <event-store@fgos.invalid>`; message `fgos-events seal <origin>:<stream> <first>..<last>`.
   3. Compare-and-swap the ref: `update-ref <ref> <new> <old>` with the tip read in step 2.1 as `<old>` (the all-zero id when the ref is new). Through the publication port: `gix` in process, or `git` plumbing with `-c core.fsync=objects,reference -c gc.auto=0 -c maintenance.auto=false`; no index, no work tree, no porcelain. A mismatch means an actor outside the store moved the ref: stop with `event-store-ref-moved`, keep the segment, doctor fails.
   4. Receipt: read the ref back and the blob of `<new>:events.jsonl`; the ref must equal `<new>` and the blob's SHA-256 must equal the segment's. The receipt `{ref, commit, sha256, firstSeq, lastSeq}` goes to `sealed.json`.
   5. Only after the receipt: delete the closed segment and `fsync` the directory.
3. Re-list `closed/`; repeat while segments remain (bounded per call), so a lifecycle seal that lost the `try` race is picked up by the running sealer.

Recovery is part of every seal and every sync; any process of the store runs it, so the events of a crashed session are sealed by the next fgOS command on that clone, with no `doctor --fix`:

| Crash point | What remains | Next seal does |
|---|---|---|
| During append | Torn tail, never acked | The next append truncates it under `event-append`; readers ignore it |
| During the rotation rename | `active.jsonl` or the closed segment, never both (atomic rename) | Normal publish |
| After objects, before `update-ref` | Unreachable objects; segment intact | Publishes again; old objects are garbage for git |
| After `update-ref`, before the receipt or the delete | Segment and a ref that already contains it | Finds the ref's last sealed `seq` covering the segment, checks the blob hash, deletes. A hash mismatch stops with `event-store-seal-mismatch` and deletes nothing |
| After the delete, before the directory `fsync` | The segment may reappear after power loss | Same as the previous row |

Invariants: data moves only forward, `active` to `closed` to ref; each move makes the next location durable before it removes the previous one; a ref moves only forward by compare-and-swap and is never rewound by the store; a segment is deleted only after a verified receipt; nothing is truncated except an unacked torn tail.

## 11. Reader protocol and read boundary

`read(streams, cursor)` returns every event with `seq` above the cursor for each requested stream, verified, deduplicated by `h`, in the order of section 12, plus the new cursor. For the store's own streams it reads in the same direction the data moves:

1. Open `active.jsonl` and read it through that descriptor; fold only complete lines.
2. List `closed/` and read each segment; a segment that vanished (`ENOENT`) is recorded.
3. Read the ref tip, then walk the chain back to the commit that covers the cursor, reading only the missing ranges.

Why no acked event is lost and none is counted twice while a seal runs: an event acked before the read starts is in `active`, in `closed`, or in the ref. If it leaves `active` before step 1 opens it, the rename has already put it in `closed`, which step 2 lists later. If its segment is deleted before step 2 reads it, the ref already contained it (deletion follows the receipt), and step 3 reads the ref later; refs only move forward. Reading a range from both a segment and the ref is removed by the `h` dedupe. The result must be contiguous from the cursor to the highest `seq` read; a hole the ref does not fill is `event-store-gap` (corruption, never skipped).

Read boundary: own-clone events are visible to every worktree of the clone from their ack, including unsealed ones; an append in progress may or may not be visible; a torn tail is never visible. Events of other machines are visible after they seal and push and this clone fetches. Events of another clone on the same machine are visible after both sync, like another machine.

Foreign streams are read from mirror refs (section 14), and the legacy history from `refs/fgos/legacy` (section 18). This protocol is a design argument; it must pass the model check and stress test of section 23 before code is accepted.

## 12. Order

Wall clock never decides order alone.

- Inside one stream: `seq`.
- Across streams: event `b` comes after event `a` of stream `S` when `b.seen[S] >= a.seq`, or when both are in one stream with `a.seq < b.seq` (this is causal: under a consumer gate the writer's view is the cursor it passes, section 9).
- Promoted branch events take the position of their promote event.
- Legacy events precede every v4 event, in the legacy order `(ts, file, seq)` with the legacy dedupe, exactly as `src/state/replay.mjs:870-889` does today, because the legacy import keeps every file name (section 18).
- Events that are concurrent (neither comes after the other) are ordered by `(ts, origin, stream, seq)`. This is deterministic on every machine because all four fields are inside the hashed bytes.

Consequences, stated as the contract:

- On one clone, every acknowledged precondition holds again at replay, because the Work gate makes each writer's view current for its own stream.
- Across clones and machines, a success is final against every event its writer had seen and provisional against concurrent events it had not seen. When a later sync brings a concurrent event that makes a replayed precondition false, the consumer's reducer must record a conflict instead of applying the event. Work must implement that reducer rule before a second store's `project` events are folded into its view (acceptance item in section 23). Event Store reports the concurrency; it never picks a business winner.

## 13. Work gate: the read-check-append serialization (C1)

Today every Work mutation runs read, precondition and append as one critical section under `events.lock`, and refreshes the view inside the same lock:

| Mechanism today | Code |
|---|---|
| The lock and its reason (duplicate `seq` without it) | `src/state/events.mjs:26-52`, `withEventsLock` at `:416` |
| Read-check-append plus view refresh in one section (tsk-1q5 lost-update fix) | `src/state/store.mjs:222-255` (`refreshView`, `withEventsLockAndRefresh`) |
| Lock deliberately scoped to the whole `.fgos/`, because a per-file lock would stop serializing the CAS preconditions | `src/state/store.mjs:132-140` |
| `moveWork` lookup, `expectedStatus` CAS and append | `src/state/store.mjs:646-668` |
| `addWork` existence check and append | `src/state/store.mjs:275-284` |
| `settleClaim`: `claims.lock` inside `events.lock`, re-read of the claim | `src/state/store.mjs:1147-1170` |
| Registry: `state` hot-mutex, rank 60, replacing `events.lock` and `claims.lock` | `lock-registry.v1.json:164-170` |

This spec keeps that serialization and moves only the append target. The gate is Work's, not the store's: plan 4.3-S's `withStateTx` on the `state` hot-mutex (rank 60, one per clone, `<fgosDir>/locks/state.lock`) is the Work gate. A Work mutation becomes:

1. Before the gate: resolve writer id and anything that needs a child process.
2. Inside `withStateTx(state)`: `read(project, cursor)` and fold into the cache view; check the precondition (FSM, capacity, claim); `append(project, events, {cursor})` and treat `stale-cursor` as a bug; fold the new events and write the cache with the new cursor; settle the claim if any.
3. Release the gate, ack to the caller.
4. After the gate: if any appended type is `sealOnWrite`, `seal(project)` with `try`.

The per-stream `event-append` lock protects only the bytes and the sequence of one open log; it never replaces the gate. The draft's lines "Per-writer lock; writers never contend" (draft section 11) and "P01 and P02/P04 are re-cut around claims only" (draft section 15) are withdrawn. Porting keeps its own gate (`porting-events`, rank 60, `src/state/porting-store.mjs:89`) the same way.

## 14. Sharing across machines

Refs in each clone:

| Ref | Written by | Exchanged |
|---|---|---|
| `refs/fgos/events/<own-machine-id>` | this clone's store (seal, reconcile) | pushed by sync, never force |
| `refs/fgos/mirror/<remote>/events/<machine-id>` | `git fetch`, through the refspec setup writes | fetched; read-only to the store |
| `refs/fgos/legacy` | the cutover, once | pushed once, fetched like the others |
| `refs/fgos/branch-events/...`, `refs/fgos/local-events/...` | this clone's store | never |

Setup adds one fetch refspec to the remote named by `eventStore.remote` (default `origin`) in the repository-local git config: `+refs/fgos/events/*:refs/fgos/mirror/<remote>/events/*`, plus `+refs/fgos/legacy:refs/fgos/mirror/<remote>/legacy`. Every plain `git fetch` then keeps the mirrors current. Setup never writes a push refspec, because a configured `remote.<name>.push` changes what a person's bare `git push` sends. Fetching into a mirror namespace means a fetch can never overwrite the own ref.

`fgos events sync [--remote <name>] [--no-push]`, under `event-seal`:

1. Seal every pending segment of every stream.
2. Fetch the refspec.
3. Reconcile the own ref with its mirror: own descends mirror, push; mirror descends own (own ref restored from elsewhere), fast-forward own by compare-and-swap; diverged, write a merge commit on the own ref with both tips as parents and `seal.json {kind: "merge"}`, compare-and-swap, then push. Never force-push.
4. `git push <remote> refs/fgos/events/<own>:refs/fgos/events/<own>` (and `refs/fgos/legacy` once).
5. Record the result (time, tips, error) for `status`; tell registered consumers that mirror tips changed.

Triggers: the explicit verb; and the opportunistic check of section 16 when the last successful push is older than `eventStore.sync.intervalSec` (default 300; 0 means explicit only). Network calls never run inside the Work gate.

Offline: append, seal and read work fully; fetch and push fail, the failure is recorded, `status` shows "unpublished since", the next trigger retries; Work is never blocked by the network. A clone with no remote keeps everything local.

Two clones on one machine share a machine id by default (one `stateRoot`), so both write `refs/fgos/events/<id>` in their own repositories with different store ids. The first push wins; the second sync finds a diverged mirror and writes a merge commit, so both chains converge on the remote with nothing lost and no shared sequence (store ids differ). Doctor warns `event-store-machine-ref-shared` when the mirror of the own id carries another store id, and names the fix: `git config fgos.machineId <other-id>` in one of the clones.

A forge may hide custom refs in its UI; reading them goes through `fgos events export` or `git log -p <ref>`. Whether the owner's remote accepts and serves `refs/fgos/*` is a proof item, not an assumption.

## 15. Views, cursors and verbs

A view is a cache owned by its consumer (Work: `.fgos/cache/state.json`, `src/state/fgos-file-registry.mjs:36`), never tracked, never truth, rebuildable from zero. A consumer may choose another engine, SQLite included, without touching this spec; that engine's concurrency is the consumer's concern.

The cursor is the cache key: per stream the highest folded `seq`, plus the tips of the mirror and legacy refs. A consumer that reads with its cursor gets:

- only new events of the store's own streams, when no mirror or legacy tip changed: fold incrementally (they come after everything folded, because the writer's `seen` equals the cursor under the gate);
- `rebuildRequired`, when a mirror or legacy tip changed: refold from zero, because foreign events can sort before folded ones.

The usual verbs (`fgos list`, `show`, `ready` and the others) read the consumer's view after one `read(cursor)` catch-up. Commands:

| Verb | Does |
|---|---|
| `fgos events sync` | Section 14 |
| `fgos events status [--json]` | Store id, machine id, every ref and tip, per stream unsealed count and oldest unsealed age, closed segments pending, last receipt, last fetch and push with result, own ref ahead/behind its mirror, orphan branch streams, the guarantee level of the open root |
| `fgos events export [--stream <s>] [--since <cursor>] [--format jsonl|legacy-layout] --out <dir>` | Canonical-order JSONL, or the legacy file layout with a parity report (section 18) |
| `fgos rebuild` | The existing rebuild verb (`src/cli/command-registry.mjs:1393`) stays the one rebuild door: it drops every registered consumer cache and refolds from the store |

## 16. Seal cadence and loss budget

Owner default, configurable by `eventStore.seal.intervalSec` (default 300):

| Trigger | Action | Who |
|---|---|---|
| A `sealOnWrite` type was appended (Work: status move, answer, decision, approval, land result) | `seal(project)` right after the gate is released | the appending process |
| The oldest unsealed event is older than the interval | seal every stream | the opportunistic check at the start and end of every fgOS command that opens the store, and in the loop of long-lived gateway and runner processes |
| Clean writer exit | seal every stream | session end (session deregistration) and shutdown of gateway and runner |
| A crashed process left a torn tail or closed segments | repair and seal | the next fgOS command on the clone, through the same triggers |

No daemon and no timer exist only for sealing. When no fgOS process runs, unsealed events wait until the next command; that window is not bounded by wall clock and the contract says so. Sealing runs only git plumbing on refs, so the council's objection to sealing on every lifecycle event (one work-tree commit and `index.lock` each) does not apply.

Doctor (`event-store-unsealed`): passes when nothing unsealed is older than twice the interval; warns above that; fails when the oldest unsealed event is older than 3600 s. These thresholds are agent-proposed defaults.

## 17. Node to Rust route and latency budget

The route is not chosen yet. V-SPAWN-01 measured today's path on 2026-10-17 ([experiment-261017-1431-event-store-v-spawn-01.md](../../../plans/reports/experiment-261017-1431-event-store-v-spawn-01.md); Intel i7-13700, `/tmp` on tmpfs, git 2.53.0, Node 24.22.0, 40 samples per row):

| Mutation | p95 at 1 session | p95 at 10 | p95 at 20 |
|---|---:|---:|---:|
| claim (`take`) | 2,174 ms | 19,521 ms | 37,430 ms |
| move (`--expect`) | 125 ms | 290 ms | 480 ms |
| settle (`return`) | 776 ms | 873 ms | 1,556 ms |

One traced `take` on a populated fixture made 983 process clones and 984 successful `execve` calls. The baseline therefore misses the 50 ms target for every mutation at 20 sessions, and "not worse than baseline" alone is too weak; the binding targets are the absolute ones below. Still to measure: each candidate route, read-verb p95, and ext4 instead of tmpfs.

Budget (council producer defaults, owner may change): at most 2 process spawns on the hot path of one claim, move or settle; p95 not worse than the measured baseline and at most 50 ms at 20 sessions; no exhaustion at 20 sessions by 200 mutations in 60 s; no daemon dedicated to Event Store.

A second constraint is fixed by an existing owner decision: `read` and `append` run inside the Work gate (section 13), and plan 4.3 P01 makes any `child_process` call inside a hot critical section throw `exec-under-hot-lock` at once (`plans/261016-1306-main-checkout-single-door-hot-lock/phase-01-hot-lock-core.md:19`). Session Identity already follows the same rule (`docs/platform/session-identity/spec.md` section 5). Candidates:

| Route | Inside the gate | Cost |
|---|---|---|
| N-API addon of the crate, loaded by the Node payload | no spawn | a native addon per platform in the npm package and the legacy-node payload; build and activation checks |
| Host facade (`fgos internal event-store ...` per call, like `lock-fd`) | two spawns per mutation | needs an owner-approved, named exception to the exec guard; red-team round 2 estimated a convoy near 570 ms at 20 sessions |
| Persistent pipe to an already-running host | no spawn | no such host runs on the plain CLI path today |

Seal, sync, export and status run outside the gate; a spawn route is acceptable there. Rust consumers link the crate and pay no route.

## 18. Migration and rollback

Today's tracked truth: `.fgos/events.jsonl` (frozen baseline) and 90 shards `.fgos/events/<writer>-<openTs>.jsonl`; also tracked and stale: `.fgos/state.json` (last changed `55eb7fab6`, 2026-09-18; code reads `.fgos/cache/state.json`) and `.fgos/events.jsonl.backup-tsk-1lv-4-dedup-fix-20260817`, `.fgos/events.jsonl.backup-tsk-n4i-1-20260730T015253Z` (`git ls-files .fgos`).

Stop-everything cutover, one change, on all three machines and every workspace (holder-lock section 12 pattern):

1. Stop every fgOS writer (quiesce scan) on every machine. Each machine commits and pushes its tracked event changes to main (they still merge by `merge=union`).
2. On one machine, pull main. Record the pre-cutover Work view (view and `revision`; the `snapshot` anchor is excluded because the cursor replaces it).
3. Import once: one commit on `refs/fgos/legacy` whose tree holds the tracked files byte for byte under their current names (`events.jsonl`, `events/<name>.jsonl`), plus `porting/events.jsonl` of any workspace that has one, and `seal.json {kind: "legacy", fromCommit, treeOfFgosEvents}`. Keeping names keeps the legacy order `(ts, file, seq)` of `src/state/replay.mjs:876-880` identical.
4. Rebuild the Work view through the new reader and compare with step 2 byte for byte. Any difference stops the cutover.
5. In the same commit on main: delete the tracked event files, `state.json` and both backups; delete the `merge=union` line (`.gitattributes:15`); delete the code of section 19. Push main and `refs/fgos/legacy`.
6. On the other machines: pull main, run setup (refspec, machine id), fetch, rebuild, compare the view.
7. Doctor green on every workspace; resume writers. Old binaries are fenced by activation (plain `fgos` runs the activated release) and by `event-store-legacy-layout`, which fails if `.fgos/events/` or a tracked event file reappears.

Rollback is not "point the facade back": an old release reads files in `(ts, file, seq)` order and cannot read refs, and v4 events written after the cutover sort differently under that rule. Rollback is `fgos events export --format legacy-layout`: it writes the legacy files byte for byte from `refs/fgos/legacy`, writes v4 events as one file per stream with legacy field names, runs a port of the legacy fold (`src/state/replay.mjs:870-889`) on the result, and reports every entity whose view differs from the v4 view. A person decides with that report; then writers stop, the files are committed, and the previous release is activated. Before step 5 is pushed, rollback is reverting the commit.

## 19. What this removes

Each item is deleted in the cutover change (section 18), with every consumer moved (One Door, L10):

| Mechanism | Code | Why it goes |
|---|---|---|
| Tracked event files and per-writer shard naming | `src/state/store.mjs:146-180` (`resolveWriterLogPath`) | Events live in open logs and refs |
| `merge=union` for events | `.gitattributes:15` | No event file is merged |
| Truncation guard, its sidecar and its fallback `git commit` (a second git caller beside the main door) | `src/state/events-jsonl-truncation-guard.mjs` (536 lines, commit at `:514`); doctor `events-jsonl-not-truncated` (`src/setup/registrations.mjs:1965-2031`) | Nothing tracked is appended; the seal verifies hashes and contiguity |
| File compaction and its verifier | `src/state/events-compaction.mjs` (263 lines, no production caller); doctor `events-compaction-verified` (`registrations.mjs:2035-2126`) | It moves tracked files; ref-chain compaction is a later item |
| Event-shard handling in `fgos-write-rejected` restore and self-heal | `src/runner/merge.mjs:686-1164` (event parts only), sweep at `:1565` | Branches never carry event files |
| `events.lock` as a file lock | `src/state/events.mjs:26-52`, `:416` | Its read-check-append role moves to the `state` gate (section 13); its byte role to `event-append` |
| File discovery, `(ts, file, seq)` ordering for new events and the T4 fast path | `src/state/replay.mjs:838-889` and the fast path below it | The store reader and cursor replace them; the legacy order survives only as the legacy rule |
| Direct readers of `.fgos/events` | `src/setup/registrations.mjs:1993`, `:2050`, `:6180`; `scripts/regenerate-observe-fixtures.mjs:106`; `packages/work-state/rust/src/work_source.rs:470-480` | They read through the crate or the facade |
| Tracked stale view and backups | `.fgos/state.json`, two `events.jsonl.backup-*` | Views are never tracked; backups are not truth |
| Event duty of the `.fgos` checkpoint adapter | plan 4.3 P03 `checkpointMainFgos` | No event file needs a checkpoint; the adapter stays null for events |

Not removed here: stripping `.fgos` from worktrees and the general `fgos-write-rejected` guard. Other tracked `.fgos` files (config, distribution, docs index) still exist; an inventory of their consumers decides as a separate item (council: P1, synthesizer, critic). `getMainFgosDir` (`src/state/runtime-coordination.mjs:14`) stays for cache, claims and locks; it is no longer on the event path.

## 20. Relations to other work

**Plan 4.3-S.** The draft's re-cut "around claims only" is withdrawn (C1). P01 (`hot-lock.mjs`, `withStateTx`, `state` hot-mutex) stays as written: it is the Work gate. P02 (claims into `state`, callers onto `withStateTx`) stays; inside the transaction, appends go to the Event Store facade at the cutover, and the route must respect the P01 exec guard (section 17). P04 splits: the capacity check inside `state` stays and can land now; narrowing `main-checkout` to the checkpoint becomes removing `main-checkout` from the claim path, because after cutover there is no `.fgos` event checkpoint (plan 4.3 data flow shows claim taking `main-checkout` 50 only for `checkpointMainFgos`). Because `withStateTx` does not depend on where events are stored, P01, P02 and the first half of P04 can be re-cut and land before the Event Store cutover, which unblocks 6.2 P09 on the critical path.

**Git component.** It will own git operations; the publication port of section 3 (write objects, compare-and-swap a ref, read a chain, fetch, push) is a candidate first slice of G0, and the Event Store driver moves behind it without a protocol change. "Seal before land" and `store.promote` plug into land as consumer policy. The catalogue entries this spec retires are whole mechanism families, not a percentage (the 43/182 figure was rejected by the first packet): tracked event files dirtying checkouts (G-092, G-093, G-120, part of G-029), merges of append-only logs (G-089, G-121, G-170), truncation detection (G-210, G-211, half of G-184), event checkpoints and their cadence (G-118, G-212, G-213), and file compaction (G-090, G-214). Experiment 1 classified the first three families with the files still in the tree; the last two die only because sealed events leave the tree. The exact list is checked in the acceptance review against catalogue freeze 234. Lessons tied to other tracked `.fgos` files (G-054, G-069, G-086, G-088, the rest of G-166) remain.

**Observe and `fgos-work-state`.** They read events through the crate (`work_source.rs:470-480` today reads files). Observe's own stores become `local` streams in a later change.

**Porting store.** It writes `<dir>/porting/events.jsonl` under its own gate (`src/state/porting-store.mjs:28`, `:89`). It becomes an Event Store consumer in the same cutover (its existing log imported into `refs/fgos/legacy`), so no second write path survives. Its scope is declared by its owner.

## 21. Setup, doctor and configuration

Config defaults merged by `fgos setup` (added only when missing, global then project):

| Key | Default |
|---|---|
| `eventStore.seal.intervalSec` | 300 |
| `eventStore.sync.intervalSec` | 300 (0 = explicit sync only) |
| `eventStore.remote` | `origin` |

Repository-local git config, never tracked: the fetch refspec of section 14, and the optional `fgos.machineId`.

Setup fixes: `event-store-machine-id` (mint `<stateRoot>/machine-id` when missing); `event-store-refspec` (add the fetch refspec when the remote exists and the refspec is missing; never a push refspec); `event-store-lock-dirs` (create `<eventOpenRoot>/locks` with mode 0700).

Doctor checks, registered in `src/setup/registrations.mjs`:

| Check | Fails when |
|---|---|
| `event-store-git-version` | git older than the floor of the chosen publication driver (2.31 for path resolution; 2.36 for `core.fsync` when plumbing runs as subprocess) |
| `event-store-open-root` | root does not resolve, not a git repository, or guarantee `none`; prints the guarantee level |
| `event-store-machine-id` | missing or malformed; warns `event-store-machine-ref-shared` (section 14) |
| `event-store-refspec` | remote configured but fetch refspec missing; any push refspec or any refspec matching `refs/fgos/local-events` or `refs/fgos/branch-events` |
| `event-store-unsealed` | section 16 thresholds |
| `event-store-integrity` | a seal blob whose hash differs from `seal.json`, an event `h` that does not verify, a sequence gap in an own stream, `event-store-ref-moved` or `seal-mismatch` recorded |
| `event-store-sync` | warns when the last push failed or is older than 24 h with a remote configured; reports ahead/behind |
| `event-store-legacy-layout` | after cutover: tracked event files, `.fgos/events/`, tracked `state.json` or backups, or a `merge=union` line for events exist; `refs/fgos/legacy` missing or its tree differs from `seal.json.treeOfFgosEvents` |
| `event-store-orphan-branches` | warns per orphan branch stream |

`CHANGELOG.md` gets an `[Unreleased]` entry for the verbs, the config keys, the refspec setup and the removal of tracked event files.

## 22. Support matrix and known limits

- Linux first. macOS follows holder-lock's `flock` driver once the seal crash matrix runs there. Windows is out until the holder-lock Windows driver exists. Network filesystems are refused.
- One user; lock directories are mode 0700; multi-user permissions are out of scope.
- Unsealed events are lost with the disk or the clone; the window is the seal cadence while fgOS runs, unbounded while nothing runs.
- Cross-machine success is provisional against concurrent events of other stores (section 12).
- SIGKILL tests do not prove power-loss safety; the guarantee rests on `fsync` semantics of the filesystem, reported by doctor.
- A branch rename is not followed by the branch stream key.
- Deleting a machine ref on the remote removes it from other clones at their next pruning fetch; the history then lives only on that machine.
- Erasing a secret that reached a pushed ref needs a history rewrite on every clone; there is no tombstone protocol.
- The chain grows with history; ref-chain snapshot and compaction are a later item, opened when a full rebuild exceeds the budget V-SPAWN-01 fixes for reads.

## 23. Proof required before acceptance of the implementation

1. **Kill matrix** on the real crate with real holder-lock locks: SIGKILL during append write, after `fsync`, during rotation, after object write, after `update-ref`, after receipt, after delete. No acked event lost, none doubled, recovery automatic on the next trigger.
2. **Reader versus seal (V-C3-MODEL):** a TLA+ or Alloy model of active, closed and ref with at least two readers, two seal attempts and one appender shows no lost and no double-counted event; then a stress test of at least 10,000 real interleavings.
3. **C1 (V-AUTH-01):** two processes in two worktrees race `moveWork` with the same `expectedStatus`, and two items race the last worker slot: exactly one success each; `settleClaim` behaves as today.
4. **C2 (V-SEQ-01):** clock rollback, equal timestamps, `seq` across seal and restart, delayed foreign events; full rebuild and incremental fold give the same view; a cross-machine concurrent CAS yields the same recorded conflict on all three machines.
5. **Three machines:** three clones against the owner's real remote: push, fetch, an offline period, divergence and merge of a shared machine id, legacy ref distribution; the remote accepts and serves `refs/fgos/*`.
6. **Legacy parity:** the import reproduces the pre-cutover Work view byte for byte; fixtures with equal `ts`, missing `src` or `h`, mixed v3 and v4.
7. **Rollback:** legacy-layout export plus legacy-fold parity report on a fixture with v4 events.
8. **V-SPAWN-01** results meet section 17 for the chosen route, and the route respects the exec guard or carries the owner's exception.
9. **V-DOOR-01:** `rg` finds no git invocation for `refs/fgos/*` outside the publication driver and no `git commit` of event files anywhere.
10. **Topologies:** plain repository, linked worktree on another filesystem, `--separate-git-dir`, bare with worktree, submodule; non-git refusal; git version floor.
11. **Setup and doctor** vectors for every check and fix; full `npm test` and cargo tests green.

## 24. Evidence and its limits

Experiment 2 proved, on Linux with a Node prototype and an `O_EXCL` pid lock, that sealing immutable content-addressed files into tracked paths merges with zero conflicts (6/6, 7/7), that recovery from 100 SIGKILLs over five boundaries works when the open shard stays the recovery source until after the commit, and that append and seal of one writer must be serialized (20/20 under one lock). It did not test reader versus seal, two sealers, real holder-lock, ENOSPC, power loss, Rust, or refs. The ref-based publication of this spec is new: it inherits the ordering idea (never remove before the next location is durable) and nothing else, and must be proven by section 23.

Experiment 1 showed the common dir resolves on every topology listed in section 8 and that relocating open shards passed 1224 of 1250 focused tests with 4 failures that pin the old layout; it was not a full suite. The ref-chain figures from council panelist 2 (26.5 ms per event spawn-bound, 0.16 s for a 35,000-event replay, plain clones do not carry `refs/fgos/*`) come from a scratch repository with synthetic payloads and are not acceptance evidence.

## 25. Out of scope

SQLite WAL and multi-process SQLite semantics: the view is a consumer cache, so whichever engine a consumer picks is that consumer's concern; red-team round 2 proposed adding this expertise, and it does not apply to the store. Also out: a dedicated scheduler or daemon, Windows, network filesystems, multi-user permissions, hard deletion, ref-chain compaction, and removing the `.fgos` strip.

Missing expertise still needed for review: filesystem crash consistency and `fsync` semantics across ext4, APFS, NTFS and WSL2; git internals (ref transactions, packed refs, gc and prune of custom namespaces, refspec behavior of the forge in use); multi-clone reconciliation for event reducers; IPC profiling and lock-convoy dynamics for a Node caller of Rust under 15 to 20 sessions; formal model checking of the reader-versus-seal protocol.

## 26. Decision record

**D-ID `<to be minted by fgos decision; signed by the owner>` — Event truth is sealed changesets as git objects on per-machine refs.** An event is acknowledged when it is `fsync`ed in the store's open log outside the work tree, and becomes git truth when sealed, by compare-and-swap, into a commit on `refs/fgos/events/<machine-id>`; machines share by pushing the own ref and fetching the others; every view is a rebuildable cache. Supersedes L3 clause 1 ("truth = changeset JSONL committed in git, appended in the same transaction as the mutation") and clause 4 ("every write through one CLI door, single writer") of D-ID `ae461c8b`, and the data layout of D-ADR0003 (tracked `events.jsonl`, gitignored `state.json`). L3 clauses 2 and 3 (database is a view, graph store is a second-level view) stand. Review threshold: a recorded cross-machine conflict that a person had to resolve by hand more than once a month, or any acknowledged event lost while fgOS was running.

## Changes from the draft

1. Publication moved from tracked `.fgos/events/<sha256>.jsonl` files committed through the main door to commits on `refs/fgos/events/<machine-id>` by plumbing and compare-and-swap (owner Q1). No `main-checkout` lock, no main door, no index, no work tree.
2. O1-O7 labels removed; owner decisions of 2026-10-17 cited as such; the spec's own decisions listed separately (section 2).
3. C1: the read-check-append serialization is identified in code and kept as the Work gate (`state`, rank 60, `withStateTx`); "per-writer lock, writers never contend" and "re-cut around claims only" withdrawn (sections 13, 20).
4. C2: order by per-stream `seq` and a `seen` vector; `ts` is only the last tie-break for concurrent events; cross-machine success declared provisional with recorded conflicts (section 12).
5. C3: one open log per stream with rotation, seal without truncation, deletion only after a verified receipt, and a reader that reads active, then closed, then the ref (section 11). Torn tails repaired automatically by the next append; crashed seals recovered by the next command, not by `doctor --fix`.
6. Locks: `event-seal` rank 58 (cannot run under `state`), `event-append` rank 70 (may run under `state`); no rank-50 lock anywhere in publication (section 4).
7. Machine id, store id and branch key defined; two clones sharing a machine id converge by a merge commit, never by force-push (sections 5, 14).
8. Sharing across three machines: fetch refspec into a mirror namespace written by setup and checked by doctor; explicit push of the own ref; no push refspec; offline behavior (section 14).
9. Incremental cache keyed by own-stream cursors and mirror tips; verbs `fgos events sync|status|export`; `fgos rebuild` kept as the one rebuild door (section 15).
10. Storage location: git common dir only; both overrides of the draft removed; non-git directories refused (section 8).
11. IPC route left open pending V-SPAWN-01, with the budget stated, and a new constraint found: plan 4.3 P01's exec guard forbids a spawn inside the Work gate (section 17).
12. Migration imports legacy truth once into `refs/fgos/legacy` with original file names, then deletes the tracked files in one change; rollback corrected to an export with a legacy-fold parity report (section 18).
13. Deletion list extended with file compaction, direct readers and the porting store's separate path; `.fgos` strip kept pending inventory (sections 19, 20).
14. Experiment 2 described as what it was (section 24); SQLite WAL listed as out of scope with the reason (section 25).
15. Decision placeholder rewritten to supersede L3 clauses 1 and 4 and D-ADR0003 explicitly (section 26).

## Open for the owner

1. **Sign the decision of section 26** (supersedes L3 clauses 1 and 4 of `ae461c8b` and D-ADR0003). Nothing in this spec may be implemented as acknowledging at `fsync` before that signature.
2. **Cross-machine semantics (section 12).** A move that succeeded on one machine can become a recorded conflict after sync if another machine made a concurrent move it had not seen. Recommendation: accept, because the only alternative is an online coordinator that the offline three-machine workflow cannot have.
3. **Node to Rust route (section 17).** After V-SPAWN-01: N-API addon (recommended if it meets the budget, since it needs no exception), or the host facade with a named exception to plan 4.3 P01's exec guard, which is your 2026-10-16 decision.
4. **Loss-budget numbers.** Doctor warns above twice the seal interval and fails above 3600 s (agent defaults); the council also proposed a 100-event cap per writer, which this spec does not adopt because lifecycle events already seal at once. Confirm or change.
5. **Re-cut 4.3-S now** (P01, P02 and the capacity half of P04 before the Event Store cutover) to unblock 6.2 P09; the program board should record it.
6. **Small confirmations:** machine id owned by Event Store until a machine-identity component exists; non-git directories refused; porting store scope (project or local); `eventStore.sync.intervalSec` default 300 with opportunistic push.
