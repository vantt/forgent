# Step 3 wave 1 expansion review, part p03

Read-only worktree at 836cc0fe1, author pin ae141550c. I read every source whole with `git show <pin>:<path>` and every record via python3 (per-edge fields, scan candidates and exclusions, diff). No checker or probe was run. The target-existence checks I made were `git ls-tree` and `git show`.

| File | Set / record | Stratum | Edges | Verdict |
|---|---|---|---:|---|
| `docs/generated/README.md` | batch-011:1 | unpatched | 4 | ok |
| `docs/platform/README.md` | batch-013:1 | unpatched | 23 | rework (2 edges) |
| `docs/platform/agent-confinement/README.md` | batch-014:1 | patched | 2 | ok |
| `docs/platform/agent-coordination/README.md` | batch-015:1 | patched | 3 | ok (earlier defect fixed) |
| `docs/platform/agent-coordination/architecture/README.md` | batch-015:2 | patched | 3 | ok |
| `docs/platform/agent-coordination/decisions/README.md` | batch-015:3 | patched | 1 | ok |

Per-set counts: batch-011 1 reviewed, 0 rework. batch-013 1 reviewed, 1 rework. batch-014 1 reviewed, 0 rework. batch-015 3 reviewed, 0 rework. Total 6 reviewed, 1 rework.

## 1. docs/generated/README.md (batch-011:1) ok

All 4 edges reviewed (empty diff).
- 03978 (L16, Related `docs/doc-governance.md`): preserve. This is a retained root authority (owner-answers L12-26(3) lists it) and the target survives Phase 9. Correct under L12-34(4).
- 03979 (L27, `docs/doc-registry.md`): preserve. The file exists at the pin, outside the retiring trees. `docs/doc-registry.md` and `docs/doc-registry.json` are named as retained by the Phase 6 area maps.
- 03980 (L29, `docs/decisions/index.md`): preserve. Phase 6 judgment N1 keeps it as a generated projection and not a retiring root (phase-06 line 71 and line 102).
- 03981 (L31, `docs/ui-spec/generated/**`): preserve. It is a pattern for the retained generated outputs, and the committed directory exists at the pin.
- Missed references: none. `docs/templates/generated.md` (Related, L17), `docs/doc-registry.json` and `docs/enduser-docs-index.json` all exist and are not legacy-tree paths. The empty `legacyScan.candidates` list is true.

Record-text notes: none.

## 2. docs/platform/README.md (batch-013:1) rework

All 23 edges reviewed (empty diff). I read the whole 111-line source and checked all 18 scan exclusions. They are all candidate filenames inside `docs/platform/`, such as `vision.md` and `platform-foundations.md`, and the exclusions are right.

Correct:
- 05092 (L16) and 05093 (L18): Related preserves of `docs/doc-governance.md` and `docs/reading-map.md`. Both are retained roots. L17 `docs/transitional-switchboard.md` is also retained and is not a legacy edge.
- 05114 (L103, `../reading-map.md`): preserve, consistent with 05093.
- 05094..05111 (L32-37, L45-48, L50, L63): `phase9-row-flip` across the "Current source during migration" tables. The rows are consistent units, all edges in a row share one disposition, and `unitId` is `row-Lnn`.
  - Per L12-34(3), retained roots inside the row (`../platform-foundations.md`, `../routing-handoff-contract.md`, `../distribution-vision.md`, `../contracts/`, `../ui-spec/`, and the live-until-Phase-9 `../architecture-map.md`) keep their paths, and only the row status flips.
  - Retiring `docs/specs/*` and `docs/architect/*` cells flip with the row.
  - L33, L36, L47, L48, L50 and L45/L46 together cover every retiring path in these tables.
  - `plans/...`, `archive/plans/...`, `../../domains/` and the `skills` render paths are not legacy-tree references.

Outcome defect (wrong disposition and false reason text):
- **05112 (L70) and 05113 (L71)**, the two `docs/doc-governance.md` cells in the **Decision Surface** table (`Status | Question | Where`):
  - Both are recorded as `phase9-row-flip` with the reason "Current source during migration table: the whole row must be flipped at Phase 9, retiring source cells become prior-source provenance...". That description is false for these rows. L70 and L71 are Settled decision rows whose Where cell points to a **retained root authority**. The table is not a "Current source during migration" table and no source cell retires.
  - `docs/doc-governance.md` is retained in place. Owner-answers line 262 (L12-26(3)) lists it with `docs/platform-foundations.md` and `docs/routing-handoff-contract.md` as root authorities that stay unless a Phase 6 alias retires them. This file's own Related edge 05092 preserves the same path, and no alias exists.
  - Rule: L12-26(3) retained root preserves, and L12-34(3) says retained roots in status units keep their paths.
  - Correction: change both to `preserve`, timing none, reason "retained root docs/doc-governance.md exists at author pin; Where pointer of a Settled decision row survives Phase 9". If Lead wants these rows flipped, the reason must name the real status change, because nothing in the rows has a status to flip.

Lead-judgment question: is a Decision Surface "Where" cell that points to a retained root a status unit that flips, or plain navigation that preserves? I read it as plain navigation. If Lead rules it flips, 05112/05113 stay but their reason text must be rewritten, so the file is still rework for record text.

Record-text notes: the 05114 reason is the generic L12-26 boilerplate. It is acceptable, but the "where framed" clause adds nothing for a Related Files table row.

## 3. docs/platform/agent-confinement/README.md (batch-014:1) ok

2 edges reviewed and the 1-hunk diff checked.
- 05115 (L9, Provenance `docs/specs/confinement-authority.md at 111adc51...`): preserve as provenance. The successor note names `docs/platform/agent-confinement/spec.md`, which is not the edge's own path. This is correct under L12-34(4), because Provenance is lineage.
- 05116 (L17, Related): patch to `docs/platform/agent-confinement/spec.md`, timing Phase 9, whole-file.
  - The target exists and is the live area spec. Its header carries "Candidate; carriage" framing, but it is the area's own spec file and not a snapshot-carriage doc.
  - The Related list does not already contain the target, so there is no duplicate.
  - The diff is exactly one line.
- Missed references: none. `plans/...` and `docs/platform/component-boundary.md` are not legacy.

## 4. docs/platform/agent-coordination/README.md (batch-015:1) ok (earlier defect fixed)

3 edges and the 2-hunk diff reviewed.
- 05129 (L16, Related `docs/specs/runner.md`): now **patch** to `docs/platform/runner/spec.md`, Phase 9, whole-file. This confirms the earlier review defect is fixed. The Related list does not already name it, and the diff has the matching hunk. It also agrees with L31, which already links `../runner/spec.md`.
- 05130 (L33, decision 0062): patch to `docs/platform/runner/decisions/h-36d872fbb0e5.md`, anchor at the `### 0062 — ...` heading (line 1716 at the pin). The heading exists, and the adjacent description (date 2026-10-14, removed doors `dispatch execute` in all forms, `dispatch log` and `dispatch fanout-batch`, replacement by `fgos run` and `fgos workflow start`) matches decision 0062 lines 1718-1721. The diff inlines the extractor slug.
- 05131 (L62, `verification/README.md`): preserve. The file exists at `docs/platform/agent-coordination/verification/README.md` and is not under a retiring tree.
- Missed references: none. The only scan candidate, `vision.md` at L65, is local and correctly excluded.

Record-text notes: none.

## 5. docs/platform/agent-coordination/architecture/README.md (batch-015:2) ok

3 edges and the 1-hunk diff reviewed.
- 05132 (L17, Related `docs/specs/runner.md`): patch to `docs/platform/runner/spec.md`. The target is a live whole-file holder, and the diff matches.
- 05133 (L28, `docs/architect/agent-coordination/architecture/`): preserve. This is "This directory has been promoted from ..." migration-origin lineage, so provenance and not navigation. The directory exists at the pin and the tree retires.
- 05134 (L76, `../contracts/assignment-run-runresult.md#run-phases-and-admission`): preserve. It is a native candidate-relative link into this area's own `contracts/`, and the current candidate path is not assigned a legacy owner.
- Missed references: none. The scan candidates are local filenames, and the `../history/retired-engine/files/**` links are candidate carriage copies, not legacy trees.

Record-text note (does not count as rework): the 05133 reason quotes two source phrases, "This directory has been promoted from" and "preserves the proposal frontier from". The second phrase does not occur in this file. The first is accurate, so the reason should quote only that.

## 6. docs/platform/agent-coordination/decisions/README.md (batch-015:3) ok

1 edge and the 1-hunk diff reviewed.
- 05163 (L17, Related `docs/specs/runner.md`): patch to `docs/platform/runner/spec.md`. This is consistent with the two sibling portals above.
- The L27 phrase "frozen legacy decision tree" has no path token, so no edge is owed. The ADR-nnn links are local candidates and are correctly excluded.

## Summary

- Rework: only `docs/platform/README.md`, edges 05112 and 05113 (wrong disposition and false unit reason), plus one Lead question on the status-unit reading.
- The earlier p03 defect on `docs/platform/agent-coordination/README.md` (05129) is confirmed fixed.
- Record-text note: the 05133 reason quotes a phrase absent from the source.

Status: DONE_WITH_CONCERNS
Summary: Reviewed all 36 edges across 6 files. 5 files are ok, and `docs/platform/README.md` needs rework on 2 edges (05112/05113, Decision Surface doc-governance cells wrongly row-flipped instead of preserved).
