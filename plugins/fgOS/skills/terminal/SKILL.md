---
name: terminal
description: >-
  Use when a Claude Code session working an fgOS item should label its
  own herdr pane with the claimed task id and session identities, from
  inside a Claude Code session, invoked as /fgOS:terminal <task-id>.
  Gated on a registered pane-labeling capability and herdr-only today
  (chrome, per STR40): never writes .fgos/ state, never blocks the caller
  when no provider is registered, herdr isn't present, or a session id
  can't be resolved.
  Examples: "/fgOS:terminal tsk-62x", "rename my herdr pane for this
  task".
---

# fgOS terminal

Renames the current herdr pane, when the session is running inside one,
to `<task-id> | fg.ssid:<fgOS/bee session id> | a.ssid:<agent tool's own
session id>` — dropping either session-id segment it cannot resolve. Pure
herdr chrome (`herdr pane rename`, per STR40 —
`docs/operator-runbook-herdr-cockpit.md`): it never reads or writes
`.fgos/` state, so it needs no `fgos` CLI verb and no one-door-write path.
Full decision record: `docs/history/fgos-terminal-pane-rename/CONTEXT.md`.

## The `pane-labeling` capability — this skill is a swappable seam

Not every orchestrator has a concept of a pane label, so this skill is
gated on a declared **`pane-labeling`** capability rather than assuming
herdr (D5,
`docs/history/orchestrator-worker-slots/DISCUSSION.md` §6 "Nhãn: session
tự đặt qua helper skill có gate"). The capability is declared through the
tool registry that already exists — no new mechanism. This project's own
`.fgos/config.json` already carries it, as a `runner.executors.herdr`
entry (tsk-in1-1 D1: config-declared, not a CLI verb):

```json
"herdr": {
  "kind": "cli",
  "capability": "pane-labeling",
  "probeCommand": "herdr"
}
```

`rename.sh` queries it (`fgos tool query --capability pane-labeling`) before
doing anything herdr-specific. **Zero registered providers is a silent
no-op, exit 0** — the same shape the script already had outside a herdr
pane, never a failure. Moving to tmux/cmux later means registering a
different provider and writing its adapter behind that same query; every
caller of this skill inherits the swap without being edited, which is what
makes this the hexagon seam rather than just a helper.

Two deliberate details, both load-bearing:

- **The gate lives in `rename.sh`, not in the callers.** Every call site —
  `/fgOS:pick` step 3, `fgos-coding-driving`'s execution-lane call, any
  future launcher — converges on that one script, so none of them can
  forget the gate.
- **The gate asks whether a provider is REGISTERED, not `--status
  present`.** A tool's `present` status only exists after someone runs
  `fgos tool check` on that machine; gating on it would switch labeling
  off on every fresh clone with no signal. The registry answers "does this
  environment have the concept at all"; the adapter's own guards
  (`HERDR_ENV=1`, `herdr` on `PATH`, `HERDR_PANE_ID` set) answer "and is
  it usable right now" — a sharper question than a `PATH` probe, since
  herdr being installed says nothing about this session running inside one
  of its panes.

**Labels are write-only, for humans** (D2). Nothing in fgOS may ever read a
pane label to decide anything — occupancy and "what is running" are engine
state, never chrome. This skill only ever writes.

## Who calls this

- **Execution lane** — `fgos-coding-driving` calls it once per drive, the
  single pinned call site: it knows the item id earliest and sees every
  stage change, so one call there covers every launcher that routes
  through it. `/fgOS:pick` step 3 also calls it at claim time, which is
  earlier still and covers pick's own `EnterWorktree`-fallback branch
  (where the driver never runs); the two are idempotent for the same id.
- **Admin lane** — not this skill's business: `fg:operation` panes carry a
  fixed per-slot label set once by the adapter when it builds the tab, and
  never change per item.

## Steps

1. **Read `$ARGUMENTS` as the task id.** The whole (trimmed) argument
   string is the task id to label the pane with — e.g. `/fgOS:terminal
   tsk-62x` labels it with `tsk-62x`. If `$ARGUMENTS` is empty, stop and
   ask the user for the task id before doing anything else.

2. **Run the rename script.** Call:

   ```
   bash ${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}/plugins/fgOS/skills/terminal/rename.sh "<task-id>" "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
   ```

   substituting `<task-id>` from step 1. Always use the literal
   `${CLAUDE_PROJECT_DIR}` substitution shown above, never a relative
   path — an installed plugin's files run from a copied cache location,
   not from this repo checkout, so a relative path would resolve to the
   wrong place or fail outright. The second argument (also
   `${CLAUDE_PROJECT_DIR}`-based) is the real repo root, and it is
   required, not optional: the script needs it both to run the
   `pane-labeling` capability query and to resolve the fgOS session-id
   fallback, even though the script file itself may be running from that
   same plugin cache copy. Without a resolvable repo root the script
   cannot confirm the capability, so it no-ops.

   The script always exits `0` — it is a silent no-op whenever no
   `pane-labeling` provider is registered, the session isn't inside a
   herdr-managed pane, `herdr` isn't installed, or the pane id isn't
   available. Never treat a non-zero exit or stderr
   output from it as a reason to stop or retry; if it somehow does exit
   non-zero, ignore it and continue exactly as if it had succeeded
   silently — this skill is decoration, never a gate on the caller's own
   flow.

3. **Report nothing extra.** This skill does not report a result of its
   own — whatever called it (e.g. `/fgOS:pick`) continues with its own
   next step immediately after step 2 returns.
