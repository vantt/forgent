---
id: p-tgqxcemygh
title: Retiring `fgos setup` removes the last project-copy surface of skills, and the packaged file list names the vendor skills
status: done
priority: P2
area: packaging-distribution
created: 2026-11-16
---

# Why

`materializeSkillsIntoProject` and `createProjectSkillGuard` (`src/setup/skill-wrappers.mjs`, one caller at `bin/fgos.mjs`) are the only code that copies fgOS skills into a project and the only place a foreign directory that carries fgOS's own generated marker is treated as fgOS's; both go with the setup retirement. Separately, the `package.json` `files` list names `.agents/skills`, so `npm pack` on a machine that holds the git-ignored vendor skills there packs them (1 747 files measured at the T8 council); the package is `"private": true` and the release path already excludes ignored bytes (`packages/distribution/rust/src/source_payload.rs` (`inside_a_repository_only_tracked_and_untracked_non_ignored_files_…`)), so this is latent. Closed 2026-11-16: `materializeSkillsIntoProject` and `createProjectSkillGuard` are deleted with `fgos setup` (S4); the packed-file-list half of this row was not part of that change and is not closed by it.

# Done when

`rg -n "materializeSkillsIntoProject|createProjectSkillGuard" src bin` finds nothing in the same change that retires `fgos setup`; the packed file list is computed from the release payload rule, with no kit name written in it.

# Notes

Migrated from the legacy backlog table. Original status: done.
