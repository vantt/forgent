# Workspace Runtime Model

```txt
Legacy status: Superseded pointer
Superseded by:
- docs/architect/workspace-topology.md
- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
Current reader entry: docs/platform/packaging-distribution/README.md
Use this legacy file for: Redirect only
Do not use this legacy file for: Current model detail
Last reviewed: 2026-09-13
```

> Status: historical redirect. Active topology remains
> [docs/architect/workspace-topology.md](../workspace-topology.md), while active
> packaging-distribution runtime records live under
> [docs/platform/packaging-distribution/](../../platform/packaging-distribution/README.md).
> Keep this file only as the old pointer that explains the split.

**Status:** Moved.
**Date:** 2026-09-04.

Workspace/runtime/work-state topology is broader than packaging/distribution.
The canonical architecture document is now:

[Workspace Topology Architecture](../workspace-topology.md)

Packaging/distribution consumes that topology for release store placement,
workspace activation binding, projection ledger scope, leases, and dirty-tree
rules. Do not update this file with new topology decisions; update
`docs/architect/workspace-topology.md` instead.
