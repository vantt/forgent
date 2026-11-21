---
id: p-hyjxtludoy
title: "`fgos config explain` does not show the global value of a `both`-scope key"
status: done
priority: P2
area: config
created: 2026-11-09
---

# Why

Repro, 2026-11-09, from branch `cook/cook-skill-from-machine-config`: `npm run fgos:dev -- config explain runner.executors.claude.supports.skills` with `supports.skills: ["ak:cook"]` declared for the executor in `~/.fgos/config.yaml` and no value in the shipped standard prints `current: null`, `file: null`, `standard: null`, while `fgos config show --json` reports `data.value.runner.executors.claude.supports.skills` as `["ak:cook"]` and `fgos config check` reads the global lines.

# Done when

`explain` reports the effective value and the file it comes from for a key of scope `both` that only the global file sets; the owning test is `explain_names_the_layer_of_a_list_or_mapping_that_only_the_global_file_sets` in `packages/config/rust/tests/inspect_verbs.rs` (origins are recorded per leaf and `explain` had matched the exact path; it now reads them through the rule `show` uses).

# Notes

Migrated from the legacy backlog table. Original status: done.
