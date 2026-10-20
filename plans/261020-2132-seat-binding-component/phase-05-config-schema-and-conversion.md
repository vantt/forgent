# Phase 05: config schema, cells, `$comment` handling, schema version, pure conversion function

Owner: Sonnet lead in a worktree from the track. Size M (1d). After 04; may run beside 03.

## Context

- Spec §4.1 (`$comment`), §4.3 (cells) [G4], §5.2 (schema) [G1], §5.3 rules, §8 steps 2, 4, 5, 7.
- Today: capability key allowlist `src/runner/dispatch/config.mjs:1364`; `rigorToTier` required :1710-1715 and shape :1529-1555; `REASONING_EFFORT_VALUES` :519; `MODEL_POLICY_TIERS` :577 (already six tiers incl. `mini`); `parseTierCell` `src/runner/dispatch/tier-cell.mjs:25-40`; prefer entry keys :729.

## Requirements

- Loader accepts (validation only; nothing reads them until 06): `runner.defaults.tier`, capability `tier`, `maxTier`, `roles.<role>.{tier,prefer}`, `personas.<name>.{tier,prefer}`, `seats.<seat>.{tier,prefer}`; role keys limited to the five roles; tier values against the vocabulary (invalid = load error); `prefer: []` = load error; existing capability keys unchanged.
- `$comment` keys ignored at every level: stripped before validation and before the semantic config hash (`snapshotRunnerConfig` consumer change lands in 06).
- Schema fence: `runner.seatBindingSchema: 1`. This phase only accepts it; 06 makes it required and rejects `rigorToTier`. (Old releases already throw on missing `rigorToTier`, `config.mjs:1710`, and on unknown capability keys, `:1364`; 09 proves it.)
- Cells: `parseTierCell` accepts `"<model>[@<pool>]"`, `{model, pool?, effort?}`, non-empty arrays of both; effort in `REASONING_EFFORT_VALUES` only (vocabulary widening is out of scope); string cells unchanged. All three consumers (`config.mjs`, `resolve.mjs`, `setup/model-pool-checks.mjs`) read the parsed form.
- Global config takes no new key (§8 step 5): the loader refuses the new keys in `~/.fgos/config.json` with a message pointing to project config.
- Pure conversion `src/setup/seat-binding-conversion.mjs` `convertRunnerConfig(runner, { registeredCapabilities, ladder }) -> { runner, changes[] }`, deterministic and idempotent (plan decision 4):
  - delete `rigorToTier`; set `defaults.tier = rigorToTier.standard ?? 'standard'`;
  - per capability with `rigor`: `tier = rigorToTier[rigor]` when ≠ `defaults.tier`; `maxTier = that tier` when above global `maxTier`;
  - copy each bare-verb entry `v` to every registered `<prefix>:v` lacking its own entry;
  - add `mini` to `tierFallback` (copy of the `nano` list when absent, else of `standard`, recorded in `changes`);
  - keep string cells, `prefer` key and shape;
  - write `$comment` beside `modelPolicies`, `tierFallback`, `maxTier` from `ladder` (crate text via `tierLadder()`);
  - set `seatBindingSchema: 1`.
  Second run returns `changes: []`.

## Files

- Modify: `src/runner/dispatch/config.mjs`, `src/runner/dispatch/tier-cell.mjs`, `src/runner/dispatch/resolve.mjs`, `src/setup/model-pool-checks.mjs` (parsed cells only), `docs/architecture-manifest.json` (new module).
- Create: `src/setup/seat-binding-conversion.mjs`, `test/setup/seat-binding-conversion.test.mjs`.
- Tests: `test/runner/tier-cell.test.mjs`, `test/runner/tier-fallback-config.test.mjs`, `test/setup/checks-doctor-config.test.mjs`.

## Steps

1. Schema keys + `$comment` stripping + tests.
2. Cell forms + tests (object, array, effort, invalid effort).
3. Conversion function with fixtures: forgentX `.fgos/config.json` (read, not changed here), a minimal project, a project with bare-verb entries; idempotency test.

## Tests

- Each new key validates; each invalid value fails with the key path.
- `$comment` anywhere does not change the hash.
- Conversion idempotent (first half of the §12 conversion proof).

## Risks / rollback

- M×M: conversion maps a capability to a tier different from today's effective one. Mitigation: test asserts, for the forgentX config, that every capability's converted tier equals today's `resolveSeatTier` result (`bind.mjs:141`) at unit rigor `standard`.
- Rollback: revert on the track (accepting keys alone changes no behaviour).
