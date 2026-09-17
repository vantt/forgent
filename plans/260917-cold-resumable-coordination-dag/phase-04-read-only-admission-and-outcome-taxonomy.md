# Phase 04 - Read-Only Admission And Outcome Taxonomy

## Goal

Establish the authoritative behavior scheduler nodes rely on before scheduling
them: read-only-only admission, typed node-door failures, capacity deferral,
and shared-cwd caveat evidence.

## Scope

- Add stable machine classification for the single deferrable
  `concurrency-cap` admission refusal.
- Define the narrow node-door error classifier: integrity, definition drift,
  missing session/definition, ambiguous claim, corrupt replay, and unexpected
  errors throw; only explicitly listed validation refusals may become node
  outcomes.
- Ensure DAG-mode admission rejects mutation and fan-out at the authoritative
  request/dispatch boundary.
- Record canonical cwd/overlap group facts required to annotate concurrent
  read-only run verdicts; do not claim mutation ownership or takeover.
- Preserve existing legacy sequential behavior.

## Verification

```sh
npm test -- test/runner/coordination-r5-hard-budgets.test.mjs test/runner/coordination-session-engine.test.mjs test/runner/coordination-recovery-and-quorum.test.mjs test/runner/coordination-r6-security-adversarial.test.mjs
npm test
```

## Exit Criteria

- Capacity is the sole deferred classification; maxAssignments/maxRounds/wall
  time/task-depth remain non-deferrable typed outcomes.
- Definition drift, missing session/definition, stale/ambiguous claim, and
  corrupt linked evidence throw after owned work settles with no later event.
- Two concurrent read-only runs reproduce and annotate false-positive verdict
  attribution without rollback/data-loss claims.
