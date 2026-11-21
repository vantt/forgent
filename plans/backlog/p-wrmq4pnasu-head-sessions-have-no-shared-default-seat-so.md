---
id: p-wrmq4pnasu
title: "Head sessions have no shared default seat, so every persona without its own `runner.personas` entry binds gemini (seat binding, priority medium; source: owner 2026-11-18, answer B to the per-persona config question)"
status: proposed
priority: P2
area: seat-binding
created: 2026-11-18
---

# Why

`bindHeadSeat` falls back to `capabilities.execute.prefer`, where gemini is first. Only `secretary` got its own entry (commit 575f36c15). `planner`, `debugger`, `researcher`, `code-reviewer`, `docs-manager` and `fullstack-developer` still resolve to gemini.

# Done when

One default for head sessions (a role or capability level setting in the config door, not six persona copies) makes a new head bind claude sonnet unless its persona says otherwise; proven by a real bind of a persona without its own entry; the owner is told where the setting lives. Related: p-sozeraj6zq.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
