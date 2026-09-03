---
framework: diataxis
mode: explanation
---
# Why `awaiting-approval` became an overridable ceiling, not a hard stop

`fgos-coding-driving` used to resolve each loop iteration's next step by
indexing `domain.stages` (`['clarify', 'decompose', 'executing']`) — it
only ever knew how to advance along the `stage` axis, and `stage` freezes
once an item reaches `awaiting-approval`. That made the entire post-merge
chain (`awaiting-approval → delivered → retrospective → cleanup → done`)
structurally unreachable from the driver's own loop: every launcher that
needed to work that chain (`/fgOS:retro-next`, `/fgOS:cleanup-next`) had
to hand-roll its own sequencing outside the shared driver instead of
reusing it.

## The registry had already solved this — the driver just hadn't caught up

`skillMap` (`src/state/workflow-stage-graphs.mjs`) has held five `stage`
names *and* the status name `retrospective` in one frozen lookup object
since decision record `0027` D5, which recorded that "the two
vocabularies never collide" and that which lookup table a key belongs to
is the caller's own concern. The registry was already keyed by **item
position**, not strictly by `stage` — only the driver's own loop still
assumed position always meant `stage`.

## The fix: resolve position, not stage

The driver's advance-axis now resolves each iteration's next step from
the item's *current position*:

- **while `stage` is still live** (`status` is one of `todo`/`doing`/
  `blocked`/`awaiting-human`) — the position IS the item's `stage`.
- **once `stage` is frozen** (`status` is `awaiting-approval` or later) —
  the position IS the item's `status`.

No registry or code change was needed to make this possible —
`skillForStage`/`parkReasonForStatus` already accepted any key; the whole
surface that needed to change was the driving loop's own prose in
`fgos-coding-driving`'s `SKILL.md` (mirrored identically in
`.claude/skills/` and `.agents/skills/`).

## `awaiting-approval`: default ceiling, not an unconditional stop

Before this change, hitting `awaiting-approval` unconditionally stopped
the driver — a hardcoded refusal that also happened to protect the human
merge gate: nothing automated could drive an item past its own approval
point.

That refusal is now conditional: a caller supplying no ceiling still
stops at `awaiting-approval`, exactly as before — today's observable
behavior for `/fgOS:cook` and `/fgOS:pick` is unchanged. A caller that
deliberately supplies a ceiling *beyond* `awaiting-approval` (e.g.
`status:cleanup`) now drives past it.

**What protects the merge gate now:** the gate is no longer protected
*structurally* by the driver refusing to move past it — it is protected
*by a named convention* instead: no launcher in `plugins/fgOS/skills/**`
ships a default ceiling past `awaiting-approval`. Every launcher either
omits `ceiling` entirely or names an explicit `stage:*`/`status:*`
ceiling that stops short of the merge edge; a launcher that genuinely
needs to work the post-merge chain (like `/fgOS:retro-next`, which now
passes `ceiling: status:cleanup`) says so explicitly, and never crosses
the merge edge itself. This is recorded directly in the driver's own
`SKILL.md` as a constraint a future session must *supersede*, not
quietly widen.

## What this unlocked concretely

`/fgOS:retro-next` — previously a hand-rolled sequence of resolving the
retrospective-stage skill itself, invoking it, running `fgos move --to
cleanup`, and classifying a raw subprocess exit code — shrank to a true
*launcher*: pick one `status:retrospective` item, hand it to
`fgos-coding-driving` with `ceiling: status:cleanup`, relay whatever the
driver reports. The driver now owns resolving `fgos-coding-compounding` for the
`retrospective` position and calling `fgos move --to cleanup` once
synthesis completes — the same "engine's verb always wins" shape every
other stage-skill in the driver's loop already followed, just extended
past the point where `stage` itself runs out.
