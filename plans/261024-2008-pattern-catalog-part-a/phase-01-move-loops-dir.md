# Phase 01: move the four loop engines to `src/runner/execution/loops/`

Depends on: nothing. Blocks: 03, 04. Effort: 2h. Risk: Low (pure move, no behavior change).

Run as (fgos-cook): activity `implement-item`, capability `code:implement`, pattern `reviewed` (pass `--pattern reviewed` by hand: the installed release does not inherit it yet), rigor `standard`, one slice. `--verify "node scripts/run-tests.mjs test/runner/execution/loops/index.test.mjs test/runner/execution/loops/architecture-guard.test.mjs test/runner/execution/patterns/presets.test.mjs test/architecture.test.mjs test/githooks/census-drift.test.mjs"`.

## Context links

- Spec: `plans/261023-1619-collaboration-degree-spec/spec-draft.md` section 13.1 (what moves), section 2 (glossary: loop vs pattern), S19.
- Scout facts 4 (loops may not import `runner/dispatch/`) and 3 (census hook): `reports/scout-facts.md`.
- Design principles 1 and 2 (`core/instructions/design-principles.md`): one door, strict layering; the architecture guard test is the mechanical check.

## Requirements

1. The seven engine modules `solo, reviewed, panel, debate, index, role-tasks, history-outcome` live in `src/runner/execution/loops/`. `patterns/` keeps only `presets.mjs` until phase 06 deletes it.
2. No behavior change. No identifier rename in this phase (the `patternName` to `loop` rename happens in each phase that rewrites the function; phase 10 sweeps the rest).
3. Test directory follows: engine tests move to `test/runner/execution/loops/`; `presets.test.mjs` stays.
4. Manifest and census list the new paths; the architecture guard test points at `loops/`.

## Files (writes)

Move (git mv, content unchanged except import paths):
- `src/runner/execution/patterns/{solo,reviewed,panel,debate,index,role-tasks,history-outcome}.mjs` to `src/runner/execution/loops/`
- `test/runner/execution/patterns/{architecture-guard,debate,index,panel,reviewed,role-tasks,solo}.test.mjs` to `test/runner/execution/loops/`

Edit (import paths only):
- `src/runner/execution/run.mjs` (lines 25, 27: `./patterns/index.mjs`, `./patterns/reviewed.mjs`), `src/runner/execution/dry-bind.mjs` (:7), `src/runner/execution/unit-summary.mjs` (:8, :9)
- `src/runner/execution/loops/index.mjs` (its `./presets.mjs` import becomes `../patterns/presets.mjs`; deleted in phase 06)
- `test/runner/execution/loops/architecture-guard.test.mjs` (`PATTERNS_DIR` at :7 becomes `src/runner/execution/loops`; rename the constant `LOOPS_DIR`)
- `docs/architecture-manifest.json` (lines 295-311: seven paths)
- `packages/git/contracts/mutation-census.v1.json` (regenerate)
- Re-grep before slicing: `git grep -n "execution/patterns" -- src test scripts docs/architecture-manifest.json` must list nothing but `presets.mjs` afterwards. Total callers found at HEAD: run.mjs 2, dry-bind.mjs 1, unit-summary.mjs 2, loops tests 7.

## Steps

1. `git mv` the 7 + 7 files. Fix every relative import (`../seat-resolver.mjs` still resolves: same depth). Fix `panel.test.mjs:180` which reads the module source by path.
2. Update the manifest entries (layer stays `domain`) and the guard test constant.
3. Run the narrow verify; then `node scripts/git-one-door-scan.mjs --write-census` and stage the census with the move (the pre-commit hook refuses a product-file commit with a stale census: `test/githooks/census-drift.test.mjs`).
4. `git grep -n "patterns/" -- src test | grep -v presets` is empty.

## Verify

Narrow command above. Not needed here: `npm test`, `cargo test` (no Rust, no behavior change); the full gate runs at phases 03, 06 and 12.

## Risks and mitigations

- A missed importer breaks at import time: caught immediately by the narrow verify plus `test/architecture.test.mjs` (manifest completeness). Likelihood Low, impact Low.
- Census drift refuses the commit: step 3.

## Rollback

`git revert` the one commit; nothing else depends on it yet.

## Acceptance

Scenario S19 (partial): architecture guards green on the new directory. Full S19 proof lands in phase 10.
