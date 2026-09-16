# Phase 05 — PlacementPolicy shadow mode

## Cell goal

Introduce PlacementPolicy as a shadow/read-only resolver that explains what the
target architecture would choose, without changing production binding yet.

## Parallelization

Do not start before Phase 04 lands. PlacementPolicy must consume the canonical
quality vocabulary and the existing ProviderAdapter/shadow snapshot surfaces.

## Scope

PlacementPolicy should absorb the target responsibilities currently scattered
across:

- `capabilities.*.prefer`
- `capabilities.*.overrides.providerModel`
- `capabilities.*.overrides.rigorOverrides`
- executor-level `providerModel`/`rigorOverrides` where those fields are
  actually placement/model calibration instead of endpoint facts

For this phase, keep legacy resolution as the actual production decision and
compute the PlacementPolicy candidate list alongside it. Record divergence in
explain/debug output or tests.

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
    ]
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

## Verification

```sh
npm test -- test/runner/assignment-dispatch.test.mjs test/runner/coordination*.test.mjs
```

## Exit criteria

- There is one documented target source for provider/model/executor ranking.
- Shadow PlacementPolicy can represent `fgos-coding-implement`'s current
  provider/model behavior without living in capability overrides.
- Divergence from legacy behavior is reported, not applied.
- No production binding changes yet unless the cell explicitly escalates and
  updates this phase file.
