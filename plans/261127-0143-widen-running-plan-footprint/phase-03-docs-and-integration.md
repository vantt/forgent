# Phase 3: Spec, skills, changelog and integration

Capability: `code:implement` for the text, then `code:test` for the integration gate. Starts after phase 2 is on
main **and** plan `261126-2318-plan-footprint-overlap-warns` is `done` (it owns the supervision spec and the
supervisor skill until then; owner order 2026-11-27).

## Inputs

- `plans/261127-0143-widen-running-plan-footprint/plan.md` (acceptance criteria 6 and 7, "Decisions this plan takes").
- `plans/discussions/ds-mzyircswox-widen-a-running-plan-footprint/DISCUSSION.md` §4 D1, §6.
- `docs/platform/supervision/spec.md`: PS-24 (around lines 152 and 221), the "Lịch sử quyết định" section.
- `docs/platform/session-host/spec.md`: the `land` row (around line 181).
- `core/skills/fgos-lead/SKILL.md` (refusal table, line 81), `core/skills/fgos-supervisor/SKILL.md`.
- `docs/platform/governance.md#decision-scope-to-holder-table` for where the decision narrative lives.

## Files this phase may write

`docs/platform/supervision/spec.md`, `docs/platform/session-host/spec.md`, `core/skills/fgos-lead/SKILL.md`,
`core/skills/fgos-supervisor/SKILL.md`, `changelog.d/261127-0143-a-running-plan-widens-its-own-footprint.md`,
`plans/261127-0143-widen-running-plan-footprint/reports/**`. Generated skill surfaces are rebuilt by the land door
(`land.regenerate`); do not edit them by hand.

## Steps

1. Supervision spec: restate PS-24 as amended (a lead changes its own footprint only through `supervisor widen`;
   every other change stays `footprint-change-refused`); describe the widen door (inputs, criterion check, both
   copies, overlap as advice, refusal codes); add a "Lịch sử quyết định" entry citing D1 of `ds-mzyircswox` and the
   owner decision of 2026-11-26 12:41 +07.
2. Session-host spec `land` row: one clause pointing to the widen door as the exception path.
3. Lead skill: in the refusal table, `write-outside-footprint` → widen with `supervisor widen` when the path serves
   an acceptance criterion, otherwise ask the owner in the five-part form; `footprint-change-refused` → use the
   widen verb. Supervisor skill: one line that the supervisor may widen any running plan with the same verb.
4. `changelog.d/261127-0143-a-running-plan-widens-its-own-footprint.md`: one user-visible line.
5. Integration: on the combined tree run the full gate and write `reports/integration.md` with the commands, exit
   codes and the commit tested.

## Verify

```bash
npm test
cargo test --workspace
node scripts/plan-contract-check.mjs --plan plans/261127-0143-widen-running-plan-footprint
```

Pass: all exit 0; `reports/integration.md` records them.

## Rollback

Revert this phase's commit; the verb and route keep working, only their documentation goes.
