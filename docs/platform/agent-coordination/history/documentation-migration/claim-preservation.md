# Agent Coordination Claim Preservation

```txt
Document type: Claim preservation table
Audience: Human reviewer, maintainer and implementation agent
Purpose: Navigate preserved design and historical material without asserting a retired runtime
Design status: Candidate
Implementation: Retired engine material is non-authority history; verified retained units remain unchanged
Provenance: Reframed under owner A15; complete previous document preserved in history/retired-engine
Writer type: Human + agent coauthor
Canonical for: Retained-document navigation only; no current engine authority
Use this when: Locating current execution owners or auditing historical claims
Do not use this for: Reinstating CoordinationSession, CoordinationProtocol or FlowDefinition as current implementation
Last reviewed: Pending independent reframe review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
- docs/platform/agent-coordination/history/retired-engine/history/documentation-migration/claim-preservation.md
Supersedes: Stale current-state framing only; all old claims are preserved verbatim
Superseded by: Runtime ownership in docs/specs/runner.md
Added in candidate: Retirement framing and current-owner navigation
```

Use `unknown` or `track-complete / verify current checkout` instead of
guessing. A target doc may mark a claim `implemented` only when the linked
current-checkout code, test, contract, or proof supports it.

Historical content moved verbatim to the [retired-engine snapshot](../retired-engine/history/documentation-migration/claim-preservation.md#literal-snapshot). The engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; this retained section is not a current runtime description.

## Boundary Note

No component-boundary change in this Phase 0/1 migration.
