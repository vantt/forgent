---
id: p-zsy3fmbcpd
title: Work and the Event Store refuse on macOS
status: proposed
priority: P2
area: event-store
created: 2026-11-21
---

# Why

The Event Store is Linux-only by design (`src/event-store/native.mjs`), so on macOS every Work verb and `fgos events` refuse with `event-store-unsupported-platform`, although fgOS otherwise supports macOS. Enabling it means giving the store darwin durability and lock semantics (`F_FULLFSYNC` for fsync, the macOS lock behaviour) and running the event-store crate and Work tests on CI's real `macos-latest` runner, which CI already has (`.github/workflows/holder-lock-cross-platform.yml`, `process-containment.yml`). Only the power-loss proof needs a real Mac. Raised by the HARDEN T3-04b platform review (arbitration §2, owner decision 34 in the HARDEN plan).

# Done when

On macOS the Event Store admits writes and Work verbs run; appends and seals use `F_FULLFSYNC`; the event-store crate tests and the Work tests pass on `macos-latest` in CI; the power-loss proof is run on a real Mac and recorded; until then the refusal stays and names macOS

# Notes

Migrated from the legacy backlog table. Original status: proposed.
