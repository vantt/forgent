# Phase report: section schemas (phase 12) and the runner schema and standard (phase 13)

Branch `cfg/slice-b-schemas`. Commits: `e3195c466` (meta-schema id fix), `4a76e198a` (phase 12), `221403acb` (phase 13). `cargo test -p fgos-config` green (all test binaries), clippy and rustfmt clean on my files. `.fgos/config.json` is identical to `origin/main` (git diff empty, last change `ef4a056d7`), so no merge was needed; sha256 `7d89f588...8d7`.

## Files and YAML line counts

Schemas (`core/config-schema/`): runner 807, secrets 42, terminal 35, eventStore 34, gateway 30, herdrOrchestrator 18, invariantChecks 15, worktreeSetup 15, cleanup 14, bin 11, checkpoint 10, gateBypass 10, ironLaw 10, workerSlots 10, docRegistry 9, herdrWebDashboard 9.
Standard (`core/config-standard/`): runner 779, eventStore 18, terminal 18, herdrOrchestrator 12, secrets 9, cleanup 8, gateway 8, checkpoint 6, docRegistry 6, gateBypass 6, herdrWebDashboard 6, invariantChecks 6, ironLaw 6, workerSlots 6, worktreeSetup 6 (no `bin`, no `lock`).
Measured: `runner.schema.yaml` 30754 bytes depth 11; `runner.yaml` 30711 bytes depth 8 (strict-config limits 1 MiB, 32). The runner schema is 807 lines against the 450 estimate because one key per line; no splitting needed.
Fixtures/tests: `registry-defaults.v1.json`, `authoring-source.config.json`, `repo-differences.v1.json`, `tests/registry_defaults.rs`, `tests/authoring_equivalence.rs`; `src/bundle.rs` lists (alphabetical).

Phase 12 facts: 14 `registerConfigDefault` keys = 13 small sections + `runner` (rg confirmed). Node and Rust defaults agree (herdrOrchestrator all false, herdrWebDashboard staticServing true, gateBypass off, gateway port 4170, terminal 80x20, 8 panes, 60000 grace). Terminal floors (40/8) follow the Node doctor; the Rust route only requires >= 1. Known differences registry vs standard (5): `gateway.token` (leaves for the token file), `gateway.bind` (Rust DEFAULT_BIND 0.0.0.0), `eventStore.seal.intervalSec`, `sync.intervalSec`, `rebuild.maxAttempts` (reader defaults the registration never seeded).

## Scrub list (G-B2 A), all in the standard only

1. `runner.capabilities."fgos-coding-implement".description`: dropped `omp-gemini-tetcu72`.
2. `runner.executors.gemini.description`: dropped the `gemini-tetcu72` profile name.
3. `runner.executors.xai.description`: dropped `xai-vantt`, `grok-vantt` and the `~/.fgos/config.json` reference.
4. `credentialStore` blocks removed from 11 invocations: glm 1, openai 4, gemini 2, xai 2, deepseek 2 (env var names `PI_CODING_AGENT_DIR`, `CODEX_HOME`, login file lists).
5. `env: {PI_CONFIG_DIR: ../../tmp/fgos-omp-config}` removed from 4 invocations (gemini 2, xai 2).
No `resourceBindings`, host names, ports or token-looking strings exist in the runner catalog. `prefer` families all ship an executor (unknown ids are skipped with `unknown-executor`, `docs/specs/runner.md` RUL88, and a family with no model cell is skipped, RUL106).

## Difference list (19, `repo-differences.v1.json`)

Scalars at code default or no default: `runner.timeoutMs` (900000 vs 2100000), `runner.idleTimeoutMs` (no code default), `runner.maxTier` (no code default).
Project-specific: `runner.executor` (detected; this repo's allowedTools list), `runner.generatedPaths`.
Scrub restatements: `runner.executors.{gemini,xai}.description`, `runner.executors.{glm,openai,gemini,xai,deepseek}.invocations` (a list is one leaf, so the whole list), `runner.capabilities."fgos-coding-implement".description`.
Small-section choices: `herdrOrchestrator.autoDiscover`, `gateBypass.level`, `cleanup.ttlDays`, `invariantChecks.commands`, `docRegistry.enforce`, `worktreeSetup.commands`.
Exclusions (3): `gateway` (global-only, refused in a project file, asserted), `lock` (no schema, kept and reported undescribed, asserted), `runner.$comment` (in the source, in no standard file, asserted). Standard-only (4): `eventStore.seal/sync/rebuild`, `secrets`.
Equivalence passes: standard + differences through the snapshot (project file, no global) equals the source minus exclusions and standard-only paths.

## Questions for the owner

1. **credentialStore and env scrub (fits rule, but consequence).** Rule A names `credentialStore` and env refs, so I removed them. Those blocks hold no path, secret or profile name, only the CLI login wiring; without them a standard executor that leases a pooled account cannot find its login store (`credentialStoreOf` returns null, so the pool reads `pool-unusable`), and omp loses its runtime dir. Proposed: keep them in the standard (they are the same on every machine) and only scrub the three description texts. A flip is data only (rebuild `runner.yaml`, drop five `invocations` rows).
2. **`thehive` pool suffix** in `modelPolicies` z-ai and deepseek cells (`...@thehive`) kept as a catalog pool name; confirm it is not owner-specific.
3. `runner.executors.*.invocations[].confinement.backend: bwrap` kept (a backend reference, same on every machine).
4. Standard `capabilities` carry the five project-only keys (`tier`, `maxTier`, `roles`, `personas`, `seats`); the standard layer is not judged by scope, so they are legal there. Confirm that is intended.
5. Owner names are my reading of the component docs: work-state, event-store, enduser-docs-index, herdr-web-dashboard, agent-coordination (herdrOrchestrator), terminal-control, fgos-gateway, secrets, distribution, runner. Cosmetic.

## Concerns for the coordinator (files outside my ownership)

- **Ladder is one line, not one `@fgos:doc` line per tier.** The meta-schema `schema-description-missing` allows only a trailing newline in a `description`, and `doc_line` collapses whitespace, so the coordinator note cannot be met without changing both. I pinned the ladder as one description tail (`Tier ladder, weakest first: <one entry per tier joined by " | ">`) equal to the contract rendering.
- **Meta-schema fix (committed `e3195c466`)**: the `$id` pattern rejected camelCase sections (`gateBypass`), which the lint also demands equal the file stem. Widened to `[a-z][A-Za-z0-9-]*`.
- **Meta-schema defect not fixed**: `schema-default-forbidden` is `not: {required: [default]}`, which fails for any boolean subschema, so `additionalProperties: false` is unusable. I wrote none (unknown keys stay undescribed and kept, as the spec says).
- `doc_line` renders only the node's own `default` keyword, so the standard value is not shown by the real renderer (D26). The tests inject the standard value as `default` on a copy; the rule used (and the generator I used for the lines): scalar or list values up to 120 characters, never a map, `null` not shown (the renderer skips it).
- `scope.v1.json` gained `first-slice-global-only` (the list phase 12 reads); `fixture_shape.rs` skips `authoring-source.config.json` like the vendored suite.
- `secrets.declarations` follows spec rule 4 (a map keyed by name; `name` omitted) while `packages/secrets` deserializes a list with a `name` field; the secrets owner should reconcile. `secrets.projectFile` has a standard (`.fgos/secrets.local.env`, spec table) beyond the three keys the phase named.
- `gateway.token` is `type: string` (meta rule for `x-fgos-file: token`), so a file's present `null` token will be flagged at migration.

Status: DONE_WITH_CONCERNS
