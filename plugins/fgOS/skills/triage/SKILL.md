---
name: triage
description: >-
  Use when the user wants fgOS work ranked by blocking fan-out — which item
  to finish first for the most leverage — from inside a Claude Code
  session, invoked as /fgOS:triage. Defaults to open (not-done) items only;
  pass --all to also list done items after the ranking. Reads the ranking
  through fgOS's own triage verb; never writes anything. Examples:
  "/fgOS:triage", "/fgOS:triage --all", "what should I work on for the most
  impact", "what's blocking the most other work".
---

# fgOS triage

Wraps `fgos triage` so a person working inside Claude Code can see work
ranked by blocking fan-out — over the unified `deps`+`parent` graph, not
`deps` alone — without hand-typing the CLI. Never writes `.fgos/` state —
every read goes through the `triage` verb (one-door-write, CTR001; a pure
read never appends an event).

## Steps

1. **Check `$ARGUMENTS` for `--all`.** The only argument `triage` recognizes
   is a literal `--all` token — anything else in `$ARGUMENTS` is ignored.
   `--all` means also include done items (appended after the ranked open
   rows) in step 2's call; its absence means the default open-only
   (not-done) ranking.

2. **Read the ranking.** Run:

   ```
   node ${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}/bin/fgos.mjs triage --json
   ```

   — or, when step 1 found `--all`, add that flag to the same call:

   ```
   node ${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}/bin/fgos.mjs triage --all --json
   ```

   Always use the literal `${CLAUDE_PROJECT_DIR}` substitution shown above,
   never a relative path — an installed plugin's files run from a copied
   cache location, not from this repo checkout, so a relative path would
   resolve to the wrong place or fail outright.

   If the command fails, show the real error to the user and stop — do not
   retry with a guessed argument and do not fall back to a hand-written
   read.

   On success, read the command's JSON output's `data` field — a flat array,
   already ranked (declared goal tier first, then blocking fan-out
   descending, then component size descending). Without `--all`, done items
   never appear — there is nothing left to unblock by finishing one. With
   `--all`, done items are appended after every ranked open row (also
   sorted by tier, then id, among themselves) — there is nothing left for
   this skill to filter or re-sort.

3. **Report as a table and stop.** Render every row from `data`, in the
   order given (do not re-sort), as a markdown table with exactly these
   columns, in this order: **id**, **blocks**, **goalTier**, **stage**,
   **component**, **title**.
   - `blocks` is how many other still-open items directly wait on this one
     — either through a `deps` entry, or (for a parent item) an open child
     naming it as `parent`. A done row (only present with `--all`) always
     carries `blocks: 0` — a finished item can never block anything.
   - `goalTier` is optional (`mvp` | `milestone`) — an item with no declared
     tier is a plain work-item; render its cell as `-`, not blank or
     "undefined".
   - `stage` (`clarify` | `decompose` | `executing` | `compound-learn`) is
     always present (defaults to `executing` when the raw record has none).
   - `component`: when `isIsolated` is `true` and `componentSize` is not
     `0`, render `isolated` — the item shares no dependency or lineage edge
     with any OTHER STILL-OPEN item, so finishing it has no remaining
     structural fan-out beyond its own `blocks` count. When `componentSize`
     is `0` (a done row, only present with `--all`), render `-` instead —
     a finished item was never really "isolated" or "clustered", it is
     just outside the open-item graph entirely. Otherwise render `cluster
     of <componentSize>` — it shares a dependency or lineage chain with
     other still-open work (a finished dependency or parent never counts
     toward this).

   If `data` is empty, say so plainly — an empty result is valid (nothing
   open right now, or nothing at all with `--all`), not a failure.
