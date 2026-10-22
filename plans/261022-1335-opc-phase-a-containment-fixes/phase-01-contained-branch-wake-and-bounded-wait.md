# Phase 01: contained branch, exit wake and bounded kill wait (A1, A2)

## Context

`packages/git/rust/src/driver.rs`, unborrowed branch of `invoke_context` (≈ :1165-1245):

- **Poll.** It runs `try_wait`, then `sleep(2 ms)` (≈ :1205-1220). The first poll always misses, so every contained child pays about 1.4 ms (speed seat F-S2).
- **Unbounded wait.** On a deadline or output limit it calls `kill_all(&mut domain, 3000)`, ignores a `Refused` outcome, then calls `spawned.child.wait()` on the bwrap monitor (≈ :1216-1217). The monitor waits for pid 1, and pid 1 waits for namespace teardown, which never ends while a member is in D-state (correctness F4).

**Prior art to reuse.** Holder-lock's borrowed path already wakes on pipe activity or root exit through `exit_descriptor(pid)` with a 1 ms floor when no pidfd exists (`packages/holder-lock/rust/src/port.rs` ≈ :1023). Reuse that primitive, or move it to `fgos-process` if Git cannot depend on it. Do not copy it (design principle 1).

## Requirements

- **A1.** Wait for the child's exit and for the deadline or output-limit signal without a fixed sleep.
  - The output-overflow flag set by the capture threads must still stop the child promptly.
  - Use a pidfd on Linux when available. On other platforms, or with no pidfd, keep a short bounded wake no worse than today.
- **A2.** If `kill_all` returns anything but `Ok`, do not call an unbounded `wait()`.
  - Hand the child (the monitor) to a detached reaper thread.
  - Return `containment-unproven`, the same refusal as today's unproven-empty path.
  - Apply the same rule to the post-exit ladder: `is_empty`, then `kill_all`, then `is_empty`.

## Files

- `packages/git/rust/src/driver.rs`: contained branch only.
- If the wake primitive moves: `packages/process/rust/src/` (an existing module next to `control`). `packages/holder-lock/rust/src/port.rs` then switches to it, so only one copy remains.

## Steps

1. Run impact analysis on `invoke_context` and on the wake primitive if it moves. Report the blast radius.
2. Replace the poll loop and remove the 2 ms sleep.
3. Bound the post-kill path (A2).
4. Tests:
   - extend the existing driver tests for timeout and output limit so they still stop the child;
   - add one driver test where a member is stopped with SIGSTOP from the host, on a bwrap host and on `linux-pgroup`, so `kill_all` cannot finish. The call must return `containment-unproven` within the bound, measured, with no hang. Name the behaviour plainly in the test title.
5. Run `cargo test -p fgos-git -p fgos-process -p fgos-holder-lock`, then `npm test -- test/git`.

## Owning proof

The new D-state test owns A2. The existing timeout and output-limit tests own the stop behaviour. A1's gain is shown by the phase 05 micro row, not by a test.

## Gates

- Census and one-door checks green.
- ScopedCommit and Land tests green.
- The borrowed main-checkout and no-host cases are unchanged (HARDEN's criteria).
- `detect_changes` touches only the expected symbols.

## Review

HARDEN (`forgent-a8`): send the branch and tip SHA. HARDEN runs the full suite and an R2 measurement before and after.

## Risk and rollback

- **Risk:** a wake that misses the overflow flag lets a chatty child run to its deadline. The output-limit test covers it.
- **Rollback:** revert the commit.
