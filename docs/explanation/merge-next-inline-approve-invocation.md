---
authoritative_for: merge-next/merge-loop Iron Law block handling, inline approve skill invocation, D2 person-decides-agent-operates correction
---

# An Iron Law block now invokes `approve` in the same turn, not a follow-up command

`tsk-ut6` closed a real friction gap directly against fgOS's own product
priority #1 (reduce friction, don't guess, don't make people wait):
`/fgOS:merge-next`/`/fgOS:merge-loop` hitting an Iron Law block used to
only point the user at `/fgOS:approve <id>` as a separate slash command
to type themselves — an extra manual round-trip.

## Confirmed live

2026-08-20: `/fgOS:merge-next` ran, `tsk-4zr` tripped the Iron Law gate,
the agent reported and stopped the turn, and the person had to type
`/fgOS:approve tsk-4zr` themselves on the next turn. `/fgOS:merge-loop`
had the identical design gap (`plugins/fgOS/skills/merge-loop/SKILL.md`
explicitly said "Nor does it hand the person a command to type... the way
to land any one of these is `/fgOS:approve <id>`").

## The gap in the original design intent

This behavior traced back to `tsk-1y6`'s own D2 ("the person decides, the
agent operates — answering 'approve' in chat is enough, the agent runs
the command") and D9 (an `approve` skill that presents blast radius then
asks once). But D2 said "answering 'approve' in chat is enough," while
the actual implementation required typing a separate slash command on a
different turn — never asking directly within the same turn at all. The
child item that shipped the original hand-off (`tsk-1y6-3`) correctly
pointed to `/fgOS:approve`, but as a command to type, not an in-turn
invocation.

## What shipped

`merge-next`/`merge-loop`'s SKILL.md both changed: on an Iron Law block,
instead of reporting the id and pointing at `/fgOS:approve <id>` as
something to type, the skill now **invokes the `approve` skill directly
(via the Skill tool) for that `<id>` in the same turn**. `approve`'s own
gate is unchanged and not bypassed — it still presents the item's blast
radius, shows `iron-law-evidence.md` verbatim, and asks once; only on a
real "yes" does it run the verb with `--acknowledge-iron-law`. The
merge-driving skill never runs `--acknowledge-iron-law` itself — that
authority stays exactly where D2 always placed it, with the person's
explicit answer, mediated by `approve`'s own gate. The `nothing ready to
merge` vs. `every ready item is blocked` report distinction (deliberately
different reports, per the skill's own existing rule) is preserved
unchanged; only the "point at a command" hand-off became "invoke it now."
