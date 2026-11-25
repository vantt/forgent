# Phase 5: The send door wakes the recipient

After recording, `fgos mailbox send --wake` wakes an idle recipient on its machine by the fastest channel: the
existing socket or `codex queue` push where the adapters contract allows it, else one typed labelled wake line, else
the next tool call. The answer names the path (discussion task `task-typed-wake`; HC-D2 to HC-D5).
Capability: `code:implement`.

## Inputs

- `docs/platform/agent-mailbox/spec.md` §6.2 (Nudge port), §8.1, §15.8 (typed-signal rules 1 to 7, terminal access by
  key, `deliver_brief` focus warning, the simpler alternative).
- `packages/mailbox/rust/store/src/nudge.rs` (`Nudge`, `NUDGE_LINE`, `SystemNudge`),
  `packages/mailbox/rust/store/src/adapters/mod.rs` (`NudgeChannel`), `packages/mailbox/contracts/adapters.v1.json`.
- `packages/mailbox/rust/core/src/report.rs` (`NudgeReport`, `nudge_sentence`), `packages/mailbox/contracts/frame.v1.txt`.
- `packages/session-host/rust/src/pane_io.rs` (`PaneIo`: send, screen, inspect by key).
- Phase 3's `composer_state`; `fgos_agent_protocol` `classify_blocked` for dialogs.
- `apps/fgos/src/wiring/supervision.rs` `pane_of` (read only: the lookup to move into Identity).
- `apps/fgos/src/wiring/mailbox_verbs.rs` `system_nudge`, the send path; `mailbox_remote.rs` (read only).

## Footprint

`packages/mailbox/rust/store/src/nudge.rs`, `packages/mailbox/rust/store/src/verbs.rs`,
`packages/mailbox/rust/store/src/adapters/**`, `packages/mailbox/rust/store/tests/nudge_*.rs`,
`packages/mailbox/rust/core/src/report.rs`, `packages/mailbox/contracts/adapters.v1.json`,
`packages/mailbox/contracts/frame.v1.txt`, `packages/session-host/rust/src/pane_io.rs`,
`packages/session-host/rust/tests/typed_wake.rs`, `packages/identity/rust/src/directory.rs`,
`apps/fgos/src/wiring/mailbox_verbs.rs`, `apps/fgos/src/wiring/mailbox_verbs/**`, `apps/fgos/tests/mailbox_routes.rs`.

## Steps

1. Identity: add `Listed::terminal_key() -> Option<String>` (key, else pane id), the body of `supervision.rs`
   `pane_of`. Do not edit `supervision.rs` (owned by a running plan); the follow-up plan moves it onto this method.
2. Session host: add to `PaneIo` one gate-and-type call: inspect, require `idle`, `composer_state == Empty`, no
   dialog (`classify_blocked`), re-observe right before typing, then send text plus Enter without the prompt door
   (focus-neutral, §15.8 rule 4). It returns `Typed`, or `Refused(<cause>)` with causes `busy`, `composer-not-empty`,
   `dialog-open`, `unknown`, `no-pane`. New test file `tests/typed_wake.rs` with a fake `Panes`.
3. Mailbox store: add `NudgeChannel::Typed` and its `adapters.v1.json` rows for the CLIs whose fixtures exist
   (Claude Code, Codex, agy), ordered after the push channels. `SystemNudge` stays terminal-free: the host wiring
   implements the typed channel by calling Identity and the session-host gate (hexagonal port, §15.8 "the crate
   observes; the caller decides"). Keep one outstanding nudge per head and the wake caps as today.
4. Choose the channel in order: push channel the contract allows for this head; else typed; else none. A refused
   typed attempt reports its cause and falls back to the next tool call.
5. Add `path` to the send answer: `local-pushed`, `local-typed`, `local-next-tool-call` or `remote-recorded`, beside
   the existing nudge sentence; add the sentences to `frame.v1.txt`. A send without `--wake` answers
   `local-next-tool-call` or `remote-recorded`.
6. Wiring: put the typed channel in `apps/fgos/src/wiring/mailbox_verbs/typed_wake.rs`, declared from
   `mailbox_verbs.rs` (no change to `wiring/mod.rs`). Extend `mailbox_routes.rs` with one send whose answer names
   its path.

Phase 3 hand-over notes (landed in `5f6ddd735`): `composer_state` checks the CLI version only while the banner is on
screen, so the typed gate must check the session's CLI version itself (`adapters/version.rs`) and treat a mismatch as
`unknown`. Two contrived false-`empty` screens remain in the predicate (a Codex screen with no model status line where a
draft line contains ` · `; a Claude screen-only draft ending in a lone `❯`); the gate's re-observation right before
typing is the mitigation, and the live case of phase 7 covers a half-typed composer.

## Verify

`cargo test -p fgos-session-host --test typed_wake && cargo test -p fgos-mailbox && cargo test -p fgos-identity &&
cargo test -p fgos --test mailbox_routes`. Pass: typed only when idle, empty and no dialog; exact `NUDGE_LINE` typed,
never a body; no prompt-door call; second send while a nudge is outstanding gives `Pending`; every `path` value
covered once.

## Rollback

Revert the phase commit, or remove the `Typed` rows from `adapters.v1.json` to turn the typed channel off alone.
