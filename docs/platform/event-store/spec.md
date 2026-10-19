# Event Store Component Specification

```txt
Document type: BA-grade area specification
Audience: Human reviewer, maintainer, implementation agent
Purpose: Define the single authority for how an fgOS event becomes durable, how it is sealed into git objects on per-machine refs, how it is shared across machines, and how it is read back
Design status: Signed by the owner on 2026-10-17 (D-ADR0055). It is the contract for starting implementation under the gates of section 23; it does not claim the design is proven.
Implementation status: Not started
Canonical: Yes (D-ADR0055, 2026-10-17)

Owner: Event Store component
Source (planned): packages/event-store/rust (crate fgos-event-store); Node facade src/event-store/ over the one combined N-API addon that links fgos-event-store and fgos-git (section 17)
Contracts (planned): packages/event-store/contracts/
Last reviewed: 2026-10-18
Supersedes: L3 clauses 1 and 4 in docs/platform-foundations.md (D-ID ae461c8b, superseded by D-ADR0055); D-ADR0003 data layout
Related:
- docs/platform-foundations.md (L3, L7, L10)
- docs/platform/holder-lock/spec.md
- docs/platform/session-identity/spec.md
- docs/platform/component-boundary.md
- docs/platform/git/spec.md (Publication port, section 4; combined addon, owner decision Q1)
- plans/261016-1306-main-checkout-single-door-hot-lock/plan.md (4.3-S)
- plans/261017-1313-fgos-platform-program-board/plan.md
- plans/reports/council-261017-1210-event-store-final-packet.md
- plans/reports/council-261017-1513-event-store-reopen-final-packet.md
- plans/reports/experiment-261017-1220-event-store-exp1-relocate-open-shards.md
- plans/reports/experiment-261017-1220-event-store-exp2-seal-first-merge-crash.md
- plans/reports/experiment-261017-1431-event-store-v-spawn-01.md
- plans/reports/experiment-261017-1527-event-store-model-check-reader-seal.md
- plans/reports/experiment-261017-1527-event-store-git-ref-mechanics.md
- plans/reports/research-261017-1102-fgos-event-store-drift-history.md
- council run wf-run-1792216377992-d45c6038 (final packet round 2, red-team round 2)
- reopen council run wf-run-1792222330384-ad2d44f3 (final packet round 2, red-team revisit round 2)
- proof run wf-run-1792224866445-9a03a834 (model check and V-REF-01)
- commit a4b1278ae (readClaims fan-out fix)
```

Run `wf-run-1792220971594-ec5449e2` wrote version 2 from the draft that council `wf-run-1792216377992-d45c6038` had rejected as an implementation contract. The reopen council `wf-run-1792222330384-ad2d44f3` then found that v2 fixed that council's blocking findings in substance, but that four text amendments (M1-M4) were still needed before v2 could serve as the implementation contract. The owner answered that council on 2026-10-17 15:13, and this text carries the amendments and the answers. Two agent proofs then ran before the signature, in run `wf-run-1792224866445-9a03a834` (section 23.1): a model check of the reader-versus-seal protocol and a local git experiment on `refs/fgos/*`. The model check ran against v2 before the amendment. This text folds in what both found. Four lists close the spec: the changes from the draft, the changes in the amendment, the changes after the proofs, and the questions still open for the owner. A last section records the dissent that is still unresolved.

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
- a batch is framed by a durable commit marker, and readers fold only committed batches, instead of dropping the all-or-nothing promise (section 9);
- the high-water mark of a stream is recovered from every local location before a `seq` is assigned (section 9);
- a per-store sequence and a `seen` vector instead of wall-clock order, ordered by the topological sort of section 12;
- the commit kinds on a ref and the coverage walk over the commit DAG, which prunes only at certified commits (sections 10, 11);
- no DAG walk and no spawn inside the Work gate (section 13);
- the storage location is the git common dir, with no override (section 8);
- a non-git directory is refused (section 8);
- publication never takes `main-checkout` or the Work gate (section 4);
- `fgos rebuild` stays the one rebuild door (section 15);
- the fetch refspec is configured and the push refspec is not, and mirrors live under `refs/fgos/remotes/<remote>/`, the namespace V-REF-01 tested (section 14);
- `eventStore.sync.intervalSec` defaults to 300 (section 14);
- `eventStore.rebuild.maxAttempts` defaults to 5 (section 13);
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
| Open logs: location, append, batch framing, `fsync`, recovery of uncommitted batches, per-stream sequence and its high-water mark | Business preconditions and the Work critical section (the consumer, under its own gate) |
| Sealing: rotation, git object layout, compare-and-swap ref update (through the Git component's Publication port), receipt, recovery | Locks as a mechanism (holder-lock); Event Store only declares its two lock rows |
| Reading: the reader protocol, verification, dedupe, deterministic order, cursors | Claims, leases, worker slots (runtime) |
| Sharing: fetch refspec, push of the own ref, reconciliation of the own ref, mirrors (fetch and push run through the Publication port) | Work-tree commits, merges and land (Git component; today the 4.3-R main door); git plumbing and the publication of `refs/fgos/*` (the Git component's Publication port) |
| The verbs `fgos events sync|status|export`, the store part of `fgos rebuild`, the doctor checks of section 21, the migration | Scheduling any process; there is no daemon |

There is one implementation of the core: the Rust crate `fgos-event-store`. The Node facade `src/event-store/` decides nothing. Rust consumers (observe, `fgos-work-state`) link the crate. Git access for `refs/fgos/*` goes through the Git component's Publication port (`docs/platform/git/spec.md` section 4: write objects, compare-and-swap a ref, read and walk a chain, fetch, push). Event Store is the only production writer of event refs and calls that port for every one of them; the crate has no git driver of its own. Event Store still decides everything the protocol decides: it supplies the seal and merge manifests and the parent order, and Git never computes an event union, coverage or a business conflict outcome. The protocol of sections 10 and 14 is unchanged by this placement (section 20).

## 4. Layering and locks

```text
consumers (Work, porting, observe ...)    register streams; own gates, reducers, caches
     |  read(cursor) / append(stream, events, cursor) / seal / sync / export
Event Store (fgos-event-store)            envelope, open logs, seal, reader, order, sharing
     |                 |                    |
holder-lock         Session Identity     Git component (fgos-git): Publication port
(event-append,      (writer id, src)      -> git object store (refs/fgos/*)
 event-seal)                              plumbing only: no index, no work tree, no HEAD,
                                          no main-checkout lock, no main door
```

Event Store never imports a consumer. Event Store depends on the Git component, never the reverse: Git imports no consumer. A consumer never writes an open log or a ref itself.

Two new registry rows in `packages/holder-lock/contracts/lock-registry.v1.json`, both kind `mutex`, scope `repo`, path template `<eventOpenRoot>/locks/<name>.lock` (a new template resolved by section 8):

| Lock | Rank | Held for | Taken by |
|---|---|---|---|
| `event-seal` | 58 | one seal or one sync | any process of the store, `try` for opportunistic triggers, wait for explicit verbs |
| `event-append` | 70 | one append (recovery, write + `fsync`) or one rotation rename | the crate, in process, never across a git call |

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

Canonical serialization: keys sorted, no insignificant whitespace, UTF-8, one trailing newline. `h` is the event identity. The batch commit marker of section 9 is a line of the open log and of a sealed `events.jsonl`, but it is not an event: it has no `h`, takes no `seq` and is never folded.

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
  <stream>/active.jsonl            the one log being appended: batches of event lines, each closed by a commit marker (section 9)
  <stream>/closed/<first>-<last>.jsonl   rotated, immutable, awaiting publication
  <stream>/hwm.json                {lastSeq} written at rotation (tmp, fsync, rename, fsync dir); a hint, never the only source (section 9 step 4)
  <stream>/sealed.json             {lastSeq, commit, cover, certified} the last verified receipt, the coverage map and the certified commits of the last complete walk of the stream's ref (section 11); written durably before any segment is deleted; a cache, verified against the ref
```

Topologies: a plain repository, a linked worktree (also on another filesystem, because the open root is in the common dir), `--separate-git-dir`, and a bare repository with worktrees resolve to one valid root (measured by experiment 1, `N-2`). A submodule has its own common dir and therefore its own store; that is correct and documented. A directory that is not a git repository is refused with `event-store-no-repository`; fgOS Work already depends on git worktrees and merges, so this spec does not add a second, non-git storage form. The open root must be on a local filesystem with atomic `rename` and directory `fsync`; holder-lock's `guarantee(path)` is asked for `<eventOpenRoot>/locks`, and `none` (NFS, SMB, CIFS) refuses with `event-store-unsupported-filesystem`.

Deleting a clone deletes its unsealed events. That is the price of keeping open logs with the repository they belong to; the seal cadence bounds it (section 16).

## 9. Append (the ack point)

`append(stream, events[], {cursor})`, one batch is one settlement unit:

1. Before any lock: validate types against the registry, resolve the writer id, canonicalize payloads.
2. Take `event-append` (in process, a kernel lock through the crate).
3. **Drop an uncommitted batch.** Bytes of `active.jsonl` after the last commit marker that verifies (step 6) belong to an appender that died before its ack. Truncate them, complete event lines included, and `fsync` the file; the lock proves no live appender is mid-write. No reader folded those lines (section 11), so their `seq` were never visible and are assigned again. This is automatic recovery, not a doctor step.
4. **Recover the high-water mark** before any `seq` is assigned, from local files only and with no git call. Its sources are:
   - the `lastSeq` of `sealed.json`, the verified receipt that section 10 step 2.4 writes before any segment is deleted;
   - the range of every closed segment;
   - `hwm.json`;
   - the committed events of `active.jsonl`.

   Closed segments that end at or below the receipt are published and await deletion. The other segments must run contiguously from the receipt's `lastSeq` plus one, and the first committed event of `active.jsonl` must follow them. The stream's last `seq` is the highest of these values.

   A gap, an overlap above the receipt, or an `hwm.json` above every location refuses the append with `event-store-seq-recovery-conflict` and assigns nothing. The consumer treats this like `catch-up-required` (section 13): it leaves the gate and runs `seal(stream)`, which rebuilds a lost receipt by a walk of the own ref (section 10 step 2.1), and then it enters again. A conflict that remains after that is corruption, and doctor fails. When `hwm.json` is behind, it is rewritten (tmp, `fsync`, rename, `fsync` dir).

   A crash between the rotation rename and the `hwm.json` write (section 10 step 1) therefore never makes a later append reuse a `seq`, because the renamed segment holds the value (model check C1, section 23.1).
5. If `cursor` names this stream and its `seq` differs from the current last `seq`, refuse with `stale-cursor`: the caller decided on a view that missed an event of its own stream. This is a stream-level second net, never business CAS.
6. Assign consecutive `seq`, set `seen` from the cursor, and compute `h`. Write the event lines and then one commit marker, all with one `write`. The marker is the canonical line `{v: 4, kind: "batch-commit", origin, stream, firstSeq, lastSeq, count, sha256}`, where `sha256` is that of the batch's event-line bytes. Then `fsync` the file, and `fsync` the directory when the file was created.
7. Release. Return `{origin, stream, firstSeq, lastSeq, h[]}`.

The ack point is the end of step 6. From there, the events survive a process crash, and they survive an operating-system crash on a filesystem that honors `fsync`. Until sealed they are L7 level D5 (this machine only, `docs/platform-foundations.md:184-190`); after seal they are D2 in the local object store; after push a remote copy exists.

A batch is all-or-nothing for readers. They fold an event line only when a commit marker that verifies (count, `seq` range and `sha256`) closes it. Any prefix of a batch that a short write or a crash leaves behind, complete lines included, is never folded and is dropped by step 3.

This spec keeps the promise and frames the batch, instead of dropping the promise, because a Work batch is one settlement unit (section 13). Its consumers fold it as one mutation. A visible prefix would fold a half-mutation that nobody acknowledged and would push the repair into every reducer. The model check showed that the rule of folding complete lines alone breaks the promise (C2, section 23.1).

One open log per stream, not per writer: the per-writer files of today (`src/state/store.mjs:146-180`) existed so that tracked files would merge; outside the work tree that reason is gone, and one log under one lock gives the per-store total order section 12 needs.

## 10. Seal

`seal(stream)` runs under `event-seal`, never inside the Work gate (section 4). Steps:

1. **Rotate.** Under `event-append`, first run the recovery of section 9 steps 3 and 4. Then, if `active.jsonl` is non-empty (it now ends with a commit marker that verifies):
   1. `fsync` it;
   2. rename it to `closed/<first>-<last>.jsonl`;
   3. `fsync` both `closed/` and the stream directory, because the rename crosses two directories;
   4. write `hwm.json`.

   The next append creates a new `active.jsonl`. Release `event-append`. Appends wait only for this rename.
2. **Publish**, for each closed segment in `seq` order, with no append lock held:
   1. Verify the segment. Every event line's `h` must verify. Every batch must be closed by a commit marker that verifies, and the segment must end with one. The event `seq` must be contiguous. `first` must equal the own stream's last sealed `seq` plus one. That last sealed `seq` is `cover[(own origin, stream)]` after a coverage walk (section 11) from the ref's current tip. The walk starts from the `cover` and `certified` in `sealed.json`; when that file is missing, it starts from empty coverage and no certified commit, and runs to the roots. `sealed.json` is only a cache, and its `lastSeq` must not exceed the walked value. A gap stops with `event-store-chain-gap`.
   2. Write the objects of a sealed changeset (a commit of kind `seal`, table below):
      - blob `events.jsonl`: the segment bytes, commit markers included, unchanged;
      - blob `seal.json`: canonical `{v: 1, kind: "seal", origin, stream, scope, machineId, firstSeq, lastSeq, count, sha256}` where `count` is the number of events and `sha256` is that of the segment bytes;
      - tree with exactly those two entries;
      - commit: first parent is the ref's current tip (none for the first); a commit whose segment carries a `store.promote` event has the promoted branch ref's tip as second parent; author and committer `fgOS Event Store <event-store@fgos.invalid>`; message `fgos-events seal <origin>:<stream> <first>..<last>`.
   3. Compare-and-swap the ref with `update-ref <ref> <new> <old>`, where `<old>` is the tip read in step 2.1 (the all-zero id when the ref is new). The call goes through the publication port: either `gix` in process, or `git` plumbing with `-c core.fsync=objects,reference -c gc.auto=0 -c maintenance.auto=false`, with no index, no work tree and no porcelain.

      A failed compare-and-swap exits non-zero and changes nothing. In V-REF-01, eight concurrent swaps had one winner, and the seven losers each succeeded after rereading the tip. A caller rereads the tip and runs step 2.1 again from it before any retry; it never retries with the stale `<old>`. Inside the store, `event-seal` serializes seal and sync, so the reread tip either is the commit of the store's own receipt (crash recovery, table below) or was moved by an actor outside the store. In the second case, stop with `event-store-ref-moved`, keep the segment, and doctor fails.
   4. Receipt: read the ref back, then read the blob `<new>:events.jsonl`. The ref must equal `<new>`, and the blob's SHA-256 must equal the segment's. The receipt `{ref, commit, sha256, firstSeq, lastSeq}` goes to `sealed.json` together with the walk's `cover` and `certified`, with `lastSeq` kept apart from the emitted coverage. `<new>` is added to `certified` only when every event in `<new>` and its ancestors has been emitted, the coverage has been raised to match, and nothing is deferred (sections 11 and 12); otherwise the receipt is still written, so the deletion of step 2.5 may proceed, but `<new>` is not certified. The file is written with tmp, `fsync`, rename and `fsync` dir, so that it is durable before step 2.5.
   5. Only after the receipt: delete the closed segment and `fsync` the directory.
3. Re-list `closed/`; repeat while segments remain (bounded per call), so a lifecycle seal that lost the `try` race is picked up by the running sealer.

**Commit kinds.** A ref is a commit DAG, not a linear chain: promote commits and merge commits have two parents. Each commit's tree is that commit's own changeset, never cumulative, so a merge commit does not combine its parents' trees.

| Kind | Parents | Tree | Written on |
|---|---|---|---|
| `seal` | the ref's previous tip (none for the first) | exactly `events.jsonl` and `seal.json {kind: "seal", ...}` | own `events`, `branch-events`, `local-events` refs |
| `seal` carrying a promote | the ref's previous tip, then the promoted branch ref's tip | as `seal` | own `events` ref |
| `merge` | the own tip, then the mirror tip (section 14 step 3) | exactly `seal.json`: canonical `{v: 1, kind: "merge", machineId, parents}`; no `events.jsonl` | own `events` ref |
| `legacy` | none | the legacy files and `seal.json {kind: "legacy", ...}` (section 18) | `refs/fgos/legacy` only |

Chain invariant: for one (`origin`, `stream`), every seal commit descends from every earlier seal commit of the same (`origin`, `stream`). Only the store with that origin writes them, it writes them onto its own ref, and that ref moves only forward (compare-and-swap seal, fast-forward or merge, never rewind). Step 2.1 and the gap check of section 11 depend on this invariant. Pruning in the coverage walk does not depend on it: a covered seal can still have an unread ancestor of another origin under a merge (model check C4), so section 11 prunes only at certified commits.

Recovery is part of every seal and every sync; any process of the store runs it, so the events of a crashed session are sealed by the next fgOS command on that clone, with no `doctor --fix`:

| Crash point | What remains | Next seal does |
|---|---|---|
| During append | An uncommitted batch (a torn line, or complete lines without a commit marker that verifies), never acked | The next append or rotation drops it under `event-append` (section 9 step 3); readers never fold it |
| During the rotation rename | `active.jsonl` or the closed segment, never both (atomic rename) | Normal publish |
| After the rotation rename, before `hwm.json` | A closed segment and a stale `hwm.json` | The next append or rotation recovers the high-water mark from the closed segment and rewrites `hwm.json` before assigning any `seq` (section 9 step 4) |
| After objects, before `update-ref` | Unreachable objects; segment intact | Publishes again; old objects are garbage for git |
| After `update-ref`, before the receipt or the delete | Segment and a ref that already contains it | Finds the ref's last sealed `seq` covering the segment, checks the blob hash, writes the receipt, deletes. A hash mismatch stops with `event-store-seal-mismatch` and deletes nothing |
| After the receipt, before the delete | Segment, a ref and a receipt that cover it | Deletes the segment; section 9 step 4 treats it as published and awaiting deletion |
| After the delete, before the directory `fsync` | The segment may reappear after power loss | Same as the previous row |

Invariants: data moves only forward, `active` to `closed` to ref. Each move makes the next location durable before it removes the previous one. A ref moves only forward by compare-and-swap and is never rewound by the store. A segment is deleted only after a durable, verified receipt. Nothing is truncated except an uncommitted batch. No `seq` is assigned before the high-water mark is recovered from every local location.

## 11. Reader protocol and read boundary

`read(streams, cursor)` returns every event with `seq` above the cursor for each requested stream, verified, deduplicated by `h`, in the order of section 12, plus the new cursor. For the store's own streams it reads in the same direction the data moves:

1. Open `active.jsonl` and read it through that descriptor; fold only events of batches closed by a commit marker that verifies (section 9).
2. List `closed/` and read each segment; a segment that vanished (`ENOENT`) is recorded.
3. Read the tip of each ref that can carry a requested stream, then run the coverage walk below from those tips with the cursor's coverage map and certified commits, reading only the ranges the cursor lacks.

Why no acked event is lost and none is counted twice while a seal runs: an event acked before the read starts is in `active`, in `closed`, or in the ref. If it leaves `active` before step 1 opens it, the rename has already put it in `closed`, which step 2 lists later. If its segment is deleted before step 2 reads it, the ref already contained it (deletion follows the receipt), and step 3 reads the ref later; refs only move forward. Reading a range from both a segment and the ref is removed by the `h` dedupe. The result must be contiguous from the cursor to the highest `seq` read; a hole the ref does not fill is `event-store-gap` (corruption, never skipped).

**Coverage walk (M4, corrected after the model check).** The input has three parts:

- a set of tips;
- a coverage map `cover[(origin, stream)] -> seq`;
- a set `certified` of commit ids. Each one is a commit that an earlier complete walk processed together with every one of its ancestors.

The map and the set are taken from the cursor, and both are empty for a rebuild. The output is every sealed range above the coverage, the new coverage map and the new certified set. The walk order does not matter, because order comes from section 12.

1. Put the tips on a stack. The visited set starts empty.
2. Pop a commit. If it is already in the visited set, skip it; otherwise add it to the set.
3. If the commit is in `certified`, stop on this path and do not push its parents. This is the only pruning rule. A seal whose `lastSeq <= cover[(o, s)]` is **not** pruned. Coverage says that its events were folded. It does not say that its ancestors were read: a merge can place a seal of an origin the reader has never seen under a later seal of a covered origin (model check C4).
4. Otherwise read its `seal.json`. For a `seal` commit, read the part of `events.jsonl` above `cover[(o, s)]`, selected by the `origin` and `stream` in `seal.json`, and keep only the batches that commit markers close. For a `merge` commit, read nothing. Then push every parent.
5. When the stack is empty, the walk is complete. Only then is the cursor changed:
   - `cover[(o, s)]` is raised to the highest `seq` that section 12 emitted for each (`o`, `s`), and only if the ranges read for it are contiguous from the old value. A hole is `event-store-gap`. An event that section 12 defers raises no coverage, so `cover` stops before it (section 12).
   - If nothing was deferred, the walk's tips are added to `certified`.

   An incomplete walk (error or interruption) changes neither the coverage nor `certified`.

Termination: each commit is visited at most once, and descent stops at the first certified commit on each path; with no certified commit it reaches the roots. A walk therefore visits the commits added since the last complete walk, plus every commit reachable from them that no certified commit covers. That is O(V + E) of the reachable DAG in the worst case: on a rebuild, after a lost `sealed.json` or cursor, and when new commits attach below the old tips, for example a merge whose parent is an interior commit of another ref. An origin the reader has never seen has coverage 0, and its seals are read on every path until a certified commit or the root, so a new origin is discovered and never skipped. An implementation may keep more certified ids than the tips of complete walks, for example every commit they processed. Only complete walks with nothing deferred add to that set, and losing it only shrinks it, so the cost of a lost set is a longer walk and never a missed commit. Every walk runs outside the Work gate.

**In-gate bound.** Inside the Work gate (section 13), `read` runs only steps 1 and 2 for the store's own streams. It never runs step 3: no commit-DAG walk and no process spawn run inside the gate. Suppose the cursor's own-stream `seq` is below what `active` and `closed` still hold, either because a segment vanished or because the cursor is older than the oldest unsealed event. Then `read` returns `catch-up-required` without walking, and the consumer catches up outside the gate before entering again. Foreign and legacy streams are never caught up inside the gate. In steady state the cache cursor equals the own stream's last `seq`, because every gated append folds and writes the cache before the gate is released. The in-gate read is then a tail read of `active.jsonl`.

Read boundary: own-clone events are visible to every worktree of the clone from their ack, including unsealed ones. An append in progress may or may not be visible. An uncommitted batch is never visible. Events of other machines are visible after they seal and push and this clone fetches. Events of another clone on the same machine are visible after both sync, like another machine. An event whose causal predecessor has not arrived is held back (section 12).

Foreign streams are read from mirror refs (section 14), and the legacy history from `refs/fgos/legacy` (section 18). The model check of section 23.1 ran against spec v2 before this text. It found no lost acked event and no double count in the active, closed, ref read order. It found three defects that this text corrects: `seq` reuse after a rotation crash (section 9 step 4), exposure of a partial batch (section 9), and the coverage stop (step 3 above). The corrected rules are design arguments that the stress test of section 23.2 item 2 must confirm before code is accepted.

## 12. Order

Wall clock never decides order alone. The order is the output of one algorithm over a set of events, so that every machine holding the same set computes the same sequence (M2).

Placement before the sort:

1. **Legacy events** form a prefix in the legacy order `(ts, file, seq)` with the legacy dedupe, exactly as `src/state/replay.mjs:870-889` does today, because the legacy import keeps every file name (section 18). They precede every v4 event and take no part in the sort.
2. **Promoted branch events.** A `store.promote {stream, throughSeq, tip}` event forms one block with the events it promotes. Those are the named branch stream's events up to `throughSeq` that no earlier promote named. The block is the promote event followed by the promoted events in `seq` order. In the sort the block is one node: it takes the sort key of the promote event and the causal inputs of all its members, minus the edges inside the block. Branch events that no promote names are not part of the project order.
3. **Dedupe** by `h`. Two different events with the same (`origin`, `stream`, `seq`) are `event-store-seq-conflict`, a corruption that is never ordered.

Causal graph: there is an edge `a -> b` when (i) `a` and `b` are in one (`origin`, `stream`) and `a.seq = b.seq - 1`, or (ii) `b.seen["<a.origin>:<a.stream>"] = a.seq`, which means `b`'s writer had folded `a` and everything before it in that stream. The graph has no cycle. `seen` names only events acked before `b` was decided, so every edge points from an earlier ack to a later one. A block adds no cycle either, because the promoted events and everything they saw were acked before the promote event was appended. A cycle found in an event set therefore means corruption. It is reported as `event-store-order-cycle` and is never broken by dropping an edge.

Causal closure: when an event's predecessor named by (i) or (ii) is absent from the set (not fetched yet), that event and everything that depends on it are **deferred**. A deferred event is handled as follows:

- It is not folded into any view. `read` reports it, and `fgos events status` lists it with the missing (`origin`, `stream`, `seq`).
- No cursor advances past it. For its (`origin`, `stream`) the coverage stays at the last emitted `seq`, so the next read returns the event again. A walk that leaves any event deferred certifies no commit (section 11). Deferral along edge (i) defers the rest of that stream, so the held part of a stream is always a suffix.
- It is incomplete data, not corruption. The remedy is a later sync, and nothing waits on the network inside the Work gate. Publication does not assume that the ref carrying a predecessor has been shared: `b` can arrive on one ref before `a` arrives on another (model check C5).
- It is emitted once its predecessor arrives.

The sort therefore runs over the causally closed subset, and its output is a function of that subset alone.

Sort: a deterministic topological sort (Kahn). A node is ready when all its predecessors have been emitted. The sort repeatedly emits the ready node with the smallest key (`ts`, `origin`, `stream`, `seq`), compared field by field as bytes. The keys sit inside the hashed bytes and are unique per event, so no tie remains and no engine-dependent comparator is involved. No pairwise comparator that mixes causality and timestamps is used anywhere. The model check showed that such a comparator can be cyclic (C3), and it ran this sort 36,864 times with one result per case (section 23.1).

Contract:

- Deterministic: the same event set gives the same sequence on every machine.
- Causal: when `b`'s writer had folded `a`, `a` is emitted before `b`.
- **Incremental fold equals the sort only in one proven case.** That case is new events of the store's own stream, appended under the Work gate, folded into the same view their writer decided on, with no foreign event, released deferred event or promote block added to the set since that view.

  The argument: an append's `seen` names the highest folded `seq` of every other stream in the view (section 9, step 6), and the new event's predecessor in its own stream is the previous event of that stream. Every event in that view is therefore a causal predecessor of the new events, and the new events become ready only after the whole view has been emitted. Appending them to the folded view gives the sequence that sorting the enlarged set gives.

  The reader checks the condition. Each new event's `seen` must cover the cursor's position in every other stream; if it does not, the new event was decided on another view and the claim does not hold. Work's single cache, read and written under the gate (section 13), meets the condition. Outside this case the store does not claim it.
- **The cursor is coverage, not an offset.** A cursor records which events a view has folded: per-stream positions, coverage and certified commits (section 15). It is not a position in an immutable global order. Event Store does not promise that the sequence of one event set is a prefix of the sequence of a larger set, because a late concurrent event can sort before events already folded. In model check C6, `[x(ts=2)]` became `[y(ts=1), x(ts=2)]`, and both views are causally closed. When the set grows in any way other than the proven case, the consumer replays the suffix from the first position where the new sequence differs from the folded one, or rebuilds (section 15). A global append-only prefix would need a publication watermark or a consensus protocol, and this spec has neither.
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

This spec keeps that serialization and moves only the append target. The gate is Work's, not the store's: plan 4.3-S's `withStateTx` on the `state` hot-mutex (rank 60, one per clone; its files are owned by the holder-lock registry, which plan 4.3 P00 sets to `<fgosDir>/locks/state.hot` with the kernel lock `<fgosDir>/locks/state.reclaim.lock` for reclaiming a dead holder) is the Work gate. A Work mutation becomes:

1. Before the gate: resolve writer id and anything that needs a child process; catch the view up with the full reader (section 11, steps 1-3), replaying or rebuilding when a mirror or legacy tip changed or a deferred event became ready (section 15).
2. Inside `withStateTx(state)`:
   - `read(project, cursor)` with the in-gate bound of section 11, and fold into the cache view. On `catch-up-required`, release the gate and return to step 1.
   - Check the precondition (FSM, capacity, claim).
   - `append(project, events, {cursor})`. Treat `stale-cursor` as a bug. On `event-store-seq-recovery-conflict`, release the gate, run `seal(project)` and return to step 1.
   - Fold the new events and write the cache with the new cursor. Settle the claim if any.
3. Release the gate, ack to the caller.
4. After the gate: if any appended type is `sealOnWrite`, `seal(project)` with `try`.

No commit-DAG walk, no git call and no process spawn runs inside the gate. A foreign event fetched after step 1 is not folded by this mutation. Its `seen` then names exactly the foreign coverage of the view, so section 12 treats that event as concurrent and loses nothing. A rebuild computed outside the gate is installed under the gate only when the own-stream positions it was computed from are still current; otherwise it is computed again, at most `eventStore.rebuild.maxAttempts` times (agent default 5). After the last mismatch the consumer stops with `event-store-rebuild-busy`: the current cache stays valid, no stale snapshot is installed, and the result is never reported as a successful rebuild. Retrying alone cannot promise progress under sustained writes (the corrected model check found that livelock, N1); a handoff that guarantees installation is a later item that needs its own proof.

The per-stream `event-append` lock protects only the bytes and the sequence of one open log; it never replaces the gate. The draft's lines "Per-writer lock; writers never contend" (draft section 11) and "P01 and P02/P04 are re-cut around claims only" (draft section 15) are withdrawn. Porting keeps its own gate (`porting-events`, rank 60, `src/state/porting-store.mjs:89`) the same way.

## 14. Sharing across machines

Refs in each clone:

| Ref | Written by | Exchanged |
|---|---|---|
| `refs/fgos/events/<own-machine-id>` | this clone's store (seal, reconcile) | pushed by sync, never force |
| `refs/fgos/remotes/<remote>/events/<machine-id>` | `git fetch`, through the refspec setup writes | fetched; read-only to the store |
| `refs/fgos/legacy` | the cutover, once | pushed once, fetched like the others |
| `refs/fgos/branch-events/...`, `refs/fgos/local-events/...` | this clone's store | never |

A default clone or fetch carries only `refs/heads/*`; its refspec is `+refs/heads/*:refs/remotes/origin/*`. In V-REF-01 a fresh clone had no `refs/fgos/*` (`rev-parse` exit 128) until an explicit refspec fetched it. Setup therefore installs two fetch refspecs on the remote named by `eventStore.remote` (default `origin`), in the repository-local git config:

- `+refs/fgos/events/*:refs/fgos/remotes/<remote>/events/*`
- `+refs/fgos/legacy*:refs/fgos/remotes/<remote>/legacy*`

2026-10-19: Git RepositoryConfig owns these mappings; Event Store reads its policy rather than maintaining a copy. The legacy wildcard tolerates a remote with no legacy ref before cutover; its empty suffix preserves the exact destination `refs/fgos/remotes/<remote>/legacy`. Setup also replaces the old exact legacy line without changing user settings.

Setup installs them before any reader expects mirrors. Until they exist, `status` and doctor report the refspec as missing (section 21), not as empty history. After that, every plain `git fetch` keeps the mirrors current. Setup never writes a push refspec, because a configured `remote.<name>.push` changes what a person's bare `git push` sends. Fetching into a mirror namespace means that a fetch can never overwrite the own ref; V-REF-01 confirmed that a fetch created no own ref.

`fgos events sync [--remote <name>] [--no-push]`, under `event-seal`:

1. Seal every pending segment of every stream.
2. Fetch the refspec.
3. Reconcile the own ref with its mirror:
   - If the own ref descends from the mirror, push.
   - If the mirror descends from the own ref (the own ref was restored from elsewhere), fast-forward the own ref by compare-and-swap.
   - If they diverged, write a commit of kind `merge` (section 10) whose parents are the own tip and the mirror tip, with the tree `seal.json {v: 1, kind: "merge", machineId, parents}` only. Compare-and-swap the own ref to it, then push.

   Never force-push. Every compare-and-swap here follows the failure and retry rule of section 10 step 2.3. The coverage walk reads both sides of a merge through the visited set (section 11).
4. `git push <remote> refs/fgos/events/<own>:refs/fgos/events/<own>` (and `refs/fgos/legacy` once). Sync pushes only the own ref, never a mirror or another machine's ref. A push the remote rejects as non-fast-forward (V-REF-01: exit 1) converges on the next sync by fetching, writing the two-parent merge of step 3, and pushing normally. It never converges by force.
5. Record the result (time, tips, error) for `status`; tell registered consumers that mirror tips changed.

Settled with the phase 05 review (2026-10-18):

- **Reconciliation is authenticated, never inferred from the graph.** Before the compare-and-swap of step 3, sync durably records the exact verified prior own tip and the computed candidate (merge or fast-forward target) as authorized; only that pair is accepted as the store's own later. A merge commit on the own ref that no such authorization names is refused (`event-store-ref-tampered`), even when its shape is valid. The authorization survives failures before and after the CAS, so a crash after the CAS recovers and publishes.
- **Each mirror is verified on its own.** A foreign mirror that is rewound, forged or otherwise fails verification keeps its last authenticated tip and position and is recorded as a typed warning in the sync status; own publication continues. A failure of the mirror of the own machine id refuses the sync.
- **Certified sync positions.** Sync persists each mirror's authenticated position next to its tip and uses it as a certified stop, so a steady sync walks only new commits; a status file written before positions existed is verified in full once.
- **One tracked-fence authority per clone.** The tracked legacy fence is read at the HEAD of the trusted main checkout of the clone, so every linked worktree of one clone shares it, whatever commit the worktree is on. Every fence mismatch, in read and in sync, reports `event-store-legacy-mismatch`.

Triggers: the explicit verb; and the opportunistic check of section 16 when the last successful push is older than `eventStore.sync.intervalSec` (default 300; 0 means explicit only). Network calls never run inside the Work gate.

Offline: append, seal and read work fully; fetch and push fail, the failure is recorded, `status` shows "unpublished since", the next trigger retries; Work is never blocked by the network. A clone with no remote keeps everything local.

Two clones on one machine share a machine id by default (one `stateRoot`), so both write `refs/fgos/events/<id>` in their own repositories with different store ids. The first push wins; the second sync finds a diverged mirror and writes a merge commit, so both chains converge on the remote with nothing lost and no shared sequence (store ids differ). Doctor warns `event-store-machine-ref-shared` when the mirror of the own id carries another store id, and names the fix: `git config fgos.machineId <other-id>` in one of the clones.

Joining and leaving. A new machine needs no registration: setup mints its machine id and installs the wildcard refspec, the first fetch brings every existing machine ref and `refs/fgos/legacy`, the consumer rebuilds its view from them, and the machine's own ref appears on the remote at its first sync, where the other machines' wildcard fetch picks it up. A machine that leaves is not removed: its ref stays on the remote as history and every view keeps folding it, so nothing it published is lost and nothing breaks. Events it acknowledged but never pushed exist only on that machine; before retiring a machine run `fgos events sync` until `status` shows nothing unpublished. A reinstalled machine mints a new id unless `fgos.machineId` is set to the old one; either is safe, because store ids keep the sequence spaces apart. There is no retire or delete verb: deleting a machine ref would remove published truth, and the cost of a stale ref is one more tip in each walk.

Garbage collection: V-REF-01 kept refs and objects that only `refs/fgos/*` reached through `git gc`, `git gc --prune=now`, `git repack -ad` and `git pack-refs --all`. `git worktree add`, `stash`, `clean -fdx` and `checkout` left those refs unchanged. Objects that no ref reaches, such as those of an interrupted seal, are ordinary garbage.

A forge may hide custom refs in its UI; reading them goes through `fgos events export` or `git log -p <ref>`. V-REF-01 tested the behavior of `refs/fgos/*` under push, fetch, packed refs, gc and prune, fresh clones and divergence against a local bare repository used as the remote (section 23.1 item 2), which needed no external push and no owner authorization. Whether the owner's own forge accepts and serves `refs/fgos/*` stays an acceptance gate on the owner's real remote (section 23.2 item 5); a local bare repository cannot answer it.

## 15. Views, cursors and verbs

A view is a cache owned by its consumer (Work: `.fgos/cache/state.json`, `src/state/fgos-file-registry.mjs:36`), never tracked, never truth, rebuildable from zero. A consumer may choose another engine, SQLite included, without touching this spec; that engine's concurrency is the consumer's concern.

The cursor is the cache key, and it records coverage, not a position in a global order (section 12). It holds:

- per stream, the highest emitted `seq`, never past a deferred event;
- the coverage map and the certified commits of section 11;
- the tips of the mirror and legacy refs.

A consumer that reads with its cursor gets one of two answers:

- **Fold incrementally.** This applies to new events of the store's own streams in the proven case of section 12: no mirror or legacy tip changed, no deferred event was released, and every new event's `seen` covers the cursor. The new events come after everything already folded.
- **`rebuildRequired`.** This applies in every other case: a mirror or legacy tip changed, a deferred event became ready, or a new own event was decided on another view. Outside the Work gate, the consumer replays the suffix from the first position where the new sequence differs from the folded one, or refolds from zero, because such events can sort before folded ones.

Keying by tips bounds what is new. It does not make a walk cheap: a range walk `A..B` still traverses the reachable part it needs. In V-REF-01, on a DAG of 100,011 commits, the full `rev-list` took 224 ms and the range walk took 190 ms for 90,011 commits. Pruning at certified commits (section 11) limits a catch-up walk to what was added since the last complete walk, and a rebuild walks everything. Snapshot and compaction of the ref chain stay the follow-up for when a rebuild exceeds the budget (section 22).

The usual verbs (`fgos list`, `show`, `ready` and the others) read the consumer's view after one `read(cursor)` catch-up. Commands:

| Verb | Does |
|---|---|
| `fgos events sync` | Section 14 |
| `fgos events status [--json]` | Store id, machine id, every ref and tip, per stream unsealed count and oldest unsealed age, closed segments pending, last receipt, last fetch and push with result, own ref ahead/behind its mirror, a missing fetch refspec, orphan branch streams, deferred events and their missing predecessors (section 12), the guarantee level of the open root |
| `fgos events export [--stream <s>] [--since <cursor>] [--format jsonl|legacy-layout] --out <dir>` | Canonical-order JSONL, or the legacy file layout with a parity report (section 18) |
| `fgos rebuild` | The existing rebuild verb (`src/cli/command-registry.mjs:1393`) stays the one rebuild door: it drops every registered consumer cache and refolds from the store |

## 16. Seal cadence and loss budget

Agent default, accepted by the owner on 2026-10-17 15:13 (M3), configurable by `eventStore.seal.intervalSec` (default 300):

| Trigger | Action | Who |
|---|---|---|
| A `sealOnWrite` type was appended (Work: status move, answer, decision, approval, land result) | `seal(project)` right after the gate is released | the appending process |
| The oldest unsealed event is older than the interval | seal every stream | the opportunistic check at the start and end of every fgOS command that opens the store, and in the loop of long-lived gateway and runner processes |
| Clean writer exit | seal every stream | session end (session deregistration) and shutdown of gateway and runner |
| A crashed process left an uncommitted batch or closed segments | repair and seal | the next fgOS command on the clone, through the same triggers |

No daemon and no timer exist only for sealing. When no fgOS process runs, unsealed events wait until the next command; that window is not bounded by wall clock and the contract says so. Sealing runs only git plumbing on refs, so the council's objection to sealing on every lifecycle event (one work-tree commit and `index.lock` each) does not apply.

Doctor (`event-store-unsealed`): passes when nothing unsealed is older than twice the interval; warns above that; fails when the oldest unsealed event is older than 3600 s. There is no event-count cap, because lifecycle events already seal at once. These thresholds are agent defaults that the owner accepted as spec v2 on 2026-10-17 15:13.

## 17. Node to Rust route and latency budget

**Route** (owner decision 2026-10-17 15:13; packaging amended by Git G0 owner decision Q1, 2026-10-17): the route is an N-API addon, loaded by the Node payload. It is the one combined N-API addon that links both `fgos-event-store` and `fgos-git` and exports both facades (`docs/platform/git/spec.md` section 4), so a Node process holds one in-process instance of each crate; a second, separate addon load of either crate in the same process fails closed. Seal and sync reach the Git Publication port through this same load. The combination changes packaging only, not the route rule below. The owner granted no exception to the exec guard of plan 4.3 P01, under which any `child_process` call inside a hot critical section throws `exec-under-hot-lock` (`plans/261016-1306-main-checkout-single-door-hot-lock/phase-01-hot-lock-core.md:19`). So `read` and `append` run inside the Work gate with no spawn. Session Identity follows the same rule (`docs/platform/session-identity/spec.md` section 5).

- The per-call host facade (`fgos internal event-store ...` per call, like `lock-fd`) is excluded, because it spawns inside the gate.
- A persistent pipe to a running host is not available, because no host runs on the plain CLI path and no daemon is dedicated to Event Store.
- Seal, sync, export and status run outside the gate and may still spawn, for example git plumbing as a subprocess.
- Rust consumers link the crate and pay no route.

The route has a cost: the combined native addon for every supported platform and Node ABI, carried in the npm package and the legacy-node payload, plus build, activation and doctor checks (section 21; section 23.2 item 9).

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
| (a) Event Store increment inside the Work gate | the store's share of the gate: in-gate read (section 11), append with recovery and `fsync`, fold of the new events | p95 at most 50 ms at 20 concurrent sessions on ext4; 0 process spawns inside the gate; no exhaustion at 20 sessions by 200 mutations in 60 s |
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

Rollback is not "point the facade back": an old release reads files in `(ts, file, seq)` order and cannot read refs, and v4 events written after the cutover sort differently under that rule. Rollback is `fgos events export --format legacy-layout`: it writes the legacy files byte for byte from `refs/fgos/legacy`, writes v4 events as one file per stream with legacy field names (batch commit markers are dropped), runs a port of the legacy fold (`src/state/replay.mjs:870-889`) on the result, and reports every entity whose view differs from the v4 view. A person decides with that report; then writers stop, the files are committed, and the previous release is activated. Before step 5 is pushed, rollback is reverting the commit.

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

**Plan 4.3-S.** The draft's re-cut "around claims only" is withdrawn (C1). The 4.3 lane re-cut its state part on 2026-10-17 18:50 as wave S from main ([plan 4.3](../../../plans/261016-1306-main-checkout-single-door-hot-lock/plan.md), block "CẮT LẠI 18:50"): P01 (`hot-lock.mjs`, `withStateTx`, `state` hot-mutex) stays as written and is the Work gate; P02 (claims into `state`, callers onto `withStateTx`) stays, and inside the transaction appends go to the Event Store facade at the cutover, through a route that respects the P01 exec guard (section 17); P04 lands whole in one commit, the capacity check inside `state` together with narrowing `main-checkout` to the checkpoint. The Event Store cutover later only removes the checkpoint call from the claim path, since no event file needs a checkpoint. `withStateTx` does not depend on where events are stored, so wave S lands before the Event Store cutover and unblocks 6.2 P09.

**Git component** (`docs/platform/git/spec.md`). It owns git operations. Its Publication port (Git spec section 4: write objects, compare-and-swap a ref, read and walk a chain, fetch, push) is the port of section 3; Event Store is the only production writer of event refs and calls it, with no protocol change. Node reaches both crates through the one combined addon of section 17. Order (Git spec section 12): Publication ships before replacement Land, and the legacy cutover of section 18 lands before, or in the same release as, the release that exposes replacement Land. "Seal before land" and `store.promote` plug into land as consumer policy. The catalogue entries this spec retires are whole mechanism families, not a percentage (the 43/182 figure was rejected by the first packet): tracked event files dirtying checkouts (G-092, G-093, G-120, part of G-029), merges of append-only logs (G-089, G-121, G-170), truncation detection (G-210, G-211, half of G-184), event checkpoints and their cadence (G-118, G-212, G-213), and file compaction (G-090, G-214). Experiment 1 classified the first three families with the files still in the tree; the last two die only because sealed events leave the tree. The exact list is checked in the acceptance review against catalogue freeze 234. Lessons tied to other tracked `.fgos` files (G-054, G-069, G-086, G-088, the rest of G-166) remain.

**Observe and `fgos-work-state`.** They read events through the crate (`work_source.rs:470-480` today reads files). Observe's own stores become `local` streams in a later change.

**Porting store.** It writes `<dir>/porting/events.jsonl` under its own gate (`src/state/porting-store.mjs:28`, `:89`). It becomes an Event Store consumer in the same cutover (its existing log imported into `refs/fgos/legacy`), so no second write path survives. Its scope is declared by its owner.

## 21. Setup, doctor and configuration

Config defaults merged by `fgos setup` (added only when missing, global then project):

| Key | Default |
|---|---|
| `eventStore.seal.intervalSec` | 300 |
| `eventStore.sync.intervalSec` | 300 (0 = explicit sync only) |
| `eventStore.rebuild.maxAttempts` | 5 (rebuild-install attempts before `event-store-rebuild-busy`) |
| `eventStore.remote` | `origin` |

Repository-local git config, never tracked: the fetch refspecs of section 14 (`+refs/fgos/events/*:refs/fgos/remotes/<remote>/events/*` and the legacy one), and the optional `fgos.machineId`.

Setup fixes: `event-store-machine-id` (mint `<stateRoot>/machine-id` when missing); `event-store-refspec` (add the fetch refspecs when the remote exists and they are missing; never a push refspec); `event-store-lock-dirs` (create `<eventOpenRoot>/locks` with mode 0700).

Doctor checks, registered in `src/setup/registrations.mjs`:

| Check | Fails when |
|---|---|
| `event-store-git-version` | git older than the floor of the chosen publication driver (2.31 for path resolution; 2.36 for `core.fsync` when plumbing runs as subprocess) |
| `event-store-open-root` | root does not resolve, not a git repository, or guarantee `none`; prints the guarantee level |
| `event-store-machine-id` | missing or malformed; warns `event-store-machine-ref-shared` (section 14) |
| `event-store-refspec` | remote configured but fetch refspec missing; any push refspec or any refspec matching `refs/fgos/local-events` or `refs/fgos/branch-events` |
| `event-store-unsealed` | section 16 thresholds |
| `event-store-integrity` | a seal blob whose hash differs from `seal.json`, an event `h` that does not verify, a batch commit marker that does not verify inside a closed segment or a sealed blob, a sequence gap in an own stream, `event-store-seq-conflict`, `event-store-seq-recovery-conflict` that a seal did not resolve, `event-store-order-cycle`, `event-store-ref-moved` or `seal-mismatch` recorded |
| `event-store-sync` | warns when the last push failed or is older than 24 h with a remote configured; reports ahead/behind |
| `event-store-native-addon` | the combined N-API addon of section 17 (linking `fgos-event-store` and `fgos-git`) is missing from the active payload, fails to load, or was built for another Node ABI or platform. Git spec section 4 requires one ABI row for the combined addon, so the Git plan merges this check's ABI evidence with Git's `git-component-compatible` rather than adding a second ABI row |
| `event-store-legacy-layout` | after cutover: tracked event files, `.fgos/events/`, tracked `state.json` or backups, or a `merge=union` line for events exist; `refs/fgos/legacy` missing or its tree differs from `seal.json.treeOfFgosEvents` |
| `event-store-orphan-branches` | warns per orphan branch stream |

`CHANGELOG.md` gets an `[Unreleased]` entry for the verbs, the config keys, the refspec setup and the removal of tracked event files.

## 22. Support matrix and known limits

- Linux first. macOS follows holder-lock's `flock` driver once the seal crash matrix runs there. Windows has a holder-lock driver now, but the seal crash matrix has not run there, so Windows stays out of this store. Network filesystems are refused.
- One user; lock directories are mode 0700; multi-user permissions are out of scope.
- Unsealed events are lost with the disk or the clone; the window is the seal cadence while fgOS runs, unbounded while nothing runs.
- Cross-machine success is provisional against concurrent events of other stores (section 12); the owner accepted this, and there is no online coordinator.
- An event whose causal predecessor has not been fetched yet is deferred, not folded, and no cursor advances past it (section 12).
- Event Store promises no global prefix across different event sets: a late concurrent event can sort before folded events, and the consumer then replays the affected suffix or rebuilds (sections 12, 15).
- A fresh clone receives no `refs/fgos/*` until setup installs the fetch refspec (section 14).
- SIGKILL tests do not prove power-loss safety; the guarantee rests on `fsync` semantics of the filesystem, reported by doctor.
- A branch rename is not followed by the branch stream key.
- Deleting a machine ref on the remote removes it from other clones at their next pruning fetch; the history then lives only on that machine.
- Erasing a secret that reached a pushed ref needs a history rewrite on every clone; there is no tombstone protocol.
- The chain grows with history, and a range walk does not make that free. In V-REF-01, on a DAG of 100,011 commits, a full `rev-list` took 224 ms and a range `A..B` took 190 ms for 90,011 commits (section 15). Ref-chain snapshot and compaction are a later item, opened when a full rebuild exceeds the budget V-SPAWN-01 fixes for reads. Owner threshold (2026-10-17): open that item when a full rebuild exceeds 2 s on the slowest of the owner's machines.

## 23. Proof gates

These gates, not the text of this spec, confirm or reopen the design. The owner engages no outside experts (decision of 2026-10-17 15:13). Two expertise gaps are handled as agent tasks in 23.1, and the other four stay as gates in 23.2: filesystem crash consistency (item 10), multi-clone reconciliation (item 4), IPC and lock-convoy profiling (item 8), and native addon distribution (item 9).

### 23.1 Before the owner signs section 26 (agent tasks): done

Both tasks ran on 2026-10-17 in run `wf-run-1792224866445-9a03a834`. Their findings are folded into this text (see "Changes after the pre-signature proofs"). Neither one proves the corrections that this fold made. Those corrections are covered by section 23.2.

1. **Model check of reader versus seal (V-C3-MODEL): done.** Report: [experiment-261017-1527-event-store-model-check-reader-seal.md](../../../plans/reports/experiment-261017-1527-event-store-model-check-reader-seal.md).

   Planned scope: a model of `active`, `closed` and the ref, with at least two readers, two seal attempts and one appender, including a `merge` commit of a shared machine id, a promote commit, the coverage walk of section 11 with an origin the reader has never seen, and the in-gate bound of section 11. It had to show that no acked event is lost, that none is counted twice, that every walk terminates, and that coverage never covers an event that was not read.

   Results:
   - The protocol model had 23,990 states and 73,781 edges, and the crash micro-model had 29 states covering 22 phase and crash-kind pairs. Neither lost an acked event, and the reader counted no `h` twice.
   - The Kahn sort of section 12 gave one result in all 36,864 runs: 64 DAGs, times 24 timestamp permutations, times 24 insertion orders.
   - A full walk with a visited set terminated and visited exactly the ancestors on 960 walks, never above V + E pops.
   - The sharing model of two clones on one machine id converged (23 states, one terminal state).

   Against the pre-amendment text it found six counterexamples, each folded in here:
   - C1: `seq` reuse after a rotation crash (section 9 step 4).
   - C2: partial batch exposure (section 9).
   - C3: a cyclic comparator, already replaced by M2 and confirmed (section 12).
   - C4: the coverage stop missing an unknown origin under a merge (section 11).
   - C5: a missing causal predecessor (section 12).
   - C6: an unstable global prefix (sections 12, 15).

   Not proven:
   - The model is finite: two writers with one single-event batch each, one sealer, one reader rather than two, DAGs of four nodes, and distinct timestamps. "Not found" is no proof for larger instances.
   - It is an abstraction in Python BFS, not the planned TLA+ or Alloy model, and not the Rust crate. It reads `active` as a snapshot of complete lines.
   - It assumes `fsync`, durable directory `fsync` of both rename directories, and an atomic, durable CAS.
   - It does not model byte-level corruption, a malicious rewind, git gc bugs, or unbounded network behavior. It does not model the in-gate bound or the placement of promoted events.
   - It checked spec v2 before M1-M4. Neither the amended text nor this fold's corrections were model checked: batch framing, high-water-mark recovery, certified pruning, deferral that holds the cursor, and the incremental condition.
2. **Local git experiment on `refs/fgos/*` (V-REF-01): done.** Report: [experiment-261017-1527-event-store-git-ref-mechanics.md](../../../plans/reports/experiment-261017-1527-event-store-git-ref-mechanics.md).

   Planned scope: a local bare repository as the remote, with no external push and no owner authorization. It covered CAS `update-ref` including a stale old value; CAS and reads after `git pack-refs`; `git gc --prune=now` in the clone and in the bare repository; fetch through the refspec of section 14 into the mirror namespace; a fresh clone; divergence of a shared machine id and its `merge` commit; and the coverage walk over the resulting DAG with its commit count.

   Results:
   - A plumbing seal (`hash-object`, `mktree`, `commit-tree`, `update-ref`) took 9 ms with `.git/index.lock` present. It left `HEAD` and the index unchanged and the work tree dirty, and it ran no hook.
   - Of eight concurrent CAS calls, one won. The seven losers exited non-zero and succeeded after rereading the tip.
   - Refs and objects that only `refs/fgos/*` reached survived `gc`, `gc --prune=now`, `repack -ad` and `pack-refs --all`.
   - A fresh clone had no custom ref, and the default refspec covers only `refs/heads/*`. The explicit refspec fetched into `refs/fgos/remotes/origin/events/*` and created no own ref.
   - A non-fast-forward push was rejected with exit 1. A two-parent merge commit then pushed without force.
   - `rev-list` over 100,011 commits took 27 ms for 10k, 224 ms in full and 190 ms for the range of 90,011.
   - `worktree add`, `stash`, `clean -fdx` and `checkout` left the refs unchanged.

   Not proven:
   - Only a local bare remote was used. Forge acceptance stays section 23.2 item 5 on the owner's real remote.
   - The timings are one wall-clock run on one machine, not a performance threshold.
   - The DAG was built with `fast-import` and timed with `git rev-list`. The section 11 walk with certified pruning did not run, and the number of commits it visits was not counted.
   - The merge commit reused a seal tree, not the `merge` tree that holds only `seal.json`, so the crate's reading of merges and the event contiguity across two divergent sides are unverified.
   - CAS ran only before `pack-refs`, not on a packed ref.
   - `gc` did not run in the bare repository, and no check showed that the objects of an interrupted seal are pruned.

### 23.2 Before acceptance of the implementation

1. **Kill matrix** on the real crate with real holder-lock locks: SIGKILL during append write, after `fsync`, during rotation, between the rotation rename and `hwm.json`, after object write, after `update-ref`, after receipt, after delete. No acked event lost, none doubled, no `seq` assigned twice, recovery automatic on the next trigger.
2. **Reader versus seal stress test:** at least 10,000 real interleavings on the real crate, including `merge` and promote commits, conforming to the model of 23.1 item 1. It must include the regression vectors of the model check:
   - a crash between the rotation rename and `hwm.json` followed by a new append (C1);
   - every byte prefix of a multi-event batch, with no prefix ever folded (C2);
   - an unknown origin under a merge below a covered seal, with a cursor whose coverage came from open logs or a rebuilt receipt (C4).
3. **C1 (V-AUTH-01):** two processes in two worktrees race `moveWork` with the same `expectedStatus`, and two items race the last worker slot: exactly one success each; `settleClaim` behaves as today.
4. **C2 and multi-clone reconciliation (V-SEQ-01).** The test covers:
   - clock rollback, equal timestamps, `seq` across seal and restart, and delayed foreign events;
   - the sort of section 12 gives one sequence for every permutation of its input;
   - a deferred event, whose predecessor sits on a ref not yet fetched, is not folded, no cursor advances past it, and it is emitted once its predecessor arrives (C5);
   - a late concurrent event that sorts before folded events triggers a suffix replay or rebuild, and the result equals a full rebuild (C6);
   - full rebuild and incremental fold give the same view;
   - a rebuild racing gated appends is installed only when current, and stops with `event-store-rebuild-busy` after the bounded attempts (N1);
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

The two pre-signature proofs (section 23.1) are evidence about a finite Python model of the pre-amendment text and about git on a local bare repository, with the limits listed there. They say nothing about the Rust crate or about a forge, and they do not cover the corrections that this text made after them.

## 25. Out of scope

SQLite WAL and multi-process SQLite semantics: the view is a consumer cache, so whichever engine a consumer picks is that consumer's concern. Red-team round 2 proposed adding this expertise, and it does not apply to the store. This stays a dissent (see "Unresolved dissent"). It becomes required when a consumer folds into SQLite inside the Work gate. Also out: a dedicated scheduler or daemon, Windows, network filesystems, multi-user permissions, hard deletion, ref-chain compaction, removing the `.fgos` strip, and an online cross-machine coordinator.

Outside expertise: the owner engages none (decision of 2026-10-17 15:13). The six gaps the councils named are covered as follows:

| Gap | Covered by |
|---|---|
| Formal model checking of the reader-versus-seal protocol | 23.1 item 1, agent task, before the signature (done) |
| Git internals: ref transactions, packed refs, gc and prune of custom namespaces, commit-DAG traversal | 23.1 item 2, agent task, before the signature (done) |
| Filesystem crash consistency and `fsync` across ext4, APFS, NTFS and WSL2 | 23.2 item 10 |
| Multi-clone reconciliation for event reducers | 23.2 item 4 |
| IPC profiling and lock-convoy dynamics under 15 to 20 sessions | 23.2 item 8 |
| N-API distribution across platforms and Node ABIs | 23.2 item 9 |

## 26. Decision record

**D-ADR0055 (signed by the owner 2026-10-17, decision log seq 65) — Event truth is sealed changesets as git objects on per-machine refs.** An event is acknowledged when it is `fsync`ed in the store's open log outside the work tree, and becomes git truth when sealed, by compare-and-swap, into a commit on `refs/fgos/events/<machine-id>`; machines share by pushing the own ref and fetching the others; every view is a rebuildable cache. Supersedes L3 clause 1 ("truth = changeset JSONL committed in git, appended in the same transaction as the mutation") and clause 4 ("every write through one CLI door, single writer") of D-ID `ae461c8b`, and the data layout of D-ADR0003 (tracked `events.jsonl`, gitignored `state.json`). L3 clauses 2 and 3 (database is a view, graph store is a second-level view) stand. Review threshold: a recorded cross-machine conflict that a person had to resolve by hand more than once a month, or any acknowledged event lost while fgOS was running.

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

## Changes after the pre-signature proofs (2026-10-17)

The model check ran against spec v2 before the amendment above. Each counterexample was checked against the amended text and fixed only where that text did not already fix it.

1. **C1, `seq` reuse after a crash between the rotation rename and `hwm.json`: not fixed before, fixed now (sections 8, 9, 10).**
   - Before assigning a `seq`, append recovers the high-water mark under `event-append`, from the durable receipt `sealed.json`, every closed segment, `hwm.json` and the committed part of `active`, with no git call. A conflict refuses the append with `event-store-seq-recovery-conflict`, and the next seal rebuilds a lost receipt.
   - `sealed.json` is now written durably before any delete.
   - Rotation fsyncs both directories.
   - Two crash-table rows were added.
2. **C2, partial batch exposure: not fixed before, fixed now (sections 6, 8, 9, 10, 11).**
   - A batch is closed by a canonical `batch-commit` marker in the same `write`, made durable by the ack `fsync`.
   - Readers fold only batches that a marker closes, and recovery drops everything after the last valid marker.
   - Framing was chosen over dropping the all-or-nothing promise, because a Work batch is one settlement unit.
3. **C3, cyclic comparator: fixed by M2, confirmed (section 12).** One sentence was added: a cycle is the corruption `event-store-order-cycle` and is never broken by dropping an edge.
4. **C4, coverage stop with an unknown origin under a merge: partly fixed before, fixed now (sections 10, 11).** The walk prunes only at certified commits, which a complete walk processed with all their ancestors, and otherwise walks to the roots. Coverage selects lines to fold and never prunes. The chain invariant no longer justifies pruning. The walk stays outside the Work gate.
5. **C5, missing causal predecessor: partly fixed before, fixed now (sections 11, 12, 15).** Dependents are held. The missing predecessor is reported. No coverage or cursor advances past a deferred event. A walk that leaves deferred events certifies nothing. A deferred event is incomplete data, not corruption.
6. **C6, late concurrent event sorting earlier: partly fixed before, fixed now (sections 12, 13, 15, 22).**
   - "Incremental fold equals the sort" is restricted to own-stream appends under the gate, folded into the view they were decided on, with no foreign or deferred event added, and the reader checks the condition.
   - The cursor is coverage, not an offset, and no global prefix is promised between different event sets.
   - Consumers replay the affected suffix or rebuild.
7. **V-REF-01 (sections 10, 14, 15, 21, 22).**
   - A failed CAS returns non-zero, and the caller rereads the tip before each retry.
   - A default clone or fetch carries only `refs/heads/*`, and setup installs `+refs/fgos/events/*:refs/fgos/remotes/<remote>/events/*` before readers expect mirrors.
   - Sync pushes only the own ref, and a non-fast-forward push converges by a two-parent merge, never by force.
   - Refs and objects reachable only from `refs/fgos/*` survive `gc`, `gc --prune=now`, `repack -ad` and `pack-refs`.
   - Forge acceptance stays an acceptance gate on the owner's real remote.
   - A range walk still traverses the needed reachable part (224 ms in full, 190 ms for the range), so snapshot and compaction stay the follow-up.
   - The mirror namespace is now `refs/fgos/remotes/<remote>/...`, the one that was tested.
8. **Proof gates (sections 23, 24, 25).** Section 23.1 is marked done, with links, results and what each proof did not prove: a finite model, a Python abstraction of the pre-amendment text, and a local remote only. Section 23.2 items 1, 2 and 4 gained the regression vectors for C1, C2, C4, C5 and C6.
9. **Header, introduction, open item 1 and a factual note on the last dissent** were updated to say that the proofs ran.

## Open for the owner

Nothing in this spec is open for the owner. Signed on 2026-10-17 as D-ADR0055, with these confirmations: machine id owned by Event Store until a machine-identity component exists; non-git directories refused (to be reopened when a real non-git project needs fgOS); the porting store writes its own `project`-scope stream, never Work's; `eventStore.sync.intervalSec` 300 with opportunistic push; compaction opened when a full rebuild exceeds 2 s on the slowest machine. Earlier answers (15:13): cross-machine provisional success accepted, Node-to-Rust route N-API with no exec-guard exception, loss budget and seal cadence as written, no outside experts. The re-cut of 4.3-S and the claim-path item belong to the program board.

## Unresolved dissent

These positions came from the reopen council and are still not settled by evidence. They are recorded so that they are not lost.

- **Git component as a precondition.** The critic of council 2 holds that publication should wait for the Git component. This spec puts a crate-internal driver behind a port and moves it later (section 20).
- **Lock grain.** Panelist 3 proposes an entity-level mutex. This spec keeps one project Work gate per clone. V-SPAWN-01 cannot tell the two apart, because its tail is the `main-checkout` wait, not `state`.
- **SQLite expertise.** Both red-team rounds want multi-process SQLite WAL expertise in the core review. This spec keeps it out of scope because Work's view is `state.json` (section 15), and it becomes required when a consumer folds into SQLite inside the Work gate (section 25).
- **Design impact of the commit DAG.** Red-team revisit round 1 sees a shift to a distributed DAG that hides major protocol complexity. This spec treats it as a bounded definition (section 11) on a chain that promote commits had already made a DAG. The model check of 23.1 item 1 settles the question. Note added after the proofs: the model check has run. It found the full walk with a visited set finite and complete, and it found the coverage stop unsafe (C4), which section 11 now replaces with pruning at certified commits. Whether the DAG hides further complexity stays open until section 23.2 item 2 runs on the corrected rules.

## Changes after the corrected model check (2026-10-17)

The model check was run again on the corrected rules ([report](../../../plans/reports/experiment-261017-1545-event-store-model-recheck-corrected.md)). All six earlier counterexamples are gone within its bounds. It found one progress gap and one ambiguity, both fixed here:

1. **N1, rebuild-install livelock (section 13, 23.2).** Under sustained writes a rebuild computed outside the gate can be rejected forever. Retries are now bounded by `eventStore.rebuild.maxAttempts` (agent default 5) and end in `event-store-rebuild-busy` with the current cache kept valid.
2. **Certification of a new seal (section 10 step 2.4).** The receipt keeps `lastSeq` apart from emitted coverage, and `<new>` is certified only when it and its ancestors are fully emitted with nothing deferred, matching sections 11 and 12.

## Changes with the Git G0 signature (2026-10-18)

Amended 2026-10-18 with the Git G0 signature: publication port moves to Git, combined addon (Git G0 Q1); no protocol change.

1. **Publication port (header, sections 3, 4, 20).** The port for `refs/fgos/*` is the Git component's Publication port (`docs/platform/git/spec.md` section 4), not a driver inside the crate. Event Store stays the only production writer of event refs and calls that port; it keeps every decision of sections 10 and 14.
2. **Combined addon (header, sections 17, 21).** The Node route is the one combined N-API addon that links `fgos-event-store` and `fgos-git` (Git G0 owner decision Q1, 2026-10-17). There is still no exception to the exec guard and no per-call host facade; `event-store-native-addon` checks the combined addon.
3. **Unchanged.** No protocol step, lock row, lock rank or decision of D-ADR0055 changes. The dissent "Git component as a precondition" is answered in placement only: publication runs through the Git port, and the Event Store cutover follows the order of Git spec section 12.

## Changes with the phase 05 review (2026-10-18)

Amended 2026-10-18 with the phase 05 sharing and sync review; no lock row, rank or decision of D-ADR0055 changes.

1. **Section 14.** Authenticated reconciliation (exact prior and candidate authorized before the CAS), per-mirror verification (foreign failure is a typed warning, own-id failure refuses), certified sync positions, and the clone-wide tracked-fence authority resolved through the trusted main checkout.
2. **Git.** The no-op fetch-mapping setup records the effect-free `configApproved` outcome (Git spec section 10 rule 4c).
