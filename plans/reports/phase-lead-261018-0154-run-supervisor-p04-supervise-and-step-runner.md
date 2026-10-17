# Phase report: run-supervisor p04 — supervise route + step runner

Status: DONE_WITH_CONCERNS. Branch `run-supervisor/p04-supervise` (577087d1c, f5b797d94) merged into integration (bdb86b2c3).

## Built
- `supervise.rs`: fd 3 (+4 only when mutating) CLOEXEC; verify envelope (v3, protocolId, digest); `hostBin` realpath == current exe else exit 3 `host-version-mismatch`, nothing spawned; driver from `containment.preferred`; spawn gate (`--lock-fds 3[,4] --go-fd 5`, fd map {3,4,5}); `declare_domain` (predecessor record on `attempt.lock`) then `supervisor-binding.json`, then GO after HELLO; `agent-binding.json` on AGENT; watch: soft deadline, idle (agent-protocol adapter activity over capture deltas), `cancel-requested.json`, heartbeat 5 s; stop = `stop-requested.json` → STOP frame → SIGTERM gate by identity → `kill_all` after grace+5 s; gate exit → lease fd 4 closed at once → `receipt.json` → steps → `closed.json`.
- `steps.rs` (shared with adopt): empty fd map, env exactly `step.env`, own session, `stepTimeoutMs` kill (identity + killpg), exit 75/`retry` → no receipt, other failure → no receipt, chain stops.
- `attempt_step.rs`, `route.rs` (flags, exit codes, dispatch), `adopt.rs` stub (route registered, returns 70 `internal`: matrix is a later phase), `envelope::{read_verified, host_bin_is_current}`, `main.rs` dispatch of the four routes, `examples/internal_harness.rs` (host stand-in for tests).
- No gate-exit / no AGENT cases (big lead input): gate dies without `gate-exit.json` → receipt `gate-lost`; ceiling already past → `timeout`, no agent. Both tested, no hang.

## Tests
`cargo test -p fgos-run-supervisor -p fgos` on integration: 98 pass / 0 fail (supervise_lifecycle 8, supervise_crash 1, steps_runner 5, gate 4+5+9, envelope vectors, unit). `node --test test/rust-host/internal-routes.test.mjs test/rust-host/help-routes.test.mjs` with phase-built host: 13/13. `test/architecture.test.mjs` 27/27. `cargo check` aarch64-apple-darwin and x86_64-pc-windows-msvc clean (supervise body is unix-only; non-unix returns `unsupported-platform`).
Phase cases: 1 lifecycle, 2 supervisor SIGKILL (agent finishes exit 0, lock held until gate exits), 3 soft deadline (+ namespace members dead), 4 cancel, 5 step 75 / hang, 6 no lock fd in step, 7 lease free while step sleeps, 8 hostBin mismatch — all green.

## Decisions
- Protocol mismatch exits 3 (contract), not 4 as the brief's test line said.
- Binding is published before GO (contract), not after AGENT.
- Envelope's `bwrapPrefix` trailing `--` is stripped; driver appends `--info-fd N --`.
- Step receipt on exit 0 even with no stdout JSON (brief wording); stdout `retry`/`error` objects still honoured.
- `linux-pgroup` envelope runs with the pgroup driver directly; mismatch between envelope and machine → exit 70, no spawn.
- GitNexus impact `apps/fgos/src/main.rs:main`: LOW (entry point, 0 callers).

## Concerns (review, Sonnet)
- Step env is cleared: `attempt-step` finds node by PATH or `/usr/local/bin:/usr/bin:/bin`; controller should put PATH in `steps[].env` (envelope author's phase).
- Step receipt requires only exit 0 (contract text says "printed done"); decide in the adopt/Node-step phase.
- `payloadRoot`/`steps[].hostBin` are trusted after digest check only; no manifest verify (`verify_legacy_node`) here.
- GO-channel `read_frame` blocks on a half frame; last AGENT frame can be dropped if the gate exits within a tick; supervisor death during a step leaves that step running (idempotent steps).
- `adopt` is a stub until its phase.

## Unresolved
- Whether `adopt`'s phase also verifies step `hostBin` against the manifest.
