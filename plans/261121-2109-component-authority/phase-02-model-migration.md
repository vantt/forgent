# Phase 2: Move the manifest into the model

## Inputs
- `docs/architecture-manifest.json` (whole).
- `test/architecture.test.mjs`: reads the manifest at :31 and :1610; `checkDoors` is at :1794-1853.
- `src/setup/instruction-registry.mjs:445-480` (`discoverKnownOwners`) and its fixtures in `test/setup/instruction-registry.test.mjs` (:116, 501, 574, 605, 636, 665, 780).
- `packages/component-authority/contracts/model.v1.json` and `model/components.json` (phase 1).
- To list the live mentions, run `rg -l 'architecture-manifest' --glob '!archive/**' --glob '!docs/history/**' --glob '!plans/**' --glob '!**/verification/**'`.

## Files it may write
packages/component-authority/model/layers.json, packages/component-authority/model/tiers.json, packages/component-authority/model/files.json, packages/component-authority/model/doors/ (new files), packages/component-authority/model/components.json, docs/architecture-manifest.json (delete), test/architecture.test.mjs, src/setup/instruction-registry.mjs, test/setup/instruction-registry.test.mjs, src/verbs/merge/iron-law-level.mjs, src/runner/dispatch/execution-contract.mjs, scripts/install-git-hooks.mjs, core/instructions/design-principles.md, AGENTS.md, docs/reading-map.md, and the docs files named in the plan's phase table row 2

## Steps
1. Record the baseline: `node --test test/architecture.test.mjs 2>&1 | grep -E '^# (tests|pass|fail)'`, and save the
   list of passing test names under `plans/261121-2109-component-authority/reports/`.
2. Split the manifest, moving data unchanged:
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
3. Add one small loader at the top of `test/architecture.test.mjs` that reads the model files and builds the same
   in-memory shape the tests used (`layers`, `rules`, `tiers`, `tierExceptions`, `doors` sorted by slug, `files`).
   Point :31 and :1610 at it. Change no assertion. Update the header comment.
4. In `src/setup/instruction-registry.mjs`, `discoverKnownOwners` reads component ids from `components.json` (each
   row's `id`) and domains from `layers.json`. Rename the `manifestPath` option to `modelDir`, move every caller and
   fixture, and keep the behaviour the same.
5. Delete `docs/architecture-manifest.json` in the same commit. Replace every live mention with
   `packages/component-authority/model/`, in code comments, AGENTS.md (if that text is generated, regenerate it from
   `core/instructions/design-principles.md` instead of editing it), and the docs in the footprint. Leave history files
   alone. Leave `docs/platform/packaging-distribution/spec.md`, `src/cli/command-registry.mjs:7` and the convention
   rule `doc-architecture-manifest-1` for the sibling plan's sweep phase, because running plans own those files.
6. Add the move to the component-authority spec's settled facts only if phase 1 left a placeholder; otherwise leave the spec alone.

## Verify
- `node --test test/architecture.test.mjs`: the same test names pass as in the baseline, with none skipped.
- `node --test test/setup/instruction-registry.test.mjs` is green.
- `test ! -e docs/architecture-manifest.json`.
- `rg -l 'architecture-manifest' --glob '!archive/**' --glob '!docs/history/**' --glob '!plans/**' --glob '!**/verification/**' --glob '!docs/discussions/**'` lists only the three deferred files and decision narratives.

## Rollback
Revert the phase commit. That restores the manifest and the old readers together.
