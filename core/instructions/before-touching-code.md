---
id: before-touching-code
kind: procedure
owner: core
scope: repo
mode: append
specificity: 10
title: Before Touching Code
description: Read the reading map and the area spec before the code, and find the prior art of a mechanism before designing it
lifecycle: live
valid_from: 2026-11-26
related:
  - "[[convention-paths]]"
---

# Before Touching Code

Read `docs/reading-map.md`, then the area or subcomponent spec under `docs/platform/` for whatever
you're about to change. Specs are the state layer — BA-grade, tech-agnostic — read
the spec before the code.

**Prior art before design.** Before designing a mechanism, find out what already existed
and why it went away: `git log -S'<symbol>'` / `-G` on the symbol, config key and spec term,
also under the executor ids and names the thing had before the renames (ids were renamed and
dormant ones deleted), and read the area spec's "Lịch sử quyết định" and settled-facts
sections. A plan's facts phase answers "what existed before, and which change removed it,
and was that intended?" next to its questions about current code. Reuse or extend what is
found; say in the plan what was reused and what was missing.
