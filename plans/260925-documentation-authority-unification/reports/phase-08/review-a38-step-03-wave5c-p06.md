# Review a38 step-03 wave5c p06

File: `docs/transitional-switchboard.md` (119 lines, read whole at pin ae141550c). Record: batch-130.jsonl. Set batch-130, stratum: mandatory witness (patched/unpatched seeds not separately derived by me; record `reviewSet` = batch-130). Diff is empty; no author-added edges; legacyScan candidates empty.

Verdict: **rework** (3 replacement-text defects, 6 edges). Edges reviewed: 69/69 (4 preserve, 65 phase9-row-flip, 0 parked, 0 added).

## Completeness (missed references)
I walked every source line. All legacy-path occurrences (docs/specs/**, docs/architect/**, root docs) are covered: L16, L18, L34, L50 (4 edges: 3 root platform-foundations occurrences + specs projection), L51 (3), L52 (4), L53, L54 (6), L55 (4), L56-L69, L75-L88, L99, L108 (two edges), L114, L116. Occurrence counts per cell match. `docs/platform/**`, `plans/**`, `scripts/**`, `src/**` tokens are not legacy. No missed reference.

## Preserve edges (4) - ok
08389 (L16 reading-map), 08390 (L18 doc-governance), 08456 (L114), 08457 (L116): retained roots exist at pin, Related/navigation, spelling literal. Correct.

## Row flips - dispositions, units, timing ok; replacement text defects

All 65 flips: unit grouping matches source rows/items, shared reason per unit, "retained root spelling literal / no early promotion" carried. Contents checked against pin: row 77 backlog "hand-maintained, GAP-03, do not claim projection" matches L12-26(4); row 85 corrects L1-L8 to L1-L10 (true); row 62 holds the whole row until GAP-02 carry with no guessed owner (ok); rows 75-88 retained-root rows keep paths; owners for work-state/runner/distribution/packaging/host/coordination/confinement/plugin/herdr/citation-drift/distillery/observe exist at pin.

OUTCOME defects (replacement text names paths that do not exist at the pin; L12-32(3) description-vs-target truth, and the Lead flip notes saying component-boundary/system-overview rows "need a Step 3 flip value" require an actual one):

1. **maps-j-08403** (L53, row System overview, unit row-L53): replacement owner `docs/platform/system-overview.md` does not exist. Actual candidate is `docs/platform/system-overview/spec.md` (also how `docs/platform/README.md` L52 links it). Correct to `docs/platform/system-overview/spec.md`.
2. **maps-j-08433** (L66, row Skills and domainization, unit row-L66): replacement `docs/platform/domainization/README.md` does not exist. The candidate holds only `docs/platform/domainization/architecture/domainization.md` (provenance: docs/architect/domainization/README.md). Correct to that path (or park as description-rewrite if no README is intended).
3. **maps-j-08399 / 08400 / 08401 / 08402** (L52, row Whole-system architecture and component boundaries, unit row-L52): replacement retained/subordinate cell `docs/platform/component-boundary/** (exact detailed owners)` names a nonexistent tree; only `docs/platform/component-boundary.md` exists (the architect/component-boundary sources went to `docs/platform/system-architecture/**` and portal sections). Replacement must name real owners or state the carry owner without a fabricated path. Same rows must stay one shared disposition (all four edges change together).

Nothing else rework-grade. (Row 52 also says "validate A45 registry and reading-map carry" - fine.)

## Record-text notes (not rework)
- All 65 flip edges have target/anchor null, which is correct for row flips; the `Replacement:` text is the only content, so the three defects above are not caught by existence checks. Consider a record note that replacement paths are Phase 9 intent, not pinned.
- Reasons for item-L99 say "steps 3-5 together" while edge spans only step 4 (L99); unitId is advisory and the grouping is acceptable.

## Lead-judgment questions
- Pathless migration-status prose in this file has no edge: L23-25 (operative router during unification) and L41-44 (Invariant 5 "Phase status truth ... Phases 02-09 remain unauthorized"). They name no legacy path, so path-edge scope excludes them, but they are migration-state text that must change at the Phase 9 flip. Should a statusRowFlip-style carry cover them (as for root reading-map)?
- Row 67 UI specification flips to `retained | docs/ui-spec/**` while `docs/platform/ui-spec/**` candidate exists at pin; consistent with the L12-26 flip note ("docs/ui-spec stays valid"), flagged only for confirmation.
- Open lead-ruling gaps: none for batch-130 (`step-03-wave5c-lead-ruling-gaps.json`).

## Counts
- Set batch-130, this file's stratum (mandatory witness; reviewed-file denominator contributed 1): reviewed 1, rework 1 (cumulative per-set ratio depends on parts for the other two selected batch-130 files, not in p06).
- Edges: reviewed 69, outcome-defective 6 (08399-08403 and 08433 = 6 edge ids; 3 distinct defects).

Status: DONE
