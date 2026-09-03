# Phase 03 - Recheck, Disposition, And Live Standalone Proof

## Objective

Complete the MVP2 loop by proving recheck as a new Assignment, disposition as a
driver event, and one live no-Work Master Coordination run through the declared
fixture.

## Requirements

- **R1 Artifact refs.** Persist or expose produced artifact references through
  the existing RunResult/evidence path. CoordinationSession may link refs but
  must not become a second artifact authority.
- **R2 Recheck semantics.** Reviewer/Red-Team recheck creates new Assignments
  against a new artifact revision/evidence ref. It is not a retry and must not
  supersede old RunResults.
- **R3 Disposition event.** Add `driver-disposition-recorded` with target ref,
  disposition, rationale, evidence refs, timestamp, and driver provenance.
- **R4 Replay.** Session replay must reconstruct authorization, assignment
  provenance, result links, recheck lineage, and dispositions without chat
  history.
- **R5 CLI/live path.** Run the fixture through the public coordination CLI or
  the existing declared-protocol execution door. The live proof must create no
  Work item and perform no repo/git mutation.
- **R6 Negative proof.** Unauthorized optional operation, hidden context, reused
  invocation key, terminal authorization, and over-cap round all fail closed.
- **R7 Surface readiness.** Document the future thin launcher shape, but do not
  implement a skill/slash surface in this phase unless the CLI proof needs a
  trivial request-file helper.

## Files

Expected source/test/docs:

- `src/runner/coordination/store.mjs`
- `src/runner/coordination/replay.mjs`
- `src/runner/coordination/session-engine.mjs`
- `src/verbs/coordination/run.mjs`
- `src/verbs/coordination/show.mjs`
- `test/runner/coordination*.test.mjs`
- `test/verbs/coordination*.test.mjs`
- `docs/architect/agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/`
- accepted contracts touched in Phase 00 only for implementation alignment

Do not modify Work verbs, Coding Domain workflows, git integration, or
`group-cognition-framework.yaml`.

## Tests First

Add failing tests for:

- recheck creates a new Assignment and leaves prior verdict/result immutable;
- disposition is event-log state, not worker result state;
- replay preserves accepted/rejected/deferred disposition;
- live request with no Work creates candidate, review, red-team, revision,
  recheck, and final close records;
- no session event or assignment contains forbidden Work lifecycle mutation;
- fixture proof rejects hidden context and unauthorized optional operation.

Focused command:

```bash
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  'test/runner/coordination*.test.mjs' \
  'test/verbs/coordination*.test.mjs'
```

Run the full test command before closing this phase.

## Proofs And Exit

- Verification directory records the live run, command output summaries, session
  ids, assignment ids, result refs, artifact refs, disposition refs, and negative
  proof results.
- A resumed run does not duplicate completed Assignments or reconsume
  `invocationKey`.
- No Work/git/repo mutation occurred in the standalone proof.
- Final docs point from Step 09 proposal/baseline to the verification index.

## Risks / Rollback

Risk: treating artifact production as repo mutation. Keep artifacts local to
RunResult/evidence and session references. Risk: implementing a surface launcher
too early. Leave launcher to the next plan unless the proof cannot be run
without a minimal request-file command.

