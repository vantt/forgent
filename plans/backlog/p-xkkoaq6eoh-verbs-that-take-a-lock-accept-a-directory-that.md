---
id: p-xkkoaq6eoh
title: Verbs that take a lock accept a directory that is not a project and create `.fgos` there (one door, priority high)
status: proposed
priority: P1
area: platform-foundations
created: 2026-11-19
---

# Why

The per-session worktree verb (retired 2026-11-19, plan `plans/261118-0947-session-verb-for-agent-sessions/plan.md`) used `process.cwd()` as its root without resolving one, and its registry reader took the sessions lock, creating `<cwd>/.fgos/locks/`; the same unresolved-root path stays open for any verb that takes a lock; under the `CallerTree` root policy (`packages/git/rust/src/invocation_root.rs`) a non-git cwd with no `.fgos` above resolves to itself (`found: false`) and nothing refuses. On 2026-11-15 a run from `/tmp` created `/tmp/.fgos` (sessions.lock 09:57, gateway.lock 10:08), after which every test fixture under `/tmp` treated `/tmp` as its project and 10 suite tests failed. A runner guard now refuses to start when a `.fgos` sits above the temp root; the cause is open.

# Done when

A verb that would create or lock state refuses with a named "no project here" error when the invocation root was not found, through the one root door (not per verb); `session` resolves its root through that door; read-only listing creates no `.fgos`; one test per refusal owner.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
