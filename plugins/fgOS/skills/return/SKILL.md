---
name: return
description: >-
  Use when the user wants to return a claimed fgOS work item — running its
  verify and advancing it to proposed (or blocked, on a red verify) — from
  inside a Claude Code session, invoked as /fgOS:return <id>. Returns the
  item through fgOS's own return verb (one-door-write), never writing
  .fgos/ state directly. Examples: "/fgOS:return build-cli",
  "/fgOS:return str88-e1".
---

# fgOS return

Wraps `fgos return` so a person working inside Claude Code can return a
claimed work item without hand-typing the CLI. Never writes `.fgos/` state
directly — every write goes through the `return` verb (one-door-write,
CTR001).

## Steps

1. **Read the required id argument.** `$ARGUMENTS` is the work item id to
   return: `fgos return <id>`. Pass it straight through to the verb in step
   2 — do not pre-validate it yourself; `return` already does its own
   existence and status checks.

2. **Return the item.** Run:

   ```
   node ${CLAUDE_PROJECT_DIR}/repo/bin/fgos.mjs return <id>
   ```

   substituting the id from step 1. Always use the literal
   `${CLAUDE_PROJECT_DIR}` substitution shown above, never a relative path —
   an installed plugin's files run from a copied cache location, not from
   this repo checkout, so a relative path would resolve to the wrong place
   or fail outright.

   If the command fails (e.g. the id doesn't exist, the item isn't
   `doing`, or it wasn't taken through the pull door), show the real error
   to the user and stop — do not retry with a guessed id and do not fall
   back to a hand-written state change.

3. **Report the result.** On success, relay the command's JSON output back
   to the user — whether the item's own verify passed (advancing it to
   `proposed`) or failed (parking it at `blocked` with friction), and the
   relevant fields the command returned.
