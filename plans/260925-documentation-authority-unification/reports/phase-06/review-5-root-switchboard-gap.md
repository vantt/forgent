# Review 5: root switchboard registry gap disposition

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:21@2026-10-14
Review mode: ordinary
Request commit: eff04df5a
Content commit: 55ec1e0c4

## Scope and method

One registryGap, claim_334a8ede523cc86a70852c42b9db587c (docs/transitional-switchboard.md unheaded-block-4, proposed supersede by the same-subject current table at docs/platform/documentation/switchboard.md#unheaded-block-4). No sensitivity pack was requested. Deep read of the single row (A36 differing-digest set; seed not applicable, sample is the whole group).

- Old digest recomputed with extractMarkdownConservationUnits from `git show 08a0fd2d2:docs/transitional-switchboard.md` (lines 48-69): 560b636f8fe9010bd9e2dc1036ebf2532111e0925f9c452c19d32dea42b7bff8; a plain sha256 of the 22 block lines gives the same value.
- Current digest recomputed from the HEAD target file `docs/platform/documentation/switchboard.md` (lines 47-68): 130d01325ca439a9c92832cb477fc845a32ef7d393c7b2d584dcf348ff298902. The HEAD source `docs/transitional-switchboard.md` unit has the identical digest, and `diff` of the two blocks is empty.
- Line diff old vs current: exactly one row differs (Work state / work lifecycle engine); the other 21 lines are byte-identical.
- `git log 08a0fd2d2..HEAD -- docs/transitional-switchboard.md` lists only f5a1a2dda; I read it. It changes that one row by appending the sentence about candidate route `docs/platform/work-state/**` (scope candidate-target), stating canonical route stays `docs/specs/work-state.md`. Every old area-authority statement in the row is still present verbatim before the appended sentence, so no route is dropped.
- Anchor check: `node scripts/list-doc-anchors.mjs --check docs/platform/documentation/switchboard.md#unheaded-block-4` printed ok.
- Shard registryGaps entry equals the request JSON field by field (claimId, paths, anchors, both full digests, disposition, rationale). Both digests are recomputed from actual units, so no identity is guessed or grafted.

## Verdicts

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_334a8ede523cc86a70852c42b9db587c | ok | deep: old block 560b636f recomputed from 08a0fd2d2 and current 130d0132 from the HEAD target; only the work-state row differs (one appended candidate-route sentence from f5a1a2dda, the sole edit since the pin) and all prior area-authority text is retained; supersede with a named successor is correct and anchor exists; rationale says routes in the plural though exactly one route was added, a wording slip that does not change the disposition | 560b636f8fe9010bd9e2dc1036ebf2532111e0925f9c452c19d32dea42b7bff8 | 130d01325ca439a9c92832cb477fc845a32ef7d393c7b2d584dcf348ff298902 |

## Notes

- The rationale phrase "additive candidate topology routes" overstates: one route sentence was added to one row. Optional wording fix, not blocking.
- The approval covers only this predecessor disposition; current-source claim_3a0662d27a8829517966d15cf279af44 was approved separately at 729bea758.

Unresolved: none.
