---
id: p-7e41b0d3
title: The gateway's own dependency tree carries 7 open advisories
status: proposed
priority: P2
area: security
created: 2026-10-22
---

# Why

`cargo deny --manifest-path apps/fgos-gateway/Cargo.toml check advisories` fails on rustls TLS advisories, an unmaintained `smartstring` and a yanked `chacha20` (measured 2026-10-22 while moving the gateway off `serde_yaml`; identical with that change stashed). The gateway has its own `Cargo.lock` outside the workspace, and CI runs `cargo deny` only on the workspace, so nothing reports them.

# Done when

The gateway's lock passes `cargo deny check advisories bans sources`, or each remaining finding has a recorded reason; CI runs deny on the gateway manifest too.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
