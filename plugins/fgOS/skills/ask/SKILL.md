---
name: ask
description: >-
  Use when the user wants to park an fgOS work item in awaiting-human with
  a question, from inside a Claude Code session, invoked as /fgOS:ask <id>
  <question text>. Asks through fgOS's own ask verb (one-door-write), never
  writing .fgos/ state directly. Examples: "/fgOS:ask build-cli which auth
  provider should this use?", "/fgOS:ask str88-e1 confirm the id format".
---

# fgOS ask

Wraps `fgos ask` so a person working inside Claude Code can park a work
item in `awaiting-human` with a question, without hand-typing the CLI.
Never writes `.fgos/` state directly — every write goes through the `ask`
verb (one-door-write, CTR001).

## Steps

1. **Split `$ARGUMENTS` into id and question text.** The first
   whitespace-separated token of `$ARGUMENTS` is the item id; everything
   after it (trimmed) is the question text (`fgos ask <id> --text "..."`).

   If no text remains after the id, stop and ask the user for the question
   text before doing anything else — `fgos ask` requires non-empty text and
   will reject an empty call anyway.

2. **Ask the item.** Run:

   ```
   node ${CLAUDE_PROJECT_DIR}/repo/bin/fgos.mjs ask <id> --text "<text>"
   ```

   substituting the id and text parsed in step 1, with `<text>`
   double-quoted so it survives shell parsing as a single argument. Always
   use the literal `${CLAUDE_PROJECT_DIR}` substitution shown above, never
   a relative path — an installed plugin's files run from a copied cache
   location, not from this repo checkout, so a relative path would resolve
   to the wrong place or fail outright.

   If the command fails (e.g. the id doesn't exist or the current status
   doesn't allow the `awaiting-human` transition), show the real error to
   the user and stop — do not retry with a guessed id or reworded text and
   do not fall back to a hand-written state change.

3. **Report the result.** On success, relay the command's JSON output
   fields — the item's **id**, and the **from**/**to** statuses — back to
   the user.
