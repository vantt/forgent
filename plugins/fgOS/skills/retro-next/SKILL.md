---
name: retro-next
description: >-
  Use when the user wants the single next status:retrospective fgOS work
  item synthesized now — invoked as /fgOS:retro-next. First sweeps every
  delivered item to retrospective (fgos retrospective — cheap, mechanical,
  idempotent), then picks via pickNextRetrospectiveItem
  (src/state/retro-pool.mjs, FIFO by delivered->retrospective entry time)
  and hands that one item to fgos-coding-driving with ceiling
  status:cleanup, relaying whatever the driver reports. Example:
  "/fgOS:retro-next", "synthesize the next retrospective item".
---

# fgOS retro-next

A launcher, in the exact sense decision record `0029` D17 pins: it
activates one unit and lets go. It sweeps (`fgos retrospective`), picks one
item (`pickNextRetrospectiveItem`, `src/state/retro-pool.mjs`), sets that
item's ceiling, and hands it to `fgos-coding-driving` — the `driver` cell
of the same grid. It never resolves which skill runs synthesis, never
invokes it, and never moves the item afterwards; the driver owns all three,
the same way `/fgOS:pick`, `/fgOS:discover`, `/fgOS:plan`, and
`/fgOS:discover-next` already hand their own picked item over.

Before this shape it hand-rolled that sequence inline — resolving the skill
itself, invoking it, running the `move` verb to push the item on to
`cleanup`, then reading a raw subprocess exit code — which left it with
thinner park/anchor handling
than the shared loop and no way to inherit the loop's later improvements
(`docs/history/retro-next-shared-driving/CONTEXT.md` D3). Observable
behavior is unchanged: synthesis runs, the item lands at `cleanup`, the run
stops there.

Never writes `.fgos/` state directly beyond what the driver and the
synthesis skill it resolves already do through their own producer surfaces,
and never re-implements that skill's synthesis
(`docs/history/fgos-retro-loop/CONTEXT.md`'s own scope boundary).

## Steps

1. **Ignore `$ARGUMENTS`.** This command takes no arguments — it always
   sweeps and picks the single next item from the pool, the same way
   `/fgOS:cleanup-next` and `/fgOS:discover-next` always pick their own
   single next item.

2. **Sweep, then pick the next item.** Resolve the main checkout root
   (every verb below is `requiresExistingStore: true`, same as every other
   fgOS skill) and run the sweep first — cheap and idempotent
   (`docs/history/fgos-retro-loop/CONTEXT.md` D1: each item's own
   `delivered -> retrospective` move is its own durably-committed event,
   so calling this every iteration is safe even mid-interruption):

   ```bash
   root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
   node "$root/bin/fgos.mjs" retrospective --dir "$root"
   ```

   Then pick:

   ```bash
   node -e "
   Promise.all([
     import('./src/state/store.mjs'),
     import('./src/state/retro-pool.mjs'),
   ]).then(([{ listWork, readRawEvents }, { pickNextRetrospectiveItem }]) => {
     const repoRoot = process.argv[1];
     const fgosDir = repoRoot + '/.fgos';
     const view = listWork(fgosDir);
     const rawEvents = readRawEvents(fgosDir);
     console.log(JSON.stringify(pickNextRetrospectiveItem(view, rawEvents)));
   });
   " -- "$root"
   ```

   run with `cwd` at `${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}`
   — always that literal substitution, never a relative path, since an
   installed plugin's files run from a copied cache location, not from
   this repo checkout.

3. **Pool empty — stop.** If the picker printed `null`, report "pool
   empty — nothing to synthesize" and stop. This is `/fgOS:retro-loop`'s
   own pool-empty stop signal; nothing else to do here.

4. **Hand the picked item to the driver with an explicit ceiling.**
   Otherwise the output is `{"id": "<id>"}`. Invoke `fgos-coding-driving`
   for `<id>` with:

   ```text
   ceiling: status:cleanup
   ```

   and nothing else. That is this whole step. Do not resolve the synthesis
   skill here, do not invoke it, do not move the item afterwards — the
   driver owns all three, the same way `/fgOS:discover-next` hands its own
   picked item over instead of hand-rolling the stage sequence.

   **Why an explicit ceiling is required, not optional.** Omitting it means
   the driver's default ceiling, which is `awaiting-approval` — already far
   behind a `retrospective` item, so the drive would stop before doing
   anything. Naming `status:cleanup` says exactly how far this launcher
   goes: run the item's synthesis, land it at `cleanup`, stop. It never
   names a ceiling past `cleanup`: finishing that step is TTL-gated and
   belongs to `/fgOS:cleanup-next`, and no launcher may ship a default
   ceiling that would cross the merge gate (`fgos-coding-driving`'s own
   named constraint, `docs/history/retro-next-shared-driving/CONTEXT.md`
   D2/D3).

   The driver resolves which skill runs synthesis through the same registry
   lookup it uses for every other position — `skillForStage(getDomain(
   item.domain), 'retrospective')`, decision record `0027` D5, which for
   `coding` resolves to `fgos-coding-compounding` today. This skill never
   re-derives that mapping, and never second-guesses the classification or
   the document the resolved skill produces.

5. **Report whatever the driver reported.** Relay its stop reason exactly;
   add no separate report of your own beyond it. There is no exit code to
   classify here — the driver runs in-session, so its own relayed stop line
   is the channel (tsk-1c6 D2/D4), the same way `/fgOS:discover-next`
   already reads its outcomes:

   - **reached ceiling at status `cleanup`** — synthesis ran and the item
     landed at `cleanup`, ready for `fgos cleanup <id>` (or
     `/fgOS:cleanup-loop`) to finish later, TTL permitting. This is the
     success path.
   - **`awaiting-human`** — the resolved synthesis skill parked on a real
     question. Relay it exactly; a person answers via `/fgOS:answer <id>
     <answer text>` before the item can be picked again. Never guess past
     it.
   - **`lock-timeout`** — the driver's stop-report carries the line
     `stop-reason: lock-timeout` verbatim. Classify this on its own, never
     as a plain `blocked`: `.fgos/events.jsonl`'s lock is shared by every
     item, so the *whole* run should stop rather than this one item being
     skipped. Report it as `lock-timeout` to `/fgOS:retro-loop`, whose own
     step 4 stop rule keys on exactly that. Read the category off that
     line, not off a process exit code — dispatching through the driver
     removed that channel. Absence of the line means the failure was not a
     lock-timeout; never infer one from a generic failure.
   - **`blocked`** — a genuine stop carrying no known error category (e.g.
     a CAS conflict on `.fgos/events.jsonl`). Report it plainly and as
     scoped to this one item; never claim it is equivalent to the
     `lock-timeout` signal above.
   - **no-progress** — the driver invoked the synthesis skill and neither
     `stage` nor `status` moved. Relay it plainly: the item is still
     sitting `retrospective` and needs a person's look. Never re-run the
     loop hoping the same read changes on a retry.

   In every non-success case the item stays where it is — this skill never
   advances an item whose synthesis did not actually complete, and only
   `lock-timeout` is a loop-stopping condition.

6. **Optional: rename the herdr pane.** Before step 4, if the `id` is
   already known, calling `/fgOS:terminal <id>` for observability is a
   nice-to-have, never required — it always exits `0` and does nothing
   when the session isn't inside a herdr-managed pane. Skip it entirely if
   it adds friction; the core shape above works identically without it.
