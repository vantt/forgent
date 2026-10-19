# Step 3 wave 3 review, Part 06 (set batch-061)

Pin ae141550c. Records read: batch-061.jsonl. Every edge in all three files was reviewed against the whole source file. Source files read: compound-engineering-plugin.md (279 lines) and repository-harness.md (457 lines) in full for the edge regions plus a full-file path scan; beehive.md (1394 lines, 188 KB) by outline, header/provenance block (L1-45), every one of the 68 edge regions, and a full-file scan for uncovered legacy/fgOS path forms. I did not run any step-03 check or probe script. All 82 edges are `preserve`; every record has an empty diff, an empty authorAddedEdgeIds list and one legacy-scan candidate with a contextual exclusion.

## Per file

### docs/distillery/sources/beehive.md (batch-061, mandatory-threshold) - verdict ok
Edges reviewed: 68 (maps-j-01802..01869), all preserve, timing none, no diff.
- 61 edges are bee/beegog upstream coordinates: docs/specs/*, docs/history/*, docs/decisions/*, docs/backlog.md, and docs/specs/reading-map.md, onboarding.md etc. These appear in "Where:" lists of bee features, in bee `product_root` and state-layer descriptions, and in bee's own decision text. I confirmed each in context. Preserve is right under the distillery-upstream rule. The bare `system-overview.md` at L1062 c454 is bee's onboarding skeleton and its scan exclusion is true. Unit grouping is consistent: L38 (3 brace-expanded edges), L130 (4), L417, L617, L672, L722, L815, L930, L1115, L1121 each share one disposition.
- 7 edges name fgOS-owned paths, not upstream paths. The outcome (preserve) is acceptable for all seven; the record text is wrong for six of them (see record-text notes).
  - 01804-01806 (L38) and 01807 (L39): `docs/distillery/reports/distill-bee-inventory-...`. These files exist at the pin and the tree is retained in place (L12-26(3)). Preserve is correct.
  - 01845 (L910): `docs/history/fgos-coding-shaping/CONTEXT.md`. The file exists and docs/history is retained (L12-10), so preserve is correct. The sentence sits in a dated entry (v2.7.0, 2026-08-03..16).
  - 01841 (L736): "this project's own hand-maintained `docs/decisions/0000-index.md`". The path was removed at 4722361ae (corpus retired). The sentence is a dated-analysis observation, not navigation.
  - 01863 (L1123): `./repo` is forgent's workshop topology, not a legacy documentation path (inventory false positive). It is harmless as a preserve.
- No missed reference found. A full-file scan for specs/architect/decisions/how-to/explanation/reference/tutorials/history/distillery/contracts/backlog/reading-map/system-overview/platform-foundations and legacy basenames left only upstream bee paths (docs/NN-*.md, AGENTS.md, docs/knowledge/areas/*) and the excluded L1062 `system-overview.md`.
- OUTCOME defects: none.

### docs/distillery/sources/compound-engineering-plugin.md (batch-061, unpatched-seeded) - verdict ok
Edges reviewed: 6 (maps-j-01870..01875), all preserve.
- 01870-01874 (L58, L59, L64, L65): upstream EveryInc `docs/specs/*` coordinates (the plugin's per-platform specs). Correct.
- 01875 (L66 c125): the span is `docs/specs/` inside "cùng vai với docs/specs/ của forgent (BA spec đọc trước code)". This names fgOS's own tree, not upstream, so the record reason "upstream source coordinates" is false for this edge. The sentence is a role comparison in a dated index (last_analyzed_date 2026-07-17, `Seen: 32fae6c`). See Lead question Q1.
- No missed reference. `specs/learnings` at L96 is not a path at the pin (no `specs/` directory, no `learnings` path), and README.md/docs/naming.md are upstream.
- OUTCOME defects: none (01875 pending Q1).

### docs/distillery/sources/repository-harness.md (batch-061, unpatched-seeded) - verdict ok
Edges reviewed: 8 (maps-j-01882..01889), all preserve.
- 01882 and 01887 (`docs/decisions/` at L126 and L213) and 01888 and 01889 (`docs/decisions/0006-...`, `0007-...`): upstream repository-harness decision coordinates (the "decision 0019/0020", "PHASE5.md" context). Correct.
- 01883-01886: `docs/contracts/harness-orchestration-v1.md` is an upstream contract. Git history confirms the path never existed in the pin ancestry. Preserve is correct, and "never existed" is allowed because it is not carriage and not a fgOS reference.
- No missed reference. The other docs/*.md paths in the file are upstream (HARNESS.md, CONTEXT_RULES.md, ...).
- OUTCOME defects: none.

## Record-text notes (not rework)
1. beehive 01804-01807, 01841, 01845, 01863 and compound-engineering-plugin 01875 reuse the boilerplate reason "L12-10 upstream source coordinates, not fgOS documentation ownership". For these edges the referenced path is an fgOS path:
   - 01804-01807 exist at the pin and are retained in place under `docs/distillery/**`.
   - 01845 exists and docs/history is retained.
   - 01841 was removed at 4722361ae.
   - 01863 is a workshop-topology token, not a documentation path.
   - 01875 names fgOS's `docs/specs/`.
   L12-30(5) asks reasons to state the true target state. The outcomes stand, but the reasons should say "retained path exists" or "removed at 4722361ae" and "dated analysis observation".
2. repository-harness 01883-01886: the "dated learning-source/deep-dive citation" phrasing is generic (the Where: line is an undated feature entry), but the outcome is correct.

## Lead-judgment question
Q1. Present-tense fgOS-side statements inside dated distillery indexes: compound 01875 ("docs/specs/ của forgent" described as the same role), beehive 01841 ("this project's own hand-maintained docs/decisions/0000-index.md has no mechanism..."), beehive 01845 (fgOS's own fgos-coding-shaping situation), and the "forgent workshop topology" at L1123. All are preserved as dated analysis observations; each lies in an entry with a dated cursor or `Seen:` marker. L12-37(4) would instead park a live statement that names a retiring tree as an object, as a description rewrite (for 01875 the retiring tree is docs/specs/; 01841's docs/decisions/0000-index.md was already removed). I judged these as dated extraction commentary, not live navigation (L12-26(5), "distillery upstream sources are retained"), so I did not call rework. Please confirm this reading for 01875 and 01841; if you choose park, only those two edges change and their units stay single-edge.

## Counts
- batch-061 mandatory-threshold: 1 file (beehive.md) reviewed, 0 rework. 68 edges, 0 outcome defects.
- batch-061 unpatched-seeded stratum: 2 files (compound-engineering-plugin.md, repository-harness.md) reviewed, 0 rework. 14 edges, 0 outcome defects.
- Part total: 3 files / 82 edges, 0 rework (subject to Q1 for 01875 and 01841; either answer leaves the file-level verdicts ok unless you choose park).
