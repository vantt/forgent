# Phase 2: Role bound at head start and rotation

## Context
`register_session` (`packages/run-supervisor/rust/src/supervise/terminal.rs:951-1000`) registers the head attempt's
writer under its role (`take=false`); on `role-held` it retries without the role (rotation successor); any other refusal
is one `eprintln!` and the attempt goes on. Seen 2026-11-19: Miu's `fgos questions` returned `role-not-held` right after
start. Role-gated verbs check `identity_holds` (`head_request.rs:1027-1048`).

## Requirements
1. Diagnose first: reproduce or read the evidence of today's start (supervisor stderr/attempt record, Identity records)
   and state the cause in the phase report (fresh start finding a dead or stale holder? registration error?).
2. A head attempt (one with a head id) whose role registration fails is refused by name (e.g. `head-role-not-bound`,
   detail = Identity's code) before the agent starts; `fgos head start` / `session start` report that code. A fresh
   start that finds the role held by a dead holder takes it (Identity's own liveness proof); a live holder is refused
   `head-role-held` naming it, unless this start is the rotation successor.
3. Rotation: the role move to the successor (`session rotate` / `session restore role` path) failing refuses the
   rotation by name and leaves the predecessor holding the role.
4. Tests at the lowest layer (run-supervisor crate tests): bind failure refuses start; dead holder taken; live holder
   refused; rotation successor still registers. One wiring proof at the CLI only if the code is new there.

## Constraints
Do not touch `head_request.rs` (phase 1) or `src/runner/dispatch/**`. Rust first.

## Validation
run-supervisor crate tests, clippy -D warnings, msvc check; Node head-start tests if head-start.mjs changes.
