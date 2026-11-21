---
id: p-5x37olszki
title: "`fgos session` ignores `--dir` (host routing, priority low; an accepted bug fix, needs OPC review)"
status: done
priority: P3
area: platform-foundations
created: 2026-11-19
---

# Why

Node's session verb used the caller's cwd as its root and ignored `--dir`; the native port keeps that for parity, so it asks the root door itself and carries one debt entry on the "resolve the invocation root" row, plus an optional `cwd` on `invokeHost`. **Closed 2026-11-19, obsolete:** the per-session worktree verb this row is about is retired (plan `plans/261118-0947-session-verb-for-agent-sessions/plan.md`); `fgos session` is now the head-session verb. Leftover: `invokeHost`'s `cwd` option has no production caller left (only `test/util/host-bin.test.mjs`).

# Done when

`session` honours `--dir` like every other verb; the debt entry, the verb's own root-door call and `invokeHost`'s `cwd` option are deleted.

# Notes

Migrated from the legacy backlog table. Original status: done.
