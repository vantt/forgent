---
id: p-7hixnplas2
title: "One malformed `result-1.json` from a seat throws away the whole round (runner, priority medium; source: `plans/261117-1430-portfolio-driving-draft/reports/trial-261117-1705-solo-driving-trial.md`)"
status: proposed
priority: P2
area: runner
created: 2026-11-17
---

# Why

On 2026-11-17 a seat wrote `result-1.json` with a raw newline inside a JSON string; the runner refused the round as `invalid-agent-result-claim` (`unit-run-1794907081821-1a20672e`, `policy-refusal`) and the round's work was lost to the runner, so a person finished it by hand.

# Done when

A result claim with a recoverable format fault is either repaired by a bounded, logged rule or sent back to the same seat once to rewrite; the round's work is not dropped silently; a test feeds a claim with a raw newline and proves the outcome.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
