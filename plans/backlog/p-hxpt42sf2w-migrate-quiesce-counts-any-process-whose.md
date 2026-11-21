---
id: p-hxpt42sf2w
title: Migrate quiesce counts any process whose command line names the workspace as a writer
status: proposed
priority: P2
area: holder-lock
created: 2026-10-25
---

# Why

The holder-lock `quiesce-scan` route behind `event-store-writers-active` matches processes by their argv (`packages/holder-lock/rust/src/route.rs:389-411`), so an `fgos run` in another repo whose prompt mentions `mdview` blocked mdview's cutover on design-lap (board log 2026-10-25 12:58). Owner 2026-10-25 16:37: HARDEN owns it. An old release's `fgctl upgrade` is also blocked by the shell that launched it (`git-predecessor-writer-live`) unless run through `exec` (`packages/distribution/rust/src/git_gate.rs`).

# Done when

A process counts as a writer only by its working directory or open store files inside the workspace, never by its argument text; the launching shell does not block the upgrade it runs; one proof each at the lowest layer that owns the process scan

# Notes

Migrated from the legacy backlog table. Original status: proposed.
