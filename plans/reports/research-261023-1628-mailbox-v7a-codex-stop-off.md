---
title: "Mailbox V7a: Codex Stop channel off"
description: "Phase 1 of plans/261023-1411-mailbox-v7-codex-postooluse-pi-omp-and-aliases: the adapters contract records each hook channel's role, a Codex Stop claims nothing, and a send toward Codex spends no wake; one benign live C1 run."
date: 2026-10-23
---

# Mailbox V7a: Codex Stop channel off

Branch `mailbox/v1-v3`, commits `dfbcbe30c` (feature) and `38948c01d` (live suite run home). Plan: `plans/261023-1411-mailbox-v7-codex-postooluse-pi-omp-and-aliases/phase-01-codex-stop-channel-off.md`.

## What changed

- `packages/mailbox/contracts/adapters.v1.json`: `hookFacts.<cli>.channels.{stop,postToolUse} = {deliver, role, source}`. Codex: `stop` `deliver:false`, role `user`; `postToolUse` `deliver:true`, role `developer` (source: V6 preparation report, "Codex channel roles"). Claude Code: both deliver; the role is the transcript record type, prefixed `transcript:`, because the provider-level role is not recorded. The loader refuses a delivering channel with role `user`, and a `postToolUse.deliver` that disagrees with `postToolUseContextMaxBytes`.
- Drain: a `Stop` of a CLI whose `stop.deliver` is false registers the head, then answers quiet `StopChannelOff` before the first-Stop reset and the cap. It is benign, so it writes no outcome-log line and adds no breaker count.
- Core: `SendRequest.stop_drains` (the CLIs whose Stop takes mail), `SendOutcome.to_stop_drains`, `WakeDrop::NoChannel`. Toward any other CLI, effective wake is false and neither the exchange quota nor the wake lifetime cap is spent. The check runs before both.
- Frame contract: `[report.turn.no-stop]`, `[report.wake-no-channel]`.
- Live suite `C1`: the former Stop-gate check is retired. Its behaviour is now owned by `hook_payloads.rs`. The new check `stopOff` expects the wake message to stay `recorded`, no `user`-role record to carry a frame, and both sentences in the send answer.

## Proof

- `CARGO_BUILD_JOBS=4 cargo test -p fgos-mailbox-core -p fgos-mailbox -p fgos -- --test-threads=4`: 350 passed, 0 failed (log `/tmp/fgos-work/mailbox-v7/p1-gate.log`).
- New owning proofs: `store/tests/hook_payloads.rs` T1-T3 (`a_codex_stop_with_eligible_wake_mail_claims_nothing_and_is_quiet_stop_channel_off`, `a_first_codex_stop_registers_the_head_and_claims_nothing`, `a_codex_binding_that_already_holds_stop_blocks_answers_stop_channel_off_and_keeps_its_count`); `core/tests/delivery.rs` T4-T5; `core/tests/report.rs` T6; `store/tests/fixtures_contract.rs` T7 (one new test plus four refusal cases in the existing refusal test). T8 is one wiring proof in `apps/fgos/tests/mailbox_routes.rs`.
- Mutants killed (5 of 5): the drain ignores `stop.deliver` (T1-T3 fail), the check is moved after the cap (T3 fails), the wake quota is spent before the channel check (T4 fails), the report ignores `to_stop_drains` (T6 fails), and the loader accepts a delivering `user` channel (refusal test fails).

## Live run (1 of 1 budgeted, benign, no retry)

`node test/live/mailbox-claude.live.mjs run C1`. Codex 0.161.0, account `tetnu`, host built from `38948c01d` (sha256 `de94ba6b…5ba`). Exit 0, 27.5 s, every check passed (`/tmp/fgos-work/mailbox-v7-live-suite/C1/result.json`). The dry run against the stub came first and passed.

- M1 reached the model inline at a `PostToolUse` (a `developer` message) and ended `offered`.
- M2 (`--wake`, sent after the model's last tool call) stayed `recorded`. The rollout holds no `<hook_prompt>` record, and no `user`-role message carries a frame.
- The send answer read: "queued: it sees it at its next tool call. This CLI takes no mail when its turn ends, so an idle session sees it only when it next runs a tool." / "Its CLI has no channel that can wake it; the wake was not used."

## Deviations

1. The core input is a set of CLIs (`stop_drains: BTreeSet<Cli>`), not one `stop_drains: bool`. The core resolves the recipient, so the store cannot know its CLI before the send. The wiring fills the set from `TestedClis::stop_drains()`.
2. T7 lives in `store/tests/fixtures_contract.rs`, which already owns the adapters contract's loader tests, not in `store/tests/adapters.rs` (design principle 8).
3. The live suite's run home moved from `mailbox-v5-live` to `mailbox-v7-live-suite`. V5's `C1` had already spent its one run, and the suite refuses a re-run by design. V5's evidence stays as it was.
4. The board line ("V7a landed on the branch") is the controller's to post.
