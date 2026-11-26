# Phase 2: Integration

Capability: `code:test`. Depends on: 1. Wave 2.

## Inputs

- Phase 1's landed commit, and this plan's acceptance criteria and its "Shared files left out" section.

## Files this phase may write

`plans/261126-0856-launcher-runs-owning-release-in-linked-worktree/reports/integration.md`.

## Steps

1. On main after phase 1 landed, run `npm test` and `cargo test --workspace`.
2. Write `reports/integration.md` with one line per acceptance criterion and its evidence. For each failure, show
   whether it touches this plan's footprint.
3. In the same report, under the heading `Post-done land`, write the exact text of the three lines for the small
   land after `done`:
   - this plan's `CHANGELOG.md` `[Unreleased]` line;
   - the config refusal line given in `plan.md`;
   - the dated RUL17 sentence for `docs/platform/packaging-distribution/spec.md`.
   Then raise it to the supervisor
   (`fgos supervisor raise coordination-help ...`) so the line land is done once the overlapping plans allow it.

## Verify

```bash
npm test
cargo test --workspace
```

Pass: both suites are green, or each failure is shown in the report to come from outside this plan's footprint.
The report also has the `Post-done land` section.

## Rollback

Nothing to undo; this phase writes only its report.
