# HARDEN T5 phase 06: launch failure path (lead report)

Branch `harden/t5-p06` on `origin/main` 0029e325b. Commits: `2cb0392da` (red rows), `b74463c96` (fix, docs, census). Not pushed.

## What changed

- **Controller `finally`** (`assignment-runner.mjs`). One order rule, written as a comment: a launch that never reached its supervisor gives back what it made before the handover, still under the attempt lock (the pane via `abandon()`, then the private home via `finalizeAttemptHome`, which stages a renewed login first), and only then is the intent replaced or removed. A home kept for a retry (`credential-home-kept`) or one that cannot be judged keeps the intent, so the adopt door's finalize-home step retries it. No new cleanup code: the helper `giveBackAttemptHome` only calls the existing door and maps its answer.
- **Intent with the pane** (`direct-launch.mjs`, `herdr-round.mjs`, contract `attempt-intent.v1.json`). `writeAttemptIntent` takes `pane` and writes `terminal: {slot: {key, groupKey}, endpointEnv}`. `prepareTerminalAttempt` takes `beforeAllocate` and calls it right before `allocateAsync`; the controller is the only writer (`publishIntent`). Once the pane is given back on the failure path, the intent is published again without `terminal`, so adopt never waits on it. The contract stays at version 1: the adopt reader already ignored unknown fields (P01 row 10 showed adopt still reported `adopted` with the extra field).
- **Adopt** (`adopt.rs`). An intent with `terminal` is valid only when its mode is terminal, `slot.key` equals `attemptId` and `endpointEnv` holds only `FGOS_HERDR_*`/`HERDR_*` strings. The envelope adopt writes gets `slot` and the `release-slot` builtin, and the endpoint is recorded as `terminal-endpoint.json` (the file the supervisor would have written), so `Backend::from_env` reaches the pane from the adopter's environment.
- **A controller killed after naming the pane but before terminal-control recorded it** (`terminal_slot.rs`, `steps.rs`; extra scope the coordinator assigned). `release` returns `ReleaseFailure::NoRecord` when terminal-control keeps the slot as unknown and no incarnation store ever recorded the key (a record that cannot be read counts as present). `release-slot` of an `adopt-not-started` envelope takes that as done (receipt detail `noRecord: true`); a started attempt maps it to Retry as before.
- **Doctor `credential-copies-retained`** (`registrations.mjs`). It fails for a v2 attempt home whose run directory has neither `envelope.json` nor `attempt-intent.json`, naming the attempt, the home and the hand recovery. A home already listed as kept is not counted twice.
- **Docs**: `envelope.v3.json` (`origin`, `mode`, `slot`), run-supervisor `spec.md` (intent row in section 3, release-slot row in section 7, section 8, one decision-history line dated 2026-11-06), packaging-distribution spec row 7 and agent-confinement spec line 768 (one clause each on the new doctor case), and a CHANGELOG `[Unreleased]` line.

## Red to green

| Row | Red (first commit, before the fix) | Green |
|---|---|---|
| terminal-cutover "a launch refused before the handover leaves no attempt home and no pane" | `the refused launch left its private home behind` | pass |
| adopt_matrix `adopt_an_intent_whose_controller_opened_a_pane_decides_what_becomes_of_that_pane` | `adopt closed the attempt and never decided what becomes of its pane` | pass |
| same terminal-cutover row, added assertion "the intent still names the pane" | red with the re-publish disabled (checked by a temporary edit, then reverted) | pass |
| adopt_matrix `adopt_an_intent_whose_pane_was_never_allocated_closes_with_nothing_to_release` (new) | new behaviour (before, `release-slot` would have retried forever) | pass |
| credential-copies-retained-check "an attempt home whose run has neither an envelope nor an intent fails naming the attempt…" (new case) | new behaviour | pass |

No tests retired.

## Gates

- Focused Node, after the rebase: 22 files (owning tests, every test importing a touched module, architecture, contracts, doc-health, decision-citation drift). 487 tests: 486 pass, 0 fail, 1 skipped.
- `cargo test -p fgos-run-supervisor`: all pass. Clippy `-D warnings` clean; `cargo check` for `x86_64-pc-windows-msvc` and `aarch64-apple-darwin` clean.
- `cargo fmt --all --check`: my files clean. Two diffs come from main, in files I did not touch: `apps/fgos/src/wiring/mailbox_remote.rs:275` and `packages/convention/rust/tests/golden.rs:283`.
- Census regenerated: 0 undeclared.
- Full suite: 8651 tests, 8618 pass, 1 fail, 32 skipped, no `run-tests: ERROR` line. The one failure is the known red test that was already failing on main: "the frozen V7n addendum…" in `test/scripts/mailbox-behaviour-v7n.test.mjs`.

## Size against the phase budget

Phase estimate: Node +15, Rust +15, tests +40. Measured net, census excluded:
- Node src: +73. The controller give-back, the intent re-publish and the helper account for +35; the doctor scan and its recovery text for +28.
- Rust src: +62. Adopt validation, slot copy and endpoint record: +38. `NoRecord`, which the coordinator added to scope: +24.
- Tests: +120 (both P01 rows +73; the new adopt case plus shared helpers, the doctor case and the intent assertion +47).

The coordinator accepted the overrun.

## Deviations from the phase file

- `release_slot_step.rs` is untouched. The `NoRecord` case lives in adopt_matrix, because only an `adopt-not-started` envelope reaches it.
- `terminal_slot.rs` changed, although the phase file does not list it. The coordinator assigned this, since no other running phase owns the file.
- An attempt that never started keeps its pane under the default retain window (`disposition_for` is unchanged). P01 left this choice to this phase; on the live failure path `abandon()` already closes the pane.

## For other phases and the lead

- The pane smoke from "Done when" was not run: it is a deliberately failing launch on a live herdr with a scratch config. The terminal-cutover row runs the same refusal over the fake herdr.
- The owner-machine guide section is the lead's to write. On-disk effect: intents may now carry `terminal`. An older adopt ignores the field and closes the attempt without deciding its pane. Nothing is refused.

Status: DONE
Summary: A launch refused before the handover now gives back its home and its pane, and an intent-only adopt releases the pane by key, including a pane that was never recorded. Doctor now counts an attempt home that no door will finalize. All gates are green except the known V7n test.
