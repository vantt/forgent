---
id: p-oimxdmixfn
title: "Nothing checks a model id against what its transport serves, so a stale standard id fails only at probe time (runner, priority medium; source: `plans/261117-1435-solo-driving-trial/reports/measures-template.md` (phase 1 baseline))"
status: proposed
priority: P2
area: runner
created: 2026-11-17
---

# Why

The standard's gemini `flagship` and `frontier` cells named `gemini-4-argon-high` after gemini moved to agy only; `agy models` lists only the gemini-3.8-flash ids, so every gemini seat at those tiers failed with `invalid model selection` (2 of 2 probes in the 2026-11-17 baseline) while `decide --for execute` still picked gemini first. No load check, doctor row or probe compares a tier cell with the transport's model list. Friction: `agy-gemini-invalid-model-selection`.

# Done when

A check (doctor row or probe, read-only) lists every model cell an executor's invocations would pass and compares it with what the transport reports (`agy models` and the equivalent per CLI where one exists), naming the cell, model and transport for each unserved id; a cell the transport refuses is not picked by `decide` until fixed.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
