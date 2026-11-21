---
id: p-dygylbfj5r
title: "`fgos-identity` test targets do not compile without its default features (identity, priority low; needs OPC review)"
status: proposed
priority: P3
area: platform-foundations
created: 2026-11-21
---

# Why

`cargo test -p fgos-identity --no-default-features` fails because `tests/shared.rs` imports modules gated behind the `directory` feature; the library builds without them (fgctl links it that way) but its test targets never get built in that configuration, so a library change that breaks the minimal build is only seen when fgctl is built. Found in the S4 config, identity and observe doctor-rows review.

# Done when

The test targets are cfg-gated so they build under every feature set the crate ships, or CI builds fgctl's feature set (`cargo check -p fgos-identity --no-default-features`), so the minimal build cannot break unseen.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
