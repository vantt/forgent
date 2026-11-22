# Phase 2: Copy the manifest into the model and move its readers

The manifest stays in place in this phase. `docs/architecture-manifest.json` and
`docs/platform/packaging-distribution/contracts/setup-doctor-registry.md` are also owned by the running plan
`261122-0118-heads-stable-and-able`. The owner order of 2026-11-22 23:19 (option c) moves the deletion and both
file edits to phase 7. From this phase on, the model is the authority and the manifest is a stale copy that
nothing reads.

## Inputs
- `docs/architecture-manifest.json` (whole). Read it only; do not change it.
- `test/architecture.test.mjs`: reads the manifest at :31 and :1590; `checkDoors` is at :1768-1828.
- `src/setup/instruction-registry.mjs:445-480` (`discoverKnownOwners`) and its fixtures in `test/setup/instruction-registry.test.mjs` (:116, 501, 574, 605, 636, 665, 780).
- `packages/component-authority/contracts/model.v1.json` and `model/components.json` (phase 1).
- To list the live mentions, run `rg -l 'architecture-manifest' --glob '!archive/**' --glob '!docs/history/**' --glob '!plans/**' --glob '!**/verification/**'`.

## Files it may write
packages/component-authority/model/layers.json, packages/component-authority/model/tiers.json, packages/component-authority/model/files.json, packages/component-authority/model/doors/ (new files), packages/component-authority/model/components.json, test/architecture.test.mjs, src/setup/instruction-registry.mjs, test/setup/instruction-registry.test.mjs, src/verbs/merge/iron-law-level.mjs, src/runner/dispatch/execution-contract.mjs, scripts/install-git-hooks.mjs, core/instructions/design-principles.md, AGENTS.md, docs/reading-map.md, the docs files named in the plan's phase table row 2, and `plans/261121-2109-component-authority/reports/`.
It must not write `docs/architecture-manifest.json` or `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md`.

## Steps
1. Record the baseline: `node --test test/architecture.test.mjs 2>&1 | grep -E '^# (tests|pass|fail)'`, and save the
   list of passing test names under `plans/261121-2109-component-authority/reports/`.
2. Split the manifest into the model, copying data unchanged:
   - `layers.json`: `layers`, `rules`, `domains`, `tierNames`.
   - `tiers.json`: `tiers`, `tierExceptions`.
   - `files.json`: `files`.
   - `doors/<slug>.json`: one door row per file. Use these exact slugs for the 22 rows that carry debt, because
     the sibling plan's footprints name them: `agent-hook-table`, `delete-guard-keyword-list`,
     `person-agent-config-writes`, `kernel-lock-primitive`, `footprint-write-scope-overlap-rule`,
     `list-run-directories`, `process-control-signal`, `run-bounded-child`, `shell-rc-fgos-lines`,
     `process-facts-proc`, `resolve-invocation-root`, `join-fgos-onto-project-root`, `global-fgos-directory`,
     `parse-cli-arguments`, `installation-shim-location`, `tool-lookup-by-capability`, `derive-executor-facts`,
     `decide-a-dispatch`, `execution-doctor-judgments`, `doctor-readiness-registry`,
     `no-node-from-native-packaging`, `checkout-make-provision-remove`. For every other row, the slug is the
     kebab-case of the job up to its first `:` or `(`, and must be unique.
   - Add the manifest's one `components` entry as a minimal `packaging-distribution` row in `components.json`,
     after the self row.
   Keep `contract`/`map` as a `model` stamp in `layers.json`.
3. Write `plans/261121-2109-component-authority/reports/manifest-model-compare.mjs`. It rebuilds the manifest's
   shape from the model files, deep-compares it with `docs/architecture-manifest.json`, prints each difference by
   key path (a door by its `job`), and exits non-zero on any difference. Run it, and save its passing output
   under `reports/`. Phase 7 runs the same script again before it deletes the manifest. It lives in the plan
   directory, never in `src/`, `scripts/` or `test/`, and phase 7 deletes it.
4. Add one small loader at the top of `test/architecture.test.mjs` that reads the model files and builds the same
   in-memory shape the tests used (`layers`, `rules`, `tiers`, `tierExceptions`, `doors` sorted by slug, `files`).
   Point :31 and :1590 at it. Change no assertion. Update the header comment so it names the model.
5. In `src/setup/instruction-registry.mjs`, `discoverKnownOwners` reads component ids from `components.json` (each
   row's `id`) and domains from `layers.json`. Rename the `manifestPath` option to `modelDir`, move every caller and
   fixture, and keep the behaviour the same.
6. Replace every live mention of the manifest with `packages/component-authority/model/`, in code comments,
   AGENTS.md (if that text is generated, regenerate it from `core/instructions/design-principles.md` instead of
   editing it), and the docs in the footprint, so a new door or file row is written to the model, not the
   manifest. Leave history files alone. Leave these for later: `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md`
   and the manifest itself go to phase 7; `docs/platform/packaging-distribution/spec.md`,
   `src/cli/command-registry.mjs:7` and the convention rule `doc-architecture-manifest-1` go to the sibling plan's
   sweep phase, because running plans own those files.
7. Record this phase's commit sha in `reports/` as the copy point that phase 7 reconciles from.
8. Add the move to the component-authority spec's settled facts only if phase 1 left a placeholder; otherwise leave the spec alone.

## Verify
- `node --test test/architecture.test.mjs`: the same test names pass as in the baseline, with none skipped.
- `node --test test/setup/instruction-registry.test.mjs` is green.
- `node plans/261121-2109-component-authority/reports/manifest-model-compare.mjs` exits 0.
- `git diff --quiet <phase base> -- docs/architecture-manifest.json docs/platform/packaging-distribution/contracts/setup-doctor-registry.md`:
  this phase left both files unchanged.
- `rg -l 'architecture-manifest' src bin scripts test` lists nothing beyond `src/cli/command-registry.mjs`. The
  wider search in Inputs lists only the manifest, `setup-doctor-registry.md`, the three sibling-sweep files and
  decision narratives.

## Rollback
Revert the phase commit. The manifest was never touched, so the old readers work again as soon as they are restored.
