---
name: triage
description: >-
  Use when the user wants open fgOS work ranked by blocking fan-out — which
  item to finish first for the most leverage — from inside a Claude Code
  session, invoked as /fgOS:triage. Reads the ranking through fgOS's own
  triage verb; never writes anything. Examples: "/fgOS:triage", "what should
  I work on for the most impact", "what's blocking the most other work".
---

# fgOS triage

Wraps `fgos triage` so a person working inside Claude Code can see open work
ranked by blocking fan-out — over the unified `deps`+`parent` graph, not
`deps` alone — without hand-typing the CLI. Never writes `.fgos/` state —
every read goes through the `triage` verb (one-door-write, CTR001; a pure
read never appends an event).

## Steps

1. **Ignore `$ARGUMENTS`.** `triage` takes no arguments — there is nothing to
   parse or pass through.

2. **Read the ranking.** Run:

   ```
   node ${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}/bin/fgos.mjs triage --json
   ```

   Always use the literal `${CLAUDE_PROJECT_DIR}` substitution shown above,
   never a relative path — an installed plugin's files run from a copied
   cache location, not from this repo checkout, so a relative path would
   resolve to the wrong place or fail outright.

   If the command fails, show the real error to the user and stop — do not
   retry with a guessed argument and do not fall back to a hand-written
   read.

   On success, read the command's JSON output's `data` field — a flat array
   of open items, already ranked (declared goal tier first, then blocking
   fan-out descending, then component size descending). Done items never
   appear — there is nothing left to unblock by finishing one.

3. **Report as a table and stop.** Render every row from `data`, in the
   order given (do not re-sort), as a markdown table with exactly these
   columns, in this order: **id**, **blocks**, **goalTier**, **stage**,
   **component**, **title**.
   - `blocks` is how many other still-open items directly wait on this one
     — either through a `deps` entry, or (for a parent item) an open child
     naming it as `parent`.
   - `goalTier` is optional (`mvp` | `milestone`) — an item with no declared
     tier is a plain work-item; render its cell as `-`, not blank or
     "undefined".
   - `stage` (`clarify` | `decompose` | `executing` | `compound-learn`) is
     always present (defaults to `executing` when the raw record has none).
   - `component`: when `isIsolated` is `true`, render `isolated` — the item
     shares no dependency or lineage edge with any OTHER STILL-OPEN item, so
     finishing it has no remaining structural fan-out beyond its own
     `blocks` count. Otherwise render `cluster of <componentSize>` — it
     shares a dependency or lineage chain with other still-open work (a
     finished dependency or parent never counts toward this).

   If `data` is empty, say so plainly — an empty result is valid (nothing
   open right now), not a failure.
