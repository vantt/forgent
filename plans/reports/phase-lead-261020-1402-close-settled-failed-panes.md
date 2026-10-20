# Close settled failed panes

The owner decision of 2026-10-20 14:00 is implemented in `disposition_for`. Earlier settlement receipts, recognized gate exit facts, and valid SHA-256 digests for both capture files now close a pane even without an outbox result or with a blocked/question reason. Missing facts, gate/carrier loss, abandoned attempts, failed settlement and unknown outcomes retain it. Configuration defaults are unchanged; existing retained panes are not revisited.

Recognized exits: agent → exited (including SIGTERM/non-zero); cancel → cancelled; soft-deadline/idle/hard-ceiling → timeout; output-limit → output-limit; orphan + orphan-result + outbox → exited. Digests certify readable capture files at receipt publication, including legitimately empty files; this change does not introduce terminal-output recording.

The four supplied receipts were read without mutation: one exited/SIGTERM/stoppedBy agent; two cancelled/needs-human; one cancelled/delivery-unknown. All have both digests and no outbox. Each now qualifies after successful settlement.

Prior art: `git log -S'disposition_for'` identifies ad4d68ce1, which introduced the clean-success-only rule. `git log -S'retainFailedPaneMs'` identifies fef1ed59f and b3d732912: explicit null retention is intentional and preserved. Reused existing receipt gateExit/captureDigests and the terminal core's expired-retention foreground guard, now shared with immediate allocated-slot close. Unrelated foreground processes and unreadable process facts refuse close; attached-pane behavior and incarnation checks remain intact. No new infrastructure, configuration, receipt fields or execution mechanisms.

Impact-analysis: inactive (`fgos tool query --capability impact-analysis --status present` returned zero providers). Direct callers: release-slot via run_steps; terminal-control release and expired-retention scan share the safety predicate. Scope includes supervisor/adopt settlement and allocated-slot close; no running-attempt lifecycle changes.

Changed assertions (old → new):

- release_slot_step matrix: timeout/cancelled retain → close with gate/capture facts; output-limit added as close. Lost/abandoned outcomes remain retain. Clean fixtures now provide those facts.
- supervise_terminal_fake_herdr blocked cancellation: retain/no pane.close → close/exactly one pane.close. Fixture prepares capture files like the real controller; normal and adopted result close expectations remain unchanged.
- terminal-crash-matrix deadline: retain/0 closes → close/1 close.
- terminal-cutover provider limit: retain → close; trust prompt: 0 closes → 1; abandoned-not-started still retains.
- terminal-fallback: limited attempt retain → close; two-candidate closes 1 → 2; three-candidate closes 1 → 3; exhausted single candidate closes 0 → 1. Classification assertions remain unchanged.

Added uncertainty cases for each missing capture, malformed digest, missing gate exit, inconsistent and unknown outcomes; deadline and adopted-result cases; foreign foreground refuses close and a later shell permits retry. Existing failed-step, retry, lost-carrier and incarnation protections remain asserted.

Verification commands and final results are recorded below. No full npm suite, staging or commit was run.

- `cargo test -p fgos-run-supervisor -p fgos-terminal-control`: 216 passed, 0 failed, 1 ignored. After adding the final deadline/adopt matrix row, `cargo test -p fgos-run-supervisor --test release_slot_step`: 8 passed.
- `cargo test -p fgos-terminal-control`: 85 passed, 0 failed, 1 ignored after the foreground helper's final cleanup.
- `cargo clippy -p fgos-run-supervisor -p fgos-terminal-control --all-targets -- -D warnings`: passed.
- `cargo build -p fgos`: passed; focused Node tests use this checkout's host.
- `XDG_STATE_HOME=/tmp/fgos-pane-close-xdg FGOS_HOST_BIN="$PWD/target/debug/fgos" node --test test/run-supervisor/*terminal*.test.mjs test/setup/terminal-control-checks.test.mjs`: 57 passed, 0 failed, 5 skipped (PID-namespace bwrap unavailable).
- `git diff --check`: passed. No commit; impact detect_changes is inactive with no registered provider.

Concerns: five Node tests require unavailable PID-namespace bwrap (including the fallback integration cases). Initial Node invocation without XDG_STATE_HOME failed on the sandbox's read-only attestation directory; the retry uses a writable temporary state directory. MDView preview failed because its database is read-only. The required program-board lane update is outside this assignment's write scope and was not written; requested follow-up path is listed in needsWrites.

Status: DONE_WITH_CONCERNS
Summary: Close settled, captured dead-worker panes with fail-safe retention and a shared foreground guard. Rust verification is green; Node verification is recorded above.
Concerns/Blockers: sandbox bwrap coverage and administrative program-board update as above.
Context refs:
- (none)
Expected outputs:
- (none)
