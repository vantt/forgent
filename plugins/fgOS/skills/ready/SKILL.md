---
name: ready
description: >-
  Use when the user wants to see the current fgOS frontier — the work items
  that are ready to be picked up right now — from inside a Claude Code
  session, invoked as /fgOS:ready. Reads the frontier through fgOS's own
  ready verb; never writes anything. Examples: "/fgOS:ready", "what's
  ready to pick?".
---

# fgOS ready

Wraps `fgos ready` so a person working inside Claude Code can see the
current frontier without hand-typing the CLI. Never writes `.fgos/` state —
every read goes through the `ready` verb (one-door-write, CTR001; a pure
read never appends an event).

## Steps

1. **Ignore `$ARGUMENTS`.** `ready` takes no arguments — there is nothing to
   parse or pass through.

2. **Read the frontier.** Run:

   See `../_shared/fgos-cli-fallback.md`, substituting `<verb-cmd>` with:

   ```
   ready --json --dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
   ```

   `--dir` (tsk-2ew): a worktree never carries its own `.fgos/` (ADR0020),
   so a bare call from inside one silently reads an empty store — exit 0,
   no error. `${CLAUDE_PROJECT_DIR}` resolves to the main checkout even
   from inside a worktree, so passing it as `--dir` here always reads the
   one real store.

   If the command fails, show the real error to the user and stop — do not
   retry with a guessed argument and do not fall back to a hand-written
   read.

   On success, read the command's JSON output's `data` field — the
   frontier list of ready work items (each with its `id`, `title`, and
   other fields the CLI already returns).

3. **Report and stop.** Relay the frontier list back to the user plainly
   (id and title per item at minimum). If the frontier is empty, say so —
   an empty list is a valid, non-error result, not a failure.
