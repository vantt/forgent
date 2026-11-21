---
id: p-vhofak3qik
title: Managed timer rendering is not host-independent (packaging, priority low)
status: proposed
priority: P3
area: packaging-distribution
created: 2026-11-21
---

# Why

`timer.rs` documents that both platforms' units are rendered and tested on any host, but the paths and the unit label hash come from host `Path` operations, so five tests only hold on Unix hosts.

# Done when

Rendering takes the target platform's path rules; the five tests run on every host.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
