---
id: p-slv7twfhtz
title: "`node scripts/project-agents.mjs` refuses the whole run when one unstamped file sits in its output directory (agent projection, priority low-to-medium: a normal-entry-point gap with a known workaround, but it blocks every regeneration until fixed)"
status: proposed
priority: P3
area: platform-foundations
created: 2026-11-21
---

# Why

`projectAll` checks every target and throws if any existing `.claude/agents/*.md` lacks the generated stamp, writing nothing. `.claude/agents/code-reviewer.md` is owned by AgentKit and carries no stamp, so the run aborts for every file. The four stale files of p-bazzipipk5 were regenerated only by calling the exported `projectAll` with exactly their four definitions. The script should leave unstamped files alone, write only the files it owns, and name the skipped ones, instead of refusing everything.

# Done when

`node scripts/project-agents.mjs` with an unstamped file present regenerates the generator-owned files, names each skipped file, and a test proves it.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
