# Close settled failed panes — unit 2

Follow-up to [unit 1](phase-lead-261020-1402-close-settled-failed-panes.md) after the host gate of 58c530e13.

## A. No final retain while settlement is pending

`run_steps` (`packages/run-supervisor/rust/src/steps.rs`) runs the builtin `release-slot` only when every process step has a receipt. Before, a *failed* earlier step still ran release-slot with `earlier_done=false`, which published a final `retain` receipt; a receipted step never runs again, so the next resume/adopt could not re-decide. Now a failed step is treated like a retry: no release-slot receipt, and the pass that completes the step decides with the full facts. `disposition_for` lost its `earlier_steps_done` argument (always true where it is called). Every other step keeps the "a receipted step is not re-run" rule. A final `retain` now comes only from the receipt facts (unit 1's rules). Trade-off: a step that fails forever leaves the slot allocated and undecided rather than retained with a window. The pane is kept either way, and every adopt pass retries the step.

Tests: `release_slot_step.rs` `a_pending_settlement_leaves_the_slot_undecided_until_it_completes` (settle exits 66 → no release receipt, no close; host back → settle done, pane closes once). It replaces the old "earlier step failed → retain" assertion.

## B. Cause of exit 66

The cause is confirmed from the smoke attempt `unit-run-1792482363495-797e4401` (read only). Cancel was requested at 07:46:49.653, the receipt was published at 07:46:50.538, and release-slot ran at 07:46:50.631. The controller parks on cancel and exits. `scripts/run-rust-dev-host.mjs` then deleted `.fgos/runtime/dev-host/run-Gs1777` in `finally`, while the detached supervisor was running settle-attempt with `hostBin` set to that directory. `attempt-step.mjs` `verifyPayload` throws `payload-missing` (66) when `realpath(envelope.hostBin)` fails. The directory is still gone now.

Fix at the owner: the dev door removes its run directory only when no process runs from it (exe or cwd inside, read from `/proc`). Otherwise it leaves the directory, and a later invocation prunes `run-*` directories that nothing runs from and that are at least 10 minutes old (so a directory a concurrent invocation is still staging is never pruned). The `/proc` scan is reused, not copied: `processesInside(dir)` was extracted from `src/runner/dispatch/stop-processes-inside.mjs`, and `stopProcessesInside` now calls it. There is no env switch. Prior art: `git log` on the script (37321ec5a → f053de033 → 1cd91c992) shows per-invocation cleanup since the start, with no prune helper before this one. Per-invocation staging was kept instead of content-digest staging because `test/rust-host/dev-host.test.mjs` (outside this scope) asserts that a completed invocation leaves the runtime directory empty, and it still passes.

Tests: `test/scripts/run-rust-dev-host-staging.test.mjs` uses a real executable copied into a run directory. While a detached process runs from it, the directory is kept and also survives a stale prune; after the process is killed it is pruned. An unused directory is removed at once, a young one is never pruned, and entries that are not `run-*` are left alone.

## C. Stale terminal-control tests

`fake-herdr.sh` has a new fixture knob, `FAKE_HERDR_FOREGROUND=shell`, which answers from the existing `pane-process-info-shell.json`. The default is still the foreign `sleep 300`. `group-queue` and the client-route "every operation" test use the shell foreground. A new client-route test shows that a foreign foreground keeps the pane (`kept-unknown`, no `pane close`) and that the close goes through once only the shell is left.

## D. terminal-fallback timeouts and the retain/close mismatch

The brief-typed timeouts come from a fixture limit, not the environment. `fake-herdr-pane.py` had a single pane `fk:p1` with one global `closed` flag. Unit 1 made the limited attempt's pane close, which set `closed`. The next candidate's `tab create` got the same `fk:p1`, every pane command answered `pane_not_found`, and no brief was ever typed. Before unit 1 the limited pane was retained, so this never showed. Fix: the fake opens a new pane per `tab create` (`fk:p1`, `fk:p2`, …) with a per-pane `closed.<pane>` and `script.<pane>.pid` (`script.pid` still names the newest command). The first pane is still `fk:p1`, so the Rust assertions are unchanged. No test was weakened.

The retain/close mismatch (diagnostic run: limited attempts recorded `retain` although `disposition_for` returns Close for their receipt) means an earlier settlement step had no receipt when release-slot ran. Unit 1 then wrote a final retain, which is exactly the A defect. With A, such a pass leaves the slot undecided instead. The failing step in that diagnostic run cannot be named: its fixture directory no longer exists, and the fallback tests need PID-namespace bwrap, which this sandbox lacks. I confirmed it here: an unconfined copy cannot run because the config requires a confined credential store.

## E. Added tests

- `a_cancellation_not_stopped_by_cancel_retains` (stoppedBy agent, orphan, soft-deadline, unknown → retain, no close).
- `immediate_close_without_process_info_is_kept_without_a_release_marker` (`core_failures.rs`).
- The pending-settlement test from A.

## Verification (sandbox)

- `cargo test -p fgos-run-supervisor -p fgos-terminal-control`: 219 passed, 0 failed, 1 ignored.
- `cargo clippy -p fgos-run-supervisor -p fgos-terminal-control --all-targets -- -D warnings`: clean.
- `cargo build -p fgos`, then `XDG_STATE_HOME=$PWD/.fgos/runtime/tmp/u2/xdg FGOS_HOST_BIN=$PWD/target/debug/fgos node --test test/terminal-control/*.test.mjs test/run-supervisor/*terminal*.test.mjs test/setup/terminal-control-checks.test.mjs`: 81 tests, 76 passed, 0 failed, 5 skipped (bwrap).
- `node --test test/plugins/terminal-skill-attach.test.mjs test/run-supervisor/crash-matrix-adopt-resume.test.mjs`: 7 passed, 30 skipped (bwrap), 0 failed.
- `node --test test/scripts/run-rust-dev-host-staging.test.mjs`: 2 passed. `node --test test/rust-host/dev-host.test.mjs`: 10 passed.
- `git diff --check`: clean. Impact analysis: inactive (`fgos tool query --capability impact-analysis --status present` returned zero providers). The callers of `run_steps` are supervise and adopt; `disposition_for` has one caller (`release_slot`).

## Needs the host (bwrap + herdr)

- `test/run-supervisor/terminal-fallback.test.mjs` (all 4) and the confined case in `terminal-cutover`. They should now pass the brief-typed wait. If a limited attempt still does not close, the cause is a failing settlement step, and its `supervisor.log` will name it.
- The real herdr cancel smoke through `npm run fgos:dev`: settle-attempt should exit 0, and release-slot should then record `close`.
- The pane leaked by `unit-run-1792482363495-797e4401` has a final `retain` receipt from before this fix; it needs a person to close it.

## Out of scope (needsWrites)

- `AGENTS.md` says the dev door removes "only its own directory after the child exits"; it now keeps that directory while a process runs from it and prunes it later.
- The program-board lane row (`plans/261017-1313-fgos-platform-program-board/plan.md`).

Status: DONE_WITH_CONCERNS
Summary: Release-slot no longer writes a final retain while a settlement step is pending, the dev door keeps a staged host a detached supervisor still runs from (the cause of exit 66), and the stale tests and the single-pane fake herdr are fixed. Rust and focused Node tests are green here; the bwrap fallback suite and the herdr smoke need the host.
Concerns/Blockers: The step that failed in the earlier fallback diagnostic cannot be named without the host. The dev-door prune reads /proc, so on macOS the old delete-on-exit behaviour remains. Two out-of-scope doc updates are listed above.
Context refs:
- (none)
Expected outputs:
- (none)
