# Wave 3 Part 04 review (pin ae141550c)

Reviewer read each file whole at the pin (how-to-use-herdr 600 lines, work-item-management 429, porting-log 149; all under 100 KB, so every line read, not outline-only). Records read by field only. No check/probe scripts run. Existence facts re-verified with `git cat-file` at the pin; removed-path facts from `git show 4722361aeea`.

## Per file

| Set | File | Stratum | Edges | Verdict |
|---|---|---|---:|---|
| batch-060 | docs/distillery/deep-dives/how-to-use-herdr.md | unpatched-seeded | 2 | ok |
| batch-061 | docs/distillery/deep-dives/work-item-management.md | mandatory-threshold | 46 | ok |
| batch-061 | docs/distillery/porting-log.md | mandatory-threshold | 11 | rework (1 outcome defect) |

### 1. how-to-use-herdr.md (ok)
- 01633, 01634 (L598, same unit, both preserve): `distill-herdr-inventory-2026-07-15.md` and `docs/distillery/sources/herdr.md` both exist at the pin and are retained distillery paths. The passage is a dated coverage note ("Skimmed ... for orientation only"). Preserve is right, and the unit is consistent.
- No other legacy reference in the file. The only scan candidate (L596 `README.md`) is herdr's upstream repo root README, correctly excluded. No diff, no missed reference.

### 2. work-item-management.md (ok)
- 46/46 preserve (01643-01688), all internal relative links `../sources/{repository-harness,beads,beads-rust,beads-viewer-rust}.md#<hn-entry>`. All four source files exist at the pin and `docs/distillery` is retained, so preserve is correct. No patch is needed because the paths do not move.
- Unit check: edges sharing L27, L33, L77, L88, L100, L172, L179, L180 and L189 all preserve. Empty diff is consistent.
- Whole-file scan for other legacy forms: none. `state.md` and `routing.md` (L12, L117) are sibling deep-dives that exist. L10 "decision 0019/0020/0022" are repository-harness's upstream decisions (external coordinates, not fgOS ADRs). `docs/plans/active|completed/` is upstream layout prose. L283 `AGENTS.md` is upstream. L314 "decisions/capture/..." is an event-kind list, not a path. None need an edge.
- Anchors are not asserted by preserve edges, so no anchor check applies.

### 3. porting-log.md (rework, 1 outcome defect)
Edges 01694-01703 preserve, 01704 parked. Empty diff. Legacy scan candidates: none.

OUTCOME DEFECT
- **maps-j-01699**, L105 (row worktree-isolation-axis), `docs/decisions/0020-chan-fgos-khoi-worktree-worker.md`. Rule: L12-37(3) and L12-30(1). Disposition is preserve with "removed at 4722361 with no successor file". Problem:
  - The citation is `**... đã chốt riêng ... — xem \`docs/decisions/0020-...md\`**`. It is an undated present-tense "xem" pointer. It is appended to the 2026-07-18 delta-scan note, but the ADR it cites is dated 2026-07-28, so it postdates the dated lead and is a later live update of an open `candidate` row.
  - A live holder exists at the pin. `docs/platform/runner/decisions/h-36d872fbb0e5.md:102` has `### 0020 — Chặn \`.fgos/\` khỏi worktree worker (không khóa, không cô lập)`. The removal commit 4722361 migrated the ADR text into area specs (relates_specs: runner, work-state), so "no successor file" hides a live narrative holder.
  - Correction: patch (Phase 9) to `docs/platform/runner/decisions/h-36d872fbb0e5.md`, anchored on that 0020 heading, as L12-37(3) did for 06509. Keep "removed at 4722361" as the history fact only if the patch is not applied.
  - Confidence is moderate. Lead overrules it if the Porting Log is ruled a dated ledger throughout. See Q1.

Other edges, verified ok
- 01694 (L3 `docs/distillery/state/porting/`, exists), 01695 (L12 `docs/distillery/`, retained), 01696 (L13 `docs/history/pi-executor-runtime-capacity/RESEARCH.md`, exists, retained root): preserve correct.
- 01697 (L27 `docs/history/pr-lifecycle/reports/validation-s1-gate.md`, never existed): the path is quoted from a code comment inside a "**Sửa 2026-08-05 ...**" dated correction. A dated past-action marker is present and the reason quotes it, so L12-31(3) preserve is correct.
- 01698 (L93 `docs/history/learnings`, directory emptied at e9999863): dated 2026-07-17 scan, Đích column, retained root. Preserve is accepted.
- 01700 (L106 `./repo`): the topology prose for forgent's workshop root. Preserve is right. See record note R2.
- 01701 (L118 `docs/decisions/0021-...md`): "**Superseded by ... (2026-07-28)**" is dated historical Superseded-by framing. Preserve literal is correct (same successor holder `h-36d872fbb0e5.md:211` for a record-only note; see R1).
- 01702 and 01703 (L129): same-line unit, both preserve, consistent. See Q2 and R2.
- 01704 (L132, `docs/specs/` as "a new `docs/specs/` note" in the Đích column): parked as description-rewrite with a witness. Correct per L12-37(4). No concrete target exists because it proposes a new note.
- Missed reference: none that needs an edge. L129 bare `0000-index.md` ("dòng 30-36", "hiện tại của fgOS") sits in the dated 2026-08-17 note and shares the preserve disposition of 01702. Prose lists like `specs/learnings/distillery-index` (L94) and `skills/specs/CONTEXT.md` (L130) are area lists, not paths (L12-32(6)). Other paths in the file (`docs/research/*`, `docs/explainers/`, `docs/plans/completed/*`, `docs/tool/runbook`) are not legacy roots.

## Record-text notes (not rework)
- R1. 01699, 01701, 01702: reasons say "no successor file" and carry no non-executable successor note. A narrative holder exists for 0020 and 0021 (`docs/platform/runner/decisions/h-36d872fbb0e5.md:102`, `:211`) and `docs/decisions/index.md` for `0000-index.md`. Batch-wide this is the norm: only 1 of 56 records citing `docs/decisions/00NN` paths carries a successor note (batch-033 01266).
- R2. 01703 resolves `docs/decisions/index.md` as the retained fgOS file, but L129 reads "Index (`docs/decisions/index.md`) máy-regenerate ... complete by construction", which describes beehive's own index (external coordinate). 01700 resolves `./repo` to `docs/distillery/repo` ("never existed"), but it is forgent's workshop-layout prose. Both dispositions (preserve) are right; only the stated resolution is imprecise.

## Lead-judgment questions
- Q1. Does the Porting Log's candidate rows count as live text (L12-37(3)) or dated ledger? 01699 depends on it. If dated ledger, 01699 is ok and the file is ok.
- Q2. 01702 (L129 Đích column `docs/decisions/0000-index.md`) points to a removed hand-written index, whose generated successor is `docs/decisions/index.md`. 01704 treats the same Đích column of a candidate row as live and parks it. If the Đích column is live, 01702 would also need a park or a patch. If it is dated history (2026-08-17 scan, removal the same day), 01702 stands. I left it as ok, since all 59 other `docs/decisions/00NN` edges outside the index file are preserved.

## Counts
- batch-060 unpatched-seeded: 1 file reviewed, 0 rework (2 edges).
- batch-061 mandatory-threshold: 2 files reviewed, 1 rework (57 edges; 1 defective edge).
- Part 04 total: 3 files, 59 edges reviewed, 1 file rework, 1 outcome-defective edge (01699).
