# Workspace Topology Roadmap

**Status:** Planning companion for [workspace-topology.md](workspace-topology.md).
**Date:** 2026-09-04.

This roadmap sequences the decisions and migration work required to make
workspace topology enforceable. It is not the contract; the contract is
[workspace-topology.md](workspace-topology.md). Evidence lives in
[workspace-topology-audit.md](workspace-topology-audit.md).

## Hard Gates Before Distribution Activation Planning

These must be settled before `fgctl` activation and Rust `fgos` migration are
planned in detail.

1. Durable work-history placement.
2. Config/workspace policy scope.
3. Runtime coordination namespace.
4. Activation binding cardinality.
5. Projection ownership for skills, agents, prose, hooks, and managed files.

## Recommended Decisions

### D1. Hot Work History Leaves The Tracked Working Tree

Recommended shape:

```txt
hot event writes -> <main-checkout-root>/.fgos/local/work-state/<workStateId>/active-events/
sealed checkpoints -> <workspace-root>/.fgos/history/checkpoints/
```

Reason:

- hot events should not dirty main;
- fgOS does not write arbitrary state into Git's private `.git` structure;
- Git remains backup/sync/audit through immutable checkpoint segments;
- fresh clone can import checkpoints and create local hot state;
- multi-machine reconciliation can be explicit and idempotent.

Checkpoint segment requirements:

- immutable file;
- sequence range;
- predecessor digest;
- segment digest;
- event identity/content hash;
- idempotent import;
- no rewrite in place.

### D2. Workspace Policy Is Branch/Workspace Scoped

`.fgos/config.json`, `.fgos/distribution.json`, and domain policy are
`workspacePolicy`.

Rules:

- local execution reads policy from the current `workspaceId`;
- work-state/machine settings must not hide inside branch policy unless the key
  declares that layer;
- a worker can test policy changes before merge;
- repair must not silently retarget from worker to main.

### D3. Runtime Coordination Gets Its Own Root

Claims, sessions, assignment claims, locks, and runtime leases move conceptually
under `runtimeCoordinationRoot`, not packaging's runtime payload namespace.

Rules:

- coordination records declare `workStateId`;
- workspace-specific coordination also declares `workspaceId`;
- liveness records use fencing token, boot/process identity, heartbeat, and
  explicit completion-unknown recovery.

### D4. Activation Binding Is Workspace-Scoped

Release payloads are shared by digest on the machine. Activation bindings are
per `workspaceId`.

Rules:

- two worktrees may bind different runtime digests;
- mutating the same `workStateId` requires writer compatibility;
- `fgctl` publishes only ready activation bindings;
- candidate runtime preparation must happen before ready publication.

### D5. Projections Are Workspace-Scoped And Ledgered

Skills, agents, prose, hooks, and generated host files are materialized by local
`fgos init` / `fgos doctor --fix`, not written directly by `fgctl`.

Rules:

- projection ledger is per `workspaceId`;
- each path is `generated-owned`, `managed-block`, `source-owned`, or
  `coexistence-refuse`;
- dogfood/source checkout must be cleanly separable from installed workshop
  projections.

## Migration Slices

### T0. Document Contract Lock

Deliverables:

- close durable history decision;
- finalize `workspace-topology.md`;
- mark audit/roadmap as companion docs;
- update packaging docs to depend on topology.

Proof:

- a new engineer can answer root/capability choice for each operation without
  reading chat history.

### T1. Topology Resolver Skeleton

Deliverables:

- implement a read-only `resolveTopology()` returning identities and typed roots;
- support Git main checkout, linked worktree, and non-Git workspace;
- no behavior migration yet.

Proof:

- fixture tests for main, linked worktree, symlink path, fresh clone-like
  workspace, non-Git directory.

### T2. Config Scope Enforcement

Deliverables:

- classify existing config keys;
- update config readers to consume `TopologyContext`;
- prevent silent main fallback for workspace policy reads.

Proof:

- worker branch config edit is read by worker operation and does not edit main.

### T3. Runtime Coordination Root Split

Deliverables:

- move conceptual claim/session/assignment/lease resolution behind
  `runtimeCoordinationRoot`;
- do not use packaging runtime namespace for claims;
- add lease identity fields required by the contract.

Proof:

- linked worktrees share intended coordination state; corrupt/ambiguous leases
  fail closed.

### T4. Hot History Relocation

Deliverables:

- move hot event writes out of tracked workspace tree;
- keep import/replay from existing `.fgos/events.jsonl` and `.fgos/events/`;
- introduce sealed checkpoint writer/reader.

Proof:

- submit/return/pick mutate work history without dirtying main;
- old tracked event history remains readable.

### T5. Workspace Activation Binding

Deliverables:

- shared machine release store;
- per-workspace activation binding;
- runtime compatibility check against `workStateId`;
- candidate preparation before ready publish.

Proof:

- two worktrees activate different runtime digests without changing each other.

### T6. Projection Ledger

Deliverables:

- per-workspace projection ledger;
- ownership classes;
- materialization for skills/agents/prose/hooks;
- clean dogfood/product separation.

Proof:

- projection repair refuses source-owned collisions and can cleanly remove or
  update generated-owned projections.

## Sequencing Rule

Packaging/distribution may proceed with release-tree and manifest work in
parallel, but activation, shims, upgrade, and Rust CLI cutover must not bypass
the topology gates above.
