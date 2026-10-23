# G7 review: batch g7-c7 (other docs/**), commit 8a9385eca

Verdicts are in `g7-g7-c7-review.json`, next to this file.

## Counts

- 47 specs: **46 APPROVE, 1 REWORK**.
- Hash at the review commit: 47/47 equal `beforeSha256`.
- Forward patch (`patch --batch --fuzz=0 -p1`) to `expectedAfterSha256`: 47/47.
- Rollback back to `beforeSha256`: 47/47. No `.orig` or `.rej` files.
- New link targets: all exist. All 46 anchors resolve with the repo's own `scripts/list-doc-anchors.mjs` `anchorExists`.
- Every edit is a pointer swap. Word-level diffs show no claim text changes and no unrelated edits.

## REWORK

- `file:docs/how-to/fix-bare-citation-findings.md`
  - **Where:** hunk `@@ -34,7 +34,7 @@`, new line 37.
  - **Problem:** the example now says runner rules are "defined there" in `docs/platform/runner/spec.md`. That file defines 0 `RUL<n>` rules; all 97 runner RULs live in `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md` `## Business Rules`. The how-to's "never invented, sourced from where it is defined" instruction would send readers to the wrong file.
  - **Fix:** retarget to `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md#business-rules`, which specs 30, 31 and 32 in this batch already use.

## Semantic spot-checks

- **RUL ids:** RUL40, 53, 61, 84, 89 and 93 sit inside h-6979005beaf7 `## Business Rules`. RUL45 and RUL60 sit inside work-state `## 11`.
- **Data dictionary:** rows #28 and #29 (`mergedSha`, `mergedInto`) are in work-state `## 3`.
- **Decisions:** 0005, 0020, 0030 ("Release con người", anchor `#quyết-định-8`) and 0062 all resolve to the matching headings in runner `decisions/h-36d872fbb0e5.md`.
- **Line locators:** the platform copies of `explanation.md` and `synthesis.md` are byte-identical to the `docs/architect` copies, so the `explanation.md:18` and `synthesis.md:83` locators stay valid.
- **Gateway quote:** the quote in the gateway YAML is present in `cli-io-contract.md:193`.

## Non-blocking notes

- **Legacy tokens left in patched files.** Some patched files still contain legacy paths, for example `docs/io-contract.md` (0014 and `docs/specs/work-state.md` §envelope), the reading-map rows for `docs/specs/*`, `docs/architect/*` and the citation-drift scan root, and `herdr-orchestrator-terminology-boundary.md:49-50`. The Step 3 records list these as preserve, carry, blocked or parked edges owned by G1, G3 and G6, so they are not misses of these specs. I sampled only `docs/io-contract.md` and `docs/how-to/fix-bare-citation-findings.md`.
- **Anchor style.** Several anchors use the extractor's collapsed-hyphen form for headings that contain an em dash (e.g. 0062, §9.2, the approval gate). The repo checker accepts them, and every one sits inside a code span, not a clickable link.
