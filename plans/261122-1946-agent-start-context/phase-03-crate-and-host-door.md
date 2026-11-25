# Phase 3: The crate, its ports, the host door and its registration

This phase builds the pure composer (ASC-D1, ASC-D5), its one host door, and registers the component. No caller
uses it yet. It starts only after plans `261122-2108-delete-dead-node-execution-closure` and
`261124-0004-heads-operate-without-owner` are `done` (plan.md, "Waits on other plans").

## Inputs

- `docs/platform/agent-start-context/spec.md` and `packages/agent-start-context/contracts/**`, from phase 2.
- The instruction registry, whose rules the `UnitSource` adapter must match: `src/setup/instruction-registry.mjs`
  (roots and `discoverInstructionSources` at line 588, the owner check against the component authority model at
  about line 448, frontmatter, scope specificity at lines 74-83) and `src/setup/instruction-composition.mjs`
  (authority order at line 66, `supersedes`/`conflicts`). The registry is still Node; nothing of it moved to Rust.
- A host door to copy: `fgos internal execution <op> --protocol 1` (`apps/fgos/src/wiring/execution_routes.rs`,
  contract `packages/execution/contracts/execution-routes/execution-routes.v1.json`), and how internal verbs are
  registered (`apps/fgos/src/routing.rs`, `packages/host-runtime/contracts/command-manifest.json`,
  `command-routes.json`).
- Observe's record door: `packages/observe/rust/src/record/store/door.rs` (`RecordDoor`, fail-open, 500 ms lock
  wait) and kind declarations injected at `apps/fgos/src/wiring/observe_declarations.rs`.
- Component authority: `docs/platform/component-authority/spec.md` §3.2 and §5; tiers in
  `packages/component-authority/model/layers.yaml` (`tierNames`, tier 3 = agent protocol, Observe, Event Store) and
  each component row's `tier` in `components.yaml`.
- Owner answers to plan.md "Owner questions" 2 (the approval question id) and 3 (where the RUL102 amendment lands).

## Footprint

`packages/agent-start-context/rust/**`, `Cargo.toml`, `Cargo.lock`, `apps/fgos/Cargo.toml`,
`apps/fgos/src/wiring/start_context.rs`, `apps/fgos/src/wiring/start_context/**`, `apps/fgos/src/wiring/mod.rs`,
`apps/fgos/src/wiring/observe_declarations.rs`, `apps/fgos/src/routing.rs`, `apps/fgos/tests/start_context.rs`,
`packages/host-runtime/contracts/command-manifest.json`, `packages/host-runtime/contracts/command-routes.json`,
`packages/component-authority/model/**`, the generated views (`docs/platform/governance.md`,
`docs/platform/system-overview/spec.md`, `docs/platform/component-boundary.md`, `docs/platform/architecture-map.md`,
`docs/platform/README.md`), `docs/platform/packaging-distribution/spec.md`, `docs/reading-map.md`.

## Steps

1. Register the component: `fgos authority declare --kind component --row <row> --approved-by <q-id>` with id
   `agent-start-context`, tier 3, layer `infra`, paths `packages/agent-start-context/`, spec
   `docs/platform/agent-start-context/spec.md`. Declare each v1 contract (`--kind contract`, provider
   `agent-start-context`). Declaring re-renders the generated views; commit them as rendered, never by hand.
2. Amend RUL102 in `docs/platform/packaging-distribution/spec.md` (a new decision-history entry; the old one is
   superseded, not edited) and move the owner of the composition contract row as the owner approved (ACE composes
   and selects, ASC is its door, packaging-distribution delivers). If the move of a decision kind is needed, use
   `fgos authority declare --move --plan plans/261122-1946-agent-start-context`. Add the area's row to
   `docs/reading-map.md`.
3. Create the crate `fgos-agent-start-context` at `packages/agent-start-context/rust/` and add it to the workspace
   members. It may depend only on crates at tier 3 or below (canonical-json, yaml-doc, durable-file, and similar).
4. Types: generate them from, or check them against, the v1 schemas. That covers `StartRequest`, `Facts`
   (`FactKey`, `FactValue`), the closed `Payload` enum, `Delivery`, `StartContext`, `Block` and `Refusal`.
5. Write `compose(&StartRequest, &Ports) -> Result<StartContext, Refusal>`. It:
   - validates facts against the registry (unknown key, invalid value, missing required key);
   - selects units whose `when:` matches;
   - orders the blocks by authority and specificity, and applies `supersedes` and `conflicts`;
   - places the payloads unchanged;
   - calls the contributors whose `when:` matches, within their timeout and budget, and on failure leaves the block
     out and records it;
   - applies the delivery's byte budget, dropping the optional blocks with the lowest priority and recording each
     drop;
   - hands the record to `RecordSink`.
6. Define the ports `UnitSource`, `FactRegistry`, `RecordSink` and `Contributor` as traits. The crate itself does no
   I/O.
7. Put the host adapters in `apps/fgos/src/wiring/start_context/`:
   - a `UnitSource` over the three instruction roots, with owners checked against the component authority model
     (through the same reader the host already uses for `fgos authority model`);
   - a `FactRegistry` that reads the live values (executor ids from config, personas through the agent-definition
     layers that `fgos agents list` reads, `apps/fgos/src/wiring/agents.rs`, domains from `domains/*`, workflows and
     stages from the domain workflow files);
   - a `RecordSink` that writes one Observe record of kind `start-context` through `RecordDoor`. Declare the kind in
     the crate's own kinds file and inject it at `apps/fgos/src/wiring/observe_declarations.rs`. No JSONL of its own
     (L1, L3: Observe's shard is the truth).
8. Add the door `fgos internal start-context compose --input -`: a JSON `StartRequest` goes in on stdin, and a JSON
   `StartContext` comes out, or a `Refusal` with a non-zero exit. Register it in the routing table and the command
   manifest and routes.

## Verify

- `cargo test -p fgos-agent-start-context` passes. This covers the schema vectors from phase 2, one test per refusal,
  the order and budget, and a failing contributor that is left out and recorded.
- `cargo test -p fgos --test start_context` passes: the door round-trips one vector and writes one record
  of kind `start-context` in Observe's record store.
- `fgos authority render --check` passes, and `node scripts/run-tests.mjs test/architecture.test.mjs` passes.

## Rollback

Revert the commits. Nothing calls the crate yet; the model rows and rendered views revert with them.
