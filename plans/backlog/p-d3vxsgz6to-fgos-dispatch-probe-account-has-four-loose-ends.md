---
id: p-d3vxsgz6to
title: "`fgos dispatch probe-account` has four loose ends found in the rc.10 live smoke (runner, priority low)"
status: proposed
priority: P3
area: runner
created: 2026-11-15
---

# Why

On 2026-11-15, account health A on rc.10 found that the verdicts were right but: (1) `--help` does not list `--leg`, which works; (2) stderr prints "credential refresh-ahead ... skipped (entry-unidentified)" twice for a gemini account through omp; (3) the harness leg leaves `.fgos/assignments/asgn_*_op_00N` directories behind (git-ignored) after a probe with no `--record`; (4) an openai-codex codex leg exited 1 with no reason code in its row.

# Done when

`--help` lists every accepted flag (from the route data); the refresh-ahead skip is logged once or only under a debug switch the product already has; a probe without `--record` leaves no assignment directory, or the directory is documented as intended; a failing leg always carries a reason code.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
