# Phase 02 - Request Compiler And Identity Gate

## Goal

Compile a DAG request into one normalized immutable declaration and reject all
semantic ambiguity before new-session open or resume mutation.

## Scope

- Add explicit DAG opt-in and `dependsOn` request syntax while preserving the
  legacy request path byte-compatible when opt-in is absent.
- Implement one complete dependency extractor for operation, authorize,
  disposition, contribution, human-turn, and every supported reference field.
- Derive `$ref` data edges; resolve bare contribution/human-turn lineage to a
  unique request node or durable session record; union with control edges.
- Enforce unique node identity, cycle/self/unknown rejection, ledger-label
  rules, and repeated-binding authorization alternation.
- Enforce authorizationId, invocationKey, and repeated operation task identity
  uniqueness/alias equivalence so pairs cannot collapse through idempotency.
- Gate resume on fingerprint/node equivalence or an explicitly allowed
  continuation. Reject changed labels, edges, ordering, task keys, additions,
  and removals unless the continuation contract names the change.
- Reject DAG mutating operations and fan-out steps before declaration/session
  mutation.

## Verification

```sh
npm test -- test/runner/coordination-schema.test.mjs test/verbs/coordination-run-driver-steps.test.mjs test/runner/coordination-driver-authorization.test.mjs test/runner/coordination-human-turn.test.mjs test/runner/coordination-deliberation-ledger.test.mjs
npm test
```

## Exit Criteria

- Mixed `$ref`/bare-lineage/dependsOn cycles reject before `session-opened`.
- Repeated authorization binding validates `auth_1 -> op_1 -> auth_2 -> op_2`;
  duplicate logical identities reject or prove exact idempotent aliasing.
- A fresh process cannot mutate a DAG session with semantic drift.
