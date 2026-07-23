---
name: check
description: >-
  Use when the user wants the predicted-vs-actual compound-learning check
  for one fgOS work item or for every item at once, invoked as
  /fgOS:check [id]. Reads the report through fgOS's own check verb
  (read-only, one-door-write). Examples: "/fgOS:check", "/fgOS:check
  build-cli".
---

# fgOS check

Wraps `fgos check` so a person working inside Claude Code can see the
predicted-vs-actual outcome check for a work item, or for every item, without
hand-typing the CLI. Never writes `.fgos/` state — `check` is a pure read,
same contract as `ready`/`list`.

## Steps

1. **Read the optional id argument.** `$ARGUMENTS` is the work item id to
   check, or empty to check every item. Either way, pass it straight
   through to the verb in step 2 — do not validate or guess an id yourself.

2. **Run the check.**

   - If `$ARGUMENTS` is non-empty, run:

     ```
     node ${CLAUDE_PROJECT_DIR}/repo/bin/fgos.mjs check $ARGUMENTS --json
     ```

   - If `$ARGUMENTS` is empty, omit the id entirely and run:

     ```
     node ${CLAUDE_PROJECT_DIR}/repo/bin/fgos.mjs check --json
     ```

   Always use the literal `${CLAUDE_PROJECT_DIR}` substitution shown above,
   never a relative path — an installed plugin's files run from a copied
   cache location, not from this repo checkout, so a relative path would
   resolve to the wrong place or fail outright.

   If the command fails (e.g. the id doesn't exist), show the real error to
   the user and stop — do not retry with a guessed id and do not fall back
   to a hand-written check.

3. **Report the result.** Read the returned JSON envelope's `data` field
   and relay the relevant check fields (per-item or full-set, whichever was
   requested) back to the user plainly. Do not reimplement or reinterpret
   the check logic — it already lives in `fgos check`.
