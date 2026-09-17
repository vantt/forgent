# Phase 08 — legacy placement bridge retirement

## Cell goal

Retire legacy placement bridges only after PlacementPolicy is the proven
production binder.

This phase removes the need for emergency/static placement mechanisms without
changing account-capacity ownership.

## Preconditions

- Phase 07 production PlacementPolicy has landed with full-suite proof.
- Dispatch evidence proves PlacementPolicy can explain every path that
  previously depended on `readOnlyExecutorRedirects`.
- Provider Capacity Rotator remains green for Codex account capacity.

## Scope

Candidate retirements:

- `runner.readOnlyExecutorRedirects`;
- emergency provider-aware read-only redirect pool behavior;
- compatibility comments/config that describe account placement as an executor
  responsibility.

Not in scope:

- deleting legacy executor ids wholesale;
- rewriting `.fgos/config.json` to final ExecutorProfile schema in one change;
- moving provider account inventory into project config;
- moving account leases/quarantine into PlacementPolicy.

## Required behavior

- Read-only safety remains enforced by business/permission/confinement policy,
  not by hardcoded executor naming.
- Existing read-only review/debug/advisory paths still resolve to an admitted
  provider/model/executor candidate.
- If a provider is out of account capacity, PlacementPolicy sees a structured
  provider-capacity refusal and applies its fallback policy, if allowed.
- If no admitted fallback exists, dispatch fails closed with an auditable
  refusal.

## Likely files

- `.fgos/config.json` if dogfood config removes `readOnlyExecutorRedirects`;
- `src/runner/dispatch/assignment-runner.mjs`;
- `src/runner/dispatch/config.mjs`;
- `src/setup/checks.mjs` or doctor registry files;
- tests for read-only paths, fallback refusal, and removal of legacy redirect
  behavior.

## Verification

```sh
npm test
```

If full suite has baseline failures, compare exactly against the recorded
baseline from `plan.md` and triage every new failure.

## Exit criteria

- `readOnlyExecutorRedirects` is retired or marked ignored with a removal
  warning, depending on compatibility decision.
- No production path depends on a static read-only redirect pool.
- PlacementPolicy evidence replaces redirect evidence.
- Account rotation still comes only from Provider Capacity Rotator.
