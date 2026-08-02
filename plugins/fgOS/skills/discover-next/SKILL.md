---
name: discover-next
description: >-
  Use when the user wants the single next stage:clarify or stage:decompose
  fgOS work item processed now — invoked as /fgOS:discover-next. Picks the
  item via the same next-picker /fgOS:discover-loop uses (clarify pool
  ordered by blocking fan-out, decompose pool by priority) and runs the
  matching mechanical fgos discover/decompose verb on it, reporting the
  outcome. Example: "/fgOS:discover-next", "process the next clarify item".
---

# fgOS discover-next

Wraps `pickNextDiscoverItem` (`src/state/discover-pool.mjs`) plus the
existing `fgos discover`/`fgos decompose` verbs so a person (or a
`/fgOS:discover-loop` iteration) can process the single next
clarify/decompose backlog item without hand-typing the CLI or re-deriving
the pick order every time. Never writes `.fgos/` state directly, and never
re-implements `discover`/`decompose` mechanics itself — both verbs stay
exactly as they are.

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

4. **Run the matching verb.** Otherwise the output is `{"id": "<id>",
   "stage": "clarify"|"decompose"}`. Run:

   ```
   node ${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}/bin/fgos.mjs discover <id> --dir "$root"
   ```

   when `stage` is `clarify`, or the same with `decompose <id>` when
   `stage` is `decompose` — the existing verbs, unchanged. Capture both
   the command's stdout and its real process exit code (never just its
   stdout) — the exit code is what step 5 classifies on.

5. **Classify and report the result.** These verbs run as a real CLI
   subprocess, not a JS import — there is no JS `Error` object to inspect
   here, only the process's own exit code and JSON stdout (success) or
   plain-text stderr (failure). Classify by exit code, per the CLI's own
   contract (`EXIT_CODES`, `src/state/store.mjs:65-73`):

   - **exit `0`** — success. Read the JSON envelope's `data.outcome` field:
     `'clear'`/`'pass-through'`/`'decompose'` — report the item cleared or
     decomposed (and, for `'decompose'`, name the child ids from
     `data.childIds`). `'unclear'`/`'need-human'` — report the item parked
     `awaiting-human` with its question (`data.verdict.question`); this is
     normal, not a problem — a person needs to `fgos answer <id> --text
     "..."` before it can be picked again.
   - **exit `7`** (`'lock-timeout'`) — a genuine systemic condition:
     another process is holding `.fgos/events.lock` past its timeout.
     Report this plainly and distinctly from every other outcome — this is
     the one result `/fgOS:discover-loop` stops the whole loop on, never
     just skips.
   - **exit `3`** (`'conflict'`, a per-item CAS race) or any other non-zero
     exit — scoped to this one item (a different concurrent writer raced
     this specific id, or some other one-off failure). Report it as
     skipped; this never means a different item is at risk.

6. **Optional: rename the herdr pane.** Before step 4, if the `id` and
   `stage` are already known, calling `/fgOS:terminal <id>` for
   observability is a nice-to-have, never required — it always exits `0`
   and does nothing when the session isn't inside a herdr-managed pane
   (per that skill's own contract). Skip it entirely if it adds friction;
   the core shape above works identically without it.
