# Phase 2: Integration

Capability: `code:test`. Depends on: 1. Wave 2.

## Inputs

- Phase 1's landed commit and this plan's acceptance criteria.

## Files this phase may write

`plans/261126-0856-launcher-runs-owning-release-in-linked-worktree/reports/integration.md`.

## Steps

1. On main after phase 1 landed, run `npm test` and `cargo test --workspace`.
2. Write `reports/integration.md`: one line per acceptance criterion with its evidence. For each failure, show
   whether it touches this plan's footprint.

## Verify

```bash
npm test
cargo test --workspace
```

Pass: both green, or each failure shown to come from outside this plan's footprint.

## Rollback

Nothing to undo; report only.
