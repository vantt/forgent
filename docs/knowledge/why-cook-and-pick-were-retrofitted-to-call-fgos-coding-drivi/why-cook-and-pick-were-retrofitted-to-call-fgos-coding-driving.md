---
framework: diataxis
mode: explanation
---
# Why `cook` and `pick` were retrofitted to call `fgos-coding-driving`

`tsk-19j`'s own D14 decision anticipated this: once the shared driver
skill (`fgos-coding-driving`) existed, `cook`/`pick`'s own hand-rolled
loop logic had no remaining justification — retrofit was "gần như miễn
phí, không phải việc rủi ro riêng cần tách item con." `tsk-19j-3`
deliberately deferred this exact retrofit, since live parity proof
couldn't be safely simulated in one automated session while `cook` was
actively in use by a concurrent session. `tsk-19j-4` is that deferred
work, completed once the driver itself was proven.

## What `pick` looks like now

```
5. **Drive the claimed item via `fgos-coding-driving` (tsk-19j-4) — do not
   ...
   the worktree, immediately invoke the `fgos-coding-driving` skill for
   ...
   item, routes into `fgos-coding-driving` the same way this step does).
```

Claiming an item and driving it forward through its own lifecycle both
route into the same shared driver — `pick` no longer re-implements the
stage-to-skill lookup or the claim-timing logic itself.

## What `cook` looks like now

```
- **This skill still never claims before stage `executing`** — now enforced
  by `fgos-coding-driving`'s own claim-timing hard rule (tsk-19j-4), not by
  this skill's own manual step ordering.
- **Reuse, never duplicate.** `fgos-coding-exploring`, `fgos-coding-planning`,
  `fgos-coding-validating`, and `fgos-coding-driving` (tsk-19j-4) already define
  the Socratic/shaping/proving/driving substance — invoke them (Skill tool)
  for their real work; this skill only owns the id QUEUE the driver has no
  concept of.

## Steps

1. **Submit.** ...

2. **Drain the queue, one id at a time, via `fgos-coding-driving`
   (tsk-19j-4).** While the queue is non-empty, take the id at its front and
   invoke the `fgos-coding-driving` skill for it, no `ceiling` (omit it —
   the driver's own stops already cover everything this step used to
   hand-roll: `awaiting-approval` as the default ceiling, an anchor by open
   children, a person-shaped stop, or a no-progress read). This skill never re-derives
   which skill a stage maps to, never applies a stage/status transition
   itself, and never decides claim-timing on its own — the driver already
   owns all three (its own hard rules: registry-only stage lookup, "engine's
   verb always wins", "claim right before the first `executing`-stage
```

`cook`'s claim-timing guarantee ("never claim before stage `executing`")
now comes from the driver's own hard rule, not from `cook`'s own manual
step ordering — the exact reduction `tsk-19j` D14 predicted. `cook`'s
remaining job is explicitly narrowed to owning the id *queue* — a
concept the driver itself has no notion of, since the driver only ever
drives one id at a time.

## What this confirms about the D9/D14 design

`tsk-19j`'s own D9 decision described `cook`/`pick`/`discover-loop`/
planning-loop/execution-loop as all being the same underlying driver
with different id sources and ceilings. This retrofit is the concrete
proof of that claim for the two callers named in D14 specifically:
`cook` reduces to "submit, then drive each queued id with no ceiling";
`pick` reduces to "claim, then drive one id." Neither skill re-derives
stage-to-skill routing, applies transitions directly, or makes its own
claim-timing decision — all three responsibilities live exclusively in
`fgos-coding-driving` now, exactly the "engine's verb always wins" shape
`fgos-routing` D8 already established for the rest of the system.
