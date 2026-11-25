# Phase 6: Join ACE: the host door, the rule set and fact values, registration, and the projection through `compose`

This is the owner's join point "ASC 6 starts after ACE 3" (2026-11-25 20:4x). Every ASC need on ACE's code passes
through here: the crate starts reading ACE's compiled set, the host wires ACE's reader and `ValueSource` into the
composer's ports, the door `fgos internal start-context compose` is added, the component is registered, and the setup
projection selects through `compose`, which removes the interim filter ACE phase 3 left behind. Phase 5 (the
producer move) runs after this phase, so the producers move straight onto a composer that already reads ACE's rules.

ASC is the only selector (ASC-D8, ACE-D2): `fgos setup` and `npm run build:skills` write AGENTS.md's fgOS block by
calling `compose` with standing facts and the file delivery, and packaging-distribution only writes the returned
blocks. Adding `when:` to units and refusing a bad key or value are ACE's (ACE-D5; ACE phases 3 and 4). The owner's
2026-11-22 scope note on this phase is answered by ACE-D5 and ASC-D9: keys are ACE's, matching is ASC's.

## Inputs

- The crate from phase 3; the spec and contracts from phase 2.
- ACE from ACE phase 3 (landed): the crate `fgos-agent-context-engine` (reader and `when_keys`, built without the
  `store` feature), `.fgos/instructions/effective/rules.json`, the host `ValueSource` and `OwnerRegistry` in
  `apps/fgos/src/wiring/context_engine/`, and `src/setup/instruction-projections.mjs` with its interim filter.
- A host door to copy: `fgos internal execution <op> --protocol 1` (`apps/fgos/src/wiring/execution_routes.rs`) and
  how internal verbs are registered (`apps/fgos/src/routing.rs`, `packages/host-runtime/contracts/command-manifest.json`,
  `command-routes.json`).
- Observe's record door: `packages/observe/rust/src/record/store/door.rs` (`RecordDoor`) and kind declarations at
  `apps/fgos/src/wiring/observe_declarations.rs`.
- Component authority spec §3.2 and §5; the answer to plan.md owner question 2 (the approval question id).

## Footprint

See the phase table in `plan.md`, row 6.

## Steps

1. Register the component: `fgos authority declare --kind component --row <row> --approved-by <q-id>` with id
   `agent-start-context`, tier 3, layer `infra`, paths `packages/agent-start-context/`, spec
   `docs/platform/agent-start-context/spec.md`. Declare each v1 contract (`--kind contract`, provider
   `agent-start-context`). Commit the rendered views as rendered. Add the area's row to `docs/reading-map.md`. Check
   that the views name ASC as the selector (ACE phase 3 recorded the three roles of ACE-D2).
2. Add `fgos-agent-context-engine` with `default-features = false` to the crate. Put the host adapters in
   `apps/fgos/src/wiring/start_context/`:
   - a `RuleSet` that reads `rules.json` (from the project, or from the activated release for fgOS-owned rules)
     through ACE's reader, which refuses a wrong version or digest; `compose` turns that into `start-rule-set-invalid`;
   - a `FactRegistry` that takes the keys from ACE's `when_keys` and the allowed values from ACE's host `ValueSource`
     (one adapter for both components, never a copy);
   - a `RecordSink` that writes one Observe record of kind `start-context` through `RecordDoor`, declared in the
     crate's kinds file and injected at `observe_declarations.rs`. No JSONL of its own (L1, L3).
3. Add the door `fgos internal start-context compose --input -`: a JSON `StartRequest` on stdin, a JSON
   `StartContext` out, or a `Refusal` with a non-zero exit. Register it in the routing table, manifest and routes.
4. Replace ACE's interim filter in `src/setup/instruction-projections.mjs`: build a `StartRequest` with standing
   facts and the file delivery, call the door, render the returned blocks into the managed block, and keep the ledger
   entry with the rule set digest from the returned context. Find the host as ACE phase 3 does (`FGOS_HOST_BIN` or the
   activated release) and fail with a named error when there is none.
5. Update `test/setup/instruction-projections.test.mjs`: it proves rendering, splicing and the ledger only; selection
   is proven by the composer's tests (design principle 8). Name the retired cases and their new owner in the commit
   body.

## Verify

- `cargo test -p fgos-agent-start-context` passes, including `start-rule-set-invalid` on a tampered digest and a
  value refused by the live `ValueSource`.
- `cargo tree -p fgos-agent-start-context` lists no `pkm-core` (ACE-D6).
- `cargo test -p fgos --test start_context` passes: the door round-trips one vector and writes one `start-context`
  record in Observe's store.
- `node scripts/run-tests.mjs test/setup test/architecture.test.mjs` and `fgos authority render --check` pass.
- `npm run build:skills` gives a byte-identical "fgOS Effective Instructions" block (`git diff --exit-code AGENTS.md`),
  and `rg -n "when" src/setup/instruction-projections.mjs` shows no filter on `when:`.

## Rollback

Revert the phase's commits. ACE's interim filter comes back, the door and adapters go, and the model rows and
rendered views revert with them. Nothing else calls the door yet (phase 5 comes after).
