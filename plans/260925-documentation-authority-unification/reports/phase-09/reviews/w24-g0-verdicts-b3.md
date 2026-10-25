Verdicts: 280 APPROVE / 5 REWORK

# G0 per-row verdicts: batch 3

Pin dbc8d6655fe9fb3b77f67930eb0c9a18cb91bb9f. While I reviewed, HEAD moved to cb6fa5fb5. Those commits add only the batch 2 and 6 review files; no ledger or docs file changed. Input: `g0join/verdict-batches/batch-3.json` (285 rows). Output: `w24-g0-verdicts-b3.json`.

## How the rows were checked

- **Stored values at HEAD.** For every row, `bindingSha256`, `targetUnitDigest`, `targetAnchor` and `targetOwner` match the ledger row at `file` + `pointer`. That holds for 285 of 285 rows.
- **Binding hash.** `ledgerfix/bindings.py` `digest()` recomputes the stored `bindingSha256` for all 285 rows.
- **Unit digest.** I used the two embedded phase-06 extractors that `g0fix/extract-units.mjs` wraps. I ran them from a private scratch directory, and they agree on every file. Each `targetAnchor` resolves to exactly one unit, its `textDigest` equals `targetUnitDigest`, and `targetAncestry` matches. That holds for 285 of 285 rows.
- **Meaning.** I followed each row's `supersedesBinding` chain back to the origin claim. From git history I recovered the source unit text by `sourceUnitDigest` (273 of 273 digests found). I then compared it word by word with the current target unit:
  - 184 rows are byte-identical.
  - 57 rows differ only in heading depth, whitespace, link destination or a YAML fence.
  - 4 rows are heading or section locators with no source text.
  - 40 rows have substantive changes. I judged each of these by hand against its disposition, the code, and the current legacy file.
  - For the 10 partial-carry rows, the refreshed residuals pass. File SHA, residual SHA and primaryTarget all match the current target, and every source line is either in the target or in the residual. The earlier g0-b3 REWORKs on s9 registryGaps[24] and [29] are fixed.
- **Links.** Every relative link in the 285 target units resolves, except the corrupted one in REWORK 1 below. One fragment follows GitHub's double-hyphen slug for `Spec: Soạn & nuôi …`; I counted it as valid.

## REWORK

1. **s9-runner-01#/registryGaps/37** (`runner/subcomponents/h-6979005beaf7/spec.md#unheaded-block-36`): the link rebase corrupted a code span. `` `d['executeAssignment'](a)` `` became `` `d['executeAssignment'](../../../../specs/a)` `` (line 191). Legacy `runner.md` still has `(a)`.
2. **s17-misc-review-fixes#/bindingRefresh/13** (`packaging-distribution/spec.md#unheaded-block-109`): the disposition claims an "only heading/link/whitespace" adaptation. In fact the target replaces the claim's `git rev-parse --git-common-dir` mechanism with on-disk `.git`/commondir parsing. The new text is true to `scripts/fgos-shell-integration.sh`, so the row should be relabelled as a truth-correction supersede. Sibling rows `/bindingRefresh/20` and `/6` bind the same unit under a truth-correction rebindReason and are approved.
3. **s5-root-boundary-sync#/registryGaps/33** (`work-state/spec.md#unheaded-block-93`): the supersede drops the source clause "the priority write runs in its own try/catch so store/lock errors never block the clear/unclear result". That clause is true per `src/intake/discovery.mjs:383-416`. The A35 restore replaced it with wording about swallowed intent writes, and no remainder names the lost clause.
4. **s7-step09-n1-runner-predecessors#/registryGaps/0** (`runner/architecture/h-7af1f0242611.md#unheaded-block-4`): the repaired citations `runner.md:2416/2354/2590/2897` are stale at HEAD. The ADR 0029/0028/0031/0034 headings now sit at 2442/2380/2616/2923, and the cited lines are blank or unrelated.
5. **s7-step09-n1-runner-predecessors#/registryGaps/1** (`…#unheaded-block-5`): the same problem. `runner.md:2477,2609` and `runner.md:2897` shifted by 26 lines.

## Notes (approved)

- The s9/s5 registryGaps rows bound to legacy `docs/specs/runner.md` are approved as legacy-file successors. Their rationales still say they must be rebound at legacy cutover.
- Several approved rows keep a `move` disposition, although the content changed through main-side truth updates. This applies to s9 claims/97 and registryGaps/38 and /41, s17 bindingRefresh/20, and s4 registryGaps/3. In each case the target equals current legacy text or a labelled correction, so I approved the row. The label is imprecise, but no meaning is lost.
- Many rationales still cite stale anchors and digests (for example "unheaded-block-102 / 4599fc3e"). Only the prose is affected; the binding fields are correct.
