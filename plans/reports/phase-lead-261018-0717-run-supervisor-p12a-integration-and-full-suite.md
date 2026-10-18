# P12a: integration proof, full suite, T8 cli rerun

Status: DONE_WITH_CONCERNS. Section A only; nothing landed (no main merge, no release stage, no activation).
Branch `run-supervisor/p12a-integration`, based on integration tip `551a5d306` (main already contained). Commits on top:

| sha | what |
|---|---|
| `e45cf1c5b`, `6a07402af` | runner.md: run supervisor decision gets real id **D-ADR0056** (next after D-ADR0055; no local branch used it), cited with gloss so the citation-drift check passes |
| `0d0756d12` | omp logged-out wording now a login block; measured claude + omp tails recorded as fixtures |
| `ff6bcd3bf` | process-containment workflow also runs `fgos-agent-protocol` tests, path filter added |

## 1. Build and test evidence

Host binary: `cargo build -p fgos` into private `CARGO_TARGET_DIR=.fgos/runtime/phase-target`; `FGOS_HOST_BIN` pointed at it. Env `-u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID`.

| check | result |
|---|---|
| `cargo test --workspace` | exit 0, 112 result lines, 651 passed, 0 failed |
| `cargo check -p fgos-process -p fgos-run-supervisor -p fgos-agent-protocol` for `x86_64-pc-windows-msvc` and `aarch64-apple-darwin` | both exit 0 |
| `cargo test -p fgos-agent-protocol` after the omp/claude change | 7 passed |
| `test/architecture.test.mjs` | 27 pass, 0 fail (no new `src/**/*.mjs` file in this phase) |
| `npm test` (first full run, load ~14 from the parallel lane) | 8255 tests, 8136 pass, **14 fail**, 30 skipped, 75 todo, 813 s |
| criterion 5 `rg` (`startDetachedRunSupervisorProcess`, `runDetachedRunSupervisor`, `bindConfinedHomesToSupervisor`, `legacySpawn`, `useSupervisorRecovery`, `process\.send` in `src`) | empty |
| `rg reapOrphanedConfinementResources src` | definition in `cleanup.mjs`; one call site `src/run-supervisor/sweep.mjs` (the adopt door); comments in `registrations.mjs` only |

### The 14 npm test failures, one by one (each file rerun alone, same env)

| file / test | cause | rerun |
|---|---|---|
| `scripts/check-decision-citation-drift` (real repo) | **mine**: the new ADR id had no gloss in runner.md | fixed in `6a07402af`, 31/31 pass |
| `setup/skill-wrappers` (`.claude/skills/instruction-audit` missing) | worktree lacked the gitignored generated wrappers | `npm run build:skills`, 127/127 pass (git status stays clean) |
| `rust-host/fgctl-upgrade` (timeout 604 s) | known trap: `target` link pointed at main's old fgctl | repointed this worktree's link to a private release build (`cargo build --release -p fgctl -p fgos`), all 7 `fgctl-*` files pass (6+4+8+6+8+13+18 = 63); link restored afterwards |
| `run-supervisor/direct-crash-matrix` test 5 | timing under load (took 32 s at load 14, null result read) | alone 12/12 pass; test 5 alone 6/6 pass at load 15–17. Not reproduced; see concern 1 |
| `runner/spawn-worker` (3 tests), `execution/run` (2), `execution/run-herdr`, `herdr-reconciliation` (live herdr), `rust-host/observe-store-lock`, `scripts/run-test-canary` (wrapper overhead 290 ms vs 250 ms) | load from the parallel lane (timeouts, overhead medians, pane start) | all pass alone: 18/18, 68/68, 24/24, 30/30, 2/2, 24/24 |
| `state/hot-lock-host-judge` ("a host that cannot be run leaves a live pid unjudged") | **pre-existing, not this branch**: fails identically in the main checkout and in `rs-integration`; a bad `FGOS_HOST_BIN` falls through to another host on this machine, so the observe route answers `live` | 5 pass 1 fail; belongs to the 4.4b lane, not touched |

I did not rerun the whole `npm test` after the fixes; the failing files were rerun alone. If the big lead wants one green full run, do it at landing time on an idle machine.

## 2. Carry-over items

- **gate_pid1 zombie test, 20 runs under load**: `a_long_attempt_with_many_orphans_accumulates_no_zombies` 20/20 pass with 16 busy loops running (load 12.5–17.2). Not reproduced, so no change to the gate or to the test window. The one earlier failure was at load 18; the reap window in the test is 600 ms per zombie.
- **claude and omp logged-out wording, measured with an empty scratch HOME** (no real credentials touched):
  - `claude -p`: `Not logged in · Please run /login`, exit 1. Already matched ("not logged in").
  - `omp -p`: `No default model selected. Use /login, set an API key environment variable, ...`, exit 1. **Was not matched** by the adapter (the "run /login" needle differs). Fixed: `no default model selected` is now an auth-failure needle; both tails are fixture vectors.
  - **Still a gap, by name: `trust-dialog`** for claude and omp. The headless `-p` path never shows a trust dialog, so no real output could be captured; the adapters have no such reason on the direct path (`BlockedReason` is `Login` or `UsageLimit` only).
- **Placeholder ADR id**: `docs/specs/runner.md` now says D-ADR0056. The decision is **not** recorded in the state store (`fgos decision --scope ...`) and `docs/decisions/index.md` is not regenerated: that writes main's `.fgos` state. Big lead: record it and run `fgos decision-index` at landing.

## 3. T8 cli rerun (route `deepseek` + `pi-cli-bwrap-openrouter`, model `deepseek/deepseek-v4-flash`, read-only, `sleep 50` ×3, cD ×4)

cA ran through `npm run fgos:dev -- run ...`. For cB–cD see the dev-host finding below: they ran the same host binary, copied to a stable path with a manifest that is not deleted.

| case | action | result |
|---|---|---|
| cA | no kill | pass, 07:38:00→07:40:55 (~175 s); steps, `closed.json`, all files; home removed |
| cB | SIGKILL controller +25 s | agent ran to the end (~175 s); supervisor settled alone: `receipt.json`, `result.json`, `exit.json`, `evidence.json`, `steps/{settle-attempt,finalize-home}.json`, `closed.json` (`closedBy: supervisor`); home removed; inspect `settled` |
| cC | SIGTERM controller +25 s | same as cB, `T8-DONE-cC` in stdout |
| cD | SIGKILL +25 s, `--timeout 2m`, 4 sequential sleeps | attempt start 00:58:32Z, `gate-exit` 01:00:32Z = **2:00 exactly**, `stoppedBy soft-deadline`, `exitCode 143`, `timedOut true`, receipt `outcome timeout`, `failure.code execution-timeout`; no supervisor/gate/bwrap process left; home removed |

- First cD run was void: the model ran the four sleeps in parallel (72 s, exit 0). Rerun with a prompt that forces sequential commands.
- Supervisor-SIGKILL in a real run (B2): covered by crash-matrix test 3 (real bwrap, passes). Not repeated with the real model.
- `adopt --scan` over all 895 attempt dirs under the main `.fgos/assignments`: **15 ms**, 6 `closed` (this session's cases), 889 `legacy-run` (old runs, skipped by design).
- `dispatch inspect --assignment <unit>/producer/1` for cB, cC, cD and the adopted one: `inspectionStatus resolved`, `runObservation.phase settled`; no `running/bound`.
- 6 homes dated before this session remain in `/tmp/fgos-confinement` (other lanes' test runs; none from these runs).

### Finding: `fgos:dev` deletes what a surviving supervisor still needs
`scripts/run-rust-dev-host.mjs` removes its per-invocation directory (host copy + manifest) when the controller process ends. The envelope pins `hostBin` and the manifest from that directory, so after a controller kill the supervisor's `settle-attempt` step fails with `step did not start: No such file or directory` and the attempt stays open (`receipt` present, no `closed.json`). Reproduced on the first cB. `adopt --run-dir` fails the same way until the pinned paths exist; recreating those two files let adopt settle it from `gate-exit` + outbox (`adopted`, home removed, no model rerun). In an installed release the store is immutable and the files persist, so this does not affect landing, but: (a) the error text is a raw OS error, not a named one, and (b) crash tests through `fgos:dev` cannot succeed. Not changed here.

## 4. CI (big lead's runs)

`process-containment` run **39079583544**, head `551a5d306`, `run-supervisor/integration`: success on macos-latest, windows-latest, ubuntu-latest. My later commits touch `process-containment.yml` and `fgos-agent-protocol`; a new run on the final head is requested from the big lead. The Windows controller hand-over (Node controller dies, Rust supervisor settles) cannot be driven by this workflow: it runs `cargo test` only, and `fgos run` on Windows still needs the 4.4b lock driver; untested on Windows, by name.

## 5. Landing steps for the big lead (not done)

1. Merge main into `run-supervisor/integration` if it moved; merge this branch (ff). Re-run `npm test` once on an idle machine with a host built from the integration tip, plus the fgctl files from a worktree whose `target` link points at a private release build.
2. Record D-ADR0056 (`fgos decision --scope ...`), `fgos decision-index`, commit.
3. Stop everything in forgentX, mdview, mcp-skill-hub: no `fgos run`, workflow or gateway; wait for rounds to finish.
4. **With the OLD release** (still active): `fgos doctor --fix` for the credential-homes part and the reaper once, to remove every v1 home of the `cli` transport (D8). Check `/tmp/fgos-confinement` (and `FGOS_CONFINEMENT_TEMP_ROOT` if set) has no v1 marker without `paneId`.
5. ff-merge into main; build, stage, activate the three workspaces; `fgos setup </dev/null` (runtime socket dir 0700, `dispatch.gateKillGraceMs` in project config).
6. `fgos doctor </dev/null` in the three workspaces: `process-containment`, `runtime-socket-dir`, `run-attempts-stuck`, `run-supervisor-route`, `gate-kill-grace`, `lock-holders`, `active-release-matches-checkout` pass.
7. Smoke: one small `fgos run` cli in each workspace. Landing report; component-boundary already changed in P11.

### Rollback runbook
Before deactivating: with the 6.2 release run `fgos internal adopt --protocol 1 --scan < <list of run dirs>` (list `.fgos/assignments/*/*/*/runs/*`) until `run-attempts-stuck` is clean (scan of 895 dirs took 15 ms). Then revert the merge and activate the previous release. v2 homes left over: the old release ignores `contract: 2` markers (keeps them); remove by hand from the 6.2 doctor list taken before rollback. Run state written by 6.2 (`attempt.lock`, `steps/`, socket dir) is harmless to the old release.

## Concerns
1. `direct-crash-matrix` test 5 failed once at load ~14 inside the full suite (`Cannot read properties of null (reading 'outcome')`), passed 6/6 under load 15–17 and in isolation. Looks like a timing window in the test, not reproduced; keep an eye on it in the landing run.
2. `hot-lock-host-judge` fails on main too (pre-existing).
3. claude/omp `trust-dialog` wording unmeasured (see 2).
4. Windows controller hand-over untested in CI.
5. Scratch files for T8 are in `.fgos/runtime/tmp/t8-p12a/` (launch scripts, outputs, persistent host copy); the supervisor-side `.fgos/runtime/phase-target` holds the private build.

## Unresolved questions
- Should crash tests that go through `fgos:dev` keep the host directory until the supervisor ends (small change in `scripts/run-rust-dev-host.mjs`, outside this phase)? Left to the big lead.
