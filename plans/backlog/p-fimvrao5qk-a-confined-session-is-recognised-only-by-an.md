---
id: p-fimvrao5qk
title: A confined session is recognised only by an environment marker the worker can remove
status: proposed
priority: P2
area: identity
created: 2026-10-25
---

# Why

The bwrap driver sets `FGOS_CONFINED=1` and the Config door's `session_class` (`packages/config/rust/src/session.rs`) treats a session as confined only when that variable is `1`, so a confined worker that unsets it is classed unconfined and the config write refusal no longer applies to it. The mount view stays the real boundary (a confined worker does not see `~/.fgos/private`), so this is hardening, not an open hole. Recorded as idea I6 of the Slice C plan (`plans/261023-1649-yaml-config-slice-c-node-door-cutover/plan.md`); owner 2026-10-25 14:1x: record it, do not build it now.

# Done when

The confined fact comes from the operating system (a namespace or process-tree fact, owned by `fgos-identity`) rather than from an environment variable; a confined worker that unsets `FGOS_CONFINED` is still classed confined; the owning proof runs a real bwrap worker that unsets the marker; one door replaces the marker read and the old path is deleted (L10)

# Notes

Migrated from the legacy backlog table. Original status: proposed.
