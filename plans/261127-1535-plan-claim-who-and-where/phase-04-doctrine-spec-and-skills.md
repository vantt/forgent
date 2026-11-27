# Phase 4: Doctrine: spec and skills

Decisions: D2, D4 to D9. Capability: `code:implement`. Runs beside phase 3 and states the behaviour the discussion
settled, which phase 3 implements.

## Inputs

- The discussion, sections 4 and 6.
- `docs/platform/supervision/spec.md` sections 1.2 (admission reasons), 2 (shared entities), 4 (`supervisor plans`),
  6 (failure modes) and 8 (decision history).
- `core/skills/_shared/plan-contract.md` section 2 (frontmatter table);
  `domains/coding/skills/fgos-coding-planning/SKILL.md` ("No claimed item: the plan path");
  `core/skills/fgos-secretary/SKILL.md`.

## Files it may write

Sources: `docs/platform/supervision/spec.md`, `core/skills/_shared/plan-contract.md`,
`domains/coding/skills/fgos-coding-planning/SKILL.md`, `core/skills/fgos-secretary/SKILL.md`.

Generated copies, only through `npm run build:skills`, never by hand: `.agents/skills/_shared/plan-contract.md`,
`.agents/skills/fgos-coding-planning/SKILL.md`, `.agents/skills/fgos-secretary/SKILL.md`,
`plugins/fgOS/skills/_shared/plan-contract.md`, `plugins/fgOS/skills/fgos-coding-planning/SKILL.md`,
`plugins/fgOS/skills/fgos-secretary/SKILL.md`.

## Steps

1. Spec: admission rules (host filter, the four admission steps, the push-outcome table), reason codes
   (`held-other-machine:<host>`, `host-unnamed`, `host-change-refused`, `machine-id-missing`), the `host` field in
   shared entities, and a decision-history entry for D2 and D4 to D9 citing the discussion, naming D1 and D3 as
   superseded.
2. `plan-contract.md`: a `host` row (optional Identity machine id; on `ready` only that machine may run the plan; on
   `running` written by admission; a change on a running plan is refused).
3. Planner skill: write `host` only when the discussion or the owner names a machine; otherwise leave it out.
4. Secretary skill: it may set or change `host` on a `ready` plan through its portfolio land, never on a `running`
   one.
5. Run `npm run build:skills` and keep only the generated files listed above. Any other regenerated file means a
   source outside this phase changed: stop and report it.

## Verify

A second `npm run build:skills` leaves no diff; `node --test test/scripts/plan-contract-check.test.mjs` and the
skill-surface tests in `npm test` pass.

## Rollback

Revert the merge commit and rerun `npm run build:skills`.
