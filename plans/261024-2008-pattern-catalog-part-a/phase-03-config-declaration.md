# Phase 03: declare the catalog and loop tuning in config, retire the old keys, bump the marker

Depends on: 01 (the loop modules whose config reads move). Blocks: 04, 05, 09. Effort: 9h. Risk: High (public config contract, a locked behavior, CFG-owned files, about 20 fixtures).

Run as (fgos-cook): three slices (3a data files and Rust golden proofs, 3b loader and retired-key refusal, 3c consumers and fixtures). Activity `implement-item`, capability `code:implement`, pattern `reviewed` (by hand), rigor `high` for 3a and 3b (public contract, hard to reverse), `standard` for 3c. Expect families to be scarce at `high` (producer, reviewer and red-team on distinct families): size `seatLaunchesPerDispatch` for it (see plan.md). Verify per slice below.

## The CFG gate (check first; flips details, never the plan shape)

Lead CFG has not answered on the schema. Run these once at the start of the phase and write the result in the notebook:

| Check | Command | Meaning |
|---|---|---|
| G1 reader wired? | `git fetch origin && git grep -n "config/facade.mjs" origin/main -- src/runner src/setup bin` | hits and `git grep -c DEFAULT_RUNNER_CONFIG origin/main -- src/runner/dispatch/config.mjs` is 0: **Branch A** (landing C is on main). No hits: **Branch B** (today's HEAD). |
| G2 keys declared? | `git grep -n "loops:" origin/main -- core/config-schema/runner.schema.yaml` and `git grep -n "code-change" origin/main -- core/config-standard/runner.yaml` | hits: CFG landed the keys, 3a only verifies. No hits: 3a writes them (announce on the board first; the later lander reviews, rule "shared file: do not wait"). |

Everything after this phase depends only on two data shapes, the effective `runnerConfig.patterns` and `runnerConfig.loops` objects, and on `shippedCatalog()` (3b). It does not depend on how the effective value was produced, so the branch changes only the steps marked A or B below.

| Concern | Branch B (reader not wired; today) | Branch A (reader wired) |
|---|---|---|
| effective runner value | JSON file read, `mergeWithGlobalConfig` (`src/config/global-config.mjs:64`; semantics already per-key deep, arrays leaves, project wins, `src/setup/config-merge.mjs`), plus the bundled standard as the lowest layer through the same `mergeConfigDefaults` (no new merge semantics; deleted by landing C, which replaces it with the snapshot) | `readConfig({ projectRoot, sections: ['runner'] })`; Config already merged the standard layer. Skip the bottom-layer fill |
| retired-key refusal | the table (3b) runs on the raw project `parsed.runner` and in `sanitizeGlobalLayer`, each naming its own file, before any merge or write-on-read | the table maps `ConfigDoorError.refusals[].path` and `.file` (schema refuses the old shape first) to `config-key-retired` in `loadRunnerConfigForDir` |
| `DEFAULT_RUNNER_CONFIG`, `FRESH_PROJECT_RUNNER_CONFIG` | drop `patterns.defaultRule`, `patterns.reviewed` from the default; add nothing (files hold only differences); fresh project marker becomes schema 2 | already deleted by landing C; fresh-file writer is Config `init` |
| comments | `$comment` keys (`stripConfigComments`) | `@fgos:doc` / `@fgos:why` through `fgos config patch` |

Open CFG points of `plans/261023-1619-collaboration-degree-spec/reports/config-keys-for-cfg.md`, with the default this plan takes and what a different answer changes (data files only, never code):

| Point | Default taken | If CFG answers differently |
|---|---|---|
| 1 optional key with no default (`bounds`) | schema map with `properties` `min`/`max`, no `required`; standard silent (CFG answer of 2026-10-24 13:30) | none |
| 2 per-entry deep merge | `runner.patterns` map carries `x-fgos-merge: deep` | add the annotation |
| 3 type of `invariants.<param>` | `oneOf [ { atLeast: array }, { fixed: {} } ]` | schema text only; the resolver (phase 05) re-checks exactly-one-form itself |
| 4 standard values | taken from `presets.mjs` (seat lists, `rfc` role-task text) and `config.mjs:246-255` (`maxRounds: 2`, `checkersByRigor`) | none |
| 5 older-release fence is not a schema property | proof is manual evidence in phase 12 | none |
| 6 marker beside entries | `runner.patterns.properties.seatBinding` is declared explicitly, `additionalProperties` is the entry schema | schema text only |
| 7 (new) how a retired key is declared | a code table in the runner (3b), applied by both branches | if CFG offers an `x-fgos-retired` annotation, the table becomes data; code and message stay |
| 8 (new) the shipped layer alone, for invariant comparison | an infra reader of the bundled standard (3b) | if the facade exposes the standard layer, swap the reader's body |
| 9 (new) CFG-owned fixture `packages/config/contracts/fixtures/authoring-source.config.json` and `repo-differences.v1.json`, proof `packages/config/rust/tests/authoring_equivalence.rs` | whoever lands second updates them; 3a lists them as writes only if CFG has not | none |

## Context links

- Spec sections 5.1-5.4 (entry shape, merge, reserved names, shipped catalog), 8.4 (bounds), 13.1-13.3, config-keys-for-cfg.md (key table, retired list, load-time errors).
- `docs/platform/config/spec.md` section 4 (schema rules: no `default` keyword; `$id` revision bump; standard is data), section 7 (comment contract), section 5 rule 1 (a read never writes).
- Today: `src/runner/dispatch/config.mjs` `validateRunnerPatternsShape` (:1469-1560), `DEFAULT_RUNNER_CONFIG` (:206-258, patterns at :245-255), marker (:290-298), `sanitizeGlobalLayer` (:324), loaders (:374, :427); `snapshotRunnerConfig` (`src/runner/execution/run.mjs:150-175`).
- Precedent for refusing instead of dropping: commit `478f351ff` (`rigorToTier`), doctor row `tier-vocabulary-dead-keys` (`src/setup/registrations.mjs:1317`).
- Scout facts 1, 2, 10.

## Requirements

1. Keys are declared once, in `core/config-schema/runner.schema.yaml` and `core/config-standard/runner.yaml` (the two CFG-owned files); no second registry, no JS list of keys beyond the shape validator the section owner keeps.
2. Shipped catalog in the standard: `solo`, `reviewed`, `panel`, `debate` (plain defaults; panel and debate carry no seats), `code-change`, `consult`, `rfc`, `research-fan-out`, exactly as spec 5.4. `research-fan-out-gated` and `defaultRule` do not exist. `runner.loops.reviewed` carries `maxRounds: 2` and the `checkersByRigor` of today. `runner.patterns.seatBinding.schema` is 2. Schema `$id` revision bumped; every key has a `@fgos:doc` line saying what it does and why.
3. A config file (project or global) holding a retired key refuses with `RunnerConfigError` code `config-key-retired`, naming the file and the replacement key (or "delete it" for `defaultRule`); never translated, never dropped in memory, never written by the write-on-read path. The retired shape at `runner.patterns.reviewed` is detected by content (holds `maxRounds` or `checkersByRigor`, no `loop`/`defaults`); an entry holding both shapes is a plain config error.
4. Marker: the new release accepts `schema` 1 and 2 and writes 2.
5. Structural validation (load time, also what doctor calls in phase 09): known loop names, entry keys only `promise|loop|defaults|invariants`, `invariants.<param>` exactly one of `atLeast`/`fixed`, reserved names `seatBinding` and `defaultRule` not usable as pattern names, `runner.loops.<loop>` keys only the tuning the loop reads (`reviewed`: `maxRounds`, `checkersByRigor`; every loop: `bounds`), `bounds.<param>` is `{ min?, max? }` of integers for an integer param with `min <= max` and only for a param the loop reads (`maxRounds`). Cross-field rules stay in `validateRunnerConfigShape` (the cumulative `checkersByRigor` rule moves with its keys).
6. The semantic checks (params the final loop reads, invariants not weakened) are the resolver's (phase 05) and are not duplicated here.
7. `snapshotRunnerConfig` hashes `loops` as well as `patterns`.
8. The loop-tuning reads move: `loops/reviewed.mjs:113,144` (`cfg.patterns.reviewed.maxRounds`) and `seat-resolver.mjs:111,262` (`checkersByRigor`, `maxRounds`) read `cfg.loops.reviewed.*`. `legacy-seat-read.mjs:40` keeps reading the old shape: it decodes stored records (phase 06), never live config; add the comment saying so.

## Files (writes)

3a (data and Rust proofs):
- `core/config-schema/runner.schema.yaml`, `core/config-standard/runner.yaml`
- CFG-owned, only if CFG has not landed them: `packages/config/contracts/fixtures/authoring-source.config.json` and `packages/config/contracts/fixtures/repo-differences.v1.json` (the old `defaultRule`/`reviewed` shape pinned by `packages/config/rust/tests/authoring_equivalence.rs`); expect `golden_schema.rs` and `golden_docs.rs` to need no edit, run them to see
3b (loader):
- `src/runner/dispatch/retired-config-keys.mjs` (new: the table, `retiredKeysIn(runnerRaw, file)`, the error)
- `src/runner/dispatch/shipped-catalog.mjs` (new infra reader: parses the bundled `core/config-standard/runner.yaml` with `parseYaml` (tool profile) located the way `TIER_LADDER_URL` is, returns the frozen `{ patterns, loops }`, cached per process; the same module exports `catalogLayersOf(mainRoot)`, which answers `{ <pattern name>: 'project' | 'global' | 'shipped' }` for the pin: branch B reads the raw `runner.patterns` keys of the project file (`readSharedConfig`) and the global file (`loadGlobalConfig`), branch A asks the facade for the origins of `runner.patterns`; run.mjs skips it when a config is injected, and the resolver then falls back to its equality rule)
- `src/runner/dispatch/config.mjs` (replace `validateRunnerPatternsShape`, add `validateRunnerLoopsShape`, `SEAT_BINDING_SCHEMA_VERSION` 2 plus the readable set, branch B/A loader edits, `DEFAULT_RUNNER_CONFIG` and `FRESH_PROJECT_RUNNER_CONFIG`)
- `src/runner/execution/seat-resolver.mjs` (add `LOOP_NAMES` next to `SEAT_ROLES`; the config validator imports it; this file is pure, so the constant is data only)
- `src/runner/execution/run.mjs` (only `snapshotRunnerConfig`, line ~159, add `loops`)
3c (consumers and fixtures):
- `src/runner/execution/loops/reviewed.mjs`, `src/runner/execution/seat-resolver.mjs`, `src/runner/execution/legacy-seat-read.mjs` (comment only)
- `docs/architecture-manifest.json` (two new infra modules), `packages/git/contracts/mutation-census.v1.json` (regenerate)
- Tests (owning proofs and fixtures): `test/runner/dispatch-config-patterns.test.mjs` (owns shape, bounds validity, refusal, shipped catalog data), `test/runner/tier-fallback-config.test.mjs` (marker 2 accepted, 3 refused; lines 170-174), `test/runner/config-seat-binding-layers.test.mjs`, `test/runner/execution/config-snapshot-hash.test.mjs` (add `loops`), `test/setup/registrations.test.mjs` (`EXPECTED_RUNNER_DEFAULT`, lines 187-217, 1154-1190), `test/setup/tier-ladder-comment.test.mjs` (:73 marker value)
- Fixtures that write the old shape into a config (convert `reviewed:{...}` to `loops:{ reviewed:{...} }`, delete `defaultRule`): `test/cli/run-verb.test.mjs:77-79`, `test/git/e2e-consumer-noncoding.test.mjs:25`, `test/helpers/failover-fixture.mjs:148`, `test/helpers/playbook-observable-order.mjs:62`, `test/helpers/workflow-fixture-repo.mjs:36,84-85`, `test/runner/execution/run-case-admission.test.mjs:88,308,324`, `test/runner/execution/run-posture.test.mjs:115-117`, `test/runner/execution/run-sync.test.mjs:74`, `test/runner/execution/run.test.mjs:85-89`, `test/runner/execution/seat-resolver.test.mjs:117`, `test/workflow/advisory-m-contracts.test.mjs:82-84`, `test/workflow/architecture-advisory-workflow.test.mjs:28`, `test/workflow/business-discussion-workflow.test.mjs:24`, `test/workflow/units-runner.test.mjs:97`, `test/workflow/workflow-runner.test.mjs:101-103`. Re-run `git grep -n -E "defaultRule|checkersByRigor|reviewed: *\{" -- test` at slice time; about 150 other fixtures write only `patterns: { seatBinding: { schema: 1 } }` and stay valid.

## Steps

1. Run the gate table; record Branch A or B and G2.
2. 3a: author the schema and standard (CFG rules: `description` on every node, no `default`, `x-fgos-merge`, `$comment: owner: runner` already there, bump `$id`). Entries copy the seat lists and `rfc` task text from `src/runner/execution/patterns/presets.mjs` verbatim; keep a comment-free diff for the unchanged sections. Run `cargo test -p fgos-config --no-fail-fast`; fix only what the new shape breaks (the standard-passes-its-own-schema and authoring-equivalence proofs). The addon embeds the files (`packages/config/rust/src/bundle.rs`), so Node tests need a rebuilt addon: `scripts/run-tests.mjs` stages it.
3. 3b: write `retired-config-keys.mjs` (table: `runner.patterns.defaultRule` to none; `runner.patterns.reviewed.maxRounds` and `.checkersByRigor` to `runner.loops.reviewed.*`; the pattern name `research-fan-out-gated` to `runner.patterns.research-fan-out`). Apply it per the branch table. In branch B call it first thing in `loadRunnerConfigFromDir` and `ensureRunnerConfigForDir` (before `mergeConfigDefaults`, which writes) and in `sanitizeGlobalLayer`, whose error already names the global file.
4. 3b: replace `validateRunnerPatternsShape`, add `validateRunnerLoopsShape`; keep the exported name `validateRunnerPatternsShape` (called at `config.mjs:1834` and imported by the config test) and add `validateRunnerLoopsShape` beside it, called from the same place; delete `ALLOWED_PATTERNS_KEYS`. `src/setup/registrations.mjs:91` imports only `VALID_CHECKER_SEATS` and the marker constant.
5. 3b branch B only: `fillShippedLayer(runnerCfg)` merges `shippedCatalog()` as the lowest layer with `mergeConfigDefaults` (one function, deleted by landing C). Add the proof that it equals the documented merge on a fixture with a project override of a shipped entry, a global entry and a custom name.
6. 3b: test `catalogLayersOf` in `test/runner/dispatch-config-patterns.test.mjs` (a name only in the project file, only in the global file, in both (project wins), in neither (shipped)).
7. 3c: move the reads, convert fixtures, update the owning tests; regenerate the census; update the manifest.
8. `git grep -n "patterns?.reviewed\|patterns\.reviewed\|ALLOWED_PATTERNS_KEYS" -- src` shows only `legacy-seat-read.mjs` and the retired-key table.

## Verify

- 3a: `cargo test -p fgos-config --no-fail-fast`, then `node scripts/run-tests.mjs test/runner/dispatch-config-patterns.test.mjs`.
- 3b: `node scripts/run-tests.mjs test/runner/dispatch-config-patterns.test.mjs test/runner/tier-fallback-config.test.mjs test/runner/config-seat-binding-layers.test.mjs test/runner/execution/config-snapshot-hash.test.mjs`.
- 3c: the 3b files plus every fixture file listed above, plus `test/setup/registrations.test.mjs`.
- End of phase, sequentially and not at the same time (memory cap): `npm test`, then `cargo test --workspace --no-fail-fast`. The bundled data changed, so Rust is touched in effect. Known unrelated reds to ignore: fgctl-upgrade, fgctl-init-download-sources, dev-host concurrent-consumers, holder_lock_gate_passes, killed_move_repairs.

## Risks and mitigations

| Risk | L x I | Mitigation |
|---|---|---|
| CFG lands conflicting edits to the same two data files | M x M | gate G2; post the board line first; merge `origin/main` before and after 3a; later lander reviews |
| `authoring_equivalence.rs` red because the pinned fixture holds the old shape | H x M | step 2 runs it first; fixture update is a named write; do not weaken the proof |
| write-on-read persists a config that still holds retired keys | M x H | step 3 refuses before any merge or write; test: a file with `patterns.reviewed` is byte-identical after a refused load |
| older activated releases refuse the converted project or global file (the intended fence) | H x H | not triggered by this phase (no file is converted until phase 12); stated in plan.md risks |
| Branch B fill is read as the JS merger the spec forbids | M x M | uses the existing merge unchanged, one function, proven equal to the documented semantics, deleted by landing C; unresolved question U1 in plan.md |
| fixture conversion misses a file and a test silently loses its tuning | M x M | `git grep` at slice time; any test still passing `patterns.reviewed` fails with `config-key-retired` rather than ignoring it |

## Rollback

Revert 3c, 3b, 3a in reverse order. No file on disk is converted by this phase, so a revert leaves every config valid.

## Acceptance (owned here)

- S9 part: bounds validity at load (`min > max`, non-integer, bound on an unread param) and doctor-independent shape errors, in `test/runner/dispatch-config-patterns.test.mjs`.
- S18 parts: the new release refuses an unconverted project or global file with `config-key-retired` naming file and replacement (`test/runner/dispatch-config-patterns.test.mjs`); the standard file is converted and holds the eight shipped names with the loops and invariants of spec 5.4 (same file); marker schema 1 and 2 accepted (`test/runner/tier-fallback-config.test.mjs`).
- Extra: `snapshotRunnerConfig` hash covers `loops` (`test/runner/execution/config-snapshot-hash.test.mjs`).
