# Phase 07: post-activation proof, board row, reversal-trigger watch

## Context

- [plan.md](plan.md) Definition of done; phases 03-06 merged; release activated on the owner machine (and the second machine per the sync guide).

## Steps

1. **Real rounds** with `npm run fgos:dev -- run ... --json`, one confined round per changed path, reading `data.results[-1]`:
   - a code capability on the first family of its `prefer`;
   - a forced failover: quarantine the first account of a pool with `fgos dispatch reconcile` in a temp runtime dir, expect the second account, then (second account quarantined) the next cell entry or family at the same tier; provenance names pool, account and kind;
   - a pinned seat `--account pool/account`;
   - after Proposal B, one round through pool `openrouter`.
   Each ends `completed-pass`; the private home holds exactly the declared files.
2. **Refusal check:** a throwaway config with a missing tier cell refuses `tier-cell-missing` naming the cell, at `bind()` and at assignment policy.
3. **Board:** update the MP-B1 row (state, evidence, landing commit) and the MP-C row note that the transition read of `runner.providers.*.accounts` is marked in `provider-capacity.mjs`, with its removal condition.
4. **Reversal-trigger watch:** record in the board note that the owner checks `fgos dispatch inspect` after a week. Account ordering goes back to least-lease if one account keeps hitting its quota window while others sit idle; tier groups change when a family's model at a tier stops being equivalent.

## Output

Short report under the convention path with the round ids, provenance excerpts and any deviation.

## Risk / rollback

Low. A failed real round blocks the board update, not the code; fix forward or revert phases 03+04.
