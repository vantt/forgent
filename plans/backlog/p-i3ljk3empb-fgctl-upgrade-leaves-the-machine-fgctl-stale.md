---
id: p-i3ljk3empb
title: "`fgctl upgrade` leaves the machine fgctl stale when run from another fgctl binary (packaging-distribution, priority medium)"
status: proposed
priority: P2
area: packaging-distribution
created: 2026-11-19
---

# Why

On 2026-11-19 lead:OPC ran `fgctl upgrade` with a cargo-built fgctl; `refresh_fgctl` compares the RUNNING binary (current_exe) to the release and reported 'up to date', so ~/.local/bin/fgctl stayed at release 4685ac59 (before the WAL intent change). That fgctl then refused later upgrades with `git-wal-unreadable` (it cannot read blob-form intents) and would have blocked a rollback. Fixed by hand from release ae71ed18 (prev kept as fgctl.prev).

# Done when

`refresh_fgctl` judges and refreshes the machine fgctl path (the installed shim location), not current_exe; a test runs upgrade from a different fgctl binary and asserts the machine fgctl matches the release.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
