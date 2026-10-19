# Debug: codex pane keeps the brief unsubmitted (wS:p5TH)

## Summary

The brief is not delivered by `herdr agent prompt`. The run-supervisor (Rust, `packages/agent-protocol/rust/src/terminal/mod.rs:350-375` `deliver_brief`) types the text with `pane send-text` (submit:false), waits `enter_gap_ms` (600 ms for codex), presses `Enter` via `pane send-keys`, then runs `confirm_submitted` (re-presses Enter up to 6 times, 2.5 s apart, 60 s budget; `common.rs:19-27`).

For a long text typed raw, codex 0.163 swallows the first several Enters. In the real run the Enters ran out, `deliver_brief` returned `DeliveryUnknown`, `drive()` called `end_early` (`packages/run-supervisor/rust/src/supervise/terminal.rs:645-651`), the supervisor exited (pids 3567203/3567229 gone; `supervisor.log` empty), and the pane was left holding the draft. The run's status is now "settled" with an empty outbox.

`herdr agent prompt` (bracketed-paste door) submitted the same brief first try 5/5 times. The bug is therefore in the type+Enter path, not in herdr's prompt door.

## Evidence

Reproduction, own pane, codex v0.163.0, trusted dir under the repo, same brief-1.md (7034 bytes, Vietnamese, multi-line):

| Delivery | Result |
|---|---|
| `agent prompt` short single line | submitted |
| `agent prompt` full 7 KB brief, 4 runs | submitted first try, 4/4 |
| `send-text` short line, +0.6 s Enter | submitted |
| `send-text` 3 short lines, +0.6 s Enter | submitted |
| `send-text` 1200 `x` single line, +0.6 s Enter | NOT submitted; composer shows `[Pasted Content 1024 chars]xxx...`; the 2nd Enter submitted |
| `send-text` 60 Vietnamese lines | NOT submitted after the 1st Enter |
| `send-text` full brief, +0.6 s Enter | NOT submitted; Enter at 8 s also not; later, on 3 more trials, Enter 1-3 (or 1-5) were swallowed and Enter 4 (or 6) submitted |
| `send-text` full brief, wait 25 s, one Enter | NOT submitted; submitted only on the 3rd further Enter |

Findings:

- Waiting longer does not help (25 s case). The count of Enters matters, not the gap.
- The viewport moves after each Enter and blank lines appear at the draft's end, so the swallowed Enters most likely insert newlines into the composer. I did not prove the codex-internal cause (paste-burst handling).
- The count needed varies (4 to 6+). The supervisor allows 1 initial + 6 spaced Enters and also needs `draft_still_in_composer` to be true at each poll, so it is borderline.
- This is flaky, not deterministic. Codex runs today with 8242 and 10391-byte briefs settled with outbox files (`unit-run-1792312429461-1743019e`, `unit-run-1792339202335-5d7a9d83`); this 7034-byte one did not.
- The pane's composer text matches the screen: `[Pasted Content 1764 chars]` sits mid-line inside the draft, followed by `preserve dissent.` and the rest of the brief.

Secondary defect: `has_paste_chip` (`common.rs:83-93`) does not know codex 0.163's chip wording `[Pasted Content N chars]`. Draft detection then depends on the head/tail needles or `holds_a_window`, which is weaker. Commit 40a19a981 (2026-10-18 14:32) fixed a similar codex long-paste case and 020e24d6d changed the dialog wording; the release `a6bcdc29...` (built 17:06) contains both, so this is not a stale binary.

Eliminated:

- `herdr agent prompt` swallowing the Enter: it is not used on this path, and works.
- A short-line or Vietnamese-only issue: short and 3-line texts submit; the trigger is length over about 1000 chars.
- A stale supervisor binary: release built after the codex fixes.
- A trust or login dialog: the pane shows the normal composer.

## Proposed fix (smallest)

Deliver the brief through herdr's own prompt door, for the codex profile only.

1. `packages/agent-protocol/rust/src/terminal/mod.rs`: in `deliver_brief`, when the profile says so, call `io.send(&SendInput { text: Some(message), keys: None, submit: true })` once instead of `type_brief` + pause + `press_enter`. `TermIo.send` goes to `Driver::send_text(..., submit=true)`, which already runs `herdr agent prompt` (`packages/terminal-control/rust/src/driver/herdr.rs:508-515`). Keep `confirm_submitted` unchanged as the safety net.
2. `terminal/codex.rs`: add a profile field such as `submit_by_prompt_door: true`; other CLIs keep their tuned path (the fixtures in `contracts/fixtures/terminal/` cover them).
3. `common.rs`: add `[pasted content ` to `has_paste_chip` as a bracket chip, with a fixture from this pane.

Why this and not the alternatives:

- The prompt door submitted 5/5 here; type+Enter fails for large text in codex.
- Raising `SUBMIT_MAX_ENTERS` or the interval only moves the odds, and every swallowed Enter pollutes the draft with a newline.
- A short pointer prompt ("read brief-1.md and follow it") would also work and sidesteps paste handling, but it reverses the inline-delivery decision (plan 261014-1710-herdr-inline-prompt-delivery: the owner wants the brief visible in the pane). Use it only as a fallback if the prompt door fails live.

Needs an owner call: whether to apply the prompt door to every CLI. I tested codex only; claude, pi, agy, omp were not tested.

## Recurrence prevention

- Add a fixture or replay test for codex long raw-typed text where the first N Enters are swallowed, to prove the new path no longer depends on Enter count.
- `supervisor.log` is empty after `DeliveryUnknown`; log the outcome and the Enter count so the next case is diagnosable without a pane read.
- `run.json` stays `running`/`delivery: not-sent` after the supervisor exits; the controller should surface `delivery-unknown`, not wait.

## Unresolved

- Exact codex-internal reason for the swallowed Enters (paste-burst newline insertion is my inference).
- Why the pane in the task was never retried or cleaned after `DeliveryUnknown` (the supervisor exited; the pane is left open by design for needs-human).
- Behaviour of other CLIs under the prompt door.

Cleanup: scratch tab wS:tR2 closed, codex quit, scratch dir removed. No repo files edited other than this report.
