# Phase 1 — Observe record contract and write door

Layer 1 of OM-D4: the part that must be right first. Rust (OM-D3).

## Inputs
- `docs/discussions/ops-metrics/DISCUSSION.md` §6.0 and §6.0.1 (record shape, registry, OM-D8 names, OM-D12 declarations at the place of use).
- `plans/reports/research-261118-1017-skillstation-observability-lessons.md` (lessons 1-6, 8).
- `packages/observe/contracts/observe.observation.v1.json`, `packages/observe/rust/src/contract.rs:57-100` (shape being extended).
- `packages/observe/rust/src/shard.rs`, `store_lock.rs`, `flags.rs`; `docs/platform/observe/spec.md` §3 (store rules).

## Footprint
`packages/observe/contracts/observe.record.v2.json`, `packages/observe/contracts/observe-names.json`,
`packages/observe/rust/src/record/**`, `packages/observe/rust/src/lib.rs`, `packages/observe/rust/Cargo.toml`,
`packages/observe/rust/src/metrics_cli/mod.rs`, `packages/observe/rust/src/metrics_cli/record.rs`,
`packages/observe/rust/tests/record_*.rs`, `test/fixtures/observe/record/**`.

## Steps
1. Write `observe.record.v2.json`. The record carries the following fields:
   - `v`, `id`, `kind`, `ts`, and an optional `endTs` (a span);
   - `subject {kind,id}` and `refs[]`;
   - `attrs` (string | bool | int dimensions) and `measures` (numbers);
   - `basis` (observed | reported | transcript | owner | derived);
   - `origin {source, component, writer, host, release, configRev, project}`;
   - optional capped `detail`, plus a redaction stamp.

   Only additions are allowed, and `v` changes only on a break.
2. Write `observe-names.json`, the shared standard names Observe owns.
   - From the OTel GenAI conventions: `gen_ai.provider.name`, `gen_ai.request.model`, `gen_ai.usage.input_tokens`,
     `gen_ai.usage.output_tokens`, plus cache-token names.
   - The fgOS-wide subject and ref kinds: `run`, `unit`, `plan`, `phase`, `backlog`, `session`, `head`, `account`,
     `provider`.
   - Each name has a type, a unit (for measures) and its valid aggregations.
   - Record the OTel convention version used, and an alias list for renames.
3. Write the declaration format, `observe-kinds.json` with `kinds[]`. Each kind gives the subject kinds it allows, the
   attrs and measures it uses, their types and closed value sets, and units. Then write the loader, which merges:
   - the release's declarations (every `packages/*/contracts/observe-kinds.json` and `apps/fgos/observe-kinds.json`,
     shipped in the release manifest);
   - the skill and tool declarations (`**/observe/kinds/*.json` under `core/` and `domains/`);
   - the project's own declarations (`.fgos/observe/kinds/*.json`).

   A name declared twice with different meanings is an error naming both files. Observe keeps no list of consumer
   kinds.
4. Build the write door: the Rust API `record(&Record)` plus the verb `fgos metrics record --json <file|->`.
   - Validate against the merged registry and write through the shard door into the store `.fgos/observe/records/`,
     under the same lock and root rules as the other stores.
   - Make it fail-open with a time bound: it never returns an error that changes the caller's outcome.
   - Count `accepted`, `written`, `rejected` and `errors`, and keep `lastError` per writer in
     `.fgos/observe/records/health/<writerId>.json`.
   - Expose that health as a projected kind `fgos.observe.health`, so it can be queried.
5. Ids: a writer may pass a deterministic `id`. A second record with the same id is accepted and ignored, so replay is
   idempotent. Without an id, the door makes a random one.
6. Tests, at the lowest layer, one per behaviour:
   - the schema and registry round trip;
   - a refused unknown kind or wrong type;
   - a collision between two declarations;
   - a duplicate id ignored;
   - the bounded time while another process holds the lock, with the counter incremented and no error to the caller;
   - a fixed clock in the fixtures.
7. Review before phase 4 starts: express, as test-local declarations, the deferred kinds `fgos.watcher.tick` and
   `fgos.supervisor.wake` (DISCUSSION §6 E) and `fgos.question.asked|answered` (OM-D11). Show they validate without touching Observe source.

## Verify
`cargo test -p fgos-observe` green. `rg -n 'supervisor|question' packages/observe/rust/src/record` returns nothing.

## Rollback
Revert the phase commit. Nothing else reads the new store yet.
