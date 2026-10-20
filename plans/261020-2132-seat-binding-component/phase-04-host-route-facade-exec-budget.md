# Phase 04: host internal route, Node facade (fail closed), measured exec budget

Owner: Sonnet lead in a worktree from the track. Size M (1d). After 01 and 02 merge; parallel with 03.

## Context

- Spec §3.3 (thin facade, fail closed [G8], exec budget), §8 step 3 (doctor confirms the route on the installed host).
- Reused, exactly: `apps/fgos/src/main.rs:154-187` internal dispatch (add a `seat-binding` arm beside `identity` :172 and `terminal-control`); `packages/session-identity/rust/src/route.rs` (`main(&[String]) -> i32`, `--protocol 1`, `EXIT_USAGE`/`EXIT_VERSION_MISMATCH`); `src/terminal-control/client.mjs:15-80` (stdin JSON, one JSON line out, host resolved once per process, `host-version-mismatch` when the route is absent, typed error class); `src/util/host-bin-path.mjs:69` `resolveActiveHostBin`; `src/util/session-identity.mjs:47-57,109,203` (refuse exec while a state lock is held).
- Phase 00 baseline: `internal identity mint-attempt` p50/p95.

## Requirements

- Route `fgos internal seat-binding <bind|ladder> --protocol 1`; request on stdin, one JSON line on stdout: `{v:1, protocol:1, op, result:"ok"|"refused"|"error", ...}`. Not in `command-routes.json` or help.
- `packages/seat-binding/rust/src/route.rs` parses, calls the pure crate, prints; no I/O beyond stdin/stdout.
- `src/seat-binding/client.mjs` (new): `bindSeat(request)`, `tierLadder()`. Errors `SeatBindingError` with codes `seat-binding-no-host-binary`, `host-version-mismatch`, `seat-binding-route-timeout`, `seat-binding-route-bad-output`, `seat-binding-in-lock`. No JS policy fallback anywhere (§13).
- Lock rule: the client refuses (`seat-binding-in-lock`) when the process holds a state lock. Reuse the Session Identity counter: export one predicate `stateLockHeld()` from `src/util/session-identity.mjs` beside `noteLockHeld`; the client calls it. (Provider lock noting is wired in 08.)
- Doctor row `seat-binding-route`: the installed host answers `ladder` with protocol 1 (registered in `src/setup/registrations.mjs` check registry per the install/setup/doctor gate).
- `docs/architecture-manifest.json`: `src/seat-binding/client.mjs` at `infra`, same as the terminal-control client; `test/architecture.test.mjs` green.
- Golden vectors: a Node test feeds `packages/seat-binding/contracts/seat-binding.golden.v1.json` through the real route and compares, so Rust and Node agree on shape.
- **Exec budget measurement** (spec §3.3, §11.4): script `scripts/measure-seat-binding-exec.mjs` (kept, rerunnable) times 100 `bind` calls of a three-seat panel request with one walk step, plus 100 `identity mint-attempt` calls, same machine, sequential; reports p50/p95 per exec and the count per seat × round × walk step. Budget stated in the report: count = `1 + walkSteps + leaseConflicts` per seat per round; per-exec p95 ≤ 2× identity p95. Fail → reversal trigger in plan.md (stop, ask S vs B, price the Node addon).

## Files

- Create: `packages/seat-binding/rust/src/route.rs`, `src/seat-binding/client.mjs`, `scripts/measure-seat-binding-exec.mjs`, `test/seat-binding/{client,golden}.test.mjs`.
- Modify: `apps/fgos/src/main.rs`, `apps/fgos/Cargo.toml`, `src/util/session-identity.mjs` (one exported predicate), `src/setup/registrations.mjs` (one row), `docs/architecture-manifest.json`.

## Steps

1. Route + Rust test of exit codes.
2. Client mirroring the terminal-control client; fail-closed tests with a fake host that lacks the route (`unknown internal route`) and one that prints garbage.
3. Golden round-trip test.
4. Doctor row + test.
5. Measure; write numbers into the phase report; big lead decides go/stop before 05.

## Tests

- Missing host, old host, timeout, bad output, in-lock: each throws the named code; no code path returns a binding without the route.
- `seat-binding-route` passes with the test host, fails with an old one.
- Exec budget numbers recorded (proof: "host exec count matches spec" first half; zero-under-lock half in 08).

## Risks / rollback

- M×H: exec cost too high. Stop point is explicit here, before any caller moves.
- Rollback: additive; revert the merge on the track.
