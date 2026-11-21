---
id: p-ti7prrwace
title: A pane seat inherits the runner's environment, including `CLAUDE_CODE_MESSAGING_TOKEN`, against the worker env allowlist (Execution, priority high)
status: done
priority: P1
area: harden-t9-p28-e0efc3b62-workerbaseenv-is-an-allowlist-read-from-packages-run-supervisor-contracts-worker-env-allowlist-v1-json-canary-unit-proof-plus-pane-wiring-proof-left-drop-the-claude-code-force-session-persistence-workaround-from-the-claude-invocations-and-the-external-mode-gate-filtering-the-daemon-env-through-the-same-file-paseo
created: 2026-11-12
---

# Why

`workerBaseEnv` is meant to hand a worker only an allowlist, and the envelope's launch env shows one, yet the claude process of a `claude-herdr-bwrap` seat held `CLAUDECODE`, `CLAUDE_CODE_*` (messaging socket and token, session marker) and `HERDR_*` from the runner's own environment; unsetting them in the runner removed them from the seat (measured 2026-11-12 with `/proc/<pid>/environ` names, values never read). The marker `CLAUDE_CODE_CHILD_SESSION` switched transcript saving off in the pane; the claude invocations now set `CLAUDE_CODE_FORCE_SESSION_PERSISTENCE` as a workaround. Where the pane gets the environment from was not traced.

# Done when

A seat's process environment is the allowlist plus the invocation's declared env and nothing else from the runner, proven by a test that starts a seat from a runner holding `CLAUDE_CODE_MESSAGING_TOKEN` and reads the seat's environment names; the workaround env var is then removable.

# Notes

Migrated from the legacy backlog table. Original status: done.
