# Step 3 pilot round 4, group g06 (batch-040, 1 file)

Read at pin ae141550c: the complete batch-040 record for docs/specs/distillery.md (3 edges, diff, checks.coverage, descriptionTruth, anchors, relativeResolution), the complete pinned source (138 lines; whole-file grep for docs/ and .md references), the target docs/platform/system-overview/spec.md heading outline and Area Map (lines 40-53), the round-3 g06 review, and step-03-r4-changes.json (maps-j-08074 listed). A51, L12-30..L12-32 applied. Resolver, checker and probes not run.

## docs/specs/distillery.md (batch-040): ok

- Round-3 defect (08074, anchor null on a whole-file pointer): fixed. Record now has target docs/platform/system-overview/spec.md and anchor `area-map`; enclosingHeadingProof is `## Area Map`, lines 40-53, locator line 50; diff replaces the span with `docs/platform/system-overview/spec.md#area-map`. The slug matches the heading at target line 40.
- 08074 (source line 124): the claim is that the overview lists a `distillery` area entry pointing here and a separate `distill-skill` entry still marked spec-pending. Target lines 50-51 hold exactly those two entries (distillery: "spec: distillery.md (partial ...)"; distill-skill: "spec: chưa có"). Area Map is the actual claim holder, not an incidental mention. The description stays true; the descriptionTruth shippedStatus comparison is correctly "matches" and the other dimensions are correctly "not-asserted". Target line 11 says the new file is "cutover-patch-only", which the record reflects (timing Phase 9).
- 08075 (l.135 docs/distillery/porting-log.md) and 08076 (l.136 docs/distillery/state/porting/): preserve retained paths that exist at the pin; the reason states target state. Correct, unchanged in outcome.
- Whole-file scan: only lines 124, 135 and 136 carry legacy-style paths, so there are no missed edges. legacyScan candidates are empty and correctly so. The searchWitness hit group (19 hits, 2 carriage, 17 live, citation-only) is not a blocker, because this edge is a patch rather than a park.
- Defects: none.

## Lead-judgment questions
None. The round-3 question 3 is moot, since the anchor is now narrowed.

## Denominator and numerator (batch-040, my share, not pooled)
- Files reviewed 1 of 1 assigned; rework 0; ok 1.
- Edges reviewed 3 (3 original, 0 added): patch 1 (08074), preserve 2 (08075, 08076), park 0, row-flip 0. Outcome-changed edge 08074 verified.
- Round-3 defects confirmed fixed: 08074 anchor.

Status: DONE
Summary: distillery.md is ok. 08074 now anchors to `area-map`, the real holder (lines 50-51), and the description stays true. The two preserves are unchanged and correct.
