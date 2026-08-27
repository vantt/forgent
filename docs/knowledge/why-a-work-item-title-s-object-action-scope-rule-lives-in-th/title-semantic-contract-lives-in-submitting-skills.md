---
type: explanation
source_capture_ids: [tsk-52g-2]
framework: diataxis
mode: explanation
---

# Why a work item title's "object + action + scope" rule lives in the submitting skills, not just the decompose prompt

A work item's `title` reaches the store through exactly two mechanical
doors — `addWork` and `editWork` (`src/state/store.mjs`) — and each is now
bounded to 100 characters, truncated rather than rejected
(`docs/history/work-item-title-contract/`, `tsk-52g-1`). Length is
something a string cut can enforce. Whether a title actually says
*something* — names the object being touched, the action being taken, and
the scope it's bounded to — is not. A cut function can guarantee where it
stops; it cannot guarantee the result means anything.

## Where the semantic rule was placed, and why

The rule was written into three places an author reads before a title gets
produced, never into a mechanical check:

- `plugins/fgOS/skills/submit/SKILL.md` — the skill loaded before
  `/fgOS:submit`, which is where a human-composed free-text ask becomes the
  text `deriveTitle` derives a title from.
- `.claude/skills/fgos-submit-assist/SKILL.md` — the classifier skill that
  reads the same free text (to pick tier/kind/risk) before filing it.
- The `decompose` LLM prompt's child-title instruction
  (`src/intake/plan.mjs`), for the one other path that produces a
  title: an LLM choosing a name for a split-off child item.

The measurement that decided where the *weight* of this guidance should
sit: at the time work-item-title-contract's decisions were locked, **0 of
54** stored work items had a `parent` — the `decompose` LLM child-title
path had never yet produced an item that made it into the store. Every
title in the store had come through `submit` or `add`, both of which a
person or an agent drives by reading a skill first. Binding the semantic
rule only to the `decompose` prompt — the intuitive place, since it's the
one path with an actual model in the loop that could conceivably "try" to
satisfy a rule — would have bound it to the path with the least real
effect. The submitting skills are where the rule reaches the titles that
actually exist.

## Why this couldn't be a mechanical check instead

`deriveTitle` (`src/intake/classify.mjs`) is a pure string transform: it
finds a sentence boundary, or falls back to a hard cut, and now bounds
whatever comes out to 100 characters. None of that machinery can tell
whether "Fix the bug" names an object, an action, and a scope — it's three
words that satisfy any length rule and no semantic one. Enforcing "does
this title mean something" mechanically would require the store to judge
natural-language content at write time, which is a materially different
kind of gate than a length check, and not one this item's own scope
covers. The prompt instruction can *ask* the LLM composing a child title to
follow the rule; nothing downstream verifies that it did. That gap is
named plainly rather than papered over: this is guidance for whoever is
composing the text, not an assertion the store can make about the result.

## What a thin capture looks like when the work itself was small

This item's own predicted/actual capture is intentionally unremarkable:
predicted `standard` tier, 0 deps, ran once, passed, no friction recorded.
The genuine substance of the outcome is in the placement decision above,
not in a colorful failure story — three prose edits, no code path change,
verified by a `grep` on one of the three files and the existing
`test/intake/plan.test.mjs` suite staying green (its own comment
confirms nothing in that suite snapshots the prompt's literal text, so
there was nothing for the edit to silently break there).

## What this means for the next semantic (not mechanical) rule

A rule that a length check, a regex, or a validator can enforce belongs at
the write door every path shares — that's `MAX_TITLE_LENGTH` in
`addWork`/`editWork`, per the sibling decision this item's parent made. A
rule that only a human or a model *composing* the content can honor
belongs in the skill or prompt that composer actually reads before acting
— and belongs in whichever of those paths the real data shows is
producing the content in question, not the path that merely looks like
the natural home for it.

## The `description` gap this contract's own migration deliberately avoided walking into

The title-derive-from-description migration this family of decisions
describes (`tsk-4zg`, `docs/history/work-item-title-contract/CONTEXT.md`
D4) had a landmine it stepped around rather than triggered: `deriveTitle`
on empty input returns the placeholder `'Untitled submission'` — so
re-deriving a title from a *missing* `description` would have destroyed
whatever real title an item already had. `tsk-4zg` measured this before
running: 53 of 187 items had no `description` at all, and it deliberately
skipped exactly those 53 rather than re-deriving over them, filing the gap
as its own explicit follow-up (`tsk-535`).

That follow-up confirmed the danger was real but not yet triggered — no
title was ever actually lost — while also confirming the gap kept
growing as the store scaled: by the time `tsk-535` measured again, the
same defect (three separate write paths — `fgos add` with no
`--description` flag, decompose-child creation, and the runner's
discovered-work channel — all could produce an item with no
`description`) had grown from 53/187 to 112/398 items. `tsk-535` closed
all three write paths (required `--description` on `add`, no silent
default; decompose children get `description = title` per its own D2,
deliberately not the newer `action` directive-prose field tsk-3xd added,
since duplicating that would add no new meaning; the runner's
discovered-work path falls back to `title` the same way) and backfilled
every already-broken item through the same `edit` verb `tsk-4zg`'s own
re-derive pass had already used — no new mechanism, the existing
one-door-write applied per item.

The generalizable point: a defensive skip in one item (`tsk-4zg`'s
"don't re-derive over nothing") is a mitigation, not a fix — the write
paths that keep producing the gap it skipped around still needed their
own item to actually close.
