# Event Store Component Specification

```txt
Document type: BA-grade area specification
Audience: Human reviewer, maintainer, implementation agent
Purpose: Define the single authority for how an fgOS event becomes durable, how it is sealed into git objects on per-machine refs, how it is shared across machines, and how it is read back
Design status: Draft v2, amended after the reopen council (M1-M4). Once the owner signs section 26, it is the contract for starting implementation under the gates of section 23. It does not claim the design is proven
Implementation status: Not started
Canonical: No (becomes canonical when the owner signs the decision in section 26)

Owner: Event Store component
Source (planned): packages/event-store/rust (crate fgos-event-store); Node facade src/event-store/ over an N-API addon of the crate
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
- plans/reports/council-261017-1513-event-store-reopen-final-packet.md
- plans/reports/experiment-261017-1220-event-store-exp1-relocate-open-shards.md
- plans/reports/experiment-261017-1220-event-store-exp2-seal-first-merge-crash.md
- plans/reports/experiment-261017-1431-event-store-v-spawn-01.md
- plans/reports/research-261017-1102-fgos-event-store-drift-history.md
- council run wf-run-1792216377992-d45c6038 (final packet round 2, red-team round 2)
- reopen council run wf-run-1792222330384-ad2d44f3 (final packet round 2, red-team revisit round 2)
- commit a4b1278ae (readClaims fan-out fix)
```

Run `wf-run-1792220971594-ec5449e2` wrote version 2 from the draft that council `wf-run-1792216377992-d45c6038` had rejected as an implementation contract. The reopen council `wf-run-1792222330384-ad2d44f3` then found that v2 fixed that council's blocking findings in substance, but that four text amendments (M1-M4) were still needed before v2 could serve as the implementation contract. The owner answered that council on 2026-10-17 15:13, and this text carries the amendments and the answers. Three lists close the spec: the changes from the draft, the changes in this amendment, and the questions still open for the owner. A last section records the dissent that is still unresolved.

## 1. Purpose

Event Store owns one decision: how an event of any fgOS domain becomes durable on the machine that wrote it, how it is sealed into immutable git objects on that machine's own ref, how those refs are shared between machines, and how the union of all of it is read back in one deterministic order. Work is the first consumer; porting, observe and decisions follow.

Event truth stops being files in the git work tree. An event is appended to an open log outside the work tree and acknowledged after `fsync`; it is then sealed, on a cadence, into a commit on `refs/fgos/events/<machine-id>` through git plumbing that touches no index, no work tree, no HEAD and no hook-running porcelain. Machines exchange events by pushing their own ref and fetching the others; the read side is the union by event hash. Views are caches owned by consumers and are rebuildable.

## 2. Decisions this spec implements

Owner decisions of 2026-10-17 (before the reopen council):

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

Owner decisions of 2026-10-17 15:13 (answers to the reopen council, `plans/reports/council-261017-1513-event-store-reopen-final-packet.md`):

| Decision |
|---|
| No outside experts. Two of the named expertise gaps become agent tasks that run before the signature of section 26: a model check of the reader-versus-seal protocol, and a local git experiment on `refs/fgos/*` (CAS `update-ref`, packed refs, gc and prune, fetch into a mirror namespace, the DAG walk). The other four gaps stay as proof gates of section 23.2 |
| The amendments M1-M4 are made (sections 10, 11, 12, 13, 14, 16, 17, 23) |
| The Node-to-Rust route is an N-API addon of the crate. No exception to plan 4.3 P01's exec guard is granted; the per-call host facade is excluded. Seal, sync, export and status run outside the Work gate and may still spawn (section 17) |
| Cross-machine success is provisional, with recorded conflicts; there is no online coordinator (section 12) |
| Unsealed loss cap as written in spec v2: no event-count cap; doctor warns above twice the seal interval and fails above 3600 s (section 16) |

Agent defaults that the owner accepted on 2026-10-17 15:13. An agent chose them and the owner did not decide them; they are listed separately so that their authority is not overstated (M3):

| Default |
|---|
| Seal cadence: on lifecycle events, else after 300 s (`eventStore.seal.intervalSec`), else at clean writer exit (section 16) |
| Doctor thresholds for unsealed events: warn above twice the interval, fail above 3600 s (sections 16, 21) |

The spec also takes the following decisions inside that frame. They are agent decisions, reported here, and are not owner decisions:

- one open log per store and stream instead of one per writer (section 9);
- a per-store sequence and a `seen` vector instead of wall-clock order, ordered by the topological sort of section 12;
- the commit kinds on a ref and the coverage walk over the commit DAG (sections 10, 11);
- no DAG walk and no spawn inside the Work gate (section 13);
- the storage location is the git common dir, with no override (section 8);
- a non-git directory is refused (section 8);
- publication never takes `main-checkout` or the Work gate (section 4);
- `fgos rebuild` stays the one rebuild door (section 15);
- the fetch refspec is configured and the push refspec is not (section 14);
- `eventStore.sync.intervalSec` defaults to 300 (section 14);
- the 50 ms in-gate latency number is a proposed default and has not been measured (section 17).

The first council rejected the draft as an implementation contract for six reasons, and each is fixed here: C1 (section 13), C2 (section 12), C3 (section 11), the overclaim of experiment 2 (section 24), the rollback against `src/state/replay.mjs:876-880` (section 18), and the O1-O7 labels (this section). The reopen council's four amendments are applied as follows:

- M1 splits the latency budget (section 17).
- M2 replaces the pairwise comparator with a defined sort (section 12).
- M3 separates agent defaults from owner decisions (this section, section 16).
- M4 defines the ref as a commit DAG with a bounded walk (sections 10, 11, 13, 14).

Red-team round 2 of the reopen council is answered where it is right. The walk has an explicit termination condition and never runs under the Work gate (sections 11, 13). Remote ref behavior is tested locally against a bare repository, with no owner authorization needed (section 23.1). The readiness wording is corrected in the header and in this section.

Readiness: once section 26 is signed, this spec is the contract for starting implementation under the gates of section 23. It does not claim that the design is proven. The owner chose direction B provisionally, and the gates, not this text, confirm it or reopen it.

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
| `ts` | Writer wall clock in UTC, fixed width `YYYY-MM-DDTHH:MM:SS.sssZ`, so that byte order is time order; informational and a last tie-break only |
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
  <stream>/sealed.json             {lastSeq, commit, cover} last receipt and the coverage map of the last complete walk of the stream's ref (section 11); a cache, verified against the ref
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
   1. Verify the segment: every line's `h` must verify, `seq` must be contiguous, and `first` must equal the own stream's last sealed `seq` plus one. That last sealed `seq` is `cover[(own origin, stream)]` after a coverage walk (section 11) from the ref's current tip. The walk starts from the `cover` in `sealed.json` and runs from empty coverage when that file is missing. `sealed.json` is only a cache, and its `lastSeq` must not exceed the walked value. A gap stops with `event-store-chain-gap`.
   2. Write the objects of a sealed changeset (a commit of kind `seal`, table below):
      - blob `events.jsonl`: the segment bytes, unchanged;
      - blob `seal.json`: canonical `{v: 1, kind: "seal", origin, stream, scope, machineId, firstSeq, lastSeq, count, sha256}` where `sha256` is that of the segment bytes;
      - tree with exactly those two entries;
      - commit: first parent is the ref's current tip (none for the first); a commit whose segment carries a `store.promote` event has the promoted branch ref's tip as second parent; author and committer `fgOS Event Store <event-store@fgos.invalid>`; message `fgos-events seal <origin>:<stream> <first>..<last>`.
   3. Compare-and-swap the ref: `update-ref <ref> <new> <old>` with the tip read in step 2.1 as `<old>` (the all-zero id when the ref is new). Through the publication port: `gix` in process, or `git` plumbing with `-c core.fsync=objects,reference -c gc.auto=0 -c maintenance.auto=false`; no index, no work tree, no porcelain. A mismatch means an actor outside the store moved the ref: stop with `event-store-ref-moved`, keep the segment, doctor fails.
   4. Receipt: read the ref back and the blob of `<new>:events.jsonl`; the ref must equal `<new>` and the blob's SHA-256 must equal the segment's. The receipt `{ref, commit, sha256, firstSeq, lastSeq}` and the walk's `cover` go to `sealed.json`.
   5. Only after the receipt: delete the closed segment and `fsync` the directory.
3. Re-list `closed/`; repeat while segments remain (bounded per call), so a lifecycle seal that lost the `try` race is picked up by the running sealer.

**Commit kinds.** A ref is a commit DAG, not a linear chain: promote commits and merge commits have two parents. Each commit's tree is that commit's own changeset, never cumulative, so a merge commit does not combine its parents' trees.

| Kind | Parents | Tree | Written on |
|---|---|---|---|
| `seal` | the ref's previous tip (none for the first) | exactly `events.jsonl` and `seal.json {kind: "seal", ...}` | own `events`, `branch-events`, `local-events` refs |
| `seal` carrying a promote | the ref's previous tip, then the promoted branch ref's tip | as `seal` | own `events` ref |
| `merge` | the own tip, then the mirror tip (section 14 step 3) | exactly `seal.json`: canonical `{v: 1, kind: "merge", machineId, parents}`; no `events.jsonl` | own `events` ref |
| `legacy` | none | the legacy files and `seal.json {kind: "legacy", ...}` (section 18) | `refs/fgos/legacy` only |

Chain invariant: for one (`origin`, `stream`), every seal commit descends from every earlier seal commit of the same (`origin`, `stream`). Only the store with that origin writes them, it writes them onto its own ref, and that ref moves only forward (compare-and-swap seal, fast-forward or merge, never rewind). The coverage walk of section 11 depends on this invariant.

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
3. Read the tip of each ref that can carry a requested stream, then run the coverage walk below from those tips with the cursor's coverage map, reading only the ranges the cursor lacks.

Why no acked event is lost and none is counted twice while a seal runs: an event acked before the read starts is in `active`, in `closed`, or in the ref. If it leaves `active` before step 1 opens it, the rename has already put it in `closed`, which step 2 lists later. If its segment is deleted before step 2 reads it, the ref already contained it (deletion follows the receipt), and step 3 reads the ref later; refs only move forward. Reading a range from both a segment and the ref is removed by the `h` dedupe. The result must be contiguous from the cursor to the highest `seq` read; a hole the ref does not fill is `event-store-gap` (corruption, never skipped).

**Coverage walk (M4).** The input is a set of tips and a coverage map `cover[(origin, stream)] -> seq`, taken from the cursor and empty for a rebuild. The output is every sealed range above the coverage, plus the new coverage map. The walk order does not matter, because order comes from section 12.

1. Put the tips on a stack. The visited set starts empty.
2. Pop a commit. If it is already in the visited set, skip it; otherwise add it to the set.
3. If it is a `seal` commit of (`o`, `s`) with `lastSeq <= cover[(o, s)]`, stop on this path and do not push its parents. By the chain invariant (section 10), the walk that established `cover[(o, s)]` already read every ancestor of this commit.
4. Otherwise read its `seal.json`. For `seal`, read the part of `events.jsonl` above `cover[(o, s)]`, selected by the `origin` and `stream` in `seal.json`. For `merge`, read nothing. Then push every parent.
5. When the stack is empty, the walk is complete. Only then is `cover[(o, s)]` raised, to the highest `lastSeq` read for each (`o`, `s`), and only if the ranges read for it are contiguous from the old value; a hole is `event-store-gap`. An incomplete walk (error or interruption) changes no coverage.

Termination: each commit is visited at most once, and descent stops at the first covered seal on each path. A walk therefore visits the commits added since the coverage was established, plus their covered parents. An origin the reader has never seen has coverage 0. Its seals are read until its root, or until a covered seal of a known origin, so a new origin is discovered and never skipped. A walk is O(history) only when the cursor is empty (rebuild), and that runs outside the Work gate.

**In-gate bound.** Inside the Work gate (section 13), `read` runs only steps 1 and 2 for the store's own streams. It never runs step 3: no commit-DAG walk and no process spawn run inside the gate. Suppose the cursor's own-stream `seq` is below what `active` and `closed` still hold, either because a segment vanished or because the cursor is older than the oldest unsealed event. Then `read` returns `catch-up-required` without walking, and the consumer catches up outside the gate before entering again. Foreign and legacy streams are never caught up inside the gate. In steady state the cache cursor equals the own stream's last `seq`, because every gated append folds and writes the cache before the gate is released. The in-gate read is then a tail read of `active.jsonl`.

Read boundary: own-clone events are visible to every worktree of the clone from their ack, including unsealed ones; an append in progress may or may not be visible; a torn tail is never visible. Events of other machines are visible after they seal and push and this clone fetches. Events of another clone on the same machine are visible after both sync, like another machine.

Foreign streams are read from mirror refs (section 14), and the legacy history from `refs/fgos/legacy` (section 18). This protocol and the coverage walk are a design argument. They must pass the model check of section 23.1 before the signature, and the stress test of section 23.2 before code is accepted.

## 12. Order

Wall clock never decides order alone. The order is the output of one algorithm over a set of events, so that every machine holding the same set computes the same sequence (M2).

Placement before the sort:

1. **Legacy events** form a prefix in the legacy order `(ts, file, seq)` with the legacy dedupe, exactly as `src/state/replay.mjs:870-889` does today, because the legacy import keeps every file name (section 18). They precede every v4 event and take no part in the sort.
2. **Promoted branch events.** A `store.promote {stream, throughSeq, tip}` event forms one block with the events it promotes. Those are the named branch stream's events up to `throughSeq` that no earlier promote named. The block is the promote event followed by the promoted events in `seq` order. In the sort the block is one node: it takes the sort key of the promote event and the causal inputs of all its members, minus the edges inside the block. Branch events that no promote names are not part of the project order.
3. **Dedupe** by `h`. Two different events with the same (`origin`, `stream`, `seq`) are `event-store-seq-conflict`, a corruption that is never ordered.

Causal graph: there is an edge `a -> b` when (i) `a` and `b` are in one (`origin`, `stream`) and `a.seq = b.seq - 1`, or (ii) `b.seen["<a.origin>:<a.stream>"] = a.seq`, which means `b`'s writer had folded `a` and everything before it in that stream. The graph has no cycle. `seen` names only events acked before `b` was decided, so every edge points from an earlier ack to a later one. A block adds no cycle either, because the promoted events and everything they saw were acked before the promote event was appended.

Causal closure: when an event's predecessor named by (i) or (ii) is absent from the set (not fetched yet), that event and everything that depends on it are **deferred**. `read` reports them, and `fgos events status` lists them with the missing (`origin`, `stream`, `seq`). They are emitted once the predecessor arrives. The sort therefore runs over the causally closed subset, and its output is a function of that subset alone.

Sort: a deterministic topological sort (Kahn). A node is ready when all its predecessors have been emitted. The sort repeatedly emits the ready node with the smallest key (`ts`, `origin`, `stream`, `seq`), compared field by field as bytes. The keys sit inside the hashed bytes and are unique per event, so no tie remains and no engine-dependent comparator is involved.

Contract:

- Deterministic: the same event set gives the same sequence on every machine.
- Causal: when `b`'s writer had folded `a`, `a` is emitted before `b`.
- **Incremental fold equals the sort** for own-store appends under the gate. An append's `seen` names the highest folded `seq` of every other stream in the view (section 9, step 5), and its own stream's previous event is its predecessor. Every event in the view is therefore a causal predecessor of the new events, and the new events become ready only after the whole view has been emitted. Appending them to the folded view gives the sequence that sorting the enlarged set gives. This holds for own-store appends only. A fetched foreign event may sort before events already folded, and it makes the view rebuild (section 15).
- On one clone, every acknowledged precondition holds again at replay, because the Work gate makes each writer's view current for its own stream.
- Across clones and machines, a success is final against every event its writer had seen and provisional against concurrent events it had not seen (owner decision 2026-10-17 15:13; no online coordinator). When a later sync brings a concurrent event that makes a replayed precondition false, the consumer's reducer must record a conflict instead of applying the event. Work must implement that reducer rule before a second store's `project` events are folded into its view (acceptance item in section 23). Event Store reports the concurrency; it never picks a business winner.

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

1. Before the gate: resolve writer id and anything that needs a child process; catch the view up with the full reader (section 11, steps 1-3), rebuilding when a mirror or legacy tip changed (section 15).
2. Inside `withStateTx(state)`: `read(project, cursor)` with the in-gate bound of section 11 and fold into the cache view; on `catch-up-required`, release the gate and return to step 1; check the precondition (FSM, capacity, claim); `append(project, events, {cursor})` and treat `stale-cursor` as a bug; fold the new events and write the cache with the new cursor; settle the claim if any.
3. Release the gate, ack to the caller.
4. After the gate: if any appended type is `sealOnWrite`, `seal(project)` with `try`.

No commit-DAG walk, no git call and no process spawn runs inside the gate. A foreign event fetched after step 1 is not folded by this mutation. Its `seen` then names exactly the foreign coverage of the view, so section 12 treats that event as concurrent and loses nothing. A rebuild computed outside the gate is installed under the gate only when the own-stream positions it was computed from are still current; otherwise it is computed again.

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
3. Reconcile the own ref with its mirror:
   - If the own ref descends from the mirror, push.
   - If the mirror descends from the own ref (the own ref was restored from elsewhere), fast-forward the own ref by compare-and-swap.
   - If they diverged, write a commit of kind `merge` (section 10) whose parents are the own tip and the mirror tip, with the tree `seal.json {v: 1, kind: "merge", machineId, parents}` only. Compare-and-swap the own ref to it, then push.

   Never force-push. The coverage walk reads both sides of a merge through the visited set (section 11).
4. `git push <remote> refs/fgos/events/<own>:refs/fgos/events/<own>` (and `refs/fgos/legacy` once).
5. Record the result (time, tips, error) for `status`; tell registered consumers that mirror tips changed.

Triggers: the explicit verb; and the opportunistic check of section 16 when the last successful push is older than `eventStore.sync.intervalSec` (default 300; 0 means explicit only). Network calls never run inside the Work gate.

Offline: append, seal and read work fully; fetch and push fail, the failure is recorded, `status` shows "unpublished since", the next trigger retries; Work is never blocked by the network. A clone with no remote keeps everything local.

Two clones on one machine share a machine id by default (one `stateRoot`), so both write `refs/fgos/events/<id>` in their own repositories with different store ids. The first push wins; the second sync finds a diverged mirror and writes a merge commit, so both chains converge on the remote with nothing lost and no shared sequence (store ids differ). Doctor warns `event-store-machine-ref-shared` when the mirror of the own id carries another store id, and names the fix: `git config fgos.machineId <other-id>` in one of the clones.

A forge may hide custom refs in its UI; reading them goes through `fgos events export` or `git log -p <ref>`. The behavior of `refs/fgos/*` under push, fetch, packed refs, gc and prune, fresh clones and divergence is tested first against a local bare repository used as the remote (section 23.1 item 2). That test needs no external push and no owner authorization. Whether the owner's own forge accepts and serves `refs/fgos/*` is checked at acceptance (section 23.2 item 5).

## 15. Views, cursors and verbs

A view is a cache owned by its consumer (Work: `.fgos/cache/state.json`, `src/state/fgos-file-registry.mjs:36`), never tracked, never truth, rebuildable from zero. A consumer may choose another engine, SQLite included, without touching this spec; that engine's concurrency is the consumer's concern.

The cursor is the cache key: per stream the highest folded `seq`, the coverage map of section 11, plus the tips of the mirror and legacy refs. A consumer that reads with its cursor gets:

- only new events of the store's own streams, when no mirror or legacy tip changed: fold incrementally (they come after everything folded, section 12);
- `rebuildRequired`, when a mirror or legacy tip changed: refold from zero outside the Work gate, because foreign events can sort before folded ones.

The usual verbs (`fgos list`, `show`, `ready` and the others) read the consumer's view after one `read(cursor)` catch-up. Commands:

| Verb | Does |
|---|---|
| `fgos events sync` | Section 14 |
| `fgos events status [--json]` | Store id, machine id, every ref and tip, per stream unsealed count and oldest unsealed age, closed segments pending, last receipt, last fetch and push with result, own ref ahead/behind its mirror, orphan branch streams, deferred events and their missing predecessors (section 12), the guarantee level of the open root |
| `fgos events export [--stream <s>] [--since <cursor>] [--format jsonl|legacy-layout] --out <dir>` | Canonical-order JSONL, or the legacy file layout with a parity report (section 18) |
| `fgos rebuild` | The existing rebuild verb (`src/cli/command-registry.mjs:1393`) stays the one rebuild door: it drops every registered consumer cache and refolds from the store |

## 16. Seal cadence and loss budget

Agent default, accepted by the owner on 2026-10-17 15:13 (M3), configurable by `eventStore.seal.intervalSec` (default 300):

| Trigger | Action | Who |
|---|---|---|
| A `sealOnWrite` type was appended (Work: status move, answer, decision, approval, land result) | `seal(project)` right after the gate is released | the appending process |
| The oldest unsealed event is older than the interval | seal every stream | the opportunistic check at the start and end of every fgOS command that opens the store, and in the loop of long-lived gateway and runner processes |
| Clean writer exit | seal every stream | session end (session deregistration) and shutdown of gateway and runner |
| A crashed process left a torn tail or closed segments | repair and seal | the next fgOS command on the clone, through the same triggers |

No daemon and no timer exist only for sealing. When no fgOS process runs, unsealed events wait until the next command; that window is not bounded by wall clock and the contract says so. Sealing runs only git plumbing on refs, so the council's objection to sealing on every lifecycle event (one work-tree commit and `index.lock` each) does not apply.

Doctor (`event-store-unsealed`): passes when nothing unsealed is older than twice the interval; warns above that; fails when the oldest unsealed event is older than 3600 s. There is no event-count cap, because lifecycle events already seal at once. These thresholds are agent defaults that the owner accepted as spec v2 on 2026-10-17 15:13.

## 17. Node to Rust route and latency budget

**Route** (owner decision 2026-10-17 15:13): the route is an N-API addon of the crate, loaded by the Node payload. The owner granted no exception to the exec guard of plan 4.3 P01, under which any `child_process` call inside a hot critical section throws `exec-under-hot-lock` (`plans/261016-1306-main-checkout-single-door-hot-lock/phase-01-hot-lock-core.md:19`). So `read` and `append` run inside the Work gate with no spawn. Session Identity follows the same rule (`docs/platform/session-identity/spec.md` section 5).

- The per-call host facade (`fgos internal event-store ...` per call, like `lock-fd`) is excluded, because it spawns inside the gate.
- A persistent pipe to a running host is not available, because no host runs on the plain CLI path and no daemon is dedicated to Event Store.
- Seal, sync, export and status run outside the gate and may still spawn, for example git plumbing as a subprocess.
- Rust consumers link the crate and pay no route.

The route has a cost: a native addon for every supported platform and Node ABI, carried in the npm package and the legacy-node payload, plus build, activation and doctor checks (section 21; section 23.2 item 9).

**Baseline.** V-SPAWN-01 measured today's path end to end, from CLI spawn to exit, on 2026-10-17 ([experiment-261017-1431-event-store-v-spawn-01.md](../../../plans/reports/experiment-261017-1431-event-store-v-spawn-01.md); Intel i7-13700, `/tmp` on tmpfs, git 2.53.0, Node 24.22.0, 40 samples per row):

| Mutation | p95 at 1 session | p95 at 10 | p95 at 20 |
|---|---:|---:|---:|
| claim (`take`) | 2,174 ms | 19,521 ms | 37,430 ms |
| move (`--expect`) | 125 ms | 290 ms | 480 ms |
| settle (`return`) | 776 ms | 873 ms | 1,556 ms |

V-SPAWN-01 ran on tmpfs, where `fsync` costs nothing, so every number must be remeasured on ext4. Move at one session already takes 125 ms end to end (Node startup and host resolution). No Event Store route can therefore meet 50 ms on an end-to-end metric, and the budget below is split in two (M1).

One traced `take` made 983 process clones. A later trace attributed them to process fan-out outside the store: `readClaims` called `readClaim` for each open claim, and each call resolved the main checkout again with its own `git rev-parse` spawn, about four times per `take`. Commit a4b1278ae fixed this on main: a `take` at 64 open claims went from 269 processes to 21, and from 1.75 s to 0.26 s. The remaining claim-path cost is the wait on `main-checkout.lock`. The claim path takes that lock only for `checkpointMainFgos`, so the wait belongs to 4.3-S P04 (section 20).

**Budget** (M1). The numbers are proposed defaults, not measurements.

| Part | Measures | Target |
|---|---|---|
| (a) Event Store increment inside the Work gate | the store's share of the gate: in-gate read (section 11), append with `fsync`, fold of the new events | p95 at most 50 ms at 20 concurrent sessions on ext4; 0 process spawns inside the gate; no exhaustion at 20 sessions by 200 mutations in 60 s |
| (b) End to end | CLI p95 of claim, move and settle | not worse than the V-SPAWN-01 baseline, rerun on ext4 on a main commit that contains a4b1278ae, before the Event Store cutover; the tmpfs table above is history, not the baseline of record |

No daemon is dedicated to Event Store.

**Not Event Store acceptance.** The claim-path fan-out and the `main-checkout` wait form a separate item, tied to 4.3-S P04 and recorded on the program board. No Event Store criterion depends on that item, and no report may present the Event Store cutover as improving claim latency on its own.

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
| `event-store-integrity` | a seal blob whose hash differs from `seal.json`, an event `h` that does not verify, a sequence gap in an own stream, `event-store-seq-conflict`, `event-store-ref-moved` or `seal-mismatch` recorded |
| `event-store-sync` | warns when the last push failed or is older than 24 h with a remote configured; reports ahead/behind |
| `event-store-native-addon` | the N-API addon of the crate is missing from the active payload, fails to load, or was built for another Node ABI or platform (section 17) |
| `event-store-legacy-layout` | after cutover: tracked event files, `.fgos/events/`, tracked `state.json` or backups, or a `merge=union` line for events exist; `refs/fgos/legacy` missing or its tree differs from `seal.json.treeOfFgosEvents` |
| `event-store-orphan-branches` | warns per orphan branch stream |

`CHANGELOG.md` gets an `[Unreleased]` entry for the verbs, the config keys, the refspec setup and the removal of tracked event files.

## 22. Support matrix and known limits

- Linux first. macOS follows holder-lock's `flock` driver once the seal crash matrix runs there. Windows is out until the holder-lock Windows driver exists. Network filesystems are refused.
- One user; lock directories are mode 0700; multi-user permissions are out of scope.
- Unsealed events are lost with the disk or the clone; the window is the seal cadence while fgOS runs, unbounded while nothing runs.
- Cross-machine success is provisional against concurrent events of other stores (section 12); the owner accepted this, and there is no online coordinator.
- An event whose causal predecessor has not been fetched yet is deferred, not folded (section 12).
- SIGKILL tests do not prove power-loss safety; the guarantee rests on `fsync` semantics of the filesystem, reported by doctor.
- A branch rename is not followed by the branch stream key.
- Deleting a machine ref on the remote removes it from other clones at their next pruning fetch; the history then lives only on that machine.
- Erasing a secret that reached a pushed ref needs a history rewrite on every clone; there is no tombstone protocol.
- The chain grows with history; ref-chain snapshot and compaction are a later item, opened when a full rebuild exceeds the budget V-SPAWN-01 fixes for reads.

## 23. Proof gates

These gates, not the text of this spec, confirm or reopen the design. The owner engages no outside experts (decision of 2026-10-17 15:13). Two expertise gaps are handled as agent tasks in 23.1, and the other four stay as gates in 23.2: filesystem crash consistency (item 10), multi-clone reconciliation (item 4), IPC and lock-convoy profiling (item 8), and native addon distribution (item 9).

### 23.1 Before the owner signs section 26 (agent tasks)

1. **Model check of reader versus seal (V-C3-MODEL).** A TLA+ or Alloy model covers `active`, `closed` and the ref, with at least two readers, two seal attempts and one appender. The model must include:
   - a `merge` commit of a shared machine id and a promote commit;
   - the coverage walk of section 11, including an origin the reader has never seen;
   - the in-gate bound of section 11.

   It must show that no acked event is lost, none is counted twice, every walk terminates, and coverage never covers an event that was not read.
2. **Local git experiment on `refs/fgos/*` (V-REF-01).** It uses a local bare repository as the remote, so nothing is pushed to an external service and no owner authorization is needed. It covers:
   - compare-and-swap `update-ref`, including a stale old value;
   - CAS and reads after `git pack-refs`;
   - `git gc --prune=now` in the clone and in the bare repository: reachable seal and merge commits survive, and the objects of an interrupted seal go away;
   - fetch through the section 14 refspec into the mirror namespace, which never overwrites the own ref;
   - a fresh clone, which receives no `refs/fgos/*` until setup writes the refspec;
   - divergence of a shared machine id and its `merge` commit;
   - the coverage walk over the resulting DAG, with the number of commits it visits.

### 23.2 Before acceptance of the implementation

1. **Kill matrix** on the real crate with real holder-lock locks: SIGKILL during append write, after `fsync`, during rotation, after object write, after `update-ref`, after receipt, after delete. No acked event lost, none doubled, recovery automatic on the next trigger.
2. **Reader versus seal stress test:** at least 10,000 real interleavings on the real crate, including `merge` and promote commits, conforming to the model of 23.1 item 1.
3. **C1 (V-AUTH-01):** two processes in two worktrees race `moveWork` with the same `expectedStatus`, and two items race the last worker slot: exactly one success each; `settleClaim` behaves as today.
4. **C2 and multi-clone reconciliation (V-SEQ-01).** The test covers:
   - clock rollback, equal timestamps, `seq` across seal and restart, and delayed foreign events;
   - the sort of section 12 gives one sequence for every permutation of its input;
   - a deferred event is emitted once its predecessor arrives;
   - full rebuild and incremental fold give the same view;
   - a rebuild racing gated appends is installed only when current;
   - a cross-machine concurrent CAS yields the same recorded conflict on all three machines.
5. **Three machines:** three clones push, fetch, go through an offline period, diverge and merge on a shared machine id, and distribute the legacy ref, first against a local bare repository. The last step runs against the owner's real remote and confirms that it accepts and serves `refs/fgos/*`. Pushing there needs the owner's authorization at that time.
6. **Legacy parity:** the import reproduces the pre-cutover Work view byte for byte; fixtures with equal `ts`, missing `src` or `h`, mixed v3 and v4.
7. **Rollback:** legacy-layout export plus legacy-fold parity report on a fixture with v4 events.
8. **Latency and IPC (V-SPAWN-01 on ext4):** the N-API route meets parts (a) and (b) of the section 17 budget. `strace` over the gate window confirms 0 spawns inside the gate. Lock-convoy behavior is profiled at 15 and 20 sessions.
9. **Native addon distribution:** the addon loads on every supported platform and for every Node ABI the payload supports, in both the npm package and the legacy-node payload. Activation refuses a payload without it, and `event-store-native-addon` has setup and doctor vectors.
10. **Filesystem crash consistency:** a power-loss simulation on ext4 (for example `dm-flakey` or a hard VM reset) loses no acked event. Doctor reports the guarantee level per filesystem. APFS, NTFS and WSL2 stay unsupported claims until they are measured.
11. **V-DOOR-01:** `rg` finds no git invocation for `refs/fgos/*` outside the publication driver and no `git commit` of event files anywhere.
12. **Topologies:** plain repository, linked worktree on another filesystem, `--separate-git-dir`, bare with worktree, submodule; non-git refusal; git version floor.
13. **Setup and doctor** vectors for every check and fix; full `npm test` and cargo tests green.

## 24. Evidence and its limits

Experiment 2 proved, on Linux with a Node prototype and an `O_EXCL` pid lock, that sealing immutable content-addressed files into tracked paths merges with zero conflicts (6/6, 7/7), that recovery from 100 SIGKILLs over five boundaries works when the open shard stays the recovery source until after the commit, and that append and seal of one writer must be serialized (20/20 under one lock). It did not test reader versus seal, two sealers, real holder-lock, ENOSPC, power loss, Rust, or refs. The ref-based publication of this spec is new: it inherits the ordering idea (never remove before the next location is durable) and nothing else, and must be proven by section 23.

Experiment 1 showed the common dir resolves on every topology listed in section 8 and that relocating open shards passed 1224 of 1250 focused tests with 4 failures that pin the old layout; it was not a full suite. The ref-chain figures from council panelist 2 (26.5 ms per event spawn-bound, 0.16 s for a 35,000-event replay, plain clones do not carry `refs/fgos/*`) come from a scratch repository with synthetic payloads and are not acceptance evidence.

V-SPAWN-01 measured today's CLI end to end on tmpfs. It measured no Event Store route, and it says nothing about `fsync` cost on ext4. Its claim tail was later traced to process fan-out in `readClaims` and to the `main-checkout` wait, both outside the store. Commit a4b1278ae removed the fan-out. The 570 ms convoy figure for a per-call host facade is red-team round 2's estimate, not a measurement; the route it applied to is now excluded.

## 25. Out of scope

SQLite WAL and multi-process SQLite semantics: the view is a consumer cache, so whichever engine a consumer picks is that consumer's concern. Red-team round 2 proposed adding this expertise, and it does not apply to the store. This stays a dissent (see "Unresolved dissent"). It becomes required when a consumer folds into SQLite inside the Work gate. Also out: a dedicated scheduler or daemon, Windows, network filesystems, multi-user permissions, hard deletion, ref-chain compaction, removing the `.fgos` strip, and an online cross-machine coordinator.

Outside expertise: the owner engages none (decision of 2026-10-17 15:13). The six gaps the councils named are covered as follows:

| Gap | Covered by |
|---|---|
| Formal model checking of the reader-versus-seal protocol | 23.1 item 1, agent task, before the signature |
| Git internals: ref transactions, packed refs, gc and prune of custom namespaces, commit-DAG traversal | 23.1 item 2, agent task, before the signature |
| Filesystem crash consistency and `fsync` across ext4, APFS, NTFS and WSL2 | 23.2 item 10 |
| Multi-clone reconciliation for event reducers | 23.2 item 4 |
| IPC profiling and lock-convoy dynamics under 15 to 20 sessions | 23.2 item 8 |
| N-API distribution across platforms and Node ABIs | 23.2 item 9 |

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

## Changes in the amendment after the reopen council (2026-10-17)

1. **M1, latency budget split (section 17).** Part (a) is the Event Store increment inside the Work gate: p95 at most 50 ms at 20 sessions on ext4, with 0 spawns. Part (b) is end-to-end CLI p95, not worse than a V-SPAWN-01 baseline rerun on ext4 on a commit that contains a4b1278ae. Claim fan-out and the `main-checkout` wait are a separate item, not Event Store acceptance. The section records the a4b1278ae fix (64 open claims: 269 to 21 processes, 1.75 s to 0.26 s) and that V-SPAWN-01 ran on tmpfs.
2. **M2, order algorithm (section 12).** The pairwise comparator is replaced by a deterministic topological sort of the causal graph that emits, among ready events, the smallest (`ts`, `origin`, `stream`, `seq`). Placement rules for legacy events, promoted blocks and dedupe come before the sort. Causal closure with deferred events and a proof that incremental fold equals the sort were added. `ts` gets a fixed-width UTC form (section 6).
3. **M3, authority of the seal cadence (sections 2, 16).** The cadence and the doctor thresholds moved from owner decisions to agent defaults that the owner accepted.
4. **M4, ref as a commit DAG (sections 8, 10, 11, 13, 14).** This adds the commit kinds, including a `merge` tree of `seal.json` only, and the chain invariant per (`origin`, `stream`). It adds a coverage walk with a visited set, a stop at covered seals and an explicit termination argument; unknown origins are discovered, not skipped. `sealed.json` now carries `cover`. No DAG walk, git call or spawn runs inside the Work gate; `catch-up-required` sends the consumer back outside the gate.
5. **Owner decisions of 2026-10-17 15:13 recorded (sections 2, 12, 16, 17, 22, 25).** They cover: no outside experts, the N-API route with no exec-guard exception (host facade excluded), provisional cross-machine success, and the loss cap as in v2.
6. **Proof gates split (section 23).** Two agent tasks run before the signature: the model check and V-REF-01 against a local bare repository. The four remaining expertise gaps are mapped to acceptance gates. A native addon gate and a filesystem crash gate were added.
7. **Doctor check `event-store-native-addon` added (section 21)**, because the N-API addon is a new infrastructure dependency.
8. **Readiness wording (header, section 2).** Once signed, the spec is the contract for starting implementation under the section 23 gates. It does not claim the design is proven.

## Open for the owner

1. **Sign the decision of section 26** (supersedes L3 clauses 1 and 4 of `ae461c8b` and D-ADR0003). Nothing in this spec may be implemented as acknowledging at `fsync` before that signature. The agent tasks of section 23.1 run first.
2. **Re-cut 4.3-S now** (P01, P02 and the capacity half of P04 before the Event Store cutover) to unblock 6.2 P09; the program board should record it.
3. **Bind the claim-path item** (remaining `main-checkout` wait and any fan-out left after a4b1278ae, 4.3-S P04) on the program board as the user-visible outcome of the Event Store rollout, without making it an Event Store acceptance criterion.
4. **Small confirmations:** machine id owned by Event Store until a machine-identity component exists; non-git directories refused; porting store scope (project or local); `eventStore.sync.intervalSec` default 300 with opportunistic push.

Answered on 2026-10-17 15:13 and no longer open: cross-machine semantics (accepted), the Node-to-Rust route (N-API, no exception), the loss-budget numbers and the seal cadence (accepted as v2), and outside expertise (none; agent tasks and gates).

## Unresolved dissent

These positions came from the reopen council and are still not settled by evidence. They are recorded so that they are not lost.

- **Git component as a precondition.** The critic of council 2 holds that publication should wait for the Git component. This spec puts a crate-internal driver behind a port and moves it later (section 20).
- **Lock grain.** Panelist 3 proposes an entity-level mutex. This spec keeps one project Work gate per clone. V-SPAWN-01 cannot tell the two apart, because its tail is the `main-checkout` wait, not `state`.
- **SQLite expertise.** Both red-team rounds want multi-process SQLite WAL expertise in the core review. This spec keeps it out of scope because Work's view is `state.json` (section 15), and it becomes required when a consumer folds into SQLite inside the Work gate (section 25).
- **Design impact of the commit DAG.** Red-team revisit round 1 sees a shift to a distributed DAG that hides major protocol complexity. This spec treats it as a bounded definition (section 11) on a chain that promote commits had already made a DAG. The model check of 23.1 item 1 settles the question.

---
