# Phase 3: The crate, its ports, the host door and its registration

This phase builds the pure composer (ASC-D1, ASC-D5 as amended by ASC-D9), its one host door, and registers the
component. No caller uses it yet. It starts only after plans `261122-2108-delete-dead-node-execution-closure`,
`261124-0004-heads-operate-without-owner` and `261125-1631-agent-context-engine` are `done` (plan.md, "Waits on other
plans"); its data need is ACE phase 3.

## Inputs

- `docs/platform/agent-start-context/spec.md` and `packages/agent-start-context/contracts/**`, from phase 2.
- ACE, from ACE phase 3: the crate `fgos-agent-context-engine` (its reader and `when_keys` modules, built without
  the `store` feature), the compiled set `.fgos/instructions/effective/rules.json`, and the host `ValueSource` adapter
  in `apps/fgos/src/wiring/context_engine/`. The Node instruction registry and composer no longer exist by then.
- A host door to copy: `fgos internal execution <op> --protocol 1` (`apps/fgos/src/wiring/execution_routes.rs`,
  contract `packages/execution/contracts/execution-routes/execution-routes.v1.json`), and how internal verbs are
  registered (`apps/fgos/src/routing.rs`, `packages/host-runtime/contracts/command-manifest.json`,
  `command-routes.json`).
- Observe's record door: `packages/observe/rust/src/record/store/door.rs` (`RecordDoor`, fail-open, 500 ms lock
  wait) and kind declarations injected at `apps/fgos/src/wiring/observe_declarations.rs`.
- Component authority: `docs/platform/component-authority/spec.md` §3.2 and §5; tiers in
  `packages/component-authority/model/layers.yaml` (`tierNames`, tier 3 = agent protocol, Observe, Event Store) and
  each component row's `tier` in `components.yaml`.
- The owner's answer to plan.md "Owner questions" 2 (the approval question id).

## Footprint

`packages/agent-start-context/rust/**`, `Cargo.toml`, `Cargo.lock`, `apps/fgos/Cargo.toml`,
`apps/fgos/src/wiring/start_context.rs`, `apps/fgos/src/wiring/start_context/**`, `apps/fgos/src/wiring/mod.rs`,
`apps/fgos/src/wiring/observe_declarations.rs`, `apps/fgos/src/routing.rs`, `apps/fgos/tests/start_context.rs`,
`packages/host-runtime/contracts/command-manifest.json`, `packages/host-runtime/contracts/command-routes.json`,
`packages/component-authority/model/**`, the generated views (`docs/platform/governance.md`,
`docs/platform/system-overview/spec.md`, `docs/platform/component-boundary.md`, `docs/platform/architecture-map.md`,
`docs/platform/README.md`), `docs/reading-map.md`.

## Steps

1. Register the component: `fgos authority declare --kind component --row <row> --approved-by <q-id>` with id
   `agent-start-context`, tier 3, layer `infra`, paths `packages/agent-start-context/`, spec
   `docs/platform/agent-start-context/spec.md`. Declare each v1 contract (`--kind contract`, provider
   `agent-start-context`). Declaring re-renders the generated views; commit them as rendered, never by hand.
2. Add the area's row to `docs/reading-map.md`. RUL102 and the composition contract row were already handled by ACE
   phase 3, which recorded the three roles of ACE-D2; this phase only checks that the rendered views name ASC as
   the selector.
3. Create the crate `fgos-agent-start-context` at `packages/agent-start-context/rust/` and add it to the workspace
   members. It may depend only on crates at tier 3 or below (canonical-json, yaml-doc, durable-file, and similar)
   and on `fgos-agent-context-engine` with `default-features = false`, so pkm is not linked into it.
4. Types: generate them from, or check them against, the v1 schemas. That covers `StartRequest`, `Facts`
   (`FactKey`, `FactValue`), the closed `Payload` enum, `Delivery`, `StartContext`, `Block` and `Refusal`.
5. Write `compose(&StartRequest, &Ports) -> Result<StartContext, Refusal>`. It:
   - reads the rule set through `RuleSet` and refuses it when its version or digest does not verify;
   - validates facts against ACE's key registry and the live values (unknown key, invalid value, missing required
     key);
   - selects the rules whose `when:` matches, keeping ACE's composition order (ACE already resolved supersession,
     conflicts and overrides when the rules were written);
   - places the payloads unchanged;
   - calls the contributors whose `when:` matches, within their timeout and budget, and on failure leaves the block
     out and records it;
   - applies the delivery's byte budget, dropping the optional blocks with the lowest priority and recording each
     drop;
   - hands the record to `RecordSink`.
6. Define the ports `RuleSet`, `FactRegistry`, `RecordSink` and `Contributor` as traits. The crate itself does no
   I/O.
7. Put the host adapters in `apps/fgos/src/wiring/start_context/`:
   - a `RuleSet` that reads `.fgos/instructions/effective/rules.json` (from the project, or from the activated
     release for fgOS-owned rules) through ACE's reader;
   - a `FactRegistry` that takes the keys from ACE's `when-keys.v1.json` and the live values from ACE's host
     `ValueSource` adapter (one adapter for both components, never a copy);
   - a `RecordSink` that writes one Observe record of kind `start-context` through `RecordDoor`. Declare the kind in
     the crate's own kinds file and inject it at `apps/fgos/src/wiring/observe_declarations.rs`. No JSONL of its own
     (L1, L3: Observe's shard is the truth).
8. Add the door `fgos internal start-context compose --input -`: a JSON `StartRequest` goes in on stdin, and a JSON
   `StartContext` comes out, or a `Refusal` with a non-zero exit. Register it in the routing table and the command
   manifest and routes.

## Verify

- `cargo test -p fgos-agent-start-context` passes. This covers the schema vectors from phase 2, one test per refusal
  (a tampered digest included), the order and budget, and a failing contributor that is left out and recorded.
- `cargo tree -p fgos-agent-start-context` lists no `pkm-core` (ACE-D6).
- `cargo test -p fgos --test start_context` passes: the door round-trips one vector and writes one record
  of kind `start-context` in Observe's record store.
- `fgos authority render --check` passes, and `node scripts/run-tests.mjs test/architecture.test.mjs` passes.

## Rollback

Revert the commits. Nothing calls the crate yet; the model rows and rendered views revert with them.
