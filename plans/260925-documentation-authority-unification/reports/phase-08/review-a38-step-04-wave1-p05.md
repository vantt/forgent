# Review A38 - Step 4 wave 1 part 05 (set step04-005, historical evidence, preserve-only)

Pin ef62747dd; payload step-04-wave1-p05.json; records step04-005.jsonl. Population: 2 files, 17 slots, all preserve, timing none, no diff, no render provenance. Stratum: unpatched. Sources read whole (plan.md 128 lines; track-closeout.md 181 lines, identical to pinned blobs); all 17 span texts re-verified against pinned lines (1-based columns): 17/17 match. Every cited verification path exists at the pin (visibility-herdr/v0-live-proof-2026-09-07.md and rust-host-r1-kernel/p00..p15.md).

## Per file

| File | Slots | Verdict |
| --- | ---: | --- |
| archive/plans/260906-1831-dispatch-visibility-v0/plan.md | 1 (evidence-089, L72) | ok |
| archive/plans/260910-1700-rust-host-r1-kernel/reports/track-closeout.md | 16 (evidence-094, L35-L50, one per table row P00..P15) | ok |

Why ok: plan.md L72 is explicitly dated evidence ("Doi chieu 2026-09-07 (bang chung: ...)"): the textbook evidence citation, preserve. track-closeout.md is a dated closeout report ("Date: 2026-09-11", "Status as of 2026-09-15"); its 16 rows are the Trace Document column of the cell table, markdown links whose label (pNN.md) and target text are preserved verbatim; coverage is complete (all 16 table rows L35-L50, no other verification-tree link in the file). Preserve is correct under L12-38/40/46; nothing patched so label/backtick form is untouched.

## Outcome defects
None.

## Record-text notes (not rework)
- The 16 slots share one reason that quotes only the L35 row; the other rows are distinct passages.
- The relative link targets `../../../docs/architect/...` in track-closeout.md already resolve to archive/docs/... (nonexistent) because the file lives under archive/plans/<x>/reports/; the same is true of its `../../../packages/...` and `../../../bin/...` links. The reason does not state that the links are already dead from the archived location; the preserve outcome is unaffected (dated history), but a Phase 9 link pass should not treat this as caused by the cutover.

## Lead-judgment questions
Lead-judgment questions (none block ok verdicts):
1. Uncovered sibling legacy-root references. Besides the verification-evidence slots, several of these archived files carry other docs/architect or docs/specs references that appear in no Step 3 record and no Step 4 slot (checked against all step-03-records*/ files and the part payload). They are listed per file below. All would preserve as dated archive history (L12-38/40/46) and the relative links among them already do not resolve from archive/plans/<x>/ (../../docs/... lands under archive/docs/, which does not exist at the pin), so no outcome changes; but if the population is meant to be complete for the archive/plans files, Lead should confirm these are intentionally out of the Step 4 population (L12-30 "archive/plans hits are archived history, excluded by explicit list") rather than a gap.
2. Present-tense location claim: see the file note where it applies. L12-38(6) parks present-tense location claims into a retiring tree as description-rewrite even in dated files, while the reviewer brief says such claims are Phase 9 timing. The record preserves (timing none). Lead to confirm preserve is the intended outcome for archived plan/report evidence citations.

Specific to this part:
- plan.md also has an uncovered `../../docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md` link (L9 "Design source"), a provenance-style citation with no slot in any step; would preserve (L12-47 provenance line).
- track-closeout.md: no uncovered legacy-root references found.

## Counts
step04-005, unpatched stratum, this part: 2 files reviewed, 0 rework; 17/17 slots reviewed, 0 defects. Part-level rework 0/2 (0%).
