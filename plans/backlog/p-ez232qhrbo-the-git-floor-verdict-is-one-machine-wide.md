---
id: p-ez232qhrbo
title: The Git floor verdict is one machine-wide record, so every differently built `fgos` evicts the others' (Git, priority medium)
status: proposed
priority: P2
area: platform-foundations
created: 2026-11-21
---

# Why

`~/.local/state/fgos/git-floor-verdict.json` is keyed on a digest of `packages/git/rust/src/driver.rs`. Each worktree build, the pre-release base against a new build, and the dev host against the release host overwrite each other's record, so the cold probe (about 52 processes, 22 `bwrap`, about 60 ms) repeats on every switch. Measured in `plans/261114-2051-rust-verb-migration-program/reports/research-261115-0255-f0-version-latency-ab.md`; the biggest of four related costs and the real one on a machine with several builds. Needs `lead:OPC` review: it touches `fgos-git`.

# Done when

The record keeps one verdict per key, so switching builds no longer re-runs the probe; a test proves two keys coexist; the latency report's cold figure drops to the warm one (about 21-23 ms for `version`).

# Notes

Migrated from the legacy backlog table. Original status: proposed.
