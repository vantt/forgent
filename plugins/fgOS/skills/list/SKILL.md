---
name: list
description: >-
  Use when the user wants a table view of fgOS work items (id, status,
  stage, goalTier, priority, title) from inside a Claude Code session, invoked as
  /fgOS:list. Defaults to open (not-done) items only; pass --all to include
  done items too. Reads the list through fgOS's own list verb; never writes
  anything. Examples: "/fgOS:list", "/fgOS:list --all", "show me all tasks".
---

# fgOS list

Wraps `fgos list` so a person working inside Claude Code can see work items
as a table without hand-typing the CLI. Never writes `.fgos/` state — every
read goes through the `list` verb (one-door-write, CTR001; a pure read
never appends an event).

## Steps

1. **Check `$ARGUMENTS` for `--all`.** The only argument `list` recognizes
   is a literal `--all` token — anything else in `$ARGUMENTS` is ignored.
   `--all` means include done items in step 2's call; its absence means the
   default open-only (not-done) view.

2. **Read the work list.** Run:

   Both branches use `../_shared/fgos-cli-fallback.md`, substituting
   `<verb-cmd>` with:

   ```
   list --json --dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
   ```

   — or, when step 1 found `--all`, add that flag to the same call:

   ```
   list --all --json --dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
   ```

   `--dir` (tsk-2ew): a worktree never carries its own `.fgos/` (ADR0020),
   so a bare call from inside one silently reads an empty store — exit 0,
   no error, `data.work` just comes back `{}`. `${CLAUDE_PROJECT_DIR}`
   resolves to the main checkout even from inside a worktree, so passing
   it as `--dir` here always reads the one real store.

   If the command fails, show the real error to the user and stop — do not
   retry with a guessed argument and do not fall back to a hand-written
   read.

   On success, read the command's JSON output's `data.work` field — an
   object of work items keyed by id, in submission order. Without `--all`
   the CLI itself already excludes `status: 'done'` items; with `--all` it
   includes everything — there is nothing left for this skill to filter.

3. **Report as a table and stop.** Render every item from `data.work` as a
   markdown table with exactly these columns, in this order: **id**,
   **status**, **stage**, **goalTier**, **priority**, **title**.
   - `stage` (`discovery` | `exploring` | `planning` | `executing`, plus
     the drain-only legacy `decompose`, per the coding domain's own
     `stages` in workflow-stage-graphs.mjs) is optional on the raw record — an item with
     no `stage` field defaults to `executing` (work-state Data Dictionary
     #12); render that default explicitly as `executing`, not `-` or blank.
   - `goalTier` is optional (`mvp` | `milestone` per work.mjs's
     `GOAL_TIERS`) — an item with no declared tier is a plain work-item;
     render its cell as `-`, not blank or "undefined".
   - `priority` is optional (`fgos edit --priority`, non-negative integer,
     ascending — lower number = higher priority). An item with no explicit
     priority renders its cell as `-`, not blank, `0`, or "undefined" —
     never confuse absent with priority 0.

   Keep submission order (the order `data.work`'s keys already come in) —
   do not re-sort. If `data.work` is empty, say so plainly — an empty
   result is valid, not a failure.
