# Phase 2 Copy Point

- **Branch**: `component-authority/p02`
- **Base Commit**: `07971a3e56c539625be42a85d7e7681bedcf6ed2`
- **Copy Point Commit**: Commit of this phase on branch `component-authority/p02` (created by the runner upon round completion)
- **Source Manifest Path**: `docs/architecture-manifest.json`
- **Source Manifest Blob SHA**: `1f294728e2019a7107f2451d42eb4ad1a131b094`
- **Reconcile Anchor**: The reconcile anchor is the manifest blob `1f294728e2019a7107f2451d42eb4ad1a131b094` (unchanged on main at phase 2's base `07971a3e5`); phase 7 diffs the manifest from that blob.
- **Target Model Directory**: `packages/component-authority/model/`
  - `packages/component-authority/model/layers.json`
  - `packages/component-authority/model/tiers.json`
  - `packages/component-authority/model/files.json`
  - `packages/component-authority/model/doors/` (83 door definition files)
  - `packages/component-authority/model/components.json`

## Purpose

The reconcile anchor is the manifest blob `1f294728e2019a7107f2451d42eb4ad1a131b094` (unchanged on main at phase 2's base `07971a3e5`); phase 7 diffs the manifest from that blob.
Phase 7 will reconcile from this copy point against any changes made to `docs/architecture-manifest.json` by sibling plans (e.g. `261122-0118-heads-stable-and-able`).
Any delta between this blob SHA and the manifest at the start of Phase 7 will be reconciled into `packages/component-authority/model/` before `docs/architecture-manifest.json` is deleted in Phase 7.
