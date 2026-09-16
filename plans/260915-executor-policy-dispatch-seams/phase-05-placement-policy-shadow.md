# Phase 05 — PlacementPolicy shadow mode

## Cell goal

Introduce PlacementPolicy as a shadow/read-only resolver that explains what the
target architecture would choose, without changing production binding yet.
PlacementPolicy owns provider/model/executor ranking; it does not own
same-provider account rotation.

## Parallelization

Do not start before Phase 04 lands. PlacementPolicy must consume the canonical
quality vocabulary, the existing ProviderAdapter/shadow snapshot surfaces, and
the Provider Capacity Rotator structured refusal/evidence contract.

## Scope

PlacementPolicy should absorb the target responsibilities currently scattered
across:

- `capabilities.*.prefer`
- `capabilities.*.overrides.providerModel`
- `capabilities.*.overrides.rigorOverrides`
- executor-level `providerModel`/`rigorOverrides` where those fields are
  actually placement/model calibration instead of endpoint facts

PlacementPolicy should not absorb:

- `runner.providers.<provider>.accounts`;
- account leases/quarantine;
- credential provisioning;
- Codex private-home auth materialization.

For this phase, keep legacy resolution as the actual production decision and
compute the PlacementPolicy candidate list alongside it. Record divergence in
explain/debug output or tests.

Structured capacity refusals from Provider Capacity Rotator are inputs to shadow
fallback analysis only. They must not change actual binding in this phase.

## Likely files

- new `src/runner/dispatch/placement-policy.mjs`
- `src/runner/dispatch/plan.mjs`
- `src/runner/dispatch/resolve.mjs`
- `src/runner/dispatch/config.mjs`
- tests around capability prefer/overrides and DispatchPlan output

## Shadow output

The shadow result should include:

```jsonc
{
  "legacy": {"executorId": "agy-herdr", "provider": "gemini", "model": "gemini-3.8-flash-medium"},
  "placementPolicy": {
    "candidates": [
      {"executorId": "agy-herdr", "provider": "gemini", "model": "gemini-3.8-flash-medium"}
    ],
    "capacity": {
      "status": "selected|refused|not-applicable",
      "refusalReason": "provider-capacity.exhausted-or-quarantined"
    },
    "fallbackCandidates": []
  },
  "divergence": []
}
```

If the shadow candidate differs from legacy, report it but do not apply it.

## Required separation

- BusinessCasePreset: semantic defaults only.
- Capability registry: capability description and hard technical compatibility
  only.
- PlacementPolicy: provider/model/executor ranking/binding.
- Provider/model catalog: provider-family model calibration by minRigor.
- Provider Capacity Rotator: same-provider account inventory, leases,
  quarantine, and credential provisioning.

## Fallback admission

When shadow placement evaluates fallback candidates, it must re-admit each
candidate against:

- disallowed providers / cross-provider governance;
- required runtime class;
- confinement requirements;
- tool/mutation policy;
- provider/account capacity refusal facts from Provider Capacity Rotator.

Missing runtime class or governance refusal skips the candidate with a reason
code. It must not downgrade runtime class or confinement.

## Verification

```sh
npm test -- test/runner/assignment-dispatch.test.mjs test/runner/coordination*.test.mjs
```

## Exit criteria

- There is one documented target source for provider/model/executor ranking.
- Shadow PlacementPolicy can represent `fgos-coding-implement`'s current
  provider/model behavior without living in capability overrides.
- Shadow PlacementPolicy can consume a Provider Capacity Rotator refusal and
  report fallback candidates/divergence without changing production binding.
- Divergence from legacy behavior is reported, not applied.
- No production binding changes yet unless the cell explicitly escalates and
  updates this phase file.
