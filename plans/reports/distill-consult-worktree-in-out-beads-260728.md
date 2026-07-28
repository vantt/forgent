# Beads Consult: Fork/Isolate, Merge-Back, Event-Source Sync

Research task: How beads solves (or explicitly avoids) the forgentX worktree-fork pain — race-condition misses uncommitted state, merge-back ambiguity.

Source: `/home/vantt/projects/forgentX/docs/distillery/sources/beads.md` (index analyzed 2026-07-14, commit 777d24b87).

---

## 1. Fork/Isolate

**beads does NOT use worktree-per-item isolation.**

Under domain `context-memory`, slug `dolt-as-versioned-truth`:

> "Concurrency chuyển từ **branch-per-worker sang all-on-main + transaction discipline** (engdocs/design); 3-phase commit (mutation → PostWriteCommit → PostWritePush)"

Explicit pivot: beads moved AWAY from branch-per-worker isolation toward centralized Dolt database with transactional writes. No worktree fork per work item. All agents write to the same canonical Dolt store (`.beads/dolt/`, gitignored).

Bootstrap mechanism: implicit pull-before-start. Agents invoke `bd dolt pull` to fetch current state from canonical Dolt before processing. There is no bootstrap copy; there is no fork.

Failure mode avoidance: The "fork before uncommitted write landed" race does not exist because there is no fork. Concurrency is serialized at the transaction layer, not namespace-isolated at the filesystem level. Dolt's versioned-DB model (versioning built into the store, not delegated to git) provides multi-writer safety.

Reinforcing evidence under `workflow` domain, slug `formula-molecule-lifecycle`:

> "workflow đang chạy KHÔNG phải state riêng mà là issues có cấu trúc"

Workflow state lives IN the graph as structured issues, not in separate ephemeral isolation. Beads chose centralized graph-as-truth over forked workspace isolation.

---

## 2. Merge-Back / Write Reconciliation

Mechanism: 3-phase commit protocol + Dolt native sync.

Under domain `context-memory`, slug `dolt-as-versioned-truth`:

> "3-phase commit (mutation → PostWriteCommit → PostWritePush); sync qua `bd dolt push/pull` (Dolt native chứ không git)"

Three explicit phases:
1. Mutate (agent writes to local Dolt transaction)
2. PostWriteCommit (commit transaction to local Dolt)
3. PostWritePush (push to canonical Dolt store)

Sync uses native Dolt commands (`bd dolt push/pull`), not git merges. Dolt handles concurrent writes natively as a versioned database. No manual merge-conflict resolution — Dolt's transaction layer enforces serialization. Conflicts are impossible because writes serialize at the DB transaction boundary.

Coordination primitive under `orchestration` domain, slug `multiagent-routing-and-slots`:

> "Coordination primitives: assign, atomic claim, **merge slots**"

"Merge slots" are mentioned as a coordination term. The file does not elaborate the slot internals, but the concrete sync mechanism backing all coordination is the Dolt 3-phase commit. Slots enable bounded queuing of concurrent work; the store handles serialization.

---

## 3. Event-Source / Log Sync

**Not covered as a separate append-only log.**

The file mentions event concepts but models them as first-class graph nodes, not as a side-channel log file (like fgOS's `.fgos/events.jsonl`).

Under `orchestration` domain, slug `gate-beads-event-driven`:

> "sự kiện ngoài thỏa → gate mở → downstream ready. Issue types mở rộng cả `message`, `event`, `role`"

Events are ISSUE TYPES — first-class graph nodes, not logs. External events (PR merged, CI run complete, timer) trigger gates (workflow pause nodes); the gate opening allows downstream ready queries.

Under `context-memory` domain, slug `llm-tier-compaction`:

> "title/labels/events giữ nguyên"

Events are preserved as fields within issue state during memory compaction. They are not a separate append-only log.

**Why no separate event log:** Beads avoids the fork/merge sync problem for events entirely by storing events IN the canonical Dolt store as part of issue records. No fork = no fork/merge sync problem for events. No parallel log file that needs to stay consistent across worktree boundaries or concurrent writers. One source of truth (Dolt) contains everything.

---

## Different/Better Than Worktree-Per-Item

### 1. All-on-main transaction discipline (not branch-per-item)

Eliminates the "fork before uncommitted write" race entirely by design. There is no fork. Dolt's versioned-DB model (versioning built into the store, not delegated to git) gives multi-writer safety without branching logic.

forgentX must fork a worktree per item to isolate work. Beads avoids this: all agents write to the same canonical store, serialized by transaction discipline. No race on fork timing.

### 2. Dolt replaces git as version control

Workflow state, memory, and events all live in one queryable store with native concurrency. No context split between git branches (worktree) and separate JSON logs (.fgos/events.jsonl).

One source of truth, transactionally protected. forgentX splits state across git branches and JSON logs; merge-back must reconcile both.

### 3. Memory lives in the graph (not separate)

`bd remember`/`bd prime` store memory as beads (issues) in the same Dolt store, queryable with the same tools as tasks. Eliminates need for separate memory sync across fork boundaries.

forgentX would need to sync memory separately across a forked worktree. Beads avoids this by making memory part of the task graph itself.

### 4. Gate as graph node (not async file signal)

Workflow pause/coordination are issue types, not separate files (`signal` + `pause_reason`). Everything is the graph — query unified, sync unified.

forgentX uses file-based signaling (async-gate). Beads uses graph structure. Simpler: one query model, one store, one sync protocol.

### 5. 3-phase commit protocol is explicit

Unlike git merge (which is implicit, client-side, lossy), beads protocol is (mutation → PostWriteCommit → PostWritePush) — observable phases, no silent conflicts.

forgentX relies on git merge semantics when merging a completed worktree branch back to main. Silent conflicts are possible. Beads makes the protocol explicit and inspectable.

### Risk Trade-Off

Beads trades git-diffable state for DB-native concurrency.

**Gain:** no worktree fork races, no merge-back ambiguity, one queryable source.

**Loss:** state is opaque to `grep`/`git log`, requires Dolt CLI to inspect historical branches. Cannot audit changes in `git diff` — audit is within Dolt, not in git history. Developers must trust Dolt's versioning and use `bd` commands, not git commands, for state inspection.

forgentX keeps state in git (human-readable, can audit with `git log`, can inspect diffs). Cost: fork/merge races, state split across files and branches.

---

## Unresolved Questions

1. How exactly does "merge slots" work as a coordination primitive? The file names it but doesn't detail the mechanism.
2. Does Dolt's transaction layer guarantee linearizability across multiple concurrent agents, or eventual consistency? The file says "transaction discipline" but doesn't specify the consistency model.
3. What is the rollback strategy if PostWritePush fails (push succeeds to Dolt remote but agent crashes before acknowledging)? Is idempotency enforced in the 3-phase protocol?
4. How does beads handle Dolt schema evolution while agents are writing? Does the versioned-DB model allow zero-downtime migrations?
