---
id: p-gd3rm7rbvw
title: "Runner items: fanout cannot run outside the fgOS checkout, step/discover/plan Unit templates move into composer units, and fgos-runner use is measured (core/platform; source: owner via the agent-start-door shaper, 2026-11-22 19:45)"
status: proposed
priority: P1
area: runner
created: 2026-11-22
---

# Why

Owner decision 2026-11-22 19:45, three parts.

1. The `fgos-fanout` skill runs `node src/runner/fanout-batch.mjs`, a path that exists only in the fgOS checkout, so fanout cannot run in any other project. This breaks mission #1 (fgOS serves other projects). Move the fanout batch onto `fgos workflow start --units`. Do this now, in parallel with Agent Start Context slice 0, since they share no files.
2. The operation step of `fgos step`, `discover` and `plan` creates its Unit through the same function `fgos run --unit` uses. Its objective templates (work-compat `buildPrompt`, `src/runner/prompt-templates`) move into composer units, after Agent Start Context slice 1.
3. Measure the use of `fgos-runner`. Retiring a shipped entry is an owner decision with that evidence.

# Done when

Part 1: fanout runs from an installed fgOS in a project that is not the fgOS checkout, through the workflow door, with one owning test. Part 2: the Node templates are gone and the composer produces the same Units. Part 3: a use measurement exists and any retirement is put to the owner as a decision question.

# Notes

Seed: `plans/discussions/ds-2d55ty37zz-agent-start-door-and-context-seam/DISCUSSION.md`, row P14, section 5 at 19:55 and 20:00, hand-off block "Order with the runner item". Relayed by that discussion's shaper; the secretary has not read the owner's words directly. Part 1 first, as its own plan lane.
