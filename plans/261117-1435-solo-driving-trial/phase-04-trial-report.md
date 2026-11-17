---
phase: 4
title: "Trial report"
status: pending
blockedBy: [phase-3]
effort: 1h
owner: HARDEN
---

# Phase 4: trial report

## Steps

1. Report path: `fgos convention path --kind report --type trial --slug solo-driving-trial --plan
   261117-1430-portfolio-driving-draft` (gives `plans/261117-1430-portfolio-driving-draft/reports/trial-<stamp>-solo-driving-trial.md`).
2. Content, short: per item the seven measures, seat table (attempts/resumes per family), interventions by kind with
   median wait, friction ids grouped by layer; compared with the pkm pilot (spec §13.4) where comparable.
3. Gaps found, each tied to the draft's open points: role boundaries that did not hold, data the supervisor needed but
   the plan frontmatter lacked (D-ADR0079 generic-data requirement), Work-layer coupling in `fgos-coding-shaping`
   (spec §9 / §13.5), anything that would need a new mechanism (listed as ideas with evidence, not done, RUL104).
4. Lessons appended to `plans/261117-1430-portfolio-driving-draft/notes.md` (create if absent), one line each, linking
   the report.
5. Say plainly: 1-2 items is observation only (spec §12 rule 5), not a basis for redesign.
6. Clean up: gate key per Q2's answer, read-only prototype worktree, throwaway state dir.

## Validation

- Report exists at the convention path, links each item's measure sheet and commit.
- `notes.md` has the lessons; draft plan status unchanged (`draft`).

## Rollback

Revert the report commit; nothing depends on it.
