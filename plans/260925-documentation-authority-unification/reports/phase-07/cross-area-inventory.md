# Step 1 cross-area inventory

B0: `6f0f39ca14138c20d2ccb62063ccdf337cf6873a`. B0 rows: **98**; with the L11-15 supplement: **108**.

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


## L11-15 main-import supplement

Main `0d6da9033` merged at `21555f026`. Ten added rows are a post-B0 supplement, not a rerun or rewrite of the accepted Step 1 derivation. All eight imported identity-scope paths ride the Step 9 native carry. Native ids above remain pending; `report-path:` identifies a report binding only.

| Row | Authority kind | Statement / source | Route |
|---|---|---|---|
| X-MAIN-01 | specification | `docs/platform/holder-lock/spec.md` — Holder-lock owns kernel resource exclusion, cold-lock registry and its internal routes; hot state/main-checkout remain next-track work. | Step 5; Step 6; Step 9 |
| X-MAIN-02 | specification | `docs/platform/process/spec.md` — Process owns tuple facts and identity-safe control; unsupported domain kinds stay Unknown/Refused. | Step 5; Step 6; Step 9 |
| X-MAIN-03 | architecture | `docs/platform/component-boundary.md` — Merge adds Process L0 and Holder-lock L1 and their routes, preserving the candidate Observe route and carriage. | Step 5; Step 6; Step 9 |
| X-LOCK-01 | architecture | `docs/platform/holder-lock/spec.md` — Holder-lock depends on Process facts/control; kernel exclusion never becomes a PID/TTL takeover decision. | Step 5; Step 6; Step 9 |
| X-LOCK-02 | architecture | `docs/platform/holder-lock/spec.md` — Writer identity supplies attribution, never lock authority; holder-lock has no session-identity dependency. | Step 5; Step 6; Step 9 |
| X-LOCK-03 | contract | `docs/platform/holder-lock/spec.md` — Node facade hands one inherited description through versioned internal lock-fd routes; callers see an opaque handle. | Step 5; Step 6; Step 9 |
| X-LOCK-04 | contract | `docs/platform/holder-lock/spec.md` — Cold-lock names, rank, scope, paths and fences come from one registry; main-checkout/hot-state are not cut over in this track. | Step 5; Step 6; Step 9 |
| X-LOCK-05 | specification | `docs/platform/holder-lock/spec.md` — Setup/doctor owns discoverability of lock defaults, directories, fences and probes; activation validation gates release readiness. | Step 5; Step 6; Step 9 |
| X-LOCK-06 | contract | `docs/platform/process/spec.md` — Process judge and Node leaf use shared judge vectors; no PID means unknown, zombie means dead, unseen namespace remains unknown. | Step 5; Step 6; Step 9 |
| X-LOCK-07 | specification | `docs/platform/process/spec.md` — Only linux-gate domain primitives ship; Windows/macOS domains and full containment/gate primitives remain run-supervisor work. | Step 5; Step 6; Step 9 |

## Closing corrections

L11-23..26 supersede the X-MAIN-01/X-LOCK-04 next-track main-checkout wording: main-checkout is cut over; hot-state alone is pending, and the main-authored header refresh routes to Phase 9 main-import. X-LOCK-05 conservation is resolved at packaging-distribution/spec.md:530-533. Current scoped statements, file digests and evidence spans are in the machine inventory and alignment rows.
