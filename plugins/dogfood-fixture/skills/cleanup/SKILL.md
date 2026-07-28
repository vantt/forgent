---
name: cleanup
description: >-
  Use when the user wants to reset a dogfood-fixture replay scenario back to
  baseline (remove the files it generated), from inside a Claude Code
  session, invoked as /dogfood-fixture:cleanup <scenario>. Runs the
  scenario's own `npm run reset:<scenario>` script inside dogfood-fixture/;
  never touches .fgos/ state, never calls the fgos CLI, never hand-deletes
  files itself. Examples: "/dogfood-fixture:cleanup expr-eval-chain",
  "reset the dogfood fixture".
---

# dogfood-fixture cleanup

Resets a dogfood-fixture replay scenario to baseline by running its matching
npm script (`dogfood-fixture/scripts/reset-<scenario>.sh` under the hood).
This is fixture housekeeping only — it never touches `.fgos/` state and
never shells out to `bin/fgos.mjs` (deliberately not part of the `fgOS`
plugin's one-door-write verb surface).

## Steps

1. **Parse `$ARGUMENTS` as the scenario name.** If empty, run
   `/dogfood-fixture:list`'s own steps and ask the user which one — never
   guess.

2. **Run the reset script:**

   ```
   cd ${CLAUDE_PROJECT_DIR}/dogfood-fixture && npm run reset:<scenario>
   ```

   If that npm script does not exist for the given scenario, show the real
   npm error and stop — never guess a different script name and never
   hand-delete files as a workaround.

3. **Report and stop.** Relay whatever the script printed (files removed, or
   "already at baseline") plainly.
