---
id: p-ato5756utm
title: The Codex and agy `dispatch-decide` and `decision-question` hook registrations still fail every Agent call when the project shim is gone (Packaging, priority low)
status: proposed
priority: P3
area: packaging
created: 2026-11-21
---

# Why

Claude Code's two registrations now start with `[ -x "$S" ] || exit 0` (`claudeGuardedHookCommand` in `src/setup/agent-hooks.mjs`), so a project whose `.fgos/installation` was removed by hand or by `fgctl uninstall` lets the call through. The Codex rows (`'<shim>' hook dispatch-decide`, `hook decision-question`) and the agy rows (`--format=agy`) in the same table stay bare; the delete guard on both already uses the wrapped `/bin/sh -c '...' sh <shim>` form. Not done with the Claude change because the audit scoped it to Claude Code and the mailbox row comment records that wrapping changes the process topology a hook sees. Measure first that the verdict and exit code of each kind still reach Codex and agy through the wrapper (agy's missing-shim answer is `{"decision":"allow"}`, as the delete guard prints), then guard the four rows, extend `scripts/check-hook-registrations-guarded.mjs` to `.codex/hooks.json` and `.agents/hooks.json`, and keep `commandIsKind` recognising the old bare form so `fgos doctor --fix` replaces it in place.

# Done when

A project without its shim never fails an agent call on any of the three agent CLIs, and one test proves it per CLI.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
