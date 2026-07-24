---
name: stale
description: >-
  Use when the user wants to see which fgOS work items look stuck in
  `doing` from inside a Claude Code session, invoked as /fgOS:stale. Reads
  the stale-doing advisory through fgOS's own stale verb; never writes
  anything and never reclaims a claim. Examples: "/fgOS:stale", "what's
  stuck?".
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

   ```
   node ${CLAUDE_PROJECT_DIR}/repo/bin/fgos.mjs stale --json
   ```

   Always use the literal `${CLAUDE_PROJECT_DIR}` substitution shown above,
   never a relative path — an installed plugin's files run from a copied
   cache location, not from this repo checkout, so a relative path would
   resolve to the wrong place or fail outright.

   If the command fails, show the real error to the user and stop — do not
   retry with a guessed argument and do not fall back to a hand-written
   read.

   On success, read the command's JSON output's `data` field — the list of
   items currently in `doing` that the advisory flagged, each with its
   classification (e.g. flagged by owner type/claim age).

3. **Report and stop.** Relay the stale-item list back to the user plainly.
   This is advisory only — do not reclaim, move, or otherwise act on any
   item; that stays a human or the runner's reap, never this wrapper. If
   the list is empty, say so — an empty list is a valid, non-error result,
   not a failure.
