# Review a38 step-03 wave 2, Part 03

Pin: ae141550c2e022310de7a0efea757580c0b2479f (worktree 526f87468, read-only). Method: each assigned consumer read whole via `git show <pin>:<file>` (doctrine 1542 lines read in chunks plus a grep of every path/basename/relative-link token; harness 495 lines; coordinator prompt 44 lines; skill-package-distribution 212 lines, header plus a grep of every docs/ token). Records loaded with python3 (per-edge fields, full diff, every legacy-scan candidate). No checker/probe run. I did not hash the records or diffs; the python extractor showed the whole diff text for each file. Pinned targets checked for existence: docs/platform/runner/spec.md, docs/platform/runner/decisions/h-36d872fbb0e5.md, h-aabefc85f0c9.md, playbooks/prompts/master-coordinator.md, the retired-engine step-07 snapshot, and the domainization carriage file.

## Per-file verdicts

| File | Set / stratum | Edges | Verdict |
|---|---|---:|---|
| docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md | batch-038, patched-seeded + mandatory-threshold | 2 (06499, 06500) | ok (record-text note N1) |
| docs/platform/agent-coordination/playbooks/coordination-operating-harness.md | batch-038, patched-seeded | 6 (06501-06506) | ok (Lead question Q1) |
| docs/platform/agent-coordination/playbooks/prompts/architecture-advisory-coordinator.md | batch-038, unpatched-seeded | 3 (06507-06509) | **rework** (maps-j-06509) |
| docs/platform/packaging-distribution/contracts/skill-package-distribution.md | batch-039, unpatched-seeded | 1 (07250) | ok |

## Outcome defects (required rework)

### D1. architecture-advisory-coordinator.md, maps-j-06509, source L39-40

- Passage: "Upstream removed the raw `dispatch execute` door (decision 0062 in `docs/specs/runner.md`)." It sits under the live section "Upstream Execution Door Transition", not under the "Historical Manual Prompt" wrapper.
- Recorded as: preserve, timing none, with the boilerplate "dated retirement/removed-door framing ... successor note h-36d872fbb0e5.md".
- Problem: the passage is a live decision-locator citation, not history framing. It carries no date or past-action marker; the reason quotes none. The sentence is a pointer into a retiring tree whose live holder exists at the pin: `docs/platform/runner/decisions/h-36d872fbb0e5.md`, heading `### 0062 — Xoá cửa thô; dispatch là tầng thấp; ...` (file line 1716).
- Rules: L12-30(1)(c) (live hit outside carriage is the target; patch, Phase 9) and L12-30(3) (same-kind edges get the same disposition). The wave-2 focus rule applies (live navigation pointer to a retiring tree must be patched). Evidence that the same kind of edge is patched elsewhere: maps-j-05130 (`agent-coordination/README.md` L33, "decision 0062 trong docs/specs/runner.md") is patched to `docs/platform/runner/decisions/h-36d872fbb0e5.md` with anchor `0062-xoá-cửa-thô-...`. Preserving L40 is inconsistent with that edge. The README passage has a dated "(2026-10-14" marker, which this one lacks.
- Correction: patch L40 `docs/specs/runner.md` to `docs/platform/runner/decisions/h-36d872fbb0e5.md`, anchor the 0062 heading (same anchor as 05130), Phase 9, with the diff hunk. The adjacent description is the door removal that 0062 states, so the description stays true. Alternative if the Lead rules this a history sentence: keep preserve but quote a real dated marker; none exists in the passage.

## Record-text notes (do not count as rework)

- N1. Doctrine maps-j-06500 (L29) and coordinator maps-j-06508 (L35) are correctly preserved, since both sit in history framing ("The former engine was retired in 2180b4e...; see ... historical CoordinationSession section").
  - The non-executable successor note names `docs/platform/runner/decisions/h-36d872fbb0e5.md`. The section they cite is "CoordinationSession (Lịch sử — đã thu hồi per P4 ...)", which at the pin lives in `docs/platform/runner/decisions/h-aabefc85f0c9.md` (heading at file line 25). The h-36d872 file contains no CoordinationSession section and no `2180b4e72`.
  - Wave-1 batch-015 records for the identical phrase (e.g. maps-j-05768) name h-aabefc85f0c9.md. The note should be h-aabefc85f0c9.md.
  - The reasons also quote "removed ... decision 0062", which is not on these lines (only boilerplate). The same wrong holder appears in the other 038 records (21 uses in batch-038), so it is likely a batch-wide boilerplate fix.
- N2. coordination-operating-harness 06502 reason says "Source path exists ... docs/architect" (accurate at the pin). It does not say that the sentence's "frozen" tree is deleted at Phase 9 (see Q1).

## Lead-judgment questions

- Q1. Harness maps-j-06502, L33: "write evidence under the current platform `verification/<track>/` owner, not the frozen `docs/architect/` tree". It is preserved as a historical contrast. This is accepted (negative contrast, not a read instruction, and the writer destination is already the live root), but after Phase 9 deletion the sentence names a tree that no longer exists. Confirm that the preserve (with the L12-35(3) successor-note style naming the live verification owner) is acceptable, or park it as description-rewrite for the step-10 semantic-remnant search.
- Q2. D1: if the Lead rules that "Upstream removed ..." is history framing, then maps-j-06509 is ok and the successor note must follow N1.

## Edge-by-edge summary (all 12 edges reviewed)

- 06499 (doctrine L17, Related `docs/specs/runner.md`): patch to `docs/platform/runner/spec.md`, whole-file, Phase 9. Related header, live target exists, no section claim in the entry. ok. Diff hunk matches.
- 06500: preserve as history, N1.
- 06501 (harness L17): patch, same as 06499. ok. Diff hunk matches.
- 06502: preserve, Q1.
- 06503-06506 (harness L125, L421, L474, L475): `docs/platform/agent-coordination/verification/<...>` illustrative patterns under an existing committed live directory (README plus track dirs exist at the pin). Preserve is correct; no authority flip. ok.
- 06507 (coordinator L9, Provenance "Retained from docs/architect/...@fcfe78c"): preserve as lineage. ok.
- 06508 (coordinator L35): preserve as history, N1.
- 06509: D1.
- 07250 (skill-package-distribution L16, Related `docs/architect/domainization/README.md`): parked, phase9-carry. Verified at the pin: `docs/platform/domainization/` holds only `architecture/domainization.md`, which declares "Source snapshot retained" (carriage, not a patch target per L12-34(6)/L12-30(3)); no README/spec.md exists; no alias in the alias table or doc-registry. The same target is parked identically in maps-j-08015 and maps-j-08188 (consistent). Category and blocker are specific. ok.
- Scan candidates: doctrine's 12 and harness's 12 excluded hits are bare illustrative manual-artifact filenames (scout-report.md, index.md, current-cell.md ...) that resolve to no retiring path from the consumer, area or snapshot coordinates. Exclusions are acceptable (L12-30(4)). Partial forms such as `proposals/system-shaper.md` are labelled optional manual artifact names. The harness `test/architect/coordination-trace.test.mjs` is a test path, not a docs tree, and is absent at the pin; not an edge.
- No generated render surface and no shipped external-project convention in this part.

## Per-set / per-stratum counts

| Set | Stratum | Files reviewed | Rework |
|---|---|---:|---:|
| batch-038 | patched-seeded (doctrine, harness) | 2 | 0 |
| batch-038 | mandatory-threshold (doctrine; overlaps patched-seeded) | 1 | 0 |
| batch-038 | unpatched-seeded (coordinator prompt) | 1 | 1 |
| batch-039 | unpatched-seeded (skill-package-distribution) | 1 | 0 |

Unpatched-seeded 038: 1/1 rework, which breaches the 3% gate for that stratum (expansion per L12-34(1) is the Lead's call). 039: 0/1. Part totals: 4 files reviewed, 1 rework, 12 edges reviewed, 1 outcome defect.

Status: DONE
Summary: Three of four files are ok; the coordinator prompt needs rework because maps-j-06509 (L40, decision 0062 citation) is preserved but should patch to the live 0062 heading, as the same-kind maps-j-05130 does. A record-text note flags the wrong successor holder (h-36d872fbb0e5 vs h-aabefc85f0c9) on 06500 and 06508.
