# Phase 07: ranking cutover — cells with effort, hard pins, independence per pattern, continuity, inline-lead removal

Owner: Sonnet lead in a worktree from the track. Size L (1.5d). After 06.

## Context

- Spec §4.3 [G4], §4.4 steps 5–6, §6.3 [B3], §7 [R8].
- Today: Node ranking in `bind.mjs` `prepare` :234, `walkOrder` :428, `bind` :453, `walkBindings` :708, `listCandidates` :724, `nextCandidate` :755, `retrySameCandidate` :786; independence and `acceptDependence` :383-388; inline fallback :498-516; `bindingIdentity` :138 (no effort); invocation choice `resolveLaunch` :174; effort controls `provider-adapter.mjs:255`; gate replay `account-rotation.mjs:60-63,91`; write gate `commit-unit-work.mjs`.

## Requirements

- `bind.mjs` builds `launchView` (per candidate executor: invocations able to carry the posture, from the existing confinement resolution `resolvePostureInvocation`/`pickConfinedInvocation`, `confinement/policies.mjs:682-744`; effort levels each invocation's CLI renders from `REASONING_EFFORT_CONTROLS`) and calls `bindSeat` once per seat per attempt with the cached policy (plan decision 2). The answer names executor, invocation, model, effort, pool; Node maps it to today's binding shape plus `effort`.
- Delete Node ranking: `prepare`'s candidate filtering, `walkOrder`, spread, independence check, `normalizeCandidates`, `findHerdrInvocation`, `resolveLaunch` decision part (fact collection stays), `poolUnusableReason` logic moves into the crate (Node passes inventory facts). `walkBindings`, `listCandidates`, `nextCandidate`, `retrySameCandidate` become thin calls to the crate with walk state, or are deleted when `run.mjs`/`explain.mjs` can call the facade directly (phase 00 decides per export; one door, no duplicates).
- Effort: part of `bindingIdentity`, the binding snapshot and the write-gate comparison; `effort-below-cell`, `effort-unsupported` refusals; a cell without effort records the invocation default (e.g. pi/omp `--thinking medium`) as not-a-promise.
- Hard pin `{executor, invocation}`: unavailable → `pin-unsatisfiable`, never a different invocation (MP-B1 phase 07's `codex-cli-bwrap` → `codex-herdr` swap becomes a refusal).
- Independence per pattern table §6.3 from posture + peers (seat ledger); `explain` names the filter that moved a seat.
- Continuity for multi-round seats (Delphi `sameSeat`, debate rebuttal): executor + model + effort kept, else `seat-continuity-unavailable`.
- Inline-lead escape removed: `session-lead-inline` exists only when the unit configured no candidate at all; any policy/supply rejection is a named refusal.
- `fgos dispatch explain` prints the crate's explain structure (spec §9.2 format), including tier definition, sources, on-failure chain.

## Files

- Modify: `src/runner/execution/{bind,run,explain,account-rotation,commit-unit-work,dry-bind}.mjs`, `src/runner/dispatch/provider-adapter.mjs` (export the rendered-levels view only), `src/setup/{executor-posture-coverage,blind-steps-proven-pools}.mjs` (call sites only).
- Tests: `test/runner/execution/{bind,explain,tier-fallback,run-posture,run-provider-failover,account-pin,account-rotation,commit-unit-work}.test.mjs`, `test/runner/dispatch-execute-effort.test.mjs`, pattern tests.

## Steps

1. `launchView` builder + tests against today's confinement answers.
2. Switch ranking to the crate; delete Node ranking.
3. Effort in identity/snapshot/gate.
4. Remove inline escape; update tests that expected inline producers.
5. Explain output.

## Tests (proofs owned)

- Missing cell skips family; no allowed cell refuses naming the config line; hard pin refuses (§9.2 variant C exact message).
- Unsupported or lower effort cannot claim the tier.
- Debate judge hard-independent of both sides; refusal names both sides' families (§9.3).
- Panel producers never inline (with a lead present and every candidate refused → named refusal, not inline).

## Risks / rollback

- M×H: `launchView` differs from today's `resolveLaunch` → herdr vs cli flips. Mitigation: step 1 compares old vs new on every executor in the committed config before deleting.
- Rollback: revert the merge on the track.
