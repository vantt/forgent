---
id: p-yahseaukly
title: Three places still format a process start time themselves (one door, priority low)
status: proposed
priority: P3
area: platform-foundations
created: 2026-11-21
---

# Why

`fgos_process::StartTime`'s `Display` is the one string form, but `facts.rs` `identity_of` (Linux), `containment/linux.rs:454` and Windows `signal_by_identity` format their own strings. The bytes match today, so nothing is wrong yet; a change to one form would split them.

# Done when

All three format through `StartTime`, and a vector test owns the string form.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
