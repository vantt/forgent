# Phase 2: Grants, personas and skills

## Inputs
`src/session-host/head-grants.mjs` (GRANTS, QUESTION_VERBS pattern); `core/agents/secretary.yaml`, `supervisor.yaml`;
`core/skills/fgos-secretary/SKILL.md`, `fgos-supervisor/SKILL.md`; discussion section 6 table and row 5 (the two mismatches).

## Files it may write
Its footprint in the plan table. The render copies (`.agents`, `.claude/skills`, `plugins`) are regenerated with
`npm run build:skills`, never hand-edited.

## Steps
1. Change `GRANTS.secretary` and `GRANTS.supervisor` to the table, using shared verb lists so a verb is named once.
   Miu keeps `land --paths` for portfolio files only.
2. Rewrite both persona yamls and both skills from `head-grants.mjs`: "hands a plan" becomes "raises it on the queue and
   wakes the supervisor"; remove "never lands work" where the grant has `land --paths`; state who wins (owner, then a
   direct Miu order, then the supervisor's choice) and that the supervisor stops or replaces only heads.
3. Update `test/session-host/head-grants.test.mjs` so each persona's verb list is asserted from one expected table, plus
   that Miu lacks `supervisor handled`, `session read`, `session type`, `watcher tune`.
4. `npm run build:skills`.

## Verify
`node --test test/session-host/head-grants.test.mjs`; `npm run build:skills` leaves no diff beyond the render copies;
the head-start preflight of each persona (backlog p-2wb2lfgky3) passes.

## Rollback
Revert the commit; verbs stay but no head can ask for them.
