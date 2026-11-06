# HARDEN T5 seat-start follow-ups (omp setup wizard, omp natives row, foreground-not-agent facts)

Branch `harden/t5-seat-start` (worktree `forgent-worktrees/harden-t5-seat-start`), based on `8215cc226`. Not pushed.
Source: T5 phase file "Received from other lanes", entry 2026-11-06 17:1x (A1/A2/A3), and
`plans/reports/debug-261106-1557-omp-update-banner-seat-foreground-not-agent.md`.

## Commits

| Item | Commit | Code | Tests/fixtures |
|---|---|---|---|
| A1 omp setup wizard -> needs-human | `6c7eb14d6` | +55 -17 | +64 |
| A2 doctor row `omp-natives-present` | `1ab058d49` | +87 | +55 |
| A3 foreground facts on `foreground-not-agent` | `000f0d54b` | +71 -3 | +50 -5 |

Branch total vs base: 24 files, +420 -57 (including docs, CHANGELOG and the regenerated census).

## A1: omp first-run setup wizard

- Real screen captured from omp 18.11.2 (installed here) on an empty scratch agent home in tmux, `tmux capture-pane`:
  `Setup step 1 of 5 / Sign in to your providers ...` with footer `↑/↓ select · ⏎ confirm · ⎋ skip · Ctrl+C exit setup`.
  This is fixture `packages/agent-protocol/contracts/fixtures/terminal/omp/setup-wizard.txt`. The `.insp.json` is the same as the ready screen's (herdr has no omp rule, so it reports idle and unmatched).
- Red: new vector `first-run-setup-wizard-needs-a-person-and-is-never-typed-at` returned readiness `ready`: a still wizard counted as a ready prompt, and the brief was then sent into it. Green: `needs-human`, and nothing is typed.
- Change: `Profile.setup_markers` (only omp has one: `ctrl+c exit setup`). `Terminal::setup_line` returns the matching screen line. A private `screen_stop` replaces the three screen-only `classify_blocked` calls in the ready wait (start banner, ready gate, unruled wait). A setup screen gives `Readiness::NeedsHuman`. No new reason was added.
- Evidence line: on a `NeedsHuman` readiness, the supervisor writes `the agent shows a setup screen only a person can finish: <line>` to `supervisor.log`. The settle step's stop message already includes the last 6 screen lines.
- What NeedsHuman does today (checked in the code): the receipt reason `terminal:needs-human` goes through `providerStopOf` (`src/run-supervisor/steps/settle-attempt.mjs:95-104`), which gives `{adapterOutcome: 'blocked', cause: null}` and the failure `provider/blocked`. The outcome is not `provider-limit`, and `briefNeverReached` (`case-admission-port.mjs:70`) is false, so `run.mjs:595-596` returns the result as it is. The seat gets no account rotation, does not walk to another executor or profile, and is not re-launched. That is the required "same profile, no fallback". The settle message tells a person to answer the prompt in the pane.
- Docs: agent-protocol spec (Ready step, omp row, profile fields), CHANGELOG.

## A2: `omp-natives-present`

- I read the natives directory rule from the omp binary's own JS (18.11.2, function `b0`). It differs slightly from the brief: if `PI_NATIVES_DIR` is set (after trim) and is absolute after `~` expansion, it is used, otherwise it is ignored. Next comes `$XDG_DATA_HOME/omp/natives`, but only when **`$XDG_DATA_HOME/omp`** exists (the brief said `.../omp/natives`). Otherwise `~/.omp/natives`. I implemented omp's actual rule.
- File names also come from the binary (`N0`): on x64, `pi_natives.<platform>-<arch>-modern.node`, `-baseline.node` or plain `pi_natives.<tag>.node`; on other architectures, plain only. For linux-x64 that covers the brief's modern/baseline pair.
- `omp --version` writes nothing (checked on a scratch HOME). The row only reads.
- Levels:
  - omp missing or no `--version` answer: warning.
  - Natives missing and no executor runs omp: warning.
  - Natives missing and an executor runs omp (`ompExecutorsOf`: the basename of the invocation's or executor's `command` is `omp`): fail, with hint `run omp once outside the sandbox after every update`.
  - Natives present: pass, naming the file.
  - Runner config that cannot be read: treated as "no omp executor".
- New module `src/setup/omp-natives-checks.mjs`, registered in `registrations.mjs`. Also: architecture manifest entry (`infra`), the row in `setup-doctor-registry.md`, and the `checks.test.mjs` inventory.
- Test: one test in `test/setup/omp-natives-check.test.mjs` with a scratch HOME, a fake `omp` script on PATH, and the XDG and `PI_NATIVES_DIR` orders. It was red first (the module did not exist), then green.
- On this machine: `omp 18.11.2 has its native addon ~/.omp/natives/18.11.2/pi_natives.linux-x64-modern.node`.

## A3: facts on `foreground-not-agent`

- On `SendOutcome::ForegroundNotAgent`, `supervisor.log` gets one more line, `pane foreground facts: pane shell (session S) terminal foreground group G; <pid>[ shell|gate] (<comm>) <state> pgid <g> sid <s>, ...`. It covers every process from the gate's session leader (the pane's shell) down to the gate, then every descendant of the gate. Behaviour is unchanged.
- Pane shell: I used the gate's session leader instead of herdr's process info. terminal-control's `send` does not return the shell pid, and `tpgid` is a per-terminal value, so the leader's stat field 8 is the same as zsh's (in herdr, zsh is the session leader).
- Field 8 is read through the one stat parser: `fgos_process::facts::Relation` gains `tty_foreground_group` (Linux `tpgid`, macOS `e_tpgid`). The supervisor does not parse `/proc` itself (design principle 2). This touched `packages/process` (2 files), which was not named in the brief.
- Test: I extended the existing owning proof instead of adding a second one. It is now `a_brief_the_pane_refuses_because_its_shell_holds_the_foreground_ends_the_attempt_with_that_reason_and_logs_the_terminal_facts` (fake herdr, real gate in a pty). The agent's python child calls `setpgid(0,0)` + `tcsetpgrp(/dev/tty)` itself. The test asserts that the terminal foreground group is the child's pid, that the gate is listed, and that the child is listed with its own pgid. Red first (no facts line), then green. A logged line from the run:
  `pane shell (session 3755822) terminal foreground group 3755829; 3755822 shell (sh) S pgid 3755822 sid 3755822, 3755823 gate (internal_harnes) S pgid 3755822 sid 3755822, 3755828 (sh) S pgid 3755828 sid 3755822, 3755829 (python3) S pgid 3755829 sid 3755822, 3755830 (sleep) S pgid 3755828 sid 3755822`
  This line separates the debug report's hypotheses: state `T` on the chain means H1-stop, a missing chain entry means H1-exit, and a foreground group that is neither the agent's nor the shell's means H2.
- Docs: run-supervisor spec "Early ends", process spec known limits plus a decision-history line, CHANGELOG. Process spec line 117 was stale: it said the supervisor had two `/proc` stat parsers, and neither `gate/unix.rs` nor `supervise/terminal.rs` reads `/proc`. I corrected it.

## Gates

- `cargo test -p fgos-agent-protocol -p fgos-run-supervisor -p fgos-process`: green.
- `cargo clippy` on those 3 crates `--all-targets -D warnings`: clean.
- `cargo check` for `x86_64-pc-windows-msvc` and `aarch64-apple-darwin` (recompile confirmed after touching `macos.rs`): clean.
- `cargo check --workspace --all-targets`: compiles (only the existing warnings in the third-party `arraydeque`).
- `cargo fmt --all --check`: my crates are clean. There are 2 diffs already on base, not mine: `apps/fgos/src/wiring/mailbox_remote.rs:275` and `packages/convention/rust/tests/golden.rs:283`.
- Node: `checks`, `registrations`, `doctor-fresh-run`, `doctor-strict-exit`, `omp-natives-check`, `architecture`, `doc-health`, `check-decision-citation-drift`: green.
- `git-one-door-scan`: 0 undeclared. The census was regenerated in each commit.
- Full suite (`/dev/shm/t5-seat-start-full.log`): 8600 tests, 8567 pass, 1 fail, which is only the known "frozen V7n addendum" test. No `run-tests: ERROR` lines.

## Tests retired

None. The foreground refusal test was renamed and extended in place; it still owns that behaviour.

## Deviations

- A2: the XDG existence check is on `$XDG_DATA_HOME/omp` (omp's code), not `.../omp/natives` (the brief).
- A3: the pane shell is the gate's session leader, not herdr's process info; `packages/process` was touched to carry `tpgid`.
- A1: the evidence line goes to `supervisor.log`; the receipt reason is unchanged. No separate wiring test was added for the log line (the vector owns the classification).
- The fixture is from omp 18.11.2 on an empty home, not 18.17 on a profile with an old `setupVersion`. Both show the same wizard footer.

## For other phases / landing

- The branch is behind `origin/main` (P09 landed). Files we both touched: `CHANGELOG.md` (append), `docs/architecture-manifest.json` (one line each), `packages/git/contracts/mutation-census.v1.json` (regenerate on merge, never take either side). None of P09's files were touched.
- Operator step still needed after every `omp update`: run `omp --profile=<p>` once per leased profile, which finishes the wizard and extracts the natives. Doctor now reports the natives part.
- Side notes from the investigation, not done here: `visibility.json` reports `confinement: unconfined` on bwrap runs; probe-account picks a `.zshrc` error line as evidence.

Status: DONE
Summary: All three items landed as separate commits with red-then-green proofs: the omp setup wizard ends as needs-human with an evidence line, the new doctor row `omp-natives-present` was added, and foreground facts are now logged on `foreground-not-agent`. The full suite is green except the known frozen V7n test.
Concerns/Blockers: A3 touched `packages/process` (adds `Relation.tty_foreground_group`); A2 follows omp's actual XDG rule, which differs slightly from the brief.
