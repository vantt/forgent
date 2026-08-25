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

   Both branches use `../_shared/fgos-cli-fallback.md`, substituting
   `<verb-cmd>` with:

   ```
   triage --json --dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
   ```

   — or, when step 1 found `--all`, add that flag to the same call:

   ```
   triage --all --json --dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
   ```

   `--dir` (tsk-2ew): a worktree never carries its own `.fgos/` (ADR0020),
   so a bare call from inside one silently reads an empty store — exit 0,
   no error. `${CLAUDE_PROJECT_DIR}` resolves to the main checkout even
   from inside a worktree, so passing it as `--dir` here always reads the
   one real store.

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
   columns, in this order: **id**, **status**, **stage**, **blocked-by**,
   **blocks**, **tier**, **priority**, **title**.
   - `status` is the item's raw status (`todo` | `doing` | `blocked` |
     `awaiting-human` | `awaiting-approval` | `done`), rendered as-is.
   - `stage` (`discovery` | `exploring` | `planning` | `executing`, plus
     the drain-only legacy `decompose`) is
     always present (defaults to `executing` when the raw record has none).
   - `blocked-by` renders `blockedBy` — the ids of OTHER still-open items
     THIS row directly waits on (its own unmet `deps`, plus — when this row
     is itself a parent — any still-open child naming it as `parent`) — as
     a comma-joined list (e.g. `tsk-a, tsk-b`). Render `-` when the list is
     empty, not a blank cell.
   - `blocks` is how many other still-open items directly wait on this one
     — either through a `deps` entry, or (for a parent item) an open child
     naming it as `parent`. A done row (only present with `--all`) always
     carries `blocks: 0` — a finished item can never block anything.
   - `tier` renders `goalTier`, optional (`mvp` | `milestone`) — an item
     with no declared tier is a plain work-item; render its cell as `-`,
     not blank or "undefined".
   - `priority` renders `priority` — the human/agent-set frontier field
     (`fgos edit --priority`), a non-negative integer, ascending (lower
     number = higher priority). It never drives this ranking's own sort
     order — the ranking stays blocking-fan-out first, as described in step
     2. An item with no explicit priority renders its cell as `-`, not
     blank, `0`, or "undefined" — never confuse absent with priority 0.

   If `data` is empty, say so plainly — an empty result is valid (nothing
   open right now, or nothing at all with `--all`), not a failure.
