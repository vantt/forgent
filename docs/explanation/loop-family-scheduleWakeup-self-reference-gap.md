---
authoritative_for: merge-loop only running one item then stopping, ScheduleWakeup prompt must self-reference the -loop skill (not the bare -next verb), same gap named unfixed in discover-loop/retro-loop/cleanup-loop/plan-loop
---

# `merge-loop` ran exactly one item then silently stopped continuing — the recurring prompt named the wrong skill

`tsk-3qo` fixed a real defect discovered after `tsk-6av` consolidated
merge self-recovery into `approve` and turned `merge-loop` into a thin
caller: `/fgOS:merge-loop` executed exactly one item, then never
automatically advanced to the next ready item even though the frontier
still had more.

## Root cause: `ScheduleWakeup`'s `prompt` only reloads what it names

`merge-loop/SKILL.md` Step 3 invoked the native `loop` skill with
`prompt: "/fgOS:merge-next"` — not a self-reference to
`"/fgOS:merge-loop"`. `loop`'s own dynamic-mode contract re-fires exactly
that same `prompt` string on every subsequent wake. Since
`merge-next/SKILL.md` itself never mentions `ScheduleWakeup` or any
continuation logic, only `merge-next` got reloaded on wake #2 onward —
`merge-loop`'s own Step 4-6 decision logic (reading the JSON envelope,
tracking the Iron Law list, deciding continue/stop, calling
`ScheduleWakeup` again) never ran a second time. The loop's own designed
shape (read envelope → decide → self-schedule) collapsed into "run
merge-next once per wake, forever, with no actual decision or stop
condition ever re-evaluated."

Corroborating evidence cited directly in the item: `tsk-4ry` (commit
`c74a7928`) had already worked around the same symptom from the outside —
changing herdr's admin-lane launcher to call `merge-next` directly every
tick instead of trusting `merge-loop`'s own internal continuation, i.e.
driving the loop externally rather than relying on the broken internal
mechanism.

## What shipped — scoped narrowly to `merge-loop` only

`plugins/fgOS/skills/merge-loop/SKILL.md` Step 3 now invokes `loop` with
`prompt: "/fgOS:merge-loop"` — self-referencing, so every wake reloads
this skill's own Step 4-6 decision logic; a bare verb name does not
reload the originating skill's text, per `ScheduleWakeup`'s own contract.
A regression assertion was added to `test/runner/prompt-templates.test.mjs`.

## A named, deliberately unfixed risk across the whole `*-loop` family

The item's own description states this directly: a grep confirmed the
identical pattern — passing a bare `-next` verb instead of
self-referencing the `-loop` skill — repeats across `discover-loop`,
`retro-loop`, `cleanup-loop`, and `plan-loop`. The item explicitly scoped
itself to `merge-loop` only, naming the same risk in the other four as a
follow-up, deliberately not auto-expanding scope.

**Confirmed still present as of this doc's own writing** (this
retrospective-loop pass, run via `/fgOS:retro-loop` → `/loop
/fgOS:retro-next`): `retro-loop/SKILL.md` Step 3 still reads `prompt:
"/fgOS:retro-next"`, unchanged, un-self-referencing — the identical
defect shape, unfixed. This session's own repeated iterations are direct
live evidence: `retro-loop`'s own Step 2/4 counters (`synthesized`/
`skipped`, its 15-item default cap, its lock-timeout special stop) were
never re-entered on any wake after the first — every subsequent wake only
reloaded `/fgOS:retro-next` in isolation, exactly as this item's own root
cause predicts. In this particular run the practical effect was
neutral-to-helpful (a standing user instruction had already told the
session to ignore the 15-item cap entirely), but the same gap would
silently defeat `retro-loop`'s own stop conditions — including the
lock-timeout systemic-stop rule — in a run that actually needed them.
`discover-loop`, `cleanup-loop`, and `plan-loop` were not independently
re-checked by this doc, but the same source pattern (grepped identically
by `tsk-3qo`'s own investigation) makes them equally suspect until each
is separately confirmed or fixed.
