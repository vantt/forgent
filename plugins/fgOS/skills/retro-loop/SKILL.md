---
name: retro-loop
description: >-
  Use when the user wants every status:retrospective fgOS work item
  synthesized in sequence, inside an interactive/visible agent session,
  until nothing is left or a safety condition trips — invoked as
  /fgOS:retro-loop. Wraps the existing /loop skill around
  /fgOS:retro-next, encoding its stop rules (pool empty, lock-timeout, or
  an iteration cap) so a person never has to restate them by hand.
  Example: "/fgOS:retro-loop", "clear out the retrospective backlog",
  "synthesize everything ready".
---

# fgOS retro-loop

Wraps the existing `loop` skill (invoked as `/loop`) around the existing
`/fgOS:retro-next` skill so a person can process every
`status:retrospective` item in sequence, visibly, inside this same
conversation — without hand-typing `/loop /fgOS:retro-next` and
re-deriving its stop rules every time. Never writes `.fgos/` state
directly, never re-implements `fgos-coding-compounding`'s synthesis or the
`retrospective`/`cleanup` verbs, and never adds a new CLI verb
(`docs/history/fgos-retro-loop/CONTEXT.md`'s own scope boundary).

Not `fgos-runner`'s `--watch` daemon: that is a separate, always-running
background process whose progress is only visible by tailing a log file.
This skill exists specifically so the same retrospective sweep is driven
turn-by-turn in an open, interactive session instead.

Not `ck-loop`: that is a separate, unrelated skill for mechanical-metric
optimization. This skill has no metric to optimize — only a
repeat-until-a-named-stop-condition task — so it recurses into the plain
`loop` skill instead, the one built for "run a prompt on a recurring
interval... omit the interval to let the model self-pace" (same
precedent `merge-loop`/`discover-loop` already establish; see
`docs/explanation/why-merge-loop-recurses-into-loop-not-ck-loop.md`).

**Not `cleanup-loop`'s shape, even though this item mirrors its files**:
`cleanup-next`'s own per-item step is a purely mechanical
TTL/content/merge check, so `cleanup-loop` never needed an iteration cap
(`docs/history/fgos-cleanup-loop/CONTEXT.md` D3). `retro-next`'s own
per-item step runs `fgos-coding-compounding` — real LLM judgment, the same cost
profile `discover-loop`'s cap-of-15 exists to bound. This skill follows
`discover-loop`'s stop-rule shape, not `cleanup-loop`'s.

## Steps

1. **Ignore `$ARGUMENTS`.** Neither `/loop` nor `/fgOS:retro-next` takes an
   id or any other argument for this flow.

2. **Reset the running counters, in this conversation's own context
   only** — never written to any file or `.fgos/` state: `synthesized = 0`
   (items that moved to `cleanup`), `skipped = 0` (items whose
   `fgos-coding-compounding` synthesis did not confirm complete, or a per-item
   CAS conflict `/fgOS:retro-next` reports), and an iteration counter
   against a cap. Default cap: **15** — same number `discover-loop` uses,
   for the same reason (bounding real LLM-judge cost per run). The user
   may name a different cap in their invocation of this command; read it
   from their own words if given, otherwise use 15.

3. **Start the loop.** Invoke the `loop` skill with `prompt:
   "/fgOS:retro-next"`, and no fixed interval — let it self-pace
   dynamically, same rationale `discover-loop`/`merge-loop` already give
   (a real `fgos-coding-compounding` synthesis call's cost varies per item; a
   fixed short interval would either hammer the next call too early or
   sit idle needlessly long).

4. **Read each iteration's report and decide whether to continue.** Every
   time `/fgOS:retro-next` runs, read what it reported (per its own step 6
   classification) and update the counters:

   - **"pool empty"** — stop the loop cleanly. Nothing to report as a
     problem; skip straight to step 5's summary.
   - **moved to `cleanup`** — increment `synthesized`. Continue.
   - **skipped** (synthesis didn't confirm complete, or a per-item CAS
     conflict) — increment `skipped` and continue to the next iteration.
     Scoped to this one item, never a systemic problem; never attempt to
     fix it yourself here (that is a person's or a later session's call).
   - **lock-timeout** — stop the loop immediately, regardless of how many
     iterations are left under the cap. This is the one systemic
     condition: `.fgos/events.jsonl`'s lock is shared by every item, so
     continuing would very likely hit the same stuck lock on the next
     pick too. Report which iteration it happened on.
   - **iteration counter reaches the cap** — stop the loop. This is a
     safety valve, not a discovered problem — say so plainly in the
     summary, distinct from the other stop reasons.

5. **Report on stop.** Whichever condition ended the loop, print a plain
   summary: `synthesized` count, `skipped` count, and the stop reason
   named explicitly (pool empty / lock-timeout / iteration cap) so the
   person reading it never has to infer it from the counts alone. When
   `skipped > 0`, say plainly that those items are still sitting
   `retrospective` and need a person to look at them — `fgos list --id
   <id>` shows the item; retrying `/fgOS:retro-next` (or this loop) picks
   them up again once whatever blocked their synthesis is resolved. When
   the stop reason was the iteration cap, name how many pool items are
   estimated to remain (re-run the picker's own count, or say "unknown,
   re-run to check" if that is not readily available).
