# Phase 2: Session type submits through the shared pane call

Capability: `code:implement`. Acceptance criteria served: 1, 2, 3.

## Inputs

- `plans/discussions/ds-itzp2debmh-session-type-submits-enter/DISCUSSION.md` §4 (D1 to D6) and §6.
- `packages/session-host/rust/src/pane_io.rs`: `PaneIo::typed_wake`, `TypedWake`, `send_typed`, `observe`.
- `packages/session-host/rust/tests/typed_wake.rs`: its fake `Panes`, the owning proof to extend.
- `packages/agent-protocol/rust/src/terminal/mod.rs`: `Profile::enter_gap_ms`, `Terminal::composer_state`,
  `Terminal::confirm_submitted` (reuse it, with an outbox that never has a result).
- `apps/fgos/src/wiring/supervision.rs`: `session_verb` (about line 350), `type_into_session` (about line 3148),
  and the `Verb::SessionType` arm (about line 3436).
- `apps/fgos/src/wiring/mailbox_verbs/typed_wake.rs`: the mailbox caller, and how it gets the CLI and version
  (`recipient_version` with `VersionSources`).
- `apps/fgos/tests/supervision_verbs.rs`: `session_type_is_refused_until_an_open_event_names_the_target_session`
  and `idle_herdr` (fake herdr scene).
- Prior art for the verb's wiring set: commit `e345b8974c`. A flag is declared in `src/cli/command-registry.mjs` and
  regenerated into `packages/host-runtime/contracts/command-*.json` by `node scripts/export-command-selectors.mjs`.

## Footprint

`packages/session-host/rust/src/pane_io.rs`, `packages/session-host/rust/tests/typed_wake.rs`,
`apps/fgos/src/wiring/mailbox_verbs/typed_wake.rs`, `apps/fgos/src/wiring/supervision.rs`,
`apps/fgos/tests/supervision_verbs.rs`, `packages/run-supervisor/rust/tests/fixtures/fake-herdr-pane.py` (only if
the wiring proof needs an idle frame with an empty composer that it cannot yet serve), `src/cli/command-registry.mjs`,
and the generated `packages/host-runtime/contracts/command-routes.json`, `command-manifest.json` and
`command-route-annotations.json`.

## Steps

1. Run `impact` on `typed_wake`, `type_into_session` and `session_verb` (GitNexus, upstream) and record the blast
   radius in `reports/phase-02-impact.md`. The expected callers are the mailbox `HostNudge` and the supervision `SessionType` arm.
2. `pane_io.rs`: grow `typed_wake` into the one gate-and-submit call. Do not add a second call beside it (L10).
   - Gate unchanged: two observations, `dialog-open`, `busy`, `composer-not-empty`, and `unknown` for a pane,
     state or version it cannot judge. Name the two causes it lumps into `unknown` today: `no-cli-profile` when
     `adapter_for(cli)` is `None`, and `foreground-not-agent` when a send answers `SendOutcome::ForegroundNotAgent`.
   - `composer-not-empty` carries the draft the inspection read (`prompt_text`), so the caller can quote it.
   - Submit: raw text, then a pause of the profile's `enter_gap_ms` (not the fixed 300 ms), then a separate
     `Enter`. Never the prompt door, never focus.
   - Confirm with `Terminal::confirm_submitted` over this `PaneIo`: `Delivered` gives `Submitted`, and anything
     else gives `DeliveryUnknown`. `Blocked` after typing also counts as `DeliveryUnknown`, because the text was
     typed.
   - Answer: `Submitted`, `Refused { cause, draft }` (nothing typed), or `DeliveryUnknown` (typed, not confirmed).
     Expose a `cause()` string for each.
3. `mailbox_verbs/typed_wake.rs`: map `Submitted` to `Ok(())`, and every other answer to `Err(cause)`. The mailbox's
   rules and its channel selection do not change.
4. `supervision.rs`: parse the `--no-enter` switch into `Verb::SessionType { target, text, submit }`. With submit,
   after the existing gate (`target-not-stuck`), resolve the head's pane, its CLI (`session.cli`) and its version
   through the same `recipient_version` and `VersionSources` the mailbox uses (no second version probe). Then
   call `typed_wake` with the text. Answer `{session, submitted: true}`, or a refusal whose code is the cause. A
   `composer-not-empty` refusal quotes the draft in its message. With `--no-enter`, keep `type_text` and answer
   `{session, held: true}`. Record the coordination evidence with the outcome word (`submitted`, `held`, or the
   cause). The human line says `submitted to <target>` or `held in <target>`. `typed: true` is gone.
5. `command-registry.mjs`: add `no-enter` (a boolean, "type without submitting; the answer says held") to
   `session type`, and update its description. Run `node scripts/export-command-selectors.mjs` to regenerate
   the three contract files. Never hand-edit them.
6. Tests. In `typed_wake.rs`, one case per profile (claude, codex, agy, pi, omp) asserts the send sequence: text
   with no newline, a pause equal to `enter_gap_ms` (make the gap observable through the fake, for example a
   recorded pause, not wall-clock), then `Enter` as a key, and `submit` false. Add one case per answer listed in
   criterion 1. Read pins with `adapter_for(cli).pinned_version()`, never a literal. Each new test's title says the
   behaviour in plain words. In `supervision_verbs.rs`, extend the existing session-type test into the one wiring
   proof: a stuck head with an idle, empty composer answers `submitted: true`, and with `--no-enter` answers
   `held: true`. No new test file.

## Verify

`cargo test -p fgos-session-host --test typed_wake && cargo test -p fgos --test supervision_verbs && cargo test -p fgos-terminal-control && node scripts/run-tests.mjs test/rust-host/command-routes.test.mjs test/cli/fgos-manifest.test.mjs test/cli/subcommand-flag-drift.test.mjs`.
Pass: all green. `rg -n '"typed": true' apps/fgos/src` finds nothing. `type_text_sends_text_exactly_once_via_pane_send_text`
is still present and passing.

## Rollback

Revert the phase commit. `typed_wake` and the verb go back to `base`, and the generated contracts are regenerated
from the reverted registry.
