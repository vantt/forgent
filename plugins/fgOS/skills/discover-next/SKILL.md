---
name: discover-next
description: >-
  Use when the user wants the single next stage:clarify or stage:decompose
  fgOS work item processed now — invoked as /fgOS:discover-next. Picks the
  item via the same next-picker /fgOS:discover-loop uses (clarify pool
  ordered by blocking fan-out, decompose pool by priority), claims it, and
  dispatches it through fgos-coding-driving with a ceiling matched to its
  picked stage, so the live session does the real reasoning instead of a
  context-blind subprocess judge. Example: "/fgOS:discover-next", "process
  the next clarify item".
---

# fgOS discover-next

Wraps `pickNextDiscoverItem` (`src/state/discover-pool.mjs`) plus
`fgos-coding-driving` so a person (or a `/fgOS:discover-loop` iteration)
can process the single next clarify/decompose backlog item without
hand-typing the CLI or re-deriving the pick order every time. Never writes
`.fgos/` state directly, and never re-implements the pick logic itself —
`pickNextDiscoverItem` stays exactly as it is
(`docs/history/discover-decompose-skill-wrapper-verdict-routing/
CONTEXT.md` D2).

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

4. **Claim the picked item, then dispatch through `fgos-coding-driving`
   with a ceiling matched to its picked stage.** The output from step 2 is
   `{"id": "<id>", "stage": "clarify"|"decompose"}`. Claim `<id>` the same
   way `discover`/`decompose`'s own claim step does — read its live status
   (`fgos list --id <id> --json --dir "$root"`), skip claiming if already
   `doing`, otherwise `fgos take <id> --role session --dir "$root"`,
   falling back to `fgos pick <id> --dir "$root"` if `take` refuses because
   the item already carries its own branch.

   Then invoke `fgos-coding-driving` for `<id>` with:
   - `ceiling: stage:decompose` when step 2's `stage` was `"clarify"`,
   - `ceiling: stage:executing` when step 2's `stage` was `"decompose"`.

   Never invoke `fgos-exploring`/`fgos-planning`/`fgos-validating` by name
   directly here — the driver resolves which skill a stage maps to through
   its own registry lookup, the one place that mapping is allowed to live
   (`fgos-coding-driving`'s own red-flag rule). This dynamic ceiling is
   required, not optional
   (`docs/history/discover-decompose-skill-wrapper-verdict-routing/
   CONTEXT.md` D2, D6): without it, a `decompose`-stage pick that resolves
   `pass-through` would let the driving loop cascade straight into
   `fgos-code-implement` — silently starting a real build from what this
   command is meant to be a single judgment step.

5. **Report whatever `fgos-coding-driving` reported.** Relay its stop
   reason exactly; do not add a separate report of your own beyond it —
   the same vocabulary `discover`/`decompose`'s own skills use for the
   matching stage:

   - **reached ceiling at stage `decompose`** (picked stage was `clarify`)
     — item cleared clarify with a real verify command now attached;
     `/fgOS:decompose <id>` is the next step.
   - **reached ceiling at stage `executing`** (picked stage was
     `decompose`) — item passed through decompose, ready to build.
   - **anchored by open children** — item split into real children; relay
     every anchoring child id; `/fgOS:pick <child-id>` continues any of
     them.
   - **`awaiting-human`** — relay the parked question/proposal exactly;
     this is normal, not a problem — a person resolves it via `/fgOS:answer
     <id> <answer text>` before the item can be picked again.
   - **`lock-timeout`** — the driver's stop-report carries the line
     `stop-reason: lock-timeout` verbatim (`fgos-coding-driving`'s own
     relay rule, tsk-1c6 D2/D4). Classify this on its own, never as a
     plain `blocked`: it means `.fgos/events.jsonl`'s lock — shared by
     every item — is stuck, so the *whole* run should stop rather than
     this one item being skipped. Report it as `lock-timeout` to
     `/fgOS:discover-loop`, whose step 4 stop rule keys on exactly that.

     Read the category off that line, not off a process exit code. Before
     tsk-31l a raw CLI subprocess surfaced exit code `7` here; dispatching
     through `fgos-coding-driving` removed that channel, and tsk-1c6
     replaced it with the relayed line. Absence of the line means the
     failure was not a lock-timeout — never infer one from a generic
     failure.
   - **`blocked`** — a genuine stop that carried no known error category
     (e.g. a CAS conflict on `.fgos/events.jsonl`). Report it plainly, and
     as scoped to this one item — never claim it is equivalent to the
     `lock-timeout` signal above.
   - **no-progress** — relay it plainly; needs a person's look (mirrors
     the old `invalid`/CAS-conflict outcomes: the item was left untouched,
     fail-safe).

6. **Optional: rename the herdr pane.** Before step 4, if the `id` and
   `stage` are already known, calling `/fgOS:terminal <id>` for
   observability is a nice-to-have, never required — it always exits `0`
   and does nothing when the session isn't inside a herdr-managed pane
   (per that skill's own contract). Skip it entirely if it adds friction;
   the core shape above works identically without it.
