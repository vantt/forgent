# G0 changed-binding review: batch g0-b3

Commit 8a9385eca (forgentX-s8-review, clean, detached). 42 rows: s3-host-invocation-boundary-gaps (10), s5-root-boundary-sync (2), s9-runner-01 (30). Every target is docs/specs/runner.md.

**Result: 38 APPROVE, 4 REWORK.**

## How the checks were done
- **Binding digest.** I recomputed it from each shard row at `keys`. The input is `{targetOwner, targetAnchor, targetUnitDigest, targetAncestry, successorGroup}`, with a missing key set to null. It is serialized as `json.dumps(sort_keys=True, ensure_ascii=False)`: default `", "`/`": "` separators and no trailing LF. All 42 match. This encoding was found by enumeration and is not declared anywhere: no helper in phase-06/08 computes it. It differs from the encoding declared by `step-08-preflip-gates.json#changedBindings[*].bindingHashEncoding` for the 5 L12-130 refresh rows (compact JSON plus LF over 4 keys). The two projections use two hash recipes.
- **Unit digest.** I used `scripts/generate-doc-inventory.mjs` `extractMarkdownConservationUnits` at 8a9385eca. It is the extractor that phase-06 `lib.mjs` (sha 48e15393…) wraps. The target unit textDigest matches `targetUnitDigest` for all 30 direct rows. The ancestry also matches.
  - For the 12 successorGroup rows, all 8 member anchors, digests, ancestry and text match.
- **Semantics.** I recovered each source unit's text from runner.md history by `sourceUnitDigest` (19/19 found). I compared it word by word with the target, and checked partial-carry remainders against `step9-a42-predecessor-residuals.json` (sha 4be07f52, OK) and `step10-sync2300-predecessor-residuals.json` (sha 69c36aaa, OK).

## REWORK
1. **s9-runner-01#registryGaps[26]** (supersede) and **[27]** (partial-carry): `unheaded-block-92` is the RUL76 line (runner.md:1096). The source RUL77…RUL97 Business Rules passage is now at `unheaded-block-93` (runner.md:1098-1152). The bound unit carries 0 of the 26 (and 0 of the 23) source lines. The L12-102 "N-2" re-placement overshot by one for these two rows. The digests are internally consistent, but they belong to the wrong unit.
2. **s9-runner-01#registryGaps[24]** (partial-carry): the remainder is stale. Its residual has primaryTarget 43f03eb4…, but the current unit is ad50d1b4…. The source "| 1b | Provider-capacity…" line (state.lock, now a holder-lock kernel mutex) is neither verbatim in the target nor in the remainder.
3. **s9-runner-01#registryGaps[29]** (partial-carry): the remainder is stale. The residual primaryTarget is 29fd80cd…, but the current unit is 443f8e74…. Four changed source lines are neither in the target nor in the residual: the loop.mjs runner.lock path, account-pin `capacityProviderOf`, the run-timeout lock-ttl clause, and the catchup line.

## Approved, with notes
- **Footer rows.** These are s3[7..14] and the 12 old-ID rows s9[2,4..18] bound to the group (owner L9-15). The text is verbatim.
  - For each s3 row, source occurrence k of 8 at 02106766 maps to the same decision's footer at the current anchor.
  - The s3 rationales still cite stale target ordinals (176/179 against the bound 178, and so on). Only the prose is affected; the binding fields are right.
- **Whole-block supersede rows** (s3[15], s3[16], s5[35], s5[36], s9[0], s9[22]): line-level changes have named replacements (RUL76, RUL93, RUL96, RUL106, holder-lock, repo-locks.mjs). These are accepted under the L12-102 whole-block rule.
- **Partial-carry rows** s9[1,3,19,20,21,23,25,28]: every changed source line is verbatim in its residual, and the residual SHA is verified.
  - s9[28]'s residual primaryTarget digest is stale, but nothing is uncovered.

## Concerns
- The bindingSha256 recipe for these 186 non-refreshed rows is undeclared. The Phase 9 G0 join tooling should pin it explicitly, or the two recipes should be unified.
- Partial-carry residuals are not refreshed when the target is rebound after a main merge. Rows [24] and [29] show that the remainder can silently become understated. The other partial-carry rows in other batches may need the same sweep.

Scratch: /tmp/fgos-work/g0-g0-b3/ (tool/*.py|mjs, rows.json, srctext.json, runner-units.json).
