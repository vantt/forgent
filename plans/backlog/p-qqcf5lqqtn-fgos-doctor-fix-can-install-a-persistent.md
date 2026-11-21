---
id: p-qqcf5lqqtn
title: "`fgos doctor --fix` can install a persistent mailbox sync timer that runs a binary taken from the project tree"
status: proposed
priority: P2
area: agent-mailbox
created: 2026-11-21
---

# Why

`src/setup/managed-timer.mjs` writes into a systemd unit or launchd plist `<cwd>/.fgos/installation/bin/fgos`, else `resolveFgosBin` tiers 1 to 3 (`<cwd>/bin/fgos.mjs`, the first `node_modules/.bin/fgos` walking up, a PATH probe); a cloned project whose committed config turns cross-machine mail on gets that binary run on a schedule. `quote()` escapes only `"` and `\`, so a newline or `%` in an interpolated value is not refused.

# Done when

The timer names only the release the machine store holds for the project's activation (the launcher's rule), never a tier-0 shim or tiers 1 to 3; every interpolated value with a control character or `%` is refused; one test per refusal

# Notes

Migrated from the legacy backlog table. Original status: proposed.
