# Runtime Identity And Activation

**Status:** Architecture contract draft.
**Date:** 2026-09-04.
**Scope:** Project-local fgOS runtime identity, release records, per-workspace
activation binding, pinning, drift, rollback, quarantine, and the minimum
command boundary needed for packaging/distribution and the Rust `fgos` CLI.

This document is the first contract to settle before implementing the new
distribution mechanism. It deliberately keeps shared gateway/web as a future
constraint, not current delivery scope.

## How To Use This Document

This document is intentionally detailed. Use it as the working contract for the
first delivery slice, not as a final generated spec.

Read it in layers:

1. Read [Workspace Topology Architecture](../workspace-topology.md) first for root
   topology, state classes, worktree behavior, and dirty-tree rules.
2. Sections 1-3 here for the runtime identity model and on-disk records.
3. Sections 4-6 for the record model and activation binding.
4. Sections 7-10 for concurrency, pinning, projections, and state-schema
   compatibility.
5. Sections 11-14 for adoption, repair/rollback authority, command ownership,
   `fgctl` acquisition, and the
   first walking skeleton.
6. Section 15 for remaining decisions.

## Settled Decisions So Far

| Decision | Status |
|---|---|
| Runtime identity is digest-based, not PATH-based. | Settled for V1. |
| `artifactDigest` is the digest of the canonical release tree manifest, not an archive digest. | Settled for V1. |
| Release tree manifest uses normalized logical paths and refuses symlinks/case collisions in V1. | Settled for V1. |
| Project commands enter through stable local shims under workspace `.fgos/installation/bin/`. | Settled for V1. |
| Immutable release payloads live under a shared content-addressed machine/trust-domain release store, not under each worktree. | Settled for V1. |
| Activation is per workspace via `.fgos/installation/activation.json`; there is no single repository-wide active runtime pointer in V1. | Settled for V1. |
| Packaging release/activation state uses workspace installation roots and must not share a namespace with work coordination state. | Settled for V1. |
| The project/team pin is tracked as `.fgos/distribution.json`; machine-local activation state remains ignored. | Settled for V1. |
| `activation.json` is a durably published workspace binding, not a symlink, in V1. | Settled for V1. |
| Install transaction state lives under the release store root's `installs/<activationId>.json`, not inside `activation.json`. | Settled for V1. |
| Mutating invocations create lease files; `fgctl` may stage/verify during leases but refuses activation while a non-stale mutating lease exists. | Settled for V1. |
| V1 does not do automatic state migration during upgrade/rollback. | Settled for V1. |
| `fgctl` never writes host-visible projection files directly; local `fgos init` / `doctor --fix` owns projection materialization under active identity. | Settled for V1. |
| Existing projects are adoptable: a missing state schema record is treated as schema `1` and written during local `fgos init`. | Settled for V1. |
| Source checkouts support explicit `dev:<rev>` activation for dogfood; it is non-distributable and skips immutable release guarantees. | Settled for V1. |
| `fgctl` V1 is a Rust bootstrap binary with local path/tarball and GitHub release asset as acquisition sources. | Settled for V1. |
| Shared gateway/web are architecture constraints only, not current delivery scope. | Settled for current delivery. |

## 1. Core Position

The project-local fgOS runtime must be selected by a workspace activation
binding, not by whatever executable happens to be on `PATH`.

```txt
fgctl
  acquires/stages/verifies immutable releases in the shared release store
  prepares a workspace installation capsule
  publishes a ready workspace activation binding

local fgos
  runs only after a ready workspace activation binding is known
  owns project workflow semantics under that active identity
```

Runtime identity is digest-based. The artifact identity is the digest of the
canonical release tree manifest, not the digest of a compressed archive.
Version/tag/channel are human-facing metadata and selection policy. They are
not the final proof of what is installed.

## 2. Runtime Lifecycle

The install/upgrade/repair lifecycle is:

```txt
acquire artifact
  -> stage immutable payload
  -> verify release manifest
  -> prepare workspace installation capsule
  -> publish ready workspace activation binding atomically
  -> invoke active local fgos init / doctor --fix / doctor for projection/config repair
  -> allow project-state mutation
```

No project workflow command should mutate project state from a payload that has
not crossed the activation boundary.

Candidate releases may run only bootstrap/preflight checks before activation.
They must not write host-visible projection paths such as `.agents/`, `.claude/`,
or `AGENTS.md`. Projection materialization happens after the ready activation
binding exists, through the active local `fgos` command. If that tail fails, the
activation remains the selected runtime but the workspace is reported
`ready-degraded` until `fgos doctor --fix` repairs it.

## 3. Roots And On-Disk Shape

The root topology is defined in
[Workspace Topology Architecture](../workspace-topology.md). This document uses
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
  [Workspace Topology Architecture](../workspace-topology.md).

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

## 4. Record Types

Do not collapse all runtime facts into one ledger. Use separate records with
separate authority.

| Record | Mutability | Owner | Purpose |
|---|---|---|---|
| `ReleaseManifest` | Immutable, publisher-produced | Release build/publisher | Declares artifact identity, file digests, binaries, adapter contract, capabilities, state-schema compatibility, dependency closure. |
| `WorkspaceActivationBinding` | Mutable, workspace-local | `fgctl` | Declares which release digest is ready for this workspace, plus workspace/work-state/repository identity, activation transaction, timestamp, and status. |
| `Pin` | Mutable, git-tracked project policy | Semantic owner: packaging/distribution. Canonical writer: `fgctl`. External edits are tolerated input and validated fail-closed. | Declares desired version/channel/digest policy in `.fgos/distribution.json`. Selection input, not runtime proof. |
| `ProjectionLedger` | Mutable, project-local | local `fgos init` / `fgos doctor --fix` under active identity | Records host-visible generated/projection paths, source digest, last materialized digest, ownership class, and repair policy. |
| `MigrationJournal` | Append-only, project-local | local `fgos` under active identity | Records state-schema migration epoch, checkpoints/backups, reversibility, and compatibility facts. |

## 5. ReleaseManifest

The release manifest is the immutable statement of what an fgOS release
contains.

The canonical artifact digest is computed from this release tree manifest, not
from a `.zip`, `.tar.gz`, npm package archive, or transport wrapper. Archive
digests may still be recorded for download/integrity diagnostics, but they are
not runtime identity. Runtime identity must survive different compression
formats, package transports, and mirror locations.

The digest formula is:

```txt
fileDigest = sha256(file bytes as emitted by the release build)
artifactDigest = sha256(canonical-json(release tree manifest without artifactDigest))
```

The release build, not the installer, owns byte normalization. Install should
not rewrite line endings or file contents to make a digest pass.

Minimum fields:

```json
{
  "schemaVersion": 1,
  "artifactDigest": "sha256:...",
  "digestKind": "release-tree-manifest",
  "releaseVersion": "0.1.0",
  "sourceRevision": "...",
  "createdAt": "2026-09-04T00:00:00Z",
  "target": {
    "os": "linux",
    "arch": "x64",
    "libc": "glibc"
  },
  "entries": {
    "fgos": "bin/fgos",
    "fgosRunner": "bin/fgos-runner"
  },
  "components": {
    "legacyNode": {
      "root": "libexec/legacy-node",
      "entry": "bin/fgos.mjs",
      "digest": "sha256:..."
    },
    "runner": {
      "path": "bin/fgos-runner",
      "digest": "sha256:..."
    },
    "workshop": {
      "skillsDigest": "sha256:...",
      "agentsDigest": "sha256:...",
      "proseDigest": "sha256:..."
    }
  },
  "requires": {
    "node": ">=20 <23",
    "git": ">=2.39"
  },
  "adapter": {
    "protocolVersion": "1",
    "entry": "bin/fgos adapter",
    "capabilities": []
  },
  "stateSchemas": {
    "read": ["1"],
    "write": ["1"],
    "migrations": []
  },
  "files": []
}
```

`components.legacyNode` names a payload **root** plus an **entry** inside it, not a single file (proposed 2026-09-10 by the host-invocation stream, see [Legacy CLI Transition](../host-invocation-routing/legacy-cli-transition.md) §2): the legacy payload is the whole Node package as `package.json` `files` defines it, staged with its source-relative layout intact so `bin/fgos.mjs` needs no import changes, and `bin/fgos-runner.mjs` lives in the same root. The Rust host resolves `join(activeReleasePath, root, entry)` and nothing else. A `dev:<rev>` source activation declares `root: "."`, `entry: "bin/fgos.mjs"`, `entries.fgos: "target/release/fgos"` — the same fields serve dogfood and a staged release.

### Release Tree Canonicalization

V1 uses a logical release file tree, not raw filesystem metadata.

| Field / Rule | V1 Decision |
|---|---|
| Path root | All paths are relative to the release root. Absolute paths are invalid. |
| Path separator | Always `/`, including on Windows. |
| Path normalization | UTF-8 NFC normalization before ordering and digesting. |
| Path order | Lexicographic byte order after normalization. |
| Case collision | Refuse a release if two paths collide under case-insensitive comparison. |
| File digest | SHA-256 of exact release-build bytes. |
| Line endings | Included in file bytes. Build must normalize if needed; install must not rewrite. |
| Executable bit | Included as `mode`, at least `755` vs `644`. |
| Directory entries | Not hashed as separate entries; directories are inferred from file paths. |
| Symlink | Refused in V1. Add explicit `kind: "symlink"` later only with relative, non-escaping targets. |
| mtime / owner / group | Excluded from runtime identity. |
| Archive digest | Optional `transportDigest`; never the runtime identity. |

Each file entry should include an ownership class:

```json
{
  "path": "bin/fgos",
  "kind": "file",
  "digest": "sha256:...",
  "mode": "755",
  "class": "immutable-entry"
}
```

Initial classes:

| Class | Meaning |
|---|---|
| `immutable-entry` | Public executable entry included in the release. |
| `immutable-runtime` | Runtime implementation/provider file. |
| `immutable-workshop-source` | Canonical skills, agents, or prose shipped with the runtime. |
| `immutable-doc` | Shipped documentation/prose used by users or agents. |
| `metadata` | Manifest or metadata file that participates in release identity. |

Generated workspace projections are not recorded as release-tree files at
their projected workspace paths. The release manifest records their canonical
source material; `ProjectionLedger` records where that material was projected
inside the workspace.

`files` may eventually contain every immutable release file and digest. The
minimum useful fingerprint set is:

- public entry binaries;
- provider descriptors;
- active host entry at `bin/fgos` whether implemented by Node first or Rust
  later;
- legacy Node payload;
- runner;
- adapter metadata/entry;
- init/doctor registries;
- skills, agents, prose source;
- manifest files themselves.

## 6. WorkspaceActivationBinding

Activation is the moment a staged and verified release becomes the runtime
authority for one workspace. V1 uses workspace
`.fgos/installation/activation.json` as a durably published ready binding, not a
symlink and not one repository-wide active pointer.

Minimum fields:

```json
{
  "schemaVersion": 1,
  "repositoryId": "repo_...",
  "workspaceId": "wks_...",
  "workStateId": "state_...",
  "activationId": "act_...",
  "status": "ready",
  "artifactDigest": "sha256:...",
  "releasePath": "<release-store-root>/releases/sha256-...",
  "previousArtifactDigest": "sha256:...",
  "shimVersion": "1",
  "resolvedDependencies": {
    "node": "/usr/bin/node"
  },
  "pinSnapshot": {},
  "activatedAt": "2026-09-04T00:00:00Z",
  "activatedBy": {
    "tool": "fgctl",
    "version": "..."
  }
}
```

Publishing must be atomic from the perspective of invocations. A project
command must see either the previous ready workspace binding or the new ready
workspace binding, never a half-prepared runtime.

`fgctl` must hold the release store `install.lock` before staging, verifying,
repairing, upgrading, rolling back, or quarantining release content. It must
also hold a workspace activation lock before writing that workspace's
`activation.json`. Projection writes are not part of the activation publish;
they belong to local `fgos init` / `fgos doctor --fix` under projection locks
defined by workspace topology.

Implementation should use a temp file plus atomic rename for
`activation.json`:

```txt
write <workspace-root>/.fgos/installation/activation.json.tmp.<activationId>
fsync file when supported
rename tmp -> <workspace-root>/.fgos/installation/activation.json
fsync parent directory when supported
```

The stable shims under `.fgos/installation/bin/` should not change during normal
activation. Activation changes the selected release identity, not the command
path callers use.

`activation.json` should contain only a durably published ready runtime
binding. Do not write `status: "preparing"` into `activation.json`.
Installation/activation transaction state belongs in the release store:

```txt
<release-store-root>/installs/<activationId>.json
```

Possible transaction statuses:

```txt
staging
verified
preparing
ready-published
ready-degraded
complete
failed
quarantined
```

Failure rules:

| Failure Point | `activation.json` | Transaction / Payload Action |
|---|---|---|
| Acquire/stage fails | Unchanged | Mark install transaction failed; remove or keep staged temp for diagnostics. |
| Verify fails | Unchanged | Refuse activation; quarantine or remove staged release. |
| Runtime dependency missing | Unchanged | Refuse activation with `runtime-dependency-missing`. |
| Candidate preflight fails before publish | Unchanged | Mark transaction `failed`; candidate has no writer authority and must not touch host-visible projections. |
| Atomic binding write fails | Previous ready binding remains authoritative if readable | Fail closed; do not run local workflow from candidate. |
| Active local `fgos init` / `doctor --fix` projection tail fails after publish | New ready binding remains authoritative | Mark transaction `ready-degraded`; local doctor reports repair action. |

The important rule is readiness: a candidate release does not gain writer
authority merely because it was staged or verified. It gains writer authority
for a workspace only after the workspace binding is published with
`status: "ready"`.

During preparation, `fgctl` may invoke the candidate release directly with a
restricted bootstrap context:

```txt
FGOS_BOOTSTRAP_CANDIDATE=1
FGOS_CANDIDATE_ARTIFACT_DIGEST=<digest>
FGOS_CANDIDATE_RELEASE_PATH=<path>
```

In that context the candidate may run preflight checks and write only staging
records under the installation transaction. It must not write host-visible
projection paths, execute general workflow mutations, or claim/write shared
work-state as the active runtime.

## 7. Invocation Lease

Any command that mutates project state should lease the workspace/work-state/
runtime identity at invocation start:

```txt
invocation starts
  -> enter stable shim path
  -> read workspace .fgos/installation/activation.json
  -> record workspaceId, workStateId, and artifactDigest in invocation context
  -> run using that release path only
  -> finish with same digest or fail with activation-changed/unknown-completion
```

This prevents activation changes, worktree switches, or nested invocations from
silently changing the runtime authority under a running command.

V1 can be conservative:

- allow `fgctl upgrade/repair` to acquire, stage, and verify while local
  mutating invocations are active;
- refuse publishing a new workspace activation binding while any non-stale
  mutating lease for that workspace is active.

Lease files are scoped by workspace and work-state identity. The exact
lease-root is supplied by `TopologyContext`, normally under
`runtimeCoordinationRoot(workStateId)` with workspace subkeys when needed. It is
not part of the packaging release/activation namespace.

```txt
<lease-root>/<workspaceId>/<invocationId>.json
```

Minimum shape:

```json
{
  "schemaVersion": 1,
  "invocationId": "inv_...",
  "pid": 12345,
  "processStartToken": "...",
  "bootId": "...",
  "startedAt": "2026-09-04T00:00:00Z",
  "expiresAt": "2026-09-04T00:05:00Z",
  "heartbeatAt": "2026-09-04T00:00:10Z",
  "workspaceId": "wks_...",
  "workStateId": "state_...",
  "artifactDigest": "sha256:...",
  "mode": "mutating",
  "command": "fgos pick",
  "parentLeaseId": null,
  "workItemId": "tsk-...",
  "runnerAssignmentId": null
}
```

V1 rules:

- the active release host binary writes leases, not the stable shim;
- mutating local `fgos` commands create a lease before mutating state;
- read-only local `fgos` commands lease the active digest in memory but do not
  block activation;
- local commands run against the leased artifact digest for the whole
  invocation;
- nested local `fgos` invocations inherit `parentLeaseId` through environment
  and must not create independent conflicting lease authority;
- `fgos-runner --watch` must not hold one long mutating lease forever. It
  leases per assignment/work mutation and re-reads workspace `activation.json`
  between assignments;
- commands remove or complete their lease on normal exit;
- `fgctl` may stage and verify a new release while leases exist;
- `fgctl` refuses to publish a new workspace activation binding with
  `runtime-busy` while a non-stale mutating lease exists for that workspace;
- stale lease cleanup is allowed only when ownership is mechanically provable:
  process start token/boot identity proves owner death, or an explicit recovery
  command records completion unknown.

Lease states:

```txt
active
released
owner-dead
expired-unproven
completion-unknown
```

Timeout alone must not silently prove safety for a mutating lease. A lease that
is merely old but whose owner cannot be mechanically proven dead should fail
closed or require explicit recovery.

Default V1 behavior is refuse, not wait. Waiting can be added later, but a
clear `runtime-busy` failure is easier to reason about and safer during the
first Rust CLI/distribution slice.

## 8. Pin

The pin records desired selection policy. It does not prove what is active. In
V1 the pin is tracked project state at:

```txt
.fgos/distribution.json
```

This is intentionally outside ignored machine-local runtime areas so a clone or
teammate receives the same branch/project runtime policy.

Possible shape:

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

Supported policies can start small:

- `exact-digest`;
- `exact-version`;
- later `channel`.

For safety, the workspace activation binding should snapshot the pin used
during activation.

If the pin exists but its requested release is not present in the release store
root, the workspace is `pinned-not-staged`. `fgctl init` must acquire the
pinned release instead of selecting latest.

## 9. ProjectionLedger

Host-visible projections are not immutable release files. They are generated
workspace material derived from the active runtime.

Examples:

```txt
.agents/skills/*
.claude/skills/*
AGENTS.md managed blocks
other host-specific instruction/prose entry points
```

Projection ledgers are workspace-scoped. They live with the workspace installation
area, not in one shared release-store ledger:

```txt
<workspace-root>/.fgos/installation/projections/ledger.json
```

Each projected path needs an ownership class:

| Ownership | Meaning | Repair Policy |
|---|---|---|
| `projection-owned` | fgOS generated this whole file/path. | May replace if current file matches last materialized digest; otherwise report drift and require explicit repair. |
| `managed-block` | fgOS owns only a marked block inside a user/source file. | May update that block if markers and baseline match. |
| `source-owned` | File is authored by the product/source repo. | Never overwrite automatically. |
| `coexistence-refuse` | Another harness/tool owns or conflicts with the path. | Do not write; report required human decision. |

Projection drift should use a three-way comparison:

```txt
runtime source digest
last materialized digest
current workspace file digest
```

Materialization timing:

```txt
fgctl init
  -> install/activate runtime
  -> invoke active local fgos init

local fgos init
  -> create/update ProjectionLedger
  -> materialize required projections for the current host/workspace

local fgos doctor
  -> report projection drift

local fgos doctor --fix
  -> repair only safe projection-owned or managed-block drift
```

`fgctl` must not write host-visible projection files directly. It may install
and activate the runtime, then invoke local `fgos init` under that active
runtime identity. The local runtime owns projection semantics because
projection paths, host compatibility, and workshop material may vary by fgOS
release.

Minimum projection ledger entry:

```json
{
  "schemaVersion": 1,
  "workspaceId": "wks_...",
  "workStateId": "state_...",
  "path": ".agents/skills/example/SKILL.md",
  "ownership": "projection-owned",
  "source": {
    "artifactDigest": "sha256:...",
    "path": "workshop/skills/example/SKILL.md",
    "digest": "sha256:..."
  },
  "lastMaterializedDigest": "sha256:...",
  "currentDigestAtLastCheck": "sha256:...",
  "policy": {
    "repair": "safe-if-unchanged",
    "packageSurface": "exclude"
  }
}
```

Repair rules:

| Ownership | `init` Behavior | `doctor` Behavior | `doctor --fix` Behavior |
|---|---|---|---|
| `projection-owned` | Create if absent; replace only when current file matches last materialized digest. | Report missing/drift/conflict. | Replace if unchanged from baseline; otherwise refuse and report conflict. |
| `managed-block` | Create/update marked block if markers are healthy. | Report marker drift or block drift. | Replace only managed block when markers/baseline match. |
| `source-owned` | Do not overwrite. | Report if expected projection cannot be materialized because source owns path. | Never overwrite. |
| `coexistence-refuse` | Do not write. | Report external ownership/conflict. | Never overwrite. |

Self-development uses the same ownership classes. The forgent source repo must
not be treated as a nested product install or receive blanket generated-file
overwrites. Any path that is source-authored in the product tree must be marked
`source-owned` or protected by an explicit managed-block/projection policy.

## 10. MigrationJournal

Runtime rollback is not automatically state rollback.

The migration journal records state-schema changes made by local `fgos`:

```json
{
  "schemaVersion": 1,
  "migrationId": "mig_...",
  "fromStateSchema": "1",
  "toStateSchema": "2",
  "runtimeArtifactDigest": "sha256:...",
  "startedAt": "...",
  "finishedAt": "...",
  "checkpoint": "...",
  "reversible": false
}
```

Downgrade safety must consider state-schema readability/writability, not only
version order.

Rule:

```txt
fgctl may activate an older runtime only if that runtime declares it can read
the current state schema and the requested operation does not require writes
the runtime cannot perform.
```

V1 does not perform automatic state migration during `fgctl upgrade` or
rollback. If the target runtime cannot read the current project state schema,
activation must fail with `state-schema-incompatible`. If the target runtime
can read but cannot write the current schema, activation may be allowed only
for read-only diagnostic use; mutating local `fgos` commands must refuse with
`state-schema-write-incompatible`.

The current project state schema must be recorded outside the immutable
runtime payload, for example:

```txt
<workHistoryRoot(workStateId)>/schema.json
```

Possible shape:

```json
{
  "schemaVersion": 1,
  "workStateId": "state_...",
  "currentStateSchema": "1",
  "lastWriterArtifactDigest": "sha256:..."
}
```

Compatibility checks:

```txt
fgctl activate/upgrade/rollback
  -> read target ReleaseManifest.stateSchemas.read
  -> read project currentStateSchema
  -> refuse activation unless target can read currentStateSchema

local mutating fgos command
  -> lease active artifact digest
  -> read active ReleaseManifest.stateSchemas.write
  -> read work-state currentStateSchema
  -> verify workStateId matches the resolved work-state root
  -> refuse mutation unless active runtime can write currentStateSchema
```

If two workspaces with different active artifact digests share one
`workStateId`, both may write only if both active release manifests declare
compatible write support for the current work-state schema and coordination
locks/claims permit the operation. Otherwise the runtime must refuse mutation
instead of relying on branch-local activation alone.

Migration remains explicit future work. When introduced, each migration must be
declared by the release manifest and recorded in `MigrationJournal` with
checkpoint/reversibility facts.

### Existing Project Adoption

V1 must adopt existing fgOS projects. A fresh design that only works on an
empty project is not enough because real projects already have legacy
`.fgos/events.jsonl`, `.fgos/events/`, `.fgos/config.json`, and coordination
state but no release store, no workspace `activation.json`, and no work-state
schema record.

Legacy/adoption physical shape:

```txt
<existing-main>/.fgos/events*
```

Canonical V1 logical root:

```txt
workHistoryRoot(workStateId)
```

Packaging must not hardcode the legacy physical layout. It asks
`resolveTopology()` for `workHistoryRoot(workStateId)` and lets work-state
architecture own migration/import from legacy paths.

Adoption rule:

```txt
fgctl init on existing .fgos/
  -> preserve/import existing eventlog/config/claim state through TopologyContext
  -> acquire/stage/activate runtime from tracked pin or selected source
  -> invoke active local fgos init
  -> if work-state schema record is missing, local fgos init writes schema "1"
  -> run bootstrap-safe doctor --fix
  -> run doctor
```

Missing schema record means "legacy schema 1" for V1, not "unknown, refuse".
This keeps existing projects adoptable without automatic migration.

### Dev / Source Activation

fgOS self-development needs a dogfood path that does not require nested repos
and does not pretend a source checkout is an immutable release.

V1 supports an explicit dev activation kind:

```txt
artifactDigest: dev:<sourceRevisionOrWorktreeId>
activationKind: dev-source
activeReleasePath: <source checkout path>
distributable: false
```

Dev activation rules:

- must be explicit; never selected as an accidental PATH fallback;
- skips immutable release file digest guarantees;
- still reports runtime identity as `dev:*`;
- still uses the same command authority, work-state root, projection ownership,
  and state-schema compatibility rules;
- is not valid for a distributable install package.

This preserves dogfood without turning dogfood into the product mission and
without solving self-development by nesting a product repo inside a workshop
repo.

## 11. Drift, Repair, Rollback, And Quarantine

Drift classes:

| Drift | Detector | Allowed Automatic Action |
|---|---|---|
| Immutable release file digest mismatch | `fgctl verify` or local `fgos doctor` reporting active identity | Quarantine/refuse. Do not patch individual release files. |
| Projection differs from generated baseline | local `fgos doctor` | `doctor --fix` may repair only when ownership and three-way comparison allow it. |
| Managed config differs from default | local `fgos doctor` | Schema-aware merge if registered as safe. |
| Mutable state/log/cache differs | N/A | Excluded from release drift. |

`fgctl init`, `fgctl repair`, and `fgctl upgrade` use one pipeline:

```txt
select/acquire release
  -> stage
  -> verify
  -> run candidate preflight without host-visible projection writes
  -> ensure workspace installation capsule and stable shims
  -> publish workspace activation binding as ready
  -> invoke active local fgos init
  -> invoke active local fgos doctor --fix
  -> invoke active local fgos doctor
```

They differ by selection input, not by having separate repair semantics. The
transaction reaches `complete` only after the active local init/fix/check tail
finishes. If the post-publish tail fails, the new binding remains authoritative
but the transaction is `ready-degraded` and local doctor reports the needed
repair. Candidate preflight failure before publish leaves the previous
workspace activation binding authoritative and gives the candidate no writer
authority.

Local `fgos doctor --fix` may not change active runtime identity or patch
immutable release files. Runtime repair stays `fgctl` authority.

Rollback unit:

```txt
ActivationRecord.previousArtifactDigest
  + preserved release directory
  + state-schema compatibility check
```

If rollback cannot safely write current state, it may still allow read-only
diagnostics if the old runtime declares read compatibility.

Quarantine rule:

```txt
If an immutable release payload fails identity verification, move or mark it as
quarantined and refuse activation/use until `fgctl repair` reacquires a trusted
artifact.
```

## 12. Command Authority Matrix

| Command | May Change Runtime Identity | May Change Workspace Config/State | May Materialize Projections | Notes |
|---|---:|---:|---:|---|
| `fgctl init` | Yes | Indirectly, by invoking active local `fgos init` after publishing ready binding | Indirectly after activation | One-command onboarding orchestrator; installs stable local shims if missing. Candidate preflight before publish must not write host-visible projections. |
| `fgctl repair` | Yes | Indirectly, through the same active init/fix/check tail | Indirectly after activation | Reacquires/repairs runtime payload, publishes ready binding, then repairs projections/config through local fgos. |
| `fgctl upgrade` | Yes | Indirectly, through the same active init/fix/check tail; no automatic state migration in V1 | Indirectly after activation | Must verify state-schema compatibility before publishing ready binding. |
| local `fgos init` | No | Yes | Yes | Adopts workspace under active runtime identity. |
| local `fgos doctor` | No | No | No | Read-only report. |
| local `fgos doctor --fix` | No | Yes, only registered safe fixes | Yes, only safe projection repair | Must not patch release payload files. |
| local workflow verbs | No | Yes | No, unless explicitly part of operation | Must lease active runtime identity. |

## 13. `fgctl` Form And V1 Acquisition Sources

V1 `fgctl` is a Rust bootstrap binary. It may be built from the same source
tree as the future Rust host, but its authority is different: machine/project
runtime control, not project workflow semantics.

V1 acquisition sources:

- local release tree path, for development/proof;
- local tarball/archive plus release tree manifest;
- GitHub release asset plus authenticated or pinned expected release tree
  manifest digest.

The first walking skeleton should not wait for the Rust host to replace local
`fgos`. V1 can ship:

```txt
fgctl = Rust bootstrap/control binary
release bin/fgos = existing Node host or thin Node entry
release bin/fgos-runner = existing Node runner
release libexec/legacy-node = compatibility payload if needed
```

Later, Rust host replaces release `bin/fgos` inside the same release tree
contract. Packaging does not need to change for that swap.

`doctor --fix` during `fgctl init` runs after the ready binding is published,
through the active local `fgos`. Candidate preflight before publish is
read-only or staging-only and must not write host-visible projections. General
repair remains explicit.

## 14. Walking Skeleton

The first proof slice should be deliberately small:

```txt
fgctl reads tracked .fgos/distribution.json or explicit source
fgctl resolves TopologyContext:
  repositoryId, workspaceId, workStateId,
  machineReleaseStore, workHistoryRoot, runtimeCoordinationRoot,
  workspace installation root
fgctl acquires install.lock
fgctl obtains a release payload
fgctl stages release under machineReleaseStore/releases/<artifactDigest>/
fgctl verifies ReleaseManifest
fgctl verifies runtime dependencies such as Node when required
fgctl runs candidate preflight without host-visible projection writes
fgctl ensures stable local shim exists at .fgos/installation/bin/fgos
fgctl publishes workspace .fgos/installation/activation.json with status ready
fgctl invokes active local fgos init / doctor --fix / doctor
.fgos/installation/bin/fgos version --runtime-json resolves activation.json and reports:
  project root
  workspaceId
  workHistoryRoot
  workStateId
  machineReleaseStore
  active artifact digest
  release version
  manifest schema
  state schema read/write range
  legacy Node payload identity
  host implementation kind: node | rust | dev-source
```

This proof does not need shared gateway/web. It only needs to prove that the
Rust `fgctl`, stable local shim, and local `fgos` payload can agree on runtime
identity. The first release tree may use the existing Node `fgos` host; Rust
`fgos` can replace it later without changing packaging shape.

## 15. Open Decisions

1. Exact path encoding for the workspace installation capsule once
   `TopologyContext` supplies the workspace roots.
2. Exact release directory name: digest-only, version-plus-digest, or both.
3. Exact stable shim implementation: Rust binary, shell/PowerShell script, or
   platform-specific launcher. Host-invocation stream recommendation
   (2026-09-10): a POSIX `sh` script (plus `.cmd` on Windows) for V1 — it must
   exist before any Rust binary runs, `fgctl` can write it, and a person can
   read it; a Rust shim only if a target lacks `sh` or the script's cost is
   measured to matter.
4. Exact `fgctl` acquisition UX for local path, tarball, and GitHub release
   asset.
5. Which candidate preflight checks are required before publishing activation.
6. How long old release directories are retained and how GC respects leases
   and rollback references.
7. Exact quarantine location and user recovery command.
