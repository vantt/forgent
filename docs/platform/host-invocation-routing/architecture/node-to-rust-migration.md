# Architecture: Node To Rust Migration

```txt
Document type: Architecture
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Preserve the selected Node-to-Rust migration sequence and constraints
Design status: Draft
Implementation status: R1/R2/R3 implemented preview plus remaining component migrations
Canonical: Yes, after review
Owner: Host invocation
Source type: Promoted from docs/architect/host-invocation-routing/node-to-rust-component-migration.md
Last reviewed: 2026-09-18
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
| Rust host first is selected. | `implemented preview` | [source migration §2](../../../architect/host-invocation-routing/node-to-rust-component-migration.md#2-options-considered), [../verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md), [../../../../apps/fgos/src/main.rs](../../../../apps/fgos/src/main.rs) | Preview Rust host exists and is the installed/default preview entry. Stable/default graduation remains a release-owner decision. |
| Read models before writers. | `current partial` | [source migration §10](../../../architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers), [../../../../packages/distribution/rust/src/lib.rs](../../../../packages/distribution/rust/src/lib.rs), [../../../../packages/work-state/rust/src/lib.rs](../../../../packages/work-state/rust/src/lib.rs), [../verification/r3-remote-peer-proof.md](../verification/r3-remote-peer-proof.md) | `version`, `gate-bypass`, and remote `/runtime` are read proofs. Future read routes should migrate before writes. |
| Writer migration has atomicity/replay/mutual-exclusion gates. | `planned` | [source migration §11](../../../architect/host-invocation-routing/node-to-rust-component-migration.md#11-migrate-state-writing-components) | Future writer proof. |

## 5. Related Files

| Relationship | File |
| --- | --- |
| release boundaries | [release-boundaries.md](release-boundaries.md) |
| R1 proof | [../verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md) |
| source migration | [../../../architect/host-invocation-routing/node-to-rust-component-migration.md](../../../architect/host-invocation-routing/node-to-rust-component-migration.md) |
