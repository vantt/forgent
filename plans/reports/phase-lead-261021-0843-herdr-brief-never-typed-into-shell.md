# Lead report: a herdr brief is never typed into the pane's shell

Backlog row: the brief-into-shell safety item (delivery side of the herdr seat item). Branch
`worktree-agent-a5c9f46bfff48ff2f` (worktree `.claude/worktrees/agent-a5c9f46bfff48ff2f`), based on
`56461cc79`. Nothing pushed, merged, staged or activated.

## 1. Cause (proven)

Full evidence: [debug report](debug-261021-0843-herdr-brief-delivery-faults.md).

At 02:43 the brief was typed while omp held the pane's foreground (herdr log: omp pgid 290564 from
02:42:48.97 to 02:43:10.05; gate exit 143 = omp ended by the cancel). omp never read its tty (the first
line zsh ran begins with the terminal's unread reply to omp's size query), so the brief sat queued on
the tty. After the `delivery-unknown` cancel ended the sandbox, zsh got the tty back and ran the queue
as typeahead: 33 lines within 322 ms of the gate's exit, when no send was possible any more (the stop is
requested only after `deliver_brief` returned).

Consequence for the backlog's condition: a foreground check alone is required but would not have
stopped this run, because the foreground at each send really was the agent. The same mechanism explains
the 2026-10-20 18:32 synthesizer case of the reliability item; launcher-typed-twice, the unsubmitted
codex paste and the omp false negative are separate faults (debug report section 4).

## 2. Fix

| Layer | Change |
|---|---|
| terminal-control `Core::send` (`packages/terminal-control/rust/src/core.rs`) | Reads the pane's process info before every send, text, keys and prompt door alike, and types only while a program other than the pane's shell holds the foreground. Reuses the existing foreground fact: `foreground_identity` now delegates to `foreground_of(info)`, no second detector. Otherwise returns `SendOutcome::ForegroundNotAgent { reason }` (shell in the foreground, foreground unreadable, or no live process identifiable) and calls nothing on the driver. |
| port and route (`port.rs`, `route.rs`, `contracts/terminal-control.port.v1.json`) | `send` returns `SendOutcome` like `launch`/`release` return their outcomes; the route answers `foreground-not-agent` with `reason`; the contract lists the result and the rule. |
| run supervisor `TermIo::send` (`packages/run-supervisor/rust/src/supervise/terminal.rs`) | A refused send stops the attempt (`cancel`) with receipt reason `terminal:foreground-not-agent` and returns an error to the adapter, so no further send is tried. The existing settle step already turns `cancelled` plus a `terminal:` reason into a failed attempt with that reason (`src/run-supervisor/steps/settle-attempt.mjs`, `rawResultOf`), so the fallback path sees an execution failure. No Node change. |
| gate (`packages/run-supervisor/rust/src/gate/unix.rs`, `give_back_foreground`) | When the agent's group is gone, drops the tty's unread input (`tcflush(0, TCIFLUSH)`, SIGTTOU ignored) before the shell can take the tty back. Terminal mode only; this is the part that closes the observed 02:43 and 18:32 path. |

Scope decision taken without asking (within the brief's "fix at the lowest layer that owns the
decision"): the gate flush is one call inside the existing hand-back function, not a new mechanism, and
without it the guard leaves the observed fault open. If the owner wants the guard only, revert the
`gate/unix.rs` hunk and its test; the guard part stands alone.

Docs: terminal-control spec section 3 gains the `send` rule; run-supervisor spec "Early ends" names
`terminal:foreground-not-agent` and "Job control of the shell" states the flush and its gap; one
`CHANGELOG.md` line under `[Unreleased]`. No component-boundary change.

Prior art (method step 1): `git log -S` on `pane-process-info-shell`, `foreground_identity`,
`give_back_foreground`, `tcflush`/`TCIFLUSH`, `submit_by_prompt_door`, `the attempt is ending`. The
foreground fact (`identity::first_non_shell`, `foreground_identity`, exec-root via the launched marker)
existed since `0411b9e0e`/`2fa124a2c`/`09ca981d7` and was used only by `inspect` and the close guard
(`foreground_is_owned`), never by `send`; nothing ever flushed the tty. Lane C (`ba41f13c6`) added the
tick before each send, which covers sends after a stop but not input already queued. No earlier send
guard was found and removed. `fgos tool query --capability impact-analysis --status present` returned
no providers: impact-analysis inactive; callers checked by grep instead (`Core::send` is called only by
the supervisor's `TermIo::send` and the route; Node's client never calls `send` in product code).

## 3. Tests

Owning proofs (design principle 8):

- `packages/terminal-control/rust/tests/herdr_driver_fake.rs`
  `incarnation::a_brief_sent_to_a_pane_whose_shell_holds_the_foreground_is_not_typed_and_nothing_runs`:
  the backlog's test. The fake herdr (`fixtures/herdr/fake-herdr.sh`, `FAKE_HERDR_FOREGROUND=shell`) now
  also runs typed text through a shell, as the pane's shell would. A brief with a backtick span that
  creates a marker, sent typed and through the prompt door, plus an Enter: all refused, the call log has
  no `pane send-text`/`agent prompt`, no marker. A control in the same test types the same text straight
  through the driver and the marker appears, so the absence above means something. Negative control run:
  with the guard disabled the test fails.
- `packages/terminal-control/rust/tests/core_failures.rs` `send_and_read_reach_the_pane_of_the_key`
  (extended): a live foreground program receives the sends; once it is gone, `send` answers
  `ForegroundNotAgent` ("no live process") and nothing more reaches the driver.
- `packages/run-supervisor/rust/tests/gate_terminal_socket.rs`
  `input_the_agent_never_read_is_dropped_before_the_pane_shell_reads_the_tty_again`: real gate in a real
  bwrap PID namespace on a pty, an agent that never reads, a backtick line typed at the pane, then a shell
  reads the tty: no marker. Negative control run: with the flush removed (and the `gate_harness` example
  rebuilt) the test fails "text typed for the agent ran in the pane's shell".

Wiring proofs (one per boundary):

- `packages/run-supervisor/rust/tests/supervise_terminal_fake_herdr.rs`
  `a_brief_the_pane_refuses_because_its_shell_holds_the_foreground_ends_the_attempt_with_that_reason`:
  supervisor over the fake herdr pane; the shell takes the foreground before the prompt; nothing typed,
  receipt `cancelled` with `terminal:foreground-not-agent`.
- `test/terminal-control/client-route.test.mjs` "every operation of the port answers through the route":
  the `send` lines now expect `foreground-not-agent` with a reason naming the shell (the pane there has only
  its shell in the foreground) and no send call in the herdr log. The old `ok` expectation for that
  shell-only pane is retired: the behaviour it asserted (typing at a bare shell) is now forbidden; the
  `Sent` path is owned by the core test above.

## 4. Verification (observed)

All with `CARGO_TARGET_DIR=/home/vantt/projects/forgentX/.fgos/runtime/tmp/brief-guard-cargo`.

| Command | Result |
|---|---|
| `cargo test -p fgos-terminal-control` | all green: lib 7, core_failures 17, core_rules 17, herdr_driver_fake 21, herdr_driver_fixtures 13, herdr_driver_live 0 (1 ignored, needs herdr), policy_fixtures 6, store_publish 6 |
| `cargo test -p fgos-run-supervisor` | all green, 19 test binaries, 0 failed (gate_terminal_socket 13 with bwrap present, no skip; supervise_terminal_fake_herdr 9; gate_pid1 9; …) |
| `cargo clippy -p fgos-terminal-control -p fgos-run-supervisor --all-targets` | no warnings |
| host built: `cargo build -p fgos` → `…/brief-guard-cargo/debug/fgos` | ok |
| Node, `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<that host>`: `test/terminal-control/client-route.test.mjs` alone | 7/7 pass |
| same env: `test/terminal-control/{client-route,contracts,group-queue}.test.mjs` | 19/19 pass |
| `npm test`'s own env for a file subset (`ensureHostBin` + `ensureGitAddon` + `ensureReleaseArtifacts`, then `runSelectedTests` with `buildTestEnv`, same `env -u …` and private `CARGO_TARGET_DIR`; driver script `/tmp/claude-1000/-home-vantt-projects-forgentX/bbe6155f-ff18-4e69-ad42-40abac4a35bf/scratchpad/run-selected.mjs`): all 20 `test/run-supervisor/*.test.mjs` plus the 3 `test/terminal-control/*.test.mjs` | **189 tests, 188 pass, 0 fail, 1 skipped** (Windows-only custody test) |

With only the plain host in `FGOS_HOST_BIN` (no staged git addon), the controller-driven files fail
before any attempt starts (`cancel-registry` 3, `crash-matrix-adopt-resume` direct cases, and 3 of
`terminal-cutover`'s 9). The same files fail the same way at the base commit `56461cc79` with a host built
from it (checked: `terminal-cutover` 3 of 9, `cancel-registry` 3 of 10), so that is the test setup, not
this change; with `npm test`'s env they all pass (row above). The full `npm test` was not run (the big
lead runs it).

## 5. Coordination

Files outside `src/runner/**`, `bin/fgos.mjs` and `registrations.mjs`: no overlap with the SEAT lane. No
herdr pane was created, typed into or closed; the 02:43 evidence was read from files and the herdr
server log only. Nothing activated or staged.

## 6. Proposals (not built)

1. **Flush when the gate itself is killed.** Evidence: debug report section 5. The supervisor's domain
   sweep (`domain_kill_all` after grace plus slack) and a dead bwrap monitor end the gate without its
   hand-back, so queued input survives. Benefit: closes the last path to the shell. Option: the
   supervisor opens the pane tty read-only by the shell's `/proc/<shell>/fd/0` path and flushes after the
   sweep. Needs owner choice (new reach into the pane's tty).
2. **Why the agent never read its tty.** Evidence: 02:43 omp drew its banner and never read for 18 s
   (unread size reply). Benefit: the seat would start. Separate seat-start item.
3. **Name the branch on `delivery-unknown`.** `supervisor.log` stays empty on that outcome (also noted
   in the 2026-10-20 pi report); the 02:43 diagnosis had to be reconstructed from timing. Benefit:
   one-sample diagnosis next time.
4. **Strengthen the foreground fact** to "the foreground process descends from the launched root" for
   launched slots. Today any non-shell program in the foreground passes; a shell that already started
   running typeahead (`fgos run` from a backtick) would be such a program, though by then the
   supervisor's own stop check refuses first. Benefit: the guard's claim becomes exact. Needs a process
   ancestry read in terminal-control (fgos-process has `relations`).
