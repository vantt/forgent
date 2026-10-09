# Executor Fallback And Effect Eligibility

```txt
Document type: Architecture
Audience: Human reviewer, maintainer and implementation agent
Purpose: Identify the surviving current owner and preserve historical sections exactly
Design status: Candidate
Implementation: Only the present code-bound scope below is current
Provenance: Classified input docs/platform/agent-coordination/architecture/executor-health-and-fallback.md at d23045c2de83e3508fda8fd2580b43ece2e1e046; full prior bytes retained in history
Writer type: Documentation maintainer
Canonical for: Candidate current-owner and boundary guidance; no authority cutover
Use this when: Reading checked surviving scope or tracing historical claims
Do not use this for: Reinstating Session, Flow, Protocol or Work-stage contracts
Last reviewed: Pending independent whole-area review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Stale current framing only; all source claims remain preserved
Superseded by: Current execution ownership in docs/specs/runner.md
Added in candidate: Current-owner evidence and historical section separation
```
## Current Scope

This candidate retains the surviving owner and boundary below. It is not a second runtime schema or an approval of the former engine. Current execution authority remains [the runner spec](../../../specs/runner.md).

The retained recovery planner produces a recommendation, park or needs-input decision from snapshot and evidence. Evidence: `src/runner/dispatch/recovery-planner.mjs:243-266`.

Applying a recommendation checks its action key, snapshot hash, control epoch, expiry and current legality again. Evidence: `src/runner/dispatch/recovery-planner.mjs:281-316`.

## Historical Sections

The complete classified input, including all former contracts, schemas, qualifications and implementation statuses, is [preserved verbatim](../history/retired-engine/files/architecture/executor-health-and-fallback.md#literal-snapshot). The coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; see the runner spec’s historical CoordinationSession section. Retired Session/Flow/Protocol and Work-stage sections are not current contracts. No historical claim is deleted or silently reclassified as implemented.
