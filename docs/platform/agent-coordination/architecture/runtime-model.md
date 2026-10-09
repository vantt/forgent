# Assignment Execution Runtime Model

```txt
Document type: Architecture
Audience: Human reviewers, maintainers, documentation agents
Purpose: Identify the surviving current owner and preserve superseded sections in exact history
Design status: Candidate
Implementation: Current scope below is bound to present code; historical design is not implementation proof
Provenance: Retained from docs/architect/agent-coordination/architecture/runtime-model.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
Writer type: Documentation maintainer
Canonical for: Candidate current-owner and boundary guidance only; no authority cutover or duplicate runtime schema
Use this when: Reading the checked surviving scope or tracing original historical claims
Do not use this for: Reinstating retired Session, Flow, Protocol or Work-stage contracts
Last reviewed: Pending independent whole-area review
Related:
- docs/platform/agent-coordination/contracts/assignment-run-runresult.md
- docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-008-coordination-session-and-mission-deferral.md
- docs/platform/agent-coordination/history/retired-engine/files/contracts/coordination-session.md
Supersedes: None; retained source authority is unchanged
Superseded by: None
Added in candidate: Current-owner evidence and explicit historical section separation
```
## Current Scope

This candidate retains the surviving owner and boundary below. It is not a second runtime schema or an approval of the former engine. Current execution authority remains [the runner spec](../../../specs/runner.md).

The current execution-core pattern selector supports solo, reviewed and panel Unit patterns. Evidence: `src/runner/execution/patterns/index.mjs:34-46`.

The result normalizer accepts assignmentId, unitRunId and round alongside runId; these are distinct fields, not a restored CoordinationSession. Evidence: `src/runner/dispatch/run-result.mjs:350-355`.

## Failure Domains

The runtime distinguishes:

- assignment construction/validation failure;
- dispatch policy rejection;
- launch/transport failure;
- process timeout or non-zero exit;
- malformed or missing worker result;
- evidence mismatch or staleness;
- semantic task failure;
- persistence/recovery failure.

These outcomes must not collapse into a generic successful process exit.


## Historical Sections

The complete classified input, including all former contracts, schemas, qualifications and implementation statuses, is [preserved verbatim](../history/retired-engine/files/architecture/runtime-model.md#literal-snapshot). The coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; see the runner spec’s historical CoordinationSession section. Retired Session/Flow/Protocol and Work-stage sections are not current contracts. No historical claim is deleted or silently reclassified as implemented.
