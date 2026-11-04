---
title: "HARDEN T4 sub-plan: Run Supervisor + Launch gate"
description: "Step 4 of the HARDEN per-layer loop for T4: the accepted council findings and owner decision 59 split into eight sub-phases with strict file ownership, net size below zero, self-landing on fg-server2 and a Vietnamese owner-machine guide."
status: in-progress
priority: P1
effort: ~6d lead time (wave 1 P01 ∥ P02 ∥ P03 ≈ 1.5d, wave 2 P04 ∥ P05 ≈ 1.5d, P06 ≈ 1d, P07 ≈ 1d after OQ-1/OQ-2, P08 ≈ 1d)
branch: main (plan only; each phase runs on its own track branch `harden/t4-pNN-<slug>` in its own linked worktree)
tags: [harden, run-supervisor, launch-gate, adopt, doctor, tests, rust]
blockedBy: []
blocks: [261021-1118-harden-low-layers-bottom-up]
created: 2026-11-03
---

# HARDEN T4 sub-plan: Run Supervisor + Launch gate

Main `fcd42ecdc` (2026-11-03 13:47 Asia/Saigon, fg-server2). Every `file:line` below was re-read on this commit; line numbers moved since the seat reports, so the phase files cite the lines read here. This is step 4 of [the per-layer loop](../261021-1118-harden-low-layers-bottom-up/plan.md#the-per-layer-loop) for [layer phase 05](../261021-1118-harden-low-layers-bottom-up/phase-05-t4-run-supervisor-launch-gate.md). Inputs: the [arbitration](../reports/council-261103-1249-harden-t4-arbitration.md) (§2 target shapes, §3 accepted, §4 rejected and routed, §5 net size, §6 owner ask), owner decisions 58 and 59 in the [HARDEN plan](../261021-1118-harden-low-layers-bottom-up/plan.md), the four seats ([correctness](../reports/council-261103-1233-harden-t4-seat-correctness.md), [speed](../reports/council-261103-1233-harden-t4-seat-speed.md), [simplicity](../reports/council-261103-1233-harden-t4-seat-simplicity.md), [red-team](../reports/council-261103-1233-harden-t4-seat-redteam.md)) and the [baseline](../reports/research-261103-1212-harden-t4-baseline.md). Where a seat and the arbitration differ, the arbitration wins. This plan reopens no decision; two gaps it found are owner questions (OQ-1, OQ-2).

## Outcome

When T4 closes, the Rust crate decides every attempt question after the handover, including the provider verdict at a deadline stop and the close of an attempt that never got an envelope. Node decides nothing about the receipt outcome or the attempt lifecycle. Each duplicate door inside the crate is folded into the one that already exists. The legacy sweep, the non-supervised branch and the `http` adapter are gone. Doctor keeps 4 rows for the layer. The layer is smaller (net size below zero) and lands on fg-server2 phase by phase; the owner machine follows a Vietnamese guide.

## Target shapes (approved, decision 59 answer 1a)

Not copied here. Read [arbitration §2](../reports/council-261103-1249-harden-t4-arbitration.md#2-part-a-target-shapes-for-owner-approval). Measurable parts used as acceptance criteria below: Node `src/run-supervisor` ≤ 1 150 lines outside `steps/` (1 192 today, 1 493 with `steps/`); the gate parses argv through `route::Flags`, verifies through `envelope::read_verified`, reads process relations through T0 `facts`; every read of an agent-writable path goes through one bounded, no-follow, non-blocking reader; doctor rows 8 → 5 → 4.

## Already landed on main (excluded from the phases)

Each verified with `git show --stat <hash>` on `fcd42ecdc`; all are ancestors of main.

| Hash | Finding | What it did | Files |
|---|---|---|---|
| `882d84fb6` | RT4-01 (+ gate half of S11) | gate reads the outbox through `FsOutbox`; FIFO no longer disables the ceiling | `gate/unix.rs`, `supervise_terminal_fake_herdr.rs` |
| `9c83096bf` | B-2 | no GO written → receipt `abandoned-not-started` | `supervise.rs`, `supervise/terminal.rs`, `supervise_lifecycle.rs` |
| `4514a930f` | RT4-02 | settle reads claim, report, capture tail through one bounded no-follow non-blocking opener; adopt route timeout derived | `proof-helpers.mjs`, `settlement.mjs`, `settle-attempt.mjs`, `client.mjs`, `direct-launch.mjs`, `protocol.mjs` |
| `5443ba3c7` | RT4-07 | `finalize-home` removes the side file | `steps/finalize-home.mjs` |
| `ec76cee0e` | RT4-03 | a step dies with its supervisor (Linux) | `steps.rs`, `steps_runner.rs` |
| `0f8f0a13b` | B-7 = RT4-10 | socket check lists the directory before `/proc/net/unix` | `run-supervisor-checks.mjs` |
| `37a1aa794` | B-9 = RT4-13 | `kill_all` retried each tick, terminal wait bounded | `supervise.rs`, `supervise/terminal.rs` |
| `5f7d4c54d` | S10 (not S9) | dead-field warnings gated with `cfg(unix)` | `gate.rs`, `supervise.rs`, `supervise/terminal.rs` |

Also done by the big lead (decision 59, question 2a, 13:46): 502 side files of closed attempts deleted on fg-server2.

## Phase landings

| Phase | Main commits | Landed |
|---|---|---|
| P03 gate one door | `fa9e84c1c..8e0f53264` | 2026-11-03 14:36 |
| P02 one outcome authority | `0c1e509e2..231c91f51` | 2026-11-03 |
| P05 controller side | `864a390fd..23740e065`, `fab7438dd` | 2026-11-03 15:06 |
| P04 one watch step, hostile reads | `fad7e0fab` | 2026-11-03 15:33 |
| P01 adopt custody, sweep into client, doctor 8 → 5 | `3a940e2a8` (with the `sweep.mjs` manifest row and the doctor list in `packaging-distribution` spec and contract, DOC agreed 2026-11-04) | 2026-11-04 16:21 |
| P06 test structure | `4e86aec63` ([report](../reports/lead-261104-1620-harden-t4-p06-test-structure.md)); with `1dc20857b`, the `agent-confinement` spec line P01 left pointing at `sweep.mjs` | 2026-11-04 16:49 |
| P07 not-started close, legacy sweep deleted | `7b82bf9b2`, `b6f9a545c` ([report](../reports/lead-261104-1651-harden-t4-p07-not-started-close.md)); accepted deviation: the intent is replaced under the lock on each launch and removed when a run settles with no envelope; accepted limits: a kill between the run record and the lock, a home made before its finalization record | 2026-11-04 17:33 |
| P08 | open; [owner-machine guide](../reports/guide-261104-1651-owner-machine-harden-t4-run-supervisor.md) drafted | — |

Outside the phases, from this plan's work: `c37d76811` workspace rustfmt (decision 60); two regressions it caused, fixed: `45e07caf2` (one-door scanner read only one-line chains) and `b6260e061` (machine-private test read `herdr.rs` with a one-line regex).

## Where each accepted item goes

| Item (arbitration §3 / decision 59) | Phase |
|---|---|
| B-1 Windows adopt refuses while the gate lives; RT4-06 adopt judges the agent tuple on best-effort drivers | [P01](phase-01-adopt-custody-and-doctor-fold.md) |
| S14 sweep folds into `client.mjs`; doctor 8 → 5 rows (arbitration §2); 3b release-gone warns; contract `lock-scan` (B-12 contract part) | P01 |
| S1 + RT4 answer 4: deadline-stop verdict in `receipt.reason`, delete screen judging, screen glue and settlement's re-judge; direct `classify` wired (layer received item, decision 30); S11/RT4-09 Node half | [P02](phase-02-outcome-authority.md) |
| S2, S3, S5 (gate half), S9, B-8, B-10, speed B-6 (`gate_pid1`) | [P03](phase-03-gate-one-door.md) |
| S4, S5 (supervisor half), S6, S13, 5a/RT4-08, speed B-6 (30 s wait), hostile-input reads in the supervisor (planner finding RT-P7) | [P04](phase-04-supervisor-folds-and-pane-sampling.md) |
| B-4, B-5 = RT4-04, S7, S12, 4a non-supervised branch + `http` adapter | [P05](phase-05-controller-side-and-unsupervised-branch.md) |
| Tests: Node crash-matrix retirement (one wiring row kept), `crash-matrix-adopt-resume` collapse, one wait helper | [P06](phase-06-test-structure.md) |
| 2a: adopt closes a lock-without-envelope attempt `abandoned-not-started`, its home finalized by `finalize-home`; legacy sweep, row and fix deleted; doctor 5 → 4 | [P07](phase-07-not-started-close-and-legacy-deletion.md) (gated on OQ-1, OQ-2) |
| 1a shapes into the spec; B-12 spec drift; every spec line the phases change (docs frozen); re-measure; close; landing guide | [P08](phase-08-spec-handoff-close-land.md) |

Not accepted, so no phase: B-11 (arbitration §3 does not list it; the correctness seat said B-3's rule covers it, but 3b covers only a removed release). B-13 is answered by 5a (P04) plus a spec line (P08).

## Facts this plan rests on (verified on `fcd42ecdc`)

1. **The 2a window is wider than "lock, no envelope".** `run.json` is written `status: 'running'` by the admission (`admitRunAttempt`, `assignment-runner.mjs:1282`, record field `:1315`); the attempt lock is taken at `:1807`; the envelope at `:2088` (`writeAttemptFiles`, `direct-launch.mjs:235-244`). Between them the controller awaits twice: the quarantined-account probe (`:1364`) and provider credential renewal (`:1770-1795`), both network calls. An attempt killed there has no `attempt.lock`; adopt answers `legacy-run` (`adopt.rs:111-113`); resume refuses it (`run.mjs:288-290`) and names the doctor fix. Only `legacy-sweep.mjs:83-110` settles it today (controller holder judged dead from `control/generations`). Owner answer 2a covers only the part after the lock: **OQ-1**.
2. **A not-started close has no step context without an envelope.** `run_steps` takes every step's `hostBin`, `payloadRoot`, `argv`, `env`, `stepTimeoutMs` from the envelope (`steps.rs:46`, `direct-launch.mjs:174-182`); `attempt_step.rs:23-37` refuses without a verified envelope; `settle-attempt.mjs:181,190,222-242` needs `attemptId`, `launch.capture`, `cwd`, `mode`; `finalizeAttemptHome` matches the home marker's `attemptId` (`authority.mjs:1859-1866`). The step environment rule lives only in Node (`direct-launch.mjs:141-150`). **OQ-2**.
3. **Three judges of a provider stop.** Rust adapter (`terminal/mod.rs:51-58, 297-300`), `settle-attempt.mjs:104-132` (screen regexes, timeout arm of `6035c018c` at `:128`), `settlement.mjs:636-655` (re-matches `stderrText`, into which `settle-attempt.mjs:204` glues the screen). `provider-capacity.mjs:955-981` also reads the stderr text for login vs quota and the reset time (T5, hand-off H-T4d). Direct `classify` (`direct/mod.rs:48-62`) has no caller in the crate.
4. **The non-supervised branch** is `assignment-runner.mjs:2173-2290` (after `return` of the supervised branch at `:2172`), reached only when `supervised` is false (`:1732`); `supervised` is `cli-spawn` or `herdr-spawn`, so only `http` reaches it. `rg` of `core/`, `domains/`, `.fgos/config.json`, `~/.fgos/config.json` finds no `adapter: http` and no `via: api`. `via: 'api'` exists only for `httpAdapter` (`config.mjs:650, 843-`).
5. **`docs/` is frozen** until DOC Land (board 10-26 11:05, still open at 11-03 10:35: "DOC trễ mốc 03/11"). That includes `docs/platform/run-supervisor/spec.md`, `docs/backlog.md` and `docs/architecture-manifest.json` (rows `:254` legacy-sweep, `:262` sweep). DOC allowed a manifest row deletion to land with a HARDEN batch on 10-28 18:05; each phase that deletes a `src/` file asks DOC the same way. Spec edits are a hand-off (P08).
6. **Legacy mechanism, all of it.** `legacy-sweep.mjs` (154), `run-supervisor-checks.mjs:24, 345-382`, `registrations.mjs:2083-2087, 2100`, the `abandon-legacy` intent (`recovery-planner.mjs:36, 44, 98-146, 167-170, 240-256, 423-424`; `recover.mjs:132-133, 289-298, 377`; `command-registry.mjs:1432`; `recover-actions.v1.json:12-16`). The intent is reachable only with `ctx.judgeLegacyHolders`, which only `legacy-sweep.mjs:123` passes. Read-only values that stay: `legacy-run` in adopt, `abandoned-legacy` in `unit-state.mjs:66`, `run.mjs:307`, `show-run.mjs:180`.
7. **Prior art.** `git log -S'sweepLegacy'`: `508d70005` (2026-10-18) added the sweep for pre-supervisor runs, `2f95797d5` made a unit it settled terminal; adopt got its matrix in `a177547ef` and its named start refusal in `73897596c`; no commit ever gave adopt the pre-envelope window. `16150dca1` (decision 58) made pane idle count letters only; the spec line `spec.md:148` still says `working` counts. `6035c018c` added the timeout arm the P02 move keeps.

## Big-lead decisions (2026-11-03 14:18)

- RT-P7 (hostile-input reads in the supervisor) is accepted into P04: it applies the approved Part A hostile-input rule; the lead reproduces it first.
- B-1 (Windows only) lands on the reasoned fix, proven by the extended `supervise_portable` case on Linux plus the msvc check; no Windows machine is available.
- Wave 1 (P01, P02, P03) starts now; P07 waits on OQ-1 and OQ-2 (asked 2026-11-03 14:18).

## Phases

| # | Phase | Depends on | Parallel with | Δ Node / Rust / tests (estimate) |
|---|---|---|---|---|
| 01 | [Adopt custody judges, sweep fold, doctor 8 → 5](phase-01-adopt-custody-and-doctor-fold.md) | — | 02, 03, 05 | −78 / +22 / −15 |
| 02 | [Outcome authority](phase-02-outcome-authority.md) | — | 01, 03 | −65 / +35 / +15 |
| 03 | [Gate one door](phase-03-gate-one-door.md) | — | 01, 02 | +1 / −78 / +10 |
| 04 | [Supervisor folds and pane sampling](phase-04-supervisor-folds-and-pane-sampling.md) | 01, 02, 03 | 05 | 0 / −69 / 0 |
| 05 | [Controller side and the non-supervised branch](phase-05-controller-side-and-unsupervised-branch.md) | 02, 03 | 01, 04 | −236 / 0 / −130 |
| 06 | [Test structure](phase-06-test-structure.md) | 01, 04, 05 | — | 0 / 0 / −243 |
| 07 | [Not-started close and legacy deletion](phase-07-not-started-close-and-legacy-deletion.md) | 01, 05, 06; **OQ-1, OQ-2 answered** | — | −240 / +35 / −160 |
| 08 | [Spec hand-off, re-measure, close](phase-08-spec-handoff-close-land.md) | 01–07 | — | 0 / 0 / 0 |

```
wave 1:  P01 ── P02 ── P03          (disjoint files)
wave 2:  P04 (after 01,02,03) ∥ P05 (after 02,03)
wave 3:  P06 (after 01,04,05)
wave 4:  P07 (after 01,05,06 and OQ-1/OQ-2)   ← the only owner-gated phase; nothing else waits on it
close:   P08
```

**Sum** (counting rule: Rust test code in `tests/` and `#[cfg(test)]` counts as tests): Node −618, Rust −55, tests −523, layer total ≈ −1 196 ≤ 0. Without P07: Node −378, Rust −90, tests −363, total ≈ −831 ≤ 0. Arbitration §5 said Node about −464, Rust about −15, tests about −340; this plan is larger in Node because it also deletes the `abandon-legacy` intent (L10: its only caller goes) and the `via: api` branch (L10: its only adapter goes), and smaller in Rust because the not-started close costs about +35 instead of +15 (OQ-2). Layer total ≤ 0 in every answer of OQ-1 and OQ-2.

## File ownership (no two parallel phases share a file)

`CHANGELOG.md` and `packages/git/contracts/mutation-census.v1.json` are rebase-only (whoever lands later rebases and regenerates the census with `node scripts/git-one-door-scan.mjs --write-census`). `test/suite-baseline.json` is TEST's: report retired files, never hand-edit it.

| File | Owner phase(s), in order |
|---|---|
| `packages/run-supervisor/rust/src/adopt.rs` | 01 → 07 |
| `rust/src/supervise.rs`, `rust/src/supervise/terminal.rs` | 02 → 04 |
| `rust/src/gate.rs`, `rust/src/gate/windows.rs`, `rust/src/steps.rs` | 03 |
| `rust/src/gate/unix.rs` | 03 → 04 (only the `peer_uid` copy) |
| `rust/src/go_channel.rs`, `rust/src/supervise/unix.rs`, `rust/src/supervise/windows.rs` | 04 |
| `packages/process/rust/src/facts.rs`, `platform/linux.rs`, `platform/macos.rs` | 03 (`state`) → 04 (namespace fact) |
| `packages/agent-protocol/rust/**`, `packages/agent-protocol/contracts/**` | 02 |
| `packages/run-supervisor/contracts/internal-route.run-supervisor.v1.json` | 01 |
| `contracts/receipt.v1.json` | 02 |
| `contracts/envelope.v3.json`, `recover-actions.v1.json`, `unit-state.v1.json` (+ new contract if OQ-2 a) | 07 |
| `src/run-supervisor/client.mjs`, `sweep.mjs` (delete), `gate-kill-grace.mjs` | 01 |
| `src/run-supervisor/steps/settle-attempt.mjs` | 02 → 05 (S12 only) |
| `src/run-supervisor/direct-launch.mjs` | 03 (`identityEnv`) → 05 → 07 |
| `src/run-supervisor/attempt-step.mjs`, `step-support.mjs`, `cancel-registry.mjs` | 05 |
| `src/run-supervisor/legacy-sweep.mjs` (delete) | 07 |
| `src/runner/dispatch/settlement.mjs`, `worker-artifacts.mjs` | 02 |
| `src/runner/dispatch/run-result.mjs` | 05 |
| `src/runner/dispatch/assignment-runner.mjs` | 03 (one line, `:2093`, S9) → 05 → 07 |
| `src/runner/dispatch/transport.mjs`, `config.mjs` | 05 |
| `src/runner/dispatch/recovery-planner.mjs`, `src/verbs/dispatch/recover.mjs`, `src/cli/command-registry.mjs` | 07 |
| `src/runner/execution/run.mjs` | 01 (import) → 07 (message, OQ-1 b) |
| `src/runner/loop.mjs` | 01 |
| `src/setup/run-supervisor-checks.mjs`, `src/setup/registrations.mjs` | 01 → 07 |
| Rust test `supervise_portable.rs` | 01 → 04 (heartbeat line) → 06 → 07 |
| Rust tests: `adopt_matrix.rs`, `support/adopt_fixture.rs` | 01 → 06 → 07 |
| Rust tests: `gate_*.rs` | 03 → 06 |
| Rust test `steps_runner.rs` | 03 → 05 → 06 |
| Rust tests: `supervise_lifecycle.rs`, `supervise_terminal_fake_herdr.rs` | 02 → 04 → 06 |
| Rust tests: `support/*`, `portable/*` (helpers) | 06 (others only call them) |
| `test/setup/run-supervisor-checks.test.mjs`, `test/setup/checks.test.mjs`, `test/run-supervisor/contracts*.test.mjs`, `sweep.test.mjs` | 01 → 06 (sweep) → 07 |
| `test/run-supervisor/attempt-steps.test.mjs`, `terminal-cutover.test.mjs`, `test/runner/assignment-runresult.test.mjs` | 02 → 05 |
| `test/run-supervisor/cancel-registry.test.mjs`, `direct-cutover.test.mjs`, `test/runner/dispatch*.test.mjs` (incl. `dispatch-reconciliation-import-graph.test.mjs`), `test/architecture.test.mjs` | 05 → 07 (import lists only) |
| `test/run-supervisor/direct-crash-matrix.test.mjs`, `terminal-crash-matrix.test.mjs`, `crash-matrix-adopt-resume.test.mjs` | 06 → 07 (`direct-crash-matrix` 7b only) |
| `test/run-supervisor/legacy-sweep.test.mjs` (delete), `inspect-recover-adopt.test.mjs`, `resume-adopts.test.mjs`, `test/runner/assignment-enumerator-guard.test.mjs` | 07 |
| `docs/**` | nobody before DOC Land; P08 hands the list to DOC |

## Acceptance criteria (layer)

1. Every row of "Where each accepted item goes" is done, or (P07 only) parked with its owner question named on the board.
2. `wc -l src/run-supervisor/*.mjs` (not `steps/`) ≤ 1 150 after P05; ≤ 1 000 after P07.
3. `rg -n "fn parse_args|fn report|EXIT_USAGE|EXIT_VERSION_MISMATCH" packages/run-supervisor/rust/src/gate.rs` returns nothing; `rg -n '"/proc' packages/run-supervisor/rust/src` returns nothing; `rg -n 'supervisor-heartbeat' packages src` returns nothing; `rg -n 'SCREEN_LIMIT_PATTERNS|screenSaysProviderStop|paneScreenOf' src` returns only the person-facing screen read if P02 keeps it (named in its report).
4. `rg -n "httpAdapter|'http'" src/runner/dispatch` returns nothing; `rg -n "legacy-sweep|sweepLegacy|abandon-legacy|legacy-attempts-stuck" src bin packages` returns nothing after P07 (`abandoned-legacy` read sites stay).
5. Doctor: `fgos doctor --json` on fg-server2 lists exactly `run-supervisor-route`, `runtime-socket-dir`, `run-attempts-stuck`, `run-supervisor-config` for this layer (plus `legacy-attempts-stuck` until P07); every condition of the [doctor table](#doctor-conditions-kept) is still reported by one of them; the stuck attempt of 10-19 reads as a warning naming it.
6. Every retired test names the test that now owns its behaviour (in the phase file and the commit body).
7. `cargo test --workspace` and `npm test` green on a host built from the tree at each land (big lead), msvc and aarch64-apple-darwin `cargo check` clean, `cargo clippy -D warnings` clean for the touched crates, one-door census not higher.
8. Net size of HARDEN commits ≤ 0 for the layer, measured per language in P08.
9. Rust crate test wall time ≤ 50 s (from 126–128 s; speed B-6 removes about 80 s), measured in P08 on the same machine and load class as the baseline.

### Doctor conditions kept

| Condition | Row today | Row after |
|---|---|---|
| host missing; route missing or protocol mismatch (fail) | `run-supervisor-route` | `run-supervisor-route` |
| containment `kernel` pass, `best-effort` warn (Linux) / info, none fail | `process-containment` | `run-supervisor-route` (one probe answer) |
| socket dir missing warn; type, owner, mode, orphan socket fail; fix | `runtime-socket-dir` | `runtime-socket-dir` |
| v3 attempt with lock free and no `closed.json` fail; fix adopts | `run-attempts-stuck` | `run-attempts-stuck` |
| …whose release was removed: fail today | `run-attempts-stuck` | `run-attempts-stuck`, **warn** naming the attempt (3b) |
| units awaiting resume (warn) | `units-awaiting-resume` | `run-attempts-stuck` (same adopt scan) |
| grace not an integer or < 1000 (fail) | `gate-kill-grace` | `run-supervisor-config` |
| cancel wait not an integer, < 1000 or < grace (fail) | `cancel-wait` | `run-supervisor-config` |
| legacy run settleable (fail), kept (warn); fix | `legacy-attempts-stuck` | gone with its mechanism in P07 (owner 2a) |

## Lead rules (every brief carries these)

- One Sonnet lead per phase, own linked worktree, own ext4 `CARGO_TARGET_DIR` under `~/projects/forgent-worktrees/<name>-target` (never `/tmp`), deleted when the phase lands.
- **Find the owning test before writing a new one** (design principle 8): extend the test that owns the behaviour; a new test names its behaviour and says why no test proves it; a retired test names its new owner in the phase report and the commit body.
- The phase's Delete list and Tests-to-retire list; a Δ-lines report per language (src, Rust tests, Node tests) next to this plan's estimate.
- Focused Node tests only through this one-liner (`scripts/run-tests.mjs <file>` runs the whole suite; never `npm test`), with `FGOS_HOST_BIN` naming a host built from the worktree:
  `node --input-type=module -e "import { runSelectedTests, buildTestEnv } from './scripts/run-tests.mjs'; import { ensureGitAddon } from './scripts/lib/git-addon-stage.mjs'; const env = buildTestEnv(process.env); ensureGitAddon(env); process.exitCode = runSelectedTests(process.argv.slice(1), { env }).status;" -- <test files>` (called FR below). No focused run in a worktree while a full suite runs there (it restages the addon).
- Focused Rust tests: `cargo test -p fgos-run-supervisor --test <binary>` (and `-p fgos-process`, `-p fgos-agent-protocol` where named). The big lead runs the full gates.
- `git diff --cached --stat` before every commit; explain any large deletion or empty file. Stage explicit paths.
- Every edit to a hashed file regenerates the census in the same commit. A user-visible change adds a line under `## [Unreleased]` in `CHANGELOG.md`.
- No plan ids, phase numbers or finding codes in code, tests or commit messages.
- Test-cost line in the report (H1): tests added and retired, new CLI/host spawns and their `// boundary:` reason.
- Report only what you ran yourself; report name from `fgos convention name --slug <slug> --json`, under `plans/reports/`.
- End with `Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT`.

## Landing (decision 59 answer 6a)

- **fg-server2 self-lands each phase** in a quiet window announced on the board (one line in `log.md` with the window and the branch), after the big lead's gate: rebase on main, full `npm test` and `cargo test --workspace`, msvc and darwin checks, clippy, census, `git log origin/main..HEAD` before push; then build, stage and activate the release on fg-server2 and run `fgos doctor` and one real `fgos run` smoke (direct seat; a pane seat after P02, P04, P07). WORK, TEST and ES are told before the window (landing-slot memory); OPC reviews any Git-area diff (none expected).
- **Owner machine:** one Vietnamese guide, `plans/reports/guide-<date>-harden-t4-owner-machine-landing.md` (name from `fgos convention name`), gets one section per landed phase with: the main commit, what changes for the user, the commands (pull, build/stage/activate on forgentX, mdview, mcp-skill-hub, doctor, smoke), the expected doctor rows, and the rollback (re-activate the previous release; the formats each phase adds are read-ignored by the previous release, listed per phase). The owner picks the time. Before P07's section the guide asks for a read-only `fgos doctor` on all three workspaces with the old release: `legacy-attempts-stuck` must pass with nothing kept, else run `fgos doctor --fix` with the old release first.
- **Rollback per phase:** revert the phase's merge commit on main, re-activate the previous release on fg-server2, record the revert on the board. Each phase file lists the on-disk formats it adds and whether the previous release reads them.

## Hand-offs (recorded here; not phases)

| Id | What | To | Source |
|---|---|---|---|
| H-T4a | Speed B-1: every Node step process hashes the whole native addon (185 MB debug in tests, 125–190 ms) | T9/Packaging ledger H13 and TEST | arbitration §4 |
| H-T4b | Speed B-2: confinement probe cache misses in tests; fixture sets the existing `FGOS_CONFINEMENT_ATTESTATION_STORE_PATH` | TEST | arbitration §4 |
| H-T4c | Correctness B-6: `cleanup-trust` read-modify-rename of `~/.claude.json` without a lock | T5 ([phase 06](../261021-1118-harden-low-layers-bottom-up/phase-06-t5-execution-core-dispatch-seat-run-result.md) received items) and a `docs/backlog.md` row after DOC Land | arbitration §4 |
| H-T4d | `provider-capacity.mjs:955-981` re-judges login vs quota from stderr text and parses the reset time from it; after P02 the receipt reason is the verdict; the reset-time parse for pane seats loses the screen (P02 risk) | T5 | this plan, fact 3 |
| H-T4e | `cliSpawnAdapter` (short calls) and whether short calls become `direct` attempts | T5 | arbitration §4, simplicity S17 |
| H-T4f | A pane allocated by a controller killed before its envelope is not released by any close (no endpoint record yet); unchanged from today | T2/terminal-control backlog | this plan, RT-P15 |
| H-T4g | Every `docs/` line of this layer (list in P08) | DOC, after DOC Land | docs freeze |

The big lead copies H-T4c, H-T4d, H-T4e into the T5 phase file's "Received" section and H-T4a, H-T4b to TEST on the board, the same turn this plan is accepted (owner decision 8).

## Owner questions (answered 2026-11-03 14:22, decision 60: OQ-1 (a), OQ-2 (a), fmt (a); P07 is unblocked)

### OQ-1. Who closes an attempt whose controller died before it took the attempt lock?

**Chuyện gì đang xảy ra.** Answer 2a gives adopt the attempts that have their lock and no envelope, then deletes the legacy sweep. But a controller can also die before it takes the lock, while `run.json` already says `running`. Today only the legacy sweep settles that attempt; after the deletion nothing would, and `fgos run --resume` refuses the unit for ever with a message that names a doctor fix that no longer exists.

**Nguyên nhân.** Checked on `fcd42ecdc`: `run.json` gets `status: 'running'` at admission (`assignment-runner.mjs:1282`, `:1315`), the lock comes at `:1807`, and in between the controller awaits two network calls (`:1364` quarantined-account probe, `:1770-1795` credential renewal). Without `attempt.lock` adopt answers `legacy-run` (`adopt.rs:111-113`) and resume throws `attempt-legacy-run` (`run.mjs:288-290`). The sweep closes it by judging the controller's run-control holder dead (`legacy-sweep.mjs:30-35, 83-94`). Adopt cannot judge it without a lock: a live controller in that window holds nothing adopt can probe.

**Các lựa chọn.**
- (a) The controller takes the attempt lock right after admission, before the first await (move `acquireAttemptLocks`, `:1807`, to just after `:1320`; after phase 05 every dispatch is supervised, so the lock no longer depends on `supervised` at `:1732`), so "lock, no envelope" covers the whole pre-envelope window and adopt closes it. Gain: one rule, adopt owns everything after admission, the unit then reads "awaiting resume" like every other dead-controller case. Harm: a µs gap (run record published, lock not yet taken, no await in between) is still unowned; a writing attempt holds its cwd lease during credential renewal. Cost: Node ±5 in `assignment-runner.mjs` (T5 file, HARDEN edits it), one Node edge test re-pointed.
- (b) Resume supersedes it: `assertAttemptsResumable` (`run.mjs:281-293`) already established the controller is dead; for a `legacy-run` attempt with no `attempt.lock` and no launch record it starts a new attempt instead of refusing. Gain: no reorder. Harm: the old `run.json` stays `running` until a resume; doctor no longer names it (the legacy row goes). Cost: Node +8 in `run.mjs`.
- (c) Keep the legacy sweep and its row for the pre-lock window only, delete its pre-supervisor parts. Harm: the mechanism the owner chose to delete stays, and `abandon-legacy` with it. Cost: Node −60 instead of −154.

**Khuyến nghị.** (a). It extends the door that answer 2a already chose (adopt) instead of adding a second rule elsewhere, and keeps doctor and resume uniform. The µs gap has no await, so only a kill landing on that exact instruction hits it; the phase file names it as a known limit.

**Phạm vi của câu trả lời.** A yes to (a) authorizes moving the lock acquisition in `assignment-runner.mjs` and the edge test in `direct-crash-matrix.test.mjs`; it does not authorize any change to the admission ledger or `run.json` format. (b) authorizes the `run.mjs` branch only. (c) reverses part of 2a for that window.

### OQ-2. Where does the not-started close get its step context?

**Chuyện gì đang xảy ra.** To close a lock-without-envelope attempt "with its home finalized by the existing `finalize-home` step", adopt must run Node steps, and every step's host, payload root, environment, attempt id and cwd come from the envelope, which does not exist yet.

**Nguyên nhân.** `run_steps` reads steps from the envelope (`steps.rs:46`); the `attempt-step` route refuses without a verified envelope (`attempt_step.rs:23-29`); `settle-attempt` needs `attemptId`, `launch.capture`, `cwd`, `mode` (`settle-attempt.mjs:181, 190, 222-242`); `finalizeAttemptHome` checks the home marker's `attemptId` (`authority.mjs:1864`); the step-environment rule exists only in Node (`direct-launch.mjs:141-150`).

**Các lựa chọn.**
- (a) **Attempt intent record.** Right after it takes the attempt lock the controller publishes, once, `attempt-intent.json` with `attemptId`, `unitRunId`, `runDir`, `mode`, `cwd`, the capture paths and the step list (built by the same `step()` builder `buildEnvelope` uses). Adopt, finding lock free, no envelope and an intent, publishes a v3 envelope from it (`origin: "adopt-not-started"`, no `launch.command`), then runs its ordinary path: receipt `abandoned-not-started`, the steps, `closed.json`. Gain: the controller stays the one writer of step context; no inference, no second env rule. Harm: one new file in the attempt layout. Cost: Rust about +35, Node about +15, one contract file.
- (b) **Infer and pass.** Adopt takes the attempt id from the one directory under `protected/capture/` (`prepareAttemptFiles`, `direct-launch.mjs:102-110`, runs before the home is made, `assignment-runner.mjs:1957`), the Node adopt client passes `--payload-root` and spawns adopt with the step environment, and settle falls back to `run.json`'s `cwd`. Gain: no new file. Harm: correctness rests on an ordering in another file; `attemptStepEnv` moves into `client.mjs`; adopt's own environment changes for every call. Cost: Rust about +45, Node about +25.

**Khuyến nghị.** (a): one writer, explicit contract, smaller and easier to test; the intent is written under the lock, so a reader never sees a half state.

**Phạm vi của câu trả lời.** (a) authorizes `attempt-intent.json` (contract file `attempt-intent.v1.json`), its writer in `direct-launch.mjs`/`assignment-runner.mjs`, the reader in `adopt.rs` and an `origin` field in envelope v3. It does not authorize any other new file or route. (b) authorizes the `--payload-root` flag and the `attemptStepEnv` move.

## Red-team review of this plan (planner, 2026-11-03)

Hostile pass over the draft: every cited line re-read, every delete traced to its callers, every parallel pair checked for shared files.

| Id | Finding | Sev | Disposition | Applied to |
|---|---|---|---|---|
| RT-P1 | Deleting the legacy sweep leaves the admission → lock window unowned (fact 1) | High | Accept as OQ-1; P07 gated | plan, P07 |
| RT-P2 | A not-started close has no step context without an envelope (fact 2) | High | Accept as OQ-2 | plan, P07 |
| RT-P3 | A pre-supervisor directory with `attempt.lock` and no `envelope.json` would be closed and re-settled by the new rule | Med | Accept: rule excludes a directory with `controller/commands` (the pre-supervisor launch record, `assignment-runner.mjs:1615-1620`); read-only census on both machines before P07 lands | P07, guide |
| RT-P4 | Deleting settlement's stderr re-judge loses Node wordings with no Rust vector (pi "No API key", 402 credits, `attempt-steps.test.mjs:324-333`) | Med | Accept: vector parity step before any deletion | P02 |
| RT-P5 | Direct `classify` over agent-written capture text could override an outbox result or a clean exit | Med | Accept red-team 4a constraints: last N lines, non-zero exit only, outbox wins, unknown reason defaults to `blocked` | P02 |
| RT-P6 | `docs/architecture-manifest.json` is under the frozen `docs/`; deleting `sweep.mjs`/`legacy-sweep.mjs` fails `test/architecture.test.mjs` without a row edit | Med | Accept: ask DOC per phase as on 10-28 18:05 | P01, P07 |
| RT-P7 | The supervisor still opens agent-writable capture files and `gate-exit.json` with a blocking, link-following `File::open` (`supervise.rs:76-89, 96-99, 242-259`), against the approved hostile-input rule; only best-effort drivers expose it (confined capture files are bind mounts) | Med | Accept into P04 (approved shape §2, not a new feature); lead reproduces on `linux-pgroup` first | P04 |
| RT-P8 | Splitting S9 across a gate phase and a Node phase opens a window where a stale `FGOS_PARENT_WRITER_ID` reaches the agent | Low | Accept: S9 whole in P03 | P03 |
| RT-P9 | Moving `peer_uid` to one place in one phase and deleting the other copy later breaks L10 | Low | Accept: S13 whole in P04 | P04 |
| RT-P10 | Renamed doctor rows break `test/setup/checks.test.mjs:59-66` and the doctor docs; user-visible | Med | Accept: CHANGELOG line, test list updated, docs in H-T4g | P01 |
| RT-P11 | `via: 'api'` invocations are dead once `httpAdapter` goes | Low | Accept (L10): refused by the existing unknown-`via` error, CHANGELOG line | P05 |
| RT-P12 | A retired Node test may assert something its named Rust owner does not (real step bodies, home removal) | Med | Accept: each retirement lists what the old test asserted and where the new owner asserts it; anything left keeps the test | P06 |
| RT-P13 | S12's shared reader in `direct-launch.mjs` would make the settle step import the controller module (slower, against S7) | Low | Accept: the one reader lives in `run-result.mjs`, which both already import | P05 |
| RT-P14 | `units-awaiting-resume` folded into `run-attempts-stuck` must keep "information, never a failure" | Low | Accept: the fold keeps it a warning line | P01 |
| RT-P15 | A pane allocated before the envelope is never released by a not-started close (no endpoint record) | Low | Record: unchanged from today; hand-off H-T4f | plan |
| RT-P16 | Retiring `an_idle_agent_with_unchanged_invalid_result…` loses the only wiring of `UnreadableWait` to its receipt reason | Low | Accept: keep the integration case but drive the 30 s through the existing unit clock seam if one exists; else retire and name `an_attempt_that_cannot_go_on_closes_the_captured_pane_and_names_why` for the reason/release wiring | P04 |
| RT-P17 | Seat estimate of `crash-matrix-adopt-resume` (30 tests) mixes rows and bodies; collapsing by count could drop a distinct resume branch | Med | Accept: keep one case per distinct resume branch of spec §9.1 and name the Rust owner of each dropped row | P06 |

Rejected: none. Not applied: a full test-harness merge (`support/` + `portable/`, simplicity's −400) is larger than "one wait helper" and was not accepted by the arbitration; P06 does the wait helper only.

## Validation of this plan (planner, 2026-11-03)

- **Coverage:** every arbitration §3 row and every decision 59 answer maps to one phase or to "landed" (table above). Received items of the layer phase: worker session server and hold transport settled (arbitration §2, no work); R5 → P05 (S7) and H-T4a; agent outcome wiring → P02 (including red test 8 from `129230049`, `30cb75484`, not on main); dead fields landed.
- **Landed exclusions:** the eight hashes are ancestors of main and none of their findings appears in a phase.
- **Parallel safety:** wave-1 file sets of P01, P02, P03 are disjoint (checked against the ownership table); P04 ∥ P05 share no file (`gate/unix.rs` is P04's only in wave 2; `direct-launch.mjs`, `settle-attempt.mjs` are P05's).
- **Net size:** phase estimates sum to −1 196 (−831 without P07); every phase states its own line.
- **Docs freeze:** no phase edits `docs/`; manifest rows are asked of DOC; every spec line is listed in P08.
- **Callers enumerated:** sweep (3 production callers), legacy (all sites in fact 6), `readSettledResult` (3), `attemptStepEnv` (1 production, 3 tests), `executeExecutorCli` (the non-supervised branch only within `assignment-runner.mjs`; other callers in `dispatch.mjs`, `work-dispatch.mjs`, `cli.mjs`, `prepare.mjs`, `executor-governance.mjs`, `result-ladder.mjs`, `work-compat.mjs`, `config.mjs`, `transport.mjs` stay).
- **Open:** OQ-1 and OQ-2 gate P07 only.

## Unresolved questions

1. OQ-1 and OQ-2 (above).
2. B-1 is Windows-only and has no Windows machine here: the fix lands on reasoning plus the extended portable test (cross-checked for msvc). Is that accepted as its proof, as the correctness seat asked?
3. The `cargo fmt` question of decision 59 is still open; it is not this plan's, but P03/P04 touch many Rust lines, so its answer changes the diff size.
4. DOC Land timing decides when P08's spec lines land; if DOC Land slips past T4's close, T4 closes with H-T4g open (as T0–T3 did).
