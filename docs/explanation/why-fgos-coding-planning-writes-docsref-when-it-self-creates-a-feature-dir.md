---
authoritative_for: why fgos-coding-planning writes docsRef immediately after creating a new docs/history/<feature>/ dir for a clear-discovery item, instead of only reading docsRef the way its Bootstrap step normally does
---

# Why fgos-coding-planning writes `docsRef` when it self-creates a feature dir

`fgos-coding-planning`'s Bootstrap step only ever *reads* `work.docsRef`
to find an already-existing feature directory — it never wrote that field,
because normally `docsRef` is already set by whatever ran `exploring`
before planning starts. But a `clear`-discovery item skips `exploring`
entirely (no ambiguity found, so no `CONTEXT.md`, no `docsRef` ever gets
set), and when planning itself creates a brand-new
`docs/history/<feature>/` directory for such an item, nothing ever
recorded that path back onto the item.

## The real symptom this caused (`tsk-bc7`)

`tsk-bc7` was `risk: heavy`, discovery verdict `clear`. `fgos-coding-
planning` created `docs/history/tsk-49i-iron-law-port-followup-audit/
plan.md` — named after the feature, not the item id — then handed off to
`fgos-coding-validating`, whose gate approved normally; `fgos plan
--verdict pass-through` and `fgos return` both ran clean. Only at `fgos
approve <id>` did the real refusal surface:

```
work "tsk-bc7" cannot move to "delivered" -- risk:heavy but no plan.md
found on branch "fgw/tsk-bc7" (checked docs/history/tsk-bc7/plan.md);
write one before landing.
```

## Root cause: two hardcoded candidate paths, neither matched

`assertPlanEvidence` (`src/state/store.mjs:499-518`) only ever looks in
two places for a heavy-risk item's `plan.md`: `work.docsRef + '/plan.md'`
(if `docsRef` is set) or the hardcoded `docs/history/<id>/plan.md`. Because
planning named the directory after the feature slug instead of the item
id, and never wrote `docsRef` to point at it, *both* candidate paths
missed — even though `plan.md` genuinely existed, was genuinely committed,
and had already passed `validateApprove`'s own gate.

The workaround used for `tsk-bc7` at the time (`git mv plan.md` back to
`docs/history/tsk-bc7/plan.md`, commit, retry approve) fixed that one
item, not the underlying gap.

## The fix

`fgos-coding-planning` now calls `fgos edit <id> --docs-ref
docs/history/<feature>/` immediately after creating a new feature
directory, whenever `item.docsRef` is still empty. `--docs-ref` was
already a real, existing CLI flag (`bin/fgos.mjs:1623`) — no new verb was
needed, just a missing call to it on this one branch (`clear`-discovery,
self-created dir) that no skill had exercised before.

## A related, but independently-tracked, same-root-cause bug

A sibling item, `tsk-61j`, shares the same underlying gap — `docsRef`
never getting set on some code paths — but hits a *different* consumer
(`citesRealEvidence` in `decompose.mjs`'s heavy-risk D-ID bypass check,
rather than `assertPlanEvidence`'s heavy-tier delivered-gate) through a
*different* skill (`fgos-exploring`, since the `clear`-discovery branch
never runs through exploring at all). The two were deliberately tracked
and fixed as separate items — same root symptom class, but no hard
dependency between them, since they touch different files and skills.

## Source

`tsk-4sx`. Verify: `npm test && grep -q "docs-ref"
.agents/skills/fgos-coding-planning/SKILL.md && grep -q "docsRef"
.agents/skills/fgos-coding-planning/SKILL.md && ! git diff --name-only
main...HEAD | grep -q '^src/'` (a prose-only fix, no `src/` change).
