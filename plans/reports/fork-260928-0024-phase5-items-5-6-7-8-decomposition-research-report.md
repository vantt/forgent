# Phase 5 items 5/6/7/8 decomposition research

Read-only research, no files written by the fork. Produced to draft Units
I25/I26 for `plans/260919-coordination-skill-harness-simplification/plan.md`.

## Item 5 — human-turn / bounded-reopen in typed action view

Mostly already satisfied, not new work.
- `record-human-turn` is already an unconditional action-view case:
  `src/runner/coordination/actions-projector.mjs:441-448` ("Available for
  any active session"). Tested across 5 existing test files.
- "Bounded reopen" isn't a distinct kernel mechanism — it's
  `revise-synthesis`/`revise-explanation` (each `maxInvocations:2`) +
  `close-dialogue`, ordinary declared operations in the
  `phase-dialogue-reopen` graph node (`fgos-architecture-panel/SKILL.md:152,
  160-166,452-525` — "a real, deliberate narrowing... no backward edge").
  These already surface through the existing generic
  `dispatch-operation`/`operation`-kind action-view case. I24b's own M1 fix
  (`evaluateDriverAuthorizedBindings`) directly fixed the bug that would
  have hidden `revise-synthesis` from `pending` after its first invocation
  — already confirmed by
  `test/verbs/coordination-architecture-advisory-panel-conformance.test.mjs`
  probing invocation #1/#2.
- Remaining work: an explicit end-to-end conformance assertion that both
  appear correctly in the REAL `architecture-advisory-panel-v1` typed
  action view specifically (not just generic unit coverage), plus a doc
  sweep for any stale "not yet in the typed view" claims.

## Item 6 — judgment stays in Lead/role packets, not the projector

Already has an explicit invariant test, known-weak.
`test/runner/coordination-actions-v1.test.mjs:119` (added by I24b) checks
every OTHER kind against only an 8-name denylist, while `specialist` alone
gets a strict allowlist (review-i24b's own LOW finding, correctly deferred
at the time). A judgment field with an unlisted name (e.g. `rationale`,
`rank`) would pass for non-specialist kinds. Remaining work: harden to an
allowlist for every kind.

## Item 7 — fgos-panel / architecture-panel consume the driver-discipline fragment

Real, unstarted work — zero references exist anywhere. Grepped
`core/skills/fgos-panel/SKILL.md`, `core/skills/fgos-architecture-panel/
SKILL.md`, `core/skills/fgos-group-thinking/SKILL.md` for
"driver-discipline"/"driver_discipline": zero matches in ALL THREE. The
fragment itself: `core/skills/_shared/coordination-driver.md` (1,192
words, from Phase 4/I15, already consumed by `fgos-plan-loop`). `fgos-panel`
already exists (67 lines, pure NL-router that selects a preset and
delegates — never drives an iteration loop itself). `fgos-architecture-panel`
already exists (51.5K, its own large role-doctrine skill) but does not yet
load the fragment either.

**Lead's decision** (genuinely ambiguous, settled here rather than left
open): `fgos-panel` is the stable human-facing entry point for ANY preset
dialogue — even though it delegates preset SELECTION, a person's follow-up
turns re-enter through the same skill they started with, regardless of
which preset was chosen. Rather than inventing a new shared "generic
presets" consumer file that doesn't exist today, `fgos-panel` itself loads
the fragment and fills its hooks, matching the exact two-unlike-consumer
pattern (`fgos-plan-loop`, `architecture-panel`) Phase 5's own Exit
criterion already requires ("architecture-panel and `fgos-panel` consume
the driver-discipline fragment unchanged"). `architecture-panel` also loads
it directly (it's a role-doctrine skill in its own right, not routed
through `fgos-panel`'s delegation).

## Item 8 — fold fgos-group-thinking into fgos-panel

Largely satisfied already; real work is narrower than the wording implies.
- "Pack-membership gate stays in code behind the public CLI" — already
  true: I23 built `fgos coordination pack list/show-protocol/run`; the gate
  lives in `src/verbs/coordination/group-thinking-pack.mjs`.
- "Remove its stale 'always auto-closes / no close step' claim" — already
  done, as a side effect of I23's own fix round (zero matches for
  "auto-close"/"no close step"/"no separate close" in the current
  `fgos-group-thinking/SKILL.md`).
- Real remaining work: (a) `fgos-panel/SKILL.md`'s own step 5 currently
  routes through `fgos-group-thinking` as an intermediary rather than
  calling the CLI door directly — update it to call `fgos coordination
  pack run` directly. (b) `fgos-group-thinking/SKILL.md` (currently 225
  lines, full content) needs to become a genuine thin deprecated stub
  pointing at `fgos-panel`, kept loadable only for the Phase 7
  compatibility window.

## Dependency and combination assessment

- Items 5+6: same file (`actions-projector.mjs`), same theme (harden
  existing invariants). One small unit (I25).
- Items 7+8: both touch `fgos-panel/SKILL.md` and the group-thinking/
  architecture-panel skill boundary. One unit (I26), with item 8's
  stub-conversion landing AFTER item 7's driver-discipline wiring within
  the same unit (editing the same file twice across two separate units
  risks rework).
- I25 and I26 are independent of each other (disjoint files) and can run
  in parallel.
