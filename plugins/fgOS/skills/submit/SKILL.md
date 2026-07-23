---
name: submit
description: >-
  Use when the user wants to submit new work into the fgOS backlog from
  inside a Claude Code session, invoked as /fgOS:submit <free-text
  description>. Intakes the free text through fgOS's own submit verb,
  checking first for a clear, textually-grounded dependency on an existing
  item and always getting explicit confirmation before attaching any
  dependency. Examples: "/fgOS:submit fix the flaky retry test", "/fgOS:submit
  add pagination to the list view".
---

# fgOS submit

Wraps `fgos submit` so a person working inside Claude Code can add a new
work item without leaving the session or hand-typing the CLI. Never writes
`.fgos/` state directly — every write goes through the `submit` verb
(one-door-write, CTR001).

## Steps

1. **Read the free-text description.** The argument the user passed after
   `/fgOS:submit` is the work item's text: `$ARGUMENTS`. If it is empty,
   ask the user for the text before doing anything else — `fgos submit`
   requires non-empty text and will reject an empty call anyway.

2. **Scan the current fgOS view for a dependency candidate.** Run:

   ```
   node ${CLAUDE_PROJECT_DIR}/repo/bin/fgos.mjs list --json
   ```

   Always use the literal `${CLAUDE_PROJECT_DIR}` substitution shown above,
   never a relative path — an installed plugin's files run from a copied
   cache location, not from this repo checkout, so a relative path would
   resolve to the wrong place or fail outright.

   Read the returned items' titles/text and look for a CLEAR,
   textually-grounded match to the new submission — e.g. the new text
   names the same subsystem, file, feature, or bug that an existing open
   item's title already names. Do not infer a dependency from a vague
   thematic similarity, a shared single common word, or a guess about
   intent. If nothing in the list is a clear match, there is no
   candidate — skip straight to step 4 with no deps.

3. **If a candidate was found, present it and require an explicit
   confirm/edit/reject response before proceeding.** Show the user the
   candidate item's id and title, and the specific text that grounds the
   match (quote the overlapping phrase/subject). Ask whether to:
   - **confirm** — attach this item's id as a dependency,
   - **edit** — attach a different id (or set of ids) the user provides,
   - **reject** — submit with no dependency at all.

   Do not proceed to step 4 until the user has answered in this turn.
   Never auto-attach a suggested dependency without this explicit
   response — this is a hard requirement (D4), not a convenience default.

4. **Call `submit`.**
   - If the user confirmed (or edited to) one or more dependency ids, run:

     ```
     node ${CLAUDE_PROJECT_DIR}/repo/bin/fgos.mjs submit "<text>" --deps <confirmed-ids>
     ```

     where `<confirmed-ids>` is a comma-separated list of the confirmed
     dependency ids.
   - If the user rejected the suggestion, or no candidate was found in
     step 2, run the same command with **no `--deps` flag at all**:

     ```
     node ${CLAUDE_PROJECT_DIR}/repo/bin/fgos.mjs submit "<text>"
     ```

   `<text>` is the original free-text description from step 1 (or the
   text the user supplied if they were asked for it in step 1),
   double-quoted so it survives shell parsing as a single argument.

5. **Report the result.** Relay `submit`'s own output (the new item's id
   and derived fields) back to the user. If the command fails (e.g. an
   unknown dependency id), show the real error — do not retry with a
   modified/guessed id and do not silently drop the failure.
