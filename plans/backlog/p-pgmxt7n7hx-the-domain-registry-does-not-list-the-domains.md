---
id: p-pgmxt7n7hx
title: The domain registry does not list the domains that exist, and an unsure classification defaults to `coding` (state and skills, priority medium; found 2026-11-17 in `docs/discussions/secretary-miu/DISCUSSION.md`)
status: proposed
priority: P2
area: core
created: 2026-11-17
---

# Why

`fgos-clarifying` reads the domain vocabulary from `src/state/domain-registry.mjs` (`coding`, `synthetic`, `triage`, `fixture-marketing`) while `domains/` holds `coding`, `council` and `marketing`; when nothing points elsewhere it returns `coding` (`core/skills/fgos-clarifying/SKILL.md`). The secretary must be domain-free: an unclear domain is asked, never assumed coding.

# Done when

The registry and `domains/` name the same domains from one source (or the difference is stated and tested); `fgos-clarifying` returns an explicit unsure verdict instead of `coding` when nothing fits, and its callers ask the person; one owning test for each.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
