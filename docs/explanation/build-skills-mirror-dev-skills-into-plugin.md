---
authoritative_for: npm run build:skills mirroring .agents/skills into plugins/fgOS/skills, mirrorDevSkillsIntoPlugin
---

# `npm run build:skills` now auto-syncs `plugins/fgOS/skills`

`tsk-5zi` closed a double-maintenance gap: `plugins/fgOS/skills/<name>`
is a full, self-contained copy (not a thin-wrapper like `.claude/skills`,
since the marketplace publish channel must be self-contained when
installed elsewhere — no `.agents/skills` sitting alongside it to
redirect to) — but nothing synced it automatically. Anyone editing
`.agents/skills/<name>` had to remember to hand-copy the change into
`plugins/fgOS/skills/<name>` too.

## Confirmed real, not theoretical

A live incident (2026-08-20, dispatching `fgos-coding-implement`
out-of-process for `tsk-3av` via `agy`) hit exactly this gap: the worker
synced `.agents/skills/fgos-fanout/SKILL.md` but never touched
`plugins/fgOS/skills/fgos-fanout/SKILL.md` — `npm run build:skills`
didn't copy it there either. A person had to run `build:skills` plus a
manual `cp` to fix it.

## What shipped

`mirrorDevSkillsIntoPlugin(agentsSkillsRoot, pluginSkillsRoot)`
(`src/setup/skill-wrappers.mjs`) reuses the same `copyDirRecursive`
helper `materializeSkillsIntoProject` already used for a different sync
job. It scans `.agents/skills/` for every `fgos-*` directory (the 14
dev-skills) plus `_shared/`, and mirrors each one into `plugins/fgOS/
skills/<name>` — now wired into `npm run build:skills`, so a normal
skill-authoring workflow keeps both copies in sync without anyone having
to remember the second location.
