# Phase 2 Copy Point

- **Branch**: `component-authority/p02`
- **Base Commit**: `07971a3e56c539625be42a85d7e7681bedcf6ed2`
- **Copy Point Commit**: Commit of this phase on branch `component-authority/p02` (created by the runner upon round completion)
- **Source Manifest Path**: `docs/architecture-manifest.json`
- **Source Manifest Blob SHA**: `1f294728e2019a7107f2451d42eb4ad1a131b094`
- **Target Model Directory**: `packages/component-authority/model/`
  - `packages/component-authority/model/layers.json`
  - `packages/component-authority/model/tiers.json`
  - `packages/component-authority/model/files.json`
  - `packages/component-authority/model/doors/` (83 door definition files)
  - `packages/component-authority/model/components.json`

## Purpose

Phase 7 will reconcile from this copy point against any changes made to `docs/architecture-manifest.json` by sibling plans (e.g. `261122-0118-heads-stable-and-able`).
The source manifest blob copied into the model in Phase 2 has Git blob SHA `1f294728e2019a7107f2451d42eb4ad1a131b094`.
Any delta between this blob SHA and the manifest at the start of Phase 7 will be reconciled into `packages/component-authority/model/` before `docs/architecture-manifest.json` is deleted in Phase 7.
