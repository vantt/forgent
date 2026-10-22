# Seat Binding phase 04: host route, fail-closed Node client, doctor row, exec budget

Branch `worktree-agent-a179219426b74ff4c`, from the track `seat-binding-wave` at `a287c9d79`. Nothing pushed or merged.

## 1. What landed

| Piece | File | Notes |
|---|---|---|
| Route | `packages/seat-binding/rust/src/route.rs`, arm in `apps/fgos/src/main.rs` beside `identity`, dependency in `apps/fgos/Cargo.toml` | `fgos internal seat-binding <bind\|ladder> --protocol 1`. Request: one JSON document on stdin `{v:1, input}` (`input` is the crate's `BindInput`). Answer: one JSON line `{v, protocol, hostVersion, op, result:"ok"\|"refused"\|"error", ...}`. `bind` puts the whole `BindOutput` under `output` (a refusal is a decision, `refused`); `ladder` puts the ladder under `ladder`. Exit codes: 0 decision, 2 usage, 3 version mismatch, 65 invalid request. Not in `command-routes.json` or help. `hostVersion` is the host component's `CARGO_PKG_VERSION`. |
| Client | `src/seat-binding/client.mjs` | `bindSeat(request)`, `tierLadder()`, `createSeatBindingClient({hostBin, cwd, fgosDir, payloadRoot, timeoutMs})`, `resolveSeatBindingHost(...)`, `SeatBindingError`. 5 s timeout with SIGKILL. `bindSeat` returns the crate's output plus `hostVersion`. No JS policy path exists. |
| Host trust | same file | Inside an activated release (the activation's release holds this payload: `releasePayloadRoot(activationHost)` equals this payload root) the client uses the activation host with `ignoreEnv: true`. Anywhere else (checkout, dev door, tests) the ordinary resolution applies and `FGOS_HOST_BIN` is honoured. The doctor row calls the same `resolveSeatBindingHost`. |
| Lock rule | `src/util/session-identity.mjs` | `stateLockHeld()` exported beside `noteLockHeld`; the client refuses `seat-binding-in-lock` before any exec. |
| Worker env | `src/runner/dispatch/adapters.mjs` | `workerBaseEnv` drops `FGOS_HOST_BIN`. |
| Doctor row | `src/setup/registrations.mjs` | `seat-binding-route`: the resolved host answers `ladder` at protocol 1. |
| Manifest | `docs/architecture-manifest.json` | `src/seat-binding/client.mjs` at `infra`. |
| CHANGELOG | `CHANGELOG.md` | One line under `[Unreleased]` for the doctor row and the stripped worker variable. |

Files outside the phase list that the doctor row forced: `test/setup/checks.test.mjs` (exact registered-check list) and `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md` (the data dictionary row `registrations.test.mjs` compares with the registry).

Client error codes: the five of the phase file plus one more, `seat-binding-route-rejected`, for a route answer of `result: "error"` that is not a version problem (request does not match the contract). Without it that case would have to masquerade as bad output.

## 2. Proofs

| Behaviour | Owner |
|---|---|
| Route exit codes, version mismatch, usage, invalid request, ladder answer | `route.rs` unit tests (4) |
| Every golden case through the real route | `test/seat-binding/golden.test.mjs` (79 cases, subset match plus executors, skippedReasons, explain) |
| Each client failure mode names its code (old host, other protocol, garbage, silent, wrong op, no decision, timeout, ENOENT, no host in reach, in lock with proof that nothing was exec'd, rejected request); a refusal is a result; activation host wins over `FGOS_HOST_BIN` inside an activated release; env honoured outside | `test/seat-binding/client.test.mjs` (13) |
| Doctor row passes on the test host, fails on an old one, probes the client's resolved binary | `test/seat-binding/route-doctor-check.test.mjs` (4) |
| `workerBaseEnv` strips `FGOS_HOST_BIN` | `test/runner/dispatch/worker-env-case-context.test.mjs` (one test) |

Shared test input (golden merge helper) is `test/seat-binding/golden-cases.helper.mjs`.

## 3. Exec budget

Method: throwaway scripts in the worktree's ignored `.fgos/runtime/tmp/seat-p04-measure/` (`measure.mjs`, `surfaces.mjs`), not committed. Each request carries the forgentX `runner` config as it is on disk (22 102 bytes; request 25 713 bytes, answer 4 115 bytes). 10 warm-up calls, then 100 timed calls, wall time of one `spawnSync` from Node. The baseline is `internal identity mint-attempt` measured with the same method against the same binary in the same run. Idle machine apart from the measurement.

### 3.1 Per exec, release host (the shipped build)

| Call | p50 ms | p95 ms | max ms |
|---|---|---|---|
| `identity mint-attempt` (baseline) | 2.11 | 2.51 | 3.22 |
| `seat-binding ladder` | 2.33 | 3.00 | 5.05 |
| `seat-binding bind`, 3 KB config (golden base) | 2.79 | 3.30 | 3.36 |
| `seat-binding bind`, 22 KB config, one seat | 3.71 | **4.23** | 4.56 |
| `seat-binding bind`, 22 KB config, one walk step (fault case) | 3.67 | **4.14** | 4.72 |
| all 79 golden cases with the 22 KB config, 2 passes | 3.12 | 3.59 | 3.78 |
| three-seat panel round (3 execs back to back) | 11.46 | 15.48 | 17.94 |

Budget (spec 4.1, 13): per-exec p95 at most 2x identity p95 = 2 x 2.51 = **5.02 ms**. Worst measured per-exec p95 is 4.23 ms. **Budget met on the release host** (margin 0.8 ms). Against the phase-00 baseline (p95 2.8 ms, bound 5.6 ms) it also holds.

### 3.2 Same measurement on the debug host (dev door build)

| Call | p50 ms | p95 ms |
|---|---|---|
| `identity mint-attempt` | 1.99 | 2.17 |
| `bind`, 22 KB, one seat | 5.08 | 6.76 |
| `bind`, 22 KB, one walk step | 6.10 | 7.42 |
| three-seat panel round | 16.09 | 18.75 |

An unoptimised build **does not meet** the budget (bound 4.34 ms, bind p95 6.76 ms): the bind work itself (parse 25 KB, decide, explain, encode) is the extra cost over a bare exec, and a debug build runs it about 1.4x slower. Anyone running the dev door sees about 5 to 6 ms per bind; the shipped release is the number that counts for the budget. If the owner wants the budget judged on the dev host too, this is a Shape S vs B question; I did not treat it as one because the budget is stated against the activated host.

### 3.3 Execs per seat per round

`1 + walkSteps + leaseConflicts` per seat per round (spec 4.1). A three-seat panel with no walk step and no conflict is 3 execs, about 11.5 ms p50 and 15.5 ms p95 release. A seat that walks twice and loses one lease race is 4 execs. Nothing in this phase execs under the provider lock; the client refuses in a lock (tested).

### 3.4 Per surface, before and after

The callers move to the route in later phases, so no surface can be measured "after" yet. "Before" is what exists today (`node bin/fgos.mjs ...` against the forgentX config, 10 warm runs, debug host, Node import cost included); "added" is the exec count times the release per-exec p50/p95 above.

| Surface | Before wall time | Execs added per call | Added (release p50 / p95) | Status |
|---|---|---|---|---|
| `fgos dispatch explain --for code:review` | p50 523 ms, p95 906 ms | 1 per seat explained | 3.7 / 4.2 ms per seat | before measured, after not measurable |
| `fgos dispatch decide --for judge` | p50 761 ms, p95 851 ms | 1 | 3.7 / 4.2 ms | before measured, after not measurable |
| `fgos run` panel bind (3 seats) | not measured: needs a live dispatch | 3 plus walk and lease conflicts | about 11.5 / 15.5 ms per round | not measurable here |
| doctor dry-bind | not measured: the row does not exist yet (later phase); `fgos doctor` has no per-check flag | 1 per seat of each dry-bound workflow | 3.7 / 4.2 ms per seat | not measurable here |
| admission preflight (launch counting) | not measured: no caller yet | 1 per seat | 3.7 / 4.2 ms per seat | not measurable here |
| gate replay | not measured: replay is built in a later phase | 1 per replayed seat | 3.7 / 4.2 ms per seat | not measurable here |

Reading: one added exec is under 1 percent of the existing explain and decide wall time (dominated by Node startup and imports). The larger risk is a doctor dry-bind or an explain sweep over many seats: 50 seats is about 185 ms p50 sequential. That is for the owner to weigh when those phases land; it does not breach the per-exec budget.

## 4. Verification actually run

Private target dir `/home/vantt/projects/forgentX/.fgos/runtime/tmp/seat-p04-cargo` (debug) and `seat-p04-cargo-release` (release). Node tests ran with `FGOS_HOST_BIN` pointed at the debug host and the session variables unset.

- `cargo test -p fgos-seat-binding -p fgos`: 71 passed (10 suites). Observed.
- `cargo clippy -p fgos-seat-binding -p fgos --all-targets`: no warning in the touched crates; two pre-existing warnings in `packages/git/rust` (`driver.rs:374`, `worktree.rs:670`), untouched.
- New and changed Node files alone: client 13 pass, golden 1 pass, route-doctor-check 4 pass, worker-env-case-context 4 pass, `test/setup/checks.test.mjs` 110 pass, `test/setup/registrations.test.mjs` 58 pass, `test/architecture.test.mjs` 29 pass. All observed.
- Group run (`seat-binding setup runner/dispatch terminal-control rust-host`, 80 files, `--test-concurrency=2`): see section 5.

## 5. Group run

Observed, own log file, exit 0: **1147 tests, 1145 pass, 0 fail, 0 cancelled, 2 skipped** (80 test files, 22.6 min).

How it got there, so nobody repeats it:
- A first run failed 80 tests. 74 were missing build artifacts of a fresh worktree (`target/release/fgctl`, the native addon, the built host for the dev-door suite): the group needs `cargo build --locked --release --workspace` first, which `npm test` does and a bare `node --test` does not. I built it in the private release dir and pointed the worktree's `target/release` at it (gitignored), then reran.
- Two failures were real and mine: `test/setup/checks.test.mjs` and the data dictionary comparison in `test/setup/registrations.test.mjs` both enumerate the registered doctor checks. Fixed in `test/setup/checks.test.mjs` and `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md`.
- One failure (`unsealed thresholds 599, 601 and 3601 seconds` in `test/setup/event-store-checks.test.mjs`) failed under load and passes alone (12 pass) and in the final run; a timing flake, not related to this change.
- Caution: the scratchpad directory is shared between parallel agents of this session. A group log written there by name was overwritten by another agent's run; the result above comes from a log under this worktree's own `.fgos/runtime/tmp/`.

## 6. Notes for the big lead

- The dev door (`npm run fgos:dev`) sets `FGOS_HOST_BIN` to the staged working-tree host, so inside the dev door the client honours it (the payload is not the activation's payload). That is the pre-wave behaviour working as intended.
- A worker launched through `workerBaseEnv` no longer carries `FGOS_HOST_BIN`, so it cannot steer a bind of its parent. A worker that itself needs a non-activated host (tests of nested runs) must be given one explicitly.
- The Rust crate keeps its `fgos-host-runtime` dependency from the crate phase; the route does not use it.
