---
id: p-n22bigucgp
title: Two rules decide the user's home directory (one door, priority medium)
status: proposed
priority: P2
area: platform-foundations
created: 2026-11-21
---

# Why

`packages/holder-lock/rust/src/state_root.rs` (`home_from`, used by the state root and uninstall's purge guard) reads `HOME` first on every platform; `packages/config/rust/src/machine.rs` (the global fgOS directory) reads `USERPROFILE` on Windows. Under Git Bash on Windows, which sets `HOME`, the state root and the global directory can sit under different homes. Two edge narrowings of the purge guard ride on the same rule: an empty `HOME` and a non-UTF-8 `HOME` are treated as unset by `home_from`.

# Done when

One home rule in the lowest crate both already depend on, taking `OsString` and treating blank as unset; the state root, the global directory and the purge guard use it; the losing rule's debt entry on the doors row is gone; the Windows behaviour change is named in the CHANGELOG.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
