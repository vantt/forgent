# Phase 1b: The structural model moves from JSON to YAML

Owner decision (2026-11-23 14:08, option a, relayed by lead:SUPERVISOR): people must be able to read and annotate
the model the way they read the config standard. The model therefore moves to YAML right after phase 1 and before
every phase that reads or writes it. The rows stay the same; only the file format and the readers change.

## Inputs
- `packages/component-authority/model/`: `layers.json`, `components.json`, `decision-kinds.json`, `contracts.json`
  and `doors/*.json` (about 168 KB in total; the largest, `contracts.json`, is 91 KB, under the `tool` profile's
  8 MiB `input_bytes` bound in `packages/yaml-doc/contracts/limits.v1.json`).
- The schema `packages/component-authority/contracts/model.v1.json`. It validates parsed values, so it stays valid
  for a YAML reader. Only its `description` text names `.json` files.
- The Rust YAML door is crate `fgos-yaml-doc` (`packages/yaml-doc/rust`): `document::parse(bytes, Profile::Tool,
  file)` then `Document::to_json()`, and `edit::emit` for writing. The model's tier is 1 (`component-authority`)
  and the door's tier is 0 (`yaml-document`), so the new crate edge points downward.
- The Node YAML door is `parseYaml` in `src/util/yaml.mjs`, which calls the addon's `yaml.parse` with the `tool`
  profile. The door row `doors/yaml-parser-loads` allows a parser only in `packages/yaml-doc/rust/src/backend.rs`;
  calling either door is not a match.
- Readers that open model files by name today:
  - `packages/component-authority/rust/src/model.rs` (`read()`, `load_dir()`, and its tests);
  - `scripts/component-authority-render.mjs:39-50`;
  - `test/architecture.test.mjs:68-73` (`loadModel`);
  - `test/component-authority/components.test.mjs`, `contracts.test.mjs` and `render.test.mjs`;
  - `src/report/decision-index.mjs:25` (`DECISION_KINDS_PATH`) and `test/report/decision-index.test.mjs:248`;
  - `src/setup/instruction-registry.mjs:458,478` and `test/setup/instruction-registry.test.mjs` (fixtures at
    lines 119-124, 503, 576, 607, 638, 782-787 and 1016-1026).
- Prose that names a model file with `.json`:
  - `docs/platform/component-authority/spec.md`;
  - `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md:164`;
  - the `description` of `model.v1.json`.
- The generated views (`scripts/component-authority-render.mjs:283-291`) print rows, not model file names, so
  regenerating them leaves no diff when the rows are unchanged.

## Prior art reused, and what was missing
Owner reminder (2026-11-23, relayed by lead:SUPERVISOR): reuse the shared YAML loader and write no parser.
- **Rust:** crate `fgos-yaml-doc` (`packages/yaml-doc/rust`). Its `document::parse` and `Document::to_json` read the
  model, and its `edit` writes it, the latter used in phase 5. The crate is already a dependency of `apps/fgos`,
  `packages/config/rust`, `packages/execution/rust`, `packages/host-runtime/rust` and the addon. Its authority is
  `docs/platform/yaml-document/spec.md`.
- **Node:** `parseYaml` in `src/util/yaml.mjs`, the native door through the addon (RUL108,
  `docs/platform/packaging-distribution/spec.md:258`). It parses with the `tool` profile and has no JavaScript
  fallback. `package.json#dependencies` stays empty, so there is no npm `yaml` dependency.
- **Scripts read from a checkout** the way `scripts/plan-contract-check.mjs` and `scripts/project-agents.mjs` do:
  they stage the addon first with `ensureAddonForScript` (`scripts/lib/git-addon-stage.mjs:187`).
- **Guard:** door row `doors/yaml-parser-loads` already makes `npm test` red on any YAML library import or pasted
  parser outside `packages/yaml-doc/rust/src/backend.rs`.
- **Missing:** nothing. This phase adds no loader, no helper and no parser option.

## Authority map
| New thing | Model row | Note |
|---|---|---|
| Rust model loader reads YAML | component `yaml-document` (door row `yaml-parser-loads`) | reuse `fgos-yaml-doc`; no parser |
| Node model readers read YAML | component `yaml-document` (door row `yaml-parser-loads`), Node door `parseYaml` | reuse; RUL108 |
| Model files become `.yaml` | component `component-authority` (its own model) | same rows; the JSON files are deleted in the same commit (CA-D2, L10) |

## Files it may write
packages/component-authority/model/, packages/component-authority/contracts/model.v1.json, packages/component-authority/rust/, Cargo.lock, scripts/component-authority-render.mjs, test/architecture.test.mjs, test/component-authority/, src/report/decision-index.mjs, test/report/decision-index.test.mjs, src/setup/instruction-registry.mjs, test/setup/instruction-registry.test.mjs, docs/platform/component-authority/spec.md, docs/platform/packaging-distribution/contracts/setup-doctor-registry.md

## Decisions taken here
- **One profile, `tool`, on both sides.** The Node door exposes only `tool`. If the Rust loader used
  `strict-config`, the two readers would accept different files, which would give the model two meanings. The
  alternative was to add a profile argument to the addon's parse. That would add a door option no one asked for
  (RUL104), so it was rejected.
- **Each file keeps its top-level shape.** `layers` stays a mapping, and `components`, `decision-kinds` and
  `contracts` stay sequences. Each door stays one mapping per file, with its slug from the file name minus
  `.yaml`. This keeps the schema `$defs` and every reader's shape unchanged.
- **No twin (CA-D2, L10).** Every `.json` model file is deleted in the same commit that adds its `.yaml` file. No
  reader keeps a JSON fallback. The commit message names the deleted paths and the last SHA that had them.
- **Comments are allowed, but the rows stay the same.** This phase adds no annotation. People annotate afterwards,
  and the loaders ignore comments.

## Steps
1. **Convert.** Write a throwaway script under `.fgos/runtime/tmp/` (never committed). For each model file, it
   emits the parsed JSON through the addon's `yaml.emit`, the same door `writeFrontmatter` uses, writes `<name>.yaml`,
   reads it back with `parseYaml`, and asserts deep equality with the JSON value. If the emitter refuses a top-level
   sequence, stop with `Status: BLOCKED` and name the refusal; do not hand-write YAML.
2. **Rust loader.** Add `fgos-yaml-doc` to `packages/component-authority/rust/Cargo.toml`. In `model.rs`, change
   `read()` to parse through `fgos_yaml_doc::document::parse(.., Profile::Tool, ..)`, then call `to_json()`, then
   use the existing typed `serde_json::from_value`. A refusal maps to `ModelError::Invalid` and keeps the file and
   rule. `load_dir` reads the `.yaml` file names, and its doc comment names them. The crate tests write YAML
   fixtures, and one test proves that a comment in a model file is ignored.
3. **Node readers.** Each reader below parses through `parseYaml` (no new helper, no `yaml` npm dependency) and
   reads `*.yaml`: the render script, `loadModel` in `test/architecture.test.mjs`, the three
   `test/component-authority/` tests, `decision-index.mjs`, and `instruction-registry.mjs`. The render script
   calls `ensureAddonForScript` before its first read, as `scripts/plan-contract-check.mjs` does. Their fixtures
   write YAML literal text. The door-file filters change from `.json` to `.yaml`.
4. **Schema and prose.** In `model.v1.json`, only the `description` changes to name the `.yaml` files. Update the
   `.json` model file names in `docs/platform/component-authority/spec.md` and in `setup-doctor-registry.md:164`.
5. **Delete** every `packages/component-authority/model/**/*.json` in the same commit.
6. **Regenerate and check.** Run `node scripts/component-authority-render.mjs`, which must produce no diff in any
   view, and then run `npm run build:skills`, which must produce no diff.

## Verify
- `find packages/component-authority/model -name '*.json'` prints nothing.
- Searching for each model file name ending in `.json` with `rg -n "(layers|components|decision-kinds|contracts)\.json|model/doors/[a-z0-9-]+\.json" --glob '!plans/**' --glob '!target/**'` finds nothing outside history and plans.
- `cargo test -p fgos-component-authority` and `cargo test -p fgos --test authority` are green. `locate "atomic file write"` still ranks `durable-file` first.
- `node --test test/architecture.test.mjs test/component-authority/ test/report/decision-index.test.mjs test/setup/instruction-registry.test.mjs` is green.
- `node scripts/component-authority-render.mjs` followed by `git diff --exit-code docs/` passes, and `npm run build:skills` followed by `git status --porcelain` shows no generated diff.

## Risks
- **Emitter quoting of regex patterns in `doors/*.yaml`.** Mitigation: step 1 asserts that every file round-trips
  to equal values before anything is deleted.
- **An exotic value under the `tool` profile.** A duplicate key or an unknown tag would be refused. The JSON
  sources have none, and the round-trip check catches one if it appears.

## Rollback
Revert the phase commit. The JSON files come back with it.
