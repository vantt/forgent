---
name: show
description: >-
  Use when the user wants the full detail of exactly one fgOS work item —
  the work record plus its own discovery/decisions/gates/outcome/friction/
  settlement/learning history, scoped to just that item — from inside a
  Claude Code session, invoked as /fgOS:show <task-id>. Unlike
  /fgOS:list <id>, which only scopes the work record and leaves every
  other log global, /fgOS:show scopes all of them. Reads through fgOS's
  own show verb; never writes anything. Examples: "/fgOS:show tsk-2fw",
  "/fgOS:show build-cli --json".
---

# fgOS show

Wraps `fgos show` so a person working inside Claude Code can see one work
item's full, scoped detail without hand-typing the CLI. Never writes
`.fgos/` state — every read goes through the `show` verb (one-door-write,
CTR001; a pure read never appends an event).

## Steps

1. **Read the required id argument.** `$ARGUMENTS` is the work item's id —
   `show` requires it. A trailing `--json` token in `$ARGUMENTS` is
   accepted but makes no difference to the output (see step 3) — pass
   whatever `$ARGUMENTS` contains straight through to the verb in step 2;
   do not validate or guess an id yourself. If it is missing or unknown,
   let the CLI's own error surface verbatim.

2. **Read the item.** Run:

   ```
   # fgos CLI fallback (tsk-1no D3)
   FGOS_BIN="${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}/bin/fgos.mjs"
   if [ -f "$FGOS_BIN" ]; then
     node "$FGOS_BIN" show $ARGUMENTS --dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
   elif command -v fgos >/dev/null 2>&1; then
     fgos show $ARGUMENTS --dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
   else
     echo "fgos: no bin/fgos.mjs at ${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX} (not a forgent checkout) and no global fgos install on PATH" >&2
     exit 1
   fi
   ```

   Always use the literal `${CLAUDE_PROJECT_DIR}` substitution shown
   above, never a relative path — an installed plugin's files run from a
   copied cache location, not from this repo checkout, so a relative path
   would resolve to the wrong place or fail outright.

   `--dir` (tsk-2ew): a worktree never carries its own `.fgos/` (ADR0020),
   so a bare call from inside one silently reads an empty/wrong store.
   `${CLAUDE_PROJECT_DIR}` resolves to the main checkout even from inside
   a worktree, so passing it as `--dir` here always reads the one real
   store.

   If the command fails (e.g. `$ARGUMENTS` is empty or the id doesn't
   exist), show the real error to the user and stop — do not retry with a
   guessed id and do not fall back to a hand-written read.

3. **Relay the result verbatim and stop.** `show`'s output is already the
   full detail — `work` (the item record), `discovery`, `decisions`,
   `gates`, `outcome`, `friction`, `settlement`, `learning`, every one of
   them scoped to this one id. Print the command's raw `data` field back
   to the user as-is; do not reformat it into a table or summarize it away
   — this skill has no separate human-readable rendering step, by design
   (this is the same for `--json` or without it: the CLI always emits
   JSON, so there is nothing left for this skill to render differently).
