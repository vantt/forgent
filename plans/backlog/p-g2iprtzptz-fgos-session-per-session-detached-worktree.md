---
id: p-g2iprtzptz
title: "`fgos session` (per-session detached worktree) duplicates `fgos worktree` and holds the name the head-session door needs; investigate thoroughly, then merge or retire it and rename `fgos head` to `fgos session` (runner, git and Work paths, priority high; owner 2026-11-17)"
status: done
priority: P1
area: runner
created: 2026-11-17
---

# Why

`fgos session start|end|list|gc` (Rust host `apps/fgos/src/wiring/session.rs`, Node reader `src/runner/session.mjs`) opens a detached-HEAD worktree with a `.fgos` symlink and records it in `.fgos/sessions.json`; its readers are the Work-side merge (`src/runner/merge.mjs`), approve (`src/verbs/merge/approve.mjs`) and post-land drift (`src/state/postland-drift.mjs`). On 2026-11-17 the registry in the main checkout was empty and no skill or script called the verb, while every lead, shaper and planner session made its checkout with `fgos worktree create`. The secretary plan (`plans/261117-1856-secretary-session-spine`) therefore names its head-session door `fgos head start|rotate` provisionally, because `session` is taken (`docs/discussions/secretary-miu/DISCUSSION.md`). **Done 2026-11-19:** the worktree lifecycle is retired with every reader (`fgos worktree create|remove` is the one checkout door) and `fgos head` is renamed `fgos session`; plan `plans/261118-0947-session-verb-for-agent-sessions/plan.md`, integration proof `plans/261118-0947-session-verb-for-agent-sessions/reports/integration.md`.

# Done when

A written investigation (prior art via `git log -S`, every caller including tests, skills, docs and the Work paths, what `fgos worktree` already covers and what it lacks) decides merge into `fgos worktree` or retire; the chosen change moves every caller and deletes the old path in one change (L10); then the head-session verb is renamed `fgos session` with every caller, doc and test moved and no `fgos head` alias left; `npm test` and `cargo test --workspace` green.

# Notes

Migrated from the legacy backlog table. Original status: done.
