# Phase lead report: holder-lock P02 — crate `fgos-holder-lock`, `flock` driver, internal routes, state root, borrow vectors

- Plan: `plans/261016-1104-holder-lock-kernel-lock-foundation/plan.md`, phase file `phase-02-holder-lock-crate-and-internal-routes.md`
- Branch `holder-lock/p02-crate-routes`, base `605d489af` (P01 on integration)
- Impact analysis: GitNexus present but the forgentX index is stale (last indexed `b334695`, before P00/P01); results cross-checked with grep. `resolve_machine_release_store_root`: MEDIUM (6 direct callers: `fgctl main`, `init.rs` x5); `execute_legacy_cli`: LOW; `fgos main`: LOW. `holds_lock_on` is not in the index; grep shows one caller (`lock_holders`). No HIGH/CRITICAL.
- Prior art (`git log -S'flock'`, `-S'FGOS_STATE_ROOT'`): only the P00/P01 commits, the design/plan docs and `tools/platform-probe` (`6449c06a3`, `ce1499664`, a measurement tool). Nothing to reuse in production code; nothing was removed earlier.

## What was built

| Piece | Where |
|---|---|
| Lock port: `acquire` (open `O_RDWR\|O_CREAT\|O_CLOEXEC`, poll `LOCK_NB` to the deadline, `fstat.ino == stat.ino` re-check, network fs refused), `release` (close only), `run_borrowed`, `probe` (`LOCK_SH\|LOCK_NB`, fresh description), `holders`, `guarantee`, `borrowed_check` | `packages/holder-lock/rust/src/port.rs` |
| Predecessor-domain rule, once in the core: record `<lock>.predecessor.json` (temp + rename), empty → proceed and delete record; not empty → `domain_kill_all` at once, wait ≤ `kill_wait_ms`; refused/timeout → `held (predecessor-domain-not-empty)` with the domain; unknown/unreadable record never deleted | `src/predecessor.rs` |
| Release rule (step 0) in `run_borrowed`: wait child; Linux: SIGKILL by identity every other process listed as holding the description, watch them die, rescan to confirm; macOS: `killpg` the child's own process group; leftover → `borrow-leftover-not-killed` with pids | `port.rs`, `driver/flock.rs` |
| Drivers: `flock` (Linux/macOS; NFS/SMB/CIFS/9p → `none`), Windows `unsupported` (no fallback) | `src/driver/{mod,flock,windows}.rs` |
| State root (one resolution, `FGOS_STATE_ROOT` pinned first) | `src/state_root.rs`; `store.rs::resolve_machine_release_store_root` delegates to it |
| Borrow vectors (4 + sibling) in temp repos with real git | `src/borrow_vectors.rs` |
| `fgos internal lock-fd\|state-root\|quiesce-scan\|lock-borrow-vectors`, first branch of `main()`, CLOEXEC on fd 3 first, protocol check first | `src/route.rs`, `apps/fgos/src/main.rs` |
| Host pins `FGOS_STATE_ROOT` for the Node payload (kept if already pinned) | `apps/fgos/src/legacy_exec.rs` |

## Decisions taken by the lead

1. **Contracts over phase-file text** where they disagree: protocol mismatch exits **3** (not 4) with `host-version-mismatch`; `quiesce-scan` takes `--root`/`--exclude-pid` (not `--workspace`/`--state-root`). P00 contracts are the accepted artifact and P03/P04 code already consumes them.
2. `Wait::Ms` polls non-blocking attempts (1→10 ms backoff) instead of a blocking `flock`: the deadline is exact and there is no signal/alarm trick.
3. On `Refused` from `domain_kill_all` the rule answers `held` at once (≤ kill wait), not after waiting it out.
4. Route `lock-fd` derives the record path from fd 3 (`/proc/self/fd/3`, macOS `F_GETPATH`) unless `--predecessor` is given; P03 passes neither.
5. Route-level multiprocess tests live in `apps/fgos/tests/internal_lock_routes.rs` (they need the real `fgos` binary via `CARGO_BIN_EXE_fgos`), not in `packages/holder-lock/rust/tests/route_leak.rs` as the file table suggested.
6. Borrow-vector sibling check runs in-process (fresh description, same kernel semantics); the cross-process sibling is covered by the route test.
7. `quiesce-scan` counts an unreadable process only when `/proc/<pid>` belongs to the caller's uid: other users' and non-dumpable processes (ssh-agent, gpg-agent show as root) would otherwise keep every scan from being clean. Matches: env `FGOS_STATE_ROOT` present → `environ`; cwd under the root or a linked worktree → `cwd`; argv naming `bin/fgos.mjs`, `fgos`, `fgos-runner`, `fgos-gateway`, `<stateRoot>/releases/...` or `--cwd <root…>` → `cmdline`. Each process also carries `root`.
8. `holds_lock_on` (fgos-process, P01) reordered: `stat` each fd first and read fdinfo only on an inode match. Same answer, ~10x fewer reads; it took the borrow vectors from 1.8 s to 0.17 s.
9. Pre-existing break fixed: `apps/fgos/tests/cli_tests.rs` was missing a `}` (since `47f21972f`, also on main), so `cargo test -p fgos` did not compile at all.
10. Tests of one binary that take locks are serialized by a mutex: a fork on a parallel test thread copies every open description until exec, so a probe right after another test's release can transiently see it held (POSIX behaviour, not a port bug).

11. Review fixes (Opus code review, no critical): H1 `buildTestEnv` (`scripts/run-tests.mjs`) drops an inherited `FGOS_STATE_ROOT`, so a suite started under fgOS cannot send `FGOS_STATE_HOME` fixtures to the real store; H2 `quiesce-scan` answers `unavailable` (exit 12) outside the initial PID namespace; M1 lock-fd contract now says the caller closes fd 3 on every non-`acquired` answer (for `held (predecessor-domain-not-empty)` the lock sits on the caller's description; P03 already closes); M2 `environ` matches no longer get a root, argv paths under a workspace match as `cmdline`; M4 `declare_domain` refused on a shared handle; M5 Linux "unlistable" is a leftover error, not success; low: the borrowing child stays unreaped (`waitid WNOWAIT`) while leftovers are ended, macOS counts group members with `proc_listpids(PROC_PGRP_ONLY)` minus the unreaped child; Windows `--borrowed-check` answers `unavailable`.

## Evidence

| # | Phase test group | Where | Result |
|---|---|---|---|
| 1 | helper exits, caller keeps lock; stranger `held` | `apps/fgos/tests/internal_lock_routes.rs` (`the_lock_stays_with_the_callers_description…`), `test/rust-host/internal-routes.test.mjs` | pass |
| 2 | two descriptions in one process | `tests/multiprocess.rs` | pass |
| 3 | holder SIGKILL → free at once | `tests/multiprocess.rs` | pass |
| 4 | `--wait-ms 300` → `timeout` (exit 11) ≥ 300 ms, nothing kept | route + crate | pass |
| 5 | stress 8 × 40, 10 holders SIGKILLed in the critical section | `tests/stress.rs` | 0 violations, 0 stuck, 0.59 s |
| 6 | no description leak after route; `run_borrowed` git hook escaper | route test (`others_holding` empty), `borrow_git.rs` | pass |
| 7 | 4 vectors + sibling; control without gc switch | `borrow_git.rs`, route `lock-borrow-vectors` | pass; control: probe `Held` with 2 background gc holders on git 2.34.1 (vector catches a real leak) |
| 8 | probe `LOCK_SH`: probes don't obstruct, EX holder → held | `multiprocess.rs`, route `--shared-try` | pass |
| 9 | state-root vectors (17 non-Windows) | `tests/state_root_vectors.rs`, route test | pass |
| 10 | predecessor-check ×50; record-stale; kill-wait-timeout (pid 1, 200 ms); release rule; no-record cost; via route | `multiprocess.rs`, `borrow_git.rs`, route test | 0/50 violations; acquire after holder death p50 0.96 ms p95 1.30 ms; stale record p50 0.026 ms p95 0.031 ms vs no record p50 0.004 ms; pid-1 domain `held` well inside the bound; setsid escaper killed before `run_borrowed` returned (~11 ms). Unkillable-holder-of-description case not buildable on a single-user machine: not measured |
| 11 | `cargo check` windows-msvc + apple-darwin | `-p fgos-process -p fgos-holder-lock -p fgos -p fgos-distribution` | clean |

- `cargo test --no-fail-fast -p fgos-process -p fgos-holder-lock -p fgos -p fgos-distribution -p fgctl`: 189 passed, 0 failed (3 consecutive green runs before the review fixes at 188, 1 run after).
- `node --test test/rust-host/*.test.mjs test/holder-lock/*.test.mjs test/scripts/run-tests.test.mjs` (release hosts built first; `FGOS_HOST_BIN` = debug host): 189 tests, 188 pass, 0 fail, 1 skipped.
- Re-run on the integration branch after the merge (`cd708ceb2`, independent tester): cargo 189 passed / 0 failed; windows-msvc + apple-darwin checks clean; node 189 tests, 188 pass, 0 fail, 1 skipped; `lock-borrow-vectors` exit 0, 185.65 ms.
- `fgos help` does not list `internal`; `command-routes.json` has no `internal` selector (JS test).
- `lock-fd --try` latency, 300 calls through the real host: **p50 1.34 ms, p95 1.58 ms**, max 2.03 ms (target ~3 ms).
- `lock-borrow-vectors` whole run: ~170-200 ms (budget 1 s).
- "S1 live probe" failure from the brief was not seen in the suites run here (full `npm test` was not run in this phase; it is P12's gate).

## Concerns

- M3 (review): a predecessor record written inside another PID namespace judges `unknown`, so the lock stays `held (predecessor-domain-not-empty)` until someone clears it. Fail-closed as the contract intends; P11's doctor (`lock-holders` / a named recovery) should show and clear it.
- `quiesce-scan` heuristics are deliberately broad (any argv path under a workspace, any process carrying `FGOS_STATE_ROOT`): the stop-everything check may refuse because of an editor or a pane with an open file; a person closes it. Unreadable processes are counted only for the caller's own uid.
- `holds_lock_on` in `fgos-process` (P01 code) was touched for speed; same answer, covered by P01's `holders_multiprocess` tests (green).
- `apps/fgos/tests/cli_tests.rs` was not compilable on main before this phase (missing `}`); fixed here, so main will see 27 more Rust tests run once this lands.
- macOS paths (`F_GETPATH`, `proc_listpids`, process-group leftovers) compile but are not run on a Mac in this phase.
- plan.md status was not touched (controller owns plan sync across parallel phases).

## Unresolved questions

None.
