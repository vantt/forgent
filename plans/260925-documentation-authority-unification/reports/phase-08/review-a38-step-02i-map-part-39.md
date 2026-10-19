# Review a38 step-02i mapping part 39

- Reviewer: reviewer:sonnet-session:aac0f94517d48e145@2026-10-19
- Commits: author 904d0fb5c, accounting 74e3ecf1e (worktree detached at 74e3ecf1eb9a2bc1429f50a25bb7017e240ef798, read-only)
- Part: 39 (mechanical-target-failures), 19 entries, sourceTable step-02i-census-maps-portals-prose.json
- Method: every entry deep-read (source line and context, role/action variants, mechanicalTargetCheck, successorNote, writerBlock); anchors checked with `node scripts/list-doc-anchors.mjs --check`; for every patch the `old` text was matched against the source line and the `new` relative path resolved from the consumer directory against the HEAD tree (all pass); successor/alias candidates checked in the live platform tree, carriage files and switchboard.

## Totals

- ok: 19
- rework: 0
- needs-Lead-judgment: 0
- rework rate: 0/19

## Findings

- All 19 target failures confirmed at HEAD: 4 real missing anchors (00241, 00420, 00586, 00698) have no live successor and take the carriage `#literal-snapshot` note per L12-25.10; 6 are placeholder-path writer rows (`<track>`, `<TRACK>`) and 3 are how-to cell-trace writers, all Step 5 behavioral per L12-19/L12-21/L12-22; 9 are globs (`docs/ui-spec/generated/*`, `docs/ui-spec/**`) of a retained, existing directory.
- Non-blocking observation (wording only, no rework): the mechanical check treats glob tokens as missing files, and the non-executable successorNote on the 7 `ui-spec/generated` rows says "Deleted historical target; preserve original witness" although the directory exists and is retained. Action (preserve / row flip) is right in all 9. A generator fix would expand globs before the existence check.

## Entries

| Entry | Consumer:line | Rule / action | Verdict | Evidence and rationale |
|---|---|---|---|---|
| maps-i-00241 | d/a/agent-coordination/decisions/ADR-008-coordination-session-and-mission-deferral.md:47 | navigation / preserve-pending-target | ok | Target file exists; anchor `coordinationsession` fails at HEAD (list-doc-anchors --check: missing). Live vocabulary dropped the term (CoordinationSession retired); heading lives only in carriage `history/retired-engine/files/vocabulary/canonical-concepts.md` (### CoordinationSession L184, reachable anchor is only `#literal-snapshot`, L25). Preserve + non-executable `#literal-snapshot` note is exactly L12-25.10. |
| maps-i-00420 | d/a/agent-coordination/intent-preservation-ledger.md:102 | navigation / preserve-pending-target | ok | Anchor `v-009-...` fails in live `vision.md` (confirmed); live vision L337 says V-003/V-009 formulations remain historical; carriage vision.md has `### V-009` (L282) behind `#literal-snapshot`. Sibling V-005 edge (maps-i-00419) resolves and is patched, so the split is consistent. Correct per L12-25.10. |
| maps-i-00458 | d/a/agent-coordination/playbooks/coordination-operating-harness.md:121 | live-evidence-writer / preserve-pending-behavioral-proof | ok | Target failure is a placeholder (`<track>`) path, not a missing file; the mirror dir `docs/platform/agent-coordination/verification/` exists with the real tracks. Trace-layout writer block (heading 5). Writer row for Step 5, destination and checks together, no executable new (L12-22.1, L12-19 evidence-181). ok. |
| maps-i-00460 | d/a/agent-coordination/playbooks/coordination-operating-harness.md:413 | live-evidence-writer / preserve-pending-behavioral-proof | ok | Placeholder path (`<track>/proofs/<cell-id>/`), live proof-capture write destination in the harness playbook. Behavioral Step 5, parked. ok. |
| maps-i-00493 | d/a/agent-coordination/playbooks/prompts/master-coordinator.md:158 | live-evidence-writer / preserve-pending-behavioral-proof | ok | Placeholder `<TRACK>`; `<REPO_ROOT>/` prefix leaves a leading `/` in the matched token but patch is null so no byte effect. Master prompt write destination, behavioral Step 5 (L12-19 evidence-182). ok. |
| maps-i-00586 | d/a/agent-coordination/proposals/step-08-standalone-coordination-protocols.md:939 | navigation / preserve-pending-target | ok | Anchor `sessionactor` missing in live vocabulary (confirmed); live L170 only mentions SessionActor as "not a persisted" identity; carriage has `### SessionActor` (L198). Same class as 00241; ok. |
| maps-i-00698 | d/a/agent-coordination/vocabulary/deprecated-and-reserved.md:24 | navigation / preserve-pending-target | ok | Same as 00586 (source is the retiring deprecated-and-reserved.md); anchor missing in live file, carriage `#literal-snapshot` note valid; ok. |
| maps-i-00800 | d/a/documentation-system-discussion.md:50 | ui-spec-self-reference / preserve | ok | Failure is a glob token (`docs/ui-spec/generated/*`); the directory exists at HEAD with generated files and docs/ui-spec is not retiring (L12-24.5). Preserve is right. Observation: successorNote reason "Deleted historical target" is wrong for an existing directory (non-executable, wording only). |
| maps-i-00802 | d/a/documentation-system-discussion.md:57 | ui-spec-self-reference / preserve | ok | Glob of retained docs/ui-spec/generated (exists); preserve (L12-24.5). Same wording observation as part 39 (successorNote says "deleted"). ok. |
| maps-i-00808 | d/a/documentation-system-discussion.md:160 | ui-spec-self-reference / preserve | ok | Same as 00802. ok. |
| maps-i-01646 | docs/generated/README.md:31 | ui-spec-self-reference / preserve | ok | `docs/ui-spec/generated/**` glob of a retained dir; consumer docs/generated/README.md is a generated-artifact registry; preserve correct. Same wording observation. |
| maps-i-01647 | docs/how-to/author-a-plan-loop-track.md:151 | live-evidence-writer / preserve-pending-behavioral-proof | ok | Live cell-trace write path in how-to (L151, "Record it in the cell trace"); mirror target is a placeholder (`<track>/<cell>.md`). Writer row Step 5 per L12-21 ("how-to cell-trace write paths"). ok. |
| maps-i-01648 | docs/how-to/author-a-plan-loop-track.md:195 | live-evidence-writer / preserve-pending-behavioral-proof | ok | Same class: L195 instruction to record the trigger determination in the cell trace; writer Step 5. ok. |
| maps-i-01649 | docs/how-to/author-a-plan-loop-track.md:249 | live-evidence-writer / preserve-pending-behavioral-proof | ok | Same class: L249 cell-trace record format destination; writer Step 5. ok. |
| maps-i-03894 | d/p/documentation/history/proposals-redesigns/documentation-system-discussion.md:74 | verbatim-carriage / preserve | ok | Inside docs/platform/.../history/proposals-redesigns verbatim carriage (explicit carriage region, L12-23.3); glob of retained dir; preserve without alias. Phase 9 link check excludes carriage. ok. |
| maps-i-03896 | d/p/documentation/history/proposals-redesigns/documentation-system-discussion.md:81 | verbatim-carriage / preserve | ok | Same as 03894. |
| maps-i-03902 | d/p/documentation/history/proposals-redesigns/documentation-system-discussion.md:184 | verbatim-carriage / preserve | ok | Same as 03894. |
| maps-i-04020 | d/p/documentation/switchboard.md:66 | migration-state / phase9-row-flip | ok | Switchboard (candidate copy) row cell `docs/ui-spec/**` inside the UI specification row; migration-state cell, row flip at Phase 9, no path substitution (L12-25.1). `docs/ui-spec/**` glob is the mechanical failure; dir retained. ok. |
| maps-i-05380 | docs/transitional-switchboard.md:67 | migration-state / phase9-row-flip | ok | Same as 04020 in docs/transitional-switchboard.md (L67); row flip. ok. |
