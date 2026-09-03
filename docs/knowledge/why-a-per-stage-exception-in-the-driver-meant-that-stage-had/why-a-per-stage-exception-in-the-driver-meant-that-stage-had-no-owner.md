---
framework: diataxis
mode: explanation
---
# Why a per-stage exception in the driver meant that stage had no owner

`fgos-coding-driving` is meant to be one mechanical loop with no per-stage
knowledge: read the item's position, resolve the skill the registry names
for it, invoke it, loop. One of its hard rules states the boundary
directly — every transition happens because the loaded stage-skill called
its own engine verb, never because the driver applied one.

For a while it carried an exception to exactly that rule. At stage
`discovery`, and only there, the driver applied `fgos-researching`'s
returned verdict via `fgos discover` *on the skill's behalf*, documented in
its own dedicated section and guarded by its own red flag.

The exception was correct given the situation. The situation was the bug.

## A helper had been made the owner of a stage

`skillMap.discovery` pointed at `fgos-researching` — a **helper**. Helpers
turn an unresolved question into a grounded finding and hand it back. They
are stage-agnostic by design and callable from several places. What a
helper does not do is own a position in the lifecycle or call engine verbs
to advance one.

So a stage-shaped job had been given to something that could not finish it.
Someone had to take the verdict and apply it, and the only party present
was the driver. The exception block was the driver absorbing work that
belonged to a stage owner that did not exist.

That is why the block kept looking like a reasonable local accommodation:
every individual line of it was doing something necessary.

## Giving the stage a real owner dissolved the exception

The fix was not to delete the special case. It was to create
`fgos-coding-discovering` and point `skillMap.discovery` at it. That skill
owns the whole stage:

- inspects what is still ambiguous,
- calls the `fgos-researching` helper as many times as the work needs,
- writes `RESEARCH.md`,
- judges clear/unclear itself,
- and calls the engine verb itself.

With a real owner in place, the driver's exception had nothing left to do.
The block and its red flag were removed because the condition that required
them was gone — not because someone decided the special case was
unattractive.

**The general observation worth keeping**: a per-case exception inside a
generic loop is evidence about the thing being special-cased, not about the
loop. Before adding one, or before accepting one that is already there, ask
what would have to be true for the exception to be unnecessary. Here the
answer was "this stage would need an owner," and that answer was actionable.

The reverse move — hardening the exception, documenting it more carefully,
giving it its own red flag — makes the accommodation more permanent and
leaves the missing owner missing.

## The registry indirection meant nothing else had to change

Repointing `skillMap.discovery` was the whole wiring change. In particular
the discovery worker prompt needed no edit: it resolves its `skillPath`
through `skillForStage`, so it follows the registry automatically.

This is the payoff of resolving stage → skill through one lookup instead of
naming skills directly at call sites. Changing which skill owns a stage
touches the registry, and everything downstream inherits it.

## Why the name is `discovering`, not `discover`

`fgos-discover` was rejected because it differs from the engine verb `fgos
discover` by exactly one character — a hyphen where the command has a
space.

That is a hazard in a system where both appear constantly in the same
prose, the same commit messages, and the same skill files. A reader
skimming cannot reliably tell which one is meant, and a search for one
matches the other. The participle form (`discovering`) keeps the skill
recognizably about the same concept while making it impossible to confuse
with the verb that advances it.

Worth applying whenever a skill sits next to a command of the same name:
one character of difference is not enough difference.
