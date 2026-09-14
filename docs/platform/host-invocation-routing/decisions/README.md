# Host Invocation Decisions

```txt
Document type: Decisions index
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Route readers to accepted host-invocation decisions and keep future ADRs separate from vision and preservation records
Design status: Draft
Implementation status: Active
Canonical: Yes, after review
Owner: Host invocation
Source type: Created during host-invocation documentation migration
Last reviewed: 2026-09-14
Related:
- docs/platform/host-invocation-routing/README.md
- docs/platform/host-invocation-routing/vision.md
- docs/platform/host-invocation-routing/intent-preservation-ledger.md
- docs/platform/host-invocation-routing/verification/implementation-alignment.md
```

## 1. Current Decision Record

No area-local ADR has been promoted into this directory yet.

Accepted direction that already exists in the legacy sources is preserved in [../intent-preservation-ledger.md](../intent-preservation-ledger.md), explained as target intent in [../vision.md](../vision.md), and checked against implementation in [../verification/implementation-alignment.md](../verification/implementation-alignment.md). Those files keep the migration safe, but future settled decisions should be written here as explicit decision records when the area needs an ADR-style artifact.

## 2. Decision Placement Rule

A future host-invocation decision belongs here when it changes or locks one of these concerns:

- host invocation ownership, peer-host behavior, or public host semantics;
- provider routing, operation catalog ownership, authority, replacement, or failure policy;
- external process/WASM provider protocol compatibility;
- Rust host migration gates that become durable area policy;
- legacy CLI compatibility policy after a proof gate closes.

A fact that only describes current behavior belongs in [../spec.md](../spec.md). A proof snapshot belongs in [../verification/](../verification/README.md). A source-preservation note belongs in [../history/source-inventory.md](../history/source-inventory.md) or [../verification/source-preservation-audit.md](../verification/source-preservation-audit.md).

## 3. Related Files

| Relationship | File |
| --- | --- |
| area portal | [../README.md](../README.md) |
| vision | [../vision.md](../vision.md) |
| preservation ledger | [../intent-preservation-ledger.md](../intent-preservation-ledger.md) |
| implementation alignment | [../verification/implementation-alignment.md](../verification/implementation-alignment.md) |
| source audit | [../verification/source-preservation-audit.md](../verification/source-preservation-audit.md) |
