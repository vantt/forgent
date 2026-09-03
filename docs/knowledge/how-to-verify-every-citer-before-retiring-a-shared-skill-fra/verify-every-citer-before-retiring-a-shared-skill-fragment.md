---
type: how-to
title: How to verify every citer before retiring a shared skill fragment
tags: []
timestamp: 2026-08-10T11:00:00.000Z
source_capture_ids: [tsk-4ns]
framework: diataxis
mode: how-to
---
# How to verify every citer before retiring a shared skill fragment

Use this when a plan's own item description assumes a shared
`_shared/*.md` fragment (or any file multiple `SKILL.md`s point to by
path) has exactly one live consumer, and proposes retiring the whole
file once that one consumer is stripped.

## The mistake this guards against

An item's own description can be wrong about how many consumers a
shared fragment has — it was written before anyone actually checked.
`tsk-4ns`'s own description said: "if that was
`executor-dispatch-fallback.md`'s only remaining consumer, retire that
shared fragment too." A repo-wide grep at planning time found this
assumption false:

> "Checked with a repo-wide grep: it is NOT the only consumer. Six
> other stage skills (`fgos-coding-validating`, `fgos-coding-implement`,
> `fgos-fanout`, `fgos-coding-planning`, `fgos-coding-exploring`, `fgos-researching`)
> cite this fragment's "Valid reasons to dispatch" list directly, in
> their own never-delegate-reasoning rule. Deleting the file would
> leave all six pointing at nothing."
> — real `plan.md`, `docs/history/strip-submit-assist-classify-dispatch/plan.md`

Retiring the file on the original assumption would have silently
broken six unrelated skills' own citations.

## Steps

1. Before writing the plan's file-touch list, grep the whole skills
   tree for every citer of the fragment's own path — not just the one
   consumer named in the item's description:

   ```
   grep -rln executor-dispatch-fallback .claude/skills
   ```

2. Read each hit. Sort them into two groups: the consumer this item is
   actually stripping, and every other skill still citing the fragment
   for its own reasoning.

3. If other citers remain, revise scope before implementing: keep the
   file, and only update the specific mentions that assert a now-false
   claim (e.g. "the one real live consumer today"). Do not delete a
   file six other skills still point to.

   > "Revised scope: `executor-dispatch-fallback.md` stays. Only the
   > three literal mentions of `submit-assist-classify` inside it (an
   > illustrative example, a "one real live consumer" claim, and the
   > Precedent section's own retelling) get updated to stop asserting a
   > live consumer that no longer exists, while its actual reusable
   > content (the four-reason list, Steps A-D) is untouched."
   > — real `plan.md`, `docs/history/strip-submit-assist-classify-dispatch/plan.md`

4. If no other citers remain, the original retire-the-file scope is
   safe to keep as planned.

## Why this matters

An item's own `description` is written at submit time, before anyone
has read the fragment's real citers — treating it as settled fact
instead of a claim to verify turns "one file to update" into "one file
to update, plus six broken citations" the moment the file disappears.
The grep is cheap; a silently broken shared reference in six other
skills is not.

## Related

- `docs/how-to/find-every-caller-before-requiring-a-cli-flag.md` — the
  same shape one layer down (code-level CLI callers instead of
  skill-level doc citers), at the `fgos-coding-validating` stage instead of
  planning.
- `docs/how-to/reuse-the-shared-executor-dispatch-fallback-fragment.md`
  — the fragment this example is drawn from, and how to wire a new
  consumer onto it.
- `docs/history/strip-submit-assist-classify-dispatch/plan.md` — the
  full plan this example is drawn from.
