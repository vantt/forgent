---
id: p-hbpacxb3mw
title: "Mess found around agent start and ambient context, outside the start-door scope (core; source: agent-start-door shaper scan, 2026-11-22)"
status: proposed
priority: P2
area: core
created: 2026-11-22
---

# Why

The scan of `ds-2d55ty37zz` found these items outside its scope (its row P9). RUL11 (mess, not weight) says mess seen outside the current scope becomes its own item:

- Codex cuts AGENTS.md at 32 KiB (the file is about 50.8 KB), so Id Minting and the AgentKit block are lost for Codex.
- A stray `<!-- mdview:START -->` at AGENTS.md line 232.
- `statusLine` points into `forgentX`.
- 6 of the 14 `core/agents` are never projected to `.claude/agents`.
- Workflow personas `advisor`, `panelist`, `synthesizer`, `critic` and `brand-guardian` have no definition.
- The Node dispatch and prompt mirror looks unreachable.
- `core/prompt-templates/*` is used by no live flow.
- Unit `skills` never reach the prompt.
- A Claude rotation successor gets the handoff twice; other CLIs get only the path.

# Done when

Each point is checked and either fixed, retired or split into its own item with evidence, and none is left as an unverified claim. This row is the scan's own list, not yet verified by the secretary.

# Notes

Source of truth: `plans/discussions/ds-2d55ty37zz-agent-start-door-and-context-seam/DISCUSSION.md` row P9. Some points may fall inside the later start-door increments; the planner decides.
