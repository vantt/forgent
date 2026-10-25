Verdicts: 14 APPROVE / 2 REWORK

# G0 heading-reference and placement re-review, batch 10

Pin `a11ebeee7782720d49869a5bef39f34af090b262`. Rows: all 16 rows in `g0join/verdict-batches/batch-10.json`. 14 of them are stale because `e88d4e283` changed them, and 2 are new and have never had a verdict (g0 `/bindingRefresh/127` and `/128`). The change follows [w29-g0-last-rows-brief.md](../w29-g0-last-rows-brief.md) and answers the REWORKs in [w28-g0-verdicts-b9.md](w28-g0-verdicts-b9.md). Rulings: L13-22 and L13-25. Machine records: [w29-g0-verdicts-b10.json](w29-g0-verdicts-b10.json). Each record carries `rowFingerprint`, computed with `g0join/join.py` `row_fingerprint` at the pin. All 16 equal the fingerprint the join computes at HEAD.

## Method

- **Hashes.** For all 16 rows, `ledgerfix/bindings.py` `digest()` equals the stored `bindingSha256` and the batch value.
- **Target units.** I extracted the units with `rebind.py extract()` from a tempfile copy, under `NODE_OPTIONS=--no-addons`.
  - Every anchor resolves to exactly one unit.
  - Each unit's digest equals `targetUnitDigest`, and its self-inclusive ancestry equals `targetAncestry`.
  - On the 5 batch rows that have a placement (s4 `/22`, s5-authorities `/3`, s5-truth `/6`, s9 `/9` and `/33`, plus the 8 changed s13 rows checked for context), the `ledgerfix/verify.py` `check_current` assertions hold: selected, previous and next witnesses match, and `p['content'] == unit['text']`.
- **Allowed fields.** I flattened each of the 8 changed ledger files at `e88d4e283^` and at HEAD, and diffed them.
  - g0 `/45`, `/47`, `/115` and `/117`: only `rationale` changed.
  - g0 `/49` and `/50`: only `rationale`, `bindingSha256` and `targetUnitDigest` changed.
  - g0 `/127` and `/128` are new.
  - s4 `/22` and s5-authorities `/3`: only `placement/content` and `rationale` changed.
  - s5-truth `/6`: only `placement/next/textDigest` and `rationale` changed.
  - s2, s8 and s9: only `rationale` changed.
  - The s13 changes are limited to rows `/sourceBindings/4, 6, 59, 60, 61, 69, 70, 71`.
  - No supersession, disposition or source field changed. No ledger or docs commit landed after `e88d4e283`.
- **Placement scan.** I scanned every non-heading placement in the ledger and pilot shards: all 2,004 hash to their `selected.textDigest`. This matches the receipt.
- **Sources.** I searched the history of the legacy `docs/specs/work-state.md` (107 commits) with the dual extractor and found every g0 source digest.
  - `/45` and `/47` are headings at 864 and 888 at 11733af37, and still at those lines at HEAD.
  - `/115` and `/117` are at 13 and 1189 at cd8c1cc01.
  - `/49` and `/50` are at 40 and 42-75 at 08d754c30.
  - `/127` and `/128` are at 441 and 527-536 at 11733af37.
  - I extracted the "historical lines at" coordinates at the named commits. All 5 match the cited anchor, lines and digest: vision.md block-62 `ee50db7e`, observe.md `owns` `ca2fd76b` and block-3 `36f5428d` at 0d8c602e2, and runner.md `data-dictionary` `b91663ae` and block-9 `43f03eb4` at a9a2b079f.
- **Clauses.** For each g0 row, I diffed the source `sectionText` or block text against the target, line by line and then character by character, and matched each change to the rationale.
- **Docs edit.** `e88d4e283` changed `docs/platform/work-state/spec.md` at 3 lines: 74, 83 and 516. Each edit replaces a quoted old heading name with `[Add Verb](#add-verb)` or `[Submit Verb](#submit-verb)`.
  - Both anchors exist (headings at 713 and 737).
  - Every changed span lies outside fences (fence parity is 0) and outside inline code (backtick count before each span is even). This satisfies L13-25.1.
  - The line count is unchanged (1203).

## REWORK

| Row | Reason |
| --- | --- |
| g0-content-redecisions `/bindingRefresh/117` (claim_477a30f4) | The title change is now named. But the rationale's list ("moveStep, size, dep-open states, claim overlay, priority and intent", plus one RUL10 note) misses four substantive rule rewrites, measured against source `8ea4a467`. **RUL18:** `add` now defaults to the entry step through `entryStepFor` (`discovery` for coding); only old records read lazily as `executing`. **RUL19:** the sweep now dispatches the `fgos-researching` worker, and `resolveDiscovery` can move items to `planning` or `exploring`; the source said the sweep never decides a verdict. **RUL26:** the human-gate trigger widens from "only when ambiguous or the root's risk is heavy" to five triggers. **RUL53:** `compound` is deprecated in favour of `fgos doc`, and the path must now be committed at main HEAD and, under `docRegistry.enforce`, be a registered currentPath; the source said no shape check and a free path. RUL60 also goes beyond a size rename: `--tier` is retired and refused. Fix: name each of these in the rationale. No data change is needed. |
| g0-content-redecisions `/bindingRefresh/47` (claim_bf41e509) | The title change "Nộp vấn đề tự do (submit)" → "Submit Verb" is now named. But the rationale still says "every other clause is unchanged". The section diff also rewrites the rule gloss "(per RUL60 (submit — ba cờ ghi-đè tier/kind/risk, độc lập từng trường) dưới)" to "(per RUL60 (submit — cờ phân loại hiện hành) dưới)". That gloss follows the RUL60 retitle recorded on s5-root-truth-successors `/registryGaps/4`. Fix: name the gloss change, or drop the "every other clause" claim. Rationale only. |

## Approved

- **g0 `/45`.** This answers the b9 REWORK. The title change (legacy :864 → spec :713) is named. The section diff contains only the title, the required flags / optional `--id` / identity mint clause, and the "(9 file)" pointer, and all of them are named.
- **g0 `/115`.** The title change is named. The section diff contains only the title and the three named corrections: tier → size, `events.lock` → `withStateTx` hot mutex, and the per-item cleanup TTL / noop.
- **g0 `/49` and `/50`.** The digests were rebound for the line 74/83 edits.
  - `/50`'s block diff against `1cedade3` is exactly 4 lines: the id and rigor rows (in `changedClauses`) and the two heading-reference retargets in rows 12 and 21 (in the navigation note).
  - `/49` defers its payload to claim_5ba6768e and names the retargets.
- **g0 `/127` (new).** This is an overlay of pilot b-data-dictionary `/claims/55`, and its `supersedesBinding` identity matches the pilot row. The title change "Mô hình domain (base-workflow + domain-extension)" → "6. Domain Model" and the H3 → H2 depth change are named. The only section-payload change is the line-516 retarget, which the navigation note names.
- **g0 `/128` (new).** This is an overlay of pilot `/claims/65`. The diff against `fcc3b5bc` (legacy block-57) is the single line-516 retarget, which the rationale names as "retargeted, not verbatim".
- **s4 `/registryGaps/22` and s5-authorities `/registryGaps/3`.** These answer the b9 REWORKs. `placement.content` now equals the unit text: sha256 `e8167a0a` = `selected.textDigest` = `targetUnitDigest`. The code span `d['executeAssignment'](a)` is restored, and the rationale records the refresh.
- **s5-truth `/registryGaps/6`.** Only the `next` witness was refreshed. The row's own target digest `eb57f42e` is unchanged.
- **s2 `/404`, s8-observe `/4` and `/2`, s9 `/9` and `/33`.** The Source lines now say "historical lines at <commit>", and each one is verified at its commit. The Target "(current lines)" coordinates match the extracted units.

## Notes (non-blocking)

- **Other dangling Vietnamese heading references remain in the same target spec.** The brief named only two headings, but the same class of defect is still in `docs/platform/work-state/spec.md`. Examples: "Mô hình domain" (3 times, including line 83 right next to the new link), "Cửa pull giao–nhận việc" (3), "Giai đoạn Soi-rõ" (5), "Giai đoạn Lập-kế-hoạch" (3), "Đường đọc dữ liệu cũ", and "Phong bì output". About 15 distinct titles are quoted. Under RUL11, these should be gathered into a separate item.
- **The target contradicts itself on the default step for `add`.** Data Dictionary row 12 (spec.md:74, block-4, the line this change edited) says that an item created by `add` without `--step` gets the execute step (`executing`). RUL18 in §11 says `add` defaults through `entryStepFor` to `discovery`. The code agrees with RUL18 (`bin/fgos.mjs:1138`). This is pre-existing truth drift in the docs. It is not introduced here, and `/50`'s rationale does not claim row 12 is code-true.
- **`/50` `changedClauses` lists 2 clauses, but the unit now has 4 changed lines.** The navigation retargets are named only in the prose, and the prose still opens with "two labelled corrections". Structured consumers of `changedClauses` will miss them.
- **s13 `/sourceBindings/70` disposition is now slightly inaccurate.** It says "Only heading depth, link destination or whitespace adaptation", but the link text also changed: a quoted Vietnamese name became an English link label. The s13 rationales that were added also start with a stray leading newline. These rows are outside the G0 population.
- **Two source labels disagree with `sourceUnitDigest`.** For s8 `/claims/4` and s9 `/claims/9`, the "unit SHA256" in the Source line (`ca2fd76b`, `b91663ae`) is not the row's `sourceUnitDigest` (`a0deb389`, `7b71de9c`, which are phase-07 package-rebind digests). The cited SHA is correct for the cited historical lines. This predates `e88d4e283` and does not change any decision field.

## Join

`python3 -B g0join/join.py --pin HEAD` exits 1. Effective rows: 1,929. Approved: 1,913. Stale: 14. Missing: 2. Mismatched, open REWORK, invalid bindings and unresolved: all 0. These 16 records are uncommitted, so the join does not see them yet. Once they are committed, the expected result is 14 approved and 2 open REWORK (g0 `/47` and `/117`).

## Limits

- I used no git write, fgOS CLI, product test, `audit-report.py` or native addon. Extraction ran under `NODE_OPTIONS=--no-addons`.
- Scratch lived in a tempfile directory under `/tmp/fgos-work/` and was removed at the end.
