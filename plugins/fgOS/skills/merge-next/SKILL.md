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

   See `../_shared/fgos-cli-fallback.md`, substituting `<verb-cmd>` with:

   ```
   merge next
   ```

   (append the parsed flags after `merge next`, e.g. `merge next --wait
   300000`.)

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
     report for that id. When the park is eligible for self-recovery per `_shared/catchup-self-recovery.md` (such as `reason: "merge-conflict"`, `verify-fail-post-merge`, `verify-timeout-post-merge`, `integration-drift`, `merge-failed-unclassified`), say in the same breath that this is a **recoverable** park with a recovery verb of its own — `fgos catchup <id>` merges the item's target branch back into the item's branch, re-runs the item's own verify there, and on green moves it to `awaiting-approval` — so a session reading this result has a real next step to try before any person is needed (tsk-60h). This single-shot skill does not run that playbook itself: `/fgOS:merge-loop` owns it, because the "at most once per id per run" bookkeeping the playbook depends on only exists inside a loop. See `_shared/catchup-self-recovery.md` for full playbook details. A `syncRoot: {id, outcome: 'synced'}` field
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
     `awaiting-approval`. This never auto-resolves — tell the user which
     item tripped it, and invoke the `approve` skill directly (Skill tool)
     for that `<id>` in the same turn: that skill presents the item's blast
     radius, shows its `iron-law-evidence.md` verbatim, asks once, and —
     only on a real yes — runs the verb itself with `--acknowledge-iron-law`.
     Do not hand the user a command to type (`docs/history/iron-law-gate-human-ux/CONTEXT.md`: the person decides, an agent operates), and never run `--acknowledge-iron-law` yourself on this skill's own authority.
   - `{picked: null, reason: "every ready item is blocked", skipped:
     [{id, reason}]}` — the frontier is not empty, but every ready
     candidate provably trips the Iron Law, so nothing was merged and
     every one of them stays `awaiting-approval`. Report the whole
     `skipped` list, not just its first entry, then invoke the `approve`
     skill directly (Skill tool) for `skipped[0].id` in the same turn. This
     is deliberately a different report from `nothing ready to merge`; do
     not collapse the two.
   - **A `skipped: [{id, reason}]` array alongside any of the shapes
     above** — candidates the engine's own pre-check walked past to reach
     the item it picked. Relay their ids as held, needing a person; they
     are untouched, and none of them affects whatever happened to the item
     that WAS picked.
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
