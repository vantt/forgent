# Terminal mode P02: gate in `terminal` mode

- Date: 2026-10-18. Branch `terminal-mode/p02-gate` merged into `terminal-mode/integration`.
- Files: `packages/run-supervisor/rust/src/{gate.rs,gate/unix.rs,go_channel.rs}`; tests `tests/{gate_terminal_socket.rs,gate_orphan.rs,support/terminal.rs}` (+ `Attempt::new_with` in `support/mod.rs`).

## What the gate does now (Linux/macOS, `--go-socket`)

1. Refuses a socket file not owned by its uid, connects, checks the peer uid (`SO_PEERCRED`, `getpeereid` off Linux). Any failure: exit 64, no agent. Pids never compared.
2. Receives `GO` with `recvmsg` + `MSG_CMSG_CLOEXEC`, sets `FD_CLOEXEC` again on each descriptor at once. Count must be 1, or 2 when `mutation` is `mutating`, else exit 65. Descriptions are held until the gate exits; the agent and its children never get them.
3. Envelope mode and channel kind must agree (`terminal` <-> `--go-socket`), else exit 65.
4. Agent: `env_clear`, envelope env + side file + `FGOS_SESSION_ID`/`FGOS_PARENT_WRITER_ID` from `identity` + `FGOS_PIDNS_ANCHOR`. Identity is optional in `direct` (envelopes from before), required in `terminal`.
5. tty: agent inherits the pane tty on 0/1/2, no `setsid`; child does `setpgid(0,0)`, then `tcsetpgrp(0, own pid)` with SIGTTOU blocked, before exec. A failure means the agent does not start (exit code 126 in `gate-exit`, reason in stderr, no AGENT frame): loud, not best effort.
6. Orphan branch: after `AGENT` the channel is watched. EOF before `BRIEF_DELIVERED`: stop `orphan` / `abandoned-before-brief`. EOF after: poll `outboxDir` every 50 ms for a `result-<N>.json` that parses as JSON (temp names and half-written files do not count); first sight + `orphanSettleMs`: stop `orphan` / `orphan-result`. No result: runs to the hard ceiling. Stop = SIGTERM to agent group, grace, then `kill_everything` (same path as the other stops).
7. After the domain is empty the gate tries to hand the foreground back (`tcsetpgrp` to its own group when it has one). Inside a PID namespace `getpgrp` is 0, so the pane shell reclaims the tty when the sandbox exits.

## Tests (real bwrap pid-1 gate in a pty session, test plays the supervisor)

- Full `cargo test -p fgos-run-supervisor` on the phase branch: 17 test binaries, all ok (12 lib, adopt 2+13+2, envelope 2, gate_ceiling 4, gate_go 5, gate_orphan 4, gate_pid1 9, gate_portable 10, gate_terminal_socket 10, steps 3+5, supervise 1+1+9+10). `cargo clippy --all-targets` clean.
- Plan's seven cases map: 1 `a_socket_that_does_not_exist...`, `a_supervisor_that_is_already_dead...`; 2 `...dies_while_the_gate_waits_for_go...`; 3 `the_lock_rides_on_go...` (stranger `LOCK_SH|LOCK_NB` fails while gate runs, succeeds after); 4 `eof_before_the_brief...`; 5 `a_result_after_the_brief...` (+ half-written file, temp name, supervisor-present, no-result-to-ceiling); 6 `the_agent_sees_the_attempt_identity...`; 7 `neither_the_agent_nor_its_child_holds...`. Extra: wrong fd count, mode mismatch, foreground group == agent group, no ctty -> no agent.
- Re-run on integration after merge: `cargo test -p fgos-run-supervisor gate` ok.
- Supervisor death is simulated by closing the test's lock description and connection (same kernel effect as SIGKILL of the supervisor); no herdr involved.

## Decisions (plan left open)

- **Exit code for connect/EOF/refusal is 64 (`EXIT_NO_GO`), not 3.** The landed contract (`gate-go.v1.json` rules) says 64; 3 is `host-version-mismatch`. The "3" in the design came from the Python probe.
- Cause names follow the contract: `abandoned-before-brief`, `orphan-result` (the phase text said `orphan-after-result`).
- Terminal agent keeps the pane tty as stdio; capture files and brief file are not used in this mode (the brief is typed by the agent protocol).
- Foreground failure fails the start (P01 decision 3 kept).
- Outbox completeness rule from P01 implemented as parse-complete + ignore temp names.

## Concerns / for later phases

- P03 supervisor must send `BRIEF_DELIVERED` once and keep the connection open until the attempt ends; closing it early is read as orphan.
- Windows: `terminal` stays unsupported; `gate/windows.rs` untouched (it now parses the new Config fields, not checked on Windows from here; CI push via `forgentx-95` would confirm).
- GitNexus: index stale; `load_config` and `Config` are used only by `gate/{unix,windows}.rs` (grep); risk LOW. No HIGH/CRITICAL.
- inotify was avoided (P01: watch limit exhausted), so the outbox is polled.

## Unresolved questions

- Raw-mode TUI behavior when foreground is lost mid-run (unchanged from P01); real herdr check is P09.
