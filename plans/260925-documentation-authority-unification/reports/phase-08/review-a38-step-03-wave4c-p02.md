# Review: step-03 wave 4c, Part 02 (pin ae141550c, worktree 20d1b97da)

Method: extractor per file (all edge fields, diff), sources read whole at the pin (all files under 8 KB), targets and registry aliases verified by git cat-file and doc-registry.json. No checker/probe run.

## Per file

| # | Set | Stratum | File | Edges | Verdict |
|---|---|---|---|---:|---|
| 1 | batch-071 | patched-seeded | docs/knowledge/how-to-avoid-a-hung-verify-command-on-fgos-return-approve-ca/avoid-a-hung-verify-on-return-approve-catchup.md | 1 (04303) | ok |
| 2 | batch-071 | Part-A-outcome-change | docs/knowledge/how-to-check-a-root-item-s-progress-with-fgos-rollup/check-rollup-progress.md | 3 (04306-04308) | ok |
| 3 | batch-071 | unpatched-seeded | docs/knowledge/how-to-check-whether-a-suspected-racing-mechanism-ever-actua/check-whether-a-suspected-mechanism-ever-fired-before-fixing-it.md | 2 (04310, 04311) | ok |
| 4 | batch-072 | patched-seeded, open-lead-ruling | docs/knowledge/how-to-close-a-duplicate-superseded-or-admin-decided-work-it/handle-a-duplicate-work-item.md | 5 (04319-04323) | ok |
| 5 | batch-072 | patched-seeded | docs/knowledge/how-to-configure-a-executor-to-dispatch-via-a-named-agent-in/configure-an-executor-to-dispatch-via-a-named-agent.md | 4 (04335-04338) | ok |
| 6 | batch-072 | open-lead-ruling | docs/knowledge/how-to-find-every-caller-before-making-a-cli-flag-required/find-every-caller-before-requiring-a-cli-flag.md | 9 (04343-04351) | ok |

24 edges reviewed (preserve, parked, patch; no row-flip or added edges in this part). Outcome defects: 0. No missed references: every legacy-path occurrence found by grep in each source is covered by an edge.

## Edge-level findings

- 04303 (L164) patch, no anchor: the old how-to path does not exist at the pin, and the registry alias maps it to the exact knowledge holder (target exists). The diff replaces only the path; the adjacent description is the same document, so it stays true.
- 04306-04308: inside the explicit Document history capture section (L210+). Preserve is right under L12-39(6) and L12-40(2), because the alias holder is the consumer itself.
- 04310, 04311, 04321, 04322, 04338, 04343, 04346-04348: docs/history/** is retained (L12-10, L12-38) and the targets exist at the pin. Preserve is right. 04311 and 04338 are Related-style list items pointing at a retained root, which is correct under L12-34(4).
- 04319 (L24) preserve with a successor note. The removal fact is true (removed at 4722361ae). The note holder h-36d872fbb0e5.md has the heading "### 0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)", which matches the source file title, and the slug in the note matches that heading. See the Lead-judgment question below on preserve versus patch.
- 04320, 04345, 04353 class (04320 and 04345 here): open lead-ruling parks, treated as ruled per the assignment. Both are preserve in the L12-40 sense. Record facts are consistent with the registry (renamed at the stated commit; the holder is the consumer itself for 04320).
- 04323 patch to docs/platform/work-state/spec.md#3-work-item-data-dictionary. The anchor matches "## 3. Work Item Data Dictionary". Row 4 (status) does hold the full status domain, including wontfix and its three entry edges. The adjacent description ("Data Dictionary row #4 ... including wontfix's formal edge list") is true for the target.
- 04335-04337 patch (Related list). All three targets exist at the pin and match the registry currentPath. The descriptions (executor-aware dispatch explanation; sibling skill/function wiring how-tos) match the target titles. 04337 shares unitId item-L114 with 04336, and both are patches, so the unit is consistent.
- 04344 preserve versus 04345 park (same unit item-L75). `unitDispositionReason` is present on both. After L12-40 both resolve to preserve, so the unit is consistent. The successor note docs/platform/work-state/spec.md is right.
- 04349-04351: inside "Document history (compound-learn capture linkage)" (L118+). Preserve is right (L12-39(6), L12-40(2)). Rename commit 44106c41f is recorded.

## Record-text notes (not rework)

- 04306-04308 reason says "current retained path stays literal" and "Source path exists". It does exist at the pin, but docs/how-to/ is a retiring root whose alias holder is the consumer itself. The wording "retained" is loose; the correct basis is the Document history region plus self-alias (L12-40(2)). The disposition is unaffected.
- 04303 reason: "does not recommend blindly retrying red tests" is a generic claim. The target does not mention timeouts, which the source's adjacent description does ("whether from a real failure or a timeout"). The pointer still names the same document as before, so nothing becomes false by the move.
- 04347 and 04348 are two edges on one brace expression (CONTEXT.md and plan.md). The reasons are each correct for their own file.

## Lead-judgment questions

1. 04319 (L24): a live-class knowledge file narrates "`tsk-4fu-1` ... was superseded by `docs/decisions/0020-....md`". The author preserved it as completed evidence with a narrative-holder successor note (permitted by L12-38(3)). L12-38(1) could also let a live-class file's undated decision pointer patch to the exact heading in h-36d872fbb0e5.md#0020-.... I judged preserve acceptable because the sentence recounts a past event. Confirm that preserve-with-note is the intended class.

## Counts

- batch-071 patched-seeded: reviewed 1 file, rework 0.
- batch-071 unpatched-seeded: reviewed 1 file, rework 0.
- batch-071 Part-A-outcome-change: reviewed 1 file, rework 0.
- batch-072 patched-seeded: reviewed 2 files, rework 0 (the two files are 4 and 5 in the table above).
- batch-072 open-lead-ruling only: reviewed 1 file, rework 0. The set cannot close while 04320/04345/04353 stay `lead-ruling`.
- Part total: 6 files, 24 edges, 0 rework.

Status: DONE
