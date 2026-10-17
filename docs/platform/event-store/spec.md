# Event Store Component Specification

```txt
Document type: BA-grade area specification
Audience: Human reviewer, maintainer, implementation agent
Purpose: Define the single authority for durable, mergeable, append-only event truth shared by every fgOS domain
Design status: Draft, pending architecture council review
Implementation status: Not started
Canonical: No (becomes canonical when accepted)
Owner: Event Store component
Source (planned): packages/event-store/rust (crate fgos-event-store), Node facade src/event-store/
Contracts (planned): packages/event-store/contracts/
Last reviewed: 2026-10-17
Supersedes on acceptance: L3 wording in docs/platform-foundations.md (D-ID ae461c8b); D-ADR0003 data layout ("events.jsonl = truth committed, state.json = view gitignored")
Related:
- docs/platform-foundations.md (L1, L3, L7)
- docs/platform/holder-lock/spec.md
- docs/platform/session-identity/spec.md
- docs/platform/component-boundary.md
- plans/reports/research-261017-1102-fgos-event-store-drift-history.md
- plans/reports/investigation-261017-1027-fgos-event-store-git-coupling.md
- plans/reports/council-261017-1210-event-store-final-packet.md
- plans/reports/experiment-261017-1220-event-store-exp1-relocate-open-shards.md
- plans/reports/experiment-261017-1220-event-store-exp2-seal-first-merge-crash.md
- plans/reports/research-261017-1032-git-lessons-catalogue.md
- plans/261016-1306-main-checkout-single-door-hot-lock/plan.md
```

## 1. Purpose

Event Store owns one decision: **how an event becomes durable truth, how that truth is published to git, and how it is read back**, for any entity of any domain. Work is the first consumer; decisions, porting and observe are later ones.

It keeps the part of L3 that held up (truth is replayable JSONL, any database is a rebuildable view) and replaces the part that drifted: where truth lives while it is still being written. Truth that is still open lives outside the git work tree; only sealed, immutable, content-addressed files are committed. Merging two branches therefore only adds files and cannot conflict on events.

Owner decisions recorded 2026-10-17 that this spec implements:

| # | Decision |
|---|---|
| O1 | Direction B ("seal first", the upstream repository-harness model), not a second operational database |
| O2 | The database used while working is a cache view rebuilt from JSON; JSON stays the final, git-tracked truth |
| O3 | Claims and leases are runtime state, outside the event store |
| O4 | Hybrid publication: each stream type declares one scope, `project`, `branch` or `local` |
| O5 | Work uses scope `project` (publish to main; every worktree sees new events at once) |
| O6 | The core is a Rust component shared by the whole system; domain reducers stay with their consumer |
| O7 | Seal cadence default: on a lifecycle event, else every 5 minutes when something is unsealed, else at clean writer exit |

## 2. Ownership boundary

| Owns | Does not own |
|---|---|
| The event envelope, canonical serialization and content hash | What an event means; reducers and views of each domain |
| The stream-type registry: who may write a type and its publication scope | Which domain owns which type (the consumer registers it) |
| Open shards: location, append, fsync, per-writer serialization | Git commits and refs (Git component; until it exists, the main door checkpoint adapter of plan 4.3) |
| Sealing: snapshot, sealed file name and layout, the seal protocol and its recovery | Locks as a mechanism (holder-lock); Event Store only declares which locks it takes |
| Replay: discovery of sealed and open shards, hash verification, dedupe, deterministic order | Claims, leases, worker slots (runtime state) |
| Seal cadence, the doctor checks of this section, the migration from the legacy layout | Writer identity (Session Identity); state root (holder-lock section 11) |

There is one implementation of the core: the Rust crate `fgos-event-store`. Node calls it through the facade `src/event-store/`, which decides nothing. Observe and other Rust components link the crate directly.

## 3. Layering

```text
consumers (Work, decisions, porting, observe ...)   register stream types, own reducers and views
        |  append(type, entityId, payload) / replay(scope, filter) / seal(scope)
Event Store (fgos-event-store)                       envelope, shards, seal, replay, recovery
        |                     |                       |
holder-lock (per-writer      Session Identity        publication port:
 lock, main door)            (writer id)              project -> Git commit on main
                                                      branch  -> Git commit on the worktree branch
                                                      local   -> none
```

Event Store never imports a consumer. A consumer never writes a shard or a sealed file itself. The publication port is the only place that calls git, and it does so through the Git component's operation (or, before that component exists, through the checkpoint adapter that plan 4.3 attaches to the main door).

## 4. Envelope

One event is one JSON line. The envelope keeps today's fields so existing readers keep working, and adds the stream fields:

| Field | Meaning |
|---|---|
| `v` | Envelope version (4 for this spec; 3 is the legacy shape, read unchanged) |
| `type` | Stream type, `<domain>.<name>` (e.g. `work.move`); registered (section 5) |
| `stream` | Entity key, `<entityType>:<entityId>` (e.g. `work:tsk-5k4`) |
| `ts` | Writer wall-clock time, ISO 8601, informational only |
| `src` | Writer id from Session Identity |
| `seq` | Per-writer monotonic counter inside one open shard lineage |
| `payload` | Domain data, opaque to the store |
| `schemaVersion` | Payload version declared by the consumer |
| `h` | SHA-256 of the canonical line without `h` (full 64 hex; the legacy 16-hex `h` stays valid for v3 lines) |

Canonical serialization: keys sorted, no insignificant whitespace, UTF-8, one trailing newline. `h` is the event identity: two events with the same `h` are the same event, wherever they were written.

## 5. Stream-type registry

A consumer registers each type once, in a versioned contract file of its own package, with:

- `type`, owning domain, payload `schemaVersion`;
- `scope`: exactly one of `project`, `branch`, `local`;
- `conflictRule` for the reducer: `append-only` (every event counts), `last-writer` (order of section 8 decides) or `cas` (the payload carries the expected prior state and the reducer rejects a mismatch as a recorded conflict, never silently).

Rules:

1. A type has one scope for its whole life. Changing it is a new type.
2. Shared truth is `project` only. Anything another session must see or rely on (item status, answers, decisions, approvals, land results) may not be `branch`, because an abandoned branch would leave the shared board wrong.
3. References go one way: a `branch` event may name a `project` entity; a `project` event never points into `branch` content.
4. An append of an unregistered type is refused.

## 6. Scopes and locations

| Scope | Open shard location | Sealed into | Visible to |
|---|---|---|---|
| `project` | `<open-root>/project/<writerId>.jsonl`, shared by every worktree of the clone | a commit on the trunk of the main checkout | every session at once (open) and every clone after push (sealed) |
| `branch` | `<open-root>/branch/<worktree-key>/<writerId>.jsonl` | a commit on the worktree's own branch | that worktree; main after the branch is merged; lost with an abandoned branch, by design |
| `local` | `<open-root>/local/<writerId>.jsonl` | never | that machine |

`<open-root>` is resolved by one storage-location port:

1. `FGOS_EVENT_OPEN_ROOT` when set (tests, unusual topologies).
2. `<git-common-dir>/fgos/open` of the project, resolved with `git rev-parse --path-format=absolute --git-common-dir` (needs git 2.31; doctor checks the version).
3. When the project is not a git repository: `<stateRoot>/projects/<project-key>/open` (holder-lock section 11), and the store refuses `project` and `branch` sealing until a repository exists.

The resolved root is recorded in `<open-root>/root.json` on first use. A later resolution that differs (for example `git init` after the first write) is refused with `open-root-moved` until doctor migrates the shards; the store never writes the same scope to two roots.

Bare repositories, `--separate-git-dir` and submodules resolve through the same rule; each is a fixture in the conformance vectors (section 14) before the store claims support.

## 7. Write and seal protocol

This is the protocol proven by experiment 2 (100/100 SIGKILL recoveries over five step boundaries, 20/20 append-versus-seal races, zero merge conflicts in two- and three-way merges), stated as invariants.

**Append** (one writer, one open shard per scope):

1. Take the per-writer lock `event-open--<scope>--<writerId>` (holder-lock, kind `mutex`, rank below every repo lock).
2. Canonicalize, compute `h`, append one line, `fsync` the file (and the directory when the file was created).
3. Release. The event is durable on this machine from here on. This is the ack point of an append.

**Seal** (same lock as append, so append and seal of one writer never interleave):

1. Snapshot the open shard as a byte prefix ending at the last newline; a torn trailing line is left for the writer.
2. Compute the SHA-256 of the prefix; the sealed name is `<sha256>.jsonl`.
3. Write `.fgos/events/.<sha256>.<pid>.tmp` in the target tree, `fsync` file and directory, rename to `.fgos/events/<sha256>.jsonl`, `fsync` the directory. Temp and final are in one directory, so the rename never crosses a filesystem.
4. Publish through the port: stage exactly that path and commit it (project: on the trunk under the main door; branch: on the worktree branch). The commit only adds files.
5. Only after the commit is confirmed: check the open shard still starts with the snapshot bytes and atomically replace it with the remaining suffix. Never truncate before publication.

**Recovery** (run by the next append or seal of that writer, and by doctor for writers that are gone):

- A `*.tmp` file is never truth; remove it.
- A sealed file whose name already exists is skipped (content addressing makes re-seal idempotent).
- A sealed file that exists but is not yet committed is committed.
- A committed sealed file whose bytes are still the prefix of the open shard is cut from the open shard.
- An open shard whose writer is dead (holder-lock `probe` free and Session Identity no longer live) is sealed by the recovering process under that writer's lock.

**Invariants:** the open shard is the recovery source until publication; a sealed path is a pure function of its bytes; a sealed file never changes; truncation removes only a proven, published prefix; replay is a set union by `h`.

Sealed files are never deleted on a feature branch. Correction is a new event. Compaction (section 10) is the only way old sealed files go away, and it runs on the trunk at a maintenance boundary.

## 8. Replay and views

`replay(scope set, filter)` reads, in this order of discovery: sealed files of the trunk tree (and, for a worktree view, of its branch tree), then every open shard of the requested scopes. It verifies each `h`, drops duplicates by `h`, and orders events deterministically by `(ts, src, seq, h)`. A reducer that needs a stronger order declares `conflictRule: cas` and receives the conflict as an event, never a silent overwrite.

Views:

- The view of the main checkout is `project` sealed on the trunk plus every `project` open shard.
- The view of a worktree is the main view plus its own `branch` stream.
- A view is a cache owned by its consumer (today `.fgos/cache/state.json` for Work), rebuildable from zero by replay, never committed, never read as truth. The consumer may choose another engine (SQLite included) without touching this spec, as long as it stays rebuildable.
- A reader never reads a worktree's checked-out copy of `.fgos/` as truth; it asks the store, which resolves the trunk tree of the main checkout and the open root.

## 9. Seal cadence

Default policy (owner decision O7), configurable:

| Trigger | Default |
|---|---|
| A lifecycle event of a registered type marked `sealOnWrite` (Work: status move, answer, decision, approval, land result) | seal right after the append |
| Unsealed events older than `eventStore.seal.intervalSec` | 300 seconds |
| Clean writer exit | seal |
| Dead writer found by recovery or doctor | seal on its behalf |

When the trunk is not committable (the main checkout is mid-merge, on another branch or the main door is busy past its wait), the seal is deferred to the next trigger; events stay durable in the open shard. Doctor reports the age of the oldest unsealed event.

Expected load: about 165 Work events a day today, so a few dozen small add-only commits a day, each holding the main door for one commit.

## 10. Growth and compaction

Replay grows with history. Compaction is part of this component but ships after the core:

- It runs on the trunk only, under the main door, at a maintenance boundary.
- It writes a snapshot file (content-addressed, with the set of `h` it covers) and a manifest, commits them, and only then removes the sealed files the snapshot covers.
- Branches made before the compaction still merge cleanly: their sealed files are either new (kept) or already covered by the snapshot (dedupe by `h`).

`src/state/events-compaction.mjs` exists today without a production caller; it is not reused unless it meets these rules.

## 11. What this removes

Each item is deleted in the same change that makes it unnecessary (One Door):

| Mechanism | Why it goes |
|---|---|
| Appending to tracked shards in the main work tree | Open shards move outside the tree |
| `.fgos/events/*.jsonl merge=union` in `.gitattributes` | Sealed files are unique, immutable names; merge only adds |
| `events-jsonl-truncation-guard.mjs` (truncation detection, fallback checkpoint) | No tracked file is ever appended; the seal protocol replaces the checkpoint |
| `fgos-write-rejected` restore and self-heal for event shards | Branches never carry `project` events |
| Global `events.lock` for appends | Per-writer lock; writers never contend with each other |
| Stripping `.fgos` from worktrees to protect the event log | Readers resolve truth through the store; a stale checked-out copy is harmless. Kept only if another reason survives review |
| Tracked `.fgos/state.json` (stale since 2026-09-18) and `.fgos/events.jsonl.backup-*` | Views are never committed; backups are not truth |

`.fgos/events.jsonl` (frozen baseline) and the existing 90 writer-named shards become legacy sealed truth: read by replay, never appended again, removable only by compaction.

## 12. Migration (stop everything, once)

Following the holder-lock cutover pattern (stop every fgOS writer, fence, switch, verify):

1. Stop every writer of the project (quiesce scan).
2. Seal every legacy shard as is: no rewrite; they are already committed; mark them legacy in the manifest.
3. Remove the tracked stale view and backups; remove `merge=union` for events.
4. Switch the facade to the store; the first append creates the open root and `root.json`.
5. Replay old plus new and compare the rebuilt Work view with the pre-cutover view byte for byte (same reducer).
6. Doctor green, then resume writers.

Rollback before step 5 is reverting the commit; after writers resume, rollback means sealing the new open shards and pointing the facade back, since sealed files are valid legacy input.

## 13. Setup, doctor and configuration

Registered in `fgos setup` config-merge and the doctor registry:

| Item | Kind |
|---|---|
| `eventStore.seal.intervalSec` (default 300) | config key |
| `eventStore.openRoot` (optional override of section 6) | config key |
| `event-store-open-root` | doctor: root resolves, matches `root.json`, filesystem supports atomic rename and directory fsync (guarantee level reported) |
| `event-store-unsealed-age` | doctor: age of the oldest unsealed `project` event versus the interval |
| `event-store-orphans` | doctor: open shards of dead writers, leftover temp files; `--fix` seals and cleans |
| `event-store-sealed-integrity` | doctor: every sealed file's name equals the hash of its bytes; every line's `h` verifies |
| `event-store-legacy-layout` | doctor: no tracked view or backup files, no `merge=union` for events after cutover |
| `git-version` | doctor: git 2.31 or newer when the store uses the git common dir |

## 14. Proof required before acceptance of the implementation

- The experiment 2 scenarios as tests on the real crate: two- and three-way merges with zero conflicts; SIGKILL at temp write, fsync, rename, stage, commit, and after commit before truncate; append racing seal; the same event sealed twice.
- Topology vectors for the storage-location port: plain repo, linked worktree, worktree on another filesystem, `--separate-git-dir`, bare, submodule, non-git directory, `git init` after first write.
- Seal deferral when the trunk is not committable, and recovery on the next trigger.
- Replay of the full legacy history producing the same Work view as today.
- Facade cost: latency of one append through the Node facade measured on the hot Work paths (claim, move, approve); a batch append API if one call per event is too slow.

## 15. Relations to other work

- **Plan 4.3.** Its repo-lock part proceeds as planned with the checkpoint as an optional, detachable adapter (fence in the plan). Under this spec that adapter becomes the `project` publication port. Its state part changes: `events.lock` as a shared append mutex is no longer needed, so P01 (hot-lock core) and P02/P04 are re-cut around claims (runtime, O3) only. The `pidNs` requirement for hot records from plan 6.2 still applies to whatever hot locks remain.
- **Git component.** Owns the commit used by the publication port and the land operation. A `branch`-scope consumer plugs "seal before land" into land as a consumer policy, like the Iron Law gate (catalogue G-234). About 40 catalogue entries about `.fgos` events (merge union, truncation, append-versus-stage races, write-rejected) are retired by this spec instead of being ported to Rust; the exact list is part of the acceptance review.
- **Observe.** Reads Work events today through `fgos-work-state` from `.fgos/events*.jsonl`; it moves to `replay` of the crate. Its own store becomes a `local` stream later.
- **Porting store.** A later consumer; its separate `events.jsonl` and `state.json` converge on this component in a separate change.

## 16. Open questions for the council

1. Ack point for a Work mutation: after the open-shard fsync (this spec) or only after sealing? The spec chooses fsync, because waiting for a git commit would bring back the slowness this design removes.
2. Several writers sealing `project` events at once all commit on the trunk under the main door: is one commit per seal acceptable, or should the publication port batch seals of all writers?
3. Is the git common dir the right default open root, or the machine state root keyed by project, given that deleting a clone deletes its unsealed events?
4. Deterministic order `(ts, src, seq, h)` uses writer clocks; is that enough for Work's reducers, or must some types declare `cas`?
5. Does the strip of `.fgos` in worktrees have any reason left after this change?
6. Batch append through the facade: required from day one or only after measurement?
