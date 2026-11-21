---
id: p-sozeraj6zq
title: "The seat binding picked a gemini seat for the secretary head (Miu) when the owner wants claude sonnet (seat binding, priority medium; source: owner 2026-11-18)"
status: proposed
priority: P2
area: seat-binding
created: 2026-11-18
---

# Why

On first start of Miu the binding chose gemini. Find the exact reason (config, prefer order, fallback, probe result) and find the way to make claude sonnet the default for head sessions.

# Done when

The cause is proven from config and binding code with evidence; a config change (not a code branch) makes a new `fgos head start secretary` bind claude sonnet by default; the owner is told which file holds the setting.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
