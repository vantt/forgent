---
phase: 3
title: "Per-seat restate"
status: pending
priority: P2
effort: "0.5d"
dependencies: [2]
---

# Phase 03: Per-seat restate

## Overview
Catch "answering the wrong question" at the cheapest step: each seat first restates the problem in its own words and says what it will treat as out of scope, then analyses.

## Requirements
- Restate lives inside the seat's own task (a first section of its report), so it costs no extra Unit, start or provider call.
- The synthesizer compares restatements and flags a mismatch as an unresolved item (feeds Phase 01's first section).

## Related Code Files
- Modify: panel-seat objectives/persona text in the discussion workflows.
- Do not add a new step/Unit unless Phase 04 shows the in-seat form fails.

## Implementation Steps
1. Add the restate instruction to the seat objective; keep it to three lines.
2. Run a real workflow with a deliberately ambiguous question; confirm at least one mismatch is surfaced rather than averaged away.
3. Record the extra output length and time versus before.

## Success Criteria
- [ ] Restate appears in every seat report on a real run.
- [ ] A mismatch case shows up in the synthesizer's unresolved list.
- [ ] No added Workflow step, Unit or runtime change.

## Risk Assessment
Restatements can all be near-identical paraphrases (no signal). Then drop the instruction and say so; do not make it a gate.
