# Workspace Topology Codebase Audit

**Status:** Evidence snapshot for the topology contract.
**Date:** 2026-09-04.
**Evidence scope:** Current code and generated specs in this checkout.
**Contract:** [workspace-topology.md](workspace-topology.md).

This document records why the topology contract is needed. It is allowed to go
stale as code changes; the contract should not.

## Summary

The current codebase has several strong local fixes:

- isolated worker branches/worktrees;
- per-writer event shards;
- event append plus derived-view refresh under one lock;
- gitignored cache/log/assignment/coordination buckets;
- active claim overlay;
- session registry lock;
- main-checkout lock and hook;
- setup/doctor registry.

The remaining problem is that these are not yet one coherent topology. Callers
can still choose "cwd", "repo root", "main checkout", or direct `.fgos` paths
case by case.

The current abstraction failure:

```txt
For this operation, which workspace's policy is read,
which work-state is mutated,
which coordination state is shared,
which runtime digest has writer authority,
and which checkout is allowed to become dirty?
```

## A1. Root Resolution Has Multiple Semantics

Observed code:

- `src/runner/paths.mjs` has `resolveRepoRoot(cwd, { strict: true })`, which
  returns `cwd` as-is. `bin/fgos.mjs` uses this for cwd-strict CLI behavior.
- `resolveRepoRoot(cwd)` shells out to `git rev-parse --show-toplevel`, meaning
  the current checkout/worktree.
- `resolveMainCheckoutRoot(cwd)` shells out through `--git-common-dir`, meaning
  the main checkout even from a linked worktree.
- `resolveContentRoot(stateRoot, id, docsRef)` compensates for the fact that
  design artifacts may live on an item worktree branch, not main.

Status: partially solved.

What is good:

- The code knows main and linked worktree are not equivalent.
- Some paths intentionally use main to avoid phantom `.fgos` state.
- Content lookup already has branch/worktree awareness.

Gap:

- Business logic still receives plain `dir`/`repoRoot` and can pick the wrong
  resolver.
- There is no single `TopologyContext` choke point.

## A2. Config Is Tracked But Read/Write Authority Is Inconsistent

Observed code:

- `src/config/shared-config-file.mjs` says `.fgos/config.json` is a normal
  git-tracked project config file and every worktree checkout carries its own
  copy.
- `src/runner/dispatch/config.mjs` reads `.fgos/config.json` and merges global
  config with project config winning.
- Some paths, including setup/doctor/dispatch variants, resolve to main checkout
  using `resolveMainCheckoutRoot`.
- `fgos setup` was changed to avoid writing `.fgos/config.json` inside linked
  worktrees.

Status: not root-solved.

What is good:

- One shared config file surface exists.
- Project config wins over global config.
- Setup/doctor registry makes defaults and checks discoverable.

Gap:

- Branch/workspace policy config and repository/machine coordination config are
  mixed in one file/root.
- A worker cannot reliably test config changes if the operation redirects to
  main.
- A repair may affect main when the user intended a worktree.

Architecture implication:

- Config keys need declared scope: workspace/branch, work-state, or machine.

## A3. Worktree Isolation Exists, But `.fgos` Treatment Depends On Mode

Observed code:

- `src/runner/worktree.mjs` creates `fgw/<id>` branches in fresh worktrees.
- Worker worktrees remove checked-out `.fgos` because stale copied state is
  wrong and live symlinked state was rejected for worker execution.
- `src/runner/session.mjs` does the opposite: it removes checked-out `.fgos` and
  symlinks it back to main, because sessions are driver/readers of shared state.
- Worktree cleanup preserves proposal branches and force-removes only stale
  checkout directories.

Status: partially solved.

What is good:

- Worker product changes are isolated.
- Retry gets fresh worktree directories.
- Orphaned checkout cleanup exists.
- Session registry writes are locked.

Gap:

- "worker", "session", "proof", and "main" are not first-class workspace kinds.
- Relative `.fgos/...` access fails or misroutes depending on workspace type.

## A4. Durable Event History Is Sharded But Still Hot In Git

Observed code:

- `src/state/store.mjs` treats old `.fgos/events.jsonl` as baseline-0.
- New writes go to `.fgos/events/<writer-id>-<openTs>.jsonl`.
- Append/CAS plus `state.json` refresh happen under `events.lock`.
- `.gitattributes` has `merge=union` for `.fgos/events/*.jsonl`.
- Doctor has truncation checks for baseline and per-writer files.

Status: partially solved.

What is good:

- Same-file append contention is reduced.
- Derived view lost-update race was closed.
- Baseline log is not rewritten.
- Truncation detection exists.

Gap:

- Hot durable history still modifies Git-tracked files.
- `events.lock` does not protect against arbitrary Git checkout/merge/stash/reset
  or human edits.
- Main can still become dirty from fgOS work-state activity.

Architecture implication:

- Hot work history should move out of the tracked working tree, with tracked
  immutable checkpoints as exchange/backup.

## A5. Runtime Coordination Is Ignored But Namespace/Liveness Are Weak

Observed code:

- `src/state/runtime-coordination.mjs` stores active claims under
  `.fgos/runtime/claims/<id>.json`.
- Claim reads fail closed on corrupt/unreadable files.
- `getMainFgosDir()` forces claim state to main `.fgos` from a worktree.
- Claim locks use PID/timestamp.

Status: partially solved.

What is good:

- Live claim overlay is separated from durable status.
- Claim state is gitignored.
- Claim acquisition is lock-protected.

Gap:

- `.fgos/runtime` is overloaded with claims today and packaging runtime payload/
  activation tomorrow.
- PID/time does not prove liveness across reboot, PID reuse, detached children,
  containers, or remote executors.
- Claim records are not scoped by `workspaceId`, `workStateId`, and
  `artifactDigest`.

## A6. Agent Coordination Store Needs Root Review

Observed code:

- `src/runner/coordination/store.mjs` roots sessions at
  `.fgos/coordination/sessions/<id>/`.
- It validates coordination ids before path construction.
- Manifest writes use atomic rename.
- Session event writes reuse event-lock lineage.
- `resolveCoordinationPaths()` computes a `root` from main checkout, but creates
  `fgosDir` from `cwd`.

Status: partially solved / needs focused review.

Gap:

- It is unclear whether coordination sessions are repository-shared,
  workspace-local, or mode-dependent.
- If shared, `fgosDirFromRoot(cwd)` can be wrong inside a linked worktree.
- If local, fanout/session visibility rules need to say so explicitly.

## A7. Main Checkout Dirty Guard Is Not A Work-State Guard

Observed code:

- `src/runner/main-checkout-lock.mjs` guards direct main checkout activity.
- It has ambiguity handling, self-recognition, TTL distinction, and hook support.
- Doctor checks stuck merge state and points to manual recovery.

Status: partially solved.

What is good:

- Direct commits against main are guarded.
- Linked-worktree vs main-worktree detection exists.
- Some merge paths distinguish fgOS lifecycle noise from product footprint.

Gap:

- Event append, coordination updates, config repair, projection materialization,
  and activation binding all have separate locks or no topology-level resource
  lease.
- One broad global lock would be safe but too slow; resource-scoped leases are
  needed.

## A8. Projection Materialization Is Not Root-Solved

Observed code:

- setup/doctor registry handles many generated/configured surfaces.
- Some generated docs projections can be checked/fixed.
- Logs/cache have moved under ignored buckets.

Status: not root-solved.

Gap:

- No universal projection ledger exists.
- Projection ownership is not encoded as source-owned/generated/managed/refuse.
- Skills, agents, prose, hooks, and managed host files need workspace-local
  materialization without polluting product packaging or dogfood source.

## Unresolved Or Poorly Solved Sub-Problems

| Sub-Problem | Current Shape | Why It Is Not Root-Solved | Direction |
|---|---|---|---|
| Workspace policy vs shared state root | `.fgos/config.json` is tracked and should follow branches, while claims/events/coordination often resolve through main. | One `.fgos` path still carries both branch policy and shared runtime/work-state meaning. | Split root resolution by state class. |
| Testing config changes inside worktree | Some paths read cwd config; others force main. | Branch cannot reliably validate config changes before merge. | Config keys declare scope and operation-specific read layer. |
| `.fgos` visibility in worktrees | Workers remove `.fgos`; sessions symlink it. | Correct locally, undocumented as workspace kinds. | Define workspace kinds and `.fgos` policy per kind. |
| Hot durable history dirties main | `.fgos/events/` is tracked and active. | Sharding reduces conflicts, not dirty-main. | External hot store + immutable Git checkpoints. |
| Git operations vs event append | `events.lock` covers fgOS appenders only. | Git mutations can still move/revert tracked event files. | Shared resource protocol if history remains in Git. |
| Derived view write amplification | `state.json` rewrites under cache. | Safe but can become performance bottleneck. | Keep V1; move view store later when measured. |
| Runtime namespace collision | Claims live in `.fgos/runtime`. | Packaging also needs runtime namespace. | Split payload/activation from coordination. |
| Claim liveness proof | PID/time/TTL. | Unsafe across reboot/PID reuse/remote/container. | Add boot id, process token, heartbeat, fencing token. |
| Runner/watch activation safety | No distribution lease model. | Long watcher should not block forever; assignments must not race upgrade. | Per-assignment leases, re-read activation between assignments. |
| Coordination root ambiguity | Main-ish `root`, cwd-based `fgosDir`. | Sharing semantics unclear. | Coordination declares `workspaceId` and `workStateId`. |
| Assignment/run-result locality | Gitignored `.fgos/assignments`. | Future gateway/remote visibility depends on root choice. | Classify as runtime coordination / derived execution record. |
| Projection ownership | No universal ledger. | Fix can overwrite wrong checkout/source-owned path. | Workspace projection ledger. |
| Skills/agents/prose install | Must be visible near workspace. | Can pollute product package/dogfood source. | Materialize as workspace projections via local fgos. |
| Dirty-state classification | `.fgos` mixes policy/history/ignored state. | Dirty can mean product, history, generated noise, or config. | Dirty checks classify by state class. |
| Activation cardinality | Shared active binding was considered. | Worktrees may have different pins. | Binding scoped by `workspaceId`; release store shared by digest. |
| New clone adoption | Tracked policy exists; runtime ignored/missing. | Fresh clone needs deterministic bootstrap. | `fgctl init` stages pinned runtime and imports checkpoints. |
| Non-Git behavior | Some paths require git; some tolerate cwd. | Feature degradation not specified. | Explicit non-Git mode. |
| Symlink/multiple path identity | Some realpath helpers exist. | Duplicate workspace records still possible. | Canonicalize by git dirs/realpath; display path is metadata. |
| Recovery authority | Manual vs auto fixes are scattered. | State class does not own recovery rule. | Recovery owner per state class. |

## Audit Conclusion

The codebase has already converged toward the right idea through localized
fixes. The missing step is to make `TopologyContext` the only accepted primitive
for root and authority decisions.
