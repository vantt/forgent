---
name: list
description: >-
  Use when the user wants a table view of every fgOS work item (id, status,
  stage, goalTier, title) from inside a Claude Code session, invoked as
  /fgOS:list. Reads the list through fgOS's own list verb; never writes
  anything. Examples: "/fgOS:list", "show me all tasks".
---

# fgOS list

Wraps `fgos list` so a person working inside Claude Code can see every work
item as a table without hand-typing the CLI. Never writes `.fgos/` state —
every read goes through the `list` verb (one-door-write, CTR001; a pure read
never appends an event).

## Steps

1. **Ignore `$ARGUMENTS`.** `list` takes no arguments — there is nothing to
   parse or pass through.

2. **Read the work list.** Run:

   ```
   node ${CLAUDE_PROJECT_DIR}/repo/bin/fgos.mjs list --json
   ```

   Always use the literal `${CLAUDE_PROJECT_DIR}` substitution shown above,
   never a relative path — an installed plugin's files run from a copied
   cache location, not from this repo checkout, so a relative path would
   resolve to the wrong place or fail outright.

   If the command fails, show the real error to the user and stop — do not
   retry with a guessed argument and do not fall back to a hand-written
   read.

   On success, read the command's JSON output's `data.work` field — an
   object of work items keyed by id, in submission order.

3. **Report as a table and stop.** Render every item from `data.work` (no
   filtering by status) as a markdown table with exactly these columns, in
   this order: **id**, **status**, **stage**, **goalTier**, **title**.
   - `stage` (`clarify` | `decompose` | `executing` | `compound-learn` per
     work.mjs's stage domain) is optional on the raw record — an item with
     no `stage` field defaults to `executing` (work-state Data Dictionary
     #12); render that default explicitly as `executing`, not `-` or blank.
   - `goalTier` is optional (`mvp` | `milestone` per work.mjs's
     `GOAL_TIERS`) — an item with no declared tier is a plain work-item;
     render its cell as `-`, not blank or "undefined".

   Keep submission order (the order `data.work`'s keys already come in) —
   do not re-sort. If `data.work` is empty, say so plainly — an empty
   result is valid, not a failure.
