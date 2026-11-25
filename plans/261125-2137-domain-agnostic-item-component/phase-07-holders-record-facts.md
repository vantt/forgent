# Phase 7: Holders record their own facts

Status: draft. Decision: A4 (whoever decides a fact records it).

## Inputs
- Discussion §6 "Who records what" table.
- `fgos portfolio record` from phase 5; the caller reference from phase 3.
- `core/skills/fgos-secretary/`, `fgos-supervisor/`, `fgos-shaping/`, `fgos-lead/`, `domains/coding/skills/fgos-coding-shaping/`; `src/session-host/head-grants.mjs` (`GRANTS`), `packages/session-host/contracts/head-permissions.v1.json`.

## Footprint
- `core/skills/fgos-secretary/**`, `core/skills/fgos-supervisor/**`, `core/skills/fgos-shaping/**`, `core/skills/fgos-lead/**`, `domains/coding/skills/fgos-coding-shaping/**`
- `src/session-host/**`, `packages/session-host/**`, `test/session-host/**`, `test/portfolio/**`
- generated renders `.agents/skills/**`, `plugins/fgOS/skills/**`, `.claude/skills/**`

## Steps
1. Secretary skill: record life facts (drop, merge, withdraw, re-pin) and create initiatives through the door.
2. Supervisor skill: record only coordination facts (admit, assign a lead, park, resume, reprioritise); it reads only through the ports.
3. Shaper, planner and lead skills: record progress facts (discussion settled, plan ready, phase done with evidence) through the door.
4. Grant `portfolio record` per fact kind in `GRANTS` and `head-permissions.v1.json`; a head may record only its own kind.
5. Remove every instruction that hand-edits a status or stage in a portfolio file.
6. Add one end-to-end test in `test/portfolio/` that runs one initiative Init → Retrospective with each fact recorded by its decider, and a refused fact recorded by the wrong kind.
7. Run `npm run build:skills`.

## Verify
`node --test test/portfolio/ test/session-host/head-grants.test.mjs` passes.

## Rollback
`git revert` the phase commit and rerun `npm run build:skills`.
