# Phase 07: ranking cutover — cells with effort, hard pins, independence, continuity, inline-lead removal, walk exports

Owner: Sonnet lead in a worktree from the track. Size L (1.5d). After 06.

## Context

- Spec `docs/specs/seat-binding.md` §5.3, §5.4 steps 5–6, §7.3, §8 [RT-16b].
- Today: Node ranking `bind.mjs` `prepare` :234, `walkOrder` :428, `bind` :453, `walkBindings` :708, `listCandidates` :724, `nextCandidate` :755, `retrySameCandidate` :786; `resolveTierModel`/`resolveTierCandidates`/`tierFallbackOf` uses :309, :317, :434 [RT-12]; independence :383-388; inline fallback :498-516; `bindingIdentity` :138; `resolveLaunch` :174; effort controls `provider-adapter.mjs:255`; confinement `confinement/policies.mjs:682-744`; write-gate recompute `assignment-runner.mjs:466-500` (`seatRoleOf` :1171, `walkStateOf`) [RT-5].

## Requirements

- `bind.mjs` builds `launchView` (per candidate executor: invocations that can carry the posture, from `resolvePostureInvocation`/`pickConfinedInvocation`; effort levels each invocation's CLI renders from `REASONING_EFFORT_CONTROLS`) and calls `bindSeat` once per seat per attempt with the cached policy. The answer names executor, invocation, model, effort, pool.
- Delete Node ranking: candidate filtering in `prepare`, `walkOrder`, spread, independence, `normalizeCandidates`, `findHerdrInvocation`, the decision part of `resolveLaunch` (fact collection stays), `poolUnusableReason` logic (facts passed in), and the last uses of `resolveTierModel`, `resolveTierCandidates`, `tierFallbackOf` (deleted from `resolve.mjs`) [RT-12].
- [RT-16c] **Walk exports, decided**: `bind.mjs` keeps one export for seat choice, `bind(ask, ctx, { walk })`, plus `explainSeat(ask, ctx)` (same crate call, no lease, returns the crate's ranked list, walk chain and explain structure). Deleted: `walkBindings`, `listCandidates`, `nextCandidate`, `retrySameCandidate`. Consumers move: `explain.mjs:7` → `explainSeat`; `blind-steps-proven-pools.mjs:13` → `explainSeat`; `run.mjs:15` walk → `bind` with walk state (`tried`, `excludePools`, same-candidate retry expressed as walk state).
- [P00-C14] Rigor-derived effort is gone: `REASONING_EFFORT_DEFAULT_FROM_RIGOR` (`assignment-policy.mjs:81`, used :382, `?? 'medium'`) was deleted in 06 with that file; from 06 on, a seat without an explicit effort runs at the invocation default. Effort now comes only from the cell (spec §5.3) or, without one, the invocation's own default; `--effort` and overrides at or above the cell keep working. Under D2 rigor sets only checker count and independence, so a high-rigor unit no longer gets higher effort by default; this is listed in the CHANGELOG (11) and the conversion `reports[]`.
- Effort: part of `bindingIdentity`, the binding snapshot and the write-gate comparison at `assignment-runner.mjs:466-500` [RT-5] (not `commit-unit-work.mjs`, which has no bind); `effort-below-cell`, `effort-unsupported` refusals; a cell without effort records the invocation default as not-a-promise.
- Hard pin `{executor, invocation}`: unavailable → `pin-unsatisfiable`.
- Independence per §7.3 from posture + peers (seat ledger); `explain` names the filter.
- Continuity (`sameSeat`, debate rebuttal): executor + model + effort kept, else `seat-continuity-unavailable`.
- Inline-lead escape removed; `session-lead-inline` only when the unit configured no candidate at all.
- `fgos dispatch explain` prints the crate's explain structure (spec §10.2 format).

## Files

- Modify: `src/runner/execution/{bind,run,explain,account-rotation,dry-bind}.mjs`, `src/runner/dispatch/assignment-runner.mjs` (gate comparison only, :466-500), `src/runner/dispatch/resolve.mjs` (deletions), `src/runner/dispatch/provider-adapter.mjs` (export rendered levels only), `src/setup/{executor-posture-coverage,blind-steps-proven-pools}.mjs` (call sites).
- Tests: `test/runner/execution/{bind,explain,tier-fallback,run-posture,run-provider-failover,account-pin,account-rotation}.test.mjs`, `test/runner/dispatch-execute-effort.test.mjs`, pattern tests.

## Steps

1. `launchView` builder; compare with today's `resolveLaunch` on every executor of the committed config before deleting.
2. Switch ranking to the crate; delete Node ranking and the walk exports.
3. Effort in identity/snapshot/gate comparison.
4. Remove the inline escape; update tests that expected inline producers.
5. Explain output.

## Tests (proofs owned)

- Missing cell skips family; no allowed cell refuses naming the config line; hard pin refuses (§10.2 variant C message).
- Unsupported or lower effort cannot claim the tier.
- Debate judge hard-independent of both sides (§10.3).
- Panel producers never inline (lead present, every candidate refused → named refusal).

## Risks / rollback

- M×H `launchView` flips herdr vs cli → step 1 comparison. Rollback: revert on the track.
