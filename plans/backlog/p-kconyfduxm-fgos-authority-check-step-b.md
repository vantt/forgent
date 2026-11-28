---
id: p-kconyfduxm
title: "fgos authority check, step B of the layering work: a command that judges the layering rules, built after step A is stable (component-authority, priority P2; source: ds-zfqskcns7j, owner via Miu, 2026-11-28)"
status: proposed
priority: P2
area: component-authority
created: 2026-11-28
---

# Why

Step A declares the layerings in the model and applies fixed rule kinds in code, first in report-only mode. Step B is the command that judges them across the repository and in other projects.

# Done when

- `fgos authority check` runs the rules of every declared layering and reports violations by component pair.
- It blocks only when step A's report-only run was clean.
- It is usable in a project that has its own model.

# Notes

After step A (plan `261127-1247-component-authority-layerings`, held) and after `p-glsrogszi7`.
