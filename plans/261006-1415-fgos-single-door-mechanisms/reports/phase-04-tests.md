# Phase 04 Node test report

## Scope and isolation

Execution checkout: `/home/vantt/projects/worktrees/forgentX-single-door-execution`. All test commands unset `CLAUDE_CODE_SESSION_ID` and use ignored runner stdin. No Cargo build, formatter, linter, full npm suite, source edit, or main-checkout activation performed by this test slice. The permanent dev-host suite substitutes only its Cargo builder and executes the existing real release host/verifier plus copied production Node consumer.

## Initial observed results

| Run | Tests | Pass | Fail | Skip | Wall time | Outcome |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Focused drift + dev-host, before fixture corrections/review fixes | 46 | 40 | 6 | 0 | 1.556 s | exit 1 |
| Initial neighbors | unavailable | unavailable | unavailable | unavailable | 240 s deadline | runner timeout |

### Initial focused command

```sh
env -u CLAUDE_CODE_SESSION_ID node --test test/setup/active-release-drift-check.test.mjs test/rust-host/dev-host.test.mjs
```

Full output: [phase-04-tests-focused.log](phase-04-tests-focused.log).

All six observed failures:

- `dev-host.test.mjs:84`: each of default, shared-default, relative and absolute Cargo output layouts exited 4 with `fgos: list: work "dev-consumer" not found.` Parent diagnosed the fixture store at workspace root, while the actual unchanged CLI contract selects the exact invoking nested cwd. The production wrapper contract was not changed to accommodate the test.
- `active-release-drift-check.test.mjs:268`: case-sensitive `/duplicate/` mismatched safe failure message `Duplicate manifest source path...`. Newly introduced wording-sensitive assertion, flagged rather than repinning production wording.
- `active-release-drift-check.test.mjs:290`: expected `envelope.ok === true`; actual field was undefined. Newly introduced nonexistent-envelope-field assertion, flagged to fixture owner.

Owners corrected fixtures after this run. The initial failures remain evidence; they were not rerun merely to confirm the known errors.

### Initial neighboring command

```sh
env -u CLAUDE_CODE_SESSION_ID node --test test/setup/checks.test.mjs test/setup/registrations.test.mjs test/rust-host/release-tree.test.mjs test/rust-host/fgctl-init.test.mjs test/rust-host/fgctl-upgrade.test.mjs test/rust-host/fgctl-stage.test.mjs test/setup/checks-setup-envelope.test.mjs test/setup/checks-setup-idempotent.test.mjs test/setup/doctor-strict-exit.test.mjs
```

Evidence: [phase-04-tests-neighbors-initial-timeout.log](phase-04-tests-neighbors-initial-timeout.log). Python `subprocess.run` raised `TimeoutExpired` after 240 seconds. Captured stdout/stderr were not persisted before the exception; the tool did not display partial output. No individual test outcome or suite totals can be claimed. Attempts to recover the exception through `sys.last_value` and `get_ipython` were unavailable. The timeout is not attributed to native stdin behavior without evidence.

## Cleanup and exclusions

Focused fixtures declare `finally` cleanup of their isolated temporary directories. No temporary helper script was created by this slice. Process inspection after the initial timeout found no surviving matching Node test/native descendants; no process was killed and no blanket `pkill` or deletion performed. Existing native proof `/tmp/fgos-phase02-native-handoff-wldroe6x` and all prior evidence were preserved. Report/log files are intentional durable evidence, not disposable scaffolding.

Coverage instrumentation, Cargo/build verification, live runtime probes, and full npm tests are outside this assignment. Registry consumers are covered by the neighboring registry/setup suites; the private legacy-release resolver retains its preexisting default caller path, with changed behavior exercised by the focused comparator suite.

## Final post-review verification

Parent explicitly authorized these runs after both source owners completed review-driven safety/concurrency fixes and corrected the newly introduced fixtures. These runs verify the changed revision, rather than merely reconfirming an observed failure. Durable stdout/stderr logging began before each process started; each owned process group had a 900-second deadline. Neither deadline was reached.

| Run | Tests | Pass | Fail | Skip | Cancelled / TODO | Wall time | Outcome |
| --- | ---: | ---: | ---: | ---: | --- | ---: | --- |
| Focused current revision | 65 | 65 | 0 | 0 | 0 / 0 | 3.841 s | exit 0 |
| Neighbors current revision | 224 | 224 | 0 | 0 | 0 / 0 | 227.359 s | exit 0 |
| Final exercised total | 289 | 289 | 0 | 0 | 0 / 0 | 231.200 s | both successful |

Commands:

```sh
env -u CLAUDE_CODE_SESSION_ID node --test --test-reporter=tap test/setup/active-release-drift-check.test.mjs test/rust-host/dev-host.test.mjs
env -u CLAUDE_CODE_SESSION_ID node --test --test-reporter=tap test/setup/checks.test.mjs test/setup/registrations.test.mjs test/rust-host/release-tree.test.mjs test/rust-host/fgctl-init.test.mjs test/rust-host/fgctl-upgrade.test.mjs test/rust-host/fgctl-stage.test.mjs test/setup/checks-setup-envelope.test.mjs test/setup/checks-setup-idempotent.test.mjs test/setup/doctor-strict-exit.test.mjs
```

Full output:

- [phase-04-tests-focused-post-review.log](phase-04-tests-focused-post-review.log): TAP duration 3813.802 ms. Includes successful `concurrent dev consumers with distinct Cargo targets keep independent verified artifacts`, plus review-added manifest namespace safety cases.
- [phase-04-tests-neighbors-post-review.log](phase-04-tests-neighbors-post-review.log): TAP duration 227317.067 ms. Covers every requested neighboring test file plus strict doctor exit behavior.

No new failure, skip, cancellation or TODO occurred in the final runs. No Cargo invocation by this slice outside the permanent tests' substituted fixture builder. No test/source adjustment made by this slice. Normal test completion required no process-group kill or additional owned scaffolding cleanup.
