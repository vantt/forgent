# Phase 11: Integration

Status: draft.

## Inputs
- The landed branches of phases 1–10; this plan's acceptance criteria.

## Footprint
- `plans/261125-2137-domain-agnostic-item-component/reports/**`

## Steps
1. Merge every phase branch onto one tree (each already landed on `main`; confirm none is left).
2. Run `npm test` and `cargo test --workspace` on the combined tree.
3. Run `fgos portfolio check`, `fgos authority model --json` and `node scripts/plan-contract-check.mjs --all`.
4. Walk acceptance criteria 1–8 and record each command and result in `reports/integration.md`.
5. Report to the secretary the follow-up backlog rows named in the discussion hand-off (T2 deep design; I12 and I14) that do not exist yet; this phase writes no backlog row.

## Verify
Every acceptance criterion in `plan.md` passes and `reports/integration.md` records the evidence.

## Rollback
Nothing to revert in this phase; a failure reopens the phase that owns the broken behaviour.
