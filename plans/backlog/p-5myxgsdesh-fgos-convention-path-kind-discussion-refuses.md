---
id: p-5myxgsdesh
title: "`fgos convention path --kind discussion` refuses every slug, and the discussion rule points at the wrong directory (convention, priority medium; source: owner via Miu, reported by the orchestration-skeleton shaper, 2026-11-21)"
status: proposed
priority: P2
area: convention
created: 2026-11-21
---

# Why

`fgos convention path --kind discussion --slug workflow-engine` fails with `invalid-slug: slug is empty after normalization`. The rule in `packages/convention/contracts/convention.rules.v1.json` (kind `discussion`) names `plans/discussions/` while every discussion lives in `docs/discussions/<slug>/DISCUSSION.md` today (the move to `plans/discussions/` is phase 5 of plan 261120-0625-work-data-model). AGENTS.md tells agents to name every plan, report and journal path with this verb, so a refusal pushes them to build paths by hand.

# Done when

`fgos convention path --kind discussion --slug <slug>` returns the directory where discussions live now and follows the move when phase 5 lands; an owning test in the convention package asks for a slug and gets a path; the empty-slug refusal names the flag the caller got wrong.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
