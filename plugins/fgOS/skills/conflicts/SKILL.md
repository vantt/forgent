---
name: conflicts
description: >-
  Use when the user wants to see fgOS's footprint-conflict advisory — pairs
  of ready items whose declared file footprints overlap, risking a parallel
  dispatch conflict — invoked as /fgOS:conflicts. Reads the report through
  fgOS's own conflicts verb (read-only, one-door-write). Example:
  "/fgOS:conflicts".
---

# fgOS conflicts

Wraps `fgos conflicts` so a person working inside Claude Code can see the
footprint-conflict advisory without hand-typing the CLI. Never writes
`.fgos/` state — `conflicts` is a pure read, same contract as `ready`/
`check`/`graph`.

## Steps

1. **Ignore `$ARGUMENTS`.** `conflicts` takes no arguments — do not read,
   parse, or forward anything from the slash command's argument text.

2. **Run the conflicts check.** Run:

   ```
   node ${CLAUDE_PROJECT_DIR}/repo/bin/fgos.mjs conflicts --json
   ```

   Always use the literal `${CLAUDE_PROJECT_DIR}` substitution shown above,
   never a relative path — an installed plugin's files run from a copied
   cache location, not from this repo checkout, so a relative path would
   resolve to the wrong place or fail outright.

   If the command fails, show the real error to the user and stop — do not
   retry and do not fall back to a hand-written conflict scan.

3. **Report the result.** Read the returned JSON envelope's `data` field —
   an array of conflicting item pairs with their overlapping footprints, or
   empty if none — and relay it back to the user plainly. Do not
   reimplement or reinterpret the conflict logic — it already lives in
   `fgos conflicts`.
