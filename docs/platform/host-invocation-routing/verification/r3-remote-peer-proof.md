# Verification: R3 Remote Peer Proof

```txt
Document type: Verification
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Preserve the proof gate for production remote peer adoption
Design status: Draft
Implementation status: Planned
Canonical: Yes, after review
Owner: Host invocation
Source type: Promoted from docs/architect/host-invocation-routing/node-to-rust-component-migration.md and rust-cli-and-proof-components-plan.md
Last reviewed: 2026-09-14
Related:
- docs/platform/host-invocation-routing/architecture/host-use-cases.md
- docs/platform/host-invocation-routing/architecture/release-boundaries.md
```

## 1. Required Proof

R3 proves at least one production gateway route as a true peer invocation: remote projector/presenter calls the shared invocation service, preserves gateway auth and transport contracts, and neither shells through CLI/Node nor parses `fgos.v1` internally.

## 2. Remaining Legacy Routes

Untouched routes may stay on the old adapter during a named rollback window, but they must remain visible with a consumer list. Delete the `VerbGateway` chokepoint only after its consumer list is empty.

## 3. Related Files

| Relationship | File |
| --- | --- |
| host use cases | [../architecture/host-use-cases.md](../architecture/host-use-cases.md) |
| release boundaries | [../architecture/release-boundaries.md](../architecture/release-boundaries.md) |
| source migration | [../../../architect/host-invocation-routing/node-to-rust-component-migration.md](../../../architect/host-invocation-routing/node-to-rust-component-migration.md) |

