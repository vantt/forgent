# Evidence And Result Architecture

```txt
Document type: Architecture
Audience: Human reviewers, maintainers, documentation agents
Purpose: Identify the surviving current owner and preserve superseded sections in exact history
Design status: Candidate
Implementation: Current scope below is bound to present code; historical design is not implementation proof
Provenance: Retained from docs/architect/agent-coordination/architecture/evidence-and-results.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
Writer type: Documentation maintainer
Canonical for: Candidate current-owner and boundary guidance only; no authority cutover or duplicate runtime schema
Use this when: Reading the checked surviving scope or tracing original historical claims
Do not use this for: Reinstating retired Session, Flow, Protocol or Work-stage contracts
Last reviewed: Pending independent whole-area review
Related:
- None
Supersedes: None; retained source authority is unchanged
Superseded by: None
Added in candidate: Current-owner evidence and explicit historical section separation
```
## Current Scope

This candidate retains the surviving owner and boundary below. It is not a second runtime schema or an approval of the former engine. Current execution authority remains [the runner spec](../../../specs/runner.md).

Worker claims are normalized with evidence; a mutating done claim needs external evidence to become verified. Evidence: `src/runner/dispatch/run-result.mjs:1276-1285`.

Corrupt result records fail closed when read through runOutcome. Evidence: `src/runner/dispatch/run-result.mjs:1305-1325`.

## Principle

```txt
Executors claim outcomes.
RunResult normalizes claims.
Evidence supports confidence.
Drivers decide what the evidence permits.
```

## Confidence Boundaries

- Worker self-report alone cannot produce externally verified confidence.
- Exit code zero cannot satisfy missing semantic outputs.
- Pre-existing dirty files cannot count as changes produced by the Run.
- Stale or cross-Assignment evidence must be rejected.
- Read-only analytical output may remain `reported` when the TaskSpec or inline
  execution contract permits it.
- Mutating success requires post-run external evidence appropriate to the claim.
- Missing/malformed required evidence must not false-pass.

## Visibility Boundary

Herdr pane state, terminal text, quietness, and process appearance are useful
diagnostics only. They cannot replace structured runtime and evidence records.

## Historical Sections

The complete classified input, including all former contracts, schemas, qualifications and implementation statuses, is [preserved verbatim](../history/retired-engine/files/architecture/evidence-and-results.md#literal-snapshot). The coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; see the runner spec’s historical CoordinationSession section. Retired Session/Flow/Protocol and Work-stage sections are not current contracts. No historical claim is deleted or silently reclassified as implemented.
