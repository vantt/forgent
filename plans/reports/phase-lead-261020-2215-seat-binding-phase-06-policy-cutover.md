# Seat Binding policy cutover: phase lead report

## 1. Behaviour changes

- Stage-1 policy (tier, prefer, tier fallback, `maxTier`) is asked of the crate through `src/runner/execution/seat-policy.mjs` and `src/seat-binding/client.mjs`. Stage 2 rank stays in Node. A `SeatBindingError` is never hidden.
- Tier precedence: seat, persona, role, workflow recommendation, capability, `<prefix>:*`, `defaults.tier`. `maxTier` lowers visibly (`loweredFrom`, `max-tier-cap`). The bare verb (`review` for `code:review`) is no longer a lookup key.
- Rigor sets checker count and independence only. It no longer yields a tier or an effort. Without an explicit effort the invocation default applies.
- Project config with `rigorToTier`, or without `runner.patterns.seatBinding`, is refused with `config-not-converted` ("run `fgos setup`"); file bytes stay unchanged. A project with no or empty `runner` is fresh: the writer adds the marker. Global `rigorToTier` is silently dropped (one stderr note per process); a seat-binding key in the global file is refused. `~/.fgos/config.json` was not edited.
- `snapshotRunnerConfig` now hashes defaults, maxTier, tierFallback, capabilities, patterns, modelPolicies, executors and governance (`$comment` stripped, `rigorToTier` dropped).
- Override provenance is `override` (or `override:<origin>`) and no door claims `human-cli` any more.

## 2. Deleted symbols and replacements

- `resolveAssignmentDispatchPolicy` / `assignment-policy.mjs` -> `effectiveDispatchPolicy` in `src/runner/dispatch/plan.mjs` (exported for tests).
- `resolveStrongerTier`, `TIER_STRENGTH` -> crate owns tier order. `rigorToTier`, `DEFAULT_RIGOR_TO_TIER`, `validateRigorToTierShape` removed (legacy map kept private in `seat-binding-conversion.mjs`).
- `resolveSeatTier`, `resolveTierCeiling`, `lookupCapabilityConfig` in `bind.mjs` removed (`hasUsablePrefer` now in `seat-resolver.mjs`).
- Doctor rows `runner-rigor-config`, `capability-rigor-ceiling` (and `checkCapabilityRigorCeiling`) removed; `model-policy-tier-coverage` checks `runner.defaults.tier` only.
- `scripts/project-agents.mjs`: no model in generated agents (a persona's rigor names no model).
- Dead helpers in `assignment-runner.mjs` removed.

## 3. Helpers moved

- `executor-governance.mjs` (`resolveExecutorProvider`, `resolveExecutorGovernance`), `work-item-input.mjs` (`refuseWorkItemInput`) as `infra` rows in `docs/architecture-manifest.json`; `seat-policy.mjs` new.

## 4. Fixture codemod

`.fgos/runtime/tmp/codemod-fixtures.py` replaced each `rigorToTier: {...}` literal with `defaults: { tier: 'standard' }, patterns: { seatBinding: { schema: 1 } }` in about 57 test files plus `test/fixtures/confinement-migrated-executors.json`. Excluded: conversion, doctor-config, project-agents, work-size-rigor and seat-binding-config fixtures. Config-writing helpers gained the marker (loop-worker-fixture, dispatch tests, checks tests, fgos-tool, fgos-stage, retired-doors, plan-lint via `FRESH_PROJECT_RUNNER_CONFIG`). Fixtures using a frontier recommendation got a `frontier` cell.

## 5. Hand-rewritten asserting tests (new semantics, none weakened)

`bind.test` (rigor, ceiling, maxTier, acceptDependence, bare verb, prefer sources), `tier-fallback`, `explain`, `bind-committed-config`, `run-provider-failover`, `seat-resolver`, `driver-rununit`, `spawn-worker`, `dispatch-execute-for-capability`, `dead-vocabulary-guard`, `work-size-rigor`, `tier-fallback-config`, `dispatch.test` rigorToTier/compile/cli-bypass tests, `checks`, `registrations`, `checks-doctor-config`, `model-pool-checks`, `executor-posture-coverage-check`, `blind-steps-proven-pools-check`, `seat-binding-conversion` (inline oracle), `project-agents` (model-line tests removed), `run-verb`, `units-runner`, `architecture` (allowlist), `assignment-policy.test` renamed to `dispatch-plan-policy.test` (two stronger-tier tests and malformed-map test dropped: mechanism retired). New tests: seat-policy (5), bind-tier-composition (9), config-seat-binding-layers (6), config-snapshot-hash (4), tool-executor-seats (2, golden), unit-handoff-raise-door (4), unconverted-project-refusal (6).

## 6. Config diff (`.fgos/config.json`, field names only)

Removed `rigorToTier.*`. Added `defaults.tier`, `patterns.seatBinding.schema`, `$comment`, `tierFallback.mini`, tiers/maxTier on `architecture:{frame,shape,critique,synthesize,explain}`, `business:synthesize`, `delphi:synthesize`, producer seat tiers, `code:*` and `marketing:*` `roles.red-team.prefer`. Changed `prefer` of `business:perspectives`, `delphi:propose`, `group-cognition:explore`, `nominal-group:generate`.

## 7. Raise doors

Each refused before the run exists: `fgos run` (`--tier`, `--override`, `--persona`, `--capability`), `workflow start --seats` (unit-handoff), `work-dispatch`, `operation-choice`, `fanout-batch`; all pass `raiseAuthorized: false`. Tests: `run-verb`, `unit-handoff-raise-door`, `fanout-batch-runner-commit`, `bind-tier-composition`.

## 8. Tool-executor proof

`test/runner/tool-executor-seats.test.mjs` against `test/fixtures/tool-executor-seats.golden.json`, captured from the base tree; normalization strips only `provenance.tier.source` and the rigor-derived effort. Old and new output are identical.

## 9. Test counts (verified by me, un-piped, concurrency 2)

- `test/runner test/setup test/workflow test/cli test/e2e test/architecture.test.mjs`, 337 files: 5512 tests, 5439 pass, 0 fail, 0 cancelled, 8 skipped, 65 todo.
- `test/direct test/intake test/parity test/run-supervisor`, 32 files: 465 tests, 464 pass, 0 fail, 1 skipped.
- `scripts/check-decision-codes.mjs` lists only pre-existing test titles; none in files added or retitled here. Full `npm test` not run (per brief). GitNexus `detect_changes` not run: index stale (degraded posture).

## 10. Deviations and caveats

- `src/workflow/runner.mjs` untouched, so `workflowId` is not passed and the workflow tier source reads `workflow:<unit>/<seat>` instead of `workflow:<id>/<unit>/<seat>`. Follow-up: 2-line change.
- `dry-bind.mjs` computes `workflowTierOf` twice (minor cleanup).
- `$comment` and `tierFallback.mini` not written into test fixtures.
- Out-of-list docs touched: setup-doctor-registry contract, `docs/specs/distribution.md`, the install how-to (removed deleted rows).
- `assignment.mjs` takes the contract tier as given. The probe-account path still gets its default-tier model through `executeAssignment`; the existing probe test already pins `cliOverride`.
- Real `~/.fgos/config.json` still has `rigorToTier`; stderr note appears, file untouched.
- Commits: 3133ed474 (runner + src + docs + CHANGELOG), 6c85210a4 (tests), 37ab5c0fc (repo config). Nothing pushed or merged. Logs in `.fgos/runtime/tmp/` (g-final.log, g-extra.log).
