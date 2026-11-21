---
id: p-rnruofhvvi
title: The host lists retired flags in its unknown-flag text; Node leaves them out (host routing, priority low, must land before any Work verb ports; needs OPC review)
status: proposed
priority: P3
area: platform-foundations
created: 2026-11-21
---

# Why

Node's `unknownFlagMessage` (`src/cli/flag-check.mjs:49`) leaves `retiredFlags` out of the "Valid flags" list, but the generated projection (`acceptedFlags` in `scripts/export-command-selectors.mjs`) includes them, so a native host would list them, for example `--tier` on `add`, `submit`, `discover` and `edit`. No S2 or S3 verb has `retiredFlags`, so it cannot trigger today.

# Done when

The generator projects a `retired_flags` list (or drops retired flags from the printed list while still accepting them), so the host text matches Node byte for byte, with a test over a verb that has a retired flag.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
