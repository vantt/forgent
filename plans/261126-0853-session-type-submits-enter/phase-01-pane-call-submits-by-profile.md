# Phase 1: The shared pane call submits by profile

The session-host `PaneIo` gate-and-submit call that plan `261125-2313` phase 5 added for the typed wake learns the
per-CLI profile submit and the refusal causes `session type` needs. One call, two submit modes; no second typing
path (discussion D2, D3, D4). Capability: `code:implement`.

## Inputs

- `plans/discussions/ds-itzp2debmh-session-type-submits-enter/DISCUSSION.md` §4 (D1 to D4) and §6.
- `packages/session-host/rust/src/pane_io.rs`: `PaneIo::typed_wake` and `TypedWake`, landed by plan `261125-2313`
  phase 5 (two idle, empty, dialog-free observations, version pin, text, fixed 300 ms, raw `Enter`), and
  `PaneIo::send_typed` with `SendFailure::ForegroundNotAgent`.
- `packages/session-host/rust/tests/typed_wake.rs`: its owning proof and fake `Panes`.
- `packages/agent-protocol/rust/src/terminal/mod.rs`: `Profile` (`enter_gap_ms`, `submit_by_prompt_door`,
  `composer_state`), `Adapter::deliver_brief`, `confirm_submitted`, `draft_still_in_composer`; the profiles in
  `terminal/{claude,codex,agy,pi,omp}.rs`.

## Footprint

`packages/session-host/rust/src/pane_io.rs`, `packages/session-host/rust/tests/typed_wake.rs`.

## Steps

1. Read the landed call. On main `5466f387d` it does not submit by profile (fixed 300 ms, raw `Enter`, no
   prompt door, no confirm); if a later change made it do so, skip to step 3.
2. Give the call a submit mode: `FocusNeutral` (the typed wake's text plus `Enter`, unchanged) and `Profile`
   (type, `enter_gap_ms`, separate `Enter`, or one prompt-door send when `submit_by_prompt_door`). The `Profile`
   mode reuses the agent-protocol submit (`deliver_brief` or the pieces it is built from); it does not copy it.
   The typed wake's caller passes `FocusNeutral` so its behaviour does not change.
3. Add the causes the verb needs to the call's answer, beside `busy`, `composer-not-empty` (now carrying the
   quoted draft), `dialog-open`: `foreground-not-agent` (the pane's foreground process is not the CLI),
   `no-cli-profile` (the head's CLI has no profile), and `delivery-unknown` (sent, but neither an empty
   composer nor a working state is seen). Confirmed delivery answers `Submitted`. Take `foreground-not-agent` from the
   same check `send_typed` makes; do not copy it. Keep the re-observe right before typing.
4. Extend `tests/typed_wake.rs`, one case per behaviour: per profile (claude, codex, agy, pi, omp) the exact
   sends in order (text, gap, separate `Enter`, or one prompt-door send) with no newline in the text; each
   answer above once; the typed wake's `FocusNeutral` sends unchanged.

## Verify

`cargo test -p fgos-session-host --test typed_wake && cargo test -p fgos-mailbox && cargo test -p fgos --test mailbox_routes`.
Pass: every case of step 4 green, and the mailbox typed wake proofs unchanged and green.

## Rollback

Revert the phase commit. The typed wake keeps phase 5's call as landed.
