---
id: p-l23sjiury4
title: "`fgos questions answer --option` help still says label only; it does not mention the letter answer A-D (cli, priority low; source: closing report of plan 261122-1950)"
status: proposed
priority: P3
area: cli
created: 2026-11-28
---

# Why

Plan 261122-1950 made `--option A` resolve by place (A to D, exact label first), but the help text was outside its footprint and still describes only a label. An owner reading help does not learn the cheap answer. Evidence: `plans/261122-1950-owner-communication-standard/reports/lead-261128-2202-owner-communication-closing.md`, debt item 1.

# Done when

The `--option` help in `src/cli/command-registry.mjs`, `packages/host-runtime/contracts/command-manifest.json` and `apps/fgos/src/cli_projector.rs` names the letter answer (A to D by place, exact label first), from one source.

# Notes

Opened by the supervisor from the lead closing report, 2026-11-28.
