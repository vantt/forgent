# Runtime Identity And Activation

```txt
Document type: Architecture
Audience: Architect, maintainer, implementation agent
Purpose: Explain the target runtime identity and activation model for packaging-distribution
Design status: Draft
Implementation status: Implemented preview plus projection/worker-capsule partials
Canonical: Yes, after review
Owner: Platform documentation
Source type: Promoted from docs/architect/packaging-distribution/runtime-identity-and-activation.md
Last reviewed: 2026-09-18
Related:
- docs/architect/workspace-topology.md
- docs/platform/packaging-distribution/spec.md
- docs/platform/packaging-distribution/verification/implementation-alignment.md
Implementation: Original section-specific implementation statements retained; carriage is pending independent review
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
```

## 1. Core Position

fgOS project commands should run from a workspace-selected runtime, not from whichever executable happens to appear first on `PATH`.

```txt
fgctl
  -> acquire/stage/verify release
  -> prepare workspace installation
  -> publish workspace activation
  -> invoke active local fgos repair/init path when needed

local fgos
  -> run project workflow semantics
  -> materialize project-visible projections
  -> respect state-schema compatibility
```

Target command vocabulary has no separate `fgos setup` verb. One-command
onboarding belongs to `fgctl init`; after activation the active local runtime
tail is local `fgos init`, `fgos doctor --fix`, and `fgos doctor`. Current Node
`fgos setup` is legacy compatibility until retired, not target architecture.

## 2. Ownership Split

| Owner | Owns | Does not own |
| --- | --- | --- |
| `fgctl` | Bootstrap, release acquisition, staging, verification, activation, repair, upgrade. | Project workflow semantics after activation. |
| local `fgos` | Project commands under the active runtime. | Selecting a different runtime identity. |
| Release store | Immutable verified release payloads. | Mutable project/work-state history. |
| Workspace installation root | Activation binding, stable shims, projection ledger. | Shared release payload storage or work-state history. |

## 3. Runtime Identity

Runtime identity is digest-based. `artifactDigest` identifies the canonical release manifest/tree, not the compressed archive checksum and not a local filesystem path.

This supports:

- repeatable verification;
- shared content-addressed release stores;
- workspace-specific activation;
- safe compatibility payload execution;
- upgrade/repair that can reason about exactly which runtime is active.

## 4. Workspace Activation

The activation binding is workspace-local:

```txt
.fgos/installation/activation.json
```

The binding selects a ready runtime for that workspace. Multiple worktrees may share release content while using different activation bindings.

Implementation status is implemented preview: activation files are exercised by
Rust tests, external-consumer proof, and frozen V1 contract docs. The remaining
partial work in this architecture is not activation itself; it is wider
projection-ledger coverage and worker-capsule layout proof.

## 5. Stable Command Surface

The stable local command surface is:

```txt
.fgos/installation/bin/fgos
.fgos/installation/bin/fgos-runner
```

Callers should not need to know the active release path. The shim/binary resolves the active release through the workspace installation state.

## 6. Release Tree

A release tree has at least:

```txt
bin/fgos
bin/fgos-runner
libexec/legacy-node/
manifest.json
```

The Rust host can execute the native `bin/fgos`, while the legacy Node payload remains staged under `libexec/legacy-node/` for compatibility.

## 7. Projection Boundary

`fgctl` should not directly write host-visible generated projections such as `.agents/skills`, `.claude/skills`, or managed instruction blocks.

Those writes belong to the active local `fgos` after activation. P7 proves
`fgctl` does not write host-visible projections directly. P5 proves the current
portable instruction projection path through local setup/doctor registry code;
skill projections and future host adapters still need their own ledger coverage
before the projection boundary is fully implemented.

## 8. Repair And Upgrade

`fgctl upgrade` changes the workspace activation to another release when supplied. `fgctl repair` repairs the workspace installation surface for the selected model.

Local `fgos doctor --fix` repairs project/runtime readiness under the active identity. It must not become a hidden runtime selector.

## 9. Future Gateway Constraint

A future shared gateway/dashboard may manage many projects, but it should call project-local runtime adapters instead of becoming a global fgOS runtime. This is a constraint, not current delivery scope.

## 10. Implementation Alignment

See `../verification/implementation-alignment.md`. Do not promote the remaining
projection-ledger, worker-capsule, or future gateway constraints without
updating that table.


## Retained Runtime Identity And Activation Source Detail

Added in candidate — complete source units from `docs/architect/packaging-distribution/runtime-identity-and-activation.md` at `77830ba77eb05991d95b005919776ee6254e833b`. Source design, dated status and obligations are preserved here; this carriage does not certify current implementation. Relative links retain their destination.

### Runtime Identity And Activation

```txt
Legacy status: Promoted architecture/contract source
Promoted to:
- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
- docs/platform/packaging-distribution/contracts/release-manifest.md
- docs/platform/packaging-distribution/contracts/activation-binding.md
- docs/platform/packaging-distribution/contracts/distribution-pin.md
Current reader entry: docs/platform/packaging-distribution/README.md
Use this legacy file for: Source detail until contract extraction is complete
Do not use this legacy file for: Current implementation status without checking implementation alignment
Last reviewed: 2026-09-13
```

> Status: historical redirect. The active promoted runtime docs are
> [runtime-identity-and-activation.md](runtime-identity-and-activation.md),
> [repository-runtime-layout.md](../contracts/repository-runtime-layout.md),
> [release-manifest.md](../contracts/release-manifest.md),
> [activation-binding.md](../contracts/activation-binding.md),
> [distribution-pin.md](../contracts/distribution-pin.md),
> and [fgctl-and-local-fgos.md](fgctl-and-local-fgos.md).
> Keep this file only as detailed source context.

**Status:** Historical architecture contract draft.
**Date:** 2026-09-04.
**Scope:** Project-local fgOS runtime identity, release records, per-workspace
activation binding, pinning, drift, rollback, quarantine, and the minimum
command boundary needed for packaging/distribution and the Rust `fgos` CLI.

This document was the first contract draft before promotion into
`docs/platform/packaging-distribution/**`. It deliberately kept shared
gateway/web as a future constraint, not active delivery scope.

#### How To Use This Document

This document is intentionally detailed historical source context. Use the
promoted platform docs as the working contract for new changes.

Read it in layers:

1. Read [Workspace Topology Architecture](../../system-architecture/architecture/workspace-topology.md) first for root
   topology, state classes, worktree behavior, and dirty-tree rules.
2. Read the promoted
   [runtime identity architecture](runtime-identity-and-activation.md)
   for current runtime identity language.
3. Read the promoted contracts for
   [repository layout](../contracts/repository-runtime-layout.md),
   [activation binding](../contracts/activation-binding.md),
   [distribution pin](../contracts/distribution-pin.md),
   and [release manifest](../contracts/release-manifest.md).
4. Use the remaining sections here only to recover historical rationale or
   details that the preservation audit points to.

#### Historical Decisions Promoted Or Tracked

#### 1. Core Position

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

#### 2. Runtime Lifecycle

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

#### 4. Record Types

Do not collapse all runtime facts into one ledger. Use separate records with
separate authority.

| Record | Mutability | Owner | Purpose |
|---|---|---|---|
| `ReleaseManifest` | Immutable, publisher-produced | Release build/publisher | Declares artifact identity, file digests, binaries, adapter contract, capabilities, state-schema compatibility, dependency closure. |
| `WorkspaceActivationBinding` | Mutable, workspace-local | `fgctl` | Declares which release digest is ready for this workspace, plus workspace/work-state/repository identity, activation transaction, timestamp, and status. |
| `Pin` | Mutable, git-tracked project policy | Semantic owner: packaging/distribution. Canonical writer: `fgctl`. External edits are tolerated input and validated fail-closed. | Declares desired version/channel/digest policy in `.fgos/distribution.json`. Selection input, not runtime proof. |
| `ProjectionLedger` | Mutable, project-local | local `fgos init` / `fgos doctor --fix` under active identity | Records host-visible generated/projection paths, source digest, last materialized digest, ownership class, and repair policy. |
| `MigrationJournal` | Append-only, project-local | local `fgos` under active identity | Records state-schema migration epoch, checkpoints/backups, reversibility, and compatibility facts. |

#### 11. Drift, Repair, Rollback, And Quarantine

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

#### 14. Walking Skeleton

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

#### 15. Open Decisions

The `rust-host-r1-kernel` track (`plans/260910-1700-rust-host-r1-kernel/plan.md`,
Decisions table, 2026-09-10) fixes V1 defaults for every item below so its
`fgctl` cells can execute; a default becomes settled here only when the track's
proof lands, and any override is recorded there first.

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

## Dev Source Activation Restoration Stub

Added in candidate — not carried; restoration tracked by dropped-001 and Plan C.

Restoration owner: Plan C (`plans/261006-1445-fgctl-dev-activation/`, draft, unscheduled). This is an explicit deferral of the seven source units, not an implementation or retirement verdict. The six units under Dev / Source Activation and the dev-source clause in the compound settled-facts table remain tracked in the source register. All other clauses of that table are retained below without promoting dev activation.

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
| Dev / source activation restoration is tracked by dropped-001 and Plan C. | Deferred; not carried in this candidate. |
| `fgctl` V1 is a Rust bootstrap binary with local path/tarball and GitHub release asset as acquisition sources. | Settled for V1. |
| Candidate preflight is static: `fgctl` never executes candidate release code before the ready binding is published. | Settled for V1 (P7 red-team fix, 2026-09-14). |
| Shared gateway/web are architecture constraints only, not active delivery scope. | Promoted for active delivery. |
