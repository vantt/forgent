# Review a38 step-03 wave1 round 3, part p04

Author pin `ae141550c`, review worktree `471966e9e` (detached, read-only). Record line sha256 prefixes: batch-015:6 `6a0f242ed39e`, batch-025:1 `8434e33828c8`, batch-026:1 `d9f0900c6077`, batch-033:1 `3d887799c4c8`, batch-020:2 `7181e100d625`, batch-015:4 `3e90c3c5951d`. All six diffs are empty (row flips, parks and preserves carry no diff), so there is no diff hash to bind. No checker or probe was run. Only read-only git/python extraction was used.

Method: read every source whole at the pin; extracted every edge by field; resolved every Markdown link in each file (including the snapshot/carriage regions) under both the wrapper and the declared original-source coordinates and checked existence at the pin; compared the resulting retiring-root hits against the edge and exclusion lists; read the prior defect reports (x-p04, x-p07, x-p08, x-p10) and L12-30..L12-35.

## Verdicts

| File | Set | Verdict | Edges reviewed |
|---|---|---|---:|
| docs/platform/agent-coordination/history/retired-engine/README.md | batch-015 | ok | 20 (18 inventory + 2 added) |
| docs/platform/packaging-distribution/README.md | batch-025 | ok | 18 (14 + 4 added) |
| docs/platform/proposals/README.md | batch-026 | ok | 18 (3 + 15 added) |
| docs/README.md | batch-033 | ok | 15 |
| docs/platform/documentation/operations/portals/docs-portal.md | batch-020 | ok | 12 |
| docs/platform/agent-coordination/history/README.md | batch-015 | ok | 4 (2 + 2 added) |

Per-set counts: batch-015 2 reviewed / 0 rework; batch-025 1 / 0; batch-026 1 / 0; batch-033 1 / 0; batch-020 1 / 0. Total 6 files, 87 edges, 0 rework, 0 outcome defects.

## Prior defects confirmed fixed

- x-p04 D1 (wrapper `Superseded by` preserved): overruled by L12-35(3). 05744 (retired-engine/README.md L18) preserves with the non-executable successor `docs/platform/runner/spec.md`. Correct.
- x-p04 D2 (missed `../../doc-governance.md` at L147): now added edge `...retired-engine-README-L147C30`, preserve in carriage. Fixed. I re-resolved all snapshot links under both coordinates; the five retiring hits (L54, L105, L126, L147, L152) all have edges and nothing else resolves into docs/specs, docs/architect or a legacy root file.
- x-p04 record-text notes: the L337 `vision.md` reason no longer claims "tree retires"; 05747..05750 no longer state existence facts (they quote the `## Literal Snapshot` declaration).
- x-p10 (docs/README row-L31): 00009..00012 are now phase9-row-flip with the retained paths kept; both edges 00008/00018 flip with their rows. Fixed per L12-35(2).
- x-p07 (docs-portal L32 `docs/tutorials/`): 06818 is now phase9-row-flip (L12-35(2)). 06817/06823/06820/06821 flip; 06824/06825 preserve. Fixed.
- x-p08 (packaging-distribution): 07209/07210/07211 and the status-bullets unit 07212..07214 flip as one unit; 07215..07219 are carriage preserves; 07217/07218 preserve with successor notes (both successors exist at the pin). The glob notes on 07208/07216/07219 no longer name the retiring root as the successor. The four added edges (L222, L228, L247, L258) cover the links that only reach a retiring file under the original-source coordinate. Fixed.
- x-p08 (proposals/README): 07442 stays a duplicate-Related park (`phase9-carry`, witness group `carriage`, 2 hits / 0 live); 07441/07443 preserve. 15 added edges cover every leaf that resolves to an existing `docs/architect/proposals/` file under the original coordinate; the three leaves that do not exist there (L69, L71, L72) and L70 are correctly excluded or out of scope.

## Per file

1. retired-engine/README.md, ok, 20 edges. 05744 wrapper `Superseded by` preserve. 05745..05759, 05761 and the two added edges preserve inside `## Literal Snapshot` / the dated 2026-10-14 block with only the carriage declaration and a successor note, no existence claims. Edge targets, spans and successor notes are consistent with the source. Scan: every legacy token in the file is an edge; the 24 exclusions (`vision.md`, `intent-preservation-ledger.md`, `README.md` self-name) resolve to live area/retired-engine files under both readings.
2. packaging-distribution/README.md, ok, 18 edges. See the confirmation list. Link resolution (L206-373) under both coordinates found only the retiring hits that have edges (L222, L228, L247, L258, L270, L273). Related header (L13-23) is all candidate paths. No patch edges, so description truth is not in play.
3. proposals/README.md, ok, 18 edges. L24 `Source relationship` link preserves under the quoted carriage declaration. L56/L78/L81 resolve live natively and to nothing under the original base, so no edge is required.
4. docs/README.md, ok, 15 edges. Related-header and Read-First rows for retained roots (`doc-governance.md`, `reading-map.md`) preserve (L12-26(3)); rows L30/L31/L57 and the L47 Transitional Status paragraph flip. `history/` L41 preserves. No other legacy token.
5. docs-portal.md, ok, 12 edges. L9/L17 `docs/README.md` preserve (retained root). Rebased links `../../../governance.md` and `../../../README.md` are live native, no edge. Rows L31/L58 and L32 and L48 flip. L77/L78 preserve.
6. history/README.md, ok, 4 edges. 05164 Provenance preserve, 05165 L30 history-provenance sentence preserve, added L36 `brainstorms/` and L37 `implementation-records/` preserve (stated parent is the legacy history directory, which has both subdirectories at the pin).

## Record-text notes (not rework, no outcome effect)

- docs-portal 06824/06825 (L77/L78) sit in the fenced `Source Metadata (Added in candidate)` block but their reasons use the non-carriage form "Source path exists at author pin ...". If that block is literal carriage, L12-35(4) wants only the carriage declaration and no existence claim. Outcome (preserve) is the same either way.
- retired-engine 05760 (L352 `Source: docs/architect/agent-coordination/README.md at da8285e06`) is a wrapper Source/provenance line framed with the L22 retirement sentence; it would be more exact as a Source-line preserve. 05761 names `docs/platform/runner/README.md` as the successor while 05744 uses `docs/platform/runner/spec.md` for the same retiring file.
- retired-engine added L337 `vision.md` is an edge while the same basename at L100/125/175/192/238/318 is excluded as native; harmless (preserve, no diff).
- history/README 05165 successor note is the consumer's own containing directory (`docs/platform/agent-coordination/history`). It is not the consumer file or the reference's own path, so I treat it as acceptable.
- proposals/README: the "Added in candidate: Candidate collection routes" list (L63-68, L73-76) is candidate-authored navigation but is recorded as carriage preserve edges, while L69/L71/L72 in the same list are exclusions. No outcome effect (native links to live files, empty diff either way).
- 05164 and 07441 reasons carry both the long L12-26 boilerplate and a framing quote; fine.

## Lead-judgment questions

1. docs-portal L32: the row's retained-root links `[how-to/](../../../../how-to)`, `[reference/]`, `[explanation/]` (and `[user/]`) have no edges, whereas docs/README row-L31 records `how-to/`, `reference/`, `explanation/`, `docs/tutorials/` as edges. They are retained roots outside the census legacy pattern and the whole row already flips with retained paths kept literal, so there is no outcome effect. I did not count it as a missed reference. If the Lead wants uniform coverage of retained user roots, three added row-flip edges would join unit row-L32.
2. Whether the whole post-header body of history/README.md (L21-41) is literal carriage; 05165 is framed by the header `Purpose` line. Preserve is correct under either reading (history wrapper prose, L12-35(3)).

Elapsed review time: about 35 minutes.

Status: DONE
Summary: All 6 files (87 edges) are ok with no outcome defects; every earlier x-p04/x-p07/x-p08/x-p10 defect for these files is fixed under L12-35. Only record-text notes and two non-blocking Lead questions remain.
