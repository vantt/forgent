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
| Phase 3 | Move accepted architecture | complete | [architecture index](../../architecture/README.md) plus 13 target architecture documents; target-local and cross-area links were normalized. | Legacy sources remain retained until Phase 7 redirect review; keep runtime-recovery-family proposal/partial labels explicit. |
| Phase 4 | Move contracts and ADRs | complete | [contract index](../../contracts/README.md), four target contracts, [decision index](../../decisions/README.md), and ADR-001 through ADR-011. | Legacy sources remain retained until Phase 7 redirect review; future semantic changes need decision/compatibility evidence. |
| Phase 5 | Preserve verification trees | complete | [verification README](../../verification/README.md) indexes retained legacy proof roots; mirrored target trees remain navigable evidence copies. | Keep the proof-preservation ledger current when a target doc adds an implementation claim. |
| Phase 6 | Preserve playbooks, proposals, roadmap, and history | complete | [playbooks](../../playbooks/README.md), [proposals](../../proposals/README.md), [roadmap](../../roadmap/README.md), and [history](../README.md) now state their target-path and non-normative status. | Keep proposal-status and source-inventory ledgers current as frontier material changes. |
| Phase 7 | Redirect legacy paths | complete | All 63 legacy narrative/index documents with target counterparts carry standard target-path migration notes; legacy proof artifacts remain unchanged, link-only evidence through the target verification index. | Keep target/legacy pairs synchronized if a retained legacy source changes; preserve proof artifacts as evidence. |

## Current Boundary Note

No component-boundary change through the completed Phase 0-5 work. The
migration is changing document placement and reader routing, not runtime
authority, state writes, or component ownership.

## Completion Evidence

Phase 0-7 completion evidence is recorded in
[phase-7-completion.md](phase-7-completion.md).
