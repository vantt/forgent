# Work State

```txt
Document type: Area portal
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Route readers through the documents of the work-state area and point to the legacy sources they are drawn from
Design status: Accepted at atomic cutover
Last reviewed: 2026-10-06
Related:
- docs/platform/work-state/README.md
- docs/platform/work-state/spec.md
- docs/platform/work-state/contracts/cli-io-contract.md
- docs/platform/work-state/architecture/implementation-pointers.md
- docs/platform/work-state/decisions/retired-decision-history.md
- docs/platform/work-state/history/multi-role-harness-distill-record.md
Provenance: `docs/specs/work-state.md` at `8c4d3280eb8893acca785e27285fadecb12a4ba6`
- docs/platform/vision.md
Implementation: Carried source material; current implementation truth unverified
Provenance: `docs/specs/work-state.md` at `947dc310396071a4d530216d5c06d05993d63bf5`
Writer type: Original writer attribution not recorded; retained source provenance
Canonical for: The stated document scope; source implementation limits remain explicit
Use this when: Route readers through the documents of the work-state area and point to the legacy sources they are drawn from
Do not use this for: Authority beyond the declared scope or implementation truth without the cited verification
Supersedes: The mapped source location; source provenance is retained
Superseded by: None recorded
```

## 1. Purpose And Audience

This portal owns work-state navigation, not a second state contract. Read [spec.md](spec.md) and the exact contracts below. The retained root [CLI I/O contract](contracts/cli-io-contract.md) keeps its declared envelope/exit authority. Source coordinate (provenance only; not a reader destination): `docs/specs/work-state.md` at `8c4d3280eb8893acca785e27285fadecb12a4ba6`.

## 2. Read First

| Reader goal | Read |
| --- | --- |
| Find state and CLI I/O owners | [spec.md](spec.md); [CLI I/O contract and root I/O authority](contracts/cli-io-contract.md) |
| Review schema/event evolution before changing a field or verb | [ADR 0007](decisions/retired-decision-history.md#0007--tiến-hoá-schema--event) |
| Open the behavior spec | [spec.md](spec.md) |
| Open the scoped CLI input/output contract | [contracts/cli-io-contract.md](contracts/cli-io-contract.md) |
| Open the candidate implementation pointers | [architecture/implementation-pointers.md](architecture/implementation-pointers.md) |
| Open the candidate retired decision history | [decisions/retired-decision-history.md](decisions/retired-decision-history.md) |
| Open the candidate harness distill record | [history/multi-role-harness-distill-record.md](history/multi-role-harness-distill-record.md) |

## 3. Document Map

| Document | Kind |
| --- | --- |
| [spec.md](spec.md) | Spec |
| [contracts/cli-io-contract.md](contracts/cli-io-contract.md) | Contract |
| [Knowledge registry state](contracts/knowledge-registry.md) | Maintained identity, lifecycle, role and attestation contract |
| [Non-transitioning records](contracts/non-transitioning-records.md) | Decision/outcome precedent |
| [architecture/implementation-pointers.md](architecture/implementation-pointers.md) | Architecture |
| [decisions/retired-decision-history.md](decisions/retired-decision-history.md) | Decision |
| [history/multi-role-harness-distill-record.md](history/multi-role-harness-distill-record.md) | History |

## 4. Legacy Source Pointers

Prior-source lineage: `docs/specs/work-state.md` (retired). Current state owns [spec.md](spec.md); retained [docs/platform/work-state/contracts/cli-io-contract.md](contracts/cli-io-contract.md) owns its root CLI I/O contract.

The platform vision lives at [vision.md](../vision.md), outside this area’s scope. Source coordinate (provenance only; not navigation): `docs/platform/vision.md#platform-vision`.

## 5. Related Files

| Relationship | File |
| --- | --- |
| owning work-state behavior spec | [spec.md](spec.md) |
| scoped CLI input/output contract | [contracts/cli-io-contract.md](contracts/cli-io-contract.md) |
| candidate implementation pointers | [architecture/implementation-pointers.md](architecture/implementation-pointers.md) |
| candidate retired decision history | [decisions/retired-decision-history.md](decisions/retired-decision-history.md) |
| candidate harness distill record | [history/multi-role-harness-distill-record.md](history/multi-role-harness-distill-record.md) |
| current state owner | [spec.md](spec.md) |
| retained root I/O authority | [contracts/cli-io-contract.md](contracts/cli-io-contract.md) |
| platform vision holder (source coordinate: `docs/platform/vision.md#platform-vision`, provenance only) | [vision.md](../vision.md) |
| platform vision and mission | [../vision.md](../vision.md) |
