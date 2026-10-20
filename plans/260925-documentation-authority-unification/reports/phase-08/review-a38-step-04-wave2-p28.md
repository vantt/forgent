# Review a38 Step 4 wave 2 part 28 (set step04-018)

Pin dc24ce645. Method: whole pinned source read (pane_scan.rs 405 lines through EOF; the brief 230 lines, every path/edge region), record slots compared with source spans and pinned tree. No checker or script run.

## Files

### herdr-dashboard/src/pane_scan.rs (set step04-018, A51 unpatched stratum) - verdict ok
Slots reviewed 2 of 2, both preserve, no diff.
- class6-l-000188 (line 27, `docs/operator-runbook-herdr-cockpit.md`): preserve is right. The runbook exists at the pin and is a retained `legacy-current maintained-authority` root doc (switchboard row), the same call as the Step 3 precedent and the accepted wave 1 judgment on `skills-192`. The comment is a doc-comment citation, no behavior.
- class6-l-000189 (line 92, wrapped `docs/history/fgos-terminal-pane-rename/CONTEXT.md`): preserve is right. The path exists at the pin; `docs/history/**` is retained and is a named history evidence citation (L12-10).
- Missed-reference scan: only line 166 `DISCUSSION.md` (bare filename, not an edge, L12-49) and tests/comments with no paths. No dead paths.

### plans/reports/from-implementer-to-architecture-reviewer-260907-2212-dispatch-visibility-v0-architecture-brief.md (set step04-018) - verdict ok
Slots reviewed 1 of 1 (evidence-190, line 162, `docs/architect/agent-coordination/verification/`), preserve, no diff.
- Preserve is right: dated 2026-09-07 report, history class (L12-60 ruling 2). The span (cols 2..49) matches the source text.
- Unslotted legacy mentions at lines 121 (`docs/architect/.../ADR-011-...md`) and 16 (`docs/platform-foundations.md`) preserve under ruling 2 (dated report, covered by the Phase 9 literal remnant search); not a defect.

## Record-text notes (not rework)
- None blocking. `stepFiveExcluded` empty is correct for both files (no runtime strings carry the paths).

## Lead-judgment questions
- None.

## Counts
- step04-018 A51 unpatched stratum: 2 reviewed, 0 rework (0%).
- Patched stratum: none in this part.
- Slots reviewed: 3 (all preserve).

Status: DONE
