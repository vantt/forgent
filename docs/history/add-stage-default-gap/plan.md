# add-stage-default-gap — plan.md

tsk-621. Mode: standard

Flags counted (per `fgos-routing`'s Mode gate, applied directly — no
lane was handed off before this skill loaded): **public contracts**
(`add`'s CLI surface, and the lazy-default behavior every caller of
`add` already relies on), **data model** (the item schema's `stage`
default), **existing covered behavior** (`test/cli/fgos.test.mjs`'s
"add never gained a --stage flag" test and `test/state/stage.test.mjs`
directly pin today's behavior as spec). 3 flags, no hard-gate flag
(not auth/data-loss/audit/external-provider/validation-removal) →
**standard**.

## Approach

Two sequential phases, one item, no split — the phases are strictly
sequential (Phase 2 needs Phase 1's new flag to exist), which is exactly
the case where a split would add coordination overhead without buying
real parallel workability (per fgos-coding-planning's own "smallest honest
plan" framing).

**Phase 1 — code fix (D1/D2, CONTEXT.md).**

- `bin/fgos.mjs`, `add` case (~line 890-950): add an explicit `--stage`
  flag (`optionalField(flags.stage, ...)`, validated against
  `getDomain(...).stages` the same way `--domain` is already validated
  downstream by `validateWorkShape` — no new validation source). When
  `--stage` is omitted, default to `stageForStep(getDomain(opts.domain),
  'Clarify')` — the exact same call `submitWork` already makes at line
  822 — instead of leaving `stage` undefined.
- `test/cli/fgos.test.mjs`: rewrite `'add never gained a --stage flag:
  passing --stage is simply ignored'` (the test that pins today's gap)
  to instead assert `--stage` is honored, and add a case asserting a
  bare `add` with no `--stage` now resolves to `clarify` (today's
  `'add --domain synthetic ... default stage resolves to assembling (no
  --stage flag needed)'` case needs the same default-is-Clarify-mapped
  update for the synthetic domain).
- `test/state/stage.test.mjs`: no change needed — `transitionStage`'s
  own "reads a missing stage as executing" fallback and its "rejects
  edges outside the three legal ones" test (including `decompose→clarify`,
  `executing→clarify`, `executing→decompose` as illegal) both stay
  correct after this fix; D3 never adds a back-edge, so nothing here
  moves.
- `test/state/work.test.mjs`, `test/state/workflow-stage-graphs.test.mjs`:
  no change — both test the domain registry / `validateWork`'s stage-enum
  check, neither of which changes shape.
- `src/state/store.mjs` (`EDITABLE_FIELDS`): no change — D2 is a
  creation-time (`add`) flag only, not an edit-time one; `stage` stays
  excluded from `fgos edit`, same as today.
- `.claude/skills/fgos-coding-planning/SKILL.md` step 4 and its mirrored
  `.agents/skills/fgos-coding-planning/SKILL.md` copy: update the split-child
  example to pass `--stage decompose` explicitly (a split child already
  inherits its parent's locked `CONTEXT.md`, so it should skip straight
  to `decompose` for `fgos-coding-validating`'s reality check, not repeat a full
  `clarify` Socratic pass against context it already has).
- `test/skills/fgos-mirror.test.mjs`: no code change — exists to assert
  the two SKILL.md copies stay byte-identical; both must be edited in
  lockstep for this test to stay green.

Proof point (medium risk — public CLI contract + a default every
existing `add` caller relies on): the rewritten
`test/cli/fgos.test.mjs`/`test/state/stage.test.mjs` cases above, plus a
full `npm test` run. impact-analysis: full (gitnexus present, freshly
checked 2026-08-06T08:27Z) — worth a `fgos-coding-validating` blast-radius read
on `bin/fgos.mjs`'s `add` case specifically, since it is called by every
`fgos-coding-planning` split today (D1's own stated scope).

**Phase 2 — one-time data fix (D3/D4/D5, CONTEXT.md).**

Scope narrowed to exactly one item: `tsk-503`. Of the 26 items counted
with a missing `stage` field, 23 are `delivered`/`cleanup`/`retrospective`
(already built and approved, correcting history has no effect) and 2
(`tsk-2k1` doing, `tsk-2sl` awaiting-approval) are deliberately left
alone (D5 — mid-build/already-past-executing, same risk this item's own
D3 already rejected a back-edge over). Only `tsk-503` is both live
(`todo`, unclaimed) and safe to touch.

`tsk-503`'s own description already carries a self-authored reality-check
(dated 2026-08-06, explicitly citing this item as the reason it had to
run informally) with a real, already-baselined verify:
`node --test test/runner/dispatch.test.mjs test/state/gate-bypass.test.mjs`
(133/133 + 25/25 green). No new decisions to make for it — just
formalize what it already carries under the corrected stage:

```bash
root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
fgos add --title "Phán model tier tại lúc dispatch, tách khỏi tier ceremony của work.tier" \
  --kind feature --risk standard --tier standard \
  --verify "node --test test/runner/dispatch.test.mjs test/state/gate-bypass.test.mjs" \
  --parent tsk-2t6 \
  --footprint "src/runner/dispatch.mjs,test/runner/dispatch.test.mjs,src/state/gate-bypass.mjs,test/state/gate-bypass.test.mjs,.claude/skills/_shared/capacity-dispatch-fallback.md,.agents/skills/_shared/capacity-dispatch-fallback.md" \
  --stage decompose \
  --dir "$root"
fgos edit tsk-503 --supersededBy <new-id-from-above> --dir "$root"
fgos move tsk-503 --to wontfix --dir "$root"
```

`--stage decompose` (not `clarify`): `tsk-503`'s description already
records its own locked reasoning (mode fit, repo fit, assumptions,
smaller-path tradeoff) — re-running a full Socratic `clarify` pass
against decisions it already made informally would be redundant; landing
it at `decompose` lets `fgos-coding-planning`/`fgos-coding-validating` review that
existing reasoning properly instead of re-deriving it.

Proof point (low risk — reuses only existing, already-tested `add`/
`edit`/`move` verbs, no new code path): `fgos list --all --json` shows
`tsk-503` at `wontfix` with `supersededBy` set, and the new replacement
item exists at `stage: decompose` with the same verify. impact-analysis
not applicable (no source-file change in this phase).

## Assumptions

- The replacement item's own execution (once it reaches `executing`)
  still needs `fgos-coding-validating`'s real reality check — this plan only
  formalizes `tsk-503`'s already-embedded reasoning into the normal
  `decompose`-stage flow, it does not re-litigate whether that reasoning
  is correct.
- `tsk-2k1`/`tsk-2sl` are accepted as permanently uncorrected metadata
  (D5) — not deferred to a future item, since there is no forward action
  left for either (one is mid-build, the other already finished
  building).

## Split

None. One item, two sequential phases, executed together.
