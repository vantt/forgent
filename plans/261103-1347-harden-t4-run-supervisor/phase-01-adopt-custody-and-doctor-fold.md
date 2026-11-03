---
phase: 01
title: "Adopt custody judges (B-1, RT4-06), sweep folded into the client (S14), doctor 8 → 5 with release-gone as a warning (3b), lock-scan out of the route contract"
status: pending
depends_on: []
parallel: "wave 1, with phases 02 and 03 (disjoint files)"
effort: ~1.5d
net_size: "Node −78 / Rust +22 / tests −15 (estimate)"
---

# Phase 01 — Adopt custody judges, sweep fold, doctor fold

## Context

[plan.md](plan.md) facts and ownership table; arbitration §3 rows B-1, RT4-06, S14, B-12 (contract part); arbitration §2 doctor rows; decision 59 answer 3b. Correctness seat B-1 and B-3; red-team RT4-06, RT4-11; speed B-7.

Code read on `fcd42ecdc`:
- `packages/run-supervisor/rust/src/adopt.rs:105-148` (`adopt_one`): a free lock plus an empty domain leads to `adopt_locked`; a named run dir that is not a scan goes on even when the domain is not empty (`:143-147`), and the holder-lock predecessor rule then ends the domain (`acquire(... args.kill_wait_ms)`, `:156`). On Windows the attempt lock dies with the supervisor (`supervise/windows.rs:47-48`, `take` of the lock in the supervisor process), so a live agent is killed by the next adopt (B-1). The binding carries the gate tuple (`supervise.rs:455`, field `gate`).
- `adopt.rs:128-133`: emptiness is judged from the declared domain only. On `linux-pgroup` the agent leads its own group (`gate/unix.rs:595-600`, `setsid`), so a dead gate leaves a live agent outside the domain (RT4-06). The agent tuple is published in `agent-binding.json` (`supervise.rs:492-499`, `supervise/terminal.rs:373-381`).
- `src/run-supervisor/sweep.mjs:1-24` wraps `adoptScan`; production callers `src/runner/execution/run.mjs:48,627`, `src/runner/loop.mjs:104,1317`, `src/setup/run-supervisor-checks.mjs:23,318`.
- Doctor: `src/setup/registrations.mjs:2058-2100`; checks in `src/setup/run-supervisor-checks.mjs:84-133` (route, containment: two `supervise --probe` spawns for two rows), `:260-329` (stuck; `releaseGoneReason` `:269-283` turns the removed-release case into a fail), `:331-343` and `:426-440` (two config rows over one snapshot), `:393-424` (units: one `adoptRun --probe-only` per unit).
- `packages/run-supervisor/contracts/internal-route.run-supervisor.v1.json:90-96`: `lock-scan`, a route the crate does not have (`route.rs:131`).

## Requirements

- **B-1.** A run-dir adopt (probe or not) answers `running` with reason `gate-alive` when a `supervisor-binding.json` exists and its `gate` tuple does not judge `dead` (`fgos_process::facts::judge_here`); it never reaches `acquire` then. A scan already refuses a non-empty domain and keeps doing so. The rule is portable: on Unix the gate holds the lock, so a free lock already means a dead gate, and nothing changes there. Reuse the JSON → `ProcTuple` parse that exists (`supervise/terminal.rs:309-317` `tuple_of`, or a `fgos_process` parser if one exists: check `rg -n "fn .*from_json|parse_record" packages/process/rust/src`); do not write a third.
- **RT4-06.** When the binding says `guarantee.containment: "best-effort"` and `agent-binding.json` exists, the domain is empty only when the declared domain is empty **and** the agent tuple judges `dead`; `unknown` is not empty. A run-dir adopt that has taken the lock and finds the agent alive ends it by identity (`fgos_process::control::signal_by_identity`, as `supervise/terminal.rs:596-599` already does for `LinuxPgroup`), waits at most `kill_wait_ms`, and answers `held`/`agent-alive` if it still lives; it never runs the steps over a live agent.
- **S14.** `sweepAttempts` moves into `src/run-supervisor/client.mjs` unchanged in behaviour; `sweep.mjs` is deleted; the three production callers and `test/run-supervisor/sweep.test.mjs:13,123` import it from `client.mjs`. No re-export.
- **Doctor 8 → 5** (arbitration §2; the full condition table is in [plan.md](plan.md#doctor-conditions-kept)):
  - `run-supervisor-route` keeps every condition of `process-containment`: one `supervise --probe` answer serves both (the other three routes are probed as today). Messages keep their wording and level (`kernel` pass, `best-effort` warn on Linux / info elsewhere, none fails).
  - `run-attempts-stuck` keeps its fail and fix, and absorbs the `units-awaiting-resume` warning: the units are judged from the same `adoptScan --probe-only` answer (a map from attempt dir to verdict; a closed dir needs no probe), never one spawn per unit. The units line stays a warning, never a failure.
  - **3b:** an attempt whose envelope names a removed host or payload (`releaseGoneReason`) is listed as a warning that names it; the row fails only for other stuck attempts. The remedy text says the attempt cannot be closed by adopt and why.
  - `run-supervisor-config` replaces `gate-kill-grace` and `cancel-wait`: one `readDispatchConfig` snapshot, both conditions, same messages.
  - `legacy-attempts-stuck` stays until phase 07.
  - Before renaming, `rg -n "'process-containment'|'gate-kill-grace'|'cancel-wait'|'units-awaiting-resume'" src bin test apps` lists every consumer of the old ids; each moves in this phase.
- **Contract:** `lock-scan` leaves `internal-route.run-supervisor.v1.json`; any test that reads that key moves with it.
- `CHANGELOG.md` `[Unreleased]`: doctor rows merged and renamed; an attempt whose release was removed now warns.

## Files

**Create:** none.

**Modify:**
- `packages/run-supervisor/rust/src/adopt.rs` (`adopt_one`, `domain_of` callers, `adopt_locked`)
- `packages/run-supervisor/contracts/internal-route.run-supervisor.v1.json`
- `src/run-supervisor/client.mjs` (gains `sweepAttempts`)
- `src/runner/execution/run.mjs` (import line only), `src/runner/loop.mjs` (import line only)
- `src/setup/run-supervisor-checks.mjs`, `src/setup/registrations.mjs:2058-2100`, `src/run-supervisor/gate-kill-grace.mjs` (only if one resolver serves both config conditions)
- Rust tests: `tests/supervise_portable.rs` (B-1 case in `a_supervisor_killed_midway_leaves_the_agent_running_and_adopt_settles_from_gate_exit`, `:58-102`), `tests/adopt_matrix.rs` (RT4-06 case), `tests/support/adopt_fixture.rs` (a published agent tuple, if the fixture has none)
- Node tests: `test/run-supervisor/sweep.test.mjs` (import), `test/setup/run-supervisor-checks.test.mjs`, `test/setup/checks.test.mjs:59-66` (row list), `test/run-supervisor/contracts.test.mjs` (only if it reads `lock-scan`)
- `CHANGELOG.md`, `packages/git/contracts/mutation-census.v1.json`

**Delete:** `src/run-supervisor/sweep.mjs`; its row `docs/architecture-manifest.json:262` (ask DOC on the board first, as for row 352 on 10-28 18:05; if DOC refuses, the phase waits rather than landing a red architecture test).

**Tests to retire:** in `test/setup/run-supervisor-checks.test.mjs`, the cases written against `checkProcessContainment`, `checkGateKillGrace`, `checkCancelWait` and `checkUnitsAwaitingResume` move (not copied) into the cases of `checkRunSupervisorRoute`, `checkRunSupervisorConfig` and `checkRunAttemptsStuck`; each moved case keeps its assertions. The lead lists each old title → new title in the report. No Rust test retires.

## Net size

Node: sweep fold −15, containment into route −25, config rows −20, units fold −10, 3b +4, registrations −12 → about −78. Rust: B-1 +10, RT4-06 +12 → +22. Tests: two Rust cases +25, moved doctor cases −40 → about −15.

## Steps

1. Find the owning tests first: `supervise_portable.rs:58` owns supervisor death with a live agent; `adopt_matrix.rs` owns adopt verdicts; `test/setup/run-supervisor-checks.test.mjs` owns the rows. Extend them; write no new file.
2. B-1: add the non-probe `adopt` call while the agent runs to the portable crash test (it must answer `running`/`gate-alive` and the agent must finish, `agent.done` written); make it fail on main under `#[cfg(windows)]` reasoning and pass with the rule; it also runs on Linux, where it passes before and after (record that in the report: the red is Windows-only).
3. RT4-06: an `adopt_matrix` case on a `linux-pgroup`-shaped attempt whose binding says best-effort and whose `agent-binding.json` names a live process (`sleep` child): probe answers `running`, a scan answers `running`, a run-dir adopt ends it by identity and then closes. Red on main.
4. S14 fold; run `sweep.test.mjs`, `adopt-client.test.mjs`.
5. Doctor fold and 3b; update the row list test; CHANGELOG line.
6. `lock-scan` out of the contract.
7. `cargo check --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin` for `fgos-run-supervisor`; clippy; census.

## Validation (focused; the big lead runs full gates)

- `cargo test -p fgos-run-supervisor --test supervise_portable --test adopt_matrix --test adopt_concurrency --test adopt_scan_perf`
- `cargo check -p fgos-run-supervisor --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin`; `cargo clippy -p fgos-run-supervisor --all-targets -- -D warnings`
- FR `test/setup/run-supervisor-checks.test.mjs test/setup/checks.test.mjs test/run-supervisor/sweep.test.mjs test/run-supervisor/adopt-client.test.mjs test/run-supervisor/contracts.test.mjs test/run-supervisor/inspect-recover-adopt.test.mjs`
- `rg -n "run-supervisor/sweep.mjs|'process-containment'|'gate-kill-grace'|'cancel-wait'|'units-awaiting-resume'|lock-scan" src bin apps packages test` → nothing (CHANGELOG excepted)
- `npm run fgos:dev -- doctor --json` on fg-server2: the five rows; `run-attempts-stuck` passes with a warning naming `unit-run-1792482363495-797e4401/producer/1/runs/01`.
- `node scripts/git-one-door-scan.mjs --root .` count not higher.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| B-1 cannot be run on Windows here | H × M | The rule is portable and its Linux run passes; msvc `cargo check`; the report says "Windows red not reproduced" (plan unresolved question 2). |
| A dashboard or script reads an old doctor row id | M × L | Step in Requirements: `rg` every old id; CHANGELOG names the rename. |
| `gate-alive` holds a dead attempt open when the gate tuple judges `unknown` for ever (other host, unreadable `/proc`) | L × M | `unknown` keeps it open by design (never kill a live agent); `run-attempts-stuck` lists it with the reason, so a person sees it. |
| Ending the agent by identity in a run-dir adopt kills the wrong process | L × H | Tuple judge with start time (`signal_by_identity`), the same door the terminal supervisor uses. |

## Rollback

Revert the phase merge; re-activate the previous release. No on-disk format changes (doctor rows are not stored; adopt writes the same files).

## Done when

The two Rust cases pass (RT4-06 red on main); five doctor rows with every condition kept; `sweep.mjs` gone; `lock-scan` gone from the contract; msvc and darwin checks clean; landed on fg-server2 with a guide section.

## Lead brief essentials

Delete list: `sweep.mjs`, the four separate doctor checks, `lock-scan` in the contract. Find the owning test before writing a new one. Ask DOC for the manifest row before merge. Δ-lines per language. Report the before/after doctor JSON for the five rows. All plan.md lead rules apply.
