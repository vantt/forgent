---
name: goal
description: >-
  Use when the user wants to set or show the persisted fgOS goal focus from
  inside a Claude Code session, invoked as /fgOS:goal set <id> or /fgOS:goal
  show. Reads/writes the focus through fgOS's own goal verb (one-door-write
  for set, pure read for show), never writing .fgos/ state directly.
  Examples: "/fgOS:goal set build-cli", "/fgOS:goal show".
---

# fgOS goal

Wraps `fgos goal` so a person working inside Claude Code can set or read the
persisted goal-focus pointer without hand-typing the CLI. `set` is the one
write door for focus (one-door-write, CTR001); `show` is a pure read that
never appends an event.

## Steps

1. **Split `$ARGUMENTS` into a sub-verb and optional id.** The first
   whitespace-separated token is the sub-verb — `set` or `show`. Everything
   after it (trimmed) is the id, required only for `set`.

   If the sub-verb is neither `set` nor `show`, or `set` has no id after it,
   do NOT guess. Show the user the CLI's own usage string and stop:

   ```
   fgos goal <set|show> [id]
   ```

2. **Run the matching command.**

   - For `set`:

     ```
     node ${CLAUDE_PROJECT_DIR}/repo/bin/fgos.mjs goal set <id> --json
     ```

   - For `show`:

     ```
     node ${CLAUDE_PROJECT_DIR}/repo/bin/fgos.mjs goal show --json
     ```

   substituting the id parsed in step 1 for `set`. Always use the literal
   `${CLAUDE_PROJECT_DIR}` substitution shown above, never a relative path —
   an installed plugin's files run from a copied cache location, not from
   this repo checkout, so a relative path would resolve to the wrong place
   or fail outright.

   If the command fails (e.g. the id doesn't exist, or for `set` the item
   has no declared `goalTier`), show the real error to the user and stop —
   do not retry with a guessed id and do not fall back to a hand-written
   state change.

3. **Report the result.**
   - For `set`: relay the command's JSON output's `data.focus` field — the
     new persisted focus id.
   - For `show`: relay `data.focus` (or say "no focus set" if it is `null`),
     plus `data.criticalPath` and `data.topUnblock` when `focus` is not
     `null`.
