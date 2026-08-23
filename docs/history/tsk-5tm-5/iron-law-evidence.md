# Iron Law evidence — tsk-5tm-5

`classifyIronLaw` result against the real committed diff (`383b13ba...bb03841e`):

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/runner/dispatch.mjs"]}
```

## Test command

```bash
node --test test/runner/dispatch.test.mjs
```

(Full suite: `npm test` — 3276/3281 pass, 5 pre-existing unrelated skips.)

## Shape of this change

A real addition, same shape as `tsk-5tm-3`/`tsk-5tm-4`: before, `cfg.modelPolicies`
did not exist as a recognized shape — `modelForTier` only read the flat
`cfg.models` map, `MODEL_POLICY_TIERS` was not exported, and neither
`providerModel` nor `rigorOverrides` were recognized capacity fields. The
before/after contrast swaps `src/runner/dispatch.mjs` back to its
pre-tsk-5tm-5 committed content (the `fgw/tsk-5tm-4` merge commit,
`383b13ba`) and runs the real, already-committed test file against it.

## Failing-before transcript

`src/runner/dispatch.mjs` swapped to its pre-tsk-5tm-5 committed content
(`git checkout 383b13ba -- src/runner/dispatch.mjs`), the real
(already-committed) test file run as-is:

```
ℹ tests 210
ℹ suites 0
ℹ pass 202
ℹ fail 8
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

The 8 failures are exactly the new D9 tests this item adds — every one of
them exercises `modelPolicies`/`providerModel`/`rigorOverrides`, none of
which existed on the pre-fix tree:

```
✖ modelForTier resolves the default provider (claude) when no providerModel is given, same tier->model mapping as before
✖ modelForTier resolves a non-Claude provider (e.g. agy/gemini) to that provider's own model name, not Claude's (D9's reported bug: executor non-Claude nhan sai ten)
✖ modelForTier throws when providerModel names a provider with no modelPolicies entry
✖ modelForTier honors rigorOverrides, routing a work tier to a different model-policy tier than DEFAULT_TIER_TO_POLICY
✖ modelForTier prefers modelPolicies over a legacy flat models map when both are present
✖ loadRunnerConfig accepts a runner config declaring modelPolicies instead of models
✖ loadRunnerConfig rejects a modelPolicies entry with an unknown policy tier key
✖ resolveCapacityCli resolves a cross-provider capacity's own providerModel through modelForTier, picking that provider's model over the default (claude) policy (D9's reported agy/Gemini bug)
```

The last one is the concrete regression D9 set out to fix: against the
pre-fix tree, `resolveCapacityCli` resolves the `agy` capacity's model as
`sonnet` (Claude's `standard` model) instead of `gemini-pro` — the exact
"executor non-Claude nhận sai tên" bug DISCUSSION.md's D9 entry names.

## Passing-after transcript

`src/runner/dispatch.mjs` restored to its committed (post-fix) content
(`git checkout HEAD -- src/runner/dispatch.mjs`), same test file:

```
ℹ tests 210
ℹ suites 0
ℹ pass 210
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

`git status --short` showed only the expected `.fgos/*` deletions (ADR0020
worktree artifact, never real) before this passing run — confirming it ran
against the real committed tree. Full `npm test` (3276/3281, 5
pre-existing unrelated skips) also green on the same committed tree.

## D9-specific verification beyond the base verify command

Per `plan.md`'s own note on this piece ("verify nháp: chưa xác định — phụ
thuộc kết quả rà blast radius"), two extra checks this item owed before
being considered proven, both done live against the real repo (not
recalled from `plan.md`'s earlier feasibility-matrix pass):

- **Blast-radius grep**, re-run fresh at implementation time:
  `grep -rn "modelForTier\|cfg\.models\b\|work\.tier\b" src bin --include="*.mjs" | grep -v dispatch.mjs`
  — same 4-file result the planning pass found (`loop.mjs`'s one real
  `modelForTier(config, tier)` call site unchanged, `plan.mjs`/`work.mjs`/
  `graph-harness.mjs` all reference `work.tier`'s own unrelated 3-value
  vocab, untouched by this piece).
- **A concrete non-Claude-resolves-correctly test** — the 8th failing test
  above (`resolveCapacityCli resolves a cross-provider capacity's own
  providerModel...`) is exactly this required proof.

## Config change (committed separately to the main checkout)

`.fgos/config.json`'s `runner` section (main-checkout-only, worktrees never
carry `.fgos/` per ADR0020) was hand-edited by the user per this item's own
sequencing note in `plan.md`: `capacities.agy.providerModel: "gemini"` added,
`modelPolicies.gemini: {lightweight: "Gemini 3.5 Flash (Medium)"}` added
(the one real Gemini model name with historical precedent in this repo — the
deleted `gather` capacity's own hardcoded `model` field, tsk-5tm-2), and the
legacy flat `models` block removed (superseded, and confirmed via the same
grep above that nothing outside `dispatch.mjs` reads `runner.models`
directly).
