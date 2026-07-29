---
type: explanation
source_capture_ids: [tsk-6bx]
---

# Why gate-bypass is shaped the way it is

`docs/reference/gate-bypass-config.md` covers the mechanism's exact
shape. This is the discussion of why it landed on that shape instead of
several other plausible ones — grounded in the locked decisions in
`docs/history/gate-bypass/CONTEXT.md` (D1-D5).

## The actual problem wasn't "let us auto-approve everything"

The request that started this (`tsk-6bx`) named bee's `gate_bypass`
config as the pattern to learn from. The obvious reading — "add a
config toggle that skips confirmations" — turned out to be the wrong
target. Discussion during clarify surfaced the real complaint: fgOS
already has a legitimate unclear-stop (`awaiting-human`, via `fgos
ask`/`answer`) that intentionally-unattended flows rely on — that one is
working as designed. The actual friction was the *other* kind of stop:
skill-embedded confirmation prompts (`fgos-exploring`'s "Approve
CONTEXT.md?", `fgos-planning`'s "Approve work shape?") firing
unconditionally, even when the artifact behind them was already clearly
complete and there was no real decision left for a human to make.

This reframing (**D1**) is why the feature touches exactly two files
(`fgos-exploring`/`fgos-planning`'s Gate sections) and not the
`awaiting-human` state machine at all. A design that started from the
literal "add a bypass toggle" reading would have touched the wrong
mechanism entirely.

## Why the skip criterion is mechanical, not a confidence read

bee's `gate_bypass` is an explicit, human-set, persisted ceiling that a
session's own live judgment sits *underneath* — never something the LLM
can grant itself by asserting "act as if the level were higher." The
distilled evidence for bee's design is direct about why: an LLM's
in-context read of "is this actually fine to skip" is exactly the kind of
judgment a crafted item description (untrusted input, RUL45) could talk a
session into faking.

fgOS's skip criterion (**D2**, `hasOpenItems`) sidesteps that specific
risk by being mechanical rather than a confidence read: does the artifact
have a `TODO`/`FIXME` marker, or a `## Outstanding questions` section
whose body isn't literally `None`? A program can check this without
trusting the session's own self-assessment at all. That is *why* fgOS
doesn't need bee's exact four-level `gate_bypass` scheme to get the same
safety property bee's scheme protects — the underlying trigger here is
already inspectable, not a vibe.

## Why there's still a human-set ceiling anyway (D5)

Given D2's mechanical check, an obvious follow-up question came up
directly during planning: if the check is already deterministic, does a
config ceiling add anything, or is it just process for its own sake?

The answer is that mechanical-and-self-graded are two different axes.
`hasOpenItems` being inspectable doesn't change *who* is doing the
inspecting — it's still the same session reading its own artifact, one
step removed from the exact self-assessment risk D2 was designed around.
D5 keeps a second, independent axis (the item's `tier`, reused from
`src/state/work.mjs`'s existing enum, matched against a repo-wide
config level) precisely so the skip is never authorized by the
mechanical check alone — a human still has to have set a level that
covers this tier, the same two-layer shape ("level covers this lane AND
content is actually clear") bee's own design already uses, just with a
mechanical second layer instead of bee's own risk classifier.

## Why the floor (D4) never bends

Bee's own design keeps a floor even at its most permissive level —
secret-file reads and review P1 findings always stop for a human,
regardless of how far a human has turned the dial. The reasoning bee's
distilled inventory gives for that floor: raising the bypass level is a
deliberate choice to trust *routine* work more, not a decision to stop
caring about the specific cases that are expensive to get wrong.

fgOS's floor reuses the same risk-keyword detection (`HEAVY_KEYWORDS`,
`src/intake/risk-keywords.mjs`) that already exists for a completely
different purpose (Iron Law's hard-gate classification, RUL34) — not a
new list invented for this feature. That reuse is itself a small piece of
evidence for the design: the same signal that already says "this needs
more scrutiny" elsewhere in fgOS is the right signal to say "this can
never silently skip a human" here too, rather than fgOS defining its own,
possibly inconsistent, notion of what counts as high-stakes.

## What this means for the next person extending it

Any future addition to what auto-approves should ask the same two
questions this design asks: (1) is the trigger a mechanical, inspectable
fact, not a live confidence read, and (2) does raising the ceiling still
leave the existing hard-gate floor untouched? A change that answers "no"
to either isn't really the same feature anymore.
