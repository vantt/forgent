---
id: p-6tmbvyt2zx
title: "Codex and agy sessions opened by hand get no start context: their SessionStart rows only register the session (agent-start-context, priority low; source: plan 261122-1946-agent-start-context phase 10, 2026-11-27)"
status: proposed
priority: P3
area: agent-start-context
created: 2026-11-27
---

# Why

Phase 10 of plan 261122-1946 gave a Claude Code session opened by hand its composed start context, through the existing `hook session-rotation --event session-start` row, which prints Claude's `hookSpecificOutput.additionalContext`. The codex and agy rows in `packages/distribution/contracts/agent-hooks.v1.json` only run `identity session --register` at SessionStart. Nothing in the repository shows how either CLI takes context from a SessionStart hook, so a row printing the wrong shape could break their sessions; no row was added.

# Done when

The SessionStart output shape of codex and agy is confirmed from their documentation or a live probe. Each CLI gets a SessionStart row that prints the composed hand-opened context in that shape, with `agentCli` set to the CLI. The hook-table golden vectors and `test/setup/agent-hooks.test.mjs` cover the rows.
