# Review a38 - Step 4 wave 1 part 06 (set step04-006)

Pin: author input ef62747dd. Reviewer read-only; no checker, probe, resolver or author script run. Source read whole through EOF from the pin (3 files: 58, 280 and 122 lines). Stratum: unpatched (empty-diff) sample; no patch, no render path, no sourceRenderProvenance in this part.

## Per file

1. `archive/plans/260911-2305-runtime-recovery/reports/phase-00-baseline-report.md` - verdict **ok**. 1 slot.
   - evidence-097 L32 (S0-6 table row, `docs/architect/agent-coordination/verification/architecture-advisory-panel/P02.1.md`): preserve, correct. Dated 2026-09-12 observation report; the cited path is a captured evidence pointer. The span (cols 232-279, 1-based) resolves to the exact 47-char token. The cited target exists at the pin; it moves with the tree at Phase 9, and a history file takes no patch (L12-38/40).
   - No other legacy-root form in the file (scanned `docs/specs`, `docs/architect`, bare `specs/` and `architect/`, wrapped paths).
2. `archive/plans/260915-code-implementation-track-policy/reports/review-260915-0944-critical-design-review.md` - verdict **ok**. 2 slots, both evidence-100.
   - L19 (cell traces under `docs/architect/agent-coordination/verification/rust-host-r1-kernel/p07,p09,p13,p15.md`): preserve, correct. Dated critical review of a draft plan; the passage quotes what the repo contained at the time.
   - L163 (`docs/architect/agent-coordination/verification/<track>/<cell>.md` must record `Proof:`): preserve, correct. It is a recommendation inside a dated review ("draft 2026-09-15"), not a live writer row or live rule, so it is not a Step 5 writer row and takes no patch. The `<track>/<cell>` placeholder does not make it live.
3. `archive/plans/260915-code-panel-multicell-facade/phase-05-live-proof-and-rollout.md` - verdict **ok**. 2 slots, both evidence-105.
   - L41 (`- Add: docs/architect/.../code-panel-multicell-facade/proofs/p04/**`) and L42 (`- Add/Edit: .../{index.md,current-cell.md,p04.md}`): preserve, correct. The file has `status: completed` front matter and a "2026-09-16 Direct hotfix execution note", so the Files list is a completed phase's historical scope. Cited targets exist at the pin (index.md confirmed). Spans resolve on the exact lines and columns.

## Defects

OUTCOME defects (wrong disposition/target/anchor/diff, false description, missed reference, behavior change): **none**.

## Record-text notes (not rework)

- File 2 L280 holds `docs/architect/agent-coordination/playbooks/` ("or next to `master-coordinator.md` under ..."), a legacy-root path with no slot. It sits outside the `agent-coordination/verification/` pattern of the evidence inventory, and archive/plans hits are excluded from the class-3 census by the explicit archived-history list (owner-answers L12-29, "archive/plans/** hits are archived history, excluded by explicit list"). The correct disposition would be preserve (a dated review's open question), so no outcome changes.
- The preserve reason is shared boilerplate ("tree retires at Phase 9 where the cited path is under specs/architect") plus a long quoted passage. It is true here. In evidence-097 the quoted passage shows `\\'` escapes that do not match the source quote characters; cosmetic.

## Lead-judgment questions

- Is the archive/plans exclusion (L12-29) accepted as covering out-of-inventory legacy-root paths in archived plan files for Step 4 coverage? I found one such path in this part (file 2, L280).

## Counts

Set step04-006 / unpatched stratum: 3 files reviewed, 0 rework; 5 slots reviewed (5 preserve, 0 patch, 0 park).

Status: DONE
Summary: All three files and five slots are correct preserves of historical evidence references; no outcome defect.
