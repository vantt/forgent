---
id: p-xagoeec2i4
title: "`fgctl`'s exit 2 means two things (Packaging, owner decision after the release)"
status: proposed
priority: P2
area: packaging-distribution
created: 2026-11-21
---

# Why

`fgctl`'s usage-error exit is the constant `EXIT_USAGE = 2` in `apps/fgctl/src/help.rs`, while the exit-code table (`packages/host-runtime/contracts/exit-codes.v1.json`) gives usage errors `validation` (4) and 2 to `precondition`, which `fgctl init`, `upgrade` and `repair` also use for "activated but not ready". The help now says so, and `fgos` already uses 4 for usage errors. Moving `fgctl` usage errors to 4 follows the table but changes a code that `apps/fgctl/tests/cli_surface.rs` and scripts pin.

# Done when

One meaning per exit code across `fgctl` and `fgos`, or a recorded reason to keep the packaging standard's 2 for usage errors.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
