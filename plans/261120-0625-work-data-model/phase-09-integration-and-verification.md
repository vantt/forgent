# Phase 9: Integration and verification

## Inputs
- Phases 1 through 8 landed.
- Settled discussion `docs/discussions/work-data-model/DISCUSSION.md` §6, D-ADR0082.

## Files it may write
- `plans/261120-0625-work-data-model/reports/integration.md`
- `CHANGELOG.md`
- `docs/platform/system-overview/spec.md`

## Steps
1. Execute full workspace test suites:
   - `cargo test --workspace`
   - `npm test`
   - `node scripts/plan-contract-check.mjs --all`
2. Run mechanical checks on portfolio files:
   - Verify all `plans/backlog/*.md` and `plans/discussions/*/DISCUSSION.md` pass contract validation.
   - Verify `plans/backlog.md` matches the freshly generated index.
   - Confirm `git grep docs/discussions` and `git grep docs/backlog.md` find only historical references.
3. Update `docs/platform/system-overview/spec.md` and related architecture specs to reflect the unified `plans/` portfolio storage model and D-ADR0082.
4. Record user-visible changes in `CHANGELOG.md` under `## [Unreleased]`.
5. Produce final integration report in `plans/261120-0625-work-data-model/reports/integration.md`.

## Verify
`cargo test --workspace`; `npm test`; `node scripts/plan-contract-check.mjs --all` exit 0; clean report generated.

## Rollback
Revert the integration commit.
