# Architecture: Node To Rust Migration

```txt
Document type: Architecture
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Preserve the selected Node-to-Rust migration sequence and constraints
Design status: Draft
Implementation status: Planned
Canonical: Yes, after review
Owner: Host invocation
Source type: Promoted from docs/architect/host-invocation-routing/node-to-rust-component-migration.md
Last reviewed: 2026-09-14
Related:
- docs/platform/host-invocation-routing/architecture/release-boundaries.md
- docs/platform/host-invocation-routing/verification/r1-rust-host-proof.md
```

## 1. Selected Direction

The selected direction is Rust host first, with Node as legacy payload/lane until each complete component or use-case boundary is ready to move. Repository-wide Node thinning first and big-bang rewrite are rejected.

## 2. Migration Rules

- Preserve current commands, `fgos.v1`, errors, state authority, install behavior, and rollback until each replacement is proven.
- Migrate complete operation/use-case boundaries rather than private helpers.
- Read-only operations come before complex writers.
- Never dual-run a write for shadow comparison.
- A native provider never blocks on human input; it returns `parked`.
- Node removal follows zero remaining routes and proof, not a calendar date.

## 3. Readiness Categories

The old source's near-thin, partly-thin, and not-thin command lists are preserved in [../history/host-invocation-baseline.md](../history/host-invocation-baseline.md). They are ordering signals and need a fresh implementation scan before execution.

## 4. Implementation Alignment

| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| Rust host first is selected. | `accepted-not-implemented` | [source migration §2](../../../architect/host-invocation-routing/node-to-rust-component-migration.md#2-options-considered) | Execute P0-P6. |
| Read models before writers. | `planned` | [source migration §10](../../../architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers) | Future work-read proof. |
| Writer migration has atomicity/replay/mutual-exclusion gates. | `planned` | [source migration §11](../../../architect/host-invocation-routing/node-to-rust-component-migration.md#11-migrate-state-writing-components) | Future writer proof. |

## 5. Related Files

| Relationship | File |
| --- | --- |
| release boundaries | [release-boundaries.md](release-boundaries.md) |
| R1 proof | [../verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md) |
| source migration | [../../../architect/host-invocation-routing/node-to-rust-component-migration.md](../../../architect/host-invocation-routing/node-to-rust-component-migration.md) |

