# Agent Coordination Migration Status

```txt
Document type: Migration status
Audience: Human reviewer, architect, maintainer, documentation agent
Purpose: Track phase-by-phase progress for the Agent Coordination documentation migration
Design status: Draft
Implementation: Active
Provenance: Created during execution of docs/architect/agent-coordination/documentation-standardization-plan.md
Writer type: Human + agent coauthor
Canonical for: Migration progress bookkeeping only
Use this when: Resuming the documentation migration or checking which phase has landed
Do not use this for: Current runtime behavior, accepted contracts, or implementation proof
Last reviewed: 2026-09-18
Related:
- docs/architect/agent-coordination/documentation-standardization-plan.md
- docs/platform/agent-coordination/README.md
- docs/platform/agent-coordination/history/documentation-migration/source-inventory.md
```

## Phase Status

| Phase | Plan title | Status | Landed target docs | Remaining work |
|---|---|---|---|---|
| Phase 0 | Protect the current authority graph | complete | [source-inventory.md](source-inventory.md), [claim-preservation.md](claim-preservation.md), [proof-preservation.md](proof-preservation.md), [proposal-status.md](proposal-status.md) | Keep ledgers updated when later phases promote or redirect source rows. |
| Phase 1 | Create target portal and preserve vision/ledger pair | complete | [../../README.md](../../README.md), [../../vision.md](../../vision.md), [../../intent-preservation-ledger.md](../../intent-preservation-ledger.md), [../../subcomponents/README.md](../../subcomponents/README.md), [../README.md](../README.md) | Legacy detailed docs remain current until later phases drain them. |
| Phase 2 | Promote spec without shrinking the vision | complete | [../../spec.md](../../spec.md), [../../verification/implementation-alignment.md](../../verification/implementation-alignment.md) | Keep status conservative; update alignment when code/proof scans refine partial/implemented claims. |
| Phase 3 | Move accepted architecture | in progress | Architecture files copied into [../../architecture/](../../architecture/) | Normalize links/status notes; preserve proposal/partial labels for runtime-recovery-family docs. |
| Phase 4 | Move contracts and ADRs | in progress | Contract and decision files copied into [../../contracts/](../../contracts/) and [../../decisions/](../../decisions/) | Normalize links/status notes; ensure every ADR/contract has target path and proof/alignment linkage where needed. |
| Phase 5 | Preserve verification trees | not started | None beyond migration ledgers. | Move/mirror indexes first; keep proof artifacts reachable. |
| Phase 6 | Preserve playbooks, proposals, roadmap, and history | not started | None beyond migration ledgers. | Preserve non-canonical status and add status notes. |
| Phase 7 | Redirect legacy paths | not started | None. | Add old-path status notes only after target docs are reviewed/drained. |

## Current Boundary Note

No component-boundary change through the completed Phase 0/1/2 work or the
in-progress Phase 3/4 mechanical promotion. The migration is changing document
placement and reader routing, not runtime authority, state writes, or component
ownership.
