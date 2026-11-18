# Phase 12 — Capture channels: skills, plan key, worker claims

Layer 2 (OM-D4) observes at more places without slowing the agent or changing what it does.

## Inputs
- DISCUSSION §6 B (skills pass `--plan`/`--phase`) and §6 D (the three capture channels).
- Phase 3 (the plan key) and phase 9 (the friction flags).
- Skill sources for shaping, planning, driving and the secretary persona. Find them with
  `rg -l 'fgos-shaping|fgos-coding-planning|fgos-coding-driving' core domains`.
- `src/runner/dispatch/agent-result-claim-contract.mjs` (`CLAIM_FIELD_RULES`, which owns the claim shape and the
  worker instructions).
- `src/runner/dispatch/settlement.mjs`.
- `packages/run-result/contracts/run-result.read.v1.json`.
- The owning test `test/runner/assignment-runresult.test.mjs`.

## Footprint
`core/skills/_shared/friction-capture.md`, `core/skills/**`, `domains/coding/skills/**`, the generated renders
`.agents/skills/**`, `plugins/fgOS/skills/**` and `.claude/skills/**`, `src/runner/dispatch/agent-result-claim-contract.mjs`,
`src/runner/dispatch/settlement.mjs`, `packages/run-result/contracts/run-result.read.v1.json`,
`test/runner/assignment-runresult.test.mjs`.

## Steps
1. Write `core/skills/_shared/friction-capture.md`.
   - Record when: a workaround was needed, rules conflicted, a tool was missing, a doc was wrong or stale, or the
     agent waited or retried.
   - Record how: run `fgos friction classes` first and reuse a signature. Then run one `fgos friction record` with
     `--kind`, `--layer` and refs to the plan, phase or backlog row.
   - Recording is a side channel and never stops the agent.
2. The shaping, planning, driving and secretary skill sources point at the fragment. The driving skill passes `--plan`
   and `--phase` to `fgos run` and `fgos workflow start` (DISCUSSION §6 B). Regenerate the renders with
   `npm run build:skills`.
3. Worker claims may carry `frictions[]`, declared in `CLAIM_FIELD_RULES` and the worker instruction text.
   Settlement records each one through the friction door, with refs to the run and to the Unit's plan and phase. It
   does this after the outcome is settled and bounded in time, so a recording failure never changes the outcome.
   Extend `run-result.read.v1.json` additively.
4. Tests extend `assignment-runresult.test.mjs`:
   - a claim with two frictions gives two records with refs;
   - a write failure leaves the outcome unchanged.

## Verify
- `node scripts/run-tests.mjs test/runner/assignment-runresult.test.mjs` passes.
- After the commit, `npm run build:skills` leaves no diff.

## Rollback
Revert the phase commit, then rebuild the skills.
