# Phase 6.2 / P06: adopt door — report

Status: DONE_WITH_CONCERNS. Phase branch `run-supervisor/p06-adopt` (a177547ef, fe6e88993) merged `--no-ff` into integration (1b071641a).

## Built
- `adopt.rs`: `--run-dir` / `--scan` / `--probe-only` / `--kill-wait-ms`. closed.json stat first; legacy-run (no attempt.lock or envelope v != 3); `probe` (LOCK_SH|NB) → running / being-adopted; lock free → domain judged (binding domain, else the declared predecessor record, else empty); `--run-dir` acquires EX via holder-lock (rule 6.0.1 ends the domain, waits kill-wait), `--scan` adopts only provably-empty ones; under EX: re-check closed, `adopting.json`, matrix, step runner, `closed.json` (closedBy adopt), marker removed before lock release.
- Matrix: receipt exists → stands; no binding → `abandoned-not-started`; binding, no gate-exit → `gate-lost` (+outboxPresent); gate-exit → receipt from it. All `synthesizedBy: adopt`. Reuses `publish_receipt_as` (supervise.rs, wrapper kept) and `run_steps`.
- `route.rs`: `Flags::parse_with_switches` (valueless flags); `parse` unchanged.
- `src/run-supervisor/client.mjs`: `adoptRun`, `adoptScan`, `listOpenAttemptDirs`, host bin resolved once via `util/host-bin.mjs`, `RunSupervisorError` (host-unavailable, host-version-mismatch, adopt-route-failed).
- Contract: added state `held` (reason predecessor-domain-not-empty) to the adopt route. Manifest row for client.mjs in `docs/architecture-manifest.json` (architecture test needs it).

## Tests (Linux, env -u CLAUDE_CODE_SESSION_ID, private target dir)
- `cargo test -p fgos-run-supervisor` full: all pass (lib 7; adopt_matrix 11; adopt_concurrency 2; adopt_scan_perf 2; envelope 2; gate_ceiling 4; gate_go 5; gate_pid1 9; gate_portable 9; steps_runner 5; supervise_crash 1; supervise_lifecycle 8). Re-run of `adopt` filter on integration after merge: green.
- `FGOS_HOST_BIN=<this branch host> node --test`: adopt-client 4/4, run-supervisor/contracts 6/6, architecture 27/27.
- clippy `--all-targets` clean; `cargo check` x86_64-pc-windows-msvc and aarch64-apple-darwin OK (one pre-existing unused-import warning in windows_job.rs).
- Perf: scan of 2000 closed attempts incl. process start = 35 ms (goal 50 ms).
- Concurrency: two adopters → one `adopted`, one `being-adopted`; 4 racers x3 rounds → exactly one winner, step ran once.
- Not run: full `npm test`, Windows/macOS CI (steps have no Windows impl yet; adopt code itself is portable, domain judged by `domain_watch`).

## Review
One Sonnet code-review round. Fixed: declared-domain-with-no-binding judged as empty (now judged from the predecessor record; test added), contract enum/indent, defensive readdir in client. Left: marker removal precedes lock release, so a concurrent probe in that instant says `running` (contract-consistent; reverse order would risk deleting a newer adopter's marker). Probe error uses state `open` (contract has no error state).

## Impact
GitNexus index stale; grep cross-check: `Flags::parse` callers only in this crate (signature unchanged), `publish_receipt` private (wrapper kept). No HIGH risk.

## Decisions
- `--run-dir` may end a leftover domain, `--scan` never does (spec rows 3 and 1.3).
- `held` added to the contract; kill wait via optional `--kill-wait-ms` (default 2000); client passes `killWaitMs`, wiring `lock.predecessorKillWaitMs` is the caller's job (P10).
- Tests must run examples built first (`cargo build -p fgos-run-supervisor --examples`), and with a phase-private target dir: the shared target's `examples/internal_harness` is overwritten across worktrees.

## Concerns / unresolved
- Process spawn (`spawn_with_fds`) was 0.5-4 s per step on a loaded machine in one run (high RLIMIT_NOFILE, 1048576 here); not reproduced later. Steps in adopt inherit that cost.
- Docs/CHANGELOG/doctor entries for adopt left to P11.
