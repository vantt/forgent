# Phase 3: The crate on pkm, the compile door, registration; the Node registry moves out

ACE-D3 and ACE-D6 in one change. The Rust crate becomes the only registry and composer; the Node registry and
composer are deleted with their tests, and their one consumer moves (L10, design principle 1). It starts only after
`261122-2108-delete-dead-node-execution-closure` and `261124-0004-heads-operate-without-owner` are `done`, and after
phase 2 shows no blocking pkm gap.

## Context

- Phase 1 spec and contracts; phase 2 report `reports/pkm-fit.md`.
- The Node code to port and delete: `src/setup/instruction-registry.mjs` (724 lines), `src/setup/instruction-composition.mjs`
  (547 lines). Their tests: `test/setup/instruction-registry.test.mjs`, `test/setup/instruction-composition.test.mjs`.
- Every consumer, enumerated on `4f44bb780` (`rg "from .*instruction-(registry|composition|projections)"`):
  - `src/setup/instruction-projections.mjs:9` imports `discoverInstructionSources`; `:16` imports from the composer;
    `:240` `computeInstructionProjection` composes the repo set and writes `.fgos/instructions/effective/repo.json`.
  - `src/setup/skill-wrappers.mjs:24` imports `computeInstructionProjection` and `materializeInstructionProjection`
    (`renderSkillSurfaces`, run by `npm run build:skills`).
  - `test/setup/instruction-projections.test.mjs:20-21` imports `composeInstructionSet` and `compileInstructionUnit`.
  - `test/rust-host/release-tree.test.mjs:84` imports `instruction-registry.mjs` as one of three YAML-reading probes.
  - Digest and timing rows: `packages/git/contracts/mutation-census.v1.json:1671-1673`, `test/suite-baseline.json:480-482`.
  - Model row: `packages/component-authority/model/contracts.yaml:509` (`docs.packaging-distribution/instruction-composition-and-projection`).
- pkm link to copy: `packages/documentation/rust/Cargo.toml`. Host door to copy: `fgos internal execution <op>
  --protocol 1` (`apps/fgos/src/wiring/execution_routes.rs`), registered in `apps/fgos/src/routing.rs` and the
  command manifest and routes.
- RUL102: `docs/platform/packaging-distribution/spec.md:248` and `:838`; proposal §4.7.2 in
  `docs/platform/proposals/documentation-system-unification.md` (amended per ACE-D2: selection, budgets and reading
  plans are ASC's).

## Requirements

- Crate `fgos-agent-context-engine` at `packages/agent-context-engine/rust/`, tier 3. Modules: `rule` (schema),
  `when_keys`, `compose` (kind order, authority, specificity, override, refine, law protection, conflict and
  dependency checks, ported from the Node composer with its error codes), `set` (effective set, canonical JSON,
  sha256 digest, reader that verifies digest and versions), and `store` (pkm adapter: index, in force, validate)
  behind cargo feature `store`. The reader and `when_keys` build without the feature, so ASC links them without pkm.
- pkm profile and pack file for type `rule` at `packages/agent-context-engine/pkm/`. The pkm index db is a view at
  `.fgos/runtime/context-engine/rules.db` (L3: the unit files are the truth), rebuilt when stale.
- Host adapters in `apps/fgos/src/wiring/context_engine/`: `OwnerRegistry` over the component authority model (the
  reader `fgos authority model` uses) and `ValueSource` over live values (executor ids from config, personas through
  the agent-definition layers, `domains/*`, workflows and stages from domain workflow files). ASC phase 3 reuses this
  `ValueSource`; there is one.
- Door `fgos internal context-engine <op> --protocol 1`, ops `compile` (build the index, check, write the set) and
  `check` (check only, JSON findings, non-zero on refusal).
- The compiled set replaces `.fgos/instructions/effective/repo.json` with `.fgos/instructions/effective/rules.json`;
  the old file is deleted in this change.

## Files

See the phase table in `plan.md`, row 3.

## Steps

1. Declare the component: `fgos authority declare --kind component` with id `agent-context-engine`, tier 3, layer
   `infra`, paths `packages/agent-context-engine/`, spec `docs/platform/agent-context-engine/spec.md`,
   `--approved-by` the answered question of owner question 1. Declare each v1 contract (provider
   `agent-context-engine`). Move the contract row `docs.packaging-distribution/instruction-composition-and-projection`:
   ACE provides composition semantics; packaging-distribution keeps the projection half. Commit rendered views as
   rendered.
2. Supersede RUL102 with a new decision-history entry in `docs/platform/packaging-distribution/spec.md` that records
   ACE-D2 and ACE-D3 (never edit the old entry), update `:248`, rewrite §2 of the composition contract so its
   boundary table names ACE (store, composition, `when:` keys), ASC (selection) and packaging-distribution (files),
   and amend proposal §4.7.2. Add the area row to `docs/reading-map.md`.
3. Create the crate and the pack file. Port each behaviour of the two Node test files to a Rust test in the crate,
   one owning proof per behaviour (design principle 8); list in the commit body each retired Node test and the Rust
   test that now owns it.
4. Migrate the frontmatter of the 7 existing units to `rule-unit.v1` (`when:` from today's `scope`/`appliesTo`,
   `superseded_by` direction, ACE pack edges). Text bodies do not change.
5. Write the adapters and the door; register the door in the routing table, command manifest and routes.
6. Move the consumer: `instruction-projections.mjs` calls `fgos internal context-engine compile`, reads `rules.json`
   through its schema, renders the rules that carry no `when:` restriction (the interim filter; it reproduces today's
   repo target and is deleted by ASC phase 6), and records the set's digest in the ledger entry as today. It finds
   the host through `FGOS_HOST_BIN` or the activated release and fails with a named error when there is none.
   Delete `instruction-registry.mjs`, `instruction-composition.mjs`, their two test files and the composer import in
   `test/setup/instruction-projections.test.mjs`. Drop the registry line from the release-tree YAML probe (the two
   other YAML readers keep that proof). Regenerate the mutation census and the suite baseline with their own tools.
7. Make sure the release staging copies `rules.json` and the pack file, so a project set up from a release has them.

## Validation

- `cargo test -p fgos-agent-context-engine --all-features` (ported cases, vectors, digest round trip) and
  `cargo test -p fgos --test context_engine` (door round trip writes `rules.json`).
- `cargo tree -p fgos-agent-context-engine` lists no `fgos-documentation` and no `fgos-agent-start-context`;
  `cargo tree -p fgos-agent-context-engine --no-default-features` lists no `pkm-core`.
- `npm run build:skills` then `git diff --exit-code AGENTS.md`: the projection block is byte-identical.
- `rg -l "instruction-registry|instruction-composition" src scripts test bin` prints nothing.
- `node scripts/run-tests.mjs test/setup test/rust-host/release-tree.test.mjs test/architecture.test.mjs` and
  `fgos authority render --check` pass.

## Risk

High: it moves a live build path. Mitigations: the byte-identical projection check, the ported tests, and a named
error when the host is missing. The interim filter is the one selection outside ASC, and it is listed in plan.md.

## Rollback

Revert the phase's commits. The Node registry, composer, tests and `repo.json` return together; the model rows and
views revert with them.
