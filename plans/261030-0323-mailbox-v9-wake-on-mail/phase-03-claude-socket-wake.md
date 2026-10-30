# Phase 03: wake an idle Claude Code session through its socket

Owner approvals: the V7n measurement (2026-10-30 13:15), and on 2026-10-30 ~13:40 "đồng ý" to receiver instruction v3 becoming the default on the wake path. Status: planned, not started. Needs lead:OPC's review of the socket write call site before it lands.

## Context

- Measured (V7n, `plans/reports/mail-261030-1320-mailbox-v7n-instruction-v3-on-socket-frame.md`): behind Claude Code's own socket frame, with receiver instruction v3, harmful mail acted on 0 of 12, in-task requests acted on, out-of-task requests deferred. Haiku, Claude Code 2.1.309 only.
- Channel (W1, W3): a user-message line written to the session's `messagingSocketPath` starts a turn on an idle session in about 2 s, and is delivered inside the running turn on a busy one. It needs the session to accept cross-session input.
- Claude Code's own strings say a repository setting may only tighten `crossSessionInbound` to `hold`; `accept` must come from the user's settings, a managed policy, or `--settings` at launch. A running session cannot be switched. A raw write to a bypass-mode session that does not accept is held behind a dialog (W2, W2b), which would interrupt the person.
- K1 (no global accept) is changed by the owner's decision of 2026-10-30 13:52 to a user-level accept written only after the adapter lands (requirement 5).

## Requirements

1. **Write only where it is safe.** The adapter writes the nudge line to a head's socket only when the head accepts: its process carries the scoped `--settings` accept (read from `/proc/<pid>/cmdline` on Linux) or the user-level settings of its `CLAUDE_CONFIG_DIR` hold the accept key (read from that file); unreadable or absent means no write. Any other Claude head keeps today's behaviour: the mail is read at its next tool call or turn end, and the report says why no nudge was sent (`no-accept`).
2. **Same port, same line.** It is a new `NudgeChannel` of the phase 01 `Nudge` port, with the same fixed line and no body. The socket path comes from the head's session file `~/.claude/sessions/<pid>.json` (`messagingSocketPath`) and must be inside `/run/user/<uid>/cc-socks/`; anything else is refused. Connect timeout and write timeout 2 s each.
3. **Tested versions only.** The contract lists the Claude Code versions the channel was measured on (`nudge.versions` for `claude`): 2.1.309 and the 2.1.304 channel measurement. Versions seen on the machines (2.1.310, 2.1.312) are added only after one W1 probe run on each. Others answer `version-not-tested`.
3b. **Remote wake reaches Claude too.** Phase 02's sync child already calls `nudge_remote`; the new channel plugs in with no change there.
4. **Instruction v3 on the wake path.** Where the product picks the receiver instruction version for a CLI and path, Claude Code on the socket path uses version 3 (decided by the owner, with the LRU-out cell open). The hook path keeps what V7m measured. Anything not measured keeps version 1.
5. **How a lead gets the accept (owner, 2026-10-30 13:52: no launcher flag to remember, turn it on in settings).** The accept goes into the user-level Claude Code settings (`~/.claude/settings.json`, `"crossSessionInbound":"accept"`), written by `fgos doctor --fix` and reported by a doctor row (how many live Claude heads can be nudged); reversible by removing that one key. This changes K1 from "never global" to "user-level, only after the adapter is reviewed and the measurement above": nothing writes to any socket until the adapter lands, and the key is not written before then. A probe (W11, private HOME, user-level setting, no `--settings`) first shows whether a running session picks the setting up without a restart; if it does not, sessions join as they restart. The `--settings` form stays as the per-session override.

## Files

- `packages/mailbox/rust/store/src/nudge.rs` (new channel and the socket write), `adapters/mod.rs`, `packages/mailbox/contracts/adapters.v1.json` (claude `nudge`), the instruction-version table where it lives.
- `apps/fgos/src/wiring/mailbox_verbs.rs` only through the existing `system_nudge` (no new construction site).
- `src/setup/` doctor row and the guide for the launcher form; `test/live/mailbox-wake-probe.live.mjs` W1 re-run for 2.1.310 and 2.1.312.
- Tests: store `tests/nudge.rs` (socket write to a stand-in unix socket the test owns, path guard, no-accept refusal), one route proof in `mailbox_routes.rs`.

## Validation

Unit and route tests; one live W1 run per added Claude version; then a live proof between two real lead sessions started with the scoped accept (idle one woken, a busy one served at its tool call, a session without accept untouched and the report says `no-accept`). Size 250-350 lines source, 150 test; over that, stop and ask.

## Risk and rollback

- A same-user process can write to a session that accepts. That is the K1 reason; it is bounded here by writing only to heads that were launched with the scoped accept on purpose, a fixed line, and the 0-of-12 measurement. Rollback: remove the `claude` entry from `nudge` in the contract; heads fall back to tool-call delivery.
- The 12-run measurement is one model and one version; the report says so and the contract carries the version list.
