# Review A38 - Step 4 wave 1 part 04 (set step04-004, historical evidence, preserve-only)

Pin ef62747dd; payload step-04-wave1-p04.json; records step04-004.jsonl. Population: 6 files, 8 slots, all preserve, timing none, no diff, no render provenance. Stratum: unpatched. Sources read whole from payload context (identical to pinned blob); all 8 span texts re-verified against pinned lines (1-based columns): 8/8 match.

## Per file

| File | Slots | Verdict |
| --- | ---: | --- |
| archive/plans/260903-1049-step09-mvp3-to-mvp5/reports/fixer-260903-P04.2-handoff-gaps-fix-report.md | 3 (evidence-048, L15, L25, L36) | ok |
| .../reports/reviewer-260903-P00.1-recheck-report.md | 1 (evidence-059, L34) | ok |
| .../reports/reviewer-260903-P01.1-mvp3-recheck-disposition-review-report.md | 1 (evidence-060, L56) | ok |
| archive/plans/260904-2329-group-thinking-plan-loop/phase-02-chain-verb-and-pack-registration.md | 1 (evidence-069, L117) | ok |
| archive/plans/260904-2329-group-thinking-plan-loop/reports/reviewer-260905-0730-p03-1-r5-live-proof-review-report.md | 1 (evidence-083, L12) | ok |
| archive/plans/260905-architecture-advisory-panel/phase-05-comparative-proof-and-promotion.md | 1 (evidence-085, L61) | ok |

Why ok: L15/L25 of the fixer report cite the verification file as the place a past fix was made ("File: ..., table row ..."), L36 is a captured command line in a fenced verification block (L12-40(1): captured evidence is history, exempt from the alias rule); the recheck/review reports cite where findings were appended; the two phase files are dated, completed (status: completed) archived plan phases whose lease/instruction lists name the trace destination they were written to (L117 "This cell's own report file under ...", L61 an instruction to update the verification README). All cited paths exist at the pin. Preserve is the correct outcome; nothing is a never-existing live pointer. Not an L12-10 file. No behavior surface.

## Outcome defects
None.

## Record-text notes (not rework)
- evidence-048 has three slots in one reason that quotes only L15; L36 is inside a fenced command transcript and the reason does not say so (the preserve basis is correct either way).
- phase-05 L61 is a plan instruction (not a past-action record). It still falls under archived dated plan evidence; the reason's "records the original evidence destination" is a slight stretch for an instruction.

## Lead-judgment questions
Lead-judgment questions (none block ok verdicts):
1. Uncovered sibling legacy-root references. Besides the verification-evidence slots, several of these archived files carry other docs/architect or docs/specs references that appear in no Step 3 record and no Step 4 slot (checked against all step-03-records*/ files and the part payload). They are listed per file below. All would preserve as dated archive history (L12-38/40/46) and the relative links among them already do not resolve from archive/plans/<x>/ (../../docs/... lands under archive/docs/, which does not exist at the pin), so no outcome changes; but if the population is meant to be complete for the archive/plans files, Lead should confirm these are intentionally out of the Step 4 population (L12-30 "archive/plans hits are archived history, excluded by explicit list") rather than a gap.
2. Present-tense location claim: see the file note where it applies. L12-38(6) parks present-tense location claims into a retiring tree as description-rewrite even in dated files, while the reviewer brief says such claims are Phase 9 timing. The record preserves (timing none). Lead to confirm preserve is the intended outcome for archived plan/report evidence citations.

Specific to this part:
- Uncovered sibling references (no slot anywhere): fixer P04.2 report L7 (docs/architect/agent-coordination/playbooks/mvp6-dogfood-handoff.md); reviewer r5 report L33 mentions docs/history/r5-live-proof-evidence/** (retained root, nothing needed); phase-02 L132 names .agents/skills/fgos-plan-loop/** (explicitly "does not exist yet", a render path, preserve-by-history).

## Counts
step04-004, unpatched stratum, this part: 6 files reviewed, 0 rework; 8/8 slots reviewed, 0 defects. Part-level rework 0/6 (0%).
