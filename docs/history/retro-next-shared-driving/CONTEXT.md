# CONTEXT: tsk-3cx — generalize the driver's advance-axis; retro-next and cleanup-next shrink to launchers

## Feature boundary

Three concepts, named by the user during this item's own exploring pass, are
the frame everything below is decided against:

- **orchestrator** — chooses and coordinates across *many* items
  (`/fgOS:retro-loop`, `/fgOS:cleanup-loop`, `/fgOS:discover-loop`,
  `/fgOS:merge-loop`).
- **launcher** — activates *one* item and sets its ceiling
  (`/fgOS:retro-next`, `/fgOS:cleanup-next`, `/fgOS:discover-next`,
  `/fgOS:pick`).
- **driver** — drives the process on one item: on start, skips every step
  already passed, lands on the correct current step, stops at the ceiling
  (`fgos-coding-driving`).

In scope: `fgos-coding-driving`'s advance-axis, plus `/fgOS:retro-next` and
`/fgOS:cleanup-next` shrinking to their true launcher role. Out of scope:
the merge/approve path itself (`/fgOS:merge-next`, `fgos approve`), and
anything about *which* item an orchestrator picks.

Not in scope as a code change but load-bearing here: this document
supersedes part of `docs/history/stage-status-driving-coordination/CONTEXT.md`
(see D2 and the Superseded section below).

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | **`status` is the full-lifecycle axis; `stage` is the sub-axis.** `src/state/status-fsm.mjs`'s `TRANSITIONS` spans `todo → doing → awaiting-approval → delivered → retrospective → cleanup → done` plus the `blocked`/`awaiting-human`/`wontfix` branches — ten values covering the entire item lifetime. `stage` (`clarify → discovery → exploring → decompose → executing`) only carries meaning while `status ∈ {todo, doing, blocked, awaiting-human}` and is frozen from `awaiting-approval` onward. The driver's advance-axis is therefore generalized to resolve each iteration's next step from **the item's current position** — reading `stage` pre-merge, `status` post-merge — instead of being hardcoded to `domain.stages`. This is not a new axis: `skillMap` (`src/state/workflow-stage-graphs.mjs:147-154`) already holds five stage names *and* one status name (`retrospective`) in one frozen object, put there deliberately by decision record 0027 D5, which recorded that "the two vocabularies never collide" and that which lookup table a key belongs to is the caller's concern. The registry already merged the two vocabularies; only the driver had not caught up. |
| D2 | **`awaiting-approval` changes from an unconditional hard stop into the *default, overridable* ceiling.** A launcher that supplies no ceiling still stops there — today's observable behavior is unchanged. A launcher that deliberately supplies a ceiling beyond it (e.g. `status:cleanup`) drives past it. **Cost, stated explicitly so a later session never removes it by accident:** the human merge gate is no longer protected *structurally* by the driver refusing; it is protected *by convention* — no launcher ships a default ceiling past `awaiting-approval`. Accepted deliberately by the user: ceiling becomes the single mechanism deciding how far a drive goes, with no hardcoded exception inside the driver. |
| D3 | **`/fgOS:retro-next` sets `ceiling: status:cleanup`.** Observable behavior stays byte-identical to today (sweep → pick one → run the domain's `retrospective` skill → land at `cleanup` → stop, leaving TTL-gated finishing to `/fgOS:cleanup-loop`). Only the mechanism underneath changes: its hand-rolled invoke-skill / `fgos move --to cleanup` / classify-by-raw-exit-code sequence is replaced by launcher-sets-ceiling + driver-drives. |
| D4 | **`/fgOS:cleanup-next` is folded into this same item**, shrinking to a launcher the same way. `skillMap` deliberately declares no `cleanup` entry (0027 D5: "pure harness, no skill ever loads for it"), so the driver at that position resolves no skill — how the driver handles a position with no registered skill (today's rule: stop and let the caller's own mechanical verb cover it) is implementation shaping for `fgos-coding-planning`, not a product decision. The original item text excluded `cleanup-next` on reasoning derived from the old framing; the user re-confirmed inclusion under the new one. |
| D5 | **No `waiting-ttl` park reason is needed.** `RESEARCH.md` round 2 proposed one to stop the driver misreading `cleanup → blocked` (a legitimate TTL wait) as a real failure. Scout falsified it: `pickNextCleanupItem` (`src/state/cleanup-pool.mjs`, quoted in `plugins/fgOS/skills/cleanup-next/SKILL.md`'s own description) is "pre-filtered so only TTL-elapsed items are ever passed to the verb" — the launcher already filters, so the driver never receives an item still waiting on TTL. This also weakens `stage-status-driving-coordination` D2(c) further than round 2 recorded. |

## Pinned terms

- **advance-axis** — the axis the driver moves the item *along* each
  iteration. Before this item: always `stage`. After: resolved from the
  item's current position (D1).
- **ceiling** — how far a single drive goes, supplied by the launcher.
  After D2 it is the *only* thing deciding where a drive stops, other than
  the park/anchor/no-progress stops the driver already has.
- **position** — where an item currently is on the combined lifecycle:
  `stage` while pre-merge, `status` once `stage` is frozen. The key
  `skillMap` is looked up by.
- **launcher / driver / orchestrator** — as defined under Feature boundary.
  These are the user's own terms, pinned here as this repo's vocabulary.

## Scout evidence

- `src/state/status-fsm.mjs:99-160` — the full `TRANSITIONS` table; grounds
  D1's claim that status spans the whole lifecycle.
- `src/state/workflow-stage-graphs.mjs:147-154` — `skillMap` holding stage
  names and the `retrospective` status name in one object; the decisive
  evidence for D1.
- `src/state/workflow-stage-graphs.mjs:231-235` — coding's `parkReason`
  table: only `blocked`/`awaiting-human`/`awaiting-approval` declared.
- `src/state/workflow-stage-graphs.mjs:479-492` — `parkReasonForStatus`'s
  own doc comment states it exists so "a domain-agnostic driving loop reads
  this instead of comparing `status` against a coding literal" — the
  indirection layer this item builds on was designed for exactly this.
- `.claude/skills/fgos-coding-driving/SKILL.md` — the driver already reads
  BOTH axes every iteration (`parkReasonForStatus` for three stop branches,
  claims when `status != 'doing'`, filters open children by `status`) and
  already carries a documented "invoked skill does not write state, so the
  driver applies its verdict" exception for stage `discovery`
  (`fgos-researching`, tsk-4b2 D4) — the precedent D-frame reuse rests on.
- `plugins/fgOS/skills/retro-next/SKILL.md` — today's hand-rolled sequence
  (steps 4-6), the thing D3 replaces.
- `plugins/fgOS/skills/cleanup-next/SKILL.md` — the TTL pre-filter quoted in
  D5.
- `docs/history/retro-next-shared-driving/RESEARCH.md` — rounds 1 and 2, the
  full reasoning trail including the round-1 framing error and its
  correction.
- Impact-analysis capability gate at this pass: `fgos tool query
  --capability impact-analysis --status present` returned `gitnexus`
  `present` — posture **full**. Recorded for `fgos-coding-planning` to read
  without re-querying; `fgos-coding-exploring` produces no proof points itself.

## Superseded

`docs/history/stage-status-driving-coordination/CONTEXT.md` D1-D3 rejected
merging the stage-axis driving loop with the status-axis pool sweep. That
rejection was reasoned about merging two **loops**, and never considered
that the **registry both read** (`skillMap`) had already merged the two
vocabularies. Under the launcher/driver split (Feature boundary above), its
four structural breaks resolve as:

- D2(b) "sweeps the whole pool, not one id" — dissolves: pool-sweep-and-pick
  is the launcher's job, never the driver's.
- D2(a) "`fgos-coding-compounding` does not self-advance status" — not a law: the
  driver already carries this exact exception for `fgos-researching` at
  stage `discovery`.
- D2(c) "TTL parks `cleanup → blocked`" — falsified by D5 above (the
  launcher pre-filters TTL).
- D2(d) "worktree vs main checkout" — the driver already reads
  `domain.worktreeBacked` and branches its claim path on it.
- D1 "the human merge gate" — survives, restated by D2 above as the default
  ceiling plus a launcher convention rather than a hardcoded driver refusal.

Per `AGENTS.md`, this supersedes those decision IDs rather than editing them
in place; `stage-status-driving-coordination/CONTEXT.md` stays as written.

## Outstanding questions

None
