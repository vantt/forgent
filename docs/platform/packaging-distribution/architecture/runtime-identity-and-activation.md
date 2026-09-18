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
