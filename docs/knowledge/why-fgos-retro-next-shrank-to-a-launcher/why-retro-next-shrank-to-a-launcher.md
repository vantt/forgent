---
framework: diataxis
mode: explanation
---
# Why `/fgOS:retro-next` shrank to a launcher

`/fgOS:retro-next` used to hand-roll its own sequencing: resolve the
item's domain-specific synthesis skill itself (`fgos-coding-compounding` for
`coding`, per decision record `0027` D5), invoke it directly, run `fgos
move <id> --to cleanup` on success, and classify a raw subprocess exit
code to decide what happened. That left it with thinner park/anchor
handling than the shared `fgos-coding-driving` loop every other
launcher (`/fgOS:pick`, `/fgOS:discover`, `/fgOS:plan`,
`/fgOS:discover-next`) already goes through, and no way to inherit that
loop's later improvements — any fix to the shared driver's park/anchor/
no-progress handling would need to be separately re-implemented in
`retro-next`'s own hand-rolled copy.

## What changed

`retro-next` is now a launcher in the strict sense decision record
`0029` D17 pins: it activates *one* unit and lets go. Its job shrank to
three steps: sweep every delivered item to `retrospective` (`fgos
retrospective` — cheap, mechanical, idempotent), pick one via
`pickNextRetrospectiveItem` (`src/state/retro-pool.mjs`, FIFO by
`delivered->retrospective` entry time), and hand that item to
`fgos-coding-driving` with an explicit `ceiling: status:cleanup`,
relaying whatever the driver reports.

It no longer resolves which skill runs synthesis, never invokes it
directly, and never moves the item itself afterwards — the driver owns
all three responsibilities now, the same way `/fgOS:pick` and the other
launchers already hand their own picked item over instead of
re-implementing the stage-to-skill dispatch.

## Why the ceiling has to be explicit, not the driver's default

`fgos-coding-driving`'s own default ceiling is `awaiting-approval` —
already far behind a `retrospective` item in the lifecycle, so a
ceiling-less drive would stop before doing anything at all. Naming
`status:cleanup` says exactly how far this launcher goes: run the item's
synthesis, land it at `cleanup`, stop. It deliberately never names a
ceiling past `cleanup` — finishing that step is TTL-gated and belongs to
`/fgOS:cleanup-next`/`/fgOS:cleanup-loop`, a separate launcher's job.

## Why the exit-code classification had to go

Once dispatch routes through an in-session driver instead of a
subprocess, there is no exit code left to read at all — invoking a skill
via the Skill tool returns control in-session, not via a process exit
status. `retro-next` now reads the driver's own relayed stop line
instead: `stop-reason: lock-timeout` is the one category that must
matter to a caller sweeping multiple items (it means the shared
`.fgos/events.jsonl` lock is stuck, so the whole run should stop, not
just this one item) — the same relay-line convention
`/fgOS:discover-next` already established for the same reason.
`/fgOS:retro-loop`'s own stop rules (pool empty / moved to cleanup /
skipped / lock-timeout / iteration cap) read this relayed outcome and
kept working unchanged.

## Observable behavior is unchanged

Synthesis runs, the item lands at `cleanup`, the run stops there — the
exact behavior `/fgOS:retro-next` had before this change. Only the
mechanism underneath moved: a launcher that sweeps, picks, sets a
ceiling, and hands off, rather than a launcher that sequences every step
of the domain's own lifecycle itself.

## Sequencing constraint

This item depended on `fgos-coding-driving` itself first gaining the
ability to honor a `status:*` ceiling past `awaiting-approval` (see
`docs/explanation/why-awaiting-approval-became-an-overridable-ceiling.md`)
— a launcher must never point at a ceiling the driver does not yet
honor.
