---
name: rollup
description: >-
  Use when the user wants a progress rollup for one fgOS work item's direct
  children from inside a Claude Code session, invoked as /fgOS:rollup <id>.
  Reads the rollup through fgOS's own rollup verb; never writes anything.
  Examples: "/fgOS:rollup build-cli", "/fgOS:rollup str88-fgos-verb-wrappers".
---

# fgOS rollup

Wraps `fgos rollup` so a person working inside Claude Code can see one work
item's done/total child count without hand-typing the CLI. Never writes
`.fgos/` state — every read goes through the `rollup` verb (one-door-write,
CTR001; a pure read never appends an event).

## Steps

1. **Read the required id argument.** `$ARGUMENTS` is the root work item's
   id — `rollup` requires it. Pass it straight through to the verb in step
   2 — do not validate or guess an id yourself; if it is missing or
   unknown, let the CLI's own error surface verbatim.

2. **Read the rollup.** Run:

   ```
   node ${CLAUDE_PROJECT_DIR}/repo/bin/fgos.mjs rollup $ARGUMENTS --json
   ```

   Always use the literal `${CLAUDE_PROJECT_DIR}` substitution shown above,
   never a relative path — an installed plugin's files run from a copied
   cache location, not from this repo checkout, so a relative path would
   resolve to the wrong place or fail outright.

   If the command fails (e.g. `$ARGUMENTS` is empty or the id doesn't
   exist), show the real error to the user and stop — do not retry with a
   guessed id and do not fall back to a hand-written read.

   On success, read the command's JSON output's `data` field for:
   - the root item's **id**, **title**, and **status**,
   - the **doneCount** / **totalCount** over its direct children,
   - each **child**'s own `id`, `title`, and `status`.

3. **Report and stop.** Relay the root item's status and the done/total
   count back to the user, along with each child's status. If it has no
   children, say so (`totalCount: 0` is a valid, non-error result, not a
   failure).
