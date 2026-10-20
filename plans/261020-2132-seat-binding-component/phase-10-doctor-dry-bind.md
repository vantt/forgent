# Phase 10: doctor dry-bind check replacing the two old rows

Owner: Sonnet lead in a worktree from the track. Size M (1d). After 09.

## Context

- Spec §8 step 8; §3.2 (`explain` and `dry-bind` = the same function without a lease).
- Today (`src/setup/registrations.mjs`): `model-policy-tier-coverage` :1467 (reads `rigorToTier` tiers, :765-789), `workflow-pools-satisfy-independence` :4772 (`src/setup/workflow-pool-independence.mjs`), `capability-rigor-ceiling` :1515, `tier-fallback` :1485 (`model-pool-checks.mjs`), `tier-vocabulary-dead-keys` :1461, `blind-steps-use-proven-pools` :4781, `executor-posture-coverage` :4790; `simulateUnitBindings` `src/runner/execution/dry-bind.mjs`.

## Requirements

- New row `seat-binding-dry-bind`: for every registered workflow (loader, incl. packaged ones from 03), every unit, every seat from the 02 resolver, bind through the same facade call the runner uses, without a lease, in resolver order with peers published (§6.2). Reports per seat: refusals by name (fail), and info lines for `max-tier-cap` lowerings and soft-independence shares. Same function as `fgos dispatch explain` and `dry-bind`; no second implementation.
- Delete `model-policy-tier-coverage` and `workflow-pools-satisfy-independence` (and `workflow-pool-independence.mjs` if nothing else uses it); delete `capability-rigor-ceiling` (plan decision 9).
- Keep and adjust: `tier-fallback` (six keys incl. `mini`; families in a list need a cell at that tier, unmet = omitted key per §4.3), `tier-vocabulary-dead-keys`, `blind-steps-use-proven-pools` and `executor-posture-coverage` (call the facade path instead of the deleted Node ranking), `executor-family-unique` unchanged.
- Exec cost: dry-bind on forgentX's registered workflows measured; if it exceeds a few seconds, the report says so (no batching op unless the owner asks; §13 discipline).

## Files

- Modify: `src/setup/registrations.mjs`, `src/setup/model-pool-checks.mjs`, `src/setup/blind-steps-proven-pools.mjs`, `src/setup/executor-posture-coverage.mjs`, `src/runner/execution/dry-bind.mjs`.
- Delete: `src/setup/workflow-pool-independence.mjs` (if unused), its test.
- Tests: `test/setup/model-pool-checks.test.mjs`, `test/setup/workflow-pool-independence-check.test.mjs` (removed or rewritten for the new row), `test/setup/blind-steps-proven-pools-check.test.mjs`, new `test/setup/seat-binding-dry-bind.test.mjs`.

## Steps

1. Row on top of `simulateUnitBindings` (seat-based since 02, crate since 07).
2. Delete the replaced rows; update `fgos doctor` listing tests.
3. Run on the converted forgentX config: expected info lines for §9.2 variant B situations only where the config sets them.

## Tests

- A workflow whose seat has no allowed cell fails with the §9.2 variant C message.
- A judge with no independent family fails `independence-unsatisfiable`.
- Converted forgentX config: row passes.

## Risks / rollback

- L×M: dry-bind depends on machine facts (installed CLIs, herdr). Use the same `launchView` as the runner; a missing CLI is reported as the runner would refuse.
- Rollback: revert the merge on the track.
