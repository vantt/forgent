# Review a38 step-05 seam 5 judgment files, part p04

Worktree read-only at 31791c7eb, records pinned at 5eb9dc609. Payload: s4-src-p04.json (15 files, 171 items: 40 references, 131 dynamic tuples). No check, probe or script from the plan was run.

## Per-file verdicts

| File | Verdict | Items |
|---|---|---|
| test/cli/fgos-intake-6.test.mjs | ok (label note N1) | 2 |
| test/cli/fgos-intake-7.test.mjs | ok (N1) | 1 |
| test/cli/fgos-read-2.test.mjs | ok (N1) | 2 |
| test/cli/fgos-read-5.test.mjs | ok (N1, N5) | 2 |
| test/state/domain-fields.test.mjs | ok (N1, N2) | 7 |
| test/state/compound-learn-done-gate.test.mjs | ok (N3) | 9 |
| test/state/status-category.test.mjs | ok (N3) | 11 |
| test/state/working-tree-clean-unified.test.mjs | ok (N6) | 32 |
| test/state/fsm.test.mjs | ok (N3) | 11 |
| test/runner/dispatch-worker-session.test.mjs | **rework** (D1) | 5 |
| test/runner/codex-cli-glm-cli-live-executors.test.mjs | ok (N1, N7) | 12 |
| test/setup/dir-resolution.test.mjs | ok (N1) | 21 |
| test/setup/uninstall-wiring.test.mjs | ok (N1) | 14 |
| test/docs/rul104-anchor-phrase.test.mjs | ok (N8) | 6 |
| test/docs/decisions-corpus-retired.test.mjs | ok (N4, N9, Q1, Q2) | 36 |

## OUTCOME defects

**D1. test/runner/dispatch-worker-session.test.mjs, reference-004380, source line 15 (rule R8).**
The comment (lines 11-18) points at `docs/architect/agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/` as where the live probes are proved. That is a module-header navigation pointer. A live holder exists at the pin and is byte-identical (`diff -rq` against `docs/platform/agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/` is empty). The record is REJECT/comment-or-type/preserve, resting on "dated provenance even where the tree retires".

R8 and the p32/p36 precedents say a module-header pointer with a live holder is a patch. Correction: make it ADMIT and patch the comment path to the docs/platform holder, source-only with a full forward and inverse diff. Alternatively the Lead can rule that a dated proof citation stays preserve. The record then needs an explicit "tree retires" witness, and the live-holder fact must be recorded.

No other outcome defects. Verified for the other files:
- **Admission:** every REJECT names a use that is true. They are tmpdir, mkdtemp, repo-root, `.fgos`, `.githooks` and `.husky` plumbing, text and label joins, comments, and the test-owned `rul104-law.txt` fixture. No rejected tuple constructs or reads a document path.
- **Admits:** every admitted `pathOperand` really yields a document path (`path.join(REPO_ROOT,'docs','decisions')`, the `0000-index.md` probe, `AGENTS.md`, the NARRATIVE_TARGETS reads, the rul104 spec path).
- **Same line or passage:** all agree.
- **Preserves:** none rests on a "retained" witness for a docs/specs or docs/architect target. The docs/specs comment pointers (004029, 004043) carry `treeRetires:true`. The docs/architect pointers 005220, 005292 and 005239-41 point to `docs/platform/proposals/doing-coordination-redesign.md`, which is self-declared non-canonical, so they are not a live holder (L12-74 p20 precedent). Preserve is right.

## decisions-corpus-retired.test.mjs, checked in depth

- **Patches (004033 line 47, 004037 line 49, 004046 and dynamic-018741 line 78).**
  - The diff touches only those three lines, on a source test file.
  - The inverse restores the original exactly.
  - The targets exist and hold the required content.
    - The runner holder `docs/platform/runner/decisions/h-36d872fbb0e5.md` has the same `### 00NN ` heading set as `docs/specs/runner.md`, `### 0032 — Cổng Iron Law`, and exactly one `## Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)` line.
    - `docs/platform/system-overview/spec.md` has headings 0016 and 0018 and exactly one marker line.
  - All three assertions (lines 68, 80, 87) would still hold with the new targets.
- **Parks, each blocker true and passage-specific.**
  - 004034: the work-state holder `retired-decision-history.md` has numbered `## N. ADR 00NN` sections with `### 0002 Context`-style subheadings, no `### NNNN — title` headings, and `### 0032 Foundation Architecture`.
  - 004047 and dynamic-018742: no `### 0032 — Multi-role Team Harness`; the topic is `## 13. ADR 0032 Multi-Role Team Harness`.
  - 004040: `docs/platform/platform-foundations.md` has no `### 0001` or other foundational ADR inventory. I found no other holder under docs/platform for the 0001, 0009 and 0014 narratives.
  - 004048 and dynamic-018743: the work-state holder has 0 markers and the foundations anchor has none.
  - dynamic-018738: the line-68 map read follows the same members.
- **Admits and preserves.** The 004030/004041/004039 decision-directory comments, the `docs/decisions` DECISIONS_DIR reads, the 0000-index negative probe, and the AGENTS.md read and regex are all fine. docs/decisions keeps `index.md`; AGENTS.md is retained.

## Record-text notes (labels only, no outcome change)

- **N1. R16 uniformity.** L12-74 R16 says "comment pointers into docs/history => admit/preserve uniformly".
  - The payload rejects them as comment-or-type: 003963, 003990, 003992, 005236, 004369, 004370, 005183, 005205.
  - It admits 003961 and 003962, which are real synthetic docsRef values, with `treeRetires:false`.
  - The preserve outcome is the same either way, so under R10 this is a label-level flip. Flip the rejects to ADMIT/preserve for uniformity.
- **N2. domain-fields.test.mjs lines 1-3.** The comment cites the retired file `docs/decisions/0027-domain-so-huu-status-doan-truoc-delivered-supersede-base-workflow-model-d1-d3.md`, wrapped across lines, so the census captured only reference-005236 (docs/history). The record has no item for the retired decision file and no `successorNote` (R8, L12-39(3)). The outcome (preserve) is unchanged. Add a source slot or successorNote to the ADR0027 holder.
- **N3. docs/architect comment pointers** (005220, 005292, 005239-41 and the others). The "tree retires" statement is only in the reason text, not a `resolverWitness` with `treeRetires:true` as on 004029 and 004043. This is cosmetic.
- **N4. decisions-corpus-retired.test.mjs.**
  - 004030, 004039 and 004041 (docs/decisions comment pointers) and 004036 (docs/architecture-map.md) reuse the reason text "the docs/specs tree retires at Phase 9". That is false for those targets, and the witnesses correctly say `treeRetires:false`.
  - Dynamic-018736, the `0000-index.md` existence probe at line 59, has no `successorNote`. L12-74 p07 precedent gives that basename `docs/decisions/index.md`; only the line-58 title label (004038) has one.
  - The patch reasons do not name the diagnostic output delta. The line-74 and line-88 assertion messages interpolate the changed paths and only print on failure.
- **N5. fgos-read-5.test.mjs.** The dynamic-017664 reason is a copy of the citation reason. The comment at line 239 mentions "AGENTS.md's tsk-56u", a prose mention with no item; harmless.
- **N6. working-tree-clean-unified.test.mjs, dynamic-038834.** The reason says the test declaration was "removed before this author pin". The title `isWorkingTreeClean scope:'whole-repo' (the default, unchanged)…` is present at line 50 at the pin. The reject is correct but the text is wrong.
- **N7. codex-cli-glm-cli-live-executors.test.mjs.** dynamic-023712 is labelled `state-event-store` for `.fgos/secrets.local.env` (a secrets file, not an event store). dynamic-023714 (`${GLM_OPENROUTER_API_KEY}`) is labelled comment-or-type. Neither is a document, so the rejects stand.
- **N8. rul104-anchor-phrase.test.mjs.**
  - The park is correct and specific. `RUL104` appears only in docs/specs, `AGENTS.md`, the test and its fixture, and `docs/platform/intent-preservation-ledger.md` (a mention, not the law). The `docs/platform/platform-foundations.md` holder lacks it.
  - Line 22 is an assertion diagnostic naming the fixed literal `AGENTS.md` (dynamic-018751, rejected as text-label-join). Under R6 that could be an admit, but the target is retained, so it is label-level.
  - The two author-added slots (rul104-law.txt locator and the test self-locator) are correctly REJECT/preserve.
- **N9. Patch target status.** The patched holders carry "Design status: Candidate / Canonical: No". The same holder is already the successor target in 005311, so this is consistent with the Step 4 precedent (see Q1).

## Lead-judgment questions

- **Q1.** Is a Candidate / Canonical: No carriage file (`h-36d872fbb0e5.md`, `docs/platform/system-overview/spec.md`) acceptable as the "live holder" for patches 004033, 004037 and 004046? The Step 4 successorNote precedent and L12-30(3) say yes. L12-74 p20 refused `docs/platform/proposals` carriers as non-canonical. The patch assumes Phase 9 promotion keeps the heading and marker bytes.
- **Q2.** decisions-corpus-retired.test.mjs line 48 (004035) preserves the real read of root `docs/architecture-map.md`.
  - That file is the sole holder of the `### 0010`, `### 0015` and `### 0017` headings the 34-id scan needs, plus a level-two marker.
  - The promoted `docs/platform/architecture-map.md` has only a `####` marker and no `###` ADR headings.
  - The Phase 6 draft alias set proposes moving the root file to `docs/platform/architecture-map.md`, but L12-60 item 7 says it stays live until Phase 9. If Phase 9 moves it, this preserve becomes a break. Confirm the root is retained, or park the item.

## Counts

- 15 files, 171 items reviewed.
- Mechanical rejects (tmpdir, root, `.fgos`, `.githooks`, label joins and similar, about 120 of the 131 dynamic tuples) were spot-verified against their windows and are plausible. They are checker-verified, so I did no per-item re-derivation.
- Outcome defects: 1 (D1). Record-text notes: 9 (N1-N9). Lead questions: 2.
- Parks: 5 (dynamic-018749; 004034, 004040, 004047/018742, 004048). Patches: 4 items across 3 passages.
- The one diff (decisions-corpus-retired.test.mjs) is on a source file, changes only admitted passages and has an exact inverse. Hashes, apply and rollback were not recomputed.
