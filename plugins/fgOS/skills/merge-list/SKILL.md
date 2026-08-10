---
name: merge-list
description: >-
  Use when the user wants to see which fgOS work items are actually ready
  to merge right now — dependency-wait clear, no footprint conflict,
  ordered by impact — invoked as /fgOS:merge-list. Reads the ranking
  through fgOS's own merge verb (read-only, one-door-write). Example:
  "/fgOS:merge-list", "what's ready to merge?".
---

# fgOS merge-list

Wraps `fgos merge list` so a person working inside Claude Code can see the
merge-readiness ranking without hand-typing the CLI. Never writes `.fgos/`
state — `merge list` is a pure read, same contract as `ready`/`triage`/
`conflicts`.

## Steps

1. **Ignore `$ARGUMENTS`.** `merge list` takes no arguments — do not read,
   parse, or forward anything from the slash command's argument text.

2. **Run the merge-readiness ranking.** Run:

   ```
   # fgos CLI fallback (tsk-1no D3)
   FGOS_BIN="${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}/bin/fgos.mjs"
   if [ -f "$FGOS_BIN" ]; then
     node "$FGOS_BIN" merge list --json --dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
   elif command -v fgos >/dev/null 2>&1; then
     fgos merge list --json --dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
   else
     echo "fgos: no bin/fgos.mjs at ${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX} (not a forgent checkout) and no global fgos install on PATH" >&2
     exit 1
   fi
   ```

   Always use the literal `${CLAUDE_PROJECT_DIR}` substitution shown above,
   never a relative path — an installed plugin's files run from a copied
   cache location, not from this repo checkout, so a relative path would
   resolve to the wrong place or fail outright.

   `--dir` (tsk-2ew): a worktree never carries its own `.fgos/` (ADR0020),
   so a bare call from inside one silently reads an empty store — exit 0,
   no error. `${CLAUDE_PROJECT_DIR}` resolves to the main checkout even
   from inside a worktree, so passing it as `--dir` here always reads the
   one real store.

   If the command fails, show the real error to the user and stop — do not
   retry and do not fall back to a hand-written ranking.

3. **Report the result.** Read the returned JSON envelope's `data` field:
   `ready` (ids ordered by merge priority, top merges first), `waiting`
   (ids blocked on an unmerged dependency — merge these first, in whatever
   order unblocks them), and `conflicts` (footprint-conflicting pairs,
   already excluded from `ready`). Relay all three back to the user
   plainly. Do not reimplement or reinterpret the ranking logic — it
   already lives in `mergeReadiness` (`src/state/graph-harness.mjs`).
