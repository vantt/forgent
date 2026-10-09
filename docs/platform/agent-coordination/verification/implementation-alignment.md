# Agent Coordination Implementation Alignment

```txt
Document type: Verification
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
- docs/platform/agent-coordination/history/retired-engine/verification/implementation-alignment.md
Supersedes: Stale current-state framing only; all old claims are preserved verbatim
Superseded by: Runtime ownership in docs/specs/runner.md
Added in candidate: Retirement framing and current-owner navigation
```

This table is deliberately conservative. `implemented` means current checkout
code/test/proof supports the claim. `partial` and `track-complete / verify`
must not be silently upgraded during doc promotion.

Historical content moved verbatim to the [retired-engine snapshot](../history/retired-engine/verification/implementation-alignment.md#literal-snapshot). The engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; this retained section is not a current runtime description.

## Boundary Note

No component-boundary change in this Phase 2 migration. The migration adds
state-summary and evidence-linking docs only; it does not change runtime
authority or component ownership.
