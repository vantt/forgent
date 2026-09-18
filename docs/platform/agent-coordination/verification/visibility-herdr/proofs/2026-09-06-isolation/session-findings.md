# Worker isolation — separate herdr session, measured

Date: 2026-09-06 | herdr 0.8.2 | Session `fgos-probe`, created and destroyed within this run
Operator cockpit verified untouched: 18 panes before, 18 after; only `default` remains.

Follows [findings.md](findings.md), which proved a private HOME closes only one of the two
ways a worker reaches the operator's cockpit, and that `HERDR_SOCKET_PATH` cannot be
cleared or redirected through `--env`.

## The three questions, answered

**1. Can a named session start headlessly? YES.**

```
herdr --session fgos-probe server
  api socket:    ~/.config/herdr/sessions/fgos-probe/herdr.sock
  client socket: ~/.config/herdr/sessions/fgos-probe/herdr-client.sock
  logs:          ~/.config/herdr/sessions/fgos-probe/herdr-server.log
```

No TUI, no attach needed. `herdr session list` shows it beside `default`. Teardown is
`herdr session stop <name>` then `herdr session delete <name>`, and it left nothing behind.
herdr's own agent guidance already points here: *"Use named test sessions for experiments
that need an isolated server."*

**2. Does the isolation hold? YES for the default path, NO against a named path.**

| Check | Result |
|---|---|
| `pane list` / `workspace list` through the probe socket | **0 panes, 0 workspaces**, while the operator's session had 18 panes |
| env injected into a pane created in that session | `HERDR_SESSION=fgos-probe`, `HERDR_SOCKET_PATH=~/.config/herdr/sessions/fgos-probe/herdr.sock` — **its own session's socket, not the operator's** |
| `herdr pane list` run from inside that pane | returns only that session's own pane |
| same pane, explicitly `HERDR_SOCKET_PATH=~/.config/herdr/herdr.sock herdr pane list` | **`OPERATOR_PANES_SEEN=18`** |

So a separate session is a **routing boundary, not a namespace boundary**. It removes the
affordance a drifting worker would stumble into, and it does not stop a worker that has
been told the operator's absolute socket path. Since the socket is mode 0600 owned by the
same user, only a mount namespace or a separate OS user closes the second case.

Read against the project's own threat model (ADR-0005: the real danger is unintentional
worker drift, not a worker that cheats on purpose) this is the boundary that matches the
threat. The one incident this project actually recorded, `tsk-1nih`, was drift-shaped.

**3. Can the operator watch worker panes from inside their own cockpit? NOT by default.**

`herdr session attach fgos-probe` run inside a pane of the operator's session is refused:

```
error: nested herdr is disabled by default.
see configuration if you want to enable it.
```

The switch exists but is experimental and unset in this machine's config:

```toml
[experimental]
# Allow launching herdr from inside a herdr-managed pane.
# allow_nested = false
```

Watchability is therefore not lost, but it moves: view the worker session from a second
terminal window with `herdr session attach`, or flip the experimental flag to get it in a
pane. That is the operator's call, and it is the real cost of this option.

## Bonus finding worth using

`HERDR_SESSION` is injected into every pane and names the session it belongs to. That
gives the adapter a cheap **assertion** rather than a convention: before launching a
worker, refuse if the target session is the operator's own. A guard, not a comment.

## What this settles

- Option 1 (separate session) is viable, cheap, and needs no config change to work — only
  to recover in-cockpit watching.
- Private HOME stays: it closes the `$HOME` fallback and is the private scratch P00.1
  already required.
- Together they are complete against drift and require deliberate targeting to defeat.
- `bwrap` and a separate OS user remain the only answers to deliberate targeting, and
  neither is justified by any threat this project has actually observed.

## Still not measured

- Whether `herdr agent start` and `agent prompt` behave the same inside a non-default
  session. Everything measured here used plain pane commands.
- Whether an agent CLI starts and works with a private HOME.
- Whether `allow_nested = true` actually renders usably in a pane, or brings key/resize
  problems of its own.
