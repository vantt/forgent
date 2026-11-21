---
id: p-3e6b1a52
title: Remove `legacyPersonaProjection` from `src/runner/dispatch/assignment.mjs`
status: done
priority: P2
area: general
created: 2026-11-21
---

# Why

Remove `legacyPersonaProjection` from `src/runner/dispatch/assignment.mjs`

# Done when

no resumable record can carry pinned text only the legacy reader renders (pinned text comes only from `resolveAgentDefinition`, which refuses unparsable text, and a resume needs `seatSchema` 1 or later); the reader, its fallback and the three tests that pinned it are gone, and a pinned persona takes the parser path of a fresh one (`b647cb2c8`).

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
