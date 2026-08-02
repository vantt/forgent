---
name: cleanup-loop
description: >-
  Use when the user wants every TTL-ready fgOS work item at status:cleanup
  cleaned up in sequence, unattended, until the pool is empty or a safety
  condition trips — invoked as /fgOS:cleanup-loop. Wraps the existing
  /loop skill around /fgOS:cleanup-next, encoding the stop rules (pool
  empty, lock-timeout) and the per-item block-skip rule so a person never
  has to restate them by hand. Example: "/fgOS:cleanup-loop", "clean up
  everything that's ready", "sweep the cleanup pool".
---

# fgOS cleanup-loop

Wraps the existing `loop` skill (invoked as `/loop`) around the existing
`/fgOS:cleanup-next` skill so a person can clean up every TTL-ready
`status:cleanup` item in sequence without hand-typing `/loop
/fgOS:cleanup-next` and re-deriving its stop rules every time. Never writes
`.fgos/` state directly, never re-implements `cleanup` mechanics, and never
adds a new CLI verb — `fgos cleanup <id>` and its harness stay exactly as
they are (`docs/history/fgos-cleanup-loop/CONTEXT.md`'s own scope
boundary).

Not `ck-loop`: that is a separate, unrelated skill for mechanical-metric
optimization (`Goal`/`Scope`/`Verify`-single-number/`Guard` config,
git-commit-then-measure per iteration). This skill has no metric to
optimize — only a repeat-until-a-named-stop-condition task — so it
recurses into the plain `loop` skill instead, the one built for "run a
prompt on a recurring interval... omit the interval to let the model
self-pace" (same precedent `merge-loop`/`discover-loop` already establish;
see `docs/explanation/why-merge-loop-recurses-into-loop-not-ck-loop.md`).

## Steps

1. **Ignore `$ARGUMENTS`.** Neither `/loop` nor `/fgOS:cleanup-next` takes
   an id or any other argument for this flow — do not read, parse, or
   forward anything from the slash command's argument text.

2. **Reset the running counters, in this conversation's own context
   only** — never written to any file or `.fgos/` state: `cleaned = 0`
   (items that closed to `done`), `skipped = 0` (items whose
   `fgos cleanup <id>` call parked them `blocked` — content missing or
   merge no longer resolves, per D2 below — plus any per-item CAS
   conflict `/fgOS:cleanup-next` reports).

3. **Start the loop.** Invoke the `loop` skill with `prompt:
   "/fgOS:cleanup-next"`, and no fixed interval — let it self-pace
   dynamically. Each `/fgOS:cleanup-next` call runs a real, but bounded,
   mechanical check (TTL/content/merge-ancestry) plus a real git cleanup
   when the item passes — it carries no LLM-judgment cost, so a fixed
   short interval would either hammer the next call before the previous
   one could possibly matter, or sit idle needlessly long. Never write a
   bespoke timer/scheduling mechanism in this skill's own place of `/loop`
   — that would duplicate a working mechanism instead of reusing it.

4. **Read each iteration's result and decide whether to continue.** Every
   time `/fgOS:cleanup-next` runs, read what it reported (per its own step
   5 classification) and update the counters:

   - **"pool empty"** — stop the loop cleanly (docs/history/
     fgos-cleanup-loop/CONTEXT.md D3). Nothing to report as a problem; skip
     straight to step 5's summary.
   - **`done`** — increment `cleaned`. Continue to the next iteration.
   - **`blocked`** (content-missing or merge-no-longer-resolves — the
     picker already guaranteed TTL had elapsed, so this is never a TTL
     block) — **D2**: scoped to this one item, never a systemic problem.
     Increment `skipped` and continue to the next iteration. The item
     stays visibly parked `blocked` for a person to look at later; never
     stop the loop for it, and never attempt to fix it yourself here (that
     is a person's or a later session's call, same as any other `blocked`
     item).
   - **skipped (a per-item CAS conflict or other one-off error)** —
     increment `skipped`. Continue — this is scoped to the one item that
     hit it, never evidence a different item is at risk.
   - **lock-timeout** — stop the loop immediately, regardless of how much
     of the pool is left. This is the one systemic condition:
     `.fgos/events.jsonl`'s lock is shared by every item, so continuing
     would very likely hit the same stuck lock on the next pick too.
     Report which iteration it happened on.

5. **No iteration cap (D3).** Unlike `/fgOS:discover-loop`'s cap-of-15,
   this loop never stops on an iteration count — each iteration's cost is
   a deterministic mechanical check, not a per-call LLM judgment, so there
   is no per-iteration cost to bound the way `discover-loop` needed to.
   The only stop conditions are pool-empty and lock-timeout, above.

6. **Report on stop.** Whichever condition ended the loop, print a plain
   summary: `cleaned` count, `skipped` count, and the stop reason named
   explicitly (pool empty / lock-timeout) so the person reading it never
   has to infer it from the counts alone. When `skipped > 0`, say plainly
   that those items are sitting `blocked` and need a person to look at
   them — `fgos list --id <id>` shows the recorded block reason.
