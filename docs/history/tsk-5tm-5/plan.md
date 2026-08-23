# plan.md — tsk-5tm-5 (D9: provider-keyed modelPolicies, heavy risk)

Per-item risk map for this `risk: heavy` child of `tsk-5tm`. The full
6-child split, ordering, and cross-child footprint/deps rationale live at
`docs/history/task-dispatch-unification/plan.md` (the parent item's shared
plan) — this file is the item-specific record `assertPlanEvidence` requires
on `fgw/tsk-5tm-5` before `delivered`, distilling the D9-specific rows
already written there plus what was actually verified during
implementation.

## Scope

`D9`: model/tier resolution moves from one flat `cfg.models` map to
`cfg.modelPolicies`, provider-keyed, each with its own 5-tier vocab
(`lightweight/standard/creative/analytical/critical`) plus a per-capacity
`rigorOverrides` escape hatch. Fixes the reported bug: `modelForTier` only
ever read Claude's model names, so a non-Claude executor (the `agy`/Gemini
capacity) silently received the wrong model name instead of throwing.

Constraint (from DISCUSSION.md's D9 entry, carried into the parent
plan.md's action text verbatim): `modelForTier(cfg, tier)`'s existing
2-positional-arg signature and its 3-value `tier` input
(`light/standard/heavy`) stay unchanged — `loop.mjs:1324` is the one real
external call site and was not touched.

## Risk map (from parent plan.md's own table)

| Component | Risk | Why heavy |
|---|---|---|
| Model/tier N-map theo provider, vocab 3→5 (D9) | **heavy** | `work.tier` is read in multiple places outside `modelForTier` — the blast radius needed a real grep pass before this was safe to call contained, not assumed |

## Feasibility check (re-run live at implementation time, tsk-5tm-5)

Required proof: full blast-radius grep of `modelForTier`/`cfg.models`/
`work.tier` outside `dispatch.mjs`, confirming the 5-tier `modelPolicies`
vocab stays internal to `dispatch.mjs` and never forces `work.mjs`'s own
`TIERS` (`light/standard/heavy`, shared with `work.risk`) to grow.

```
grep -rn "modelForTier\|cfg\.models\b\|work\.tier\b" src bin --include="*.mjs" | grep -v dispatch.mjs
```

Result (matches the parent plan.md's earlier planning-time finding, no
drift):

- `loop.mjs:1324` — the one real `modelForTier(config, tier)` call site,
  signature unchanged.
- `plan.mjs:974` — carries `work.tier` through to a child spec verbatim, no
  lookup into `modelForTier`/`cfg.models`.
- `work.mjs:381-383` — validates `work.tier` against `TIERS`
  (`work.mjs:156`, still `['light','standard','heavy']`), untouched.
- `graph-harness.mjs:95` — a doc-comment reference only, not a code read.

**Verdict: contained.** The 5-tier `modelPolicies` vocab lives entirely
inside `cfg.modelPolicies`/`DEFAULT_TIER_TO_POLICY`
(`src/runner/dispatch.mjs`) as an internal mapping target — `work.tier`'s
own 3-value classification was never touched.

## The 3→5 mapping choice (the one real semantic judgment call)

`DEFAULT_TIER_TO_POLICY = { light: 'lightweight', standard: 'standard',
heavy: 'critical' }` — `heavy` maps to `critical` (not `analytical`),
matching `heavy`'s pre-D9 model (`opus`) staying the default for that work
tier. A capacity can override this per-tier via its own `rigorOverrides`
when a specific work tier should route to a different policy tier than the
default (verified by test: `modelForTier honors rigorOverrides...`).

## Verification actually done (beyond the base `verify` command)

- `node --test test/runner/dispatch.test.mjs` — 210/210 pass (14 new tests
  added for this item: `modelForTier` provider/rigorOverrides resolution,
  `validateModelPoliciesShape` rejection cases, capacity
  `providerModel`/`rigorOverrides` shape validation, and a concrete
  non-Claude-resolves-correctly test against the `agy`/gemini capacity).
- `npm test` — 3276/3281 pass, 5 pre-existing unrelated skips.
- Iron Law evidence (`docs/history/tsk-5tm-5/iron-law-evidence.md`): real
  failing-before (8 fail)/passing-after (210 pass) transcript, swapping
  `src/runner/dispatch.mjs` between the `fgw/tsk-5tm-4` merge commit and
  this item's own commit.
- `.fgos/config.json` (main checkout, hand-committed per ADR0020's
  worktree/`.fgos/` split): `capacities.agy.providerModel: "gemini"` +
  `modelPolicies.gemini: {lightweight: "Gemini 3.5 Flash (Medium)"}` added
  (the one real Gemini model name with historical precedent in this repo —
  the deleted `gather` capacity's own hardcoded `model` field, tsk-5tm-2);
  legacy flat `models` block removed (confirmed via the same grep above
  that nothing outside `dispatch.mjs` reads `runner.models` directly).
- A second, unplanned fix surfaced during implementation: `models`/
  `modelPolicies` are mutually-substitutable in `validateRunnerConfigShape`
  (either alone satisfies it), but `ensureRunnerConfigForDir`'s
  missing-key-fill merges (both the in-code `DEFAULT_RUNNER_CONFIG` merge
  and the separate `~/.fgos/config.json` global-config merge) could
  silently attach a `modelPolicies` key onto a project/test fixture that
  only declares its own `models` map, flipping which one `modelForTier`
  resolves through even though nothing was actually missing. Fixed at both
  merge sites in `src/runner/dispatch.mjs`
  (`dropModelPoliciesInjectedOverModels`), verified by the two pre-existing
  tests that exposed it (`resolveCapacityCli resolves a kind:"cli"
  capacity...`, `...honors a caller-supplied tier override...`) going back
  to green.

## Outcome

Delivered as-is — no scope cut, no deferred follow-up beyond what the
parent `docs/history/task-dispatch-unification/plan.md` already scopes to
future children (`#task-fanout-consult-dispatch`, D4, the last remaining
piece).
