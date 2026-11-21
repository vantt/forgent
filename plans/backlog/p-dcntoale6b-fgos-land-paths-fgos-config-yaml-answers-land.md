---
id: p-dcntoale6b
title: "`fgos land --paths .fgos/config.yaml` answers `land-paths-empty` (git + supervision, priority medium; seen 2026-11-19)"
status: proposed
priority: P2
area: git
created: 2026-11-19
---

# Why

The scoped commit drops every `.fgos/` path as the fgOS store (`packages/git/rust/src/scoped_commit.rs` `is_store_path`), but the project config `.fgos/config.yaml` is a tracked file under the config spec, so a config change cannot land through the door (committed by hand in 19b10a0da) and the refusal says "no changes" instead of naming the excluded path.

# Done when

Tracked project files under `.fgos/` that the config spec owns (at least `config.yaml`) land through `fgos land --paths`, or the door refuses them by name with a code that says why; decided with the Git reviewer, proven by a land test.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
