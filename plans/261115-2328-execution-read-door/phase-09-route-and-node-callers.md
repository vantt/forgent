# Phase 09: the host route speaks protocol 2 and every Node caller binds and decides through it

Start after: 06 and 07 landed (and 05, for the capability readers it touches). Wave 4. Rules:
[phase-lead-rules.md](phase-lead-rules.md). Facts: F1, F2, F8. Worktree `erd-p09`, report slug `erd-p09-route`.
Effort: 4d.

## Context

After 06 and 07 the decisions live in `fgos-execution`, but nothing calls them. Node reaches the host through one
client (`src/seat-binding/client.mjs`, `fgos internal seat-binding --protocol 1`, route in the pure crate
`packages/seat-binding/rust/src/route.rs:28`, dispatched at `apps/fgos/src/main.rs:161-166`). D2: the route keeps its
name, moves to host wiring, speaks protocol 2 and serves the composed answers; the old request shape and the crate's
route module go in the same change (L10). Node callers stay where S6a owns them (F1 caller list) and call the route;
none re-derives a fact the route answers.

## Requirements

1. Host: `apps/fgos/src/wiring/seat_binding.rs` serves `fgos internal seat-binding --protocol 2` with ops `bind`,
   `explain`, `plan`, `ladder` (one JSON request on stdin, one line out, the existing envelope fields `op`,
   `hostVersion`). It implements `Machine` and `ToolProbe`: PATH lookup through one existing helper (pick one of F8's
   three and name it; the others are not touched here), the machine confinement backend registry read through the
   global-directory door (file and shape as `confinement/backend-registry.mjs loadMachineBackendRegistry` reads it; the
   Node reader stays for launch, a declared twin, D7), herdr presence (`HERDR_ENV=1` and an existing
   `HERDR_SOCKET_PATH`, as `run.mjs:63`), tool index commit and `HEAD` through `fgos-git` inspect. When a request
   carries no `runner` section the adapter reads the effective one through `fgos-config` (native verbs, phase 10).
   Every file the adapter reads (backend registry, tool index metadata) is opened no-follow beneath its root with
   `fgos-durable-file` `open_beneath` and read under a byte cap (the Rust form of the runner spec's "Hostile input,
   stated once"; Node uses `readAgentFileSync`).
   `apps/fgos/src/main.rs:161-166` calls the wiring; `packages/seat-binding/rust/src/route.rs` and its `pub mod` go;
   `apps/fgos/Cargo.toml` gains `fgos-execution`.
2. Node client `src/seat-binding/client.mjs`: `PROTOCOL = 2`, ops `bind`, `explain`, `plan`, `ladder`; same fail-closed
   rules and host trust (`resolveSeatBindingHost` :43).
3. `src/runner/execution/bind.mjs` becomes the Node client facade for S6a callers: `bind`, `explainSeat`,
   `bindWorkSeat` send the ask, walk, session and, when `ctx.accounts` is given, the account-state overlay read by
   Dispatch's lease port (`provider-capacity.mjs readAccountStates`); `askFor` stays (it reads the S6a seat ledger);
   `bindingIdentity` stays (a key over a binding's fields, no decision). `agentCliMissingRefusal` and
   `accountQuarantineOf` stop re-deriving: their callers (`unit-run-start.mjs:216`, `account-pin.mjs:47`) read the
   route's answer (`bind` refusal; the account view entry the `bind`/`explain` answer carries). If a caller needs a
   fact no answer carries, extend the answer in `bind.v1.json` and 06's code; never re-derive in Node.
   `src/runner/execution/seat-policy.mjs` is deleted; `assignment-runner.mjs:309` compares the digest from the
   binding's `bindingInput` (06 Req 3).
4. `src/runner/dispatch/plan.mjs`: the decision part of `compileDispatchPlan` (selector, lookup, governance,
   mechanism, tool providers, purpose seat) is the route's `plan` op; the launch policy around it
   (`effectiveDispatchPolicy`, `launchPinOf`, invocation adapter, confinement) stays. The `plan` answer carries the
   purpose seat's binding so a dispatch makes no second host call for it. `src/runner/dispatch/mechanism.mjs` is
   deleted if `rg` finds no other caller (F2: only `plan.mjs` and `bind.mjs`).
5. `src/runner/execution/explain.mjs` keeps working through `explainSeat` until phase 10 deletes it.
6. Measure: host calls per `fgos run` seat and per dispatch before and after (report). Expectation: unchanged count
   for bind (one spawn per bind today); none added per dispatch thanks to Req 4.

## Files

- Create: `apps/fgos/src/wiring/seat_binding.rs`.
- Modify: `apps/fgos/src/main.rs` (route line), `apps/fgos/src/wiring/mod.rs`, `apps/fgos/Cargo.toml`,
  `packages/seat-binding/rust/src/lib.rs` (drop `pub mod route`), `src/seat-binding/client.mjs`,
  `src/runner/execution/bind.mjs`, `src/runner/dispatch/plan.mjs`, `src/runner/dispatch/assignment-runner.mjs` (digest
  read only), `src/runner/execution/{unit-run-start,account-pin}.mjs` (read the answer), their tests, `Cargo.lock` only
  if cargo changes it (it should not: 04 declared the deps), `docs/architecture-manifest.json` (entries of deleted
  files), `test/suite-baseline.json`, mutation census.
- Delete: `packages/seat-binding/rust/src/route.rs`, `src/runner/execution/seat-policy.mjs`,
  `src/runner/dispatch/mechanism.mjs` (if Req 4 leaves no caller), `test/runner/execution/seat-policy.test.mjs`.
- Tests retired (owner now): `test/runner/execution/bind.test.mjs` decision cases -> `golden_bind.rs`; keep one wiring
  test (Node facade round trip through the route) in `test/seat-binding/client.test.mjs`;
  `test/runner/execution/{bind-committed-config,tier-fallback}.test.mjs`, `test/runner/{tier-cell,dispatch-execute-effort}.test.mjs`
  cases that assert ranking or provenance -> `golden_bind.rs`; `seat-policy.test.mjs` -> `golden_bind.rs` (slice and
  digest); `test/runner/dispatch.test.mjs` mechanism cases -> `golden_decide.rs`. Each retired case named in the report.
- Net size: about -700 Node lines, -500 Node test lines, +350 Rust host lines.

## Steps

1. Red: the wiring test against protocol 2. 2. Host route. 3. Node client and facade. 4. `plan.mjs` split.
5. Callers of the two re-deriving helpers. 6. Retire tests. 7. Gates plus every test `rg -l "bind.mjs|seat-policy|client.mjs|plan.mjs|mechanism.mjs" test`
   lists, `cargo test -p fgos -p fgos-execution -p fgos-seat-binding`, `apps/fgos/tests/cli_tests.rs`.

## Acceptance

- `rg -n "seatBinding\(|seatConfigOf|executorFacts|launchViewOf|accountViewOf|familyKeyed|resolvePersona" src` finds
  nothing; `rg -n "decideExecutorDispatchMechanism" src` finds nothing (or only the declared twin the report names).
- `fgos run` of a read-only unit and one `workflow start` dry seat bind end to end on the dev host.

## Risks / rollback

- A Node payload of the old protocol meets the new host (H x M): the client refuses `host-version-mismatch` by name
  (existing path); the landing activates host and payload together (plan "Integration and landing").
- Behaviour drift on the run path (M x H): parity of bindings recorded before and after on the 06 vectors' configs
  through `fgos dispatch explain` and a dry bind. Revert: the commit series; the route and client revert together.
