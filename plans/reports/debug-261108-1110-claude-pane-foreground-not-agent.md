# Why a confined claude pane seat was cancelled before its agent took the brief

Date: 2026-11-08 (Asia/Saigon). Release 674c76fb = main acf16c5e2. Read-only investigation.
Attempt: `.fgos/assignments/unit-run-1794110905356-03a1b409/producer/1/runs/01` (attemptId `cmd_1794110905533_23a60220`).

## Verdict

- **Proven:** the confined launch worked. claude started inside bwrap, led its own process group and held
  the pane tty's foreground. The supervisor cancelled the seat itself. Its first send asked herdr who
  held the foreground, and herdr's list had no non-shell process in it. No timer and no budget was
  involved. The lost-brief retry then fired as designed (same executor, once) and passed.
- **Not proven:** why herdr's answer at the moment of the send had no agent in it, while `/proc` a
  moment later shows the agent's group as the tty foreground group. The data needed to settle this is
  not logged (see "Extra facts to capture").
- **Regression?** It is not a T5 regression and not caused by today's landings. Every pane agent has
  hit this same failure family since the send guard landed on 10-21. Until today only omp had shown it.
  This is the first claude case.

## Timeline (file mtimes / records, UTC)

| time | event | source |
|---|---|---|
| 04:08:25.517 | dispatch plan written | `runs/01/dispatch-plan.json` mtime |
| 04:08:26.018 | launcher written; pane typed `cd … && launcher.sh` | `launcher.sh` mtime, `stdout.log` |
| 04:08:27.173 | gate bound the agent: claude = pid 2 in pidNs 4026532920 | `agent-binding.json` (`at`) |
| ~04:08:30.33 | first send refused: "the pane's shell (pid 3183875) is in the foreground" | `supervisor.log` line 1 |
| 04:08:30.335 | `stop-requested.json` cause=cancel | same instant as the refusal |
| 04:08:31.711 | gate exit 143, stoppedBy=cancel | `gate-exit.json` |
| 04:08:31.781 | receipt cancelled, reason `terminal:foreground-not-agent` | `receipt.json` |
| 04:08:32→46 | retry `producer/1-fb1`, same executor and invocation `claude-herdr-bwrap` → exited 0, pass | `1-fb1/runs/01/receipt.json`, `unit-summary.json` |

The send came about 3.2 s after the agent started and about 5 s after launch.

## Q1: what happened in those 5 s

1. **claude started and was running.** `agent-binding.json` records claude at 04:08:27.173. The
   facts line (`supervisor.log` line 2, written by `foreground_facts`,
   `packages/run-supervisor/rust/src/supervise/terminal.rs:400-441`) shows this:
   `terminal foreground group 3184373; … 3184365 (bwrap) S pgid 3184365, 3184366 gate (fgos) S pgid 3184365, 3184373 (claude) S pgid 3184373`.
   So the tty's foreground group is claude's own group (3184373). claude is alive (S). It has no child
   processes: the facts walk lists every descendant of the gate, and none appear under claude. That
   matches the gate's design. In `spawn_agent` (`packages/run-supervisor/rust/src/gate/unix.rs:676-700`)
   the gate calls `setpgid(0,0)` and then `tcsetpgrp(0, getpid())` before exec. That handoff has been in
   place since 6a3cdee84 (10-18).
2. **The refusal came from one herdr sample.** `Core::send` (`packages/terminal-control/rust/src/core.rs:808-828`)
   makes one `pane process-info` call. `foreground_of` (`core.rs:921-943`) found no non-shell process,
   and `is_bare_shell` (`identity.rs:73-75`) printed "the pane's shell … is in the foreground".
   `is_bare_shell` is also true when herdr's list is **empty**, and the parser drops argv-less entries
   as zombies (`driver/herdr.rs:203-207`). So the message does not prove that the shell held the tty.
   It only proves that herdr listed no live non-shell process.
3. **The cancel was the supervisor's own.** It is not a timer, a brief deadline or a foreground poll.
   When `TermIo::send` gets `SendOutcome::ForegroundNotAgent`, it logs the facts and calls
   `begin_stop("cancel", Some(REASON_FOREGROUND_NOT_AGENT))` (`terminal.rs:647-656`). The gate is then
   stopped with SIGTERM (exit 143). The 5 s is simply how long it took to reach the first send. No 5 s
   budget exists.
4. **The pane capture is uninformative.** `stdout.log` was captured after the stop. claude's
   alternate-screen UI was gone by then, so only the launcher line and the shell's next prompt remain.
   The zsh noise (`/tmp/sacr/... no such file`, `(eval):1: = not found`) comes from the pane shell's own
   rc files and is unrelated. The private home was finalized (`steps/finalize-home.json` homes:1), so
   no claude-side log was kept.

**Is herdr stale in general? No (probe, 11:2x local).** I used a throwaway unfocused herdr tab (since
closed) with the same shape: zsh → `bwrap --unshare-pid --as-pid-1` → `bash -i` → `sleep` in its own
group as the tty foreground. In 25 samples, `pane process-info` listed `sleep` every time. A fresh
`sleep` showed up in the very next call (within ~10 ms). So herdr handles a pid-namespaced
own-group foreground and is not caching. The miss is transient and happens at agent startup.

## Q2: regression?

- Owning code history:
  - The send guard dates from 065cc620a (10-21).
  - The zombie filter dates from 359274c62 (10-22). Its commit message records that herdr lists
    argv-less entries in a pane's foreground.
  - The only change to core.rs, identity.rs and driver/herdr.rs since 10-25 is the facts logging
    (f1c1e7802, 11-06; `git log --since=2026-10-25` on those files).
  - T5 changes (homes, trust, masks, bind-back) and today's landings do not touch the process
    group or the send guard.
- Counts by `envelope.launch.command`, all assignments:
  - `foreground-not-agent` receipts: omp ×2 (10-22), ×1 (10-23), ×1 (10-29), ×1 (11-05), ×2 (11-06),
    ×2 (11-08); claude ×1 (11-08, this one).
  - Since 11-05, herdr+bwrap seats:

    | agent | exited | foreground-not-agent |
    |---|---|---|
    | omp | 13 | 5 |
    | claude | 3 | 1 |
    | pi | 14 (and 1 timeout) | 0 |
    | codex | 3 | 0 |

  - claude, all time: 10-19 to 10-22 had 67 exits and 14 cancels. None of those cancels was
    foreground-not-agent (11 had no reason, 2 were completed-no-exit, 1 was result-unreadable). Since
    then, 3 exits and this 1 case.
- Every instrumented case shows the same picture: the omp cases at 02:54Z and 04:07Z, and this claude
  case. `/proc` names the agent's own group as the tty foreground group, and the agent is alive
  (omp R/S, claude S).
- Conclusion: this is an old failure family of the send guard, not new behaviour. claude's sample
  size (4) is too small to call a rate change.

## Q3: retry or fallback?

The retry fired, and it was the right recovery. The run labels `1-fb1` as `fallbackFrom.kind:
brief-not-delivered`, but it uses the same executor and the same invocation `claude-herdr-bwrap`.
That is the lost-brief rebind `{ rebind: { continuity: bound, from: bound, reason: 'brief-not-delivered' } }`
(`src/runner/execution/run.mjs:782`). Its trigger is `briefNeverReached`
(`src/runner/execution/case-admission-port.mjs:70-72`), and `MAX_BRIEF_RETRIES = 1` (`run.mjs:240`).
"cancelled" is only how a supervisor stop shows up on the receipt (cause=cancel, gate SIGTERM 143).
The reason field is what drives the retry. Nothing is wrong on this side, except that `fallbackFrom`
makes a same-seat retry look like a seat change when someone reads the summary.

## Q4: fix

The cause is unproven, so do not change behaviour yet. Capture these two facts at the refusal:

1. **What herdr actually answered.** Put herdr's `foreground_process_group_id` and every listed
   `pid:name`, including the argv-less entries the parser drops (as a count, or as pid with a `Z`
   mark), into the `ForegroundNotAgent` reason. The reason is built at `core.rs:819-828`. The dropped
   entries are lost at `driver/herdr.rs:205-207`, so `ProcessInfo` would carry a `dropped` count, or
   the reason would read the raw list.
2. **Who is in the foreground group by the OS.** In `foreground_facts` (`terminal.rs:400-441`), also
   list every process whose pgid equals `tty_foreground_group`, even when it is outside the gate's
   tree. Mark zombies. Today only the gate's ancestry and descendants are shown.

How to read the next case:

- **herdr pgid = the agent's group and its list is empty or has only argv-less entries.** herdr
  failed to read the agent's entry for a moment. The fix is in `foreground_of` (`core.rs:921`): when
  herdr lists no non-shell process, decide from the OS fact the facts door already reads (the shell's
  stat field 8 `tty_foreground_group`, 2b593dbff). Accept when that group differs from the shell's
  own group and has a live leader (`identity_of(pgid)`). This keeps the guard's invariant: a shell
  that does not own the tty's foreground cannot read the typed text. It also follows design principle
  5 (decide from the real OS state).
- **herdr pgid = the shell's group, or a dead group.** The agent really lost the tty for a moment at
  startup. The fix is a bounded re-check in `Core::send` before refusing, polled like `identify_root`
  (`core.rs:767-787`, `launch_identify_timeout_ms`). Never type while the shell owns the tty.

Owning tests for either fix:

- `packages/terminal-control/rust/tests/core_failures.rs`, the guard's core cases (for example
  `an_empty_foreground_list_proves_no_ownership`:454 and
  `a_pane_whose_foreground_is_a_child_process_gets_nothing_typed_and_ends_not_started`:626). Extend
  the case that has an empty or zombie-only list while an agent group holds the tty.
- One wiring proof stays at
  `packages/run-supervisor/rust/tests/supervise_terminal_fake_herdr.rs:276`. Extend it only for the
  new logged facts.

## Unresolved questions

- What herdr's `process-info` returned at 04:08:30.3Z: its pgid and its list. This is not logged
  today.
- Which protocol step sent first (a dialog key or the brief). The protocol does not log the send kind.
- Why omp hits this far more often than claude, pi or codex (5/18, compared with 1/4, 0/15 and 0/3).
  This suggests a startup behaviour of the agent, unproven.
