# Step 3 wave 1 review u04: seeded sample of files without patches

Author pin `ae141550c2e022310de7a0efea757580c0b2479f`. Read-only worktree `forgentX-s8-review`. I did not run the checker or the probes. I read each source whole at the pin and each record's edges, `legacyScan` candidates, and target facts. I ran an independent grep over each source for `docs/specs`, `docs/architect`, `docs/history`, retained roots, `specs/`, `architect/`, `../../` and `<name>.md:` forms. I checked existence at the pin of every legacy source, every candidate `spec.md` successor, and the local files named in the host-invocation exclusions. I also checked `alias-table.json` (`entries: []`) and `doc-registry.json` for the two reference/explanation targets.

All 11 records have `diff: ""`, and the stated digests match the source blobs. Coverage was complete in every file: each legacy token is either an edge or a recorded exclusion, and I found no token the record missed.

## Verdicts

| File | Set | Edges | Verdict |
|---|---|---:|---|
| docs/platform/runner/README.md | batch-027 | 4 (2 inventory + 2 added) | ok on outcomes; Q1 applies to maps-j-07587 |
| docs/platform/ui-spec/README.md | batch-029 | 3 | ok |
| docs/knowledge/which-stitch-.../herdr-web-dashboard-stitch-export-to-component-map.md | batch-012 | 2 | ok |
| docs/platform/agent-confinement/README.md | batch-014 | 2 | ok on outcomes; Q1 applies to maps-j-05116 |
| docs/platform/claude-plugin/README.md | batch-017 | 2 | ok on outcomes; Q1 applies to maps-j-06612 |
| docs/platform/decision-citation-drift/README.md | batch-018 | 2 | ok on outcomes; Q1 applies to maps-j-06667 |
| docs/platform/distillery/README.md | batch-019 | 2 | ok on outcomes; Q1 applies to maps-j-06685 |
| docs/platform/herdr-web-dashboard/README.md | batch-021 | 2 | ok on outcomes; Q1 applies to maps-j-06914 |
| docs/platform/host-invocation-routing/README.md | batch-023 | 2 | ok (record-text note only) |
| docs/platform/observe/README.md | batch-024 | 2 | ok on outcomes; Q1 applies to maps-j-07197 |
| docs/reference/codebase-scatter-consolidation-roadmap.md | batch-031 | 2 | ok |

Total: 25 edges reviewed, 11 files. Confirmed outcome defects: 0. Record-text notes: 2 (below). One Lead-judgment question (Q1) covers 7 edges and affects 7 files.

## Per-file notes

**batch-027 runner/README.md** (source lines 10, 18, 23, 61)
- 07586 (L10, Provenance): preserve is correct. It is a provenance line with a blob pin.
- 07587 (L18, `Related:` list): preserve as lineage. See Q1.
- Added L23C310: this is the quoted `runner.md:<line>` locator in "A19 carriage and explicit Lead A35 note preserve ... runner.md:<line> text verbatim". It is a known-stale-text caution, not an operative read, so preserve is correct.
- Added L61C72: this is "keeps stale `runner.md:<line>` self-citations" and the same reasoning applies.
- No other legacy token. L48 names plan and ledger paths, not legacy. L66-68 `../component-boundary.md`, `../governance.md` and `../platform-foundations.md` exist under `docs/platform/` and are not legacy roots.
- Migration-state wording ("Legacy authority stays unchanged", "legacy authority retained") carries no path token, so there is no row-flip edge.

**batch-029 ui-spec/README.md** (L9, L17, L48)
- `docs/ui-spec/` exists at the pin and is explicitly retained by L12-26(3). The alias table is empty. The registry `currentPath` entries stay in place.
- 07816 (provenance), 07817 (Related) and 07818 (the "functioning compiler root remains `docs/ui-spec/`" sentence) are correctly preserved.
- Record-text note, not an outcome defect: the reason for 07816 and 07817 says "generated/** names its retained generated outputs". That is boilerplate, and the span is a plain `00-overview.md` path. It has no effect on the disposition.

**batch-012 stitch map** (L18, L23-24)
- 04607 and 04608 cite `docs/history/herdr-web-dashboard/CONTEXT.md` as the home of D16 and D17 design rationale. The file exists at the pin, and `docs/history/**` is outside the retiring `specs` and `architect` trees. No alias or move was found, so preserve is correct.
- 04608 is the wrapped span across L23 and L24, and the record handles it correctly.

**batch-014, 017, 018, 019, 021, 024** (agent-confinement, claude-plugin, decision-citation-drift, distillery, herdr-web-dashboard, observe)
- These share one shape: L9 Provenance `docs/specs/<x>.md at 111adc5...` and L17 `Related: - docs/specs/<x>.md`. Each legacy source exists at the pin. Each candidate `docs/platform/<area>/spec.md` exists.
- The L9 preserves are correct (provenance).
- The L17 `Related:` preserves are the subject of Q1.
- Nothing else in these files carries a legacy token. The `[contracts/...]`, `[decisions/...]` and `[history/...]` read-list entries are candidate-relative and not legacy.

**batch-023 host-invocation-routing/README.md**
- 06959 (L11, "Source type: Promoted from `docs/architect/host-invocation-routing/**`"): preserve is correct as source provenance. The glob token has no executable target.
  - Record-text note: the reason opens with "source path absent at author pin" but ends with "Committed root docs/architect/host-invocation-routing exists". The directory exists at the pin (6 files). The first clause should say the glob is a pattern and the directory exists. This does not affect the outcome.
- 06960 (L119, "The old documents under [../../architect/host-invocation-routing/](...) remain legacy/current sources until redirected or drained. Do not delete them in this migration pass."): `phase9-row-flip` is correct. This is a migration-state paragraph and the path is a navigation holder for the legacy-current status. The relative link resolves from `docs/platform/host-invocation-routing/` to the existing directory. The resolution search has a legitimate `partial-holder` category (54 hits, 44 live, none claiming this status sentence). The row flip applies no early diff and keeps the old directory as non-executable provenance.
- The 16 contextual exclusions (L56-59, L121, L127-130 for `vision.md`, `roadmap.md` and `intent-preservation-ledger.md`) are true. All four local candidate files exist in `docs/platform/host-invocation-routing/`, and the links are same-directory relatives.
- Not an edge, so only an observation: L60 and L61 have labels `../../../plans/...` with destinations `../../../archive/plans/...`. This is a label/destination mismatch in non-legacy navigation and is out of Step 3 scope.

**batch-031 codebase-scatter-consolidation-roadmap.md**
- 08043 (`docs/explanation/rul11-tum-lum-doctrine.md`) and 08044 (`docs/reference/dispatch-module-boundaries.md`) are both current citations of retained paths. Both exist at the pin. The registry `currentPath` still points at them and there is no alias. L12-26(3) keeps the path, so preserve is correct.
- The file contains no migration-state text.

## Lead-judgment question

**Q1. `Related:` header entries in area portals that point at the retiring legacy source (7 edges).**
- Edges: runner maps-j-07587 (L18), agent-confinement maps-j-05116, claude-plugin maps-j-06612, decision-citation-drift maps-j-06667, distillery maps-j-06685, herdr-web-dashboard maps-j-06914 and observe maps-j-07197 (each L17).
- Author disposition: preserve as "Related-header lineage", with a non-executable successor note.
- Rule tension: L12-26(8) says `Related:` lists in wrapper headers outside a Literal Snapshot are live navigation and are patched, unless the patched target is the consumer itself or already an entry of the same list. The two accepted pilot cases (07953, 01904) are the consumer-itself shape. Here the live holder `docs/platform/<area>/spec.md` is neither the consumer nor already in the list. Each list has exactly one entry, which duplicates the Provenance line at L9.
- Consequence if preserved: Phase 9 deletes `docs/specs/**` and each portal's only Related entry dangles. It would enter the Phase 9 broken-link baseline.
- Consequence if patched: `Related:` points at the area's own `spec.md` (whole-file target, anchor null). Provenance at L9 keeps the legacy spelling.
- Recommendation: rule explicitly either way and apply the same ruling to all portal records in the wave. I checked the whole wave. About 40 other `Related:` entries are preserved the same way, in batches 006, 008, 011, 013 (row-flip), 015, 016, 017 to 021, 024, 026, 028, 030, 032 and 033. A patch ruling would change records beyond u04.
- I count these as "ok pending ruling", not confirmed rework. The author's reading is defensible only if Lead treats a portal's source-pointing Related entry as provenance. If Lead rules patch, the seven files above become rework in their sets.

## Per-set counts (u04 sample only)

| Set | Files reviewed | Confirmed rework | Needs Lead ruling (Q1) |
|---|---:|---:|---:|
| batch-012 | 1 | 0 | 0 |
| batch-014 | 1 | 0 | 1 |
| batch-017 | 1 | 0 | 1 |
| batch-018 | 1 | 0 | 1 |
| batch-019 | 1 | 0 | 1 |
| batch-021 | 1 | 0 | 1 |
| batch-023 | 1 | 0 | 0 |
| batch-024 | 1 | 0 | 1 |
| batch-027 | 1 | 0 | 1 |
| batch-029 | 1 | 0 | 0 |
| batch-031 | 1 | 0 | 0 |

Elapsed review time: about 20 minutes.

Status: DONE_WITH_CONCERNS
Summary: All 11 unpatched files are semantically ok. I found 0 confirmed outcome defects and 2 record-text notes, in 029/07816-07817 and 023/06959. One systemic question, Q1, covers 7 `Related:` preserves that rule L12-26(8) may require patching to `spec.md`.
