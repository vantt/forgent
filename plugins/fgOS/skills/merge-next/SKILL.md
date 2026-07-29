---
name: merge-next
description: >-
  Use when the user wants the single top-ranked ready-to-merge fgOS work
  item merged now — invoked as /fgOS:merge-next. Picks the item through
  fgOS's own merge verb (same ranking as /fgOS:merge-list) and merges it
  via the existing approve/CTR005 gate, never a parallel merge path.
  Example: "/fgOS:merge-next", "merge the next ready item".
---

# fgOS merge-next

Wraps `fgos merge next` so a person (or an unattended agent run) can merge
the single best next ready item without hand-typing the CLI. Never writes
`.fgos/` state directly, and never re-implements merge mechanics itself —
`merge next` recurses into the same `approve` logic every human-invoked
merge already goes through (`docs/history/merge-standardization/
CONTEXT.md` D6).

## Steps

1. **Ignore `$ARGUMENTS`.** `merge next` takes no arguments — it always
   picks the single top-ranked item from the same ranking `/fgOS:merge-
   list` shows (dependency-wait clear, no footprint conflict, highest
   `rankImpact`). Do not pass an id or let the user pick one for this
   command; that is what `/fgOS:approve <id>` is for.

2. **Run the merge.** Run:

   ```
   node ${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}/bin/fgos.mjs merge next
   ```

   Always use the literal `${CLAUDE_PROJECT_DIR}` substitution shown
   above, never a relative path — an installed plugin's files run from a
   copied cache location, not from this repo checkout, so a relative path
   would resolve to the wrong place or fail outright.

   This runs unattended by design (D6) — do not add a confirmation prompt
   of your own before running it. If the command itself fails to execute
   (a real CLI error, not a reported blocked outcome), show the real error
   and stop.

3. **Report the result plainly**, reading the returned JSON envelope's
   `data` field:
   - `{picked: null, reason: "nothing ready to merge"}` — nothing was
     ready; nothing happened.
   - `{picked: <id>, approve: {...}}` — the merge was attempted through
     `approve`; relay whether it reached `done` or was parked `blocked`
     (verify failure or merge conflict), same as `/fgOS:approve` would
     report for that id.
   - `{picked: <id>, blocked: "iron-law", message: "..."}` — the top pick
     trips the Iron Law gate (a self-modifying diff needing human-verified
     failing-test-first proof). Nothing was merged, the item stays
     `proposed`. This never auto-resolves — tell the user which item
     tripped it and that a person needs to `/fgOS:approve <id>
     --acknowledge-iron-law` themselves after actually confirming
     failing-test-first proof; do not run that yourself on this skill's
     own authority.
