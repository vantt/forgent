Verdicts: 24 APPROVE / 3 REWORK

# G0 rationale-correction re-review, batch 9

Pin `b7ffa3be71cad7e48e6c0beb7f94589c6e09d49c`. Rows: all 27 rows in `g0join/verdict-batches/batch-9.json`, changed by `e7dd2c308` under [w28-g0-rationale-brief.md](../w28-g0-rationale-brief.md). The change answers the REWORKs in `w27-g0-stale-verdicts-b7` and `-b8`. Rulings: L13-22 and L13-25. Machine records: [w28-g0-verdicts-b9.json](w28-g0-verdicts-b9.json). Each record carries `rowFingerprint`, computed with `g0join/join.py` `row_fingerprint` at the pin.

## Method

- **Hashes.** For all 27 rows, `ledgerfix/bindings.py` `digest()` equals the stored `bindingSha256` and the batch value.
- **Target units.** Extracted with `rebind.py extract()` from a tempfile copy, under `NODE_OPTIONS=--no-addons`. Every anchor resolves to exactly one unit, whose digest equals `targetUnitDigest` and whose self-inclusive ancestry equals `targetAncestry`.
- **Allowed fields.** I flattened each changed ledger file at `e7dd2c308^` and at HEAD and diffed them.
  - The only changes are `rationale` on the 27 rows and `placement/selected/textDigest` on s4-successors `/registryGaps/22` and s5-authorities `/registryGaps/3`.
  - No binding, disposition, source or supersession field changed. `reviewStatus` was already `pending` on all 27 rows.
  - No ledger commit landed after `e7dd2c308`.
- **Coordinates.** I matched every `owner:a-b#anchor` and `(candidate lines a-b)` reference to the target owner against the extracted unit. The Target lines, the s8 candidate lines and the "currently …" note all match the units. The remaining off-range hits are labelled historical witnesses of the source.
- **Clauses.** I diffed the current legacy source against the target, modulo link destinations, for g0 `/45`, `/125` and `/126`, and against the s4 `/214` source witness. I checked the `/12` ruling against s13-resync-a `/sourceBindings/343`. I checked the residual lines against `import2/partial-carry-residuals.json` rows 0 and 1.

## REWORK

| Row | Reason |
| --- | --- |
| g0-content-redecisions `/bindingRefresh/45` (claim_b7cdc84d) | The "(9 file)" clause is now named, but the heading title change is not. The bound heading `docs/specs/work-state.md:864` "Khai việc (add) — bề mặt nội bộ" (digest e5aec62d) became "Add Verb" at `spec.md:713`, and that title is part of the composite digest. The fix touches the rationale text only. |
| s4-packaging-distribution-successors `/registryGaps/22` (claim_40aafcee) | `placement.selected.textDigest` now equals `e8167a0a`. But `placement.content` is still the pre-restore text: its sha256 is `299c5b49`, and it contains the corrupted code span ``d['executeAssignment'](../../../../specs/a)``. The record now contradicts itself and fails `ledgerfix/verify.py`'s `p['content'] == unit['text']` assertion. Refresh `placement.content` to the current unit text, which the brief did not authorize. The rationale is correct. |
| s5-root-authorities-boundary-gaps `/registryGaps/3` (claim_f033905b) | Same defect as s4 `/22`: `placement.content` is byte-identical to s4's stale content. The rationale is correct: lines 1/2/5/9/10, item 4 not carried verbatim, no pending-copy cap in this witness, and `import2` residualRef. |

## Approved

- **g0 `/125` and `/126`.** Both Authoring/Index "Spec → Contract" label changes are now named. In `/125` the heading depth goes from `##` to `####`. Apart from link destinations, the table diff shows no other change.
- **s4 `/214`.**
  - The target is now named as block-23 at line 258 under "Canonical Release Tree Rules".
  - The Legacy CLI link resolves to `docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md`, which exists.
  - Source `b22b5c1e` is block-41 at line 369 at `f6849be3a`. Apart from the link, it equals the target text.
- **s5 `/35` and s9 `/registryGaps/0`.** The Target and L12-44 note now name block-101 at 1244-1294. Block-102 is labelled as the historical coordinate.
- **s9 `/claims/12`.** The rationale now cites block-11 and s13-resync-a `/sourceBindings/343`, and that row's target is block-5 with digest `11acb9f9`.
- **Range and "unchanged since" fixes.** s2 `/404` (now line 354), s3 `/16` and s5 `/36` (now 71-85), s8-observe `/4` and `/2`, s9 `/9` and `/registryGaps/33`.
- **s8-agent-confinement (11 rows).** The candidate lines are corrected, and these are verbatim moves (source digest equals target digest).

## Notes (non-blocking)

- **Several Source lines still say "(current lines)" for historical sources.**
  - The bound source digest is not at the cited HEAD coordinate in: s2 `/404` (`ee50db7e` is now vision.md block-68:395), s8-observe `/4` and `/2`, s9 `/9` and `/registryGaps/33` (runner.md has shifted +1).
  - These lines predate this change and were outside the brief.
  - The fix is to label them "historical witness at <commit>", as s3 `/16` and s5 `/35` already do.
- **Same omission in sibling rows.** Other g0 rows outside this batch probably omit the same heading-title translation, for example `/47` submit-verb, where "Nộp vấn đề tự do (submit)" became "Submit Verb".
- **Dangling heading references in the target.** The target `docs/platform/work-state/spec.md` still points to "Khai việc" and "Nộp vấn đề tự do" at lines 74, 83 and 516, but those headings no longer exist. This is a docs issue, not a ledger issue.
- **The receipt's placement observations miss the content mismatch.** `g0join/followup-placement-evidence.json` does not mention it.

## Limits

- No git write, fgOS CLI, product test, `audit-report.py` or native addon was used.
- Scratch lived in a tempfile directory under `/tmp/fgos-work/`, removed at the end.
