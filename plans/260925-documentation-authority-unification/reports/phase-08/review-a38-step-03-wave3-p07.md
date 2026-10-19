# Wave 3 part 07 semantic review

Pin ae141550c, worktree feeeeee92. 6 whole files, 12 edges, all read whole (superpowers.md, 75 KB, grepped end to end for every path-like token). Method: per-edge field extraction, pinned sources, git ls-tree/log for target facts, docs/doc-registry.json at the pin, `scripts/list-doc-anchors.mjs --check` (read-only) for the one anchor. No checker or probe scripts run.

## Per-file verdicts

| File | Set | Stratum | Edges | Verdict |
|---|---|---|---:|---|
| docs/distillery/sources/superpowers.md | batch-062 | mandatory-threshold | 0 | ok |
| docs/distillery/sources/symphony.md | batch-062 | unpatched-seeded | 6 | ok |
| docs/explanation/branch-content-mismatch-fgos-exclusion.md | batch-063 | patched-seeded | 1 | ok |
| docs/explanation/capabilities-prefer-symmetry-removed.md | batch-063 | unpatched-seeded | 1 | ok |
| docs/explanation/citation-baseline-cleanup-calibration-slice.md | batch-063 | unpatched-seeded | 2 | rework (minor, zero-diff; see D1) |
| docs/explanation/codex-bypass-executor.md | batch-063 | unpatched-seeded | 2 | ok |

### superpowers.md (0 edges)
Whole-file token scan: every path is an upstream coordinate (`docs/superpowers/specs|plans/...`, `docs/porting-to-a-new-harness.md`, `docs/testing.md`, `docs/plans/`, `skills/...`). The only fgOS path is line 13 `plans/reports/distill-superpowers-...-report.md`, not a legacy root. No `docs/specs`, `docs/architect`, `docs/how-to` etc. Zero edges and an empty legacy scan are correct.

### symphony.md (6 edges, all preserve, correct)
- 01890 (L19), 01891 (L71), 01892 (L127) `docs/contracts/harness-runtime-v1.md` / `release-manifest-v1.md`: upstream symphony "Where:" coordinates. Neither path has a tree entry or git history in fgOS (0/0), so the never-existed targetFacts are true. Preserve is right under L12-10 (dated upstream extraction, last_analyzed_commit 2f0b257).
- 01893 (L127), 01895 (L134) `docs/decisions/0008-symphony-release-layout.md`: upstream coordinate, never in fgOS tree/history. Preserve right. 01893 shares L127 with 01892, same disposition.
- 01894 (L133) `../share`: upstream runtime layout, not a doc link. Preserve right.
- Legacy-scan exclusion README.md (L134): upstream repo README, correctly excluded. `docs/SYMPHONY_SCOPE.md`, `docs/RELEASING.md`, `docs/OPTIONAL_TOOLING.md` are upstream, absent from fgOS, not legacy-root paths.

### branch-content-mismatch-fgos-exclusion.md (1 edge, patch)
- 03740 (L22) `docs/how-to/fix-fgos-write-rejected-merge-block.md` -> `docs/knowledge/how-to-fix-a-fgos-write-rejected-merge-block-on-a-fgos-chang/fix-fgos-write-rejected-merge-block.md#example-tsk-3v2-the-block-triggers-from-merging-main-in-not-from-your-own-commit`, Phase 9. Source path absent at the pin; doc-registry aliases it to that exact currentPath (L12-37(2)); file is not carriage/history. Target exists; `list-doc-anchors --check` returns ok for the anchor (heading "Example: `tsk-3v2` ..." at target L339). Adjacent description ("documented, sanctioned recovery ... restoring `.fgos/` paths to the branch's own frozen pre-merge versions, `tsk-3v2` precedent") matches target L339-372. Diff is a single whole-reference replacement in plain `path#anchor` form; hunk context matches pinned L19-25. Only one legacy reference in the file. ok.

### capabilities-prefer-symmetry-removed.md (1 edge, preserve, correct)
- 03741 (L11) `docs/history/capability-capacity-remodel/CONTEXT.md`: exists at the pin; docs/history retained (alias table has no entries). Dated decision narrative. Preserve right.

### citation-baseline-cleanup-calibration-slice.md (2 edges, preserve; one coverage gap)
- 03751 (L28), 03752 (L61) `docs/specs/work-state.md`: both completed-work/dated retrospective narrative. Preserve as historical action (L12-26(5)) is right; same disposition, no diff.
- **D1 (missed reference, zero outcome impact)**: legacy-scan candidates at L32, L38, L65 (`work-state.md`, bare) are excluded as "illustrative source artifact ... Resolved readings: ['docs/explanation/work-state.md']". That reading does not exist; the mentions are shorthand for `docs/specs/work-state.md` named at L28 ("`work-state.md`'s 425 findings", "`work-state.md`'s own entry is now empty"). L12-34(7) treats bare mentions that mean the legacy file as edges. Correction: three preserve edges (same historical-narrative reason as 03751/03752, no diff). No disposition or diff changes, so it is a record-coverage fix only; the exclusion reason is false as written.

### codex-bypass-executor.md (2 edges, preserve, correct)
- 03778 (L49) `docs/history/codex-bypass-executor/`: inside a quoted `.fgos/config.json` description snippet; directory exists at the pin (RESEARCH.md, plan.md); retained history. Preserve right.
- 03779 (L67-68, wrapped) `docs/explanation/agy-permission-denylist-not-\nallowlist.md`: joined path exists at the pin; doc-registry currentPath is that path with empty aliases, so no renamed-alias rule applies. Preserve right; wrapped span assembled correctly.

## Outcome defects
- D1 (citation-baseline-cleanup-calibration-slice.md, candidates L32/L38/L65, rule L12-34(7); fix: author three preserve edges).
- No wrong dispositions, targets, anchors, diffs or false adjacent descriptions in the other 11 edges.

## Record-text notes (not rework)
- symphony.md: 01892 uses "never existed" wording while sibling 01893 on the same line L127 uses "upstream source coordinates"; both preserve, wording differs only.
- 01894's reason frames `../share` as `docs/distillery/share` never existing; it is an upstream runtime path. Harmless.

## Lead-judgment questions
1. Is bare `work-state.md` shorthand inside dated retrospective prose (D1) an edge under L12-34(7), or a non-reference? Outcome is identical either way; downgrade to a record-text note if non-referential.

## Counts
- batch-062: reviewed 2 files (1 mandatory, 1 unpatched-seeded), 6 edges, rework 0.
- batch-063: reviewed 4 files (1 patched-seeded, 3 unpatched-seeded), 6 edges, rework 1 (unpatched-seeded stratum, D1, zero-diff). If upheld, that stratum (3 sampled) is 1/3, over the 3% bound.
- Part total: 6 files, 12 edges, rework 1 (record-coverage only).
