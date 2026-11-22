---
id: ds-2d55ty37zz
title: "One door and one context-injection seam for starting an agent"
status: open
source:
  - p-25q7tz6jtt
created: 2026-11-22
---

discussion: open

## Seed

Opened by the secretary (Miu) on the owner's order, 2026-11-22 15:57.

- **Owner's goal:** every agent start goes through one door, with one fixed integration point (a seam) where context is injected. Reason: CLAUDE.md and AGENTS.md cost many tokens on every start and are mostly unused. At start time the role, domain and task are known, so the matching context can be injected then. Later components, such as agent context injection, plug into that seam.
- **First task, a scan:** count and list every way an agent is started (`fgos session start`, head start, `fgos run`, workflow units, rotation successors, subagents, any other) and every place that writes or owns the start prompt or start context. For each: file, what it injects, who calls it. The owner already knows `head start` carries a good activation prompt; use it as the reference.
- **Then shape:** the single door, the seam's contract (inputs: role, domain, task; output: context), what leaves CLAUDE.md and AGENTS.md, and what an increment toward it looks like.
- **Constraints:** hexagonal and pluggable (design principle 3); one door, replace and delete the old paths in the same change (principle 1, L10); prior art first (`git log -S`, area specs' decision history); bring the owner decisions as five-part questions with a recommendation and a default.
- **Non-goals:** writing the injection component itself; changing what persona or domain doctrine says.
- **Source ids:** `p-25q7tz6jtt`. Related: `ds-cfsfcbknl6` (how agents talk to the owner).
