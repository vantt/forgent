---
phase: 4
title: "Re-measure against council"
status: done
priority: P1
effort: "0.5d"
dependencies: [3]
---

# Phase 04: Re-measure

## Overview
Same method as 2026-10-04: same question through real council and through fgOS, blind judge on the council rubric; plus Observe's own measurements.

## Requirements
- Judge sees outputs without source labels and in a fixed format; strip JSON wrappers and path noise from the fgOS output so the shell does not cost points (a limitation noted in the previous round).
- Question set: the 2026-10-04 question plus 2–3 new questions (avoid overfitting). Decide the new ones before running.
- Report the score table per rubric row, cost (calls, seconds, providers) and Observe's agreement/stance for each fgOS run.

## Related Code Files
- Create: report under `plans/reports/` only. No code.

## Implementation Steps
1. Fix the question set and judge prompt before any run; save them in the report.
2. Run fgOS and council on each question; one judge (opus), blind, not the implementer.
3. Compare to 8 (council) / 5 (before this slice); list rows still behind and which gap each maps to (cross-exam, tally, outcome ledger).
4. Decide with evidence: stop, or extract shared seams with the advisory plan for the remaining rows.

## Success Criteria
- [x] Table of scores per question and row, with judge prompt and inputs saved ([report](reports/phase-04-remeasure-report.md)).
- [x] Explicit decision on the next gap: stop; no cross-exam, tally or ledger.
- [x] Full suite green; CHANGELOG/spec lines landed.

## Risk Assessment
n is small and the judge is one model; state that. A score that does not move is a valid result and stops further gate building.
