# Phase report: mail-ack same-machine verbs (P2)

Branch `mail/ack-p2`, commit b13ec38d3 (not landed).

## Changed
- `mailbox_verbs.rs`: `--need-ack`, `--reply-by <n>s|m|h`; usage errors (bad duration, `--reply-by` without `--need-ack`, outside [inFlightTtlSec, header horizon]); default `mailbox.ack.replyBySec`; remote recipient refuses with "not across machines yet"; status line + JSON `crossMachine.takesAckRequests`.
- `store/verbs.rs`: status `signals.ack {awaiting, acked, overdue, overdueIds}` + text line, read-only (deadlines past judged from the clock, not written).
- Core: `[refusal.ack-on-ack]` frame section (the bare "Refused: ack-on-ack." gave no way out) + report test + frame contract test row.
- Help: real flag source is `src/cli/command-registry.mjs` (not mailbox_surface.rs, which has no help text); regenerated `command-routes.json` (flag allow-list, else exit 4 unknown flag); `test/rust-host/command-routes.test.mjs` expected flags.
- CHANGELOG line, census regenerated (0 undeclared).
- Tests: routes wiring proof (ack line in frame, ack-on-ack text, reply marks acked), usage rows, cross-machine refusal; store status test extended; status test extended for capability line.

## Deviations
- Files outside the list: command-registry.mjs, command-routes.json, its node test, core frame.v1.txt/report.rs/tests (above); `mailbox_remote.rs` gets one read-only helper `names_remote_head` (needed to refuse only real remote recipients; P3 edits that file, expect a small rebase conflict, helper sits before `send`).
- `--reply-by` bounds unchanged from plan; help says a reply naming `--reply-to` counts at any time, without it only inside loop window.
- `[report.ack]` already printed by core (P1); no store change needed.
- No new Git/process call sites.

## Gates
core, store, config tests; routes 50, sync_child 2, bin mailbox 19; fmt; clippy -D warnings; msvc + aarch64-apple-darwin check; census 0 undeclared; node: command-registry, help, unknown-flag, command-routes tests.
