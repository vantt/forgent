# Work Integration Boundaries

```txt
Document type: Architecture
Audience: Human reviewers, maintainers, documentation agents
Purpose: Identify the surviving current owner and preserve superseded sections in exact history
Design status: Candidate
Implementation: Current scope below is bound to present code; historical design is not implementation proof
Provenance: Retained from docs/architect/agent-coordination/architecture/work-integration.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
Writer type: Documentation maintainer
Canonical for: Candidate current-owner and boundary guidance only; no authority cutover or duplicate runtime schema
Use this when: Reading the checked surviving scope or tracing original historical claims
Do not use this for: Reinstating retired Session, Flow, Protocol or Work-stage contracts
Last reviewed: Pending independent whole-area review
Related:
- docs/platform/agent-coordination/architecture/dispatch-control-plane.md
- docs/platform/agent-coordination/history/retired-engine/files/vision.md
- docs/platform/agent-coordination/history/retired-engine/files/proposals/step-07-coordination-session-adhoc-task.md
Supersedes: None; retained source authority is unchanged
Superseded by: None
Added in candidate: Current-owner evidence and explicit historical section separation
```
## Current Scope

This candidate retains the surviving owner and boundary below. It is not a second runtime schema or an approval of the former engine. Current execution authority remains [the runner spec](../../../specs/runner.md).

Workflow execution calls the Unit execution core; a separate CoordinationSession is not the owner of that call. Evidence: `src/workflow/runner.mjs:419-428`.

Work no longer has a stage: Workflow owns sequencing, while Work retains delivery/state authority. Evidence: `src/state/work.mjs:455-472`, `src/workflow/runner.mjs:419-428`; settled boundary: `docs/specs/runner.md:3072-3081`.

## Historical Sections

The complete classified input, including all former contracts, schemas, qualifications and implementation statuses, is [preserved verbatim](../history/retired-engine/files/architecture/work-integration.md#literal-snapshot). The coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; see the runner spec’s historical CoordinationSession section. Retired Session/Flow/Protocol and Work-stage sections are not current contracts. No historical claim is deleted or silently reclassified as implemented.
