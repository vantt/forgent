# fgos-coding-planning: hand-back path for a material CONTEXT.md gap

## Feature boundary

`fgos-coding-planning/SKILL.md` currently has exactly one documented exit:
success, handed to `fgos-coding-validating` (line 176-177). It has no documented
path for the case where planning discovers, mid-session, that
`CONTEXT.md`'s locked decisions are silent on something that actually
matters for the plan. Today a planning session either has to improvise a
product assumption itself (fgos-coding-exploring's exclusive territory) or stall.

This item's scope is limited to that one gap: adding a documented
hand-back path from `fgos-coding-planning` to `fgos-coding-exploring` for a *material*
CONTEXT.md gap, plus a documented non-material path (pin as an assumption
in `plan.md`). It does not touch:
- the loop.mjs/anti-loop.mjs dispatch machinery (out of scope, see D3),
- reopening or overriding any decision already locked in an existing
  `CONTEXT.md` (forbidden, unchanged, per fgos-coding-planning's own existing
  hard rule),
- domain classification or item-shape/size judgment (not this item's
  concern).

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | The hand-back never moves `item.stage`. Verified against `src/state/fsm.mjs` (`TRANSITIONS`, no backward edges anywhere) and `src/state/workflow-stage-graphs.mjs` (`DOMAINS.coding.transitions`: `clarify->executing`, `clarify->decompose`, `decompose->executing`, `executing->compound-learn` — zero backward edges, no `decompose->clarify` edge exists). Correct mechanism: `fgos-coding-planning` invokes `fgos-coding-exploring`'s flow directly in the same session (Socratic lock, 3-test material/grounded/answerable filter, append a new D-ID decision to `CONTEXT.md`) while `item.stage` stays `decompose` the whole time — the same no-stage-move shape `fgos-coding-validating` already uses when it hands an item back to `fgos-coding-planning` directly (both stay in `decompose`, per `fgos-coding-planning/SKILL.md`'s own framing that shaping and proving are a judgment split inside one stage, never two stage values). This corrects the original bug description's claim that the fix "mirrors fgos-coding-validating's own existing hand back" one-for-one — that hand-back works only because validating and planning share the *same* stage (`decompose`) by design; `fgos-coding-exploring` (`clarify`) and `fgos-coding-planning` (`decompose`) are *different* stages under the default `coding` domain mapping (`workflow-stage-graphs.mjs` skillMap), so the real fix is a direct same-session skill invocation with no stage transition at all, not literal reuse of validating/planning's shared-stage mechanism. |
| D2 | The fix touches two files, not one: `fgos-coding-planning/SKILL.md` (add the hand-back route for a material gap) and `fgos-coding-exploring/SKILL.md` (correct its opening line — "This skill runs while a claimed item's `stage` is `clarify`" — which becomes inaccurate once `fgos-coding-planning` invokes it directly while `item.stage` stays `decompose`). Grepped `fgos-coding-exploring/SKILL.md` and `src/intake/*.mjs` for a mechanical `stage === 'clarify'` check: none exists — the opening line is descriptive framing only, not an enforced invariant, so `fgos-coding-exploring`'s actual flow (Socratic lock steps, gate check) already works unchanged when invoked mid-`decompose`; only its own doc's opening description needs a one-line correction so it doesn't contradict this new usage. |
| D3 | Loop-guard behavior (what stops a material-gap hand-back from ping-ponging between planning and exploring indefinitely) is out of scope for this item — deferred. Verified `src/runner/anti-loop.mjs`'s own header comment: it is explicitly "EXECUTING-PHASE ONLY," keyed on `work.move` events with `payload.to === 'doing'`; a same-session direct invocation with no stage move and no re-claim never touches that counter. No existing guard covers this path, and adding one is a new behavior beyond what the bug asks for (a documentation gap, not a runtime safety feature) — noted here as scope creep, not pursued. |

## Non-material path (already-existing container, no new decision needed)

Per the bug's own fix direction: a gap that is NOT material (an
implementation-only detail `CONTEXT.md` correctly left unaddressed) gets
pinned as a labeled assumption in `plan.md`'s own Assumptions, not handed
back. Verified this container already exists and is already checked:
`fgos-coding-validating/SKILL.md:75` lists **Assumptions** — "is every assumption
the plan depends on either proven or flagged as unproven" — as one of its
feasibility-matrix dimensions. `docs/history/gate-bypass/CONTEXT.md`
separately documents "Pinned assumptions (implementer-level, deferred to
`fgos-coding-planning`)" as an existing pattern. No new decision required here;
`fgos-coding-planning/SKILL.md` only needs to name this path explicitly for the
material-gap case.

## Scout evidence

- `fgos-coding-planning/SKILL.md:176-177` — confirmed by direct read: the only
  documented Handoff exit is `fgos-coding-validating`, no return edge to
  `fgos-coding-exploring`.
- `fgos-coding-planning/SKILL.md:62-66` (Bootstrap) — confirmed: "the locked
  decisions are the only source of truth for what this plan can assume,"
  with no fallback stated for when that source is silent.
- `fgos-coding-exploring/SKILL.md` header — confirmed by direct read: "This skill
  runs while a claimed item's `stage` is `clarify`."
- `src/state/fsm.mjs:77` `TRANSITIONS` — read directly, no backward edges.
- `src/state/workflow-stage-graphs.mjs:64-69` `DOMAINS.coding.transitions`
  — read directly, four forward-only edges, confirmed no `decompose ->
  clarify` edge.
- `fgos-coding-validating/SKILL.md:75,94-100` — Assumptions/feasibility-matrix
  dimension confirmed present.
- `src/runner/anti-loop.mjs:11-21` header comment — confirmed
  executing-phase-only scope, doesn't cover this hand-back path.
- `fgos tool query --capability impact-analysis --status present --dir
  <root>` — one provider registered, `gitnexus`, `status: "present"` →
  posture is **full** (CLAUDE.md's impact-analysis gate). Informational
  only per this skill's own rules; does not gate or reshape any decision
  above.

## Pinned terms

- **Material gap** — per `fgos-coding-exploring/SKILL.md`'s own three-test filter
  (material/grounded/answerable), reused unchanged for this fix: a
  `CONTEXT.md` silence whose answer would change scope, behavior, data
  shape, or acceptance criteria.
- **Non-material gap** — a `CONTEXT.md` silence that is genuinely an
  implementation-only detail; the plan can proceed on a stated,
  labeled assumption instead of a hand-back.

## Outstanding questions deferred to planning

- Exact wording/placement of the new hand-back rule within
  `fgos-coding-planning/SKILL.md`'s existing step numbering (e.g., as a new
  numbered flow step vs. a Hard Rules addition) is an editorial/
  implementation choice, not a product decision — left to `fgos-coding-planning`.
- Whether the hand-back should also append anything to
  `fgos-coding-planning/SKILL.md`'s own Red Flags list (mirroring
  `fgos-coding-validating`'s red flags) is likewise an editorial call for
  planning, not locked here.
