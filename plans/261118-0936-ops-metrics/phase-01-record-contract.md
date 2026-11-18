# Phase 1 — Record contract, names and declarations

Layer 1 of OM-D4, first half. Rust (OM-D3). No CLI verb in this phase: the registry entries go to phase 7, so that
`command-registry.mjs` has one writer per wave.

## Inputs
- `docs/discussions/ops-metrics/DISCUSSION.md` §6.0, §6.0.1, OM-D5, OM-D8, OM-D12.
- `plans/reports/research-261118-1017-skillstation-observability-lessons.md` lessons 1, 3, 5, 6, 8.
- `packages/observe/rust/src/contract.rs` (v1 `Observation`, closed `SubjectKind`, `ObservationSource`), and its users
  in `apps/fgos/src/wiring/metrics_sources.rs`: `RunResultSource`, `ClaudeTranscriptsSource`, and `fgos-work-state`'s
  `WorkSource`.
- `packages/observe/rust/tests/boundary_test.rs`, which lists the `fgos-*` crates Observe may depend on.

## Footprint
`packages/observe/contracts/observe.record.v2.json`, `packages/observe/contracts/observe-names.json`,
`packages/observe/rust/src/contract.rs`, `packages/observe/rust/src/record/types/**`,
`packages/observe/rust/src/record/registry/**`, `packages/observe/rust/src/record/mod.rs`,
`packages/observe/rust/src/lib.rs`, `packages/observe/rust/Cargo.toml`, `packages/observe/rust/tests/record_*.rs`,
`apps/fgos/src/wiring/observe_declarations.rs`, `apps/fgos/src/wiring/mod.rs`, `test/fixtures/observe/record/**`.

## Steps
1. `observe.record.v2.json` defines the record fields:
   - `v`, `id`, `kind`, `ts`, and an optional `endTs` (a span);
   - `subject {kind,id}` and `refs[]`, whose kinds are open strings checked against the registry;
   - `attrs` (string, bool or int dimensions) and `measures` (numbers);
   - `basis` (observed | reported | transcript | owner | derived);
   - `origin {source, component, writer, host, release, configRev, project}`;
   - an optional capped `detail` and a redaction stamp.

   The record only grows by addition. `v` changes only on a breaking change.
2. `observe-names.json` holds the shared names that Observe owns:
   - The OTel GenAI names (`gen_ai.provider.name`, `gen_ai.request.model`, `gen_ai.usage.input_tokens`,
     `gen_ai.usage.output_tokens`, the cache-token names). Record the convention version and an alias list.
   - The fgOS-wide subject and ref kinds: `run`, `unit`, `plan`, `phase`, `backlog`, `session`, `head`, `account`,
     `provider`.
   - For each name: its type, its unit for measures, and the aggregations that are valid on it.
3. Declaration format, `observe-kinds` JSON. Each kind gives its allowed subject kinds, its attrs and measures with
   their types and closed value sets, and their units. The loader merges three sources:
   - Declarations each crate embeds with `include_str!`, which the composition root injects. The new
     `apps/fgos/src/wiring/observe_declarations.rs` holds the list, the same way `metrics_sources.rs` injects sources.
     An installed host has no `packages/` tree, so declarations must travel inside the binary.
   - Files found by glob under `core/**/observe/kinds/*.json` and `domains/**/observe/kinds/*.json` of the payload.
   - The project's own `.fgos/observe/kinds/*.json`.

   A name declared twice with different meanings is an error that names both sources. Observe keeps no list of
   consumer kinds.
4. In `contract.rs`, add a v2 `RecordSource` trait whose sources return records. They must state the kinds they
   project. The v1 `Observation` and `ObservationSource` stay until their three sources move:
   - phase 8 moves `RunResultSource`;
   - phase 10 moves `ClaudeTranscriptsSource`;
   - `WorkSource` stays on v1, and phase 16 files a backlog row to retire v1 once Work moves, under L10 and the Work
     layer ordering.
5. Tests, at the lowest layer:
   - the schema and registry round trip;
   - an unknown kind refused, and a wrong type refused;
   - a collision between two declarations;
   - the merge of an embedded declaration, a glob declaration and a project declaration;
   - a fixed clock in every fixture.
6. Gate before phases 4 and 5 start. As test-local declarations, write the kinds that will arrive later:
   - `fgos.watcher.tick` and `fgos.supervisor.wake` (DISCUSSION §6 E);
   - `fgos.question.asked|answered` (OM-D13).

   Show that they validate without touching Observe source.

## Verify
- `cargo test -p fgos-observe` and `cargo test -p fgos` are green.
- `rg -n 'watcher|supervisor|question' packages/observe/rust/src` returns nothing.

## Rollback
Revert the phase commit. Nothing reads the new types yet.
