# Phase 10: doctor dry-bind check replacing the two old rows

Owner: Sonnet lead in a worktree from the track. Size M (1d). After 09.

## Context

- Spec `docs/specs/seat-binding.md` §9 step 8; §3 (`explain` and `dry-bind` = the same function without a lease) [RT-16b].
- Today (`registrations.mjs`): `model-policy-tier-coverage` :1467, `workflow-pools-satisfy-independence` :4772 (`workflow-pool-independence.mjs`), `tier-fallback` :1485, `tier-vocabulary-dead-keys` :1461, `blind-steps-use-proven-pools` :4781, `executor-posture-coverage` :4790; `simulateUnitBindings` in `dry-bind.mjs`. (`capability-rigor-ceiling` and `runner-rigor-config` were deleted in 06 [RT-16a].)

## Requirements

- New row `seat-binding-dry-bind`: every registered workflow (incl. packaged, 03), every unit, every seat from the 02 resolver, bound through `explainSeat` (07) without a lease, in resolver order with peers published.
- [RT-16g] Binds against a **fixed headless session** (no lead, no herdr session assumptions beyond installed facts). Severity: a policy refusal (`tier-cell-missing`, `independence-unsatisfiable`, `pin-unsatisfiable`, `effort-unsupported`) fails; "no pool configured" (no `prefer` anywhere) and account-state refusals (quarantine, exhausted) are **info**. Info lines also list `max-tier-cap` lowerings and soft-independence shares. Each workspace's expected refusals are written in the landing report (mcp-skill-hub has no `prefer`; mdview `group-cognition:explore`).
- Delete `model-policy-tier-coverage` and `workflow-pools-satisfy-independence` (and `workflow-pool-independence.mjs` if unused).
- Keep and adjust: `tier-fallback` (six keys incl. `mini`), `tier-vocabulary-dead-keys`, `blind-steps-use-proven-pools` and `executor-posture-coverage` (on `explainSeat`), `executor-family-unique` unchanged.
- Exec cost of the row on forgentX recorded in the report (part of the per-surface budget, [RT-16e]).

## Files

- Modify: `src/setup/registrations.mjs`, `src/setup/model-pool-checks.mjs`, `src/setup/blind-steps-proven-pools.mjs`, `src/setup/executor-posture-coverage.mjs`, `src/runner/execution/dry-bind.mjs`.
- Delete: `src/setup/workflow-pool-independence.mjs` (if unused) and its test.
- Tests: `test/setup/model-pool-checks.test.mjs`, `test/setup/blind-steps-proven-pools-check.test.mjs`, new `test/setup/seat-binding-dry-bind.test.mjs`.

## Steps

1. Row on `simulateUnitBindings` / `explainSeat` with the fixed headless session.
2. Delete the replaced rows; update doctor listing tests.
3. Run on the converted forgentX config and on mdview-/mcp-skill-hub-shaped fixtures; record expected info lines.

## Tests

- Seat with no allowed cell fails with the §10.2 variant C message.
- Judge with no independent family fails `independence-unsatisfiable`.
- Capability with no `prefer` anywhere → info, not failure.
- Converted forgentX config: row passes.

## Risks / rollback

- L×M machine facts differ per host: same `launchView` as the runner. Rollback: revert on the track.
