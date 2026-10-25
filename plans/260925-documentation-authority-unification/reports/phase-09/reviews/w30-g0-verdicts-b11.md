Verdicts: 3 APPROVE / 0 REWORK

# G0 rule-clause rationale re-review, batch 11

Pin `7c46b8a036fe028e02a1e99be0aa63a25dafb089`. Rows: all 3 rows in `g0join/verdict-batches/batch-11.json`, namely g0-content-redecisions `/bindingRefresh/117`, `/47` and `/50`. All 3 are stale because `048524e82` changed them. The change follows [w30-g0-rule-clauses-brief.md](../w30-g0-rule-clauses-brief.md) and answers [w29-g0-verdicts-b10.md](w29-g0-verdicts-b10.md). Rulings: L13-22 and L13-25. Machine records: [w30-g0-verdicts-b11.json](w30-g0-verdicts-b11.json). Each record carries `rowFingerprint`, computed with `g0join/join.py` `row_fingerprint` at the pin. All 3 equal the fingerprint the join computes at HEAD.

## Method

- **Hashes.** For all 3 rows, `ledgerfix/bindings.py` `digest()` equals the stored `bindingSha256` and the batch value.
- **Target units.** I extracted `docs/platform/work-state/spec.md` with `rebind.py extract()` from a tempfile copy, under `NODE_OPTIONS=--no-addons`. Each anchor (`11-business-rules`, `submit-verb`, `unheaded-block-4`) resolves to exactly one unit. Each unit's digest equals `targetUnitDigest`, and its self-inclusive ancestry equals `targetAncestry`.
- **Sources.** I extracted the legacy `docs/specs/work-state.md` at `cd8c1cc01` and `49ad04648` through the extractor's virtual input.
  - `/117`: source `8ea4a467` is `business-rules` at `cd8c1cc01`.
  - `/47`: source `8bd05d09` is `nộp-vấn-đề-tự-do-submit` at both commits.
  - `/50`: source `1cedade3` is `unheaded-block-4` at both commits.
- **Allowed fields.** I flattened both changed ledger files at `048524e82^` and at HEAD, and diffed them.
  - g0: only `/117/rationale`, `/47/rationale`, `/50/rationale` and the new `/50/changedClauses/2` and `/3` changed. Entries 0 and 1 of `/50/changedClauses` are untouched.
  - s13-resync-a: only `rationale` on `/sourceBindings/4, 6, 59, 60, 61, 69, 70, 71` and `/70/disposition/reason` changed.
  - No binding, digest, source, placement, supersession or `reviewStatus` field changed. The two later commits (`73e89962e`, `7c46b8a03`) touch only reports, not the ledger.
- **Clauses.** For each row, I diffed the source text against the target text, line by line and word by word. For `/117`, I first split both sections into bullets keyed by rule id. I then checked each quoted old string against the source bullet and each quoted new string against the target bullet.

## Approved

- **g0 `/bindingRefresh/117` (Business Rules, claim_477a30f4).** This answers the b10 REWORK.
  - The keyed diff finds the 54 original ids in the same order and the heading change. Exactly 13 bullets differ: RUL10, 15, 16, 18, 19, 26, 30, 33, 34, 53, 59, 60 and 61. There is also one added bullet, the RUL10 note. The other 41 are byte-equal.
  - The rationale names exactly these 13 bullets and the note, and nothing else. This matches its claims that "13 bullets are rewritten" and that "the remaining 41 ... have no textual changes".
  - Every quoted old string is in the source bullet. Every quoted new string is in the target bullet; the RUL10 note text was checked against the added bullet.
  - The 5 rewrites the brief required are named with old and new wording:
    - RUL18: `entryStepFor`, so `discovery` for coding, and only old records read lazily as `executing`;
    - RUL19: the `fgos-researching` worker and `resolveDiscovery`;
    - RUL26: two conditions become five triggers;
    - RUL53: `compound` is deprecated, the path must be committed, and `docRegistry.enforce` applies;
    - RUL60: `--tier` is retired and refused, and the producer account is new.
  - The "remains" statements for RUL15, 19, 26, 30, 33, 34 and 53 agree with the word diff.
- **g0 `/bindingRefresh/47` (Submit Verb, claim_bf41e509).** This answers the b10 REWORK. "every other clause is unchanged" is removed. The section diff is exactly:
  - the heading;
  - the runs-when flags;
  - the id clause;
  - the three tier → size swaps;
  - "có mặt hay không;" plus the new `--rigor` line;
  - the RUL60 gloss "ba cờ ghi-đè tier/kind/risk, độc lập từng trường" → "cờ phân loại hiện hành".

  Each change is named with old and new wording that match the units. The rationale's statement that the other listed clauses have no textual change agrees with the diff.
- **g0 `/bindingRefresh/50` (Data Dictionary block, claim_5ba6768e).** This answers the b10 note. The block diff is exactly 4 lines: rows 1, 10b, 12 and 21. `changedClauses` now has 4 entries. Each `oldWording` occurs once in the source and not in the target, and each `newWording` occurs in the target. The prose now says "four labelled corrections". It also states that it does not certify the row-12 default-step wording as code-true.

## Non-row note: s13-resync-a

- **`/sourceBindings/70`.** The new disposition reason is accurate. The full source unit `fcc3b5bc` (legacy block-57 at `cd8c1cc01`) and the target `unheaded-block-54` (`c7cd4adc`) differ in exactly one line: `xem "Khai việc"/"Nộp vấn đề tự do" dưới` → `xem [Add Verb](#add-verb)/[Submit Verb](#submit-verb) dưới`. `placement.content` equals the unit text, and the binding hash recomputes.
- **Leading newlines.** No rationale in s13-resync-a now starts with whitespace, and the 8 rationale edits only removed the leading `\n`. Other shards still have 36 `rationale`/`reason` strings with leading whitespace: s2, s6 and s14. They predate this change and are outside its scope.

## Notes (non-blocking)

- **`/117` RUL60 and RUL59 old wording is partly paraphrased.**
  - RUL60: the rationale quotes the old title and the full new body. The old body is paraphrased, which is acceptable because the brief asks for the old wording of the change. However, two removed old clauses are not named on their own:
    - the sentence that `fgos edit` stays a valid door for a single manual edit;
    - the cross-references `Xem "Nộp vấn đề tự do (submit)" trên` and `(xem "Chạy context-discovery (discover)" trên)`.

    The verbatim new text shows that they are gone.
  - RUL59: the old discovery-computed `intent` sentence is paraphrased, not quoted.
- **Internal drift remains in the target, and the rationale admits it.** RUL59 now says that `intent` is retired, but its later text still describes intent write errors and `edit --intent <n>`. Data Dictionary row 12 still says that `add` without `--step` gets `executing`, against RUL18 and `entryStepFor` (noted in b10). Neither is a records defect in these rows, but both are docs truth drift that should be tracked separately (RUL11).
- **Target typo.** In RUL60, "Trong phiên tương tác sống" starts with a capital letter after a semicolon. This is cosmetic.

## Join

`python3 -B g0join/join.py --pin HEAD` exits 1 with status `gaps`.

| Count | Value |
| --- | --- |
| Effective rows | 1,929 |
| Approved | 1,926 |
| Stale | 3 |
| Missing | 0 |
| Mismatched | 0 |
| Open REWORK | 0 |
| Invalid bindings | 0 |
| Unresolved | 0 |
| Obligations | 2,187 |

The 3 stale rows are exactly this batch. Their join `rowFingerprint` values equal the ones recorded here. These records are not committed yet, so the join does not see them. Once they are committed, the expected result is 1,929 approved and exit 0.

## Limits

- I used no git write, fgOS CLI, product test, `audit-report.py` or native addon. Extraction ran under `NODE_OPTIONS=--no-addons`.
- Scratch lived in a tempfile directory under `/tmp/fgos-work/` and was removed at the end.
