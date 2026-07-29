---
name: terminal
description: >-
  Use when a Claude Code session working an fgOS item should label its
  own herdr pane with the claimed task id and session identities, from
  inside a Claude Code session, invoked as /fgOS:terminal <task-id>.
  herdr-only (chrome, per STR40): never writes .fgos/ state, never blocks
  the caller when herdr isn't present or a session id can't be resolved.
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
   `${CLAUDE_PROJECT_DIR}`-based) is the real repo root, passed through so
   the script can resolve the fgOS session-id fallback even though the
   script file itself may be running from that same plugin cache copy.

   The script always exits `0` — it is a silent no-op whenever the
   session isn't inside a herdr-managed pane, `herdr` isn't installed, or
   the pane id isn't available. Never treat a non-zero exit or stderr
   output from it as a reason to stop or retry; if it somehow does exit
   non-zero, ignore it and continue exactly as if it had succeeded
   silently — this skill is decoration, never a gate on the caller's own
   flow.

3. **Report nothing extra.** This skill does not report a result of its
   own — whatever called it (e.g. `/fgOS:pick`) continues with its own
   next step immediately after step 2 returns.
