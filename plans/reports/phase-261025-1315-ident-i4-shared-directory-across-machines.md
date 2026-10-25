---
title: "Phase 05 (I4): shared identity directory across machines"
date: 2026-10-25
lane: IDENT
plan: ../261022-1100-identity-i1-i4-project-machine-session-directory/plan.md
phase: ../261022-1100-identity-i1-i4-project-machine-session-directory/phase-05-shared-directory-across-machines.md
status: landed on three machines; two-machine proof handed off (blocked on Slice C)
---

# Phase 05 (I4): shared identity directory across machines

## Outcome

I4 is on main and runs on all three machines. `fgos identity session --role|--drop-role` publishes or removes a signed entry on the Event Store stream `project:identity`. A machine sees another machine's entry after one seal and `fgos events sync`. The live two-machine proof (spec §7) has not run yet. Each machine's real config holds keys that the config validator refuses (`gateway.port`/`gateway.token`, and on fg-server2 `runner.llmAccounts` too). As a result, every real publish prints `identity-publish-failed` and only records the role locally. The proof is handed to CFG and OPC with exact commands (below). It unblocks when Slice C is active on fg-server and fg-server2.

## What landed

- Main `6ef50e4c7` (merges `abd3658a2`). WORK approved the Event Store part on 10-25 at 01:00. The host reads `eventStore.remote` through `fgos_config::provider::effective_value`, following CFG's review.
- Stream `project:identity`, event types `identity.session-published` and `identity.session-ended`, `sealOnWrite: false` (`packages/identity/contracts/identity-event-streams.v1.json`, consumer `identity` in `consumers.v1.json`, cache `.fgos/cache/identity-directory.json`).
- Each entry is signed in its payload with the machine key from I5. Folding keeps the first key seen for a machine. Events are dropped and counted when the signature is bad (`bad-signature`), when the signer names another machine (`machine-mismatch`), or when a known machine uses a second key (`key-changed`).
- `resolve`/`list` answers for a remote entry carry `liveness: "remote"`, `machine`, `fetchedAt` (the clone's last fetch) and `pin`. `list --machine <handle|id>` filters by machine. The doctor row `identity-shared-directory` names dropped events and the machine they came from.
- A failed publish warns (`identity-publish-failed: <reason>`) and never fails the verb. The host refuses to publish while the config does not pass its schema; it does not guess `origin`.
- The test fix is on main `9c7c0adc0`. The identity CLI cases now run under an empty `HOME`, so the machine's real global config never decides a case. TEST, OPC and SEAT each saw that case red on a machine with an invalid global config.

## Proofs

| Behaviour | Owning proof | Result |
|---|---|---|
| Signed entry verifies; a bad signature is dropped | `packages/identity/rust/tests/shared.rs` `a_signed_payload_verifies_and_pins_the_machine_and_a_changed_byte_does_not` | green |
| Second key for a known machine is dropped and counted | `shared.rs` `a_second_key_for_a_known_machine_is_dropped_and_counted` (`key-changed`) | green |
| Event naming another machine than its signer is dropped | `shared.rs` `an_event_that_names_another_machine_than_its_signer_is_dropped` | green |
| Doctor names the forging machine | `test/setup/identity-checks.test.mjs:140-144` ("1 dropped (key-changed from gamma-cccccc)") | green |
| Host wiring over two real clones and a bare remote: register publishes once, unchanged re-register publishes nothing, resolve answers the other clone's session after sync | `apps/fgos/tests/cli_tests.rs` `identity_register_publishes_and_resolve_answers_a_session_of_another_machine` | green; with the invalid global config reproduced on fg-server, red before `9c7c0adc0` and 10/10 identity cases green after |
| Gates at landing | cargo workspace 1623/0 (`abd3658a2`); event-store + identity + fgos 338/0 after merging main; npm 8514 pass, 19 red, all known or load timeouts (board 10-25 10:10) | — |
| Resolve cost | `fgos identity resolve <handle> --json` on fg-server: 10-20 ms (budget 50 ms) | within budget |

## Release on each machine

| Machine | Release | Main | Who, when |
|---|---|---|---|
| `fg-server` | `sha256:8e69abc2…` | `90e88acef` | IDENT, 10-25 10:20 |
| `fg-server2` | `sha256:34d5be09…` | `38f43b6c1` | HARDEN 10:47, confirmed by OPC 11:25 |
| `design-lap` | `sha256:2145c371…` | `1c3c786c3` | SEAT, 10-25 11:35 |

Doctor on fg-server: every `identity-*` row passes. `identity-shared-directory` reads "no shared directory yet", because no machine has published an entry.

## Handed off: the two-machine proof

**Waits for:** CFG reports Slice C active on fg-server and on fg-server2. The real publish must then succeed without `identity-publish-failed`.

**Owners:** CFG, the authority for the config that unblocks the proof, runs the fg-server side and records the result. OPC, the lead on fg-server2, runs the fg-server2 side. WORK is closed, so any role held on fg-server2 serves; the commands use `lead:OPC`.

1. On fg-server2: `fgos identity session --role lead:OPC --json`. Expect no `identity-publish-failed` on stderr. Then `fgos events sync`.
2. On fg-server: `fgos events sync`, then:
   - `fgos identity resolve lead:OPC --json`
   - `fgos identity resolve <handle printed in step 1> --json`
   - `fgos identity resolve fg-server2-jdp2bv/<local id> --json`

   Expect, in all three answers, fg-server2's full id, `liveness: "remote"`, `machine.handle: "fg-server2"`, a `fetchedAt`, and `pin: "seen"`.
3. On fg-server2: `fgos identity session --drop-role lead:OPC`, then `fgos events sync`. On fg-server: `fgos events sync`, then `fgos identity resolve lead:OPC`. Expect exit 65 with `[not-found]`.
4. Post the command pairs and outputs in one board line tagged `IDENT`. If a step fails, stop and post the output. The identity component is the code to fix (`apps/fgos/src/wiring/identity_log.rs`, `packages/identity/rust/src/shared.rs`).

**Owner action after the proof:** on each machine, `fgos identity pins --confirm <machine> --fingerprint <fp>` for the other two machines, with fingerprints from the board's machine table.

## Found along the way

- The release upgrade guide runs `fgos setup`. On a release older than Slice C, setup's config merge adds the registered defaults back into `~/.fgos/config.json`. On fg-server it brought back 21 catalog keys and `terminal.layout.policy` at 10:15:57. CFG removed them again at 12:57. Slice C's setup only calls `init`, which keeps an existing file. CFG owns this.
- `ReadRequest`/`ExportRequest` now require `machine`. HARDEN moved `identity_log.rs` for that change in `08b9043e9`.

## Unresolved questions

None for IDENT. The proof's timing depends on Slice C.
