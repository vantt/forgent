# Debug: a brief typed for a herdr agent runs in the pane's zsh

Times are Asia/Saigon (UTC+7) unless marked Z. Run dir of the main case:
`.fgos/assignments/unit-run-1792525366556-23ed5f57/producer/1/runs/01/` (gemini via omp, release `4efa6e15`).

## 1. Summary

The brief was **not** typed while zsh held the pane. It was typed while omp held the foreground, omp never
read its tty, and the bytes stayed queued on the pane's tty. When the cancel ended the sandbox, zsh took
the tty back and read that queue as typed-ahead input: each line ran as a command, backtick spans
included. Nothing in the delivery path ever dropped that queue.

So a foreground check before each send (the backlog's condition of satisfaction) is necessary but would
**not** have stopped this run: at every send the foreground really was the launched agent. The fix
therefore has two parts at the layers that own them (section 5): terminal-control refuses a send while
the shell (or nothing identifiable) holds the foreground, and the gate drops the tty's unread input
before the shell gets the tty back.

The same mechanism also explains the 2026-10-20 18:32 case of `p-d2dc4f2e` (section 4), which the
earlier report put down to "the kill landed mid-typing". The other `p-d2dc4f2e` symptoms (launcher
typed twice, codex paste never submitted, omp false negative) are not explained by this evidence.

## 2. Timeline of the 02:43 run (proven)

| Local | Event | Source |
|---|---|---|
| 02:42:47.83 | brief written | `brief-1.md` mtime |
| 02:42:47.91 | herdr pane 1413 spawned, pid 290114 (zsh), 69x352 | `~/.config/herdr/herdr-server.log` |
| 02:42:48.28 | launcher written (`exec bwrap … -- fgos internal gate`) | `launcher.sh` mtime |
| 02:42:48.78 | gate bound by the supervisor | `supervisor-binding.json` `boundAt` |
| 02:42:48.94 | AGENT: omp, pid 2 in the sandbox pid namespace | `agent-binding.json` |
| 02:42:48.97 | herdr: foreground of pane 1413 is `omp`, pgid 290564 | herdr log `agent changed … agent=Some(Omp) process=omp pgid=Some(290564)` |
| 02:43:07.35 | supervisor stop, cause `cancel` | `stop-requested.json` |
| 02:43:09.53 | gate exit, `exitCode 143`, `stoppedBy cancel` (omp died of SIGTERM) | `gate-exit.json` |
| 02:43:09.63 | receipt `cancelled`, `reason terminal:delivery-unknown` | `receipt.json` |
| 02:43:09.85 | screen captured: zsh has already run 33 brief lines | `stdout.log` mtime and body |
| 02:43:10.05 | herdr: omp gone, foreground back to pgid 290114 (zsh) | herdr log |

## 3. Why this is typeahead and not typing into zsh

1. **Order of sends.** In release `4efa6e15` (and on main) the supervisor requests a stop for
   `delivery-unknown` only in `end_early`, after `deliver_brief` has returned
   (`packages/run-supervisor/rust/src/supervise/terminal.rs`, `drive`). Every send of the brief, and
   every Enter of `confirm_submitted`, happened before 02:43:07.35. No code path sends after that stop
   (the exit command is typed only after a completed result). The receipt carries
   `terminal:delivery-unknown`, which `begin_stop` records only when it is the first stop, so no
   earlier deadline or cancel stop happened.
2. **Who held the foreground while sending.** herdr reports omp as the pane's foreground from 02:42:48.97
   to 02:43:10.05. The gate made omp's group the tty's foreground group before `exec`
   (`gate/unix.rs`, `spawn_agent`), and `gate-exit.json` shows omp alive until the cancel (exit 143).
3. **The shell ran 33 lines within 322 ms of the gate's exit** (02:43:09.53 to the capture at
   02:43:09.85). No send could have produced them in that window; only input already queued can.
4. **omp never read its tty.** The first line zsh executed starts with the terminal's reply to a
   size query (`8;69;351;414;351t`, the `CSI 8;rows;cols t` answer, rows 69 as the pane) glued to
   `# Brief 1`. omp asked, the terminal answered into the input queue, and omp never read that answer;
   the brief bytes queued right behind it. This also explains `delivery-unknown`: no draft, no echo,
   no working state ever appeared.
5. **Mechanism reproduced.** A pty with an interactive `zsh -f`, a foreground program that never
   reads, `echo \`touch <marker>\`` written to the pty while it runs: when the program ends, zsh runs
   the line and the marker exists. The same program calling `tcflush(0, TCIFLUSH)` (SIGTTOU ignored)
   before it exits: the marker is absent. Script:
   `/tmp/claude-1000/-home-vantt-projects-forgentX/bbe6155f-ff18-4e69-ad42-40abac4a35bf/scratchpad/typeahead/probe.py`
   (`plain marker exists`, `flush marker absent`). The gate-level test in section 6 repeats it with the
   real gate in a real bwrap namespace.

Line 47 of `stdout.log` (`no such file or directory: …/outbox/ack-1.json.tmp`) is zsh running the
backtick span of the ack instruction as a command. The capture ends while zsh is on brief line 33,
which carries `` `fgos run` `` and `` `env -u CLAUDE_CODE_SESSION_ID` `` spans, so those were next.

Why omp never read its tty is not proven (it drew its banner and status line, then took no input for
18 s). It is a separate fault of that seat; the safety fault is that unread input outlives the agent.

## 4. The `p-d2dc4f2e` cases

| Case | Explained here? | Evidence |
|---|---|---|
| 2026-10-20 18:32, `unit-run-1792495203944-8d839c6e` synthesizer (omp/xai), brief as `quote>` lines in zsh | **Yes, same mechanism.** | `stop-requested.json` 18:32:28.62 with receipt reason `terminal:delivery-unknown` (so all typing ended before the stop, as in section 3.1); agent killed at 18:32:39.67 (`gate-exit.json`, `signal SIGKILL`, the gate itself published); shell lines on screen at 18:32:43.67. The earlier report's "kill landed mid-typing" does not fit the order of the code: no send follows a `delivery-unknown` stop. |
| Launcher typed twice, `terminal-launch-not-started` (16:08 xai, 22:21 codex) | No | Fails before any agent or brief exists; the earlier report ties 16:08 to a private home that vanished at bwrap start. |
| codex `[Pasted Content … chars]` left unsubmitted (20:33, 00:48) | No | Prompt-door delivery that the CLI did not submit; nothing reached a shell. |
| omp "Working… 2%" judged `delivery-unknown` (02:42, `unit-run-1792525295258-f400cce0`) | No | A confirmation false negative in `confirm_submitted`; the agent did read its input. |

## 5. Cause-aligned fix (implemented, see the phase report)

1. **terminal-control `send`** (the one door every typed byte goes through, prompt door included)
   reads the pane's process info and types only while a program other than the pane's shell holds the
   foreground, reusing the existing foreground fact (`foreground_identity`, now shared through
   `foreground_of`). Otherwise it answers `foreground-not-agent` with the reason and types nothing. The
   supervisor stops the attempt with receipt reason `terminal:foreground-not-agent`, which the settle
   step already turns into a failed attempt.
2. **The gate** drops the tty's unread input (`tcflush(0, TCIFLUSH)`, SIGTTOU ignored) when the agent's
   group is gone, before the shell can take the tty back (`give_back_foreground`, terminal mode only).
   This is the part that closes the 02:43 and 18:32 path.

Residual gap: a gate that is killed outright (the supervisor's domain sweep when the gate outlives its
grace plus slack, or the bwrap monitor dying) never reaches the flush. Both observed cases went through
the gate's normal end.

## 6. Proof

- `packages/terminal-control/rust/tests/herdr_driver_fake.rs`
  `a_brief_sent_to_a_pane_whose_shell_holds_the_foreground_is_not_typed_and_nothing_runs`: fake herdr
  with only the shell in the foreground, whose shell runs typed text; a brief with a backtick span sent
  typed and through the prompt door: refused, no `pane send-text`/`agent prompt` call, no marker. A
  control in the same test types the same text past the core and the marker appears. With the guard
  disabled the test fails.
- `packages/run-supervisor/rust/tests/gate_terminal_socket.rs`
  `input_the_agent_never_read_is_dropped_before_the_pane_shell_reads_the_tty_again`: real gate in a
  real bwrap namespace on a pty, an agent that never reads, a backtick line typed at the pane, then a
  shell reads the tty: no marker. With the flush removed the test fails ("text typed for the agent ran
  in the pane's shell").
