---
id: p-5d2e1c9a
title: 18 tests fail on a clean main on a machine whose umask is 002
status: proposed
priority: P2
area: test
created: 2026-10-22
---

# Why

Measured 2026-10-22 on the owner's main machine (main `41595ecc3`, clean detached worktree): 17 tests in `test/rust-host/fgctl-init-download-sources.test.mjs` and `fgctl-upgrade.test.mjs` fail with `untrusted-driver-directory: …/state mode 0775 … group/world writable` (the fixtures create directories under the process umask, and the Git component refuses a group-writable driver directory); `codex's cli-bypass invocation consumes model placeholder` in `test/runner/dispatch.test.mjs` fails with `pool-unusable` because it reads this machine's real config. Found while landing the config fixture helper (`plans/reports/phase-261022-1548-cfg-slice-a-fixture-helper.md`).

# Done when

The fixtures create the directories they hand to the Git component with an explicit mode, so the suite is green under umask 002 and 022; the dispatch test reads no machine config; one run under each umask recorded.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
