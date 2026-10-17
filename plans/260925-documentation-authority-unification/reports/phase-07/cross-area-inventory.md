# Step 1 cross-area inventory

B0: `6f0f39ca14138c20d2ccb62063ccdf337cf6873a`. Machine rows: **98**.

## Counts by kind

| Kind | Rows |
|---|---:|
| a34-residual | 28 |
| candidate-citation | 5 |
| candidate-wording | 3 |
| contract-collision | 1 |
| duplicate-group | 4 |
| owner-queue-family | 13 |
| projection-staleness | 6 |
| reader-navigation-gap | 4 |
| semantic-group | 28 |
| stale-coordination-row | 6 |

## Routing coverage

All 13 owner-queue families have stable QF ids. The scoped rows include 4 duplicate groups, 28 semantic groups, 28 A34 residuals, CTR010, four navigation gaps, six stale coordination rows, eight candidate wording/citation observations and six projection-staleness observations.

A45 resolves the CTR010 collision: X-CTR010-01 records option A as resolved, and
X-DUP-01 is unparked to proceed in Step 6. X-SEM-29 and X-SEM-31 route to Step 6 with explicit references to their
overlapping duplicate rows X-DUP-04 and X-DUP-02; they are not separately resolved in
Step 2. All unrelated rows proceed. Full row fields are in
`cross-area-inventory.json`.

The architecture-manifest duplicate is keyed by its two paths,
`docs/architecture-manifest.json` and
`docs/platform/contracts/architecture-manifest.json`. Its current shared Git blob at
B0 is `2ff043edb`; the Phase 6 queue's `e6d9582dd` is recorded only as a stale historical
key and is never used as the Phase 7 group identity.

Owner-family routing uses explicit `Step N` for Phase 7 steps and `Phase N` for later
phases. QF-01 additionally carries the Phase 9 obligation to re-home X-A34-01 and
X-A34-17..X-A34-28, whose current successor is the legacy source that retires then.
The 14 DEFECT, four NAV and 13 QF rows whose present digest hashes a note id, target
path or route placeholder must bind real unit digests in the Step 9 proof.

