---
type: explanation
title: The coding-classify-intake executor's full lifecycle — created, never wired, retired as dead config
tags: []
source_capture_ids: [tsk-3fj, tsk-4fk, tsk-6ar]
---
# The coding-classify-intake executor's full lifecycle — created, never wired, retired as dead config

`.fgos/config.json`'s `runner.executors` entry for `submit-assist-classify`
/ `coding-classify-intake` existed for a short span across three separate
items, ending in its own removal. The full arc is worth tracing as one
story, since no single item's own record shows the whole thing.

## Step 1 (`tsk-3fj`): rename+move into the coding domain

`tsk-3fj` renamed and moved `runner.executors.submit-assist-classify` so
it resolved through `DOMAINS.coding` instead of as a bare global executor
id — mirroring the same `getDomain(domain).skillMap.retrospective`
precedent (decision 0027 D5) already used elsewhere for domain-scoped
resolution. Applied as a direct, single-parent commit on main per ADR0020
(a `fgw/<id>` branch can never carry a `.fgos/` change — precedent
`tsk-5ge`/`tsk-5vf`/`tsk-4eu`, `docs/how-to/fix-fgos-write-rejected-merge-block.md`),
never through the item's own branch.

This item ran concurrently with a second, independent `.fgos/config.json`
edit (`tsk-53n`, adding `needs`/`for` to real executor blocks) — its own
description named the conflict explicitly and sequenced around it rather
than racing it:

> "CONFLICT NOTE: tsk-53n is live (status doing, stage executing) with the
> SAME footprint (.fgos/config.json) - do not start until tsk-53n's own
> .fgos/config.json edit has landed or this item's own diff is confirmed
> non-overlapping."
> — real work item description, id `tsk-3fj`

The rename itself deliberately deferred fixing the one real consumer that
still referenced the executor by its old name
(`.claude/skills/fgos-submit-assist/SKILL.md`'s classify step) to a
sibling item, rather than trying to land both in the same change.

## Step 1a (`tsk-4fk`): the rename itself left one test assertion stale

Despite `tsk-3fj`'s own plan declaring `test/runner/dispatch.test.mjs` as
part of its footprint, the rename commit (`a61651d`) landed with the
test's executor-name assertion unfixed — line 643 still asserted
`cfg.executors['submit-assist-classify']`, a key the same commit had
just renamed out of `.fgos/config.json`:

> "commit a61651d renamed the .fgos/config.json runner executor from
> submit-assist-classify to coding-classify-intake, but never updated
> this test file's assertion, which still checks
> cfg.executors['submit-assist-classify']. Confirmed live: main's
> committed .fgos/config.json has executors keys judge-discovery,
> judge-decompose, coding-classify-intake (no submit-assist-classify) --
> the test asserts on a name that no longer exists."
> — real work item description, id `tsk-4fk`

This was found as a side effect of an unrelated operation
(`fgos sync-root tsk-19y`, resyncing a different root branch for
`tsk-4n7`'s own close-out) — the same "discovered while doing something
else, confirmed as a real pre-existing red rather than assumed" shape
`tsk-2uo`'s launcher-vocabulary-guard fix and `tsk-53n`'s narrowed verify
both hit independently around the same time
(`docs/how-to/allowlist-a-historical-mention-in-launcher-vocabulary-guard.md`,
`docs/how-to/fix-fgos-write-rejected-merge-block.md`'s `tsk-53n` example).
The fix updated the test's assertion (and its literal executor-name
comments) to check `coding-classify-intake` instead, keeping the same
field-shape assertions the original test already had (`kind: cli`,
`adapter: cli-spawn`, `tier: light`, `allowCrossProvider: true`, args
template) — a same-day self-correction, not a separate discovery further
down the executor's life.

## Step 2 (`tsk-4ns`): the deferred consumer fix became a removal instead

`tsk-4ns` (a child of the same parent, `tsk-5wz`) later evaluated whether
`fgos-submit-assist`'s classify step should actually dispatch to this
executor at all, checking it against the four valid dispatch reasons
`executor-dispatch-fallback.md` itself names (cheaper model, different
provider, resource isolation, parallelism). Finding none applied, it
stripped the dispatch branch from `fgos-submit-assist/SKILL.md` entirely
rather than fixing the stale name reference `tsk-3fj` had deferred to it:

> "this step used to optionally dispatch to a `submit-assist-classify`
> executor"
> — real, current `.claude/skills/fgos-submit-assist/SKILL.md:50`

This left the `.fgos/config.json` executor entry itself orphaned —
`tsk-4ns`'s own footprint never touched the config file, only the skill
prose that used to reference it.

## Step 3 (`tsk-49u`): confirming dead, and removing it

`tsk-49u` traced the real dispatch path in `src/runner/dispatch.mjs` and
found `spawnWorker`'s `executorIdForWork` never resolves a executor by
this name at all — the one designed consumer was exactly the classify
step `tsk-4ns` had already stripped. With zero remaining references
anywhere in `src`/`bin`/`docs`/`.claude/skills` outside the config entry
and its own pinning test:

> "Verdict: **dead, by a deliberate and already-executed decision**, not
> neglect. What was actually still orphaned: the `.fgos/config.json`
> `runner.executors.coding-classify-intake` entry itself — `tsk-4ns`'s
> own footprint never touched it."
> — real decision record, `docs/history/tsk-49u-coding-classify-intake-retirement/CONTEXT.md`

With explicit human sign-off, the entry was removed via the same
split-commit shape `tsk-3fj`'s own plan had used for the original rename
— a direct main-checkout hand-commit for `.fgos/config.json` (ADR0020),
plus a companion commit on the item's own branch rewriting the pinning
test to assert the entry's absence instead of its existence.

## Step 4 (`tsk-6ar`): the consuming skill itself retired, not just its dispatch branch

`tsk-4ns` (Step 2) stripped `fgos-submit-assist`'s dispatch branch but
left the skill's own inline classification step in place — deliberately
deferred, since deleting the skill outright at that point would have
broken `tsk-4ns`'s own in-flight branch, which edited that exact file.
Once `tsk-4ns` merged, a follow-up item checked whether
`fgos-submit-assist` had any step left that wasn't already duplicated
elsewhere:

> "Consequence: `fgos-submit-assist` step 2 is not a unique capability —
> it duplicates step 6b's job with strictly worse input (raw text,
> pre-clarify — the exact 'reading the same text twice, dirty before
> clean' defect `tsk-5wz`'s own description named and fixed at the
> `/fgOS:submit` door)."
> — real `docs/history/retire-fgos-submit-assist/plan.md`

All three of the skill's own steps turned out to already live elsewhere:
title derivation belongs to the `fgos submit` verb itself
(`classify.mjs`'s `deriveTitle`), classification was already re-done,
in-session, on cleaner post-clarify text by `/fgOS:submit`'s own step 6b,
and the third step was just the verb call. With zero real callers left —
and confirmed via `grep -rl "fgos-submit-assist" test/` returning zero
hits, nothing exercising it — the skill was deleted outright, not left
as a defined-but-unused file:

> `d49a52e7 chore(tsk-6ar): retire fgos-submit-assist, superseded by
> /fgOS:submit's own step 6b`
> — real commit, branch `fgw/tsk-6ar`

`executor-dispatch-fallback.md` itself was re-checked at this point too
(8 remaining citers — `fgos-coding-implement`, `fgos-coding-validating`, and
others) and correctly left in place, exactly as `tsk-4ns`'s own earlier
finding already established.

## Step 5 (`tsk-2yo`): why intake classification had no future to be wired into

Steps 1–4 trace *how* the executor and its consumer were removed. This step
is the reason none of it could have been rescued by wiring it up properly:
**tier/kind/risk cannot be judged from the submitted text at all.**

Difficulty is a property of the codebase, not of the sentence describing the
work. A submission saying "add a flag" may be one line or may touch ten call
sites across two guard layers, and nothing in the text distinguishes those.
Judging at intake means guessing, no matter how good the judge is — the
required evidence has not been gathered yet.

So classification moved to the `discovery` stage-skill, which re-judges
tier/kind/risk **after** research, on evidence. It reads its vocabulary
through `getDomain` on the item's own classification rather than
hardcoding the values.

### What this changed upstream

- **`/fgOS:submit` went back to being a thin wrapper**, losing its own
  classification step and its no-soul gate entirely.
- **`classify.mjs` kept its code but changed role.** It is no longer the
  authority on tier/kind/risk; it produces a *provisional value at birth*,
  later replaced by the discovery-stage judgment. Same function, demoted
  from verdict to placeholder.

### The two-tier quality crack this closed

The sharper reason for the move: intake classification was only ever as
good as whether a live session happened to be present.

A submission made without one was stuck with deterministic keyword guessing
**permanently** — including items the runner generates itself. Two items of
identical difficulty would carry different tiers depending on how they
entered the system, and nothing downstream could tell which had been judged
and which had been guessed.

Moving the judgment to discovery means every item is classified the same
way, from evidence, regardless of how it arrived.

### The headless path needs data, not a verb call

One consequence is still load-bearing for the headless route: workers are
forbidden from calling `fgos`. So the worker cannot apply its own
classification — the `fgos-verdict` block's schema has to carry tier/kind/
risk as **data**, and the runner applies it on the worker's behalf.

This is the same shape as every other worker verdict: the worker reports,
the runner writes.

### Retiring the executor needed no migration

`fgos tool remove --name submit-assist-classify` was a pure retire with no
migration step, and the reasoning generalizes: **a executor entry describes
how to invoke something; it holds no judgment of its own.** There is no
accumulated state inside it to carry forward, so nothing needs migrating
when it goes. The decision record was kept.

Contrast that with retiring a *stage*, where open items are standing on the
old name and must be migrated or aliased first. Config that only describes
invocation can be deleted; config that items point at cannot.

## The lesson

A executor's config entry and its consuming skill's dispatch branch are
two independently-editable surfaces that can drift out of sync — renaming
or moving the config entry (`tsk-3fj`) doesn't guarantee the consumer
still points at it, and removing the consumer's dispatch branch
(`tsk-4ns`) doesn't automatically clean up the config entry it stopped
using. Neither item was wrong to defer the other's cleanup at the time —
but the gap between them left dead config sitting in a live file until a
third item (`tsk-49u`) went looking for it specifically. A executor
rename or a consumer's dispatch-branch removal is worth checking against
the other side explicitly, rather than assuming the sibling item deferred
to will actually close the loop.
