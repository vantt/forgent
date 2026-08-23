---
name: discover-next
description: >-
  Use when the user wants the single next stage:discovery (or
  stage:exploring) fgOS work item processed now — invoked as
  /fgOS:discover-next [--autoClose]. Picks the item via the same
  next-picker /fgOS:discover-loop uses (discovery-shaped pool ordered by
  blocking fan-out), claims it, and delegates to /fgOS:discover <id> — the
  launcher underneath owns claim/dispatch/ceiling for its own stage; this
  command's only job is picking. An optional trailing --autoClose token
  forwards to /fgOS:discover and also covers this command's own pool-empty
  stop. Example: "/fgOS:discover-next", "process the next discovery item".
---

# fgOS discover-next

Wraps `pickNextDiscoverItem` (`src/state/discover-pool.mjs`) plus
`/fgOS:discover` so a person (or a `/fgOS:discover-loop` iteration, or
`herdr-plugin`'s unattended auto-discover launcher) can process the single
next discovery-shaped backlog item without hand-typing the CLI, re-deriving
the pick order, or picking an id itself. Never writes `.fgos/` state
directly, and never re-implements the pick logic itself —
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

1. **Read the optional `--autoClose` flag; ignore everything else in
   `$ARGUMENTS`.** This command takes no positional argument — it always
   picks the single next item from the pool itself, the same way
   `/fgOS:merge-next` always picks the single top-ranked ready-to-merge
   item. Do not pass an id or let the user pick one for this command. The
   only token worth reading out of `$ARGUMENTS` is a trailing `--autoClose`
   (`/fgOS:discover`'s own step 1 convention — opt-in only, never a new
   default): remember whether it was present, it is read again at steps 3
   and 4.

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
   own pool-empty stop signal; `/fgOS:discover-loop` itself never passes
   `--autoClose` (its own step 1 ignores `$ARGUMENTS` entirely), so this
   branch is unchanged for that caller.

   **If `--autoClose` was passed (step 1), call `/fgOS:terminal-close`**
   as the literal last action, right after reporting "pool empty" —
   mirroring `/fgOS:discover`'s own step 4 D2 pattern, invoked directly
   here rather than through a second slash-command round trip:

   ```
   bash ${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}/plugins/fgOS/skills/terminal-close/close.sh
   ```

   Without this, a herdr-launched pane that opened on a real candidate
   which another session claimed out from under it in the race window
   between herdr's own pre-open readiness check and this step would sit
   open forever, permanently blocking herdr's dedupe guard from ever
   opening a fresh auto-discover pane again. Never call this when
   `--autoClose` was not passed — an interactive `/fgOS:discover-next` or
   `/fgOS:discover-loop` iteration must never close a pane a person is
   sitting in front of.

4. **Delegate to `/fgOS:discover <id>`.** The output from step 2 is
   `{"id": "<id>", "stage": "discovery"|"exploring"}`. Invoke
   `/fgOS:discover <id>`, appending a trailing `--autoClose` when step 1
   found one — do not claim the item here, do not dispatch
   `fgos-coding-driving` yourself, and do not compute a ceiling:
   `/fgOS:discover`'s own step 2 (claim if not already claimed) and step 3
   (dispatch through `fgos-coding-driving` with `ceiling: stage:planning`)
   own that entirely (D10 — each tier does exactly one job; the tier below
   is the one convergence point). This command's own job ends at handing
   off the picked id (plus the `--autoClose` flag, unchanged, if present)
   — `/fgOS:discover`'s own step 4 owns the actual close-on-stop decision
   from here on, exactly as it already does for a direct `/fgOS:discover
   <id> --autoClose` caller.

5. **Report whatever `/fgOS:discover` reported.** Relay its own report
   exactly; do not add a separate report of your own beyond it — it
   already classifies reached-ceiling / `awaiting-human` / `blocked` /
   no-progress / `lock-timeout` outcomes in its own step 4, including the
   `stop-reason: lock-timeout` relay line
   (`fgos-coding-driving`'s own relay rule, tsk-1c6 D2/D4) that
   `/fgOS:discover-loop`'s own stop rule keys on. Read the category off
   that relayed line, never off a process exit code.

Pane labeling is deliberately absent from this command (tsk-3ac). It used
to carry an optional rename call of its own; that call is now pinned in one
place, `fgos-coding-driving`, which `/fgOS:discover` dispatches at its own
step 3 — so a pane launched through this command still gets labeled, one
tier down, without this command knowing anything about panes. Do not
reintroduce a rename call here.
