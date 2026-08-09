---
type: explanation
title: The coding-classify-intake capacity's full lifecycle — created, never wired, retired as dead config
tags: []
source_capture_ids: [tsk-3fj]
---
# The coding-classify-intake capacity's full lifecycle — created, never wired, retired as dead config

`.fgos/config.json`'s `runner.capacities` entry for `submit-assist-classify`
/ `coding-classify-intake` existed for a short span across three separate
items, ending in its own removal. The full arc is worth tracing as one
story, since no single item's own record shows the whole thing.

## Step 1 (`tsk-3fj`): rename+move into the coding domain

`tsk-3fj` renamed and moved `runner.capacities.submit-assist-classify` so
it resolved through `DOMAINS.coding` instead of as a bare global capacity
id — mirroring the same `getDomain(domain).skillMap.retrospective`
precedent (decision 0027 D5) already used elsewhere for domain-scoped
resolution. Applied as a direct, single-parent commit on main per ADR0020
(a `fgw/<id>` branch can never carry a `.fgos/` change — precedent
`tsk-5ge`/`tsk-5vf`/`tsk-4eu`, `docs/how-to/fix-fgos-write-rejected-merge-block.md`),
never through the item's own branch.

This item ran concurrently with a second, independent `.fgos/config.json`
edit (`tsk-53n`, adding `needs`/`for` to real capacity blocks) — its own
description named the conflict explicitly and sequenced around it rather
than racing it:

> "CONFLICT NOTE: tsk-53n is live (status doing, stage executing) with the
> SAME footprint (.fgos/config.json) - do not start until tsk-53n's own
> .fgos/config.json edit has landed or this item's own diff is confirmed
> non-overlapping."
> — real work item description, id `tsk-3fj`

The rename itself deliberately deferred fixing the one real consumer that
still referenced the capacity by its old name
(`.claude/skills/fgos-submit-assist/SKILL.md`'s classify step) to a
sibling item, rather than trying to land both in the same change.

## Step 2 (`tsk-4ns`): the deferred consumer fix became a removal instead

`tsk-4ns` (a child of the same parent, `tsk-5wz`) later evaluated whether
`fgos-submit-assist`'s classify step should actually dispatch to this
capacity at all, checking it against the four valid dispatch reasons
`capacity-dispatch-fallback.md` itself names (cheaper model, different
provider, resource isolation, parallelism). Finding none applied, it
stripped the dispatch branch from `fgos-submit-assist/SKILL.md` entirely
rather than fixing the stale name reference `tsk-3fj` had deferred to it:

> "this step used to optionally dispatch to a `submit-assist-classify`
> capacity"
> — real, current `.claude/skills/fgos-submit-assist/SKILL.md:50`

This left the `.fgos/config.json` capacity entry itself orphaned —
`tsk-4ns`'s own footprint never touched the config file, only the skill
prose that used to reference it.

## Step 3 (`tsk-49u`): confirming dead, and removing it

`tsk-49u` traced the real dispatch path in `src/runner/dispatch.mjs` and
found `spawnWorker`'s `capacityIdForWork` never resolves a capacity by
this name at all — the one designed consumer was exactly the classify
step `tsk-4ns` had already stripped. With zero remaining references
anywhere in `src`/`bin`/`docs`/`.claude/skills` outside the config entry
and its own pinning test:

> "Verdict: **dead, by a deliberate and already-executed decision**, not
> neglect. What was actually still orphaned: the `.fgos/config.json`
> `runner.capacities.coding-classify-intake` entry itself — `tsk-4ns`'s
> own footprint never touched it."
> — real decision record, `docs/history/tsk-49u-coding-classify-intake-retirement/CONTEXT.md`

With explicit human sign-off, the entry was removed via the same
split-commit shape `tsk-3fj`'s own plan had used for the original rename
— a direct main-checkout hand-commit for `.fgos/config.json` (ADR0020),
plus a companion commit on the item's own branch rewriting the pinning
test to assert the entry's absence instead of its existence.

## The lesson

A capacity's config entry and its consuming skill's dispatch branch are
two independently-editable surfaces that can drift out of sync — renaming
or moving the config entry (`tsk-3fj`) doesn't guarantee the consumer
still points at it, and removing the consumer's dispatch branch
(`tsk-4ns`) doesn't automatically clean up the config entry it stopped
using. Neither item was wrong to defer the other's cleanup at the time —
but the gap between them left dead config sitting in a live file until a
third item (`tsk-49u`) went looking for it specifically. A capacity
rename or a consumer's dispatch-branch removal is worth checking against
the other side explicitly, rather than assuming the sibling item deferred
to will actually close the loop.
