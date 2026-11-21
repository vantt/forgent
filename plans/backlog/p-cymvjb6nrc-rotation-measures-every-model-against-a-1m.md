---
id: p-cymvjb6nrc
title: Rotation measures every model against a 1M window (session rotation, priority medium; suspected)
status: done
priority: P2
area: session-rotation
created: 2026-11-19
---

# Why

Miu runs on sonnet-5-5 with no context-sidecar file; usage is judged against `windowSize` 1,000,000. If that model's window is 200k, gen 3's 128.6k tokens were 0.64 and should have triggered a soft rotation, not 0.13. Evidence: `plans/reports/debugger-261118-2130-miu-early-hard-rotation.md`. **Closed 2026-11-19, not a bug:** the secretary head runs `claude --model sonnet` = `claude-sonnet-5-5`, whose window is 1M, as are all head models the config can reach (haiku, sonnet, opus, fable 5.x); proof `plans/261118-0947-session-verb-for-agent-sessions/reports/phase-09.md`.

# Done when

Prove the model's window; the measure takes the window per model (or from the sidecar) and a test covers a 200k model.

# Notes

Migrated from the legacy backlog table. Original status: done.
