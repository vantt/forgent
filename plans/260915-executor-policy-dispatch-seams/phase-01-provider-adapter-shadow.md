# Phase 01 — ProviderAdapter shadow rendering

## Cell goal

Introduce ProviderAdapter as a pure rendering layer in shadow mode. The adapter
must be able to render current legacy argv equivalently, but production dispatch
continues to use the old transport path unless an explicit test path asks for
shadow rendering.

## Parallelization

May run in parallel with Phase 02 after Phase 00 lands. If both cells need to
extend DispatchPlan/runtime evidence, coordinate on field names from
`design.md` and re-run both targeted suites after merge.

## Scope

Add a small provider adapter surface, likely under `src/runner/dispatch/`, that:

- accepts canonical runtime options plus resolved executor/invocation facts;
- renders provider-specific argv/env fragments;
- exposes `policyShapedFlags[]` for doctor/config detection;
- reports `applied` status for options like effort, model, tool gating, system
  prompt, sandbox/read-only mode.

Do not yet delete `{prompt}` / `{model}` transport templating.

## Likely files

- new `src/runner/dispatch/provider-adapters.mjs`
- `src/runner/dispatch/transport.mjs` only if a pure shadow entry point needs
  to reuse argument normalization
- `src/runner/dispatch/config.mjs` if provider flag vocabulary belongs beside
  config validation constants
- Phase 00 snapshot tests
- new focused provider-adapter unit tests

## Adapter contract

Use the contract in `design.md` §3.5. The first implementation may expose a
smaller function, but it must be pure and must return:

- rendered `command` and `args`;
- `envPatch` or env-key metadata;
- `applied` statuses;
- `warnings`;
- `policyShapedFlags[]` per provider.

Production dispatch must keep using the legacy path by default.

## Initial providers

Implement only enough for current config:

- Claude CLI family
- Codex CLI family
- AGY/Gemini CLI family
- Pi CLI family
- Z-AI through Claude/OpenRouter route, if needed by snapshot

Provider adapters may be partial if the shadow test records unsupported options
explicitly.

## Verification

```sh
npm test -- test/runner/assignment-dispatch.test.mjs test/runner/dispatch*.test.mjs
```

## Exit criteria

- Shadow-rendered argv is equivalent to legacy argv for Phase 00 snapshot cases,
  allowing only harmless flag ordering differences explicitly normalized by the
  test.
- ProviderAdapter is pure and does not spawn.
- `policyShapedFlags[]` includes known policy-shaped flags such as `--effort`,
  `--model`, `--allowedTools`, Codex `-s`, and dangerous bypass flags where
  applicable.
- Production dispatch behavior is unchanged.
