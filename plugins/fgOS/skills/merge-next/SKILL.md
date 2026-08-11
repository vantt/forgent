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

1. **Parse `$ARGUMENTS` for `--wait <ms>`/`--no-wait`/`--timeout <ms>`
   only.** `merge next` still takes no id — it always picks the single
   top-ranked item from the same ranking `/fgOS:merge-list` shows
   (dependency-wait clear, no footprint conflict, highest `rankImpact`).
   Do not pass an id or let the user pick one for this command; that is
   what `/fgOS:approve <id>` is for. `$ARGUMENTS` may still carry one or
   more of these three flags — the same lock-wait/verify-timeout overrides
   `approve`/`sync-root` already accept and `merge next` already forwards
   (`src/cli/command-registry.mjs`'s `merge` entry: `"next" only:
   forwarded to the underlying approve call, same as approve
   --wait/--timeout`). Any other token in `$ARGUMENTS` (an id, an
   unrecognized flag) is still ignored exactly as before — carry forward
   only whichever of these three were actually present, verbatim, into
   step 2 below.

2. **Run the merge**, appending whichever of `--wait <ms>`, `--no-wait`,
   or `--timeout <ms>` step 1 parsed, verbatim, onto both `merge next`
   invocations below. Omit them entirely when none were present in
   `$ARGUMENTS` — this keeps today's default lock-wait behavior
   byte-identical for a caller who passes nothing:

   ```
   # fgos CLI fallback (tsk-1no D3)
   FGOS_BIN="${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}/bin/fgos.mjs"
   if [ -f "$FGOS_BIN" ]; then
     node "$FGOS_BIN" merge next
   elif command -v fgos >/dev/null 2>&1; then
     fgos merge next
   else
     echo "fgos: no bin/fgos.mjs at ${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX} (not a forgent checkout) and no global fgos install on PATH" >&2
     exit 1
   fi
   ```

   (append the parsed flags after `merge next` on both the `node
   "$FGOS_BIN" merge next` and `fgos merge next` lines above, e.g. `fgos
   merge next --wait 300000`.)

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
     ready and no `blockedOnSync` root existed either; nothing happened.
   - `{picked: <id>, approve: {...}}` — the merge was attempted through
     `approve`; relay whether it reached `done` or was parked `blocked`
     (verify failure or merge conflict), same as `/fgOS:approve` would
     report for that id. A `syncRoot: {id, outcome: 'synced'}` field
     alongside means this pick only became ready because an earlier
     blockedOnSync root was auto-synced first (tsk-173) — mention that in
     the report, it is not itself something to act on.
   - `{picked: null, reason: "nothing ready to merge", syncRoot: {id,
     outcome: 'synced'}}` (tsk-173) — a blockedOnSync root was auto-synced
     into its target cleanly, but nothing became ready afterward (e.g. a
     footprint conflict surfaced, or a different root is still drifted).
     A real mutation happened (relay the synced root id), but nothing was
     merged.
   - `{picked: <id>, blocked: "iron-law", message: "..."}` — the top pick
     trips the Iron Law gate (a self-modifying diff needing human-verified
     failing-test-first proof). Nothing was merged, the item stays
     `awaiting-approval`. This never auto-resolves — tell the user which item
     tripped it and that a person needs to `/fgOS:approve <id>
     --acknowledge-iron-law` themselves after actually confirming
     failing-test-first proof; do not run that yourself on this skill's
     own authority.
   - `{picked: <id>, blocked: "iron-law"|"merge-conflict"|"fgos-write-
     rejected"|"verify-fail", syncRoot: {...}}` (tsk-173) — the top
     blockedOnSync root's own `sync-root` attempt was blocked; `<id>` here
     is the ROOT id (`resolveRoot` of the original blocked candidate), not
     necessarily the item that reported blockedOnSync in `/fgOS:merge-
     list`. Nothing was merged, the root branch is untouched. Same
     never-auto-resolve rule as the plain Iron Law case above when the
     reason is `iron-law`; for the other three reasons, relay the
     `syncRoot` detail and that a person needs to look at the root
     branch's drift before retrying.
