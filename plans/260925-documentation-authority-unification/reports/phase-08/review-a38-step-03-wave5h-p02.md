# Review a38 step-03 wave5h part p02

## File verdict

- Path: docs/platform/coexistence/spec.md (batch 092)
- Set: batch-092 (targeted re-review). Stratum: patched (2 patch edges, 6 preserve or parked).
- Verdict: **ok**
- Edges reviewed: 8 of 8 (page 1-8). Source read whole (157 lines, 8043 bytes, sha256 954d7bc9...5b4d5f matches index and record digest). Record sha256 a47f70ea...0837 and diff sha256 79eec978...bf9 are index values (not independently recomputed). Pin ae141550c2e022310de7a0efea757580c0b2479f.

## Per-edge outcomes

| edge | line | disposition | outcome |
|---|---|---|---|
| 06617 | 9 | preserve | ok. Provenance line, docs/coexistence.md exists at pin. |
| 06618 | 17 | preserve | ok. Related to a retained root file. |
| 06619 | 25 | parked GAP-02 | ok. ADR0009 narrative sits only in docs/specs/platform-foundations.md (retiring); git grep at the pin found no live candidate holder (only incidental citations, index rows and the retiring spec). Parks under L12-41. |
| 06620 | 43 | patch to docs/platform/runner/operations/h-51f5cd7279fd.md#cổng-duyệt-pr-nội-bộ-approval-gate-reviewapprovereject | ok. Heading "Cổng duyệt PR nội bộ (approval gate) — review/approve/reject" is at line 234 of the target. It is one gate for runner and pull proposals covering all three verbs. Same holder as root twin 01325 (L12-53 alignment). Diff replaces only the path span inside the original "spec: `...`" form. |
| 06621 | 60 | patch to docs/routing-handoff-contract.md#khung-prompt-4-phần | ok. Heading "Khung prompt 4 phần" is at line 10 of the target. It states the worker's four-part dispatch prompt (goal, worktree boundary, expected proof, constraints). Matches the "contract dispatch của riêng fgOS" claim and L12-53 (06621 and 01326 share this holder). The one-orchestrator policy stays local, as the record says. |
| 06622 | 112 | preserve | ok. canary-run.md never existed at the pin, but the source says "hồ sơ xưởng, không thuộc repo sản phẩm này". That is a record that disclaims the product repo, so it preserves (L12-26(3,5), L12-47). |
| 06623 | 139 | parked GAP-02 | ok. Same basis as 06619. |
| 06624 | 145 | preserve | ok. docs/backlog.md exists at the pin. |

I ran the repo anchor API (scripts/list-doc-anchors.mjs, read-only, on `git show` copies in my scratch dir). Anchors `cổng-duyệt-pr-nội-bộ-approval-gate-reviewapprovereject` and `khung-prompt-4-phần` both exist in the repo convention. The GitHub slug of the first one has a double hyphen (`approval-gate--reviewapprovereject`); see the record-text note below.

## Missed-reference check

No missed edges. The remaining paths in the source are code or runtime paths (src/install/coexist.mjs, bin/fgos.mjs, test/e2e/..., .fgos/...). `relates_decisions: [ADR0009]`, `relates_backlog: [STR10]` and the "record ADR0009" prose are bare ids with no path (L12-49). The diff is exactly two hunks, and the second is the 06621 change. No false adjacent description found.

## Defects

Outcome defects: none.

Record-text notes (not rework):
- The 06620 anchor uses the repo anchor-API form (single hyphen), while the GitHub slug has a double hyphen. This is consistent with the checker/resolver convention (the anchor API gives both forms), so I am not asking for a change. Lead may want to confirm Step 4 uses the repo form.

Lead-judgment questions: none.

Checker limitations: none observed for this file.

## Counts

- batch-092, patched stratum: reviewed 1 file, rework 0.
- batch-092, unpatched stratum: 0 files.
- Changed edge ids 06620 and 06621: both ok.
