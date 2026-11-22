# Phase 4: Integration, docs and changelog

Capability: `code:test`. The last wave, and the single writer of the hot files.

## Inputs

- The merged branches of phases 1, 2 and 3.
- `plans/261122-2307-heads-rotate-on-their-own/plan.md`: Acceptance criteria.
- `plans/261122-2307-heads-rotate-on-their-own/reports/` (stop-payload-lists.md, status-line-payload.md).
- `docs/platform/session-host/spec.md` 8.8 and its "Lịch sử quyết định" section.
- `docs/platform/governance.md#decision-scope-to-holder-table`.

## Footprint

`docs/platform/session-host/spec.md`, `CHANGELOG.md`,
`plans/261122-2307-heads-rotate-on-their-own/reports/integration.md`.

## Steps

1. Merge the three phase branches onto one tree, and run the full gate on it.
2. Spec 8.8. "Stop, any head": crons never block, a background task holds soft only, and a weekly quota at
   `sessionRotation.quota` rotates at hard and quarantines the old account. "What a handoff records": the two new
   sections. Replace the "Not built" line with the status-line writer: its event, its path and its head-only
   registration. Add the head bind's lease-state overlay where the spec describes the head launch.
3. Decision history: one entry in the session-host spec's "Lịch sử quyết định" covering three changes. First, crons
   are carried rather than blocking, and a task holds soft only. Second, the weekly quota threshold is 0.9 and the
   reason it was chosen. Third, a head bind reads the lease state. Cite this plan and the discussion.
4. `CHANGELOG.md` `## [Unreleased]`: one line each for the three user-visible changes.
5. Write `reports/integration.md` with the gate output summary and the commit of the combined tree.

## Verify

```bash
npm test
cargo test --workspace
node scripts/plan-contract-check.mjs --plan plans/261122-2307-heads-rotate-on-their-own
```

The pass condition is that all three are green on the combined tree.

## Rollback

Revert the merge commit of the combined tree. Docs and the changelog revert with it.
