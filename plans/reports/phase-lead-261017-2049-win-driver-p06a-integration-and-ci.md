# Windows driver phase 06, section A: integration, CI, review, landing readiness

Branch `win-driver/integration`, final head `a24d58e48` (main merged twice, last at `186c257a5`).

## Verdict
Section A done. Section B (owner's 500-repeat gate) and C (landing) not run, by brief.

## Evidence

### Linux (private cargo target outside `.fgos`, `CARGO_BUILD_JOBS=4`)
- `cargo test --workspace` on `a24d58e48`: 457 pass, 0 fail.
- `cargo check -p fgos-process -p fgos-holder-lock -p fgos-distribution -p fgos -p fgctl --target x86_64-pc-windows-msvc --target aarch64-apple-darwin`: green.
- `cargo build --release -p fgos -p fgctl` from the same tree; `FGOS_HOST_BIN` = that `fgos`.
- Full `npm test` (`env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID`): 8143 tests, 8038 pass, 3 fail, 27 skipped. The 3 failures are not caused by this branch:
  - `check-decision-citation-drift` (ADR0055/ADR0003 cited without gloss in `docs/specs/platform-foundations.md:66` and `docs/specs/work-state.md:1200`): fails the same on main (`186c257a5`); both docs are identical to main.
  - `skill-wrappers` projection: `.claude/skills/instruction-audit/SKILL.md` is a gitignored generated wrapper present in the main checkout, absent in this worktree. Environment, not code.
  - `spawnWorker` output-budget kill: timing under load (other leads building); `test/runner/spawn-worker.test.mjs` 18/18 pass in isolation. The first run's `idleTimeoutMs` and `run-test-canary` overhead timing failures passed in isolation too.
- First full run (head `7d6bacbc9`) found 3 real regressions from this branch, fixed in `db4a85575`:
  - the reconcile import-graph tests did not know the lock door's `hold-transport.mjs` (child_process, events, stream); added it to the lock-door set;
  - the observe-door guard matched contact route `transport.mjs` by `endsWith`, so it flagged `hold-transport.mjs`; now matches on a path boundary.
- The suite also refuses a store modification by the run's own log file when logs sit under `.fgos`; keep logs and the cargo target outside it.

### CI (workflow `holder-lock-cross-platform.yml`)
| Head | Run | Result |
|---|---|---|
| `7d6bacbc9` | push 39038131794 | windows-latest + macos-latest crates green |
| `7d6bacbc9` | dispatch 39038136418 | crates windows + macos + stress-artifact green |
| `a24d58e48` (final) | push 39039200624 | windows-latest + macos-latest crates green |
| `a24d58e48` (final) | dispatch 39039207227 | crates windows + macos + stress-artifact (50 repeats) green |

Windows crates job includes the Node Windows facade tests (`test/holder-lock/windows-*.test.mjs`).

### Latency, final stress artifact, 50 repeats, windows-latest
| Scenario | violations | jobOpened | extra wait p50 / p95 / max (ms) | namedByOneSourceOnly |
|---|---|---|---|---|
| all-owners-dead | 0 | 0 | 11.4 / 14.0 / 18.2 | 1 |
| borrow-hook-predecessor-check | 0 | 50 | 10.6 / 12.8 / 13.7 | 0 |
| dying-job-open | 0 | 50 | 11.4 / 15.1 / 16.1 | 0 |

Warm acquire p50 about 10.7 ms. Node cold acquire+release (P03): p50 31.7 ms, p95 32.1 ms. `jobOpened` of 50/50 on `dying-job-open` is because the CI keeper-kill delay is short; the owner's machine decides the 50 % threshold.

## Review (one Sonnet `code-reviewer`, `git diff main...win-driver/integration` over holder-lock, process, `src/holder-lock`)
D2, D5, D6, D7, D8 implemented as written; four probe must-haves present in code; no handle leak or unsound unsafe found; red-team findings 1-14, 16, 18.x resolved in code (17 and 15 are plan/phase text). Findings and handling:

| # | Severity | Finding | Handling |
|---|---|---|---|
| 1 | high | `--predecessor-state` polls once against a two-quiet-round fallback, so a stale-but-empty record reads `not-empty` | fixed in `route.rs`: re-poll up to two more times while the answer is plain not-empty |
| 3 | medium | holder alive + job unopenable read as Empty, whatever the open error | fixed in `windows_job.rs`: only `ERROR_FILE_NOT_FOUND` means the job is gone; other errors stay not-empty |
| 4 | medium | `jobOpened >= 50%` was only a manual read | fixed: `dying-job-open` asserts it |
| 2 | medium | `borrow_windows` uses std `Command` (`bInheritHandles=TRUE`), so a direct Rust holder with an inheritable pipe leaks it to git and the keeper; sealing exists only inside `lock-hold` | **open**, see concerns |
| 5-9 | low | 1 ms full-snapshot poll in `empty_the_job`; fixed 2 s keeper ack; async borrow blocks the loop up to 3 s; permanent error on a transient request-file read; sibling vector covers check (c) only | **open**, not touched (no failing evidence; Windows runtime behavior cannot be reproduced here) |

The three fixes were rechecked by cargo test (457), cross-check and CI run 39039200624/39039207227.

## Gate procedure for the owner (Section B)
Machine: the Windows 10.0.26200 machine of probe runs 1-3.
1. Get the artifact `windows-predecessor-stress` from run `39039207227` (or any later dispatch of `holder-lock-cross-platform.yml` on the integration head):
   `gh run download 39039207227 -n windows-predecessor-stress -D stress-artifact`.
   It holds `windows_predecessor_stress.exe`, `fgos.exe`, `README.txt`.
2. PowerShell, in that folder, about 15 minutes:
   ```
   $env:FGOS_STRESS_FGOS_BIN = "$PWD\fgos.exe"
   $env:HL_STRESS_REPEATS = "500"
   $env:HL_STRESS_OUT = "$PWD\stress-report.json"
   .\windows_predecessor_stress.exe --ignored --test-threads=1
   ```
3. Expected: three tests (`all_owners_dead`, `borrow_hook_predecessor_check`, `dying_job_open`) print `ok`; `stress-report.json` has `repeats: 500` and `violations: 0` for each scenario; `dying-job-open` has `jobOpened >= 250` (the test itself now fails below that); per-source attribution and `namedByOneSourceOnly` are present.
4. Red: do not land; send the JSON back, fix by the owning phase (`violationDetails` names the source).
5. Green: commit the JSON as `plans/reports/evidence-<stamp>-windows-driver-stress-report.json` (name via `fgos convention path`) and add a "Stress gate" section to the integration report.

## Landing readiness (Section C, not started)
- [x] main merged into integration (`186c257a5`); `--ff-only` into main then possible.
- [x] Linux cargo (457) and npm (3 non-branch failures, listed above) done; cross-checks green; Windows and macOS CI green on the head.
- [x] Review round done, high finding fixed.
- [ ] Owner's 500-repeat gate (above).
- [ ] Before landing, merge main again if it moved; rerun cargo test and the Windows CI dispatch if Windows code changed.
- [ ] Stop-everything procedure from the 4.2 landing runbook on the three Linux workspaces; `--ff-only` into main from the main checkout; big lead pushes.
- [ ] `cargo build --release --workspace` + `scripts/build-rust-distribution.mjs`; install new `fgctl` keeping the previous one; `fgctl upgrade --from <tree>` on forgentX, mdview, mcp-skill-hub.
- [ ] Owner installs new `fgctl.exe` first (the 4.4a `fgctl` refuses on Windows), then `fgctl upgrade`; then `fgos doctor` (`lock-kernel-semantics` = `lockfileex`/`kernel`, `lock-borrow-vectors` green) and `fgos run "<read-only prompt>"` without `lock-driver-unavailable`.
- [ ] Attested fences on Windows only if v1 lock paths exist there.
- [ ] Update the 6.2 plan D7 row and this plan's status.
- Plan done criterion 6 holds today: the grep for old "unsupported on Windows" strings in `src packages scripts` is empty; `CHANGELOG.md` `[Unreleased]` already says Windows has the driver.

## Impact analysis
GitNexus index is stale (`b334695`) and mostly blind to `cfg(windows)` code, so `impact` was not run on the edited symbols (`Core::try_open`, `ContenderView::is_empty` caller, `predecessor_state` route). Blast radius checked by grep and by the cross-target check, tests and CI above.

## Concerns
- Review finding 2 (handle inheritance into git and the keeper for a direct Rust holder) is open. Node holders are sealed by `lock-hold`; the Rust holders (`fgctl`, future 6.2 supervisor) are not. Suggest closing it with a handle list on spawn before 6.2 P02 uses `run_borrowed` from a Rust supervisor.
- Low findings 5-9 are open.
- Windows runtime behavior of the three fixes is covered only by the 50-repeat CI artifact, not by the 500-repeat gate.
- The citation-drift test is red on main; not this phase's.

## Decisions made
- Private cargo target lives in `~/.cache/fgos-phase-target/wd-integration`, not `.fgos/runtime`, because the suite refuses files added to `.fgos`; the worktree's `target` link points to it.
- Fixed review findings 1, 3, 4 (real, small, testable); left 2 and 5-9 as follow-ups.
- Lock-door allowances in the reconcile closure test extended to `hold-transport.mjs` and the `events`/`stream` builtins for lock-door files only.

## Unresolved questions
- Finding 2: fix in this plan before landing, or as a follow-up item before 6.2 P02?
