---
id: p-mqflawmhp6
title: "A confined read of the question store tries to install the cache view (questions, priority low; source: lead:SECRETARY-CAPS live grant audit of plan 261119-1615 phase 7 from the secretary's sandbox, 2026-11-19)"
status: proposed
priority: P3
area: questions
created: 2026-11-19
---

# Why

`fgos questions show` from a confined head succeeds but warns `questions.json: durable install failed ... Read-only file system`: a read verb tries to install the per-machine cache view inside the sandbox, which is read-only there.

# Done when

A confined read of the question store never writes the cache view; it renders without installing, with no warning; an owning test runs a read verb against a read-only cache location.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
