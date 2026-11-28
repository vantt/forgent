---
id: p-umgnowaomw
title: "Component status is checked against the code: the declare door or the check command refuses a status that contradicts the code, and the wrong rows are fixed (component-authority, priority P2; source: owner via Miu, 2026-11-28)"
status: proposed
priority: P2
area: component-authority
created: 2026-11-28
---

# Why

A component row carries a status (live, designed, planned, retired). Nothing compares it with the code, so a row can say `live` with no code, or `planned` with code.

# Done when

- `fgos authority declare` or `fgos authority check` refuses a status that contradicts the code (paths, crates, files).
- The rows that are wrong today are corrected.
- One test shows a refusal for each contradiction.

# Notes

Related: the decision in `ds-zfqskcns7j` that a component's status is checked by code.
