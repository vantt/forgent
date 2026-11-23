# Phase 1b: The structural model moves to YAML and is read only by the Rust crate

Owner decision (2026-11-23 14:08, option a), relayed by lead:SUPERVISOR: people must be able to read and annotate
the model the way they read the config standard, so the model moves from JSON to YAML. Owner correction (14:15):
no JavaScript reads the model. The YAML model is read and written **only** by the Rust crate
`packages/component-authority/rust` through `fgos-yaml-doc`. `scripts/component-authority-render.mjs` is ported
into the crate as a verb and deleted in the same change (L10, no twin). Node code that needs model data gets it
from the Rust verb's `--json` output, never by parsing YAML. Cases whose behaviour the crate owns move to Rust tests
(design principle 8). This phase runs right after phase 1 and before every phase that reads or writes the model.

## Prior art reused, and what was missing
- **YAML (owner reminder: reuse the shared loader, write no parser).** The YAML door is crate `fgos-yaml-doc`
  (`packages/yaml-doc/rust`; authority `docs/platform/yaml-document/spec.md`). Its `document::parse` and
  `Document::to_json` read the model, and its `edit` writes it, the latter in phase 5. `apps/fgos`, `config`,
  `execution`, `host-runtime` and the addon already depend on it. The model's tier is 1 (`component-authority`) and
  the door's tier is 0 (`yaml-document`), so the new edge points downward. Door row `doors/yaml-parser-loads`
  already turns `npm test` red on any other parser. No npm `yaml` dependency is added, and no JavaScript reads the
  model. `parseYaml` (`src/util/yaml.mjs`, RUL108) stays the door for the YAML that Node code owns, but the model is
  not such YAML.
- **Node to Rust:** `invokeHost` in `src/util/host-bin.mjs`, the one Node door to a host verb, used the same way by
  `src/convention/convention-client.mjs`.
- **Verb wiring:** the `fgos authority locate` wiring of phase 1 (`apps/fgos/src/wiring/authority.rs` and the
  three host command contracts).
- **Render logic:** `scripts/component-authority-render.mjs` (527 lines) is the behaviour to port: nine view bodies,
  `renderBlock`, `computeViews`, `checkViews`, `writeViews` and `buildHolderViewPreview`. Its proof,
  `test/component-authority/render.test.mjs` (286 lines), moves to Rust case by case.
- **Missing:** a read verb for the model and a render verb, both in the crate.

## Authority map
| New thing | Model row | Note |
|---|---|---|
| Model files become `.yaml` | component `component-authority` (its own model) | same rows; the JSON files are deleted in the same commit (CA-D2, L10) |
| Crate reads and writes YAML | component `yaml-document`, door row `yaml-parser-loads` | reuse `fgos-yaml-doc`; no parser |
| `fgos authority render [--check] [--preview-holder <path>]` | component `component-authority`; survivor of `scripts/component-authority-render.mjs` | port; the `.mjs` is deleted in the same commit, and its last SHA is named |
| `fgos authority model --json` | component `component-authority` | the only way Node code gets model data; read-only |
| Node readers call the host | `invokeHost` (`src/util/host-bin.mjs`) | reuse; no new client module |

`render` and `model` are separate subcommands so that reading the model never writes the docs. A read-only reader
(a test, the decision index, the instruction registry) must not depend on the code that writes files.

## Inputs
- `packages/component-authority/model/`: `layers.json`, `components.json`, `decision-kinds.json`, `contracts.json`
  and `doors/*.json` (168 KB in total; well under the `tool` profile's 8 MiB bound in
  `packages/yaml-doc/contracts/limits.v1.json`).
- `packages/component-authority/rust/src/model.rs` (`read()`, `load_dir()`, and its tests);
  `packages/component-authority/contracts/model.v1.json`, whose `description` names the `.json` files and whose
  `$defs` stay valid for parsed YAML.
- Node readers of the model today, each to be moved:
  - `test/architecture.test.mjs:68-73` (`loadModel`);
  - `test/component-authority/components.test.mjs`, `contracts.test.mjs` and `render.test.mjs`;
  - `src/report/decision-index.mjs:25` (`DECISION_KINDS_PATH`) and `test/report/decision-index.test.mjs:248`;
  - `src/setup/instruction-registry.mjs:455-478` (`discoverKnownOwners`, including its test-only `modelDir`
    option) and the fixtures in `test/setup/instruction-registry.test.mjs`.
- Every generated view carries the note "rendered … by `node scripts/component-authority-render.mjs`". This is in
  the seven docs listed under Files, and the prose in `docs/platform/README.md:41` and
  `docs/platform/component-boundary.md:64` names the same command.
- `packages/git/contracts/mutation-census.v1.json:1364` hashes the render script.

## Files it may write
packages/component-authority/model/, packages/component-authority/contracts/model.v1.json, packages/component-authority/rust/, Cargo.lock, apps/fgos/src/wiring/authority.rs, apps/fgos/src/routing.rs, apps/fgos/src/invocation_doors.rs, apps/fgos/src/cli_projector.rs, apps/fgos/tests/authority.rs, packages/host-runtime/contracts/command-manifest.json, packages/host-runtime/contracts/command-routes.json, packages/host-runtime/contracts/command-route-annotations.json, packages/host-runtime/rust/src/catalog.rs, src/cli/command-registry.mjs, test/cli/subcommand-flag-drift.test.mjs, test/rust-host/vectors/envelope/version.json, scripts/component-authority-render.mjs (deleted), test/component-authority/, test/architecture.test.mjs, src/report/decision-index.mjs, test/report/decision-index.test.mjs, src/setup/instruction-registry.mjs, test/setup/instruction-registry.test.mjs, packages/git/contracts/mutation-census.v1.json, test/suite-baseline.json, docs/platform/component-authority/spec.md, docs/platform/packaging-distribution/contracts/setup-doctor-registry.md, docs/platform/README.md, docs/platform/component-boundary.md, docs/platform/governance.md, docs/platform/architecture-map.md, docs/platform/system-overview/spec.md, docs/platform/observe/spec.md, docs/platform/workflow/spec.md

## Decisions taken here
- **Each file keeps its top-level shape.** `layers` stays a mapping, and the other files stay sequences. Each door is
  one mapping per file, with its slug from the file name minus `.yaml`. The schema `$defs` do not change.
- **Profile `tool`**, the profile every other YAML read in fgOS uses. The alternative, `strict-config`, would refuse
  aliases but would give the model a different reading from every other YAML file, and nothing in the model needs
  that.
- **No twin.** The JSON model files, the `.mjs` renderer and its Node test are deleted in the same commit as their
  survivors. No reader keeps a JSON or JavaScript fallback. The commit message names the deleted paths and the last
  SHA that had them.
- **Comments are allowed, and the rows stay the same.** This phase adds no annotation, and the loader ignores
  comments.

## Execution
Every writing unit runs with `--provider claude` (owner order, D6 step 0). If claude is unavailable the unit parks and reports. It never falls back to another provider.

## Steps
1. **Convert.** A throwaway program under `.fgos/runtime/tmp/` (never committed) converts each file through the
   crate's own path. That path is `fgos-yaml-doc`'s emitter (`edit::emit`), for example as a crate test helper run
   once. It writes `<name>.yaml`, reads it back through `fgos-yaml-doc`, and asserts that the value equals the JSON
   value. If the emitter refuses a top-level sequence, stop with `Status: BLOCKED` and name the refusal. Never
   hand-write YAML, and never use a JavaScript emitter.
2. **Crate loader.** Add `fgos-yaml-doc` to `packages/component-authority/rust/Cargo.toml`. In `model.rs`, `read()`
   parses with `fgos_yaml_doc::document::parse(.., Profile::Tool, ..)` and `to_json()`, then calls the existing
   typed `serde_json::from_value`. A refusal maps to `ModelError::Invalid` and keeps the file and the rule.
   `load_dir` reads the `.yaml` names. The crate tests write YAML fixtures, and one test proves that a comment is
   ignored.
3. **Model checks move into the crate.** The cases of `components.test.mjs` and `contracts.test.mjs` check model
   validity: schema shape, the component-authority first row, parents, one owner, one provider, consumers, paths
   that exist, and longest-prefix file mapping. Each becomes a crate test (or an `apps/fgos/tests/authority.rs`
   case when it needs the real repository). Delete the two Node files. List each retired test with its new owner in
   the phase report.
4. **Render verb.** Port the renderer into the crate (`render.rs`) behind `fgos authority render`. With no flag it
   writes the views. `--check` exits non-zero on drift and writes nothing. `--preview-holder <path>` keeps
   `buildHolderViewPreview`. Every `render.test.mjs` case becomes a crate test over a temporary repository, and the
   in-sync check runs once on the real repository in `apps/fgos/tests/authority.rs`. The note inside each view
   becomes "rendered … by `fgos authority render`". Delete `scripts/component-authority-render.mjs` and
   `test/component-authority/render.test.mjs`.
5. **Read verb.** `fgos authority model --json` prints the loaded, validated model (layers, components, decision
   kinds, doors with their slugs, contracts) in a `fgos.v1` envelope and writes nothing. Wire both subcommands the
   way phase 1 wired `locate`: routing, invocation doors, projector, the three host command contracts and the
   catalog row. Regenerate the envelope version vector and the flag-drift list.
6. **Node readers through the host.** These call `invokeHost(['authority', 'model', '--json'], { dir })` and read
   `data`: `loadModel` in `test/architecture.test.mjs`, `narrativeHolderResolver` in `decision-index.mjs`, and
   `discoverKnownOwners` in `instruction-registry.mjs`. The test-only `modelDir` option goes away; tests build a
   temporary repository with YAML model files written as literal text. No Node file parses a model file.
   `architecture.test.mjs` keeps only the cases that scan Node source (import direction, door patterns over `.mjs`
   files). Any case that only checks the model itself moves to the crate, as in step 3.
7. **Prose, census, baseline.** Update `model.v1.json`'s `description`, `docs/platform/component-authority/spec.md`,
   `setup-doctor-registry.md:164`, and the two prose lines that name the render command. Regenerate the mutation
   census, because the render script is gone, and drop the deleted tests from `test/suite-baseline.json`.
8. **Delete** every `packages/component-authority/model/**/*.json` in the same commit.
9. **Regenerate.** Run `fgos authority render` (through `npm run fgos:dev -- authority render`). The only diff in
   the views is the note line. Then run `fgos authority render --check` and `npm run build:skills`, and both must
   leave no diff.

## Verify
- `find packages/component-authority/model -name '*.json'` prints nothing; `scripts/component-authority-render.mjs`
  and `test/component-authority/` are gone.
- The command
  `rg -n "(layers|components|decision-kinds|contracts)\.json|model/doors/[a-z0-9-]+\.json|component-authority-render" --glob '!plans/**' --glob '!target/**' --glob '!archive/**'`
  finds nothing.
- No `.mjs` file opens a model file: `rg -n "component-authority/model" --glob '*.mjs'` finds only comments.
- `cargo test -p fgos-component-authority` and `cargo test -p fgos --test authority` are green, the latter including
  `render --check` on the repository. `locate "atomic file write"` still ranks `durable-file` first.
- `node --test test/architecture.test.mjs test/report/decision-index.test.mjs test/setup/instruction-registry.test.mjs test/cli/subcommand-flag-drift.test.mjs`
  is green.
- `npm run fgos:dev -- authority render --check` and `npm run build:skills` leave `git status` clean.

## Risks
- **Emitter quoting of regex patterns in the doors.** Mitigation: step 1 asserts that every file round-trips equal
  before anything is deleted.
- **Byte-for-byte view parity in the port.** Mitigation: step 9 requires that the only diff is the note line, and
  any other diff is a port bug, not a view change.
- **Node readers now need a host.** `npm test` already stages one for `invokeHost`, as the convention client shows.
  A bare checkout without a host fails with the door's named error, the same as RUL108's addon rule.

## Rollback
Revert the phase commit. The JSON files, the `.mjs` renderer and the Node tests come back with it.
