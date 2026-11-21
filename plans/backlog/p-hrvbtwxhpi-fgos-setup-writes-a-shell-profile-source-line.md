---
id: p-hrvbtwxhpi
title: "`fgos setup` writes a shell-profile `source` line that points into a temporary directory (setup, priority low; found 2026-11-17)"
status: proposed
priority: P3
area: packaging-distribution
created: 2026-11-17
---

# Why

`~/.zshrc` line 475 sourced `/tmp/sacr/scripts/fgos-shell-integration.sh`: setup had once run from a clone under `/tmp` (a tmpfs, since wiped), and every new shell printed `no such file or directory`. `integrationScriptPath()` (`src/setup/registrations.mjs:307`) refuses only a copy outside any git checkout; its own comment says an ephemeral location is not worth writing into a profile, but a git checkout under the temp directory passes. The owner's line was repaired by hand the same day (backup `~/.zshrc.bak-261117-miu`).

# Done when

`integrationScriptPath()` returns `null` (no rc line written) when the main checkout lies under `os.tmpdir()` or another known ephemeral root, with one owning test; `fgos doctor` reports a profile `source` line whose target file is missing, and setup or uninstall repairs only its own marked line.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
