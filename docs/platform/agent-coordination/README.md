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
