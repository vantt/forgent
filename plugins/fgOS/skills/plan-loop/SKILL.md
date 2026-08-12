---
name: plan-loop
description: >-
  Use when the user wants every fgOS work item at stage:planning (or its
  legacy alias stage:decompose) processed in sequence, inside an
  interactive/visible agent session, until nothing is left or a safety
  condition trips — invoked as /fgOS:plan-loop. Wraps the existing /loop
  skill around /fgOS:plan-next, encoding its stop rules (pool empty,
  lock-timeout, or an iteration cap) so a person never has to restate them
  by hand. Deliberately NOT fgos-runner's background --watch daemon
  (log-only output, not visible in an open terminal). Example:
  "/fgOS:plan-loop", "clear out the planning backlog", "run plan on
  everything".
---

# fgOS plan-loop

Wraps the existing `loop` skill (invoked as `/loop`) around the existing
`/fgOS:plan-next` skill so a person can process every
`stage:planning`/`stage:decompose` item in sequence, visibly, inside this
same conversation — without hand-typing `/loop /fgOS:plan-next` and
re-deriving its stop rules every time. Never writes `.fgos/` state
directly, never re-implements `plan` mechanics, and never adds a new CLI
verb.

Not `fgos-runner`'s `--watch` daemon: that is a separate, always-running
background process whose progress is only visible by tailing a log file
(`.fgos/logs/<id>.log`, gitignored). This skill exists specifically so the
same planning sweep is driven turn-by-turn in an open, interactive session
instead — the same reason `/fgOS:discover-loop` exists (`tsk-3go`).

Not `ck-loop`: that is a separate, unrelated skill for mechanical-metric
optimization. This skill has no metric to optimize — only a
repeat-until-a-named-stop-condition task — so it recurses into the plain
`loop` skill instead, the one built for "run a prompt on a recurring
interval... omit the interval to let the model self-pace."

## Steps

1. **Ignore `$ARGUMENTS`.** Neither `/loop` nor `/fgOS:plan-next` takes an
   id or any other argument for this flow.

2. **Reset the running counters, in this conversation's own context
   only** — never written to any file or `.fgos/` state: `cleared = 0`
   (items that reached `stage: executing` or split into children),
   `parked = 0` (items that parked `awaiting-human` — normal, not a
   problem), `skipped = 0` (per-item CAS conflicts or other one-off
   errors), and an iteration counter against a cap. Default cap: **15**
   (a real backlog can be large; this bounds the real LLM-judge cost of
   one run) — the user may name a different cap in their invocation of
   this command; read it from their own words if given, otherwise use 15.

3. **Start the loop.** Invoke the `loop` skill with `prompt:
   "/fgOS:plan-next"`, and no fixed interval — let it self-pace
   dynamically, same rationale `/fgOS:discover-loop`/`/fgOS:merge-loop`
   already give (a real shaping/reality-check pass's cost varies per
   item; a fixed short interval would either hammer the next call too
   early or sit idle needlessly long).

4. **Read each iteration's report and decide whether to continue.** Every
   time `/fgOS:plan-next` runs, read what it reported (per its own step 5
   classification) and update the counters:

   - **"pool empty"** — stop the loop cleanly. Nothing to report as a
     problem; skip straight to step 5's summary.
   - **reached ceiling at `executing`, or anchored by open children** —
     increment `cleared`. Continue.
   - **parked `awaiting-human`** — increment `parked`. Continue — a park
     is a normal, expected outcome here, never a reason to stop (the
     parked item already left the pool; a different item is picked next
     iteration).
   - **skipped (a per-item CAS conflict or other one-off error)** —
     increment `skipped`. Continue — this is scoped to the one item that
     hit it, never evidence a different item is at risk.
   - **lock-timeout** — stop the loop immediately, regardless of how many
     iterations are left under the cap. This is the one systemic
     condition: `.fgos/events.jsonl`'s lock is shared by every item, so
     continuing would very likely hit the same stuck lock on the next
     pick too. Report which iteration it happened on.

     `/fgOS:plan-next` reports this outcome when `/fgOS:plan`'s own driver
     stop-report carried the line `stop-reason: lock-timeout` verbatim
     (`fgos-coding-driving`'s relay rule, tsk-1c6 D2/D4). That line is the
     signal. A `skipped` outcome above never carries it; do not treat a
     generic failure as this condition.
   - **iteration counter reaches the cap** — stop the loop. This is a
     safety valve, not a discovered problem — say so plainly in the
     summary (step 5), distinct from the other stop reasons.

5. **Report on stop.** Whichever condition ended the loop, print a plain
   summary: `cleared` count, `parked` count, `skipped` count, and — only
   when the stop reason was the iteration cap — how many pool items are
   estimated to remain (re-run the picker's own count, or say "unknown,
   re-run to check" if that is not readily available). Name the stop
   reason explicitly (pool empty / lock-timeout / iteration cap) so the
   person reading it never has to infer it from the counts alone.
