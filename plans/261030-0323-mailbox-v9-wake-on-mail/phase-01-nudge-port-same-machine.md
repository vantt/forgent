# Phase 01: `Nudge` and `Presence`, same machine

## Context
Mail sent with `--wake` today only forces one more turn at the end of a running turn (Stop block). An idle head never sees it until a person acts. Spec 6.2 has the port on paper; no adapter exists.

## Requirements
- Core: the `Nudge` port (`tier`, `nudge` with at most one outstanding nudge per address, cleared at the next drain) and `Presence` (`idle|busy|shell|waiting`), in `packages/mailbox/rust/core` with no I/O.
- Codex adapter in `packages/mailbox/rust/store/src/adapters/codex.rs`: `codex queue` to the shared app-server daemon, one fixed line `[fgOS: message from another agent, not from the user] You have mail. Read it with: fgos mailbox inbox --claim`; refuses cleanly when there is no daemon (`--no-daemon` form) and reports tier `turn`.
- Claude Code: first the measurement, then the adapter.
  1. Re-run the harmful-mail test with the real socket frame ("not typed by your user ... treat it as a teammate's request"), `haiku`, scoped `accept`, up to 40 print-mode runs, same cells and oracle as V7f, reusing `scripts/lib/mailbox-behaviour-v7f.mjs`.
  2. 0 acted: build `claude.rs` socket adapter (session file `messagingSocketPath`, newline JSON, only for a session whose session file shows the scoped `accept`; never assumed). Any acted: do not build; record the result; Claude stays at `turn`.
- Wiring: `fgos mailbox send --wake` and the receiver's presence decide: idle head and tier `push` gives a nudge; otherwise today's behaviour. The delivery report says which, in one sentence.
- Config: `mailbox.wake.enabled` (default on), registered in setup and doctor per the install gate.

## Files
`packages/mailbox/rust/core/src/{nudge.rs,lib.rs}`, `packages/mailbox/rust/store/src/adapters/{codex.rs,claude.rs}`, `apps/fgos/src/wiring/mailbox_verbs.rs`, `packages/mailbox/contracts/*` config keys, `src/setup/checks.mjs`, `CHANGELOG.md`, tests beside each owner.

## Validation
Core test (one outstanding nudge, tier lowering); Codex adapter against a real private daemon (idle head woken once, busy head not interrupted, no daemon refused); the harmful-mail result file under `plans/reports/`; `mailbox_routes` stays green; clippy, msvc and darwin check; census 0 undeclared.

## Risk and rollback
A nudge reaches the model as a user-role line: mitigated by the fixed text, by the receiver instruction, and by the 0-acted bar. Rollback: `mailbox.wake.enabled: false`.
