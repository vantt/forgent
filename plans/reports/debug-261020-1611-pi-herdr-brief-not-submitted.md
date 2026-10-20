# Debug: pi-herdr brief pasted but not submitted (`terminal:delivery-unknown`)

## Summary

Two different failures were filed as one symptom.

1. `unit-run-1792472466410-504a2171` (delivery-unknown at about 12 s): pi takes a long raw-typed brief slowly, and its first Enter is swallowed while it is still taking in the text. Same class as the codex bug fixed in `bcc1ef758`, but pi was left on the typed path: `packages/agent-protocol/rust/src/terminal/pi.rs:8` has `submit_by_prompt_door: false` (the codex commit only added the field to pi with `false`). The supervisor then reaches `DeliveryUnknown` and cancels the run.
2. `unit-run-1792472683870-e7b727bf` (ran to the 900 s timeout): not a delivery problem. The brief was submitted; pi printed `Error: 402 ... requires more credits` (OpenRouter account out of credit, `stdout.log` lines 59-60) and then sat idle at its prompt with no outbox result until the timeout. The hang has no provider-error detection for pi.

Item 2 of the appendix in `spec-draft-261020-1017-seat-binding-component.md` (a missing pi account `auth.json`) is a third cause of the same code. It is not what happened here: run 2 shows the key worked (the 402 came from OpenRouter).

## Evidence

Code path: `deliver_brief` (`terminal/mod.rs:381`) types with `pane send-text` (submit false), pauses `enter_gap_ms` (pi 300 ms), presses Enter, then `confirm_submitted` (`mod.rs:432`). `confirm_submitted` returns `DeliveryUnknown` early when the inspector has no state, when no draft is seen on 4 consecutive idle polls and the brief is not echoed (`brief_echoed`), or after 6 spaced Enters. The supervisor turns that into `begin_stop("cancel", "terminal:delivery-unknown")` (`run-supervisor/rust/src/supervise/terminal.rs:528,705`), which is the `stop-requested.json` (`cause: cancel`) in the run dir and the `supervisor.log` line `outcome: cancelled`.

Config: `deepseek` invocations `pi-herdr` and `codex-herdr` both use `adapter: herdr-spawn`. Codex has `submit_by_prompt_door: true` (`terminal/codex.rs`), pi has `false` (`terminal/pi.rs`). `git log -S'submit_by_prompt_door'` finds only `bcc1ef758` (2026-10-18), which set codex true and agy/claude/omp/pi false. The codex debug report says explicitly that claude, pi, agy and omp were not tested ("Needs an owner call"). So pi did not get the treatment, by omission.

herdr has no detection rule for pi: `herdr agent explain` gives `agent: pi, state: idle, rule: none, fallback_reason: default_known_agent_idle_fallback`. So pi reads `idle` until its spinner appears, and the supervisor's state check sees nothing that says "still typing".

Live measurements (pi 1.x, account `openrouter`, model `deepseek/deepseek-v4.1-flash`, brief-1.md 4.4 KB, scratch panes):

| Delivery | Result |
|---|---|
| `send-text` + 300 ms + Enter, 4 trials | submitted each time, but the delay from Enter to herdr `working` was 25 s, 7 s, 12.5 s, 18 s while the state stayed `idle` with a half-typed composer |
| `send-text` + 300 ms + Enter, 5th trial | NOT submitted: full brief sat in the composer, state `idle` (screen at +2.5 s showed the text still being typed); one extra manual Enter submitted it (`working`) |
| `herdr agent prompt`, 3 trials | submitted first try, `working` after 2.2 s each |
| full `fgos run --provider deepseek` x4 (forced to the openrouter account with `--override '{"model":"deepseek/deepseek-v4.1-flash"}' --account openrouter/openrouter`) | 2 passed; 1 failed `delivery-unknown` at 14.5 s with the brief on screen and an empty-looking composer (unit-run-1792486418676-440c9fe3, same shape as the 12:01 run); 1 failed at 54 s with no brief on screen (unit-run-1792486248935-91c07cc0) |

Reading: raw typing of a 4 KB brief into pi is slow (7 to 25 s) and flaky, and the first Enter can be lost; the typed path only works when the supervisor's draft detection happens to hold across that whole window. Runs fail at 12 to 15 s from launch, which is shorter than 6 spaced Enters would take (about 15 s after typing starts), so the short exit is the no-draft-for-4-polls or no-state branch of `confirm_submitted`, not Enter exhaustion. I did not capture the supervisor's per-poll view, and `supervisor.log` stays empty on `DeliveryUnknown`, so which branch fired in each failing run is inferred, not proven.

Why the same executor passed at 15:48 today (`unit-run-1792486063886-defbaf2a`): that run used the `thehive` account and model `thehive/deepseek-ai/deepseek-v4.1-flash-1017` (config commit `69867e09b`, 15:24), a faster provider path. Both failing runs of this report (12:01, 12:19) used OpenRouter. Failures are flaky and depend on pi's response latency, not on the account itself.

## Eliminated

- Missing credentials for the 12:01 and 12:19 runs: run 2 reached the provider (402 from OpenRouter), and the account was usable in my four runs.
- `herdr agent prompt` swallowing Enter: 3 of 3 submit, 2.2 s.
- Stale release: the supervisor release carried `bcc1ef758` already; the pi profile is unchanged by it.
- pi vs herdr itself: plain `send-text` + Enter of a short line works; the failure needs a long brief.

## Proposed fix

One door, reuse the codex mechanism. Smallest change:

1. `packages/agent-protocol/rust/src/terminal/pi.rs`: `submit_by_prompt_door: true`, with a doc line stating why (pi takes a long raw-typed brief slowly and loses its first Enter, measured 2026-10-20). `deliver_brief` then sends one `SendInput { text, submit: true }`, which `Driver::send_text` already routes to `herdr agent prompt` (`packages/terminal-control/rust/src/driver/herdr.rs`). Keep `confirm_submitted` as the safety net.
2. Same decision to be recorded for the other profiles: omp, claude and agy are still on the typed path and untested; test each live with the same table before flipping (one owner call, as in the codex report). omp and agy use the same herdr door.
3. `docs/platform/agent-protocol/spec.md` row for pi (line near 78): state the brief goes through the prompt door; `CHANGELOG.md` `[Unreleased]` line.
4. Rebuild and stage the release so `fgos` runs it (plain `fgos` runs the activated release).

Test idea: replay fixture in `packages/agent-protocol/contracts/fixtures/terminal/pi/vectors.json` (the codex change edited the matching codex file) for a pi composer that is half typed with an empty or short-line bottom window while idle, asserting delivery goes through one prompt-door send; plus a unit test that `Terminal::for_cli("pi")` has `submit_by_prompt_door == true`. Live check: run the `fgos run ... --provider deepseek --override '{"model":"deepseek/deepseek-v4.1-flash"}' --account openrouter/openrouter` command from the task 5 times; all must reach a result file.

## Separate defect (not fixed by the above)

A pi pane that prints a provider error (402, no API key) goes idle and the supervisor waits to the full timeout (run 2: 900 s). `detect_completed` (`terminal/mod.rs:518`) only recognises quota-limit lines; pi's `Error: 402` / `No API key found` lines are not classified as `Blocked`/`NeedsHuman`. Worth an item: classify pi provider-error lines so the run ends in seconds with the real reason. `classify_blocked` already has `is_auth_failure` for login failures; check whether `Error: 4xx` fits there.

Also: `supervisor.log` is empty on `DeliveryUnknown`; log which branch fired and the last inspect state, so the next case does not need a live repro.

## Unresolved

- Which `confirm_submitted` branch cancelled each failing run (inferred from timing, no per-poll log).
- Why pi swallows the first Enter (likely its input buffering of a long typed burst; not proven).
- Whether omp, claude and agy have the same weakness (not tested).
- The 54 s failure (no brief on screen at the end) may be a third path (send error then not surely untouched); only one sample.

Cleanup: all scratch panes and tabs closed; no repo files edited other than this report.
