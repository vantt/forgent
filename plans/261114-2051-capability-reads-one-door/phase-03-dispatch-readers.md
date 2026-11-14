---
phase: 03
title: "Dispatch readers: purpose resolution, confinement request, dispatch plan, load validator"
status: pending
effort: 3h
depends_on: [01]
parallel_with: [02, 04, 05]
---

# Phase 03 — Dispatch readers

## Context

Port exists (phase 01). Read `plan.md` census rows 15-21 and "What step 1 leaves ready for step 2".
This phase changes where values are read, never what is decided: `resolveExecutorAndOverrides` keeps
choosing a purpose's executor from the first `prefer` entry, and the reverse match keeps comparing a raw
`prefer` with `===` (a list-shaped `prefer` never matches, as today). Both are recorded leftovers for step 2.
Impact analysis (as phase 01) on `resolveCapabilityDetailsFromHints`, `resolveExecutorAndOverrides`,
`buildConfinementRequest`, `validateRunnerConfigShape`, `compileDispatchPlan`.

## Requirements

1. `src/runner/dispatch/resolve.mjs` `resolveCapabilityDetailsFromHints` (lines 28-133): drop the local
   `capabilities` object.
   - `resolveAlias(name)`: non-string passes through; else `registeredCapabilityOf(cfg, name) ?? name`.
   - Capabilities preferring this executor (66-71): `capabilityNamesOf(cfg)` filtered by
     `const p = preferOf(cfg, name); p && (p === executorId || (resolvedExecutor && cfg?.executors?.[p] === resolvedExecutor))`
     — same predicate, same iteration order.
   - Confinement filters (90-130): `capabilityConfinementOf(cfg, c)` (`?.mode === 'required'`, truthiness).
   - Registered filter (113): `hasCapabilityEntry(cfg, c)`.
2. `resolve.mjs:237-238` `resolveExecutorAndOverrides`: `const preferred = preferOf(cfg, executorIdOrPurpose);`.
   Rest unchanged (still `normalizePreferCandidates` from `config.mjs`).
3. `src/runner/dispatch/plan.mjs:22-32`: delete `isKnownCapabilityName` and its comment; the `capability.unknown`
   check (line 492) becomes `registeredCapabilityOf(cfg, purpose) === undefined` (identical predicate:
   own key or alias).
4. `src/runner/dispatch/confinement/request.mjs:315-337`: `capConfinement`, `skillConfinement` and the fallback
   anchor read through `capabilityConfinementOf(cfg, …)`. Error texts unchanged.
5. `src/runner/dispatch/config.mjs` load validator: `checkPreferTargets` (701), `checkConfinementAgainstPolicies`
   (732-756) and `validateRunnerConfigShape` (769-773) iterate `Object.entries(catalogOf(cfg))`. It stays the
   Config load check (shape only); it acts on no field's meaning. Error texts unchanged.
6. `src/runner/work-dispatch.mjs:448-452`: rewrite the stale comment ("bind() falls back to the bare verb…"; the
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
  test/runner/dispatch-config-patterns.test.mjs test/runner/cli-spawn-reconciliation.test.mjs \
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

src: −~20 (local alias/known-name copies deleted, inline reads become calls). Tests: 0.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| `config.mjs` gains an import the import-graph test pins | M x M | `dispatch-reconciliation-import-graph.test.mjs`; the port is a leaf with one kernel import |
| Alias/own-key semantics drift in purpose resolution | L x H | identical predicate; equivalence script compares `resolveCapabilityDetailsFromHints` and `resolveExecutorAndOverrides` for every name and executor |
| Someone "fixes" the string-only reverse match here | M x H | requirement 1 states it is kept; the fix is step 2's (behaviour change) |

## Rollback

Revert the phase commit.

## Success criteria

`rg "\.capabilities\b" src/runner/dispatch src/runner/work-dispatch.mjs` finds no config read (only
`contract.capabilities`/`payload.capabilities` hints in `execution-contract.mjs` and `assignment.mjs`, out of
scope); gates green.
