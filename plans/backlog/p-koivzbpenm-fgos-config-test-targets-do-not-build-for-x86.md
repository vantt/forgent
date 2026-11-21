---
id: p-koivzbpenm
title: "`fgos-config` test targets do not build for `x86_64-pc-windows-msvc` (config, priority low; needs OPC review)"
status: proposed
priority: P3
area: platform-foundations
created: 2026-11-21
---

# Why

`cargo check -p fgos-config --tests --target x86_64-pc-windows-msvc` fails with E0433 on `migrate`, a Unix-only module used by the crate's tests; the library itself checks clean. CI runs Windows tests but not Windows clippy or a check of every crate's test targets, so it went unseen (found in the S4 config, identity and observe doctor-rows review).

# Done when

The `fgos-config` test targets build for msvc (the Unix-only test code is cfg-gated), and the msvc check of every touched crate includes `--tests`.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
