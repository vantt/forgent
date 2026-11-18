# Phase 9 — Capture channels: skills and worker claims

Layer 2 (OM-D4): observe at more places without slowing or changing the agent.

## Inputs
- DISCUSSION §6 D (three capture channels).
- Phase 7 (the friction flags).
- The skills under `core/skills/` and `domains/coding/skills/` for shaping, planning, driving and the secretary
  persona (`rg -l 'fgos-shaping|fgos-coding-planning|fgos-coding-driving' core domains`).
- `src/runner/dispatch/settlement.mjs`, which already settles the agent claim, and
  `packages/run-result/contracts/run-result.read.v1.json`.

## Footprint
`core/skills/_shared/friction-capture.md`, `core/skills/**`, `domains/coding/skills/**`, `.agents/skills/**`,
`plugins/fgOS/skills/**`, `.claude/skills/**` (generated), `src/runner/dispatch/settlement.mjs`,
`packages/run-result/contracts/run-result.read.v1.json`, `test/runner/dispatch/settlement*.test.mjs`.

## Steps
1. Write `core/skills/_shared/friction-capture.md`. It says when to record: a workaround was needed, two rules
   conflicted, a tool was missing, a doc was wrong or stale, or the agent waited or retried. It also says how: one
   `fgos friction record` with `--kind`, `--layer`, a reused signature (`fgos friction classes` first), and refs to the
   plan, phase or backlog row. Recording is a side channel, so the agent never stops on its failure.
2. Point the shaping, planning, driving and secretary skills at the fragment, in their sources only. Regenerate the
   renders with `npm run build:skills`. Never edit them by hand.
3. Worker claims may carry `frictions[]` with the same fields. Settlement records each one through the friction door,
   with refs to the run and to the Unit's plan and phase. Recording happens after the outcome is settled and is
   bounded in time, so a failure never changes the outcome. Extend `run-result.read.v1.json` additively.
4. Tests extend the owning settlement test: a claim with two frictions produces two records with refs, and a write
   failure leaves the outcome unchanged.

## Verify
- `node scripts/run-tests.mjs test/runner/dispatch` is green.
- `npm run build:skills` leaves no diff after the commit.

## Rollback
Revert the phase commit, then rebuild the skills.
