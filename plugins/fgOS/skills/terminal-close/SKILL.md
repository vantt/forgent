---
name: terminal-close
description: >-
  Use when a Claude Code session working an fgOS item should close its own
  herdr pane, from inside a Claude Code session, invoked as
  /fgOS:terminal-close. herdr-only (chrome, sibling to /fgOS:terminal):
  never writes .fgos/ state, never blocks the caller when herdr isn't
  present or a pane id can't be resolved. Examples: "/fgOS:terminal-close",
  "close my herdr pane now that this item is done".
---

# fgOS terminal-close

Closes the current herdr pane, when the session is running inside one.
Pure herdr chrome, through the terminal-control port like `/fgOS:terminal`:
it attaches the pane under this session's key (idempotent) and releases it
with `disposition: close` naming that pane as the caller's own
(`callerPane`). The port closes an attached pane only for exactly that
request; it is the one exception to "the core never closes an attached
pane", because a person is closing their own pane. It never reads or writes
`.fgos/` work state, so it needs no user-facing `fgos` verb. Full decision record:
`docs/history/fgos-terminal-close-autoclose/CONTEXT.md`.

## Steps

1. **Run the close script.** Call:

   ```
   bash ${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}/plugins/fgOS/skills/terminal-close/close.sh
   ```

   Always use the literal `${CLAUDE_PROJECT_DIR}` substitution shown above,
   never a relative path — an installed plugin's files run from a copied
   cache location, not from this repo checkout, so a relative path would
   resolve to the wrong place or fail outright.

   The script always exits `0` — it is a silent no-op whenever the
   session isn't inside a herdr-managed pane, `herdr` isn't installed, or
   the pane id isn't available. Like `/fgOS:terminal`, it refuses, with one
   line on stderr, a pane herdr no longer knows or a pane whose shell is not
   an ancestor of the caller -- it never closes another session's pane. Never treat a non-zero exit or stderr
   output from it as a reason to stop or retry; if it somehow does exit
   non-zero, ignore it and continue exactly as if it had succeeded
   silently — this skill is decoration, never a gate on the caller's own
   flow.

2. **Report nothing extra.** This skill does not report a result of its
   own — whatever called it (e.g. `/fgOS:pick` with `--autoClose`)
   continues with its own next step immediately after step 1 returns (or,
   when this is the very last action of that caller's own flow, there is
   no next step to continue with).
