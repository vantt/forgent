---
name: discover-next
description: >-
  Use when the user wants the single next stage:discovery (or
  stage:exploring) fgOS work item processed now — invoked as
  /fgOS:discover-next. Picks the item via the same next-picker
  /fgOS:discover-loop uses (discovery-shaped pool ordered by blocking
  fan-out), claims it, and delegates to /fgOS:discover <id> — the launcher
  underneath owns claim/dispatch/ceiling for its own stage; this command's
  only job is picking. Example: "/fgOS:discover-next", "process the next
  discovery item".
---

# fgOS discover-next

Wraps `pickNextDiscoverItem` (`src/state/discover-pool.mjs`) plus
`/fgOS:discover` so a person (or a `/fgOS:discover-loop` iteration) can
process the single next discovery-shaped backlog item without hand-typing
the CLI or re-deriving the pick order every time. Never writes `.fgos/`
state directly, and never re-implements the pick logic itself —
`pickNextDiscoverItem` stays exactly as it is
(`docs/history/discover-decompose-skill-wrapper-verdict-routing/
CONTEXT.md` D2).

tsk-lya D10: this command picks, claims, and hands off — it does not
itself claim + dispatch `fgos-coding-driving` + compute a ceiling anymore.
`/fgOS:discover` (the launcher one tier down) owns all of that for
whichever stage the picked item is actually at
(`discovery`/`exploring` — the pool's own candidate set still carries a
`clarify` entry, dead for coding since that stage retired). The
`planning` pool (with its legacy `decompose` alias) this
command used to also pick from (a legacy from before `tsk-2b0` split the
bottom tier) now has its own dedicated picker — see `/fgOS:plan-next`.

## Steps

1. **Ignore `$ARGUMENTS`.** This command takes no arguments — it always
   picks the single next item from the pool, the same way `/fgOS:merge-
   next` always picks the single top-ranked ready-to-merge item. Do not
   pass an id or let the user pick one for this command.

2. **Pick the next item.** Resolve the main checkout root (every verb
   below is `requiresExistingStore: true`, same as every other fgOS skill)
   and run:

   ```bash
   root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
   node -e "
   Promise.all([import('./src/state/store.mjs'), import('./src/state/discover-pool.mjs')]).then(([{ listWork }, { pickNextDiscoverItem }]) => {
     const view = listWork(process.argv[1] + '/.fgos');
     console.log(JSON.stringify(pickNextDiscoverItem(view)));
   });
   " -- "$root"
   ```

   run with `cwd` at `${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}`
   — always that literal substitution, never a relative path, since an
   installed plugin's files run from a copied cache location, not from
   this repo checkout.

3. **Pool empty — stop.** If the command printed `null`, report "pool
   empty — nothing to discover" and stop. This is `/fgOS:discover-loop`'s
   own pool-empty stop signal; nothing else to do here.

4. **Delegate to `/fgOS:discover <id>`.** The output from step 2 is
   `{"id": "<id>", "stage": "discovery"|"exploring"}`. Invoke
   `/fgOS:discover <id>` directly — do not claim the item here, do not
   dispatch `fgos-coding-driving` yourself, and do not compute a ceiling:
   `/fgOS:discover`'s own step 2 (claim if not already claimed) and step 3
   (dispatch through `fgos-coding-driving` with `ceiling: stage:planning`)
   own that entirely (D10 — each tier does exactly one job; the tier below
   is the one convergence point). This command's own job ends at handing
   off the picked id.

5. **Report whatever `/fgOS:discover` reported.** Relay its own report
   exactly; do not add a separate report of your own beyond it — it
   already classifies reached-ceiling / `awaiting-human` / `blocked` /
   no-progress / `lock-timeout` outcomes in its own step 4, including the
   `stop-reason: lock-timeout` relay line
   (`fgos-coding-driving`'s own relay rule, tsk-1c6 D2/D4) that
   `/fgOS:discover-loop`'s own stop rule keys on. Read the category off
   that relayed line, never off a process exit code.

6. **Optional: rename the herdr pane.** Before step 4, if the `id` and
   `stage` are already known, calling `/fgOS:terminal <id>` for
   observability is a nice-to-have, never required — it always exits `0`
   and does nothing when the session isn't inside a herdr-managed pane
   (per that skill's own contract). Skip it entirely if it adds friction;
   the core shape above works identically without it.
