# HARDEN T4 speed: run-supervisor Rust test time

Commit 914ffd5bf on main (OPC merged on bd5a0cf49, same content after rebase).

## Result
Crate `fgos-run-supervisor`, `cargo test` (debug, as the gate runs it), load average 47 during the run:
- Before: 72.9 s wall (T4 closing report). Per binary on this machine: gate_pid1 7.9 s, supervise_terminal_fake_herdr 13.1 s (the report saw 19.1 s each at its load).
- After: 46.7 s wall, 45.5 s summed. gate_pid1 4.1 s, supervise_terminal_fake_herdr 10.0 s. OPC's own run: 3.97 s and 9.92 s.

## Changes
- Production seam: optional `terminal.shellReadyTimeoutMs` in the terminal envelope (`terminal_slot.rs`, `supervise/terminal.rs`, spec line). Absent or 0 keeps terminal-control's 10 s default; Node does not emit it yet. One unit test.
- gate_pid1 zombie reaping: orphan churn over 5 s instead of 10 s; still must see more than 150 distinct processes.
- fake_herdr: stuck-shell test sets the new field to 2 s; blind soft deadline 10 s to 8 s with shorter loop; idle loop 8 x 400 ms; killed-supervisor sleeps 3.5 s to 2 s; fifo ceiling 6 s to 5.5 s.
- idle_ms stays 3 s: at 2 s the idle stop fires before the brief is typed and the blind test fails every time.

## Gate
fmt, clippy -D warnings, msvc and darwin check, one-door scan (census regenerated), architecture, doc-health, citation drift green. Full npm test: 2 fails, the V7n addendum (known) and mailbox-live-confined orphan sweep (load flake, 19/19 alone).

## Concerns
- The idle and blind fake_herdr tests fail at `brief_taken` when load average is above about 55, because the idle window opens before the brief is typed. Same failure at baseline (blind failed in the first baseline run). Not worsened by this change.
- Follow-up (OPC, separate item): the killed-supervisor tests still sleep for BRIEF_DELIVERED, which has no on-disk observable. A marker or a herdr call to wait on would remove the race and the 2 s sleeps.
