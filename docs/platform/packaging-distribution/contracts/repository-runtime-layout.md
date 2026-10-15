# Contract: Repository Runtime Layout

```txt
Document type: Contract
Audience: Maintainer, distribution engineer, implementation agent
Purpose: Preserve the repository/workspace/release-store layout boundaries for packaging-distribution
Design status: Draft
Implementation status: Partial
Canonical: Yes, after review
Owner: Packaging-distribution
Source type: Promoted from docs/architect/packaging-distribution/runtime-identity-and-activation.md and scope-map.md
Last reviewed: 2026-09-18
Related:
- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
- docs/platform/packaging-distribution/contracts/release-manifest.md
- docs/platform/packaging-distribution/contracts/activation-binding.md
- docs/platform/packaging-distribution/contracts/distribution-pin.md
- docs/platform/packaging-distribution/contracts/projection-ledger.md
- docs/architect/workspace-topology.md
Implementation: Original section-specific implementation statements retained; carriage is pending independent review
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
```

## 1. Purpose

This contract records the minimum on-disk layout packaging-distribution must preserve. It prevents install, activation, doctor/fix, projection, and worker-workspace logic from collapsing distinct authorities into one `.fgos` tree.

Packaging-distribution consumes workspace topology; it does not own durable work-state semantics.

## 2. Minimum Layout

```txt
workspace root:
  .fgos/
    config.json             # tracked workspace/branch policy
    distribution.json       # tracked team/project runtime pin
    installation/
      bin/
        fgos                # ignored stable workspace shim
        fgos-runner         # ignored stable workspace shim
      root.json             # ignored TopologyContext/root binding snapshot
      activation.json       # ignored per-workspace ready binding
      projections/
        ledger.json         # ignored per-workspace projection ledger

workHistoryRoot(workStateId):
  active-events/            # hot durable history; placement owned by topology/work-state
  schema.json               # current work-state schema record
  derived/

runtimeCoordinationRoot(workStateId):
  claims/
  sessions/
  leases/
  locks/

machineReleaseStore:
  releases/
    <artifactDigest>/
      manifest.json
      bin/
        fgos
        fgos-runner
      libexec/
        legacy-node/
      workshop/
        skills/
        agents/
        prose/
      docs/
  installs/
    <activationId>.json
  install.lock
  quarantine/
```

## 3. Separation Rules

- `machineReleaseStore/releases/<artifactDigest>/` is immutable release payload.
- Workspace `.fgos/installation/bin/*` is the stable local entry surface.
- Workspace `.fgos/installation/activation.json` selects the active runtime for that workspace only.
- Workspace `.fgos/config.json` is tracked workspace/branch policy.
- Workspace `.fgos/distribution.json` is tracked runtime pin policy and may differ by branch/worktree.
- Workspace `.fgos/installation/projections/ledger.json` records host-visible projections for that workspace only.
- `workHistoryRoot(workStateId)` owns durable workflow history, not packaging.
- `runtimeCoordinationRoot(workStateId)` owns claims, sessions, leases, and locks, and must not share a namespace with release or activation records.
- Config, event history, coordination, cache, activation, release payload, and projections are distinct state classes.

## 4. Worker Workspace Capsule

Worker workspaces still need an installation capsule if commands should enter through local shims. They must not symlink or copy the entire shared `.fgos` state tree.

Minimum worker capsule:

```txt
worker workspace:
  .fgos/
    distribution.json        # checked out with the branch when present
    installation/
      bin/fgos
      bin/fgos-runner
      root.json              # binds shared workState/release/coordination roots
      activation.json
      projections/ledger.json
```

## 5. Source, Release, Projection

Packaging-distribution must keep these three shapes distinct:

| Shape | Meaning | Mutation rule |
| --- | --- | --- |
| Source repository layout | The developer/source checkout, including code, docs, tests, canonical skill/instruction sources, and release build scripts. | Mutated by development work only. |
| Release tree | Immutable staged runtime payload under `machineReleaseStore/releases/<artifactDigest>/`. | Never patched in place; repair reacquires or restages. |
| Workspace projections | Host-visible generated files such as `.agents/skills`, `.claude/skills`, managed `AGENTS.md` blocks, or plugin/extension projections. | Materialized by active local `fgos init` or `fgos doctor --fix`, recorded by projection ledger when implemented. |

Generated workspace projections are not release-tree files at their final workspace paths. The release manifest records canonical source material; the projection ledger records where that material is projected inside a workspace.

## 6. Pin And Staging Rule

If `.fgos/distribution.json` exists but the release store has not staged its requested release, the workspace is `pinned-not-staged`.

`fgctl init` must acquire or stage the pinned release and publish this workspace's activation binding. It must not silently choose latest.

## 7. Topology Records Schema (Frozen V1)

### 7.1 Workspace Root Binding (`.fgos/installation/root.json`)

The schema is frozen at `schemaVersion: 1`. Rust serde definition lives in `packages/distribution/rust/src/init.rs` (`WorkspaceRootBinding`, aliased as `TopologyRootBinding`).

```json
{
  "schemaVersion": 1,
  "repositoryRoot": "/home/user/project",
  "workspaceId": "8d3322d88fba3bd8",
  "workStateId": "8d3322d88fba3bd8",
  "machineReleaseStore": "/home/user/.local/state/fgos"
}
```

| Field | Type | Description |
| --- | --- | --- |
| `schemaVersion` | integer | Fixed at `1` for V1. |
| `repositoryRoot` | string | Canonical filesystem path of the repository checkout root. |
| `workspaceId` | string | 16-hex hash of canonical workspace root. |
| `workStateId` | string | Work-state namespace identifier (equals `workspaceId` in V1). |
| `machineReleaseStore` | string | Absolute path to the machine release store. |

### 7.2 Install Transaction Record (`<store>/installs/<activationId>.json`)

The schema is frozen at `schemaVersion: 1`. Rust serde definition lives in `packages/distribution/rust/src/init.rs` (`InstallTransactionRecord`).

```json
{
  "schemaVersion": 1,
  "activationId": "act_000001a08fe31d00",
  "workspaceId": "8d3322d88fba3bd8",
  "artifactDigest": "sha256:08e33ffd77ccae43fd3b9f3034c9d4c28bdc1d8c69966f913ed66707a0486ec4",
  "status": "ready-published",
  "history": [
    { "status": "staging", "timestamp": "2026-09-14T00:00:00.000Z" },
    { "status": "verified", "timestamp": "2026-09-14T00:00:01.000Z" },
    { "status": "preparing", "timestamp": "2026-09-14T00:00:02.000Z" },
    { "status": "ready-published", "timestamp": "2026-09-14T00:00:03.000Z" }
  ],
  "updatedAt": "2026-09-14T00:00:03.000Z"
}
```

## 8. Implementation Status

| Claim | Status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| Release tree has `manifest.json`, `bin/`, and `libexec/legacy-node/`. | implemented | `scripts/build-rust-distribution.mjs`, `test/rust-host/release-tree.test.mjs` | Keep exact fields in sync with `contracts/release-manifest.md`. |
| Workspace activation lives under `.fgos/installation/activation.json`. | implemented | `packages/distribution/rust/src/init.rs`, `packages/distribution/rust/tests/schema_golden.rs`, `test/rust-host/fgctl-init.test.mjs`, `test/rust-host/fgctl-upgrade.test.mjs` | Schema frozen at V1 with golden test coverage. |
| Topology root binding snapshot lives under `.fgos/installation/root.json`. | implemented | `packages/distribution/rust/src/init.rs`, `packages/distribution/rust/tests/schema_golden.rs`, `test/rust-host/fgctl-init.test.mjs` | Schema frozen at V1 with golden test coverage. |
| Projection ledger path is `.fgos/installation/projections/ledger.json`. | partial | `contracts/projection-ledger.md`, `src/setup/instruction-projections.mjs`, `test/setup/instruction-projections.test.mjs` | Instruction projections write ledger evidence; skill and wider host projections still need ledger coverage before claiming projection repair is complete. |
| Worker workspace capsule avoids copying the whole shared `.fgos` tree. | planned/unknown | Architecture source only | Scan worker/worktree implementation before marking implemented. |


## Retained Runtime Identity And Activation Source Detail

Added in candidate — complete source units from `docs/architect/packaging-distribution/runtime-identity-and-activation.md` at `77830ba77eb05991d95b005919776ee6254e833b`. Source design, dated status and obligations are preserved here; this carriage does not certify current implementation. Relative links retain their destination.

#### 3. Roots And On-Disk Shape

The root topology is defined in
[Workspace Topology Architecture](../../system-architecture/architecture/workspace-topology.md). This document uses
that topology and focuses on runtime identity records.

The minimum shape is:


```txt
workspace root:
  .fgos/
    config.json             # tracked workspace/branch policy
    distribution.json       # tracked team/project pin
    installation/
      bin/
        fgos                # ignored stable workspace shim
        fgos-runner         # ignored stable workspace shim
      root.json             # ignored TopologyContext/root binding snapshot
      activation.json       # ignored per-workspace ready binding
      projections/
        ledger.json         # ignored per-workspace projection ledger

workHistoryRoot(workStateId):
  active-events/            # hot durable history; physical placement owned by topology/work-state
  schema.json               # current work-state schema record
  derived/

runtimeCoordinationRoot(workStateId):
  claims/
  sessions/
  leases/
  locks/

machineReleaseStore:
  releases/
    <artifactDigest>/
      manifest.json
      bin/
        fgos
        fgos-runner
      libexec/
        legacy-node/
      workshop/
        skills/
        agents/
        prose/
      docs/
  installs/
    <activationId>.json
  install.lock
  quarantine/
```

The separation is architectural:

- release store `releases/<artifactDigest>/` is immutable release payload;
- workspace `.fgos/installation/bin/*` is the stable local entry surface;
- workspace `.fgos/installation/activation.json` selects the active runtime for
  that workspace only;
- workspace `.fgos/config.json` is tracked workspace/branch policy;
- workspace `.fgos/distribution.json` is tracked runtime pin policy and may
  differ by branch/worktree;
- workspace `.fgos/installation/projections/ledger.json` records projections for
  that workspace only;
- `workHistoryRoot(workStateId)` owns durable workflow history, not packaging;
- `runtimeCoordinationRoot(workStateId)` owns claims/sessions/leases/locks and
  must not share a namespace with release/activation records;
- config, event history, coordination, cache, activation, and projections have
  distinct state classes per
  [Workspace Topology Architecture](../../system-architecture/architecture/workspace-topology.md).

Worker workspaces still need an installation capsule if commands are expected
to enter through local shims. They must not symlink or copy the entire shared
`.fgos` state tree. The minimum worker capsule is:

```txt
worker workspace:
  .fgos/
    distribution.json        # checked out with the branch when present
    installation/
      bin/fgos
      bin/fgos-runner
      root.json              # binds shared workState/release/coordination roots
      activation.json
      projections/ledger.json
```

If `.fgos/distribution.json` exists but the release store has not staged its
requested release, the workspace is in `pinned-not-staged`. `fgctl init` must
acquire/stage the pinned release and publish this workspace's activation
binding, not silently choose latest.

Possible tracked pin shape:

```json
{
  "schemaVersion": 1,
  "projectRuntime": {
    "policy": "exact-digest",
    "artifactDigest": "sha256:...",
    "releaseVersion": "0.1.0",
    "channel": null,
    "allowPrerelease": false
  }
}
```

Root resolution order for the stable shim:

```txt
1. read workspace .fgos/installation/root.json if present;
2. otherwise resolve TopologyContext for repository/workspace/work-state identity;
3. read machineReleaseStore from TopologyContext;
4. read workspace .fgos/installation/activation.json;
5. exec releases/<artifactDigest>/bin/<entry>.
```

The shim must not treat a shared release store as a shared active runtime. Two
worktrees may use different activation bindings while sharing the same
content-addressed releases.

`<artifactDigest>` is a path-safe digest identity for the canonical release
tree manifest, for example `sha256-abc123...`. It is not the path humans,
agents, gateway, or runner supervisors should call directly. The stable command
path is:

```txt
.fgos/installation/bin/fgos
.fgos/installation/bin/fgos-runner
```

Those entries are thin local shims. A shim should do only the minimum required
to enter the active release:

```txt
resolve machineReleaseStore from TopologyContext/root binding
read workspace .fgos/installation/activation.json
resolve artifactDigest to releases/<digest>/
verify the target entry exists
exec the active release binary
```

It must not scan the full workspace, verify every fingerprint, resolve network
versions, run doctor checks, or load broad registries on every command. Full
verification belongs to install/repair/doctor paths. The normal command
overhead should be limited to reading one small record and executing the active
binary.

Shim forward-compatibility rule: the shim reads only `schemaVersion`,
`artifactDigest`, and `releasePath` from workspace `activation.json`. Broader
activation metadata may evolve without requiring every stable shim to be
replaced.

The alternative is a `current` symlink, but the preferred V1 is a shim because
it works more consistently on Windows, can produce clear errors when the active
release is missing, and can later add a lightweight invocation lease without
depending on filesystem symlink behavior.
