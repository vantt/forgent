# A38 review, step-02i mapping part 72 (semantic-roadmap, 2 entries)

- Reviewer: reviewer:sonnet-session:aaab41cb19f3eb8f0@2026-10-19
- Worktree: /home/vantt/projects/forgentX-s8-review at 74e3ecf1e (verified); author 904d0fb5c, accounting 74e3ecf1e
- Source table: step-02i-census-maps-portals-prose.json (entries); all fields read, plus the roadmap passage and its target.
- Totals: 2 entries, ok 2, rework 0, needs-Lead-judgment 0.

## Evidence
- Consumer `docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md` is a live proposed plan, not a record of past action. Its §3 decisions 1, 5 and 6 (target matrix, preview vs stable, compatibility-window duration) are still open. Line 89 is therefore an operative "record decisions here" instruction. Line 116 names the stream that delivers node `PK`.
- Both sentences name the directory `docs/architect/packaging-distribution/`, which Phase 9 retires.
- The target `docs/platform/packaging-distribution/README.md` exists. Its header says "Promoted from ... docs/architect/packaging-distribution/**" and it routes to architecture, contracts, decisions and verification. This matches the L12-21 disposition for host-invocation roadmap sentences, which says to follow the promoted portal and flag the sentence for a Step 3 semantic rewrite.

## Rows

| Entry | Line | Verdict | Rationale |
|---|---|---|---|
| maps-i-00945 | 89 | ok | Classification roadmap-semantic and role reader are right, and the target is the correct portal. Parking (`preserve-pending-target`, patch null) is right because the whole sentence needs a Step 3 rewrite, not a path swap. The sentence also claims "`docs/specs/distribution.md` is regenerated from it later", a mechanism the rewrite must re-check. |
| maps-i-00947 | 116 | ok | Same as 00945. It is a pointer to the stream's own plan. The portal README is an acceptable stand-in, and the rewrite may point to `code-panel-rollout-plan.md` or `architecture/`. |

## Note, not rework
Row maps-i-00946 (line 90, `docs/specs/distribution.md`, cutover-patch-only) sits inside the same sentence as 00945. The Phase 9 packet should apply it together with the Step 3 whole-sentence rewrite of 00945, so that a mechanical path swap and a semantic rewrite do not overlap on one sentence. 00946 is outside this part.
