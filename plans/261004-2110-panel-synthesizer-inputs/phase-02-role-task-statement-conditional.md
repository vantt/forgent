---
phase: 2
title: "Say what to do with the refs (conditional)"
status: not-needed
priority: P2
effort: "0.25d"
dependencies: [1]
---

# Phase 2: Role task statement (conditional)

## Overview

Unit-run briefs use the plain objective path: every role gets the same objective plus `Role: <name>`.
After phase 1 the synthesizer has refs but may not be told to read them as inputs to a verdict.

## Trigger

Panelists appear only as `panelist-N` paths, so judge by whether the synthesizer's text
reflects each report's content, not by names. One live run is weak evidence: repeat it twice.

Run only if the phase 1 acceptance rerun shows the synthesizer ignoring the refs (names no
panelist, or contradicts them without addressing them). If it uses them, close this phase as
not needed and record the evidence.

## Requirements

- Precondition found in review: `dispatchBound` builds the assignment from the OUTER unit
  (:313,:319), so a per-role unit passed to `runRole` never reaches the brief. Phase 2 must first
  plumb the per-role unit into `dispatchBound`; that unit also reaches `bind()`, so only the
  objective text may differ.
- The pattern owns role meaning, not the runner: panel passes a per-role objective suffix
  through the existing `unit` argument of `runRole`, with the text overridable by pattern params
  so a preset or Workflow can replace it. No role names or prose in `run.mjs`.
- Default text: read every context ref, name each member's position verbatim, keep a material
  split as a split, do not invent consensus.

## Related Code Files

- Modify: `src/runner/execution/patterns/panel.mjs`, `test/runner/execution/patterns/panel.test.mjs`.

## Success Criteria

- [ ] Rerun shows the synthesizer naming each panelist and preserving a split.

## Risk Assessment

- Prompt wording is not a guarantee. Signal: a fixture with a known 2-vs-1 split where the
  minority is dropped. Response: replan toward a structured synthesizer output, do not add prose.
