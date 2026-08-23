---
name: plan-next
description: >-
  Use when the user wants the single next stage:planning (or its legacy
  alias stage:decompose) fgOS work item processed now — invoked as
  /fgOS:plan-next. Picks the item via pickNextPlanItem
  (src/state/plan-pool.mjs, priority ASCENDING), then delegates to
  /fgOS:plan <id> — the launcher underneath owns claim/dispatch/ceiling for
  its own stage; this command's only job is picking. Example:
  "/fgOS:plan-next", "process the next planning item".
---

# fgOS plan-next

Wraps `pickNextPlanItem` (`src/state/plan-pool.mjs`) plus `/fgOS:plan` so a
person (or a `/fgOS:plan-loop` iteration) can process the single next
`planning`-stage backlog item without hand-typing the CLI or re-deriving
the pick order every time. Never writes `.fgos/` state directly, and never
re-implements the pick logic itself — `pickNextPlanItem` stays exactly as
it is.

tsk-lya D11: this is the dedicated `<root>-next` picker the `planning`
pool never had — four sibling pairs already existed (`cleanup`,
`discover`, `merge`, `retro`), but the `decompose`/`planning` pool used to
ride along inside `/fgOS:discover-next`'s own pick logic instead of
getting its own. This command exists specifically to close that gap.

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
   Promise.all([import('./src/state/store.mjs'), import('./src/state/plan-pool.mjs')]).then(([{ listWork }, { pickNextPlanItem }]) => {
     const view = listWork(process.argv[1] + '/.fgos');
     console.log(JSON.stringify(pickNextPlanItem(view)));
   });
   " -- "$root"
   ```

   run with `cwd` at `${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}`
   — always that literal substitution, never a relative path, since an
   installed plugin's files run from a copied cache location, not from
   this repo checkout.

3. **Pool empty — stop.** If the command printed `null`, report "pool
   empty — nothing to plan" and stop. This is `/fgOS:plan-loop`'s own
   pool-empty stop signal; nothing else to do here.

4. **Delegate to `/fgOS:plan <id>`.** The output from step 2 is
   `{"id": "<id>", "stage": "planning"|"decompose"}` (`decompose` is the
   legacy, drain-only alias, tsk-403 D18 — still a valid pool candidate,
   never a new item's real stage). Invoke `/fgOS:plan <id>` directly — do
   not claim the item here, do not dispatch `fgos-coding-driving`
   yourself, and do not compute a ceiling: `/fgOS:plan`'s own step 2
   (claim if not already claimed) and step 3 (dispatch through
   `fgos-coding-driving` with `ceiling: stage:executing`) own that
   entirely. This command's own job ends at handing off the picked id.

5. **Report whatever `/fgOS:plan` reported.** Relay its own report
   exactly; do not add a separate report of your own beyond it — it
   already classifies reached-ceiling-at-`executing` / anchored-by-open-
   children / `awaiting-human` / `blocked` / no-progress outcomes in its
   own step 4, including the `stop-reason: lock-timeout` relay line
   (`fgos-coding-driving`'s own relay rule, tsk-1c6 D2/D4) that
   `/fgOS:plan-loop`'s own stop rule keys on. Read the category off that
   relayed line, never off a process exit code.

6. **Optional: rename the herdr pane.** Before step 4, if the `id` and
   `stage` are already known, calling `/fgOS:terminal <id>` for
   observability is a nice-to-have, never required — it always exits `0`
   and does nothing when the session isn't inside a herdr-managed pane
   (per that skill's own contract). Skip it entirely if it adds friction;
   the core shape above works identically without it.
