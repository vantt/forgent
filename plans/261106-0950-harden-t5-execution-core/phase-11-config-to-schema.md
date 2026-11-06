---
phase: 11
title: "Config: type, enum, range and required rules leave config.mjs for the runner schema; Node keeps cross-field rules; loadRunnerConfig and the dispatch.mjs barrel go"
status: pending
depends_on: [03, 04]
parallel: "wave 3, with 08 (and with 10 if the waves overlap: disjoint files)"
effort: ~1.5d (sized function by function)
net_size: "Node −600 to −1 000 / Rust 0 / tests −200 (estimate; schema YAML about +100, not counted)"
---

# Phase 11 — Config type rules to the schema

## Context

Arbitration §2 Dispatch shape ("Config: Node keeps cross-field rules only; type, enum, range and required rules live in `core/config-schema/runner.schema.yaml` (CFG reviews)"; `config.mjs` ≤ 1 300 "sized function by function in the sub-plan"; the `dispatch.mjs` barrel gone); §3 Simpl. 7 (each removed Node check names its schema rule; `confinement` gains `additionalProperties: false`); batch B "NOT DONE: `loadRunnerConfig`" (dead in production, 15 test files use it as a fixture loader). The config door already validates every written section against the schema before Node sees it (`packages/config/rust/src/snapshot.rs:404-430`, "only the sections a file wrote are validated"); `docs/platform/component-boundary.md` row 91 says type rules belong to the schema. CFG review (reviewer named on the board, RT-P14). Schema change activates on every machine at once.

Code read on `4b116c27e` — `src/runner/dispatch/config.mjs` (2 084 lines), functions over 60 lines and their nature:

| Function | Lines | Kind (lead confirms rule by rule) | Target |
|---|---|---|---|
| `validateRunnerConfigShape` | `:1860-2085` (226) | mostly type/range (`timeoutMs` positive and ceiling, `idleTimeoutMs`, `parallel.maxRoots`, `confinement` keys and boolean `strict`, `modelPolicies` object) plus some cross-field | schema for types; cross-field stays |
| `validateExecutorEntryShape` | `:1102-1226` (125) | type/enum | schema (`executorEntry`) |
| `validateInvocationShape` | `:791-873` (83) | type/enum | schema |
| `validateCapabilitiesShape` | `:1375-1464` (90) | type plus `for` against the catalog (cross-field) | split |
| `validateExecutionProfileShape` | `:1028-1101` (74) | type/enum | schema |
| `validateInteractiveModeShape` | `:874-946` (73) | type/enum | schema |
| `validateRunnerPatternsShape` | `:1473-1625` (153) | table checks; part type | split |
| `validateRunnerLoopsShape` | `:1626-1730` (105) | bounds tables; part type | split |
| `validateExecutorShape` | `:516-578` (63) | type | schema |
| `parseRunTimeout` | `:611-743` (133) | parsing and cross-field | stays, trimmed |
| `warnIfProviderFamilyUnreliable` | `:947-1027` (81) | cross-field warning | stays |
| `resolveOriginLocations` | `:129-210` (82) | provenance | stays |
| `loadRunnerConfig` | `:466-489` | dead in production (barrel `dispatch.mjs:14` only) | delete |

Also: orphaned doc-comment head near the `capabilities` catalog (batch B note, about `:1262`); `runner.schema.yaml:149-155` (`confinement` object without `additionalProperties: false`). Barrel `src/runner/dispatch.mjs` (68 lines, 40 re-exports): production importers `bin/fgos-runner.mjs:24` (`loadRunnerConfigForDir`), `scripts/dispatch-decide-hook.mjs:34` (`decideExecutorCli`, `runDoorHint`), `bin/fgos.mjs:5056` (dynamic `decideExecutorCli`); tests `test/architecture.test.mjs`, `test/cli/dispatch-operability.test.mjs`, `test/setup/capability-catalog-doctrine.test.mjs`, `test/runner/dispatch.test.mjs`, `test/runner/dispatch-governance-operability.test.mjs`. `loadRunnerConfig(` test calls: `dispatch.test.mjs` 82, `dispatch-config-patterns` 9, `capability-catalog-doctrine` 6, `dispatch-confinement-policies` 6, `dead-vocabulary-guard` 5, `herdr-spawn-adapter` 4, `dispatch-governance-operability` 3, `dispatch-executor-profile` 3, `credential-store` 3, `dispatch-confinement-p04` 1. Shape-only doctor rows: `registrations.mjs:1402` `runner-generated-paths`, `:1408` `runner-patterns-config`, `:1420` `executor-family-unique`, `:1432` `tier-fallback`, `:1438` `model-policy-pools`.

## Requirements

- **Function by function.** For each Node check in the table: if the schema already states it (`rg` the schema node), delete the Node check; if the schema does not, add the rule to `runner.schema.yaml` (type, enum, `minimum`/`exclusiveMinimum`/`maximum`, `required`, `additionalProperties: false`) and delete the Node check; if it compares two fields or a field to a catalog/registry, it stays in Node. The report has one row per removed check: Node line → schema path that now refuses it, and one row per kept check with why it is cross-field. Error messages to the user come from the config door's refusals (file, line, path); if a Node message carried a hint the refusal lacks, the hint goes into the schema `description`.
- `confinement` gains `additionalProperties: false` (the Node check supplied it); keep P04's `tighten` annotation.
- **Doctor rows (gate 8, no condition lost).** A shape-only condition of `runner-generated-paths`, `runner-patterns-config`, `executor-family-unique`, `tier-fallback`, `model-policy-pools` that the schema now refuses is reported by the config doctor's schema findings; the row keeps its cross-field conditions. A row left with no condition goes, and the doctor table in the report names where each of its conditions now lives. Row ids may change only with CFG's agreement.
- **`loadRunnerConfig` goes.** Its test callers build the object directly when they test Node logic over a config value, or write a scratch project `.fgos/config.yaml` and call `loadRunnerConfigForDir` when they test reading (an existing test helper if one exists; `rg -n "config.yaml" test/helpers`). Tests that only proved a shape error now owned by the schema are retired (owner: the schema validation goldens in `packages/config/rust/tests/golden_validate.rs` over the runner schema, plus one Node wiring case that a schema refusal reaches `loadRunnerConfigForDir`'s caller by name).
- **Barrel goes.** The three production importers and five tests import from the owning modules; `src/runner/dispatch.mjs` and its manifest row are deleted (L10).
- Budget: `config.mjs` ≤ 1 300; Dispatch outside `confinement/` ≤ 19 000 after this phase.

## Files

**Create:** none.

**Modify:** `src/runner/dispatch/config.mjs`; `core/config-schema/runner.schema.yaml`; `src/setup/registrations.mjs` (`:1402-1440` rows); `bin/fgos-runner.mjs:24`; `scripts/dispatch-decide-hook.mjs:34`; `bin/fgos.mjs:5056`; the ten `loadRunnerConfig` test files and five barrel test importers; `packages/config/rust/tests/golden_validate.rs` (runner cases if the schema gains rules); `docs/architecture-manifest.json`; `docs/platform/config/spec.md` and `docs/platform/runner/spec.md` only where they name a Node check; census; `CHANGELOG.md` (messages for bad runner config now come from the config door).

**Delete:** `src/runner/dispatch.mjs`; `loadRunnerConfig`; every Node type check the schema owns; the orphaned doc-comment fragment.

**Tests to retire:** shape-error cases in `test/runner/dispatch.test.mjs`, `dispatch-config-patterns.test.mjs`, `dispatch-executor-profile.test.mjs`, `dispatch-confinement-policies.test.mjs` whose condition the schema now refuses: owner `golden_validate.rs` (runner schema cases) plus the one Node wiring case; the lead lists each title and the schema rule that owns it. Cross-field cases stay.

## Net size

Node: type validators −500 to −900, `loadRunnerConfig` −24, barrel −68, kept cross-field rules trimmed → −600 to −1 000. Tests: shape cases −250, fixture rewrites ±, wiring +10, Rust validate cases +40 → about −200. Schema YAML about +100 (not counted; a contract, not code).

## Steps

1. Map each function's checks to schema nodes (table in the report) before deleting anything.
2. Schema additions; `cargo test -p fgos-config` over the runner schema; census of all workspaces' runner sections with the new schema (`fgos config check`, read-only) before land.
3. Delete Node checks function by function; run the dispatch config tests after each.
4. Doctor rows; `loadRunnerConfig` and fixtures; barrel.
5. Budget scan; CFG review; CHANGELOG.

## Validation (focused)

- `cargo test -p fgos-config`.
- FR `test/runner/dispatch.test.mjs test/runner/dispatch-config-patterns.test.mjs test/runner/dispatch-executor-profile.test.mjs test/runner/dispatch-confinement-policies.test.mjs test/runner/dispatch-governance-operability.test.mjs test/runner/config-seat-binding-layers.test.mjs test/runner/tier-fallback-config.test.mjs test/runner/dead-vocabulary-guard.test.mjs test/runner/herdr-spawn-adapter.test.mjs test/runner/credential-store.test.mjs test/setup/capability-catalog-doctrine.test.mjs test/setup/checks.test.mjs test/cli/dispatch-operability.test.mjs test/architecture.test.mjs`
- `wc -l src/runner/dispatch/config.mjs` ≤ 1 300; `test -e src/runner/dispatch.mjs` fails.
- `fgos config check` with the built host on this checkout and (read-only census) on every workspace: no new refusal, or each listed and resolved before land.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| A workspace config valid under Node's looser check is refused by the stricter schema at activation | M × H | Read-only census on every workspace before the window; schema rules match what Node refused, not stricter, unless the report says why. |
| A cross-field rule is deleted as "type" | M × M | Table first; CFG review reads the table. |
| User-facing messages get worse | M × L | Hints move into schema descriptions; the refusal names file, line and path. |
| Fixture rewrites change what a test proves | M × M | Rewrites keep the assertion; any test whose assertion changes names why in the commit. |

## Rollback

Revert the merge; re-activate the previous release on both machines in one window (schema). Files accepted by the new schema are accepted by the old Node checks (they were the looser or equal rule).

## Done when

Table complete; `config.mjs` ≤ 1 300; barrel and `loadRunnerConfig` gone; doctor conditions all accounted for; CFG review recorded; landed in an announced window on both machines; guide section written.

## Lead brief essentials

Map before you delete; schema owns type, Node owns cross-field; census before land. All plan.md lead rules apply.
