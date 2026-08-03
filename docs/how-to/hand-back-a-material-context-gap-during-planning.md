---
type: how-to
title: How to hand a material CONTEXT.md gap back from fgos-planning to fgos-exploring
tags: [fgos-planning, fgos-exploring, decompose, clarify, context-md, hand-back]
timestamp: 2026-07-31T11:41:27.922Z
source_capture_ids: [tsk-4y8]
---

# How to hand a material CONTEXT.md gap back from fgos-planning to fgos-exploring

Use this when you are running `fgos-planning` on a claimed item and
discover, mid-session, that the item's `CONTEXT.md` never addressed
something the plan actually needs.

## Before you start

Until `tsk-4y8`, `fgos-planning/SKILL.md` had exactly one documented exit —
success, handed to `fgos-validating` (its Handoff section). It had no
documented path for a genuine `CONTEXT.md` gap found mid-planning: a
session hitting this either had to improvise a product assumption itself
(straying into `fgos-exploring`'s exclusive territory) or stall, with no
rule covering either.

The fix is not a new stage or a new stage edge. Read directly from
`src/state/fsm.mjs`'s `TRANSITIONS` and `src/state/workflow-stage-graphs.mjs`'s
`DOMAINS.coding.transitions`, the `coding` domain's legal stage moves are:

```
clarify -> executing
clarify -> decompose
decompose -> executing
executing -> compound-learn
```

There is no `decompose -> clarify` edge anywhere. So the hand-back can
never move `item.stage` backward — it has to be a direct, same-session
invocation instead, the same no-stage-move shape `fgos-validating` already
uses when it hands an item back to `fgos-planning` (both of those stay in
`decompose`; `fgos-exploring`/`fgos-planning` are different stages, so that
exact mechanism doesn't carry over unchanged — direct invocation with no
stage move is the real fix).

## Steps

1. **Apply the three-test filter** `fgos-exploring` already uses to its own
   candidate questions — material, grounded, answerable — to the gap you
   found:
   - **Not material** — the answer would not change scope, behavior, data
     shape, or acceptance criteria. Pin it as a labeled assumption in
     `plan.md`'s own Assumptions section instead of asking anyone.
     `fgos-validating`'s reality gate already checks every assumption the
     plan depends on is either proven or flagged as unproven (its own
     Assumptions dimension), so this needs no new container — just name
     the assumption there.
   - **Material** — the answer would change scope, behavior, data shape, or
     acceptance criteria. Continue to step 2.

2. **Invoke `fgos-exploring`'s flow directly, in the same session.** Run its
   Socratic lock (the same material/grounded/answerable filter, one
   question at a time) and append a new D-ID decision to the item's
   existing `CONTEXT.md` — do not start a new `CONTEXT.md`, and never
   reopen or reinterpret a decision `CONTEXT.md` already locked. This path
   exists only for a gap it never addressed, not a second chance to
   override one it did.

3. **Leave `item.stage` untouched the entire time.** It stays `decompose`
   before, during, and after the hand-back — there is no engine call that
   moves it to `clarify` and no such edge exists to apply even if you
   wanted to. Once the new decision is locked, resume `fgos-planning`'s own
   flow from wherever it left off.

## Example: verifying the fix landed correctly

The two touched files (`fgos-planning/SKILL.md`, `fgos-exploring/SKILL.md`)
each exist as two byte-identical copies with no sync script between them
(`.claude/skills/<name>/SKILL.md` and `.agents/skills/<name>/SKILL.md`) —
confirmed by `diff`, both pairs must be edited together or the two
directories drift out of sync:

```
$ diff .claude/skills/fgos-planning/SKILL.md .agents/skills/fgos-planning/SKILL.md
$ diff .claude/skills/fgos-exploring/SKILL.md .agents/skills/fgos-exploring/SKILL.md
```

(No output from either `diff` means the pair is identical.)

The item's own engine-computed `verify` command checks the fix landed
without checking exact wording — it counts the literal phrase "hand back"
(expects exactly 2: the pre-existing one in `fgos-planning`'s Handoff
section, plus the new hand-back-to-`fgos-exploring` one) and confirms
`material`, `fgos-exploring`, and `Assumptions` are all mentioned
somewhere in `fgos-planning/SKILL.md`:

```
$ grep -c 'hand back' .claude/skills/fgos-planning/SKILL.md | grep -q '^2$' \
    && grep -qi 'material' .claude/skills/fgos-planning/SKILL.md \
    && grep -qi 'fgos-exploring' .claude/skills/fgos-planning/SKILL.md \
    && grep -qi 'Assumptions' .claude/skills/fgos-planning/SKILL.md \
    && echo PASS
PASS
```
