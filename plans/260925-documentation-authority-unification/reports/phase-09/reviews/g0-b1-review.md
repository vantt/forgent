# G0 changed-binding review: batch g0-b1

Commit 8a9385eca (worktree /home/vantt/projects/forgentX-s8-review). The batch has 55 rows, all targeting docs/platform/packaging-distribution/spec.md, from 7 shards. Verdicts: **51 APPROVE, 4 REWORK**. Full verdicts are in g0-g0-b1-review.json.

## How each check was done
- **Binding digest: 55/55 match.**
  - The recipe is SHA-256 of `json.dumps({targetOwner,targetAnchor,targetUnitDigest,targetAncestry,successorGroup}, sort_keys=True, ensure_ascii=False)`, with default separators, no LF, and null for a missing key. The values come from the shard row.
  - This recipe is declared nowhere in the plan. The only declared `bindingHashEncoding` (compact separators + LF, 4 keys; step-08-preflip-gates.json `pendingChangedSinceStep0`) reproduces the 5 L12-130 rows and 0 of these 55.
  - **Tooling finding:** the gate needs one declared encoding, or a per-row `bindingHashInput`. Otherwise the G0 join is not reproducible by a stranger.
- **Unit digest: 55/55 match.** Computed with `extractMarkdownConservationUnits` from scripts/generate-doc-inventory.mjs, the same extractor scripts/list-doc-anchors.mjs uses, on the target at the review commit.
- **Semantic check.** Each source unit was resolved by its `sourceUnitDigest`: either in the current docs, or by walking the git history of the cited path. All 55 resolved. Each source was word-diffed against the target.
  - For supersede rows, I checked that the target unit's digest equals a later upstream legacy version. Where it does, every delta is an upstream change and none is candidate drift.

## REWORK
1. **claim_9d97a24e** (s4-packaging-main-recarry registryGaps/2 → #unheaded-block-86).
   - It is marked move, but the bound source (legacy@a67cf7b1d) is not carried. The target is legacy@fccd2218a, which drops provider-capacity `state.lock`, `account-locks/...` and the `provider-capacity-lock-stale` doctor check.
   - Fix: make it supersede, as its 4 siblings bound to the same target are.
2. **claim_c87924f5** (s4-packaging-distribution-distribution registryGaps/4 → #unheaded-block-82).
   - It is marked move and the rationale says "dated status kept", but `updated: 2026-10-13` became `2026-10-16` (upstream).
   - Fix: make it supersede, or name the upstream change in the rationale.
3. **claim_9881ddf7** (#unheaded-block-60) and 4. **claim_249083ed** (#unheaded-block-79).
   - The Workspace Topology link is repointed from docs/architect/workspace-topology.md to the platform successor copy, while the rationale says "relative-link changes preserve destinations".
   - It also contradicts #unheaded-block-76 in the same file ("Active topology remains docs/architect/...", whose legacy destination was restored under L10-18/L10-23).
   - Fix: restore the legacy destination, or record the repoint.

## Concerns outside this batch's verdicts
- **The current legacy docs/specs/distribution.md has drifted past the candidate.** Units 4 (Entry Points) and 5 (Data Dictionary) no longer equal spec.md #unheaded-block-85/86.
  - Legacy now contains content the candidate lacks: the npm-channel `git-addon-unavailable` refusal, row 5h terminal-control and the `terminal` config key, the `identity-project-id` and `identity-machine-id` checks, rows 7c/7d `process-containment` and `runtime-socket-dir`, `executor-skills-installed`, `tier-fallback`, and others.
  - The candidate still has the older `lock.predecessorKillWaitMs` config key, where legacy now says "no lock config key, fixed at 2000 ms".
  - No row in this batch is bound to those newer legacy versions. Unless W0/G9 recomposition picks them up, they are lost at flip.
- **Many rationales cite stale ordinals.** For example, "retained at #unheaded-block-51" sits in a row bound to 52, and "Target unheaded-block-85" in a row bound to 86. The binding fields are authoritative, so this is informational only.
- **f7459f11 and 53838c42** are marked supersede, but their units are byte-equal. This is harmless.
- **The review worktree is not clean.** It has an untracked `target-review/` directory (a cargo target). It does not affect the docs.
