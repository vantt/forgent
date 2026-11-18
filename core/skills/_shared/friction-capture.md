# Friction capture

Friction is anything that slowed you down or forced a detour. Recording it is a side channel: it never stops, delays or
changes your work, and a failed recording is not your problem.

## Record when

- a workaround was needed
- two rules or docs conflicted
- a tool or capability you needed was missing
- a doc or skill was wrong or stale
- you waited or retried

## Record how

1. Run `fgos friction classes` and reuse a signature that fits; coin a new one only when none does.
2. Run one `fgos friction record` with `--kind` (bug, instability, missing, awkward or doc), `--layer`, `--error-class`
   and `--ref kind:id` (repeatable) for the plan, phase or backlog row you serve (for example `--ref plan:plans/<dir>`
   or `--ref backlog:<id>`). The host owns the value lists and tells you what it refuses.
3. A worker inside a Unit run that cannot run the command lists the same facts under `frictions` in its result claim
   (`kind`, `layer`, `errorClass`, `detail`); settlement records each one with refs to the run, plan and phase.

Never block on a refusal, never retry in a loop, and never record the same obstacle twice.
