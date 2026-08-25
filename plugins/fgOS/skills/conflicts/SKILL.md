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

   See `../_shared/fgos-cli-fallback.md`, substituting `<verb-cmd>` with:

   ```
   conflicts --json --dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
   ```

   `--dir` (tsk-2ew): a worktree never carries its own `.fgos/` (ADR0020),
   so a bare call from inside one silently reads an empty store — exit 0,
   no error. `${CLAUDE_PROJECT_DIR}` resolves to the main checkout even
   from inside a worktree, so passing it as `--dir` here always reads the
   one real store.

   If the command fails, show the real error to the user and stop — do not
   retry and do not fall back to a hand-written conflict scan.

3. **Report the result.** Read the returned JSON envelope's `data` field —
   an array of conflicting item pairs with their overlapping footprints, or
   empty if none — and relay it back to the user plainly. Do not
   reimplement or reinterpret the conflict logic — it already lives in
   `fgos conflicts`.
