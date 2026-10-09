# Historical File: current-owner navigation

```txt
Document type: History
Audience: Human reviewer, maintainer and documentation agent
Purpose: Preserve the complete classified input as non-authority historical evidence
Design status: Candidate
Implementation: Historical snapshot; not current implementation or authority
Provenance: docs/platform/agent-coordination/README.md at d23045c2de83e3508fda8fd2580b43ece2e1e046; SHA256 fc8c55194c9512f9a46728d9dfb0b1079529eb2adccb5b2af142b004d50eeff4
Writer type: Documentation maintainer
Canonical for: Historical evidence only; no current authority
Use this when: Auditing original claims or section-level retirement
Do not use this for: Current runtime behaviour, accepted proposals or executable routing
Last reviewed: Pending independent whole-area review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: None; this is an exact historical carrier
Superseded by: Current execution ownership in docs/specs/runner.md
Added in candidate: Historical framing only; literal file bytes are unchanged
```

The coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; see `docs/specs/runner.md` **CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)**. Original statuses and instructions below are dated evidence, not current claims.

## Literal Snapshot

~~~~text
# Agent Coordination

```txt
Document type: Area Portal
Audience: Human reviewer, maintainer and implementation agent
Purpose: Route current execution to its owners and retain historical evidence
Design status: Accepted
Implementation: Current-owner navigation; former coordination engine retired
Provenance: Owner A15; complete prior portal retained verbatim in history/retired-engine
Writer type: Human + agent coauthor
Canonical for: Area navigation, not runtime schema or old engine status
Use this when: Locating current execution owners or historical coordination claims
Do not use this for: Reinstating the retired CoordinationSession engine
Last reviewed: Pending independent reframe review
Related:
- docs/specs/runner.md
- docs/platform/agent-coordination/spec.md
- docs/platform/agent-coordination/history/retired-engine/README.md
Supersedes: Stale current-state framing only; no old claim is dropped
Superseded by: None
Added in candidate: Current-owner routing and retirement framing
```

## Current Execution

The former coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`. `coordination` is not a current public CLI verb; the actual machine-readable `--help --json` manifest is the CLI inventory.

CollaborationPattern owns Unit collaboration patterns in `src/runner/execution/patterns/index.mjs`; Unit execution enters through `src/runner/execution/run.mjs`. Workflow execution belongs to `src/workflow/runner.mjs` and its Unit execution-core integration.

Read [the runner spec](../../specs/runner.md) for the current execution contract, then [this area's current-owner map](spec.md). Do not treat CoordinationSession, CoordinationProtocol or FlowDefinition in the preserved documents as current implemented engine entities.

## Preserved History

The [complete previous portal](history/retired-engine/README.md#literal-snapshot) and [previous spec](history/retired-engine/spec.md#literal-snapshot) remain verbatim, including all original qualifications and statuses. They are non-authority history, not present implementation claims.

Use the snapshots to audit preserved claims. They do not reinstate the retired engine or strengthen proposal/implementation status.

- [Historical architecture](history/retired-engine/architecture/system-context.md#literal-snapshot)
- [Historical CLI proposal](history/retired-engine/proposals/semantic-cli-surface.md#literal-snapshot)
- [Historical implementation alignment](history/retired-engine/verification/implementation-alignment.md#literal-snapshot)
- [Retired documentation policies and migration plans](history/documentation-migration/documentation-governance.md)
~~~~
