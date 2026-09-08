# Workspace Topology Architecture

**Status:** Architecture contract draft; pending decision on durable work-history
placement.
**Date:** 2026-09-04.
**Scope:** Identity, state ownership, root resolution, and mutation authority for
fgOS in single-workspace and isolated-worktree modes.

This document is the topology contract. It defines the primitive every
packaging, work-state, coding-domain, runtime-coordination, config/init/doctor,
and future host-surface design must use:

```txt
TopologyContext = resolved identities + typed roots + granted capabilities
```

No business/workflow module should infer "main root", "cwd root", or a `.fgos`
path directly. It should receive a `TopologyContext` and use the typed root or
capability named by that context.

Companion documents:

- [workspace-topology-audit.md](workspace-topology-audit.md) records current
  codebase evidence and gaps.
- [workspace-topology-roadmap.md](workspace-topology-roadmap.md) records
  decision order and migration slices.

## 1. Contract Goal

"Project root" is not a strong enough abstraction for fgOS.

The same repository can simultaneously contain:

- branch/workspace policy files;
- hot durable workflow history;
- machine-local runtime coordination;
- workspace-local projections;
- immutable runtime payloads;
- derived caches/logs/temp files;
- multiple linked worktrees with different checked-out config and pins.

The contract goal is to make these questions mechanically answerable before any
operation mutates state:

```txt
Which workspace policy is read?
Which durable work-state is mutated?
Which coordination state is shared?
Which runtime artifact is authorized?
Which checkout may become dirty?
Which locks/leases fence the mutation?
```

If an operation cannot prove the identity/root/capability it needs, it must
refuse mutation. Read-only diagnostics may continue when safe.

## 2. Identities

Topology has three scope identities and one runtime content identity.

| Identity | Meaning | Creation | Persistence | Move/Symlink Rule |
|---|---|---|---|---|
| `repositoryId` | Logical repository/project lineage. Shared by main checkout and linked worktrees. | Git: read or create `<repositoryLocalStateRoot>/identity.json`, using git common dir only to find the shared repository anchor. Non-Git: read or create local workspace identity. | Git: machine-local binding under repository-local fgOS state; exported/imported through tracked checkpoint metadata only when explicitly supported. Non-Git: local only. | Git common dir and realpath are used for path comparison. Display paths are not identity. |
| `workspaceId` | One checkout/worktree where commands run and host-visible files live. | Read or create `<workspaceLocalStateRoot>/identity.json`. Main checkout is also a workspace. | Stable across path rename when its local identity file moves with the workspace; regenerated only if identity file is absent and no registry binding proves continuity. | Two symlink paths to the same checkout resolve to the same `workspaceId`. |
| `workStateId` | Durable fgOS work-state stream being read/mutated. | Bound by workspace policy or repository identity record. Fresh project creates one default `workStateId`. | Stored in repository-local fgOS state and referenced by workspace policy/binding. | Multiple workspaces may share one `workStateId` only through explicit binding. |
| `artifactDigest` | Immutable runtime release content identity. | Digest of canonical release tree manifest. | Stored in release manifest and activation binding. | Not a topology scope. It is used for runtime compatibility and writer authority. |

Rules:

- Main checkout is not automatically the owner of all fgOS truth.
- `artifactDigest` must not be used as a repository/workspace/work-state
  identity.
- Any binding change for `repositoryId`, `workspaceId`, or `workStateId` is a
  topology mutation and requires the relevant capability.

## 3. State Classes

Each state class is closed for V1. A caller must not invent a new class without
updating this contract.

| Class | Examples | Scope | Authoritative Root | Durability | Git Policy | Sharing | Writer Capability | Lock Domain | Recovery Authority |
|---|---|---|---|---|---|---|---|---|---|
| `workspacePolicy` | `.fgos/config.json`, `.fgos/distribution.json`, domain config | `workspaceId` / branch | `configPolicyRoot` | durable branch content | tracked | follows checkout/branch | `workspace-policy:write` | `workspace:<workspaceId>` | explicit local fix or user edit |
| `workHistoryHot` | active event shards, current durable workflow log | `workStateId` | `workHistoryRoot` | durable hot state | not in worktree hot path | shared by bound workspaces | `work-history:append` | `work-state:<workStateId>` | fail-closed; explicit recovery |
| `workHistoryCheckpoint` | sealed history segments for backup/sync/audit | `workStateId` + repository branch | workspace content root under `.fgos/history/checkpoints/` | durable exchange artifact | tracked immutable | travels with Git | `history-checkpoint:seal` | `work-state:<workStateId>` then `repository-git` | import/seal tooling only |
| `runtimeCoordination` | claims, sessions, assignment claims, locks, leases | `workStateId` + machine | `runtimeCoordinationRoot` | machine-local operational state | ignored | shared by bound workspaces on same machine | `coordination:write` | `coordination:<workStateId>` | automatic only with provable owner death; otherwise explicit recovery |
| `workspaceProjection` | skills, agents, managed host files, generated docs blocks | `workspaceId` | `projectionRoot` plus projection ledger | rebuildable or managed | ignored/generated unless explicitly managed | not shared across workspaces | `projection:write` | `projection:<workspaceId>` | `fgos doctor --fix` / projection repair |
| `runtimePayload` | release trees, manifests, payload binaries/prose/skills source | `artifactDigest` + machine trust domain | `machineReleaseStore` | immutable content-addressed | ignored / outside repo | shared across repositories by digest | `runtime-payload:stage` | `artifact:<artifactDigest>` | quarantine or restage |
| `activationBinding` | selected runtime for one workspace | `workspaceId` | `activationBindingRoot` | durable machine-local binding | ignored workspace-local state | workspace-local | `activation:publish` | `activation:<workspaceId>` | rollback to previous ready binding or explicit repair |
| `derivedState` | read models, caches, diagnostic logs, temp files | declared owner scope | `derivedStateRoot` | rebuildable unless declared | ignored | owner-declared | owner-specific | owner-specific | delete/rebuild when safe |

V1 default: hot work history is outside the tracked workspace tree, and tracked
history checkpoints are immutable exchange artifacts. This is the recommended
contract shape. If the project temporarily keeps hot history in Git, it is a
compatibility mode and must still expose the same logical roots/capabilities.

## 4. Physical Placement Defaults

### Git Workspace

```txt
<workspace-root>/
  product files
  .fgos/
    config.json
    distribution.json
    installation/
      bin/
        fgos
        fgos-runner
      root.json
      activation.json
      projections/ledger.json
    history/checkpoints/

<main-checkout-root>/.fgos/local/
  identity.json
  work-state/<workStateId>/
    active-events/
    coordination/
    claims/
    derived/
  workspaces/<workspaceId>/
    registry.json

<workspace-local-state-root>/
  identity.json
  transient/

<machine-state>/fgos/releases/<artifactDigest>/
  manifest.json
  bin/
  workshop/
```

Notes:

- `<git-common-dir>` is the common Git directory returned by
  `git rev-parse --path-format=absolute --git-common-dir`. It is an anchor for
  discovering the shared repository topology, not the default place for fgOS to
  store arbitrary state.
- `<main-checkout-root>/.fgos/local/` is gitignored repository-local fgOS state.
  It is outside the hot product tree contract but still inspectable by the
  operator and not inside Git's private storage.
- `<workspace-root>/.fgos/installation/` is the workspace installation capsule:
  stable shims, root binding, activation binding, and projection ledger. Worker
  workspaces that need local command entry get this capsule, not a symlink or
  copy of the whole shared `.fgos` state tree.
- `<workspace-local-state-root>` is a workspace-scoped ignored root for
  transient local state not covered by the installation capsule. In a simple
  main checkout this may be `<workspace-root>/.fgos/local/workspace/`; in a
  linked worktree it may be a pointer/binding under repository-local state when
  the worktree itself intentionally has no `.fgos/` directory.
- `machineReleaseStore` is not repository-scoped. Immutable payloads are
  content-addressed and may be shared by multiple repositories.

### Non-Git Workspace

```txt
<workspace-root>/
  product files
  .fgos/
    config.json
    distribution.json
    identity/
    local-state/
    installation/
      bin/
        fgos
        fgos-runner
      root.json
      activation.json
      projections/ledger.json
```

Non-Git mode has no Git worktree isolation, no Git checkpoint/merge guarantees,
and no linked-worktree sharing. It can still use local workflow state and
project-local runtime activation.

## 5. Workspace Modes

### Single-Workspace Mode

```txt
repositoryId = one repository/local workspace
workspaceId = main workspace
workStateId = default work-state
activation binding = one workspace-local binding
```

Physical roots may coincide, but capabilities remain separate.

### Isolated-Worktree Mode

```txt
repositoryId = shared through git common dir
workspaceId = one per checkout/worktree
workStateId = explicitly shared or explicitly separate
release store = machine-wide by artifactDigest
activation/projections/policy = workspace-scoped
coordination/work history = governed by workStateId
```

Required invariants:

- worker product writes never land in main checkout;
- branch/workspace policy is read from the running workspace;
- runtime coordination does not fork per worktree unless the operation asks for
  a separate `workStateId`;
- hot work history does not dirty main;
- workspace projections and activation bindings are scoped by `workspaceId`;
- two runtime digests cannot mutate the same `workStateId` unless writer
  compatibility is proven.

## 6. `resolveTopology()` Protocol

All CLI, runner, doctor, init, gateway-adapter, and coordination entry points
must go through one conceptual protocol:

```txt
resolveTopology(invocationCwd, explicitFlags, operation) -> TopologyContext
```

Required protocol order:

1. Canonicalize `invocationCwd` using realpath when possible.
2. Detect Git vs non-Git workspace.
3. For Git, resolve git common dir and current worktree identity only as
   topology anchors; do not store fgOS state inside Git's private directories
   by default.
4. Load workspace policy from the current `workspaceId`'s content root unless
   explicit flags name another workspace.
5. Resolve or create `repositoryId` and `workspaceId` using the identity rules.
6. Resolve `workStateId` from workspace policy or repository binding.
7. Resolve typed roots for every state class the operation may touch.
8. Resolve candidate/current `artifactDigest` from workspace runtime pin and
   activation binding.
9. Check runtime/work-state schema compatibility.
10. Grant operation capabilities and required locks/leases.
11. Return a `TopologyContext`; do not expose raw resolver choice to business
    logic.

If any required identity or root is ambiguous, return a typed refusal. Do not
fall back from workspace to main, or from shared state to local state, without an
explicit compatibility/adoption rule.

## 7. Capability And Lease Model

Locks are resource-scoped, not one broad global mutex.

Canonical lock acquisition order:

1. `repository-git`
2. `work-state:<workStateId>`
3. `workspace:<workspaceId>`
4. `activation:<workspaceId>`
5. `projection:<workspaceId>`
6. `coordination:<workStateId>`
7. `artifact:<artifactDigest>`

Multi-resource operations must acquire locks in this order to avoid deadlock.

Each mutating lease/lock record must carry:

- resource id;
- owner kind;
- process id when available;
- process start token when available;
- boot id when available;
- `workspaceId`;
- `workStateId`;
- `artifactDigest` when a runtime is executing;
- fencing token;
- parent lease id when nested;
- heartbeat/expiry metadata.

TTL detects suspicion; it does not transfer authority. Recovery may clear or
supersede a lease only when owner death is mechanically proven or a human/local
operator records explicit completion-unknown recovery.

## 8. Operation Capability Matrix

| Operation | Policy Read | Durable Write | Coordination Write | Workspace Write | Required Locks/Leases | Forbidden Roots | Failure If Missing |
|---|---|---|---|---|---|---|---|
| `fgctl init` | `workspacePolicy(workspaceId)` | none directly | optional install transaction | shims/activation prep only | `activation:<workspaceId>`, `artifact:<artifactDigest>` | work history hot path | `runtime-not-staged`, `policy-ambiguous`, `activation-busy` |
| `fgctl upgrade/repair` | `workspacePolicy(workspaceId)` | none directly | install transaction | activation binding | `activation:<workspaceId>`, mutating runtime leases must be clear | work history hot path | `activation-busy`, `runtime-incompatible` |
| local `fgos init` | `workspacePolicy(workspaceId)` | schema adoption only when granted | none by default | projections/config defaults | `workspace:<workspaceId>`, `projection:<workspaceId>` | unrelated workspace roots | `workspace-policy-unwritable`, `projection-conflict` |
| `fgos doctor` | all declared read roots | none | none | none | read-only | all writes | `topology-ambiguous` warning/refusal depending check |
| `fgos doctor --fix` | workspace policy + projection ledger | only fixes declared safe state | repair coordination only when declared | safe projection/config repair | class-specific locks | immutable payload, unrelated workspace | `fix-not-authorized` |
| `fgos submit` | `workspacePolicy(workspaceId)` | append to `workHistoryRoot(workStateId)` | none | none except declared projection | `work-state:<workStateId>` | main/product files | `work-state-unavailable`, `policy-ambiguous` |
| `fgos pick` / `take` | workspace policy + work view | optional durable status event | claim/assignment state | worker worktree creation | `coordination:<workStateId>`, optional `repository-git` | main product files | `claim-conflict`, `worktree-unavailable` |
| `fgos return` | workspace policy + worktree branch | append return/result event | release claim | worker branch only | `work-state:<workStateId>`, `coordination:<workStateId>` | main product files before approve | `claim-mismatch`, `branch-dirty` |
| `fgos approve` | main workspace policy + work view | append approval/merge result | cleanup claim/session | main checkout through merge only | `repository-git`, `work-state:<workStateId>` | worker-only state roots | `main-dirty`, `merge-busy` |
| runner dispatch | workspace policy + work view | assignment/result events as granted | assignment claims | worker workspace | per-assignment lease, `coordination:<workStateId>` | long-lived activation lease | `slots-full`, `assignment-conflict` |
| event append/replay | none or policy read for validation | append only | none | derived view only | `work-state:<workStateId>` | workspace content except checkpoint | `event-lock-timeout`, `corrupt-log` |
| config edit/test | current workspace policy | none | none | `.fgos/config.json` in current workspace | `workspace:<workspaceId>` | main config unless current workspace is main | `policy-root-ambiguous` |
| projection materialization | runtime workshop + workspace policy | none | none | projection paths in current workspace | `projection:<workspaceId>` | source-owned unmanaged files | `projection-conflict` |

## 9. Acceptance Scenarios

A stranger engineer can implement against this contract when these scenarios
have pass/fail tests:

1. Two linked worktrees with different `.fgos/distribution.json` select different
   activation bindings but reuse the same machine release store.
2. A worker branch edits `.fgos/config.json`; dispatch/doctor for that worktree
   reads the edited config, while main remains unchanged.
3. `fgos submit` from a worker reads workspace policy but appends to the shared
   `workStateId` hot history without dirtying main.
4. Two workers append events concurrently; no lost update occurs, and no hot
   event file appears as main checkout dirty.
5. A stale claim with only expired TTL is not destructively cleared unless owner
   death is proven or explicit recovery is recorded.
6. `fgctl upgrade` refuses while a mutating assignment lease for the same
   `workspaceId`/`workStateId` is active.
7. `fgos doctor --fix` materializes skills/agents/prose only through the
   workspace projection ledger and refuses source-owned collisions.
8. A fresh clone with tracked config/pin/checkpoints but no machine runtime runs
   `fgctl init` and reaches a ready workspace activation.
9. The same checkout opened through a symlink resolves to the same
   `workspaceId`.
10. Non-Git workspace mode runs local init/doctor/submit but refuses operations
    requiring Git worktree isolation.

## 10. Open Decision

The remaining blocker before promoting this document from draft to locked
contract is durable work-history placement.

Recommended V1 decision:

```txt
hot work history lives outside the tracked workspace tree
sealed immutable checkpoints live inside tracked .fgos/history/checkpoints/
```

Checkpoint requirements:

- immutable segment files;
- sequence range;
- predecessor digest;
- segment digest;
- idempotent import rule;
- duplicate detection by event identity/content hash;
- no checkpoint segment may be rewritten in place.

This hybrid shape preserves audit/sync/backup through Git without making the
working tree the hot event store.
