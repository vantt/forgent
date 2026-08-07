# Why `clarify` split into `clarify`, `discovery`, and `exploring`

`tsk-5kn` split fgOS's single `clarify` stage into three real stages in
the `coding` domain's stage graph — `clarify`, `discovery`, `exploring`
— added a new reusable `fgos-researching` skill, and reverted the
`discover`/`decompose` CLI verbs back to being pure write doors. This
followed a 7-round shaping discussion (`docs/history/fanout-and-
delegation-rubric/DISCUSSION.md`) plus a further clarify round on the
item itself.

## The organizing principle: who is the author, not who approves

The boundary between the three new stages isn't about topic — it's about
**who authors the content that changes at that stage**, never about who
signs off on it:

- **`clarify`** — clarifying **intent**. A person is the author. This
  kind of question cannot be researched — no amount of repo-scanning or
  web search answers "what do you actually want."
- **`discovery`** — clarifying the **solution**. A machine is the
  author, working alone: reading the description, scouting the repo's
  own ecosystem, looking things up externally, concluding for itself
  whether the picture is clear or not.
- **`exploring`** — locking a **product decision**. A person is the
  author again. This class of decision only arises *after* research has
  laid out the real choices — it can't be made before discovery happens.

This author/approver distinction has a direct operational consequence: a
stage where the *machine* is the author can be drained automatically by
a loop (stopping only at an approval gate, if one exists); a stage where
a *person* is the author cannot be touched by a loop at all. Merging
`clarify` into `discovery` would have destroyed the whole cluster's
ability to self-run, since a human-authored stage can never be
automated regardless of how it's labeled.

## Why `clarify` stayed instead of being fully replaced

The array became `clarify → discovery → exploring → decompose →
executing`. Keeping `clarify` (rather than replacing it outright with
`discovery`) matters because "person is author" and "machine is author"
are genuinely different kinds of work that shouldn't collapse into one
stage just because they're adjacent. The stage graph already had a
direct `clarify → executing` edge before this change, confirming stage
is a *position*, not a *mandatory step* — a small item can still jump
straight through without visiting every stage, so adding a stage doesn't
impose a hard tax on every item.

## The new `fgos-researching` skill: reusable, stage-agnostic, never self-aware of its caller

The research capability itself was deliberately built as a skill that
takes `(description, what's already known)` and returns `(the answer,
a clear/unclear verdict)` — and is never told which stage invoked it.
This isn't incidental: `discovery` calls it as its main job, but
`exploring` also calls it *mid-stage* whenever a person names something
unresolved during a product decision (a library, a concept, an unknown
term) — that mid-exploring call is the *same* skill, dispatched the same
way, not a special case bolted onto `exploring`.

The trigger for firing research abandons "does the agent already know
this" entirely — the only real question is *which path* to resolve it
through: if the name is findable in the repo, read it there directly; if
it isn't, look it up externally. "Does the agent know" is unanswerable
in general and invites guessing; "is this findable locally or not" is a
mechanical fact.

Research findings accumulate in `docs/history/<feature>/RESEARCH.md`,
growing round over round rather than being overwritten — and are kept
deliberately separate from `CONTEXT.md`, since the two documents carry
different confidence levels: `RESEARCH.md` is raw findings, `CONTEXT.md`
is locked decisions. `RESEARCH.md` also captures real `WebSearch`/
`WebFetch` calls, not just repo `rg` scans — external lookups are a real
part of the discovery phase's job, not an afterthought.

## Why "no available soul" was ruled out as a real case

One objection considered and rejected: what if a `discovery`-stage item
needs to dispatch research but no live session is around to run it? This
case doesn't actually exist — `fgos-runner` already spawns a real worker
process for `executing` work (`loop.mjs`'s `spawnWorker`), and that
worker spawn is a genuine agent loop, not a stub, per the repo's own
nesting rule (decision 0026). The same mechanism that already dispatches
`executing` work extends to dispatching `discovery`-stage research —
nothing new had to be invented for "who runs this when nobody's
watching."

## Reverting the verbs to pure write doors, and removing the judge subprocess from all three consumers

A second major thread of this item: `resolveDiscovery`/`resolveDecompose`
had their defaults inverted — the caller-supplied verdict path becomes
the *main* path, with the CLI verb reduced to a pure "receive a verdict,
write it" door. The reasoning: the one-door-write rule only requires
every *write* to go through the CLI — it never required the verb itself
to be the thing that *produces* the value being written. A live session
(running `fgos-exploring`, `fgos-researching`, etc.) has already done
the real reasoning; the subprocess judge exists specifically for the
case where nobody has, and that case shrank once research became a
proper stage with its own skill.

`runJudgeExecutor` (the shared subprocess-spawning core) had exactly
three real consumers — `judgeDiscovery`, `judgeDecompose`, and
`judgeVerifySemanticCorrectness`, confirmed via both `rg` and a GitNexus
call-graph check. The judge was removed from all three, not just
discovery — removing it from only one would have left the shared
function's other two callers exactly as reliant on a blind subprocess
judge as before.

`judgeVerifySemanticCorrectness` (the second-pass verify check
documented at length in `docs/explanation/judge-verdict-second-pass-
semantic-check.md`) turned out **not symmetric** with the other two: it
runs unconditionally on every `verdict.clear`, even a caller-supplied
one — unlike `judgeDiscovery`/`judgeDecompose`, which only fire when no
caller verdict was given. Live evidence for why this asymmetry mattered:
two real disputes happened on `tsk-5kn` itself, on the very day this was
decided, despite `--verdict` always being passed. The resolution kept
the mechanical, non-subprocess check (`matchesKnownBadVerifyPattern`)
inside the verb — a verb can't call the Task tool, the same structural
limit motivating the write-door reframing above — while removing the
LLM-fallback branch (the `runJudgeExecutor` call) entirely. The real
cost, named explicitly rather than glossed over: the verb itself can no
longer catch a certain class of error on its own (a structural false-
negative in the mechanical regex check) — that responsibility shifts
outward, to the calling skill and to `fgos-validating`'s own discipline.

## Migration: 57 open `clarify` items sorted by real signal, not touched uniformly

At the time of this decision, 57 open items sat at `clarify`. Rather
than bulk-migrating them to one new stage, each was routed by what had
actually happened to it: an item nobody had touched yet stayed at
`clarify`; an item that already had a locked decision ID moved to
`discovery`; an item currently parked `awaiting-human` moved to
`exploring`. The migration mirrored real state already on each item,
rather than guessing.

## A named, deliberately unresolved risk: could `clarify` and `exploring` re-merge in practice?

Both `clarify` and `exploring` are dialogues with a person, so in
practice an agent might ask an intent question and a decision question
in the same turn, with an item bouncing back and forth between the two.
The thing meant to prevent that collapse is `discovery` sitting in
between: intent has to be clear *before* research can run, and a product
decision can only surface *after* research has laid the real choices on
the table.

This was explicitly named as a risk to *measure later*, not resolved by
assumption now: if running this for real shows an agent routinely asking
both kinds of question in one turn with no research actually happening
in between, that's real evidence the two stages should merge after all —
a signal to observe, not a judgment call made in advance.

## What stayed explicitly out of scope

- **Fan-out B** (bursting N children in parallel after decompose) — a
  separate item, `tsk-umc`.
- **Naming the "review-class" cell** in the L1 dispatch grid — D9 removed
  `judgeVerifySemanticCorrectness` from the shared judge layer, but
  formally classifying it as a named dispatch class is a different,
  not-yet-filed piece of work.
- **Amending `tsk-29i`'s anti-ad-hoc-delegation rule** — considered and
  explicitly rejected as unnecessary: that rule only forbids ad hoc
  sub-dispatch and points toward routing explicitly through the
  capacity-dispatch mechanism — the new research skill's own contract
  *is* that mechanism, so nothing about the existing rule needed to
  change.

## Implementation (`tsk-1w7`, P4 of this design): why adding two stages didn't need a wider footprint

Adding `discovery`/`exploring` to `DOMAINS.coding`'s stage list needed
its `skillMap` to point at real skill files — which is why this piece
depended on P1 (`fgos-researching`) and P2 (`fgos-clarifying`) already
existing, rather than adding stages ahead of the skills that back them.

A real cross-check at `fgos-validating` bounded the footprint precisely
rather than by guess: `getDomain`/`skillForStage` have 9 real consumer
files (`store.mjs`, `frontier.mjs`, `stage-fsm.mjs`, `decompose.mjs`,
`dispatch.mjs`, `loop.mjs`, `anti-loop.mjs`, `discovery.mjs`,
`bin/fgos.mjs`), but only `frontier.mjs` and `stage-fsm.mjs` read
`domain.stages` *generically* (no hardcoded stage names) — the other
consumers read stage information in ways unaffected by adding new stage
names to the list. `dispatch.mjs`/`anti-loop.mjs` specifically hardcode
the literal string `'executing'`, but D10 (the locked stage array
above) never reused or renamed that stage, so those two files needed no
change at all to keep behaving correctly. This confirmed the fix could
stay scoped to the stage-graph definition itself, without widening the
footprint into files whose behavior the new stages didn't actually touch.

## Implementation (`tsk-5mj`, P5 of this design): the runner dispatches `discovery` the same way it already dispatches `executing`

The final piece wired `fgos-runner` to actually hand off `discovery`-
stage items to a worker running `fgos-researching`, via the same
`spawnWorker`/`createWorktree` machinery already used for `executing`
work (D6/D1 above) — no new dispatch mechanism, reusing the existing
worker-spawn path end to end. The old call site —
`resolveDiscovery` at `loop.mjs:1031`, invoked with no caller verdict —
was removed outright, confirmed by the item's own verify asserting
`! rg -q "resolveDiscovery" src/runner/loop.mjs`. This is the concrete
runner-side counterpart to D16 above (`resolveDiscovery`'s no-verdict
branch becoming a safe no-op): once the runner no longer calls
`resolveDiscovery` at all for this path, dispatching the real research
skill through the worker mechanism is what actually replaced it.

## Implementation (`tsk-1x3`, P3 of this design): `judge-executor.mjs` was deleted outright, not just unused

The verb-reversion + judge-removal half of this design (D1, D9, D6 above)
landed as its own implementation piece. The removal went further than
leaving dead code behind: `src/intake/judge-executor.mjs` — the shared
subprocess-spawning core all three judge consumers used — was **deleted
from the repo entirely**, confirmed by the item's own verify command
asserting `! test -f src/intake/judge-executor.mjs`. Nothing was left
half-removed for a future cleanup to find.

**A real footprint-discovery gap surfaced during `fgos-validating`**:
scouting with `rg` found 3 test files —
`judge-verify-second-pass-stability.test.mjs`, `discovery.test.mjs`,
`decompose.test.mjs` — importing `readScoutNotes`/
`judgeVerifySemanticCorrectness` directly from `judge-executor.mjs`, a
dependency the item's original footprint had missed. Left unfixed,
deleting the file would have broken `npm test` immediately on the very
next run. Caught and fixed in the same pass, before the removal landed —
the reality-check gate doing exactly the job it exists for.

### `resolveDecompose` turned out asymmetric with `resolveDiscovery` (D16)

A design assumption from the shaping discussion didn't survive contact
with the real code: `resolveDecompose`'s own no-verdict branch genuinely
falls through to a real `judgeDecompose` call (only skipped when
`plan.md` itself states `tiny`/`small`) — it isn't a mirror of
`resolveDiscovery`'s equivalent branch. Scouting found `runOnce`
(`loop.mjs`) is the **only** caller that never supplies a verdict at
all. Rather than making that branch throw (which would be a real
regression, since the runner has never actually executed this path in
this repo's dogfood history — no observable behavior would change), the
no-verdict branch became a safe no-op instead: never throws, never calls
the now-removed judge. This applies the same reasoning D6 already used
for the discovery side: since the runner has never run for real here, a
no-op changes nothing observable today, while a throw would be the
actual regression if someone enables the runner later.

### `judgeVerifySemanticCorrectness` behaves differently from its two siblings (D17)

Reading `discovery.mjs`/`decompose.mjs` directly confirmed
`judgeVerifySemanticCorrectness` runs **unconditionally** on every
`verdict.clear` — including a caller-supplied one — unlike
`judgeDiscovery`/`judgeDecompose`, which only fire absent a caller
verdict. This wasn't theoretical: two real disputes happened on
`tsk-5kn` itself, on the same day, despite `--verdict` always being
passed explicitly. The fix kept the mechanical,
non-subprocess check (`matchesKnownBadVerifyPattern`) living directly in
the verb — a verb structurally cannot call the Task tool, the same limit
motivating the whole D1 write-door reframing — while removing the
LLM-fallback branch (the actual `runJudgeExecutor` call) outright. The
real, named cost: the verb itself can no longer catch a structural
false-negative in that mechanical regex check on its own — that
responsibility moves outward, to the calling skill and to
`fgos-validating`'s own discipline, rather than staying inside the verb.

Full decision record (D1-D17), the 7-round shaping discussion, and the
scout evidence behind each locked decision:
`docs/history/fanout-and-delegation-rubric/CONTEXT.md` and
`DISCUSSION.md`.
