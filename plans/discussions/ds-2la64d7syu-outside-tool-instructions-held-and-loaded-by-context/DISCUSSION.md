---
id: ds-2la64d7syu
title: "Outside tools write instructions into AGENTS.md: one general way to hold and load them"
status: open
source:
  - p-pwk2jfpvqv
created: 2026-11-28
---

discussion: open

## Why open

Owner (2026-11-28): the AgentKit problem is a problem of every outside tool that integrates by writing instructions into AGENTS.md, so there must be a general way to keep that content and load it where it fits. Facts in backlog row `p-pwk2jfpvqv`.

## Miu counter-points (to test, not decisions)

1. **Selection or capture?** ASC never edits rule text. Selecting whole blocks per persona is safe; trimming inside a block is editing someone else's text. Only whole-block selection fits the existing rule.
2. **The installer fights back.** AgentKit's installer and `gitnexus analyze` rewrite their blocks every run. A capture that strips the block from AGENTS.md is undone on the next update, so the design needs a drift check by digest, or a place the tool is told to write instead (an own file, with AGENTS.md carrying only a pointer). Which of these do the tools allow? Needs reading, not guessing.
3. **Not all of it is waste.** Some AgentKit rules are generic; some conflict with fgOS rules (previews, MDView, plan paths). The selection needs to know which block applies to which persona, and conflicts need an owner, or the engine's conflict check (a narrower rule never overrides a law) must reach outside text too.
4. **Where does the triplication come from?** Three readers: the parent directory's `.claude/rules`, the project's, and the AGENTS.md block. Dropping two of three may be enough for AgentKit before any general mechanism exists. Measure which readers load which copy per agent CLI first.
5. **Host limits.** Codex reads at most 32 KiB of AGENTS.md; this file is 54 KB. A general mechanism should be judged by what it does for that limit.

## What the shaper does first

Read the prior art (ACE, ASC, the projection in `src/`/`packages/`, `owner-approval-ace-boundary.md`), list every outside block with size and writer, check per agent CLI which files are read, then bring the owner the options with their measured cost.
