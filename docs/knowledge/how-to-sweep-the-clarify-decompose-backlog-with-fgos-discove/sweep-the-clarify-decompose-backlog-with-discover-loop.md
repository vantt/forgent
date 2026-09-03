---
framework: diataxis
mode: how-to
---
# How to sweep the clarify/decompose backlog with `/fgOS:discover-loop`

Use this when you want every `stage:clarify`/`stage:decompose` fgOS work
item processed in sequence, inside an interactive/visible agent session,
until nothing is left or a safety condition trips — invoked as
`/fgOS:discover-loop` (`tsk-3go-3`). It wraps the existing `loop` skill
around `/fgOS:discover-next` so you can process every item in sequence,
visibly, inside the same conversation — without hand-typing
`/loop /fgOS:discover-next` and re-deriving its stop rules every time.
Never writes `.fgos/` state directly, never re-implements
`discover`/`decompose` mechanics, and never adds a new CLI verb.

This is deliberately **not** `fgos-runner`'s `--watch` daemon: that is a
separate, always-running background process whose progress is only
visible by tailing a log file (`.fgos/logs/<id>.log`, gitignored). This
skill exists specifically so the same clarify/decompose sweep is driven
turn-by-turn in an open, interactive session instead.

This is also **not** `ck-loop`: that is a separate, unrelated skill for
mechanical-metric optimization. Sweeping the backlog has no metric to
optimize — only a repeat-until-a-named-stop-condition task — so it
recurses into the plain `loop` skill instead, the one built for "run a
prompt on a recurring interval... omit the interval to let the model
self-pace."

## Step 1 — reset the running counters

Kept in the conversation's own context only, never written to any file
or `.fgos/` state: `cleared = 0` (items that reached `stage: executing`
or split into children), `parked = 0` (items that parked
`awaiting-human` — normal, not a problem), `skipped = 0` (per-item CAS
conflicts or other one-off errors), and an iteration counter against a
cap. Default cap: **15** (a real backlog can be large; this bounds the
real LLM-judge cost of one run) — name a different cap in your own
invocation if you want one, otherwise 15 is used.

## Step 2 — start the loop

Invoke the `loop` skill with `prompt: "/fgOS:discover-next"`, and no
fixed interval — let it self-pace dynamically: a real
`judgeDiscovery`/`judgeDecompose` LLM call's cost varies per item, so a
fixed short interval would either hammer the next call too early or sit
idle needlessly long.

## Step 3 — read each iteration's report and decide whether to continue

Every time `/fgOS:discover-next` runs, read what it reported and update
the counters:

- **"pool empty"** — stop the loop cleanly. Nothing to report as a
  problem.
- **cleared / decomposed** — increment `cleared`. Continue.
- **parked `awaiting-human`** — increment `parked`. Continue — a park is
  a normal, expected outcome, never a reason to stop (the parked item
  already left the pool; a different item is picked next iteration).
- **skipped (a per-item CAS conflict or other one-off error)** —
  increment `skipped`. Continue — scoped to the one item that hit it,
  never evidence a different item is at risk.
- **lock-timeout** — stop the loop immediately, regardless of how many
  iterations are left under the cap. This is the one systemic condition:
  `.fgos/events.jsonl`'s lock is shared by every item, so continuing
  would very likely hit the same stuck lock on the next pick too. Report
  which iteration it happened on.
- **iteration counter reaches the cap** — stop the loop. This is a
  safety valve, not a discovered problem — say so plainly in the summary,
  distinct from the other stop reasons.

## Step 4 — report on stop

Whichever condition ended the loop, print a plain summary: `cleared`/
`decomposed` count, `parked` count, `skipped` count, and — only when the
stop reason was the iteration cap — how many pool items are estimated to
remain (re-run the picker's own count, or say "unknown, re-run to check"
if that is not readily available). Name the stop reason explicitly (pool
empty / lock-timeout / iteration cap) so the reader never has to infer it
from the counts alone.
