# Phase 3: The pure composer crate and its ports

This phase builds the pure composer (ASC-D1, ASC-D5 as amended by ASC-D9) and nothing else: no host adapter, no door,
no registration. It needs only ACE phase 1's contracts, so it runs while ACE phase 3 is still being built (owner
order of 2026-11-25 20:4x: ASC joins ACE only after ACE 1, at ASC 6 after ACE 3, and at ASC 9 after the gathering).
Everything that needs ACE's code (its reader, its `ValueSource`) and every shared host file moved to phase 6, which
waits for ACE 3.

## Inputs

- `docs/platform/agent-start-context/spec.md` and `packages/agent-start-context/contracts/**`, from phase 2.
- ACE's contracts from ACE phase 1: `packages/agent-context-engine/contracts/when-keys.v1.json` (the keys and their
  value types) and `effective-rules.v1.json` (the rule-set shape, with vectors). They are read as data; this phase
  does not link ACE's crate.
- Tiers: `packages/component-authority/model/layers.yaml` (`tierNames`, tier 3) and design principle 2.

## Footprint

`packages/agent-start-context/rust/**`, `Cargo.toml`, `Cargo.lock`.

## Steps

1. Create the crate `fgos-agent-start-context` at `packages/agent-start-context/rust/` and add it to the workspace
   members. It may depend only on crates at tier 3 or below (canonical-json, yaml-doc, durable-file, and similar). It
   does not depend on `fgos-agent-context-engine` yet; phase 6 adds that dependency with `default-features = false`.
2. Types: generate them from, or check them against, the v1 schemas. That covers `StartRequest`, `Facts`
   (`FactKey`, `FactValue`), the closed `Payload` enum, `Delivery`, `StartContext`, `Block` and `Refusal`.
3. Define the ports `RuleSet` (an already verified rule set in composition order, each rule with id, owner, body and
   `when:`), `FactRegistry` (keys with their value types, and an allowed-value lookup), `RecordSink` and
   `Contributor` as traits. The crate itself does no I/O.
4. Write `compose(&StartRequest, &Ports) -> Result<StartContext, Refusal>`. It:
   - validates facts against `FactRegistry` (unknown key, value of the wrong type or not allowed, missing required
     key);
   - selects the rules whose `when:` matches, keeping the order `RuleSet` hands over (ACE resolved supersession,
     conflicts and overrides when the rules were written);
   - places the payloads unchanged;
   - calls the contributors whose `when:` matches, within their timeout and budget, and on failure leaves the block
     out and records it;
   - applies the delivery's byte budget, dropping the optional blocks with the lowest priority and recording each
     drop;
   - hands the record to `RecordSink`.
5. Tests drive `compose` through in-crate test adapters of the ports, fed by phase 2's vectors and ACE phase 1's
   `when-keys` and `effective-rules` vectors. These adapters live under `tests/` only; production adapters are
   phase 6's.

## Verify

- `cargo test -p fgos-agent-start-context` passes. This covers phase 2's vectors, one test per refusal this phase
  owns (`start-fact-unknown`, `start-fact-value-invalid`, `start-fact-missing`, `start-payload-invalid`,
  `start-delivery-unsupported`), the order and budget, and a failing contributor that is left out and recorded.
- `cargo tree -p fgos-agent-start-context` lists no `pkm-core` and no `fgos-agent-context-engine`.

## Rollback

Revert the commit. Nothing calls the crate.
