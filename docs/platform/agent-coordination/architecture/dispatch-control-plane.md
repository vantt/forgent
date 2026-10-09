# Dispatch Control Plane

```txt
Document type: Architecture
Audience: Human reviewers, maintainers, documentation agents
Purpose: Identify the surviving current owner and preserve superseded sections in exact history
Design status: Candidate
Implementation: Current scope below is bound to present code; historical design is not implementation proof
Provenance: Retained from docs/architect/agent-coordination/architecture/dispatch-control-plane.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
Writer type: Documentation maintainer
Canonical for: Candidate current-owner and boundary guidance only; no authority cutover or duplicate runtime schema
Use this when: Reading the checked surviving scope or tracing original historical claims
Do not use this for: Reinstating retired Session, Flow, Protocol or Work-stage contracts
Last reviewed: Pending independent whole-area review
Related:
- docs/architect/component-boundary/component-boundary-advisory.md
- docs/architect/proposals/component-authority-boundary-map.md
- docs/platform/agent-coordination/history/retired-engine/files/contracts/flow-definition.md
Supersedes: None; retained source authority is unchanged
Superseded by: None
Added in candidate: Current-owner evidence and explicit historical section separation
```
## Current Scope

This candidate retains the surviving owner and boundary below. It is not a second runtime schema or an approval of the former engine. Current execution authority remains [the runner spec](../../../specs/runner.md).

Current Unit execution calls CollaborationPattern through runPattern; Workflow nodes call the Unit runner. Evidence: `src/runner/execution/run.mjs:532-540`, `src/workflow/runner.mjs:419-428`.

The retained Assignment dispatch path validates execution legality before executing an Assignment. Evidence: `src/runner/dispatch/assignment-runner.mjs:1262-1265`.

## Historical Sections

The complete classified input, including all former contracts, schemas, qualifications and implementation statuses, is [preserved verbatim](../history/retired-engine/files/architecture/dispatch-control-plane.md#literal-snapshot). The coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; see the runner spec’s historical CoordinationSession section. Retired Session/Flow/Protocol and Work-stage sections are not current contracts. No historical claim is deleted or silently reclassified as implemented.
