---
name: stale
description: >-
  Use when the user wants to see which fgOS work items look stuck in
  `doing`, or forgotten in `delivered`/`retrospective`/`cleanup` after
  merge, from inside a Claude Code session, invoked as /fgOS:stale. Reads
  both advisories through fgOS's own stale verb; never writes anything and
  never reclaims a claim. Examples: "/fgOS:stale", "what's stuck?".
---

# fgOS stale

Wraps `fgos stale` so a person working inside Claude Code can see which
items look stuck in `doing` without hand-typing the CLI. Never writes
`.fgos/` state — every read goes through the `stale` verb (one-door-write,
CTR001; a pure read never appends an event and never reclaims anything).

## Steps

1. **Ignore `$ARGUMENTS`.** `stale` takes no arguments — there is nothing
   to parse or pass through.

2. **Read the stale-doing advisory.** Run:

   See `../_shared/fgos-cli-fallback.md`, substituting `<verb-cmd>` with:

   ```
   stale --json --dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
   ```

   `--dir` (tsk-2ew): a worktree never carries its own `.fgos/` (ADR0020),
   so a bare call from inside one silently reads an empty store — exit 0,
   no error. `${CLAUDE_PROJECT_DIR}` resolves to the main checkout even
   from inside a worktree, so passing it as `--dir` here always reads the
   one real store.

   If the command fails, show the real error to the user and stop — do not
   retry with a guessed argument and do not fall back to a hand-written
   read.

   On success, read the command's JSON output's `data` field. `data.stale`
   is the list of items currently in `doing` that the advisory flagged,
   each with its classification (e.g. flagged by owner type/claim age).
   `data.postDelivery.stale` (tsk-1bl) is a second, separate list — items
   sitting unprocessed in `delivered`/`retrospective`/`cleanup` past their
   own status's staleness threshold, the same read-only classification
   shape, never a reclaim.

3. **Report and stop.** Relay both stale-item lists back to the user
   plainly, named separately (`doing` vs post-delivery). This is advisory
   only — do not reclaim, move, or otherwise act on any item; that stays a
   human, the runner's reap, or `/fgOS:retro-loop`/`/fgOS:cleanup-loop`,
   never this wrapper. If a list is empty, say so — an empty list is a
   valid, non-error result,
   not a failure.
