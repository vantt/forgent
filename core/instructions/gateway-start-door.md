---
id: gateway-start-door
kind: procedure
owner: core
scope: repo
mode: append
specificity: 10
title: Gateway Start Door
description: Start the fgos gateway only through fgos gateway start, never a hand-rolled process
lifecycle: live
valid_from: 2026-11-26
when:
  sessionType:
    - head
    - hand-opened
---

# Starting the fgos gateway — one door, never a raw process

**If a task needs the fgos gateway (REST API + web dashboard, binary `fgos-gateway` built from `apps/fgos-gateway`) running, run `fgos gateway start` — never a hand-rolled `cargo run`/`nohup`/`tmux`/systemd invocation.** This is the one place that builds the release binary and spawns it detached, so the process outlives the CLI call. `fgos gateway status` reports real liveness plus an actual `/v1/contract` reachability check; `fgos gateway stop` sends SIGTERM and clears the registry. The gateway's own MCP surface (`search`/`execute`, `apps/fgos-gateway/src/mcp.rs`) is mounted on this SAME process — it cannot bootstrap itself, so starting the gateway is always a `fgos` CLI call, never an MCP tool call.
