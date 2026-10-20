# Review A38 - Step 4 wave 1 part 03 (set step04-003, historical evidence, preserve-only)

Pin ef62747dd; payload step-04-wave1-p03.json; records step04-003.jsonl. Population: 7 files, 9 slots, all disposition preserve, timing none, no diff, no render provenance. Stratum: unpatched (inherited L12-34). Each source read whole from the payload context (byte-identical to the pinned blob, verified by string comparison); every slot span (1-based column) re-verified against the pinned line text: 9/9 match.

## Per file

| File | Slots | Verdict |
| --- | ---: | --- |
| archive/plans/260901-1542-step08-standalone-coordination/plan.md | 1 (evidence-004, L12) | ok |
| archive/plans/260901-1542-step08-standalone-coordination/reports/doer-260901-2050-GH-08-P01.1-coordination-store-report.md | 1 (evidence-008, L86) | ok |
| archive/plans/260903-0004-step09-group-thinking-mvp1-mvp2/reports/doer-260903-P00.1-contract-promotion-report.md | 1 (evidence-021, L159) | ok |
| .../reports/fixer-260903-P00.1-redteam-findings-fix-report.md | 1 (evidence-026, L6) | ok |
| .../reports/fixer-260903-P01.1-test-coverage-fix-report.md | 2 (evidence-027, L6 and L72) | ok |
| .../reports/reviewer-260903-P00.1-contract-promotion-review-report.md | 1 (evidence-032, L12) | ok |
| archive/plans/260903-1049-step09-mvp3-to-mvp5/reports/doer-260903-P01.1-mvp3-recheck-disposition-report.md | 2 (evidence-040, L8 and L86) | ok |

Why ok: every slot is a backticked path to a verification trace file under docs/architect/agent-coordination/verification/ cited by a dated doer/fixer/reviewer report as where evidence was written ("evidence recorded in", "Findings recorded in", "filled in with real evidence", "(new)" in a files-changed list). Each cited file exists at the pin. These are captured evidence destinations: preserve is the L12-38/40/46 outcome; nothing is a live "see X" pointer to a nonexistent path; no label or relative form is altered because nothing is patched. L12-10 does not apply (no docs/history convention path). L12-7 respected (no consumer rewrite of the retiring tree). No behavior surface.

## Outcome defects
None.

## Record-text notes (not rework)
- Multi-slot edges (evidence-027, evidence-040) carry one reason that quotes only the first slot's passage ("Exact passage: ..."); the second slot text differs (evidence-040 L86 is a bullet in a Files-changed list).
- The reason says "tree retires at Phase 9 where the cited path is under specs/architect"; true (docs/architect), wording slightly loose but not misleading.

## Lead-judgment questions
Lead-judgment questions (none block ok verdicts):
1. Uncovered sibling legacy-root references. Besides the verification-evidence slots, several of these archived files carry other docs/architect or docs/specs references that appear in no Step 3 record and no Step 4 slot (checked against all step-03-records*/ files and the part payload). They are listed per file below. All would preserve as dated archive history (L12-38/40/46) and the relative links among them already do not resolve from archive/plans/<x>/ (../../docs/... lands under archive/docs/, which does not exist at the pin), so no outcome changes; but if the population is meant to be complete for the archive/plans files, Lead should confirm these are intentionally out of the Step 4 population (L12-30 "archive/plans hits are archived history, excluded by explicit list") rather than a gap.
2. Present-tense location claim: see the file note where it applies. L12-38(6) parks present-tense location claims into a retiring tree as description-rewrite even in dated files, while the reviewer brief says such claims are Phase 9 timing. The record preserves (timing none). Lead to confirm preserve is the intended outcome for archived plan/report evidence citations.

Specific to this part:
- plan.md (evidence-004, L12): "Full execution trace ... live under `docs/architect/agent-coordination/verification/step-08-.../`" is a present-tense location claim in a completed archived plan. Preserve is consistent with the dated/archive class; see question 2.
- Uncovered sibling references (no slot anywhere): plan.md L19-23 (links ../../docs/architect/... vision, ADR-006, ADR-007, ledger, checkpoint), L111 (docs/specs/runner.md), L172 (master-coordinator link), L205-209 (path list); doer-GH-08 report L10 (coordination-session.md), L79 (docs/specs/reading-map.md, runner.md); doer-P00.1 contract-promotion report L6, 13, 56, 83, 98, 127-130, 133, 143-144 (docs/architect contracts/proposals); fixer P00.1 red-team report L12, 13, 54, 55.

## Counts
step04-003, unpatched stratum, this part: 7 files reviewed, 0 rework; 9/9 slots reviewed, 0 defects. Part-level rework 0/7 (0%).
