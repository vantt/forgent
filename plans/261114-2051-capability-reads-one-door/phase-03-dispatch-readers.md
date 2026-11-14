---
phase: 03
title: "Dispatch readers: purpose resolution, confinement request, dispatch plan, load validator"
status: pending
effort: 3h
depends_on: [01]
parallel_with: [02, 04, 05]
blocks: [06]
---

# Phase 03 — Dispatch readers

## Context

Port exists (phase 01). Read `plan.md` census rows 15-21 and "What step 1 leaves ready for step 2".
This phase changes where values are read, never what is decided. The two `prefer` readers in `resolve.mjs`
(the purpose chooser in `resolveExecutorAndOverrides` and the reverse match at 66-71) are not touched here:
phase 06 removes them after this phase, in the same files.
Impact analysis (as phase 01) on `resolveCapabilityDetailsFromHints`, `resolveExecutorAndOverrides`,
`buildConfinementRequest`, `validateRunnerConfigShape`, `compileDispatchPlan`.

## Requirements

1. `src/runner/dispatch/resolve.mjs` `resolveCapabilityDetailsFromHints` (lines 28-133): drop the local
   `capabilities` object.
   - `resolveAlias(name)`: non-string passes through; else `registeredCapabilityOf(cfg, name) ?? name`.
     Differs only for the plan.md Intended deltas (prototype names, non-object entries, string `aliases`).
   - Leave the reverse `prefer` match (66-71) as it is: phase 06 deletes it (owner question Q3).
   - Confinement filters (90-130): `capabilityConfinementOf(cfg, c)` (`?.mode === 'required'`, truthiness).
   - Registered filter (113): `hasCapabilityEntry(cfg, c)`.
2. Leave `resolveExecutorAndOverrides` (`resolve.mjs:195-266`) as it is: phase 06 splits it (lookup stays, the
   purpose chooser goes through `bind()`).
3. `src/runner/dispatch/plan.mjs:22-32`: delete `isKnownCapabilityName` and its comment; the `capability.unknown`
   check (line 492) becomes `registeredCapabilityOf(cfg, purpose) === undefined` (own key or array alias;
   differs only for the Intended deltas).
4. `src/runner/dispatch/confinement/request.mjs:315-337`: `capConfinement`, `skillConfinement` and the fallback
   anchor read through `capabilityConfinementOf(cfg, …)`. Error texts unchanged.
5. `src/runner/dispatch/config.mjs` load validator asks the port, never the section (no `catalogOf`):
   - `checkCapabilityEntry` (562-570): taste keys from `bindingTasteOf(cfg)[name].{roles,personas,seats}` keys;
     confinement shape from `capabilityConfinementOf(cfg, name)`. Iterate `capabilityNamesOf(cfg)`.
   - the capability name set (769-773) is gone: `tools` keys and `for` entries are checked with
     `registeredCapabilityOf(cfg, x) !== undefined` (same membership: key or alias).
   - `checkPreferTargets` (699-721): prefer sites from `bindingTasteOf(cfg)` (capability `prefer`, then each
     `roles`/`personas`/`seats` scope `prefer`, same order and the same label strings as `preferSitesOf`);
     `preferSitesOf` is deleted. `normalizePreferCandidates` stays in `config.mjs` (it normalizes a value, it reads
     no section).
   - `checkConfinementAgainstPolicies` (732-756): names from `capabilityNamesOf`, values from `capabilityConfinementOf`;
     the strict "no capabilities declared" test is `capabilityNamesOf(cfg).length === 0`.
   - Error texts unchanged. The config door has already refused every schema violation before this runs
     (`config.mjs:759-763`), so for every input it can see the reads are identical; the harness feeds this
     validator only schema-valid inputs (standard, repo, schema-valid part of the matrix) and says so.
6. `src/runner/work-dispatch.mjs:449-453`: rewrite the stale comment ("bind() falls back to the bare verb…"; the
   fallback was removed in 3133ed474): say the qualified name is what the Workflow units declare, and a config
   that declares only the bare verb has no entry for it. Comment only, no code change.

## Files

- Modify: `src/runner/dispatch/resolve.mjs`, `src/runner/dispatch/plan.mjs`, `src/runner/dispatch/confinement/request.mjs`,
  `src/runner/dispatch/config.mjs`, `src/runner/work-dispatch.mjs` (comment)
- Create/Delete: none

## Tests

No new test; owners unchanged: `test/runner/dispatch.test.mjs` (decide, `capability.unknown`,
purpose resolution), `test/runner/dispatch-plan-policy.test.mjs`, `test/runner/dispatch-confinement-*.test.mjs`
(confinement request), `test/runner/dispatch-confinement-policies.test.mjs` and
`test/runner/dispatch-config-patterns.test.mjs` (validator), `test/runner/work-unit-for.test.mjs`,
`test/runner/spawn-worker.test.mjs` (Work-driven capability identity). Retired: none.

## Gates

```
node scripts/run-tests.mjs test/runner/dispatch.test.mjs test/runner/dispatch-plan-policy.test.mjs \
  test/runner/dispatch-policy-baseline-snapshot.test.mjs test/runner/dispatch-executor-profile.test.mjs \
  test/runner/egress-governance.test.mjs test/runner/dispatch-confinement-authority.test.mjs \
  test/runner/dispatch-confinement-p04.test.mjs test/runner/dispatch-confinement-p05.test.mjs \
  test/runner/dispatch-confinement-backend-p03.test.mjs test/runner/dispatch-confinement-blind.test.mjs \
  test/runner/dispatch-confinement-machine-private.test.mjs test/runner/dispatch-confinement-policies.test.mjs \
  test/runner/dispatch-config-patterns.test.mjs test/runner/tier-fallback-config.test.mjs test/setup/runner-config-conversion.test.mjs test/runner/cli-spawn-reconciliation.test.mjs \
  test/runner/credential-store.test.mjs test/runner/provider-per-cli-credential-sources.test.mjs \
  test/runner/work-unit-for.test.mjs test/runner/spawn-worker.test.mjs test/runner/operation-choice.test.mjs \
  test/runner/assignment-provenance.test.mjs test/runner/assignment-dispatch.test.mjs test/runner/work-path-case-admission.test.mjs \
  test/state/work-size-rigor.test.mjs test/setup/capability-catalog-doctrine.test.mjs \
  test/runner/dispatch-reconciliation-import-graph.test.mjs test/architecture.test.mjs
node scripts/doc-health.mjs
node scripts/check-decision-citation-drift.mjs
```
Plus `rg -l "dispatch/resolve.mjs|dispatch/plan.mjs|confinement/request.mjs|dispatch/config.mjs|work-dispatch.mjs" test`.
Rust: not touched.

## Net size

src: −~30 (alias/known-name copies, `preferSitesOf` and the name set deleted; inline reads become calls). Tests: 0.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| `config.mjs` gains an import the import-graph test pins | M x M | `dispatch-reconciliation-import-graph.test.mjs`; the port is a leaf with one kernel import |
| Alias/own-key semantics drift in purpose resolution | L x H | harness compares `resolveCapabilityDetailsFromHints`, `resolveExecutorAndOverrides`, `compileDispatchPlan` for every name, executor and prototype probe; only allowlisted deltas pass |
| Validator prefer labels change | M x M | label strings rebuilt in the same order; `dispatch-config-patterns.test.mjs`, `tier-fallback-config.test.mjs`, harness error-text compare |
| This phase and 06 both edit `resolve.mjs`/`plan.mjs`/`work-dispatch.mjs` | M x M | 06 starts only after this phase is merged (plan.md parallel map) |

## Rollback

Revert the phase merge (plan.md Rollback).

## Success criteria

`rg "\.capabilities\b" src/runner/dispatch src/runner/work-dispatch.mjs` finds no config read (only
`contract.capabilities`/`payload.capabilities` hints in `execution-contract.mjs` and `assignment.mjs`, out of
scope); gates green.
