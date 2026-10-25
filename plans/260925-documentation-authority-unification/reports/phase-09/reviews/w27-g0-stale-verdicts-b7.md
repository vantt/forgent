Verdicts: 92 APPROVE / 3 REWORK

# W27 G0 stale-verdict re-review, batch 7

Pin: `5cb7d0cddabb93f5d5fcd7a0a85468447209fb2b`. Rows: all 95 rows in `g0join/verdict-batches/batch-7.json`, all in `ledger/decisions/g0-content-redecisions.json` `/bindingRefresh/*`. Machine verdicts: [w27-g0-stale-verdicts-b7.json](w27-g0-stale-verdicts-b7.json). Each verdict carries the `row_fingerprint` from `g0join/join.py` for the row at the pin.

## Why these rows were stale

These rows were written in c25e8cf6a, after the w14 content re-review (21bdbcf7d). That commit gave them new current rationales. Rows /125 and /126 were edited again in 594fe4194. Each row keeps its predecessor's disposition: no disposition changed between the superseded row and this row. No row has `changedClauses`.

## Mechanical checks (all 95 rows)

- `bindings.digest(row)` equals the stored `bindingSha256`.
- The target unit resolves at HEAD with the stored anchor and `targetUnitDigest`. The units came from the repo's dual extractors (`rebind.py` `extract`, which runs from its own tempfile scratch, with `NODE_OPTIONS=--no-addons`).
- Each `supersedesBinding` resolves at HEAD, and its anchor, digest and hash equal the predecessor row.
- Every `sourceUnitDigest` was found: either at HEAD or, by a git-history scan through the same extractor, in a historical blob of the source path.

## How the rows were judged

- **38 verbatim rows**: 51, 54-72, 74-76, 100-114. The target digest equals the source digest, so the heading composite is carried byte for byte.
- **21 resynced rows**: 0, 25-42, 119, 121. For each one, the rationale names a current legacy unit. That unit's digest equals the target, and its old and new digests are recorded in `g0rework/receipt.json` `legacyRewrites` and in `carries/source-parity.json`. Rows 0 and 34 both map historical blocks 113 and 112 to one current legacy block. The main rewrite merged those two blocks, so `move` and `merge` are both defensible here.
- **Same-file supersedes**:
  - 5, 18 and 19 are whole-file successors of `architecture-manifest.json`.
  - 7, 11-17 and 10: every source table row id is present. The added ids are exactly as stated: 5g, 5h, 7c-7j (5g already existed for row 10). The removed `lock.predecessorKillWaitMs` and the retired doctor checks are code-truth corrections.
  - 43: the line diff is exactly the 5 named lines (account lock, RUL80, RUL86, RUL91, RUL96).
  - 44: the 5 absent lines equal `g0fix/partial-carry-residuals.json#/rows/11` `changedSourceLines`, and that file's sha matches `residualRef`. The historical primary-target digest is labelled as historical, not current.
- **Heading rows** (49, 118, 120, 122) were judged on title and direct payload. Each heading's next unit is the payload row its rationale names: claim_5ba6768e /50, claim_b64e4bcb /119, claim_a27bf300 /121, claim_2e2bc926 /123. Row 49's subsections now sit under target sections 4-8. Its direct payload, the main table, is unchanged in scope.
- **Content rows**:
  - Rows 1-4: the claims hold. ADR-002 was retitled, ADR-008..010 became history links, ADR-011 was added, and the legacy file now says V-013. The original text exists in `history/retired-engine/files/decisions/README.md`.
  - Rows 22-24: the bullet and link changes match the rationale.
  - Rows 46-48 and 115-116: the add, submit and entry-point corrections match the rationale. The 24 bullets are kept, and `cleanup.leafTtlDays` exists in code.
  - Rows 52-53: only the 0012 link destination changed.
  - Row 73: an anchor tag was appended.
- **Code-literal scan**: no link-rewriter edit was found inside a code span or a fence. The only new code span with `](` is in row 44: `d['executeAssignment'](a)`, which is the restored literal. The fence differences in rows 25 and 26 are current legacy bytes.

## REWORK

| Row | Reason |
| --- | --- |
| `/bindingRefresh/45` (claim_b7cdc84d) | The rationale says it "names the corrected clauses", but it omits the change from "(9 file)" to "trong nhiều file (ví dụ …)". Sibling row /46 names that change for the same payload. |
| `/bindingRefresh/125` (claim_ae69ca82) | The rationale says "only link destinations changed; every register row, role and boundary text is unchanged". Two link labels also changed: "Enduser Docs Authoring/Index Spec" became "… Contract". |
| `/bindingRefresh/126` (claim_ab73231b) | Same label change as /125. The lineage prose itself is now correct (/20 and /21 chains). |

All three fixes touch the rationale text only. Digests and dispositions stay as they are.

## Limits

- No git write, fgOS CLI, product test, `audit-report.py` or native addon was used.
- The code-truth claims were spot-checked against `bin/fgos.mjs` (add/submit) and `src/state/cleanup-pool.mjs`. The rest rely on the source and target diff.
