---
id: p-abazvjazgt
title: doctor --fix never converges on an unactivated project (packaging, priority low; found by the S4 facts phase)
status: proposed
priority: P3
area: platform-foundations
created: 2026-11-21
---

# Why

The WAL fix refuses with git-fence-missing and the hook rows stay shim-missing, so next stays ["fgos doctor --fix"] after any number of runs on a project that is not activated.

# Done when

A run of doctor --fix on an unactivated project either converges or says plainly that activation comes first, and stops suggesting itself.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
