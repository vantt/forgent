# Phase 07 — PlacementPolicy production binder

## Cell goal

Promote PlacementPolicy from shadow/read-only explanation to the production
provider/model/executor binder after Phase 05 has enough divergence proof.

Provider Capacity Rotator remains the same-provider account capacity oracle.
This phase must not move account inventory, leases, quarantine, or credential
provisioning into PlacementPolicy.

## Preconditions

- Phase 04 quality bridge has landed and full-suite gate is accepted.
- Phase 05 shadow PlacementPolicy has recorded legacy-vs-target divergence.
- Phase 06 doctor/schema warnings are available for legacy placement smells.
- Provider Capacity Rotator slice 1 is green for Codex bwrap account
  selection/refusal/evidence.

## Scope

Production PlacementPolicy may own:

- provider preference/ranking;
- model calibration/ranking from existing `modelPolicies`;
- executor/runtime candidate ranking;
- fallback decisions on structured capacity refusal or transient provider
  failure.

Production PlacementPolicy must not own:

- concrete provider account selection;
- provider account inventory;
- account leases/quarantine;
- credential provisioning.

## Required behavior

- Existing legacy behavior remains the baseline unless an intentional delta is
  recorded.
- Capacity fallback is triggered only by structured Provider Capacity Rotator
  refusal, not by ad hoc stderr parsing in PlacementPolicy.
- Every fallback candidate is re-admitted against governance:
  - disallowed providers;
  - required runtime class;
  - confinement;
  - tool/mutation policy;
  - cross-provider permission.
- Missing runtime class skips the candidate with a reason code; it never
  downgrades confinement or runtime class.
- Tool/MCP executors remain outside provider-capacity fallback unless a future
  provider-specific API explicitly models them.

## Likely files

- `src/runner/dispatch/placement-policy.mjs`
- `src/runner/dispatch/assignment-policy.mjs`
- `src/runner/dispatch/plan.mjs`
- `src/runner/dispatch/assignment-runner.mjs`
- tests for legacy equivalence, governance re-admission, capacity refusal
  fallback, and divergence retirement.

## Verification

```sh
npm test
```

If full suite has baseline failures, compare exactly against the recorded
baseline from `plan.md` and triage every new failure.

## Exit criteria

- PlacementPolicy is the production binder for provider/model/executor
  decisions.
- Provider Capacity Rotator is still the only account selector.
- `readOnlyExecutorRedirects` still exists but is no longer the active source
  for new PlacementPolicy-admitted paths.
- Dispatch evidence names PlacementPolicy decisions, fallback reason codes, and
  provider-capacity refusal facts without leaking account secrets.
