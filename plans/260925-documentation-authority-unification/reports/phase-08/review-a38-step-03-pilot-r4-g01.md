# Step 3 pilot round 4, semantic review g01

Pin `ae141550c`. I read the r4 request (g01 section and checklist), A51, L12-26 and L12-30..L12-32, the round-3 g01 review, and the batch-002 record for `docs/reading-map.md`. I read the pinned source line 156, the candidate `docs/platform/herdr-web-dashboard/spec.md` (header, lines 75-85 and 236-243), the legacy `docs/specs/herdr-web-dashboard.md` (port statements at 59 and 219-220), the code default in `apps/fgos-gateway/src/gateway.rs`, and the registry entry for the layout doc. I did not run the resolver.

## docs/reading-map.md (batch-002): ok

Round-3 defects: no round-3 defects were open (verdict ok, three non-blocking wording notes). The r4 delta is only 07997 and 07998.

### maps-j-07997 and maps-j-07998: park is right

- **The mismatch is real.** The source row (line 156) says "bật mặc định, port 8788, token bắt buộc". The candidate spec says "port 4170 by default (`gateway.port` overrides it)" at lines 79-81 and 239-241.
- **The candidate is not just a carriage claim.** `gateway.rs:42` sets `DEFAULT_PORT: u16 = 4170`, so 8788 is stale in the source row and the legacy spec (which also says 8788 at lines 59 and 219-220).
- **A path-only patch would leave the row false.** A patch to the candidate spec would sit next to "port 8788", and a patch to the layout doc would sit in the same shared row.
- **The other claims on the row still match the target.** Static serving ON and mandatory token auth both hold, as the reason states. The reason names both candidate line ranges and the matching claims.
- **Both edges share one park.** This follows L12-32(3) ("same-row edges share the disposition") and matches the sibling parks 08170 and 08171 and the system-overview plugin park.
- **Category and dependency agree.** `blockedCategory` and `dependencyCategory` are both `description-rewrite`.
- **Witness categories are acceptable.**
  - The `0014` query has 45 live hits and the legacy-path queries have 20 and 1.
  - `partial-holder` fits: the hits keep the subject matter but do not repair the stale port or the row description.
  - The alias lookup for the layout doc finds a registry entry whose current path exists at the pin: `docs/knowledge/herdr-web-dashboard-layout-userflow-and-visual-language/herdr-web-dashboard-layout.md`. That target exists, which is why it was a patch in round 3. The blocker is the shared-row description, not a missing target.

### Park versus patch with a rewritten description

I confirm parking. L12-32(3) allows either option, so a rewrite would be legitimate in principle. Parking is better here for three reasons:

- The row is a long mixed-claim bullet. The same bullet also mentions `apps/fgos-gateway/`, the herdr plugin, the adapter package and the verb list. Rewriting it from the target would take one edge's patch into consumer-prose authorship that the sibling parks have all deferred to the same rewrite batch.
- It keeps the disposition aligned with 08169, 08170 and 08171 in the sibling files.
- A rewrite would need the candidate's "Implementation: Carriage only; current implementation truth is not certified" header to be resolved first. The 4170 fact is independently confirmed by code, but the candidate itself does not certify it.

A rewrite that corrects 8788 to 4170 is a valid later option once the description-rewrite batch runs. It is not a defect that it is not done now.

### Rest of the file

Edges outside 07997 and 07998 are unchanged in outcome. There is no new edge or token.

| Disposition | Count |
|---|---|
| patch | 32 |
| preserve | 32 |
| row-flip | 7 |
| parked | 26 |
| total | 97 |

Round 3 listed 34 patch and 24 parked. The change is 34 to 32 patches and 24 to 26 parks, which is exactly the two outcome changes.

## New defects

None.

## Lead-judgment questions

1. Source description drift: row 156 will keep the false "port 8788" until the description-rewrite batch. Parks are individually scoped, so this is acceptable, but the batch should rewrite all four same-row consumers together (reading-map, specs/reading-map, system-overview, and the legacy specs).

## Denominators

| Set | Files re-reviewed | Semantic rework |
|---|---|---|
| batch-002 | 1 | 0 (0%) |

Status: DONE
Summary: The park of 07997 and 07998 is correct. The 8788 port in the row is stale (candidate and code both say 4170), a path-only patch would leave the description false, and the sibling edges share the disposition. No new defects; docs/reading-map.md is ok.
