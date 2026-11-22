# Phase 3: The crate, its ports and the host door

This phase builds the pure composer (ASC-D1, ASC-D5) and its one host door. No caller uses it yet.

## Inputs

- `docs/platform/agent-start-context/spec.md` and `packages/agent-start-context/contracts/**`, from phase 2.
- The instruction registry, whose rules the `UnitSource` adapter must match: `src/setup/instruction-registry.mjs`
  (roots, owner check, frontmatter, scope specificity) and `src/setup/instruction-composition.mjs` (authority
  order, `supersedes`/`conflicts`).
- A host door to copy: `fgos internal execution <op> --protocol 1` (`apps/fgos/src/wiring/execution_routes.rs`), and
  how internal verbs are registered (`apps/fgos/src/routing.rs`,
  `packages/host-runtime/contracts/command-manifest.json`).
- Tiering: `docs/architecture-manifest.json` and design principle 2.

## Footprint

`packages/agent-start-context/rust/**`, `Cargo.toml`, `Cargo.lock`, `apps/fgos/Cargo.toml`,
`apps/fgos/src/wiring/start_context.rs`, `apps/fgos/src/wiring/start_context/**`, `apps/fgos/src/wiring/mod.rs`,
`apps/fgos/src/routing.rs`, `apps/fgos/tests/start_context.rs`,
`packages/host-runtime/contracts/command-manifest.json`, `docs/architecture-manifest.json`.

## Steps

1. Create the crate `fgos-agent-start-context` at `packages/agent-start-context/rust/` and add it to the workspace
   members. It may depend only on crates at tier 3 or below (canonical-json, yaml-doc, durable-file, and similar).
2. Types: generate them from, or check them against, the v1 schemas. That covers `StartRequest`, `Facts`
   (`FactKey`, `FactValue`), the closed `Payload` enum, `Delivery`, `StartContext`, `Block` and `Refusal`.
3. Write `compose(&StartRequest, &Ports) -> Result<StartContext, Refusal>`. It:
   - validates facts against the registry (unknown key, invalid value, missing required key);
   - selects units whose `when:` matches;
   - orders the blocks by authority and specificity, and applies `supersedes` and `conflicts`;
   - places the payloads unchanged;
   - calls the contributors whose `when:` matches, within their timeout and budget, and on failure leaves the block
     out and records it;
   - applies the delivery's byte budget, dropping the optional blocks with the lowest priority and recording each
     drop;
   - appends the record through `RecordSink`.
4. Define the ports `UnitSource`, `FactRegistry`, `RecordSink` and `Contributor` as traits. The crate itself does no
   I/O.
5. Put the host adapters in `apps/fgos/src/wiring/start_context/`:
   - a `UnitSource` over the three instruction roots, with owners checked against the architecture manifest;
   - a `FactRegistry` that reads the live values (executor ids from config, personas through the agent-definition
     layers, domains from `domains/*`, workflows and stages from the domain workflow files);
   - a `RecordSink` that appends JSONL under the project's `.fgos/` observe area (L1, L3: truth stays in the JSONL).
     Resolve the path through the existing `.fgos` path door, never by hand.
6. Add the door `fgos internal start-context compose --input -`: a JSON `StartRequest` goes in on stdin, and a JSON
   `StartContext` or `Refusal` comes out with a non-zero exit. Register it in the routing table and the command
   manifest.
7. Declare the new crate's tier (3) wherever the manifest and spec declare Rust crate tiers.

## Verify

- `cargo test -p fgos-agent-start-context` passes. This covers the schema vectors from phase 2, one test per refusal,
  the order and budget, and a failing contributor that is left out and recorded.
- `cargo test -p fgos --test start_context` passes: the door round-trips one vector and records one line.
- `node scripts/run-tests.mjs test/architecture.test.mjs` passes.

## Rollback

Revert the commit. Nothing calls the crate yet.
