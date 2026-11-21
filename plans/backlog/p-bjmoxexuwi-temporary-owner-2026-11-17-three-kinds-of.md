---
id: p-bjmoxexuwi
title: "TEMPORARY (owner 2026-11-17): three kinds of provider taste are dropped in capability step 2 with no home; plan where taste per job or seat should live (capability, priority medium)"
status: proposed
priority: P2
area: runner
created: 2026-11-17
---

# Why

S5 Q2 = a drops: (1) each capability row's own `prefer` order (five architecture orders differ from the common shapes; `tierFallback` decides instead); (2) the producer seats of `architecture:critique|synthesize` (`tier: frontier`, `prefer [openai, claude]`; they now take the unit tier); (3) the red-team order that differed between `code:*` (`[openai, xai]`) and `marketing:*` (`[claude]`); the coding order and the reviewer order `[xai, openai]` are kept globally in `runner.roles`, so non-coding red-team seats change order. The owner accepted this as a stopgap only, under the rule that each kind of customization has exactly one place.

# Done when

A written plan (owner-reviewed) decides whether taste per job, per seat or per domain needs a place at all and, if so, the one place it lives (persona, role, unit, or a project override), measured against what the dropped orders actually changed in council and review outcomes; until then any repo that needs one of the dropped orders uses a project override row.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
