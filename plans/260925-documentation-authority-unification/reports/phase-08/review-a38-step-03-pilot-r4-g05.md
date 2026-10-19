# Step 3 pilot round 4, semantic review g05 (batch-040: 3 files, recheck, no outcome changes)

Pin ae141550c (worktree c7b3564b1, read-only). Read: r4 request (g05 section), L12-32 rulings, round-3 g05 review, the three batch-040 records in full (all edges, diff, coverage, descriptionTruth, witnesses), and pinned source greps of all three consumer files for missed legacy references. Verified at the pin with git: the 0035 decision file history, the beegog rename, the D-ADR0030 successor heading, the h-6979005beaf7 spec headings and RUL74/RUL75 lines, and package.json "files". Did not run the checker or probes.

## Per-file verdicts

### docs/specs/platform-foundations.md (batch-040, set batch-040) : ok
Round-3 defects confirmed fixed:
- 08124 (L349, `docs/decisions/0035`): reason now says the record `docs/decisions/0035-xac-lap-ranh-gioi-su-menh-fgos.md` was added at b2444f3d2 and removed at 4270c0c0d with no successor file, narrative migrated to this spec's D-ADR0035 (GAP-02). Git confirms: A at b2444f3d2, D at 4270c0c0d, no rename. targetFacts state `removed` with the right commit. Preserve kept, quote "ban đầu định vị sống" kept.
- 08131 (L385, beegog.md): now `renamed` at dd4816c0f to `docs/distillery/sources/beehive.md` (merged with bee.md), non-executable successor note, original spelling kept as provenance. Git confirms the D of beegog.md in the merge commit; beehive.md exists at the pin.
- 08123 and 08128 (D-ADR0030): successor notes now name `docs/platform/runner/decisions/h-36d872fbb0e5.md#0030-...`; line 921 of that file is `### 0030 — Thêm bậc ưu tiên #2 "Release con người"...`. Non-executable, so no patch. Correct.

Rest unchanged and sound: 23 preserves (retained roots, retired-region self-references with region quote, illustrative `000N-*.md` pattern), no added edges. My whole-file grep finds no missed legacy or partial-root form. GAP-02 carry obligation recorded. New defects: none.

### docs/specs/decision-citation-drift.md : ok
- Round-3 defect (added edge `author-r3-docs-specs-decision-citation-drift-L26C13`, dependency boilerplate) fixed: blockedCategory and dependencyCategory are both `step5-parity`, and the dependency text matches the Step 5 CLI-default blocker.
- Parks 08062, 08064, 08066, 08068, 08070 are consistently `step5-parity` (documented scan scope moves with the real checker default). Witness category `partial-holder` with note "live mentions are not sufficient to release step5-parity" is accurate: the live hits mention the specs scope but do not hold the checker's reader/default. 08061, 08063, 08065, 08067, 08069, 08072 (docs/backlog.md retained) and 08071, 08073 (illustrative patterns) preserve correctly. Whole-file scan finds only the one added edge (the `--decisions-dir` default, line 26), accepted park under L12-32(6).
- New defects: none.

### docs/specs/distribution.md : ok
- Round-3 defects fixed: added edges L61C267 (`docs/how-to`) and L61C282 (`docs/explanation`) now carry blockedCategory = dependencyCategory = `step5-parity`, with a matching dependency. The park is substantively right: package.json "files" at the pin lists `docs/how-to`, `docs/explanation` and `docs/enduser-docs-index.json`, so it is a shipped-allowlist string, not a citation. Witness `partial-holder` is accurate.
- Patches 08078 (L67, row 5d) and 08082 (L315, RUL14): target `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md`, anchor `business-rules`. `## Business Rules` is at line 25 and RUL74/RUL75 are at lines 160/162 under it, so the anchor is the nearest enclosing heading and the target holds the claim. The diff swaps only the path token and anchor in the two lines. Descriptions stay true: "lazy-probe unlock rule" matches RUL74; RUL75 refresh-ahead/write-back matches; the row 5d remainder (host-global, never packaged, locks) is the source's own claim and not asserted about the target. descriptionTruth is recorded for both. Minor wording note, no effect: the descriptionTruth assessment text mentions the 08209 park, which belongs to another file.
- Preserves 08077, 08079-08081, 08083, 08084 verified; my scan finds no missed form (L15 is a retained packaging-distribution history path, L307 `specs/` is `fgos/agents` prose).
- New defects: none.

## Lead-judgment questions
None open. Round-3 Lead-judgment question 4 (`--decisions-dir` default) is settled by L12-32(6).

## Denominators (batch-040, g05 slice)
- Files reviewed: 3 of the 5 batch-040 round-4 files; ok 3, rework 0.
- Edges reviewed: platform-foundations 23, decision-citation-drift 14 (13 original + 1 added), distribution 10 (8 original + 2 added); 47 total, 0 defective.
- Dispositions (patch/park/row-flip/preserve): platform-foundations 0/0/0/23; decision-citation-drift 0/6/0/8; distribution 2/2/0/6.
- Round-3 defects confirmed fixed: 08124, 08131, 08123, 08128, L26C13, L61C267, L61C282.

Status: DONE
Summary: All three files are ok; every round-3 defect (08124 removed-not-never-existed, 08131 rename, 08123/08128 successor heading, and the three added-edge dependency categories) is fixed and verified against git at the pin, with no new defects.
