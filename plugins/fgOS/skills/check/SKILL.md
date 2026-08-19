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

   Both branches use `../_shared/fgos-cli-fallback.md`, substituting
   `<verb-cmd>` with:

   - If `$ARGUMENTS` is non-empty:

     ```
     check $ARGUMENTS --json --dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
     ```

   - If `$ARGUMENTS` is empty, omit the id entirely:

     ```
     check --json --dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
     ```

   `--dir` (tsk-2ew): a worktree never carries its own `.fgos/` (ADR0020),
   so a bare call from inside one silently reads an empty/wrong store.
   `${CLAUDE_PROJECT_DIR}` resolves to the main checkout even from inside
   a worktree, so passing it as `--dir` here always reads the one real
   store.

   If the command fails (e.g. the id doesn't exist), show the real error to
   the user and stop — do not retry with a guessed id and do not fall back
   to a hand-written check.

3. **Report the result.** Read the returned JSON envelope's `data` field
   and relay the relevant check fields (per-item or full-set, whichever was
   requested) back to the user plainly. Do not reimplement or reinterpret
   the check logic — it already lives in `fgos check`.
