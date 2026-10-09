# Visibility And Herdr

```txt
Document type: Architecture
Audience: Human reviewers, maintainers, documentation agents
Purpose: Identify the surviving current owner and preserve superseded sections in exact history
Design status: Candidate
Implementation: Current scope below is bound to present code; historical design is not implementation proof
Provenance: Retained from docs/architect/agent-coordination/architecture/visibility-and-herdr.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
Writer type: Documentation maintainer
Canonical for: Candidate current-owner and boundary guidance only; no authority cutover or duplicate runtime schema
Use this when: Reading the checked surviving scope or tracing original historical claims
Do not use this for: Reinstating retired Session, Flow, Protocol or Work-stage contracts
Last reviewed: Pending independent whole-area review
Related:
- docs/platform/agent-coordination/architecture/run-handle.md
- docs/platform/agent-coordination/architecture/runtime-recovery-design.md
- docs/platform/agent-coordination/history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md
Supersedes: None; retained source authority is unchanged
Superseded by: None
Added in candidate: Current-owner evidence and explicit historical section separation
```
## Current Scope

This candidate retains the surviving owner and boundary below. It is not a second runtime schema or an approval of the former engine. Current execution authority remains [the runner spec](../../../specs/runner.md).

Detaching visibility writes the visibility state; it does not settle the Run. Evidence: `src/runner/dispatch/visibility-session.mjs:130-133`.

The structured result normalizer and its evidence floor determine outcome confidence, not terminal appearance. Evidence: `src/runner/dispatch/run-result.mjs:1276-1285`, `src/runner/dispatch/run-result.mjs:1305-1325`.

## Forbidden Inferences

- quiet pane means completion;
- visible success text means verified RunResult;
- process exit alone means semantic success;
- pane ownership means Work ownership;
- terminal transcript replaces structured result artifacts;
- UI status can approve or merge Work.


## Historical Sections

The complete classified input, including all former contracts, schemas, qualifications and implementation statuses, is [preserved verbatim](../history/retired-engine/files/architecture/visibility-and-herdr.md#literal-snapshot). The coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; see the runner spec’s historical CoordinationSession section. Retired Session/Flow/Protocol and Work-stage sections are not current contracts. No historical claim is deleted or silently reclassified as implemented.
