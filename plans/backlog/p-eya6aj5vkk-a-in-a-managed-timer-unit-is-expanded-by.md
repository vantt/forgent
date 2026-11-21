---
id: p-eya6aj5vkk
title: A `$` in a managed timer unit is expanded by systemd even inside quotes (packaging, priority low; needs OPC review)
status: proposed
priority: P3
area: platform-foundations
created: 2026-11-21
---

# Why

systemd expands `$` in `ExecStart=` and `Environment=` values even inside quotes, so a project path or binary path that holds `$` produces a unit that runs something else. The Node timer writer (`src/setup/managed-timer.mjs`) and the Rust `timer.rs` (S4) share the gap.

# Done when

Both writers refuse a `$` in a value or escape it as `$$`; one test per writer proves it; the rule is stated once in the packaging spec.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
