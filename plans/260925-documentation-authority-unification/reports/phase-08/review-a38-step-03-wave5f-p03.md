# Review a38, Step 3 wave 5f, part p03 (batch-110, 4 whole files, 111 edges)

Pin ae141550c2e022310de7a0efea757580c0b2479f, read-only worktree at 0d1fb3bff. No checker or probe was run. The only scripts were my own read-only extractors and a link resolver, in f-p03/.

## Verdicts

| File | Set / stratum | Edges | Verdict |
|---|---|---:|---|
| docs/platform/packaging-distribution/history/distribution-baseline.md | batch-110 / patched-seeded | 28 (27 inventory + 1 author-added) | ok |
| docs/platform/packaging-distribution/spec.md | batch-110 / mandatory-threshold | 27 | ok |
| docs/platform/packaging-distribution/verification/implementation-alignment.md | batch-110 / unpatched-seeded | 6 | ok |
| docs/platform/packaging-distribution/verification/source-preservation-audit.md | batch-110 / mandatory-threshold | 50 (32 inventory + 18 author-added) | ok |

Every edge of all four files was read, along with the full diff and pinned source. spec.md is 99,733 bytes and was read as an outline (headings, the front-matter and sections 1–3.1.1, the whole Retained Scope Map region around the fenced tree) plus every edge region and a full legacy-path grep. The other three files were read whole.

Record sha256 / diff sha256, from the frozen index. The empty-diff value is e3b0c442…b855.
- distribution-baseline.md: record a4cda577…e2e0, diff 8b60f9b1…bbba. The diff is a single line, Related item 1: `docs/specs/distribution.md` becomes `docs/platform/packaging-distribution/spec.md`. It matches edge 07254.
- spec.md: record 9afb20d6…860e, diff empty.
- implementation-alignment.md: record 13a1fe6a…7156, diff empty.
- source-preservation-audit.md: record e2bf5942…31fcb9, diff empty.

## Outcome defects

None. Per-edge findings:

### distribution-baseline.md
- 07251, 07252, 07253 (line 11, Source type header): preserve is correct as Source lineage under L12-47 and L12-51(1). 07252 targets a retained root file.
- 07254 (line 14, Related): patch to the whole file docs/platform/packaging-distribution/spec.md is correct under L12-34(4).
  - The live holder is a surviving file and is not already listed, so it is not a duplicate.
  - The entry is a bare reading-list item, so a null anchor is justified.
  - The diff is exactly this one line.
- 07255 (line 15, `docs/distribution-vision.md`): preserve is correct. It is a retained root path in Related, and the vision.md holder is listed separately.
- 07256 (line 17, Related, architect baseline): park as description-rewrite is correct. The promoted holder of that legacy file is this consumer, so a patch would be a self pointer. This matches L12-34(4) and L12-40(2). The search witness is consistent.
- 07257 (line 48), 07258 (line 77), 07259 (line 78), 07260 (line 79): preserve is correct.
  - These sit in a file whose header says "Document type: History / Implementation status: Historical source" (L12-51(2)).
  - Section 5 is an "Old source" table that explicitly keeps the old trace.
  - 07257 and 07259 are retained root paths. 07260 is a pattern.
- 07261 to 07272 (lines 97, 128, 154–162, 182): preserve inside literal carriage under "## Retained Distribution Baseline Source Detail" is correct.
- 07273 to 07277 (lines 222, 246, 258, 279, 300): "Added in candidate" source-unit provenance lines inside the same carriage. Preserve is correct.
- Author-added edge at line 111 (the self-link `[docs/platform/…/distribution-baseline.md](distribution-baseline.md)` in the carriage quote): preserve is correct. It is a self-label with a relative destination to the same file, and it is correctly not parked or patched.
- Missed references: none found. A grep for every legacy-root form against the source matches the edge lines exactly. The excluded candidates are only `README.md` at lines 158, 264 and 285, which are bare tokens inside carriage (L12-38(5)).

### spec.md
- 07339 (line 11): Source type header. Preserve is correct.
- 07340 (line 16, Related): park as description-rewrite (self pointer) is correct. The live holder of docs/specs/distribution.md is spec.md itself.
- 07341 (line 17): retained root path in Related. Preserve is correct.
- 07342, 07343, 07344 (lines 39, 40, 82, live Entry Points/3.1.1 prose citing "rule RUL16/RUL15 … in `docs/specs/distribution.md`"): park as description-rewrite is correct.
  - I verified the rules are in this consumer: RUL15 at line 685 and RUL16 at line 697, plus their dated entries at lines 721–722.
  - A patch to spec.md would produce a self-file redirect, so parking is the only truthful outcome.
  - The reasons name the real blocker. Line 41's pathless "distribution spec RUL17" is not an edge, which is correct under L12-49.
- 07345 to 07365 (lines 230–827): preserve inside literal carriage under the three "Retained … Source Detail" headings is correct.
  - These include the tree leaves, the `[docs/architect/workspace-topology.md](../../architect/workspace-topology.md)` link at line 441, `docs/coexistence.md`, `docs/specs/runner.md`, the history/ CONTEXT pointers and `repo/docs/architecture-manifest.json`.
  - 07346 targets a native path and is harmless inside carriage.
- Missed references: none found.
  - The link resolver was run for every Markdown link in the file, under the wrapper reading.
  - Only line 441 resolves to a retiring path, and it has an edge.
  - The 13 scan candidates are bare `README.md`, `docs/how-to`, `docs/explanation` and fenced-tree leaf names, all excluded under L12-38(5) or native precedence.

### implementation-alignment.md
- 07366, 07367 (line 53), 07368 (line 61), 07369 (line 63), 07370 (line 68), 07371 (line 75): all sit in the Evidence column of the Alignment Table. Preserve is correct under L12-25/L12-26 and L12-51(1).
  - 07369 is a retained root path.
  - The row's description and the Gap column make no claim that depends on the legacy path, so there is no false adjacent description.
- Missed references: none. `README.md` at lines 50 and 60 is excluded under native precedence.

### source-preservation-audit.md
- 07373 to 07375 (line 11): Source type header. Preserve is correct. 07375 is a pattern.
- 07376 to 07384 (lines 44–53), the Source Corpus table's Source column: preserve is correct.
  - It is the audit's own input list, so it is provenance.
  - 07377 is a retained root path.
  - Native `docs/platform/packaging-distribution/**` at line 52 is correctly not an edge.
- 07385, 07386 (lines 56, 57) and author-added L116C2 and L116C25 (migration-map.md, rewrite-plan.md): preserve is correct.
  - It is the completed P9 erratum, in the past tense, naming paths that never existed.
  - It is provenance of a past finding (L12-47, L12-51(1)), and no live pointer is created.
- 07387 to 07397 (lines 68–86, Original source column; `docs/distribution-vision.md` is retained): preserve is correct.
- 07398 (line 92, pattern) and 07399 to 07404 (lines 109–114, P9 read-through table): preserve is correct. The section is a completed-action record narrated in the past tense, plus the Original source column.
- The 14 author-added bare-basename edges in the Original source column (`scope-map.md`, `runtime-identity-and-activation.md`, `future-constraints.md`; lines 66, 68–72, 74–80, 91): preserve is correct.
  - Each resolves from the stated parent `docs/architect/packaging-distribution/`.
  - `README.md` and `vision.md` in the Current location column are correctly excluded, because native readings exist.
- Missed references: none that change an outcome. See the notes below for the one reference I could not account for.

## Record-text notes (not rework)

1. distribution-baseline.md 07273 to 07277 (lines 222–300) are inside the declared carriage (heading at line 95) but carry the live-source reason: "Source path exists at author pin … tree retires at Phase 9" plus `targetFacts`. L12-35(3–5) says carriage edges should state only "inside literal carriage (L12-26(5)); declaration: …" with no existence assertion. The outcome (preserve) is unaffected.
2. source-preservation-audit.md 07399 to 07404 say "exact legacy source names in the completed P9 removal/errata finding". The region is actually the P9 read-through table, a sibling of the erratum. The completed-action role is the same, so only the label is imprecise. No `historyRegion` object is declared on these edges, even though the completed-action reading is the justification. The checker accepts this, because the paths exist at the pin and the renamed-alias predicate does not apply.
3. In the same file, 07385 and 07386 and the two author-added edges for migration-map.md and rewrite-plan.md use the same wording. The author-added L116C2 and L116C25 record the Source-path-exists fact, although the text says these paths never existed. This is not an existence assertion, but a reader could take it as one. 07385 and 07386 carry the same sentence.

## Lead-judgment questions (none block acceptance)

1. source-preservation-audit.md lines 81 and 82: the Original source column holds a bare `history/distribution-baseline.md`, beside `docs/specs/distribution.md`.
   - Read against the stated parent, it is the legacy `docs/architect/packaging-distribution/history/distribution-baseline.md`.
   - It has no edge and is not even in the candidate list. The checker silently applied native precedence, since the same relative name exists under docs/platform/packaging-distribution/.
   - The other Original-source basenames (scope-map.md and the rest) did get edges, so the treatment is inconsistent.
   - The outcome would be preserve either way, so nothing changes. I recommend leaving it.
2. source-preservation-audit.md lines 44–53 and 109–114 describe the state of the retiring architect files in the present tense ("Historical redirect to …", "Status notes in all six current legacy architecture docs"). I judged them provenance of the audit's input corpus and of a completed P9 action, which fits the "Source/Evidence" and "history" classes. If the Lead reads them under L12-37 (live statements naming a retiring tree as an object), they would park as description-rewrite. I found no ruling that forces that for an audit's own source table. Recommend keeping preserve.
3. spec.md lines 293–313 and the other fenced-tree leaves under "docs/architect/packaging-distribution/" in the Retained Scope Map region: the leaves have no edges. They are excluded under L12-38(5) as bare names inside carriage. L12-36 pointed the other way for tree leaves, but L12-38 supersedes it for carriage. Recorded for completeness.

## Counts

- Reviewed per set and stratum:

| Set | Stratum | Reviewed | Rework |
|---|---|---:|---:|
| batch-110 | patched-seeded | 1 file (distribution-baseline.md) | 0 |
| batch-110 | unpatched-seeded | 1 file (implementation-alignment.md) | 0 |
| batch-110 | mandatory-threshold | 2 files (spec.md, source-preservation-audit.md) | 0 |

  There are no overlaps between strata in this part.
- Edges: 111 reviewed, 0 outcome defects. By outcome: 1 patch (07254), 5 parks (07256 and 07340 as self-pointer description-rewrite, 07342, 07343 and 07344 as description-rewrite), and 105 preserves.
- Part p03 totals: 4 files reviewed, 0 rework.
