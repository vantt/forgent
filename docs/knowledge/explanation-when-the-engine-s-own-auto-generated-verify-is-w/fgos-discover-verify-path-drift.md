---
framework: diataxis
mode: explanation
---
# Explanation: when the engine's own auto-generated verify is wrong

`fgos discover`'s clarify/decompose judgment writes a `verify` field (and,
for children, a `footprint`) onto items automatically. That judgment is a
real, useful default — but it is a guess about paths that haven't been
built yet, and it can guess wrong. `fgos-routing`'s "engine's verb always
wins" rule governs *stage transitions*; it does not mean a factually wrong
path string inside `verify` must be executed as written.

## What happened (tsk-62x)

`fgos discover tsk-62x`'s clarify pass wrote:

```text
test -f .claude/skills/fgos/fgos-terminal/SKILL.md && grep -q fgOS:terminal .claude/skills/fgos/fgos-pick/SKILL.md
```

(still visible in the item's own `settlement.recent` entry, kind
`clarify-pass`, even after the field was corrected). Both paths are wrong:
`.claude/skills/fgos/` only ever holds the core workflow skills
(`fgos-routing`, `fgos-coding-exploring`, `fgos-coding-planning`, `fgos-coding-validating`,
`fgos-coding-implement`, `fgos-coding-compounding`, `fgos-submit-assist`, `fgos-unlock`,
`fgos-indexing`) — never a per-verb slash-command skill. The real
`/fgOS:pick` skill lives at `plugins/fgOS/skills/pick/SKILL.md`, confirmed
directly (`test -d .claude/skills/fgos/fgos-pick` → missing;
`test -f plugins/fgOS/skills/pick/SKILL.md` → present) before writing
anything.

## Why this isn't a "reopen a locked decision" violation

`fgos-coding-validating`'s hard rules forbid reopening a decision already locked
in `CONTEXT.md`/`plan.md`. A `verify` path that provably doesn't exist on
disk isn't a locked *decision* — it's a factual claim the machine
judgment made about the repo's own layout, independently falsifiable with
`test -f`. Concrete, repo-observable evidence overriding a machine guess
is exactly the "verified decision, new evidence" case
(`review-audit-self-decision` house rule), not a reversal of anything a
person or `CONTEXT.md` actually decided.

## What was done

Corrected via `fgos edit <id> --verify "<real path>"` on all three items
(`tsk-62x`, `tsk-62x-1`, `tsk-62x-2`) before executing against them —
surfaced to the user first, with the concrete `test -f`/`test -d`
evidence, rather than silently overridden. `footprint` was left as-is:
`fgos edit` does not expose it for patching, and it's advisory
(conflict-detection input) rather than execution-blocking the way
`verify` is.

## Generalizes to

Any item whose `discover`-generated `verify`/`footprint` references a
path for a *skill or plugin surface* rather than ordinary application
code — this repo's own `.claude/skills/fgos/` vs. `plugins/fgOS/skills/`
split is exactly the kind of layout the judgment has no ground truth for
until the paths actually exist. Treat a discover-generated `verify` as a
draft to spot-check against the real filesystem before executing, not as
infallible.
