---
id: p-3jtwwzchjl
title: "The runner's output limit counts each streamed pi event as output, so a deepseek seat through pi is stopped while still thinking (runner, priority P1; source: lead of plan 261125-1631 via the help queue, 2026-11-26)"
status: proposed
priority: P1
area: runner
created: 2026-11-26
---

# Why

ACE phase 2 (unit run `unit-run-1795626405322-6e734fef`) fell back to deepseek through pi. pi printed each `thinking_delta` token as its own JSON line, the runner's output limit counted those lines, and it stopped the seat after 14 minutes with no work written. Every pi seat with a thinking model can hit the same wall, so the fallback chain loses its pi seats on long tasks.

In the same run the fallback picked gemini twice after `gemini/tetnu` was quarantined (`provider-capacity.lease-conflict`). Rows p-njgws5wsex and p-drfxqdzzon are done; check first whether this is a new case of the same cause before opening a second item.

# Done when

The output limit measures what a seat really emits (its final text and tool output), not per-token stream events, proven by one test at the layer that applies the limit with a recorded pi stream fixture. The cause is confirmed first from the run's assignment record under `.fgos/assignments/`.

# Notes

Raised by the lead of plan 261125-1631 on the help queue (event 7bce1664a5c30bb4); the lead reran the phase on claude meanwhile.
