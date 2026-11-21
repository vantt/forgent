---
id: p-2r54ft6njh
title: Eight production copies of the verbatim-path helper; fold them onto `fgos_process::path` (one door, priority medium; needs OPC review)
status: done
priority: P2
area: packaging-distribution
created: 2026-11-21
---

# Why

`fgos_process::path::plain_path` is now the one spelling of a Windows `\\?\` drive path (UNC stays verbatim) and `fgos_git` and `fgos_identity` call it. Still hand-written: `packages/distribution/rust/src/workspace.rs:59`, `verify.rs:333`, `agent_hooks.rs:317` (it turns `\\?\UNC\h\s` into the relative `UNC\h\s`, a bug), `apps/fgos/src/legacy_exec.rs:305`, `apps/fgos/src/wiring/doctor/bridge.rs:185` and `packages/holder-lock/rust/src/windows.rs:235`; three test copies (`test_scratch.rs`, `invocation_doors.rs` `plain`, `apps/fgctl/tests/uninstall_surface.rs`) also fold.

# Done when

Every caller uses `fgos_process::path`; the copies are deleted; a one-door row guards the strip.

# Notes

Migrated from the legacy backlog table. Original status: done.
