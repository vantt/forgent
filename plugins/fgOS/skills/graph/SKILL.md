---
name: graph
description: >-
  Use when the user wants the fgOS work-graph metrics (connected components/
  independent parallel tracks), or the unblock impact of completing one
  specific item, invoked as /fgOS:graph [id]. Reads the report through
  fgOS's own graph verb (read-only, one-door-write). Examples:
  "/fgOS:graph", "/fgOS:graph build-cli".
---

# fgOS graph

Wraps `fgos graph` so a person working inside Claude Code can see the
work-graph metrics, or what completing one item would unblock, without
hand-typing the CLI. Never writes `.fgos/` state — `graph` is a pure read,
same contract as `ready`/`check`/`conflicts`.

## Steps

1. **Read the optional id argument.** `$ARGUMENTS` is the work item id to
   run a what-if unblock check against, or empty to get the full graph
   metrics. Either way, pass it straight through to the verb in step 2 —
   do not validate or guess an id yourself.

2. **Run the graph read.**

   - If `$ARGUMENTS` is non-empty, run:

     ```
     node ${CLAUDE_PROJECT_DIR}/repo/bin/fgos.mjs graph --what-if $ARGUMENTS --json
     ```

   - If `$ARGUMENTS` is empty, run the plain full-metrics form:

     ```
     node ${CLAUDE_PROJECT_DIR}/repo/bin/fgos.mjs graph --json
     ```

   Always use the literal `${CLAUDE_PROJECT_DIR}` substitution shown above,
   never a relative path — an installed plugin's files run from a copied
   cache location, not from this repo checkout, so a relative path would
   resolve to the wrong place or fail outright.

   If the command fails (e.g. the what-if id doesn't exist), show the real
   error to the user and stop — do not retry with a guessed id and do not
   fall back to a hand-written computation.

3. **Report the result.** Read the returned JSON envelope's `data` field
   and relay the relevant fields back to the user plainly — the full
   metrics (connected components / independent parallel tracks) or the
   single item's unblock impact, whichever was requested. Do not
   reimplement or reinterpret the graph logic — it already lives in
   `fgos graph`.
