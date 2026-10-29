---
title: "Validation of the third config-fix round plan"
description: "Result of the validate-plan pass (reviewed pattern); the amendments it asks for are adopted in plan.md"
---

# Validation, third config-fix round

Verdict: slice 1 not ready as written; slice 2 ready after slice 1. Full text of the validator's report: the agent report of unit run `unit-run-1793244470431-b33b2788` (`producer/2`). Facts it established, each grounded in source: the Config door returns winning-leaf origins (file, line) for requested path prefixes in the same read; it records leaves, empty objects and empty sequences, not nonempty parents; `resolveLayer`'s array branch picks the first descendant and returns `standard` verbatim; `loadRunnerConfigForDir` returns a flat config that `snapshotRunnerConfig` persists to `unit.json`.
