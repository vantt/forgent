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
     # fgos CLI fallback (tsk-1no D3)
     FGOS_BIN="${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}/bin/fgos.mjs"
     if [ -f "$FGOS_BIN" ]; then
       node "$FGOS_BIN" graph --what-if $ARGUMENTS --json --dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
     elif command -v fgos >/dev/null 2>&1; then
       fgos graph --what-if $ARGUMENTS --json --dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
     else
       echo "fgos: no bin/fgos.mjs at ${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX} (not a forgent checkout) and no global fgos install on PATH" >&2
       exit 1
     fi
     ```

   - If `$ARGUMENTS` is empty, run the plain full-metrics form:

     ```
     # fgos CLI fallback (tsk-1no D3)
     FGOS_BIN="${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}/bin/fgos.mjs"
     if [ -f "$FGOS_BIN" ]; then
       node "$FGOS_BIN" graph --json --dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
     elif command -v fgos >/dev/null 2>&1; then
       fgos graph --json --dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
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
   so a bare call from inside one silently reads an empty/wrong store.
   `${CLAUDE_PROJECT_DIR}` resolves to the main checkout even from inside
   a worktree, so passing it as `--dir` here always reads the one real
   store.

   If the command fails (e.g. the what-if id doesn't exist), show the real
   error to the user and stop — do not retry with a guessed id and do not
   fall back to a hand-written computation.

3. **Report the result.** Read the returned JSON envelope's `data` field
   and relay the relevant fields back to the user plainly — the full
   metrics or the single item's unblock impact, whichever was requested.
   The full-metrics form (`graphMetrics()`, `src/state/graph-metrics.mjs`)
   returns `componentCount`/`components` (connected components /
   independent parallel tracks), `criticalPath` (the longest dependency
   chain), `staleBlocked` (items blocked with no recent progress), and
   `topUnblock` (the items whose completion would unblock the most other
   work) — name all of these, not just components. Also read `frame`,
   which records what was actually computed vs. skipped for this graph
   size; when `frame.skipped` includes `topUnblock`, the field comes back
   `[]` purely because of that large-graph ceiling, not because there is
   nothing to unblock — say so rather than reporting an empty list as "no
   unblock candidates." The what-if form still reports `unblocksTransitive`/
   `newlyReady` as before. Do not reimplement or reinterpret the graph
   logic — it already lives in `fgos graph`.
