---
framework: diataxis
mode: explanation
---
# Why a retired stage name sometimes keeps a drain-only alias

Renaming a stage is not a text edit. A work item's `stage` field holds the
old name, no verb can relabel a live item's `stage`, and an item whose
stage resolves to nothing reads as "no skill, stop" — forever. So the
question a rename has to answer is not "what is the new name" but "what
happens to the items standing on the old one".

This repo has answered it both ways, deliberately, and the difference is
the useful part.

## The two options, and what decides between them

When `decompose` was renamed to `planning` (the verb `fgos decompose` →
`fgos plan` and the launcher `/fgOS:decompose` → `/fgOS:plan` followed),
**four** items were open on the old stage name: one `blocked`, one
`awaiting-human`, one `doing`, one more `doing`.

Two of those four were waiting on a person. That is what settled it:
draining first would have traded a technical blocker the renaming session
could clear itself for a human blocker it could not — and this rename was
blocking an entire tree of downstream work. Trading a blocker you control
for one you don't is a loss.

So `decompose` stayed as a **legacy, drain-only alias**:

- still present in the domain's `stages` array,
- still holding its `skillMap` entry,
- still keeping its outgoing edge,
- but carrying **no `stepMap` entry**.

Items already standing there keep resolving to a skill and can finish. No
*new* item can ever land there, because landing requires a `stepMap` entry.
The follow-up is to delete the alias once the count reaches zero.

## Why the missing `stepMap` entry is the right lever

Dropping the `stepMap` entry is not a trick invented for this rename — it
is how `discovery` and `exploring` were already handled. That matters,
because `stageForStep` carries a one-stage-one-step invariant: if
`decompose` and `planning` both mapped to the same step, that invariant
would break and the lookup would become ambiguous.

Leaving the alias out of `stepMap` keeps the invariant exactly as it was
while still letting the old name resolve for items that already carry it.
The alias is reachable by items, unreachable by steps.

## The opposite call, on the same kind of change

`clarify` was retired as a stage entirely — moved to a pre-item-creation
Init helper called before an item exists, never a stage-skill again — and
it kept **no** alias.

Ninety items were open on `clarify` at rename time, far more than the four
that justified the `decompose` alias. The difference was not the count. It
was that those ninety could actually be moved: a migration script relocated
them for real, so nothing was left standing on the retired name and no
alias was needed.

The rule the two cases jointly establish:

> Migrate the open items if you can move them. Keep a drain-only alias only
> when you cannot — and when the alternative is waiting on a person while
> the rename blocks other work.

An alias is a debt with a named payoff condition (count reaches zero), not
a permanent second name. Writing the deletion follow-up at the same time as
the alias is what keeps it from becoming one.

### Why `clarify` had somewhere to migrate *to*

The migrate-don't-alias choice was made explicitly, and the reasoning is
worth keeping: handle it definitively by migration rather than leave behind
another alias that someone has to clean up later. An alias is real debt,
and this rename was in a position to avoid taking it on.

That position existed because `clarify` was not merely being renamed — it
was being **moved out of the stage axis entirely**. `fgos-clarifying` runs
at Init now, called by the submit path *before* an item exists at all, so
there was a well-defined stage (`discovery`) for the ninety open items to
land on. The order mattered: migrate the ninety first, *then* delete the
`skillMap` entry and drop `clarify` from `stages`.

Contrast that with the `decompose` rename, where the four open items had no
better place to be and two of them were waiting on a person. The rule from
the previous section — migrate if you can move them — is really a question
about whether a destination exists and whether you control the timing.

### The forcing reason: domain has to be known before a stage does

Clarification could not stay a stage, because of an ordering problem in the
data model. `fgos-clarifying` does two things: it rewrites the submitted
text to be clear, and it **classifies the item's domain**. And the domain is
what selects which stage graph applies.

A stage cannot be the place where the domain is decided, because the domain
is what decides which stages exist. That circularity is the real argument
for moving the work to Init.

Nothing else was filling the gap: the deterministic keyword classifier does
not touch domain at all, and submit-assist only infers tier, kind, and
risk. Domain classification had no owner until it moved to Init.

The clear/unclear verdict that used to live inside `fgos-clarifying` split
off to the `discovery` stage-skill, where it belongs — that judgment *is*
stage work, while classification is not.

This also sharpens the prefix rule in the section below.
`fgos-clarifying` takes no `coding` prefix not merely because it is a
helper, but because it runs *before any domain exists* and is the thing
that determines the domain. Prefixing it would name the answer to a
question it has not asked yet.

One sequencing note, since it is easy to get wrong: this change could not
run in parallel with the item creating the `discovery` stage-skill. Both
edit `stages` and `skillMap`, so they had to be serialized regardless of
how independent they looked.

## Verdict values are not stage names

One thing deliberately did *not* change in the rename: the verdict values
`decompose` / `pass-through` stayed byte-for-byte identical.

A verdict names an **outcome** — what the planning step concluded — while a
stage names a **position** in the lifecycle. They happened to share a
spelling; they were never the same vocabulary. Renaming the position had no
reason to touch the outcome, and renaming a stored verdict value would have
been a data migration with no benefit behind it.

When a rename sweep greps the repo for a word, this is the distinction that
decides which matches to change: is this token naming where an item *is*,
or what an item *concluded*?

## Which skills take a domain prefix, and which never do

The same sweep answered a related naming question. Five skills gained a
`coding` prefix (`fgos-exploring` → `fgos-coding-exploring`, and likewise
for planning, validating, compounding, and `fgos-code-implement` →
`fgos-coding-implement`).

Two categories did not, and the reason is structural rather than
stylistic:

- **Helpers** — `fgos-clarifying`, `fgos-researching`. They are called by
  other skills to answer a question; they do not own a position in any
  domain's lifecycle.
- **Cross-domain skills** — `fgos-fanout`, `fgos-indexing`,
  `fgos-routing`, `fgos-unlock`. None owns a stage and none appears in any
  domain's `skillMap`.

The test is a single question: **does this skill own a stage — does its
name appear in some domain's `skillMap`?** If yes, it belongs to that
domain and takes the prefix. If no, a domain prefix would be a claim about
scope that isn't true.

Notably, the four cross-domain skills were classified as *never* prefixed,
not as "deferred to a later item". That distinction is worth making
explicitly at decision time: a deferred rename leaves a reader wondering
whether the current name is wrong, while a settled "never" closes the
question and lets the file set close with it.

## The same alias policy governs spec-doc prose, not just code

The drain-only-alias call above is about `stage`/`skillMap`/`stepMap` —
live engine state. A separate, later sweep (`tsk-5eq`,
`docs/history/spec-docs-lifecycle-realignment/`) applied the identical
policy to prose: rewriting `docs/specs/work-state.md` (`tsk-1uw`) and
`docs/specs/runner.md` (`tsk-2t5`) to describe the current stage names
(`discovery`/`planning`) as primary, while both items' own instructions
explicitly said to keep `decompose` mentioned as its legacy, drain-only
alias rather than scrub every occurrence — the same "migrate what can
move, alias what can't" split this file already documents, just applied
to what a reader of the spec sees instead of what the engine resolves.
