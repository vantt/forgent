# Terminal mode P01: pane tty and env measurements

- Date: 2026-10-18, herdr `0.9.1-vantt.1`, Linux, bwrap `/usr/bin/bwrap`, claude 2.1.302, codex 0.163.0, agy, pi, omp (accounts as in S7).
- Probe: `tools/terminal-gate-probe` (standalone Cargo package, libc only, subcommands `gate`, `reader`, `scm-server`, `scm-client`, `watch`). Measurement only; no production file touched.
- Method: own herdr tab in workspace `wS` (closed at the end); a private herdr server (own `HERDR_SOCKET_PATH`, XDG dirs under a short temp dir) for the server-kill test so the real server was never touched.

## Answers

| # | Question | Result |
|---|---|---|
| 1 | Parent of bwrap in a pane | `exec bwrap ...` from the launcher: bwrap ppid = the pane's zsh (session leader, pts/6), bwrap pgid = own, foreground group = the agent group. Tree `zsh -> bwrap -> gate(pid 1 in ns) -> child`. Close pane: bwrap, gate, child and the pane shell all gone (first check, under 0.5 s). SIGKILL of the (private) herdr server: pty hangup, shell exits, bwrap gone by the first 500 ms check. `--die-with-parent` holds in both. |
| 2 | Foreground tty in the namespace | **Works without `setsid`.** Gate is pid 1 (ppid 0, sid 0 as seen inside), spawns a reader in its own group, `tcsetpgrp(0, pgid)` with SIGTTOU ignored returns 0, `tcgetpgrp(0)` then reports the reader group, keys sent with `herdr pane send-text` reach the reader. Variant `setsid` + `TIOCSCTTY`: `TIOCSCTTY` EPERM, `open(/dev/tty)` ENXIO, `tcsetpgrp` ENOTTY (tty is the ctty of the shell session). Variant `exec setsid -c bwrap ...` from the pane shell: `setsid: failed to set the controlling terminal: Operation not permitted`, nothing runs. |
| 3 | `SCM_RIGHTS` through a bind dir | Gate in `--unshare-pid` sandbox with only the socket dir bound connects and receives the fd (`MSG_CMSG_CLOEXEC` gives `cloexec=true`). `SO_PEERCRED` on the gate side: `pid=0 uid=1000 gid=1000` (own uid 1000). Server sees the client with its real host pid. Supervisor SIGKILL: lock still HELD, gate alive; after the gate exits: lock FREE. |
| 4 | Env reaching agent commands | See table below. |
| 5 | Outbox write | See table below. |
| 6 | Exit command and time | See table below. |

### 4. Env seen by a command the CLI runs (`!env`, started as `FGOS_SESSION_ID=att-x <cli>` in the pane)

| CLI | `FGOS_SESSION_ID` | Own thread/session id | `HERDR_PANE_ID` |
|---|---|---|---|
| claude | att-x | `CLAUDE_CODE_SESSION_ID` (its own) | correct |
| codex (plain) | **absent** (daemon env) | `CODEX_THREAD_ID` | **stale** (`wS:p4YF`, a closed pane) |
| codex with `-c 'shell_environment_policy.set={FGOS_SESSION_ID="att-x"}'` | att-x | `CODEX_THREAD_ID` | correct |
| agy | att-x | none | correct |
| pi | att-x | none | correct |
| omp | att-x | none | correct |

Re-check: a second plain codex run with `FGOS_SESSION_ID=att-y` showed no `FGOS_SESSION_ID` at all, so the `-c` run was not an artifact of an inherited daemon env. Codex stays the only CLI that needs the extra option; the codex adapter must pass `-c shell_environment_policy.set=...` (and the pane env has to be correct for `HERDR_PANE_ID` as a side effect).

### 5. How `outbox/result-1.json` appears (0.5 ms directory poll; inotify was unusable, see Limits)

| CLI | Observed |
|---|---|
| claude | `result-1.json.tmp.<pid>.<hex>` already full size (64), then same inode renamed to `result-1.json`. Atomic publish. |
| codex | `result-1.json` first seen at full size (65, with newline). Written in place. |
| agy | same as codex (65). |
| pi | `result-1.json` first seen with **size 0**, full size (64) 0.6 ms later. Written in place, non-atomic. |
| omp | `result-1.json` first seen at full size (64). Written in place. |

Consequence: publish by rename cannot be assumed. The gate and the supervisor must ignore `*.tmp.*` names and treat a result file as complete only after it parses as JSON (or its size is stable across a short settle window). The orphan branch waits `orphanSettleMs` after the file appears, as the plan already allows.

### 6. Exit command and time to prompt return

Times include the harness's own polling (about 50 to 100 ms granularity); read them as upper bounds.

| CLI | Command | Time |
|---|---|---|
| claude | `/exit` + Enter | 835 ms |
| codex | `/quit` + Enter (prints "Disconnected from this task", thread stays in the daemon) | 74 to 607 ms (two runs) |
| agy | `/exit` + Enter | 229 ms (381 ms on a `/quit` run) |
| pi | Ctrl-D on empty input | 199 to 227 ms |
| omp | Ctrl-D on empty input | 129 to 192 ms |

Typing rule found on the way: codex treats text then Enter sent back to back as a paste, so the Enter becomes a newline. The adapter must leave a gap (0.6 s worked) between `send-text` and `Enter`, same as the existing `submitBrief` logic.

## Decisions for the plan

1. **D6 stays as planned:** launcher `exec bwrap --unshare-pid --as-pid-1 --die-with-parent ... -- <hostBin> internal gate ...`, no `setsid`. The gate runs `tcsetpgrp(0, agentGroup)` with SIGTTOU ignored. Open question 1 is answered: foreground can be placed from inside the PID namespace, so the fallback (gate outside the namespace, best-effort containment) is **not needed**.
2. `setsid -c` and gate-side `setsid` + `TIOCSCTTY` are dead ends in a pane (EPERM); phase 02 must not use them.
3. Input still reaches a reader even when `tcsetpgrp` failed (session without a ctty): only job control and signals are lost. This was not tested against a raw-mode TUI, so P02 keeps the foreground step mandatory and fails loudly if `tcsetpgrp` fails.
4. Codex adapter (phase 04): pass `-c 'shell_environment_policy.set={FGOS_SESSION_ID="<id>"}'`; the io-contract limit "codex commands see only the thread id" applies only when the option is absent.
5. Outbox completeness rule above goes into phase 02/03 (parse-complete check, ignore temp names).

## Concerns

- **Unintended global update:** while driving codex I sent Enter into its "Update available" prompt, whose default choice is "Update now". That ran `npm install -g @openai/codex`; `npm ls -g` now shows `@openai/codex@0.163.0` (the prompt had offered 0.162.1 to 0.163.0, and the earlier run already reported `CODEX_VERSION=0.163.0`). No measurement depends on it. Flagged for the owner.
- Claude and agy folder-trust prompts were accepted in scratch directories only.
- Limits: inotify returned ENOSPC (machine-wide watch limit 65536 exhausted by other tools), so the outbox was observed by a 0.5 ms poll; a partial-write window shorter than that for codex/agy/omp cannot be excluded. omp needed `OMP_PROFILE=openai-tetcu72` (the default profile has no API key); pi needed `--model openai-codex/gpt-6.1-sol` (default model rejected for the account). Server restart was measured as SIGKILL of a private server, not a graceful `server stop`.

## Cleanup

Tab `p01-probe` closed, no probe or bwrap process left, private herdr server dead, temp dir removed. Probe build output is git-ignored.

## Unresolved questions

- Does a raw-mode TUI that never gets foreground (failed `tcsetpgrp`) misbehave beyond losing signals? Not measured; P02 keeps the step mandatory.
