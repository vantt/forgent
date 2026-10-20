# Phase 04: host internal route, Node client (fail closed), measured exec budget

Owner: Sonnet lead in a worktree from the track. Size M (1d). After 01 and 02 merge, and after the pre-wave phase is on main and merged into the track (dev door resolves the working-tree host [RT-10]); parallel with 03.

## Context

- Spec `docs/specs/seat-binding.md` §4.1 (thin facade, fail closed, exec budget), §9 step 3 (doctor confirms the route on the installed host) [RT-16b].
- Reused exactly: `apps/fgos/src/main.rs:154-187` internal dispatch (arm beside `identity` :172); `packages/session-identity/rust/src/route.rs`; `src/terminal-control/client.mjs:15-80` (stdin JSON, one line out, host resolved once, `host-version-mismatch`, typed error); `src/util/host-bin-path.mjs:69` `resolveActiveHostBin`; `src/util/session-identity.mjs:47-57,109,203` (refuse exec under a state lock).
- Phase 00 baseline: `internal identity mint-attempt` p50/p95.

## Requirements

- Route `fgos internal seat-binding <bind|ladder> --protocol 1`; stdin request, one JSON line out: `{v:1, protocol:1, hostVersion, op, result:"ok"|"refused"|"error", ...}`. Not in `command-routes.json` or help.
- `packages/seat-binding/rust/src/route.rs`: parse, call the pure crate, print.
- `src/seat-binding/client.mjs` (new): `bindSeat(request)`, `tierLadder()`. `SeatBindingError` codes `seat-binding-no-host-binary`, `host-version-mismatch`, `seat-binding-route-timeout`, `seat-binding-route-bad-output`, `seat-binding-in-lock`. No JS policy fallback (spec §12).
- [RT-10] Host trust: inside an activated release the client resolves the **activation host** (`resolveActiveHostBin({ ignoreEnv: true })`); outside one (tests, dev door after the pre-wave fix) it honours `FGOS_HOST_BIN` / the dev manifest. The doctor row probes the **same** resolution. `workerBaseEnv` (`src/runner/dispatch/adapters.mjs:126-143`) strips `FGOS_HOST_BIN` so a worker cannot point the parent's next bind at another host. Every answer carries `hostVersion`, recorded in `bindingInput` (08). Explicit timeout `5_000` ms (same as `src/util/host-bin.mjs` `HOST_TIMEOUT_MS`), not the 60 s terminal-control default.
- Lock rule: the client refuses `seat-binding-in-lock` while the process holds a state lock; export one predicate `stateLockHeld()` from `src/util/session-identity.mjs` beside `noteLockHeld`. (Provider-lock noting is wired in 08.)
- Doctor row `seat-binding-route`: the resolved host answers `ladder` with protocol 1 (registry in `src/setup/registrations.mjs`).
- `docs/architecture-manifest.json`: `src/seat-binding/client.mjs` at `infra`.
- Golden round-trip: a Node test feeds `packages/seat-binding/contracts/seat-binding.golden.v1.json` through the real route.
- **Exec budget** (spec §4.1, §13) [RT-16c, RT-16e]: measured with a throwaway script under `.fgos/runtime/tmp/` (not kept in the repo); numbers go into the phase report. Request size realistic: the forgentX runner config (~22 KB) in every request. Measure per exec (p50/p95, 100 calls, three-seat panel, one walk step) against `identity mint-attempt`, and **per surface, before/after wall time**: `fgos run` panel bind, `fgos dispatch explain`, doctor dry-bind, admission preflight (launch counting), gate replay. Budget stated: count = `1 + walkSteps + leaseConflicts` per seat per round; per-exec p95 ≤ 2× identity p95; surface before/after deltas listed. Fail → reversal trigger (stop, ask S vs B; the Node addon is information for that question only).

## Files

- Create: `packages/seat-binding/rust/src/route.rs`, `src/seat-binding/client.mjs`, `test/seat-binding/{client,golden}.test.mjs`.
- Modify: `apps/fgos/src/main.rs`, `apps/fgos/Cargo.toml`, `src/util/session-identity.mjs` (one predicate), `src/runner/dispatch/adapters.mjs` (strip one env var), `src/setup/registrations.mjs` (one row), `docs/architecture-manifest.json`.

## Steps

1. Route + Rust exit-code tests.
2. Client; fail-closed tests (host without the route, garbage output, timeout, in-lock, activated release ignoring `FGOS_HOST_BIN`).
3. Golden round-trip.
4. Doctor row + test; `workerBaseEnv` strip + test.
5. Measure; report; big lead decides go/stop before 05.

## Tests

- Each failure mode throws its named code; no path returns a binding without the route.
- `seat-binding-route` passes on the test host, fails on an old one, and resolves the same binary as the client.
- Exec budget numbers recorded (first half of the "host exec count" proof; zero-under-lock in 08).

## Risks / rollback

- M×H exec cost too high: explicit stop before any caller moves. Rollback: additive; revert on the track.
