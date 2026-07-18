# Operator runbook — herdr cockpit

The official fgOS operator cockpit (P40 / decision D d3dbe7f5, supersedes the
earlier tmux-based D ef6ed305). herdr arranges panes; every pane runs the
real fgOS CLI standalone — herdr is chrome, not a brain.

## Prerequisites

- [herdr](https://herdr.dev) installed and on `PATH`.
- Running inside a herdr-managed pane: `test "${HERDR_ENV:-}" = 1`. See
  `upstreams/herdr/SKILL.md` for how herdr exposes this to every pane it
  manages.

## Quick start

From inside a herdr-managed pane, at the repo root:

```bash
bash scripts/herdr-cockpit.sh
```

This creates one new tab with 4 panes in your current workspace and prints
the attach command:

```
herdr tab focus <tab_id>
```

## What each pane does

1. **fgos-runner-loop** — `node bin/fgos-runner.mjs --once` in a poll-sleep
   shell loop (5s). No new runner flag: `--once` + `runner.lock` are already
   idempotent, so this is a plain wrapper, not new runner behavior.
2. **fgos-tail-log** — `tail -F .fgos/logs/*.log`, live per-item worker
   output as it's produced (P39).
3. **human-door** — a plain interactive shell. This pane *is* where you type
   the next `fgos` verb (`submit`, `ask`/`answer`, `review`/`approve`/
   `reject`, `catchup`) — intentionally unscripted.
4. **fgos-dashboard** — polls `fgos list --json` every 5s, prints a compact
   status line (counts per status), and fires exactly one native
   `herdr notification show` the first time an item enters `awaiting-human`
   (never again while it stays in that status; fires again if it leaves and
   later re-enters).

## Hard rule

**herdr is used ONLY as chrome** — `pane split`/`pane run`/`pane read`/
`tab create`/`notification show`. This cockpit **never** calls
`herdr agent start` and **never** reads herdr's own `agent_status`
(idle/working/blocked/done) as a decision signal. Every real status signal
comes from the fgOS event log, via the fgOS CLI (`fgos list`/`rollup`/
`triage`) — one source of truth.

This is not a style preference: herdr's own agent-detection layer caused a
measured production bug elsewhere ("idle killed an agent", observed in this
project's own dogfooding) precisely because it became a second, competing
source of truth about what was happening. If you're extending this cockpit,
do not reach for `herdr agent ...` commands or any `agent_status` field —
read fgOS's own CLI instead. See decision D d3dbe7f5 for the full reasoning.

## Multi-operator use

If a second operator attaches to the same herdr session, herdr's own
protocol negotiates ownership (`herdr terminal attach <id> --takeover`) —
this is existing herdr behavior, not something this feature builds. The
first attached client keeps write access unless a later client explicitly
takes over; anyone else can still read.

## Concurrent-merge safety

This cockpit adds no new code on the merge/approve path. `approve` already
does not false-alarm when the runner merges in parallel — that guarantee was
fixed by P35 (`fgos-multi-session-checkout`) and this cockpit only exposes it
through the dashboard pane, it does not re-implement it.
