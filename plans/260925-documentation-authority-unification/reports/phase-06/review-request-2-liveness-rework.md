# Limited independent liveness re-review

Status: ready for review; Agent Coordination batch is not closed.
Author session: codex-session:1@2026-10-10
Worktree: `/home/vantt/projects/forgentX-phase00-documentation-authority-unification`
Branch: `plan/260925-documentation-authority-unification`
Owner decisions: A17 `3d8ee0d11`, A18 `c071b6c66`.

## Anh giao cho reviewer session khác

Review độc lập phần đã đổi; không chạy tooling re-review, không tự mở rộng scope, không sửa gate/checker/baseline/vocabulary. Không push/PR/merge/ship. Commit report bằng explicit paths trong worktree/branch này; trước mỗi git write chạy pwd và git branch --show-current.

## Đọc trước và pins

- Phase file và owner-answers.md (A17/A18; A5/A6 vẫn điều khiển ordinary review).
- Review đã commit `f9575e2a6`: review-2whole-files.md, review-2whole-reworks.md, review-2whole-classifications.md, review-2whole-conflicts.md và các source/retired reports.
- Scan/input/classification: liveness-classification-input.json, liveness-scan.json, liveness-classification.json; refined scan commit `5d470d7e4718585733b141fe28c0356697b3edd0`.
- Current text: `eefe3c4e73012ad439010196d6690d546ca87c8e`; current-state/code/full shown units: liveness-current-state-evidence.json.
- Accounting: `717d474f1d262b074caac169d88ee50f4906f345`; exact-proof correction: `e0bcd01b77b62d93f157cd026609c3968666e98e`; exact before/after rows: liveness-accounting-audit.json.
- Receipt artifact `plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-liveness-rework.json` pinned at `090840a6c7e941926813efb6d76298d10b1dcd68`; references in `plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-classifications.json`.
- Reproducible commands/results: liveness-rework-verification.json. All JSON/Markdown paths above are relative to this report directory unless a ledger path is shown. Inventory parts are scratch-only under /tmp/phase06 and are never committed.

## Scope giới hạn

| Material | Count | Required reading |
|---|---:|---|
| Changed area files | 38 | Every current-state sentence, original intent, live/design/history split and links |
| Changed pending source rows | 1298 | Every judgment; full source/target and note, no enclosing-index shortcut |
| Changed retired rows | 1174 | 1139 rebound + 35 new; full old shown text/successor |
| Pending classification receipts | 1615 | Full shown text/digest, class, current-code evidence; includes two substantive historical relabels |
| Changed identical-owner member sets | 71 | Exact current members/owners/anchors; repeated text is not independent proof credit |

Eight native unseeded source packs:

- [pack-2-liveness-s2-agent-coordination-judgment-01.md](pack-2-liveness-s2-agent-coordination-judgment-01.md) — 238 rows; corresponding .md.json sidecar is the binding.
- [pack-2-liveness-s2-agent-coordination-exact-04.md](pack-2-liveness-s2-agent-coordination-exact-04.md) — 105 rows; corresponding .md.json sidecar is the binding.
- [pack-2-liveness-s2-agent-coordination-exact-01.md](pack-2-liveness-s2-agent-coordination-exact-01.md) — 281 rows; corresponding .md.json sidecar is the binding.
- [pack-2-liveness-s2-agent-coordination-exact-03.md](pack-2-liveness-s2-agent-coordination-exact-03.md) — 216 rows; corresponding .md.json sidecar is the binding.
- [pack-2-liveness-s2-agent-coordination-exact-02.md](pack-2-liveness-s2-agent-coordination-exact-02.md) — 33 rows; corresponding .md.json sidecar is the binding.
- [pack-2-liveness-s2-agent-coordination-judgment-02.md](pack-2-liveness-s2-agent-coordination-judgment-02.md) — 164 rows; corresponding .md.json sidecar is the binding.
- [pack-2-liveness-s2-agent-coordination-judgment-03.md](pack-2-liveness-s2-agent-coordination-judgment-03.md) — 97 rows; corresponding .md.json sidecar is the binding.
- [pack-2-liveness-s2-agent-coordination-exact-06.md](pack-2-liveness-s2-agent-coordination-exact-06.md) — 164 rows; corresponding .md.json sidecar is the binding.

Retired rows: `plans/260925-documentation-authority-unification/ledger/retired-unit-decisions.json`; only pending rows plus before/after audit entries. Full new retired prior text: liveness-retired-unit-text.json. The four unchanged inherited payload retirements are not new edits/retirements; their earlier pin/anchor classification and blob equality are recorded separately.

Classification withdrawals: liveness-withdrawn-classifications.json. Do not silently carry an old approval onto changed shown text. The two additional relabels are migration-status.md#unheaded-block-2 and orchestration-vocabulary-map-2026-08-27.md#unheaded-block-141: substantive payloads, not structural frames; historical process/design context is not reinstated runtime.

Current owner sets: liveness-identical-unit-groups.json; review the 71 changedDigests only. Unchanged sets retain their earlier reports; the raw strict diagnostic still lists all 342 groups and is not described as green closure.

## Acceptance focus

- All nineteen rejected whole-file moves returned, six mixed files separated by section/status, fifteen retained files restored, operating-harness/master-coordinator current. The area has 41 surviving current/design files, not almost nothing current. Do not interpret an unimplemented schema as retired engine material.
- Liveness first: scan all nine required roots (569 tracked textual inputs), 68 source files and 997 slices. Generic identifiers and immutable legacy ratchet references are not proof of implementation; use actual consumers/validators/implementation, and keep live material current by default. No new whole-file move in this pass.
- Every runtime assertion must agree with actual code/behaviour, not a generic receipt citation. Proposals, normative/cognitive obligations and dated findings must be explicit. Check operation helper projections/unknown-step empty result, mutation/evidence stamping, control fencing, receipt owner/exit paths, confidence, failure taxonomy and registered architecture-advisory graph. Optional manual-harness artifacts are not automatically registered Workflow storage.
- Verbatim containment: all 74 previous input carriers and all 867 physical payload blobs unchanged. No dropped claim id: 35 new retirements have pending successors; old versions/notes preserved in the audit, not approved by the author.
- Three physical stage-bearing links repaired under A18; no renames, checker/baseline/vocabulary change or area-status promotion.

## Review procedure and reports

Read every changed judgment and full shown unit. Independently choose and record 100 random remaining script-proven exact rows for the ordinary spot check; no per-batch seeded pack/sensitivity score. Check current statements against file:line/command evidence. Run both prior-registry D/E commands, ratchet, placement, routing and the explicit 51-file test command in the verification JSON. Report expected pending diagnostics as pending, never as green strict closure.

Commit ordinary independent reports `review-2-liveness-s2-agent-coordination-*.md` for source packs, plus `review-2-liveness-retired-unit.md`, `review-2-liveness-classifications.md`, `review-2-liveness-conflicts.md` and a changed-files/liveness summary. Record Reviewer, Author session, Review mode ordinary and reading method. Source/retired tables bind Claim/Verdict/own Note/Source digest/Target digest; classification tables bind Claim/Class/Verdict/Unit digest/Shown text digest/own Note. One verdict per scoped row; hold/rework is not reviewed. List unknown-blocking holds and real conflicts for anh. Reviewer session must differ from author after session normalization without the date suffix.

## Proof and owner lists

Full D and scoped D, twice each: zero fatal. Strict E twice: only 1,298 not-reviewed source rows, 342 identical-owner groups and 756 reverse-open units before this independent review. Tests: 912/912 pass, zero fail/cancelled/skipped/todo. Ratchet: 995 legacy files / 25 accounted edits / one addition. Placement: 504 checked / 503 matched / one exception, zero leftover/ambiguous/evidence without index. H: thirty exact inherited tuples, zero new and zero Agent Coordination. Operation helper smoke: five concrete checks pass.

Archive/delete: no new legacy action or whole-file move. Holds: no new unknown-blocking hold. Real conflicts: none newly confirmed in this pass; inherited semantic diagnostics are not asserted resolved (UNPROVEN). Promoted edits: promoted-edits.md; changed paths in verification.counts/current-state evidence. No legacy-root, AGENTS, main, status/switchboard, checker or vocabulary edit.

UNPROVEN: independent acceptance, strict closure, batch completion and Phase 6 completion. Live Herdr confinement is not re-executed by this documentation-only pass; the A12 pre-existing result stays recorded.

Exact next step: commit the limited independent verdict reports; author applies only matching committed verdicts, reworks if needed and proves strict closure before any next content batch. Author stops here.
