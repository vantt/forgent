---
id: p-68be2ae3
title: "`fgos doctor --fix` is all-or-nothing and can disturb working configs"
status: proposed
priority: P2
area: general
created: 2026-10-16
---

# Why

Owner report (2026-10-16): `--fix` hangs, and has damaged configs that were working. Code facts: `--fix` runs every registered fix (22 today, `src/setup/registrations.mjs` `registerFix`), including writes into other tools' configs (`codex-hook-wired`, `agy-hook-wired`, `omp-hook-wired`, `pi-hook-wired`, `agy-permissions-configured`, `claude-plugin-marketplace`) and cleanup (`confinement-orphaned-resources-reaped`, `credential-copies-retained`); there is no way to run one fix, no dry run, no backup. The JSON writers skip a malformed file (`src/setup/agent-hooks.mjs:107-108`) but otherwise rewrite the whole file with `JSON.stringify` (`agent-hooks.mjs:35-37`), so formatting and anything outside the touched key are re-serialized. Owner expectation: a fix only repairs what is wrong, keeps every existing setting, and when a file is syntactically broken it reports the syntax error (file, line, column) instead of guessing.

# Done when

`fgos doctor --fix <check-id>` runs one fix; `--fix --dry-run` prints the exact change per file; every fix that edits a file makes a minimal key-level edit, keeps a timestamped backup, and leaves unrelated keys, ordering and formatting intact (golden tests on real-world config samples); a file that does not parse is reported with file, line and column and left untouched; each fix has a time limit and reports which fix is still running instead of hanging

# Notes

Migrated from the legacy backlog table. Original status: proposed.
