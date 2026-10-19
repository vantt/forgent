# Step 02i — one A50 mapping review request

**Supersedes the entire step-02h packet.** Preserve its tables, request and partial reviews as baseline evidence. This request is author preparation under A49/A50 and L12-21..25; it is not semantic acceptance or Phase 9 authorization.

Input committed tree: `c5efdf003417b6f68441d9297c1d0519b12f68b1`. **5,436 edges / 1,036 files / 1,351 distinct mappings / 121 logical parts**. The SHA-256 sample covers **816 edges** (ceil 15%). Maximum fully resolved part is **397,442 bytes**, below 400 KB; each part has at most 60 entries. Logical parts are embedded in the index; no duplicated per-part payload files.

Read [owner answers](owner-answers.md) A49/A50 and L12-21..25, [defect diff](step-02i-defect-diff.md), then [mapping review index](step-02i-mapping-review-index.json). The index pins source tables and all available step-02h reviews. Its `report` fields reserve unique `review-a38-step-02i-map-part-NN.md` paths; do not reuse earlier report names.

## Independent review procedure

Lead starts one eligible fresh-context mechanical reviewer to run `python3 step-02i-replay.py --input-commit HEAD` from the plan worktree at the actual runner commit. Author replay at the current committed input tree passes with 192 differential probes, 9 syntax cases and 8 rejected mutations. A replay from `/tmp` also PASSes with byte-identical output; see [final checks](step-02i-final-checks.json). The runner commit does not exist yet in this producer turn; Lead must repeat on that real commit.

Lead starts fresh-context A38 semantic reviewers in waves of at most six reviewers, normally two logical parts per reviewer. Every mapping is deep-read, including every action/role/rule variant and actual old/new passage. Every exception set is deep-read. The seeded sample gets semantic reading against its committed consumer context. A set above 3% rework expands to a full read of that set; a sample breach expands to all edges. Record ok/rework/needs-Lead-judgment by entry ID, reasons and actual source evidence. No reviewer is launched by this producer.

The replay reparses every source unit, checks file/callsite digests and every physical span, regenerates mapping/exception/sample/part tables, checks all 197 chronological overlay controls and final hashes in downstream consumers, and rejects stale precedence/membership/part payloads. All target and directory existence comes from the input Git tree.

## Mandatory re-review and pilot crosswalk

**391 changed-action rows from step-02h** are mandatory in **parts 115–121**, even if the fix moved them out of an earlier exception set. There are no removed step-02h rows; wrapped units retain source-span joins. Every distinct mapping is still reviewed. The full changed-field ledger covers 679 source rows, including action-neutral reference/owner/successor corrections.

- Former step-02e pilot **03 → parts 99–101** (123 source edges / 123 joined edges).
- Former step-02e pilot **26 → part 102** (60 / 60).
- Former step-02f pilots **30 / 47 / 65 → parts 103 / 104 / 105**.
- Earlier step-02g exclusion controls → part 106; its changed actions → parts 107–114.

The [pilot crosswalk](step-02i-pilot-crosswalk.json) includes every source-row join and its ordinary mapping parts; the index identifies all intentional overlapping mandatory sets.

## Logical parts

| Part | Population | Entries | Payload bytes | Reserved report |
|---:|---|---:|---:|---|
| 01 | distinct-mappings | 60 | 54425 | `review-a38-step-02i-map-part-01.md` |
| 02 | distinct-mappings | 60 | 62318 | `review-a38-step-02i-map-part-02.md` |
| 03 | distinct-mappings | 60 | 55433 | `review-a38-step-02i-map-part-03.md` |
| 04 | distinct-mappings | 60 | 57306 | `review-a38-step-02i-map-part-04.md` |
| 05 | distinct-mappings | 60 | 56769 | `review-a38-step-02i-map-part-05.md` |
| 06 | distinct-mappings | 60 | 56619 | `review-a38-step-02i-map-part-06.md` |
| 07 | distinct-mappings | 60 | 57867 | `review-a38-step-02i-map-part-07.md` |
| 08 | distinct-mappings | 60 | 63298 | `review-a38-step-02i-map-part-08.md` |
| 09 | distinct-mappings | 60 | 50415 | `review-a38-step-02i-map-part-09.md` |
| 10 | distinct-mappings | 60 | 34392 | `review-a38-step-02i-map-part-10.md` |
| 11 | distinct-mappings | 60 | 34370 | `review-a38-step-02i-map-part-11.md` |
| 12 | distinct-mappings | 60 | 35055 | `review-a38-step-02i-map-part-12.md` |
| 13 | distinct-mappings | 60 | 34719 | `review-a38-step-02i-map-part-13.md` |
| 14 | distinct-mappings | 60 | 34283 | `review-a38-step-02i-map-part-14.md` |
| 15 | distinct-mappings | 60 | 34066 | `review-a38-step-02i-map-part-15.md` |
| 16 | distinct-mappings | 60 | 41399 | `review-a38-step-02i-map-part-16.md` |
| 17 | distinct-mappings | 60 | 38098 | `review-a38-step-02i-map-part-17.md` |
| 18 | distinct-mappings | 60 | 36931 | `review-a38-step-02i-map-part-18.md` |
| 19 | distinct-mappings | 60 | 35159 | `review-a38-step-02i-map-part-19.md` |
| 20 | distinct-mappings | 60 | 35719 | `review-a38-step-02i-map-part-20.md` |
| 21 | distinct-mappings | 60 | 37775 | `review-a38-step-02i-map-part-21.md` |
| 22 | distinct-mappings | 60 | 62384 | `review-a38-step-02i-map-part-22.md` |
| 23 | distinct-mappings | 31 | 24794 | `review-a38-step-02i-map-part-23.md` |
| 24 | preserve-pending-target | 60 | 180741 | `review-a38-step-02i-map-part-24.md` |
| 25 | preserve-pending-target | 60 | 192494 | `review-a38-step-02i-map-part-25.md` |
| 26 | preserve-pending-target | 60 | 176158 | `review-a38-step-02i-map-part-26.md` |
| 27 | preserve-pending-target | 60 | 158571 | `review-a38-step-02i-map-part-27.md` |
| 28 | preserve-pending-target | 60 | 156220 | `review-a38-step-02i-map-part-28.md` |
| 29 | preserve-pending-target | 60 | 158347 | `review-a38-step-02i-map-part-29.md` |
| 30 | preserve-pending-target | 60 | 137944 | `review-a38-step-02i-map-part-30.md` |
| 31 | preserve-pending-target | 49 | 145382 | `review-a38-step-02i-map-part-31.md` |
| 32 | preserve-pending-behavioral-proof | 60 | 232075 | `review-a38-step-02i-map-part-32.md` |
| 33 | preserve-pending-behavioral-proof | 60 | 225582 | `review-a38-step-02i-map-part-33.md` |
| 34 | preserve-pending-behavioral-proof | 60 | 194896 | `review-a38-step-02i-map-part-34.md` |
| 35 | preserve-pending-behavioral-proof | 14 | 45826 | `review-a38-step-02i-map-part-35.md` |
| 36 | phase9-row-flip | 60 | 206504 | `review-a38-step-02i-map-part-36.md` |
| 37 | phase9-row-flip | 60 | 196674 | `review-a38-step-02i-map-part-37.md` |
| 38 | phase9-row-flip | 27 | 78560 | `review-a38-step-02i-map-part-38.md` |
| 39 | mechanical-target-failures | 19 | 58910 | `review-a38-step-02i-map-part-39.md` |
| 40 | writers-and-writer-triage | 60 | 203262 | `review-a38-step-02i-map-part-40.md` |
| 41 | writers-and-writer-triage | 60 | 226628 | `review-a38-step-02i-map-part-41.md` |
| 42 | writers-and-writer-triage | 60 | 191504 | `review-a38-step-02i-map-part-42.md` |
| 43 | writers-and-writer-triage | 60 | 184864 | `review-a38-step-02i-map-part-43.md` |
| 44 | writers-and-writer-triage | 60 | 183125 | `review-a38-step-02i-map-part-44.md` |
| 45 | writers-and-writer-triage | 60 | 224639 | `review-a38-step-02i-map-part-45.md` |
| 46 | writers-and-writer-triage | 60 | 212912 | `review-a38-step-02i-map-part-46.md` |
| 47 | writers-and-writer-triage | 60 | 235642 | `review-a38-step-02i-map-part-47.md` |
| 48 | writers-and-writer-triage | 60 | 175595 | `review-a38-step-02i-map-part-48.md` |
| 49 | writers-and-writer-triage | 60 | 180230 | `review-a38-step-02i-map-part-49.md` |
| 50 | writers-and-writer-triage | 60 | 227233 | `review-a38-step-02i-map-part-50.md` |
| 51 | writers-and-writer-triage | 60 | 258769 | `review-a38-step-02i-map-part-51.md` |
| 52 | writers-and-writer-triage | 52 | 197533 | `review-a38-step-02i-map-part-52.md` |
| 53 | behavioral-runtime-and-contract-triage | 60 | 182703 | `review-a38-step-02i-map-part-53.md` |
| 54 | behavioral-runtime-and-contract-triage | 60 | 209858 | `review-a38-step-02i-map-part-54.md` |
| 55 | behavioral-runtime-and-contract-triage | 60 | 234925 | `review-a38-step-02i-map-part-55.md` |
| 56 | behavioral-runtime-and-contract-triage | 60 | 217748 | `review-a38-step-02i-map-part-56.md` |
| 57 | behavioral-runtime-and-contract-triage | 60 | 163468 | `review-a38-step-02i-map-part-57.md` |
| 58 | behavioral-runtime-and-contract-triage | 60 | 214102 | `review-a38-step-02i-map-part-58.md` |
| 59 | behavioral-runtime-and-contract-triage | 60 | 184201 | `review-a38-step-02i-map-part-59.md` |
| 60 | behavioral-runtime-and-contract-triage | 60 | 198002 | `review-a38-step-02i-map-part-60.md` |
| 61 | behavioral-runtime-and-contract-triage | 60 | 209545 | `review-a38-step-02i-map-part-61.md` |
| 62 | behavioral-runtime-and-contract-triage | 60 | 153666 | `review-a38-step-02i-map-part-62.md` |
| 63 | behavioral-runtime-and-contract-triage | 60 | 272498 | `review-a38-step-02i-map-part-63.md` |
| 64 | behavioral-runtime-and-contract-triage | 60 | 208377 | `review-a38-step-02i-map-part-64.md` |
| 65 | behavioral-runtime-and-contract-triage | 60 | 187919 | `review-a38-step-02i-map-part-65.md` |
| 66 | behavioral-runtime-and-contract-triage | 60 | 185265 | `review-a38-step-02i-map-part-66.md` |
| 67 | behavioral-runtime-and-contract-triage | 60 | 160352 | `review-a38-step-02i-map-part-67.md` |
| 68 | behavioral-runtime-and-contract-triage | 60 | 253958 | `review-a38-step-02i-map-part-68.md` |
| 69 | behavioral-runtime-and-contract-triage | 60 | 234027 | `review-a38-step-02i-map-part-69.md` |
| 70 | behavioral-runtime-and-contract-triage | 60 | 216170 | `review-a38-step-02i-map-part-70.md` |
| 71 | behavioral-runtime-and-contract-triage | 12 | 38049 | `review-a38-step-02i-map-part-71.md` |
| 72 | semantic-roadmap | 2 | 5113 | `review-a38-step-02i-map-part-72.md` |
| 73 | pre-existing-broken-links | 60 | 196357 | `review-a38-step-02i-map-part-73.md` |
| 74 | pre-existing-broken-links | 60 | 265752 | `review-a38-step-02i-map-part-74.md` |
| 75 | pre-existing-broken-links | 43 | 164754 | `review-a38-step-02i-map-part-75.md` |
| 76 | overlay-precedence-controls | 17 | 382711 | `review-a38-step-02i-map-part-76.md` |
| 77 | overlay-precedence-controls | 36 | 396297 | `review-a38-step-02i-map-part-77.md` |
| 78 | overlay-precedence-controls | 60 | 166467 | `review-a38-step-02i-map-part-78.md` |
| 79 | overlay-precedence-controls | 60 | 173691 | `review-a38-step-02i-map-part-79.md` |
| 80 | overlay-precedence-controls | 24 | 75901 | `review-a38-step-02i-map-part-80.md` |
| 81 | prior-target-failure-dispositions | 60 | 124247 | `review-a38-step-02i-map-part-81.md` |
| 82 | prior-target-failure-dispositions | 44 | 98231 | `review-a38-step-02i-map-part-82.md` |
| 83 | prior-anchor-check-failures | 21 | 33908 | `review-a38-step-02i-map-part-83.md` |
| 84 | native-dynamic-patterns | 9 | 5742 | `review-a38-step-02i-map-part-84.md` |
| 85 | seeded-semantic-edge-sample | 60 | 192704 | `review-a38-step-02i-map-part-85.md` |
| 86 | seeded-semantic-edge-sample | 60 | 176208 | `review-a38-step-02i-map-part-86.md` |
| 87 | seeded-semantic-edge-sample | 60 | 189835 | `review-a38-step-02i-map-part-87.md` |
| 88 | seeded-semantic-edge-sample | 60 | 178582 | `review-a38-step-02i-map-part-88.md` |
| 89 | seeded-semantic-edge-sample | 60 | 160947 | `review-a38-step-02i-map-part-89.md` |
| 90 | seeded-semantic-edge-sample | 60 | 152895 | `review-a38-step-02i-map-part-90.md` |
| 91 | seeded-semantic-edge-sample | 60 | 233681 | `review-a38-step-02i-map-part-91.md` |
| 92 | seeded-semantic-edge-sample | 60 | 172867 | `review-a38-step-02i-map-part-92.md` |
| 93 | seeded-semantic-edge-sample | 60 | 201402 | `review-a38-step-02i-map-part-93.md` |
| 94 | seeded-semantic-edge-sample | 60 | 153365 | `review-a38-step-02i-map-part-94.md` |
| 95 | seeded-semantic-edge-sample | 60 | 211277 | `review-a38-step-02i-map-part-95.md` |
| 96 | seeded-semantic-edge-sample | 60 | 172943 | `review-a38-step-02i-map-part-96.md` |
| 97 | seeded-semantic-edge-sample | 60 | 203396 | `review-a38-step-02i-map-part-97.md` |
| 98 | seeded-semantic-edge-sample | 36 | 110344 | `review-a38-step-02i-map-part-98.md` |
| 99 | mandatory-rereview-former-pilot-03 | 60 | 201692 | `review-a38-step-02i-map-part-99.md` |
| 100 | mandatory-rereview-former-pilot-03 | 60 | 229699 | `review-a38-step-02i-map-part-100.md` |
| 101 | mandatory-rereview-former-pilot-03 | 3 | 12076 | `review-a38-step-02i-map-part-101.md` |
| 102 | mandatory-rereview-former-pilot-26 | 60 | 188509 | `review-a38-step-02i-map-part-102.md` |
| 103 | mandatory-rereview-second-pilot-30 | 60 | 157044 | `review-a38-step-02i-map-part-103.md` |
| 104 | mandatory-rereview-second-pilot-47 | 60 | 237829 | `review-a38-step-02i-map-part-104.md` |
| 105 | mandatory-rereview-second-pilot-65 | 60 | 167047 | `review-a38-step-02i-map-part-105.md` |
| 106 | mandatory-rereview-excluded-from-02g | 2 | 4867 | `review-a38-step-02i-map-part-106.md` |
| 107 | mandatory-rereview-action-changed-from-02g | 60 | 175985 | `review-a38-step-02i-map-part-107.md` |
| 108 | mandatory-rereview-action-changed-from-02g | 60 | 183248 | `review-a38-step-02i-map-part-108.md` |
| 109 | mandatory-rereview-action-changed-from-02g | 60 | 152402 | `review-a38-step-02i-map-part-109.md` |
| 110 | mandatory-rereview-action-changed-from-02g | 60 | 152128 | `review-a38-step-02i-map-part-110.md` |
| 111 | mandatory-rereview-action-changed-from-02g | 60 | 189291 | `review-a38-step-02i-map-part-111.md` |
| 112 | mandatory-rereview-action-changed-from-02g | 60 | 183546 | `review-a38-step-02i-map-part-112.md` |
| 113 | mandatory-rereview-action-changed-from-02g | 60 | 184231 | `review-a38-step-02i-map-part-113.md` |
| 114 | mandatory-rereview-action-changed-from-02g | 41 | 141620 | `review-a38-step-02i-map-part-114.md` |
| 115 | mandatory-rereview-action-changed-from-02h | 60 | 197326 | `review-a38-step-02i-map-part-115.md` |
| 116 | mandatory-rereview-action-changed-from-02h | 60 | 152246 | `review-a38-step-02i-map-part-116.md` |
| 117 | mandatory-rereview-action-changed-from-02h | 60 | 152110 | `review-a38-step-02i-map-part-117.md` |
| 118 | mandatory-rereview-action-changed-from-02h | 60 | 177383 | `review-a38-step-02i-map-part-118.md` |
| 119 | mandatory-rereview-action-changed-from-02h | 60 | 194154 | `review-a38-step-02i-map-part-119.md` |
| 120 | mandatory-rereview-action-changed-from-02h | 60 | 186362 | `review-a38-step-02i-map-part-120.md` |
| 121 | mandatory-rereview-action-changed-from-02h | 31 | 118896 | `review-a38-step-02i-map-part-121.md` |

## Limits and next boundary

No consumer, target documentation, checker, gate, vocabulary, extractor, comparator, test, baseline, instruction, skill, switchboard or state file is edited. Every proposed patch remains Phase 9 only, gated by Step 3 semantic approval, A47 conservation and applicable Step 5 parity. Native/current-coordinate/adoption and installed-package evidence remain open; historical receipts are not refreshed by a static census. Full npm/ratchet and operational proof are not claimed here.

After the class-3 packet, class 4 was **started as an initial static census**: 53 committed files, 1207 edges, 59 unresolved expression cues. See [class-4 initial census](step-02i-class4-initial-census.json) and its [read-only reproducer](step-02i-class4.py). It shares the parser and committed-tree existence rules, keeps all code/projection rows behavioral and offers class-3 mappings lookup-only. Class 4 is not accepted or closed, has no A50 packet yet, and no class 5 work is started. The class-3 census's original `class 4 not started` snapshot predates this separate initial scan.

Lead accounts the real runner commit/path pairs separately under L12-11, preserving both protected Phase 6 reproduction manifests. Then Lead repeats committed-byte replay and starts independent review. Markdown previews are left to Lead; this assignment starts no service.
