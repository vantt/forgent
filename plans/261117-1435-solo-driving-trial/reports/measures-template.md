# Measure sheet template (solo driving trial)

Copy this file to each item's `reports/measures.md` and fill it. Units: minutes for times, counts for counts. Times
in Asia/Saigon, stamped with `date`. Measures 1-7 are spec §13.3 of the prototype
(`origin/plan-supervisor-prototype:plans/reports/spec-261116-1042-plan-supervisor.md`).

## Baseline (phase 1, 2026-11-17)

Filled once by phase 1; item sheets keep this section by reference only.

Taken 2026-11-17 14:43-15:03 on fg-server2 by the phase-1 session (`8e8e56bb-00a0-4158-ad04-ec29cabf8204`).

| Fact | Value |
|---|---|
| fgos | `fgos 0.2.0`, activated release `v0.2.0-rc.10` (`sha256:0a29e628daf8…`) |
| main head (origin/main) | `59708a4cf` (main checkout at `882bad7fc`, 169 commits behind) |
| prototype head | `origin/plan-supervisor-prototype` `0ca1f3856b45`, read-only worktree `forgent-worktrees/trial-proto-ro` |
| `dispatch decide --for execute` | `out-of-process`, executor `gemini`, `configured: true` |
| `runner.capabilities.code:implement.verify` | before: `current: null`. Set to `cargo test --workspace` on branch `trial/solo-phase-1` (owner Q2). Takes effect only once landed on main, because command keys are read from the main checkout only. |

Seats live today (`fgos dispatch probe-account`, no `--record`):

| Family / account | Verdict | Direct leg | Harness leg | Note |
|---|---|---|---|---|
| claude / vantt | healthy | ok (fable, 4.8 s) | 2 x ok (14-18 s) | usable |
| openai / tetnu | lost (prober killed by caller timeout at 600 s) | lost | pi 2 x pass (op_016, op_017); codex 1 pass (op_019), 1 hung (op_018) | the hung codex seat had an empty composer under an update banner, so its prompt was never delivered; its 600 s step timeout never fired; stopped by SIGTERM and then `dispatch recover` adopt -> cancelled |
| gemini / tetnu | mixed | no-probe (no probe for this credential layout) | 2 x other: `invalid model selection (--model "gemini-4-argon-high" --effort "")` | **not usable**, yet `decide --for execute` picks gemini first |

Index dry run (`plan-board.mjs check` / `eligible --json`, origin/main tree, read-only):

- 116 dirs under `plans/`, 113 with `plan.md` (no plan.md: `260825-1841-knowledge-registry`, `journals`, `reports`).
- Frontmatter status counts: completed 41, pending 29, done 11, in-progress 7, draft 3, complete 3, approved 2,
  proposed 1, plus 9 one-off free-text statuses ("done (landed …)", "proposed (frame awaiting owner approval)", …),
  7 with no `status:` line.
- `check`: exit 1, **56 errors, 0 warnings**. 51 are `unknown status` (prototype knows only draft, todo, in-progress,
  completed, archived, cancelled; it rejects every ak-plan `pending`, so this trial's own plan is rejected too) and 5 are
  `blockedBy names unknown plan` (free text or `project:` prefixed ids).
- `footprint` / `base`: declared by 0 of 113 plans. No warnings, because the prototype checks them only on `todo` plans and
  there are none.
- `eligible`: 0 eligible, 0 held, 0 running, lanes 0/1. Nothing can be picked from the current plans.
- A plan the trial marks `status: ready` would also be `unknown status` to the prototype.

Watcher dry run (`watchdog.sh`):

- Checked first with `plan-board.mjs watch` against a scratch state dir: 99 assignment dirs; **24 alerts, all old**
  (20 failed: 11 execution-failure, 6 blocked, 2 policy-refusal, 1 provider-limit; 4 stalled for 5-9 days). Run raw,
  `watchdog.sh` would have mailed all 24 to a live head and queued them: noise.
- Then `watch --baseline` (24 marked as seen) and `watchdog.sh /home/vantt/projects/forgent` once: exit 0, no
  `alerts.log`, no mail, no queue entry. State dir `~/.local/state/plan-supervisor/forgent/` now holds `seen.json` and
  `project.txt`.
- Blind spot: `watch` reads only unit runs (dirs with `unit.json`). The hung probe seat above (a dispatch assignment
  with no `unit.json`) never showed up.
- **Watcher choice for phase 3: `fgos workflow status`** (the phase rule: raw `watchdog.sh` is noisy). The baselined
  `watchdog.sh` may be run by hand beside it as a detection-latency data point.

Friction recorded in phase 1 (`fgos friction show <subject>`):

- `session:8e8e56bb-00a0-4158-ad04-ec29cabf8204` / state / `worktree-stripped-config-set-writes-fresh-file`. A linked
  worktree from `fgos worktree create` has `.fgos/config.yaml` stripped and marked skip-worktree, so `fgos config set
  --dir <worktree>` wrote a new 12-line file instead of editing the 273-line tracked one, and `git status` hid it.
- `run:run_asgn_8e8e56bb_00a0_4158_ad04_ec29cabf8204_op_018_01` / executor /
  `codex-prompt-not-delivered-step-timeout-not-enforced`.
- `session:8e8e56bb-00a0-4158-ad04-ec29cabf8204` / executor / `agy-gemini-invalid-model-selection`.

## Item header

| Field | Value |
|---|---|
| Item (backlog id) | |
| Item plan dir | |
| Case id / unit run ids | |
| Branch | |
| Assigned at | |
| Landed commit (main) | |
| Landed at | |

## 1. Completion

| Milestone | Reached (yes/no) | At | Note |
|---|---|---|---|
| DISCUSSION.md committed (plan-ready) | | | |
| plan.md committed, `status` set last | | | |
| case proposed | | | |
| every slice run passed | | | |
| leader self-verify passed | | | |
| branch handed to HARDEN | | | |
| landed on main | | | |

Leader transcript size at hand-off (MB, assistant messages): 

## 2. Lead time (assignment to verified result)

| Part | Minutes |
|---|---|
| worker (passing runs) | |
| failed runs | |
| verification (leader + HARDEN gate) | |
| owner wait | |
| total | |

## 3. Interventions

| # | Time asked | Time answered | Kind (gate / design / failure / housekeeping / review) | Wait (min) | Who asked | What |
|---|---|---|---|---|---|---|

Totals by kind (count, median wait): 

## 4. Scope fidelity

| Measure | Count | Detail |
|---|---|---|
| paths widened after the proposal | | |
| worker claims a re-run or check contradicted | | |

## 5. Plan defects found by validate

| # | Kind | Found by | Fixed in |
|---|---|---|---|

## 6. Detection latency

| # | Failure | Happened at | Detected at | Latency (min) | Detected by (watcher / owner / leader) |
|---|---|---|---|---|---|

## 7. Gates at the first independent check

| Check | First run passed (yes/no) | Unit test in commit | e2e in commit | Guide/doc in commit |
|---|---|---|---|---|
| leader self-verify | | | | |
| HARDEN land gate | | | | |

## Seats (retries and resumes)

| Family | Executor / invocation | Slice | Attempts | Resumes | Outcome class | Reason code |
|---|---|---|---|---|---|---|

## Friction ids

`fgos friction record --layer <layer> ...`, one id per line with a one-line summary.

-

## Lessons

-
