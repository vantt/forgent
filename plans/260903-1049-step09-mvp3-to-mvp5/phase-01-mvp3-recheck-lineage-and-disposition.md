# Phase 01 - MVP3 Recheck Lineage And Driver Disposition

## Objective

Accept, harden, or gap-close recheck and disposition as first-class session
semantics while preserving Assignment/Run/RunResult immutability and retry
behavior. This phase consumes the MVP1/MVP2 Phase 03 handoff; it must not
reimplement work that handoff already proved.

## Requirements

- **R1 Handoff-first review.** Compare the implemented MVP1/MVP2 handoff against
  this phase before editing source. If a requirement is already implemented and
  proved, record acceptance in the trace instead of redoing it.
- **R2 Recheck lineage.** A recheck records a new Assignment linked to the
  artifact revision/evidence ref it evaluates and the prior finding/verdict it
  is rechecking.
- **R3 Retry separation.** Recheck must not use `run-retried`, must not
  supersede a previous RunResult, and must not erase or rewrite the first-pass
  review/red-team verdict.
- **R4 Disposition event.** `driver-disposition-recorded` records target ref,
  disposition, rationale, evidence refs, timestamp, and driver provenance.
- **R5 Driver-only authority.** Worker Assignments may produce findings and
  recommendations, but cannot record final disposition or close truth.
- **R6 Replay.** Session replay reconstructs recheck lineage and dispositions
  deterministically from the event log.
- **R7 Artifact authority.** Coordination stores refs to artifacts/results; it
  does not copy produced artifacts into a second authoritative store.
- **R8 Negative semantics.** Recheck for unknown target, stale/nonexistent
  artifact ref, missing authorization, terminal session, or reused invocation key
  fails closed.

## Files

Expected source/test/docs if the handoff leaves real gaps:

- `src/runner/coordination/schema.mjs`
- `src/runner/coordination/store.mjs`
- `src/runner/coordination/replay.mjs`
- `src/runner/coordination/session-engine.mjs`
- `test/runner/coordination*.test.mjs`
- `docs/architect/agent-coordination/contracts/coordination-session.md`
- `docs/architect/agent-coordination/architecture/coordination-foundation-baseline.md`

Do not modify Work verbs, Coding Domain workflows, git integration, or
`core/coordination-protocols/group-cognition-framework.yaml`.

## Tests First

Add failing tests only for missing or insufficient behavior after the handoff
audit:

- recheck creates a new Assignment and links to prior finding/verdict;
- previous RunResult remains visible and immutable after recheck;
- recheck is rejected if implemented through retry supersession;
- disposition event replays as driver state;
- worker-shaped event cannot record driver disposition;
- disposition target must reference a real finding/artifact/result target;
- terminal sessions refuse new disposition/authorization unless the accepted
  contract explicitly allows terminal finalization before status transition.

Focused command:

```bash
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/runner/coordination*.test.mjs'
```

Run the full test command before closing this phase.

## Proofs And Exit

- The trace records which MVP1/MVP2 recheck/disposition behavior was accepted
  unchanged and which gaps, if any, were closed here.
- Recheck lineage is visible in replay/show output or an equivalent internal
  proof surface.
- Disposition is auditable as a driver event.
- No existing retry tests regress.
- No Work/git/coding-domain mutation path is introduced.

## Risks / Rollback

Risk: overloading retry because it already has supersession machinery. Do not do
that; preserve retry and add separate recheck lineage. If artifact refs are too
weak, record the minimal RunResult artifact-ref delta instead of creating a
Coordination-owned artifact store.
