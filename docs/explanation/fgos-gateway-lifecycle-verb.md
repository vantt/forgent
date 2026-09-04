---
authoritative_for: fgos gateway start/stop/status — the one-door verb for launching/stopping/checking the herdr-fgos gateway (REST API + web dashboard) as a detached background process, replacing hand-rolled nohup/tmux/systemd, motivated by the chicken-and-egg constraint that the gateway's own MCP search/execute tools are mounted on its own router and so cannot bootstrap the gateway itself — this is the origin of the mandatory doctrine AGENTS.md now names
---

# Why the gateway needs its own CLI door, not a hand-rolled background process

`tsk-31v` added `fgos gateway start|stop|status`, giving any agent working
in this repo a single door to launch, stop, or check the herdr-fgos
gateway (REST API + web dashboard, `herdr-plugin/src/gateway.rs`) as a
detached background process — without hand-rolling
`nohup`/`tmux`/systemd.

## The chicken-and-egg constraint that made this necessary

The gateway's own MCP surface (`mcp.rs`'s `search`/`execute` tools) is
mounted on the gateway's own router — it cannot be used to start the
gateway itself. There is no MCP-tool path to bootstrapping this process;
some other single, standard mechanism has to exist outside the gateway to
bring it up. This is the standing instruction the user asked for after
confirming that constraint directly.

## What shipped

A new process registry (`.fgos/gateway.json`: pid, port, startedAt,
logPath) and PID-liveness check, modeled on `src/runner/session.mjs`'s
existing pattern (`isPidAlive`, lock-guarded registry read/write) — a new
module, `src/runner/gateway-control.mjs`:

- **`start`** — builds the release binary if missing or stale, then spawns
  it detached (`child_process.spawn`, `detached: true`, `unref`, stdout/
  stderr redirected to a log file), refusing if already running.
- **`stop`** — sends `SIGTERM` to the recorded pid and clears the registry
  entry.
- **`status`** — reports pid/port/uptime/liveness plus a real
  curl-equivalent reachability check against `/v1/contract` (not just PID
  liveness — a process can be alive but not actually serving).

A read-only `herdr-gateway-running` check was registered in `fgos
doctor`'s check registry (`src/setup/checks.mjs`), reporting current
liveness — informational only, no new config default needed since it
reads the existing `gateway.token`/`port`/`bind` from `~/.fgos/config.json`
rather than adding anything new to merge into `fgos setup`.

## The mandatory doctrine this item planted

A short doctrine line was added to `AGENTS.md` (near the existing
"Dispatch" section's always-run-this-first convention) instructing any
agent that needs the gateway/web dashboard running to run
`fgos gateway start` rather than a raw `cargo run`/`nohup` — the same
line this repo's own `AGENTS.md` still carries today: "**If a task needs
the herdr-fgos gateway ... running, run `fgos gateway start` — never a
hand-rolled `cargo run`/`nohup`/`tmux`/systemd invocation.**"
