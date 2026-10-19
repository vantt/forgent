# A50 mapping-level census review request

**Supersedes `step-02c-review-request.md` and its 338-part per-edge packet.** Those committed files remain unchanged and are not scheduled for review. This is one replacement request, not 97 independent acceptance requests. Slice-1/2 accepted judgments remain subject to the explicitly named L12-20 correction overlays; no changed binding inherits approval.

## Pinned inputs and precedence

- Original population: `step-02c-census-maps-portals-prose.json`, **5,427 edges / 1,036 files**. All 13,136 native edges, old reconciliation/ledger joins and old review payloads remain available; this re-cut does not regenerate the 2.61 GB inventory.
- Effective precedence: original tables → `step-02c-slice1-corrections.json` (L12-19) → `step-02d-slice2-corrections.json` (L12-20) → `step-02d-wrapped-citation-rescan.json` for its named wrapped rebindings. Every superseded row has an exact original-row hash; every consumer retains its digest and physical spans.
- `step-02c-mapping-review-index.json` pins source bytes and embeds every logical part, exact entry IDs, mandatory deep reads and unique report path. Resolve IDs in its `sourceTable`; do not create 97 redundant payload files. Effective earlier anchor failure selection is `effective: true`, disambiguating the old and corrected setup-001 rows.
- `step-02c-distinct-mappings.json` groups effective normalized reference / owner / anchor, retaining every edge ID, consumer classes, roles, action variants, source/render distinctions, mechanical check status, counts and representative context. Null owners/anchors and unchecked preserve mappings are unresolved, not passes.

## Mandatory mechanical replay by one independent reviewer

From the repository root (or any cwd using an absolute script path):

```sh
env -u CLAUDE_CODE_SESSION_ID python3 plans/260925-documentation-authority-unification/reports/phase-08/step-02c-replay.py
```

The plan-local script is read-only and uses only the Python standard library. It verifies all 5,427 original consumer digests, physical lines/spans and contexts (including bounded generated-line digests), every effective mapping join, original file coverage, all new/rebound physical spans and correction row identities, target receipt/API/passages, deterministic sample, source pins, exact exception/part membership and both entry/byte bounds. It prints PASS/FAIL and exits 0/1. Reviewer must pin HEAD, script/source SHA-256, full stdout and exit. Author replay PASS is not independent approval. Three in-memory negative probes reject a changed edge digest, shifted span and removed mapping join without changing repository inputs.

## Deep-read populations

**Deep-read all 1,018 distinct mappings**, all entries in every exception set, and all **815 sampled edges**. Sample seed: `A50-step02c-2026-10-19-v1`; rank SHA-256 of UTF-8(seed + NUL + edgeId), ascending hash then edgeId, first ceil(15% × 5,427). `step-02c-edge-sample.json` records ranks and membership. Do not substitute convenience picks. Each listed part requires every listed entry; that also exceeds the shared minimum 10/all when fewer.

**L12-7: every edge whose consumer file is inside `docs/specs/**` or `docs/architect/**` is cutover-patch-only.** This restriction concerns the consumer location, independently of what path the edge cites. No edit to those files is authorized. Mapping population: **1391 / 5,427** such edges; sample: **200 / 815**. The following table counts them in each exception set. Sets overlap; do not add them as unique edges.

| Exception set | Entries | Consumer inside retiring roots | Parts |
|---|---:|---:|---|
| preserve-pending-target | 675 | 154 | 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29 |
| preserve-pending-behavioral-proof | 647 | 202 | 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40 |
| mechanical-target-failures | 104 | 65 | 41, 42 |
| anchor-check-failures | 21 | 0 | 43 |
| writers-and-writer-triage | 781 | 148 | 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57 |
| behavioral-runtime-and-contract-triage | 1072 | 212 | 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75 |
| wrapped-new-edges | 115 | 10 | 76, 77 |
| wrapped-rebindings | 11 | 0 | 78 |
| literal-new-edges | 18 | 0 | 79 |
| slice2-corrections | 48 | 0 | 80, 81 |
| native-dynamic-patterns | 9 | 0 | 82 |

Writer and behavioral/runtime sets are deliberately conservative: **781 writer/possible-writer rows**, **1,072 behavioral/read/default-root/contract triage rows**, including conserved carriers. A nearby verb is not an IO trace. Read actual open/write/default-root code or explicit instruction, exact destinations, adoption versus retired-engine status, generated-source ownership and paired checks before a rewrite can be approved. Class-6 runtime/gateway coverage is not claimed. Nine native unresolved dynamic patterns are a separate mandatory set; other historical-coordinate/non-join gaps remain parked in the old dynamic artifact and cannot acquire readiness from this mapping review.

The **104 mechanical target failures** and **21 effective earlier anchor-check failures** remain failures requiring re-review against current correction overlays. Receipt token/anchor existence is not semantic correspondence or behavioral parity. Do not activate draft aliases, use aliases as writing destinations, treat conservation carriers as canonical authority, or turn a blocked candidate suggestion into executable `new` text. Bare decision IDs are not path consumers; Phase 9 must prove regenerated decision-index resolution of every cited ID. The instructions-019/020 install-gate meaning change is explicitly owed to the Phase 9 owner packet.

Expansion contributes **115 new wrapped edges + 18 new literal edges = 133 new edges**, plus **11 wrapped rebindings** and **48 corrected prior edges**. Read every one. Wrapped scan covers **1,390 completed-class files**, preserves every physical line span, and excludes five directory/prose continuations with reasons. Its stable/end-user and missing targets are visible rather than inferred away. The AGENTS docs/decisions recheck includes every literal occurrence and the existing split-IO seam; corrected native joins distinguish globs from index.md. All eight backfill native records join 12 physical literal occurrences across three byte-identical source/render copies; six deprecated stub dispositions now pin pre-stripping and stub hashes at `8eff54d0f`.

## Part contract and reserved reports

**97 logical parts / 5,344 review entries**, including overlaps and ten control entries. Each has ≤60 entries and ≤400,000 bytes including its resolved source-row payload and part metadata. Largest resolved-row payload: **386196 bytes**. The old 57 MB payload is not copied. Every part below carries its explicit mandatory-read list in the index; reviewer reports use the exact unique filename shown. Do not author reports in this Doer turn.

| Part | Population | Entries | Resolved row bytes | Independent report |
|---:|---|---:|---:|---|
| 01 | distinct-mappings | 60 | 113707 | `review-a38-step-02c-map-part-01.md` |
| 02 | distinct-mappings | 60 | 116718 | `review-a38-step-02c-map-part-02.md` |
| 03 | distinct-mappings | 60 | 147519 | `review-a38-step-02c-map-part-03.md` |
| 04 | distinct-mappings | 60 | 158867 | `review-a38-step-02c-map-part-04.md` |
| 05 | distinct-mappings | 60 | 160300 | `review-a38-step-02c-map-part-05.md` |
| 06 | distinct-mappings | 60 | 132099 | `review-a38-step-02c-map-part-06.md` |
| 07 | distinct-mappings | 60 | 209920 | `review-a38-step-02c-map-part-07.md` |
| 08 | distinct-mappings | 60 | 131738 | `review-a38-step-02c-map-part-08.md` |
| 09 | distinct-mappings | 60 | 115665 | `review-a38-step-02c-map-part-09.md` |
| 10 | distinct-mappings | 60 | 172101 | `review-a38-step-02c-map-part-10.md` |
| 11 | distinct-mappings | 60 | 119106 | `review-a38-step-02c-map-part-11.md` |
| 12 | distinct-mappings | 60 | 153415 | `review-a38-step-02c-map-part-12.md` |
| 13 | distinct-mappings | 60 | 155884 | `review-a38-step-02c-map-part-13.md` |
| 14 | distinct-mappings | 60 | 161168 | `review-a38-step-02c-map-part-14.md` |
| 15 | distinct-mappings | 60 | 121536 | `review-a38-step-02c-map-part-15.md` |
| 16 | distinct-mappings | 60 | 153397 | `review-a38-step-02c-map-part-16.md` |
| 17 | distinct-mappings | 58 | 130086 | `review-a38-step-02c-map-part-17.md` |
| 18 | preserve-pending-target | 60 | 177649 | `review-a38-step-02c-map-part-18.md` |
| 19 | preserve-pending-target | 60 | 169875 | `review-a38-step-02c-map-part-19.md` |
| 20 | preserve-pending-target | 60 | 185674 | `review-a38-step-02c-map-part-20.md` |
| 21 | preserve-pending-target | 60 | 159462 | `review-a38-step-02c-map-part-21.md` |
| 22 | preserve-pending-target | 60 | 213998 | `review-a38-step-02c-map-part-22.md` |
| 23 | preserve-pending-target | 60 | 263244 | `review-a38-step-02c-map-part-23.md` |
| 24 | preserve-pending-target | 60 | 264660 | `review-a38-step-02c-map-part-24.md` |
| 25 | preserve-pending-target | 60 | 262889 | `review-a38-step-02c-map-part-25.md` |
| 26 | preserve-pending-target | 60 | 206772 | `review-a38-step-02c-map-part-26.md` |
| 27 | preserve-pending-target | 60 | 249774 | `review-a38-step-02c-map-part-27.md` |
| 28 | preserve-pending-target | 60 | 181679 | `review-a38-step-02c-map-part-28.md` |
| 29 | preserve-pending-target | 15 | 50276 | `review-a38-step-02c-map-part-29.md` |
| 30 | preserve-pending-behavioral-proof | 60 | 234725 | `review-a38-step-02c-map-part-30.md` |
| 31 | preserve-pending-behavioral-proof | 60 | 315770 | `review-a38-step-02c-map-part-31.md` |
| 32 | preserve-pending-behavioral-proof | 60 | 296022 | `review-a38-step-02c-map-part-32.md` |
| 33 | preserve-pending-behavioral-proof | 60 | 252392 | `review-a38-step-02c-map-part-33.md` |
| 34 | preserve-pending-behavioral-proof | 60 | 264193 | `review-a38-step-02c-map-part-34.md` |
| 35 | preserve-pending-behavioral-proof | 60 | 386196 | `review-a38-step-02c-map-part-35.md` |
| 36 | preserve-pending-behavioral-proof | 60 | 352218 | `review-a38-step-02c-map-part-36.md` |
| 37 | preserve-pending-behavioral-proof | 60 | 359973 | `review-a38-step-02c-map-part-37.md` |
| 38 | preserve-pending-behavioral-proof | 60 | 335203 | `review-a38-step-02c-map-part-38.md` |
| 39 | preserve-pending-behavioral-proof | 60 | 359610 | `review-a38-step-02c-map-part-39.md` |
| 40 | preserve-pending-behavioral-proof | 47 | 250745 | `review-a38-step-02c-map-part-40.md` |
| 41 | mechanical-target-failures | 60 | 92567 | `review-a38-step-02c-map-part-41.md` |
| 42 | mechanical-target-failures | 44 | 74999 | `review-a38-step-02c-map-part-42.md` |
| 43 | anchor-check-failures | 21 | 30375 | `review-a38-step-02c-map-part-43.md` |
| 44 | writers-and-writer-triage | 60 | 273567 | `review-a38-step-02c-map-part-44.md` |
| 45 | writers-and-writer-triage | 60 | 339265 | `review-a38-step-02c-map-part-45.md` |
| 46 | writers-and-writer-triage | 60 | 268838 | `review-a38-step-02c-map-part-46.md` |
| 47 | writers-and-writer-triage | 60 | 242015 | `review-a38-step-02c-map-part-47.md` |
| 48 | writers-and-writer-triage | 60 | 259928 | `review-a38-step-02c-map-part-48.md` |
| 49 | writers-and-writer-triage | 60 | 291477 | `review-a38-step-02c-map-part-49.md` |
| 50 | writers-and-writer-triage | 60 | 303653 | `review-a38-step-02c-map-part-50.md` |
| 51 | writers-and-writer-triage | 60 | 356321 | `review-a38-step-02c-map-part-51.md` |
| 52 | writers-and-writer-triage | 60 | 267494 | `review-a38-step-02c-map-part-52.md` |
| 53 | writers-and-writer-triage | 60 | 290345 | `review-a38-step-02c-map-part-53.md` |
| 54 | writers-and-writer-triage | 60 | 339072 | `review-a38-step-02c-map-part-54.md` |
| 55 | writers-and-writer-triage | 60 | 383077 | `review-a38-step-02c-map-part-55.md` |
| 56 | writers-and-writer-triage | 60 | 352195 | `review-a38-step-02c-map-part-56.md` |
| 57 | writers-and-writer-triage | 1 | 3160 | `review-a38-step-02c-map-part-57.md` |
| 58 | behavioral-runtime-and-contract-triage | 60 | 232869 | `review-a38-step-02c-map-part-58.md` |
| 59 | behavioral-runtime-and-contract-triage | 60 | 297699 | `review-a38-step-02c-map-part-59.md` |
| 60 | behavioral-runtime-and-contract-triage | 60 | 309167 | `review-a38-step-02c-map-part-60.md` |
| 61 | behavioral-runtime-and-contract-triage | 60 | 269406 | `review-a38-step-02c-map-part-61.md` |
| 62 | behavioral-runtime-and-contract-triage | 60 | 232780 | `review-a38-step-02c-map-part-62.md` |
| 63 | behavioral-runtime-and-contract-triage | 60 | 258642 | `review-a38-step-02c-map-part-63.md` |
| 64 | behavioral-runtime-and-contract-triage | 60 | 254269 | `review-a38-step-02c-map-part-64.md` |
| 65 | behavioral-runtime-and-contract-triage | 60 | 291998 | `review-a38-step-02c-map-part-65.md` |
| 66 | behavioral-runtime-and-contract-triage | 60 | 226861 | `review-a38-step-02c-map-part-66.md` |
| 67 | behavioral-runtime-and-contract-triage | 60 | 359144 | `review-a38-step-02c-map-part-67.md` |
| 68 | behavioral-runtime-and-contract-triage | 60 | 345436 | `review-a38-step-02c-map-part-68.md` |
| 69 | behavioral-runtime-and-contract-triage | 60 | 278236 | `review-a38-step-02c-map-part-69.md` |
| 70 | behavioral-runtime-and-contract-triage | 60 | 284732 | `review-a38-step-02c-map-part-70.md` |
| 71 | behavioral-runtime-and-contract-triage | 60 | 251888 | `review-a38-step-02c-map-part-71.md` |
| 72 | behavioral-runtime-and-contract-triage | 60 | 362817 | `review-a38-step-02c-map-part-72.md` |
| 73 | behavioral-runtime-and-contract-triage | 60 | 338309 | `review-a38-step-02c-map-part-73.md` |
| 74 | behavioral-runtime-and-contract-triage | 60 | 368747 | `review-a38-step-02c-map-part-74.md` |
| 75 | behavioral-runtime-and-contract-triage | 52 | 272778 | `review-a38-step-02c-map-part-75.md` |
| 76 | wrapped-new-edges | 60 | 148355 | `review-a38-step-02c-map-part-76.md` |
| 77 | wrapped-new-edges | 55 | 135549 | `review-a38-step-02c-map-part-77.md` |
| 78 | wrapped-rebindings | 11 | 33501 | `review-a38-step-02c-map-part-78.md` |
| 79 | literal-new-edges | 18 | 36184 | `review-a38-step-02c-map-part-79.md` |
| 80 | slice2-corrections | 28 | 381871 | `review-a38-step-02c-map-part-80.md` |
| 81 | slice2-corrections | 20 | 115491 | `review-a38-step-02c-map-part-81.md` |
| 82 | native-dynamic-patterns | 9 | 3987 | `review-a38-step-02c-map-part-82.md` |
| 83 | seeded-semantic-edge-sample | 60 | 254780 | `review-a38-step-02c-map-part-83.md` |
| 84 | seeded-semantic-edge-sample | 60 | 251560 | `review-a38-step-02c-map-part-84.md` |
| 85 | seeded-semantic-edge-sample | 60 | 266321 | `review-a38-step-02c-map-part-85.md` |
| 86 | seeded-semantic-edge-sample | 60 | 271416 | `review-a38-step-02c-map-part-86.md` |
| 87 | seeded-semantic-edge-sample | 60 | 262116 | `review-a38-step-02c-map-part-87.md` |
| 88 | seeded-semantic-edge-sample | 60 | 256933 | `review-a38-step-02c-map-part-88.md` |
| 89 | seeded-semantic-edge-sample | 60 | 257444 | `review-a38-step-02c-map-part-89.md` |
| 90 | seeded-semantic-edge-sample | 60 | 255334 | `review-a38-step-02c-map-part-90.md` |
| 91 | seeded-semantic-edge-sample | 60 | 243420 | `review-a38-step-02c-map-part-91.md` |
| 92 | seeded-semantic-edge-sample | 60 | 258696 | `review-a38-step-02c-map-part-92.md` |
| 93 | seeded-semantic-edge-sample | 60 | 255223 | `review-a38-step-02c-map-part-93.md` |
| 94 | seeded-semantic-edge-sample | 60 | 257204 | `review-a38-step-02c-map-part-94.md` |
| 95 | seeded-semantic-edge-sample | 60 | 236908 | `review-a38-step-02c-map-part-95.md` |
| 96 | seeded-semantic-edge-sample | 35 | 150787 | `review-a38-step-02c-map-part-96.md` |
| 97 | correction-controls | 10 | 1265 | `review-a38-step-02c-map-part-97.md` |

## Acceptance, sizing and open boundaries

Lead starts fresh-context A38 reviewers; no reviewer is dispatched by this author. **Started 0 / accepted 0 / independent elapsed 0; reviewer budget unassigned.** Lead must size this actual mapping/exception/sample volume and the full mechanical pass; the earlier seed budget does not silently cover it. Track ok/rework/needs-Lead-judgment for every listed ID, exact pins and time, with cumulative rates per logical set. Above 3% rework expands that affected set to full reading and returns sizing to Lead; it does not change dispositions or permit consumer edits. A sample-set breach means full semantic reading of the 5,427-edge population. Source digest drift invalidates only affected judgments.

This packet is static census/review preparation. Step 2 and class-3 operational/dynamic/current-coordinate traces remain open. Class 4 has not started: finish these traces and the mandatory re-review before moving past the existing class boundary. No code, consumer, docs/**, instructions, checker, baseline, switchboard, alias activation, protected manifest or .fgos state is changed. Runner commits this author batch; Lead separately accounts its real commit/path pairs in both manifests under L12-11, then runs committed-byte acceptance. No author receipt substitutes for those gates. Markdown preview/service is left to the Lead environment; this assignment starts none.
