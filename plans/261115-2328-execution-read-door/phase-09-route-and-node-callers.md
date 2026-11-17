# Phase 09: the host route speaks protocol 2 and every Node caller binds through it

Start after: 06 and 07 landed. Wave 4. Never at the same time as 05 (both edit `assignment-runner.mjs`). Rules:
[phase-lead-rules.md](phase-lead-rules.md). Facts: F1, F2, F8, F10. Worktree `erd-p09`, report slug `erd-p09-route`.
Effort: 4d.

## Context

After 06 and 07 the decisions live in `fgos-execution`, but nothing calls them. Node reaches the host through one
client (`src/seat-binding/client.mjs`, `fgos internal seat-binding --protocol 1`, route in the pure crate
`packages/seat-binding/rust/src/route.rs:28`, dispatched at `apps/fgos/src/main.rs:161-166`). D2: the route keeps its
name, moves to host wiring and speaks protocol 2; the old request shape and the crate's route module go in the same
change (L10). Node callers stay where S6a owns them (F1) and ask the route; none re-derives a binding fact.

## Requirements

1. Host: `apps/fgos/src/wiring/seat_binding.rs` serves `fgos internal seat-binding --protocol 2`, checking the protocol
   **before** the op (an old client gets the named mismatch), ops: `bind`, `explain`, `plan` (binding selectors only:
   `--for`, `--needs-soul`), `preflight` (06 Req 3), `digest` (06 Req 5), `ladder` (the `seat-binding-route` row's probe,
   which stays Node, D15). Every request carries its `runner` section (Node callers hold the run's snapshot; the native
   verbs call the crate in process, 10), so there is no config-reading branch here. It implements `Machine` and
   `ToolProbe`: PATH lookup through `fgos_process::spawn::resolve_program`, the one PATH door (`Machine::on_path` goes through it; a path with a separator is judged by its executable bit as Node does); `home_dir` maps an empty home to `None` (the crate keeps Node's reading of `Some("")`, where `~/x` becomes `/x`, pinned by a vector), the machine confinement
   backend registry (path and `FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH` override as `backend-registry.mjs:187-198`),
   herdr presence (`HERDR_ENV=1` and an existing `HERDR_SOCKET_PATH`, `run.mjs:63`), `session.pathEnv` when given, tool
   index commit and `HEAD` through `fgos-git` inspect. Every file it reads is opened no-follow beneath its root with
   `fgos-durable-file` `open_beneath` and read under a byte cap (the Rust form of the runner spec's "Hostile input,
   stated once"). `apps/fgos/src/main.rs:161-166` calls the wiring; `packages/seat-binding/rust/src/route.rs` and its
   `pub mod` go; `apps/fgos/Cargo.toml` gains `fgos-execution`. The crate's own input `protocol` stays 1.
2. Node client `src/seat-binding/client.mjs`: `PROTOCOL = 2`, the six ops; same fail-closed rules and host trust
   (`resolveSeatBindingHost` :43); a `usage`/unknown-op answer from an older host maps to `host-version-mismatch`.
3. `src/runner/execution/bind.mjs` becomes the Node facade for S6a callers: `bind`, `explainSeat` (one host call for the
   whole walk chain), `bindWorkSeat` send ask, walk, session (with `pathEnv`) and, when `ctx.accounts` is given, the
   account-state overlay that Dispatch's adapter reads per provider key of the lease document (06 Req 4); `askFor` and
   `bindingIdentity` stay. `agentCliMissingRefusal` (`unit-run-start.mjs:213-217`) and `accountQuarantineOf`
   (`account-pin.mjs:41-50`) call `preflight`, keeping their `pre-admission` timing. Known difference (inherited from
   Node, found in 06): `preflight` reads the runner as given while `bind` keys family spellings first (`family_keyed`),
   so with a family alias in `modelPolicies` (e.g. `codex:`) a pinned account's quarantine can be read on another
   pool set than the bind ranks from; decide here whether `preflight` keys the runner too (a vector for it). The replay check
   (`assignment-runner.mjs:300-314`) calls `digest` on the committed runner section before it rebinds.
   `src/runner/execution/seat-policy.mjs` is deleted.
4. `src/runner/dispatch/plan.mjs`: the binding selectors (`--for`, `--needs-soul`, the purpose seat) are the route's
   `plan` op, whose answer carries the purpose binding; the executor-id, assignment and Work-hint selectors stay in
   Node and spawn nothing, as today: a declared twin of 07's `decide.rs` for those selectors, proven by 07's vector test,
   `retiredBy: S6a` (D5). `src/runner/dispatch/mechanism.mjs` therefore stays (twin, D7).
5. `src/runner/execution/explain.mjs` keeps working through `explainSeat` until 10 deletes it.
6. Restore the transitional parity runner from history as S4 did (re-read item 5): `test/rust-host/verb-parity.test.mjs`
   (this phase is its one restorer; 10 and 11 add tables). Deleted in 12.
7. Measure host calls and wall time per `fgos run` seat, per replay and per dispatch before and after (report).
   Expected: bind unchanged (one call per bind), the explain walk chain from one call per step to one, one `preflight`
   per run start (Node computed it in process before), one `digest` per replay, no call added for bind-free dispatch
   selectors (fanout unchanged).

## Files

- Create: `apps/fgos/src/wiring/seat_binding.rs`, the transitional parity runner.
- Modify: `apps/fgos/src/main.rs` (route line), `apps/fgos/src/wiring/mod.rs`, `apps/fgos/Cargo.toml`,
  `packages/seat-binding/rust/src/lib.rs` (drop `pub mod route`), `src/seat-binding/client.mjs`,
  `src/runner/execution/bind.mjs`, `src/runner/dispatch/plan.mjs`, `src/runner/dispatch/assignment-runner.mjs` (replay
  digest only), `src/runner/execution/{unit-run-start,account-pin}.mjs`, `src/runner/dispatch/provider-capacity.mjs`
  (the overlay reader, if the existing readers do not already give it), their tests, `docs/architecture-manifest.json`
  (entries of deleted files), `test/suite-baseline.json`, mutation census.
- Delete: the herdr-first default-invocation override (`bind.mjs:166-171`; replaced by 06's explicit rule, V2), `packages/seat-binding/rust/src/route.rs`, `src/runner/execution/seat-policy.mjs`,
  `test/runner/execution/seat-policy.test.mjs`.
- Tests retired (owner now): `test/runner/execution/bind.test.mjs` decision cases -> `golden_bind.rs`, keeping one wiring
  test (facade round trip through the route) in `test/seat-binding/client.test.mjs`;
  `test/runner/execution/{bind-committed-config,tier-fallback,explain}.test.mjs` and `test/runner/{tier-cell,dispatch-execute-effort}.test.mjs`
  cases that assert ranking or provenance -> `golden_bind.rs`; `seat-policy.test.mjs` -> `golden_bind.rs` (slice and
  digest); the 29 files using `stubAgentCliDir` keep working through `pathEnv`. Each retired case named in the report.
- Net size: about -600 Node lines, -500 Node test lines, +400 Rust host lines.

## Steps

1. Red: the wiring test against protocol 2. 2. Host route. 3. Client and facade. 4. `plan.mjs` binding selectors.
5. Pre-admission and replay callers. 6. Parity runner. 7. Retire tests. 8. Gates plus every test
   `rg -l "bind.mjs|seat-policy|seat-binding/client|plan.mjs" test` lists, `cargo test -p fgos -p fgos-execution -p fgos-seat-binding`,
   `apps/fgos/tests/cli_tests.rs`.

## Acceptance

- `rg -n "seatBinding\(|seatConfigOf|executorFacts|launchViewOf|accountViewOf|familyKeyed|resolvePersona" src` finds
  nothing; `fgos run` of a read-only unit and a workflow seat bind end to end on the dev host; the measurement table.

## Risks / rollback

- A process of the old payload still running after activation meets protocol 2 (H x M): it fails by name; the landing
  drains runs first (D16). Revert: the commit series; route and client revert together.
