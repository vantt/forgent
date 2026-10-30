# Phase 02: wake from another machine

Owner approval: 2026-10-30 13:15 ("ok luôn qua giai đoạn 2"). Status: detailed plan written 2026-10-30; build not started. Builds on phase 01 (`0e6c26d43`, `f38ed6429`).

## Context

- Remote mail is recorded by the receiver's detached sync child (`apps/fgos/src/wiring/mailbox_ingest.rs`, `ingest`) through core `MailboxState::ingest_remote` (`packages/mailbox/rust/core/src/remote.rs`). That header is always `wake: false, effective_wake: false`, and the sync child never starts a nudge.
- Phase 01 has the pieces: the `Nudge` port with `SystemNudge` (`packages/mailbox/rust/store/src/nudge.rs`), the nudge-eligible CLIs and tested versions (`adapters.v1.json`, `nudge_for`), the fixed line, `SendOutcome.to_nudge`, `to_key`, `nudge_outstanding`, and `core/src/wake.rs::effective_wake` (exchange quota plus a lifetime cap per sender generation).
- `effective_wake` exempts a sender with no head (no generation). A remote sender has none, so calling it as is would give a remote sender an unlimited wake budget. That is the one thing this phase must not do.
- Measured so far: an idle Codex head woken by `codex queue` (W5 10 s, W6 50 s) on 0.162.1, harmful mail 0 acted of 30 on 0.161.0. Claude Code is not wired (its socket channel is being re-measured as V7n, owner approved 2026-10-30); when it passes it plugs into the same port and this phase needs no change for it.
- Measured on 2026-10-30 between fg-server2 and fg-server: plain mail crosses both ways (`plans/reports/mail-261030-1308-mailbox-cross-machine-two-way-proof.md`). The same proof found that mail sent before the receiver's first sync is skipped by the baseline and the sender is never told.

## Requirements

1. **The sender asks, signed.** `fgos mailbox send --wake --to <remote session>` signs the event as payload `v: 2` under a new domain `fgos-mailbox-message/2\n` and adds `"wake": true`. A send without `--wake` stays `v: 1` under domain 1, byte for byte as today, so receivers that have not upgraded keep taking plain mail. A receiver that does not know version 2 drops the event at its shape check (`v` must be 1) with the counted reason `remote-malformed`; it never reads the message without its wake flag. The sender's report says "wake requested; the receiver decides".
2. **The receiver decides, with its own budget.** A verified remote message takes an effective wake only if all hold: the signature verified, the signer machine's pin is `confirmed` (the existing check; `requireConfirmed` stays true for a wake even if an owner sets it false for plain mail), the recipient head's CLI is nudge-eligible on its tested version (`to_nudge`), the exchange quota of `effective_wake` is not spent, and a **remote wake cap** per verified sender session is not spent. The cap is a new limit `mailbox.remote.wakeCap`, default 5 effective wakes per (signer machine, sender session) in total, never reset, placeholder until measured; entries are bounded like `remote.seen` (oldest dropped past `counters.maxKeys`). It is smaller than the local `mailbox.wake.lifetimeCap` (50) and than the sender's mail cap (200). A dropped wake never refuses the message; it is recorded as plain mail.
3. **Idle is not asked.** Phase 01 decided there is no presence check: `codex queue` queues behind a running turn safely (W6). A head with older pending effective-wake mail is not nudged again (`nudge_outstanding`, same stateless rule as a local send).
4. **The line is fixed.** The sync child sends the phase 01 line only (`You have mail. Read it with: fgos mailbox inbox --claim`); the body and the sender's text never travel with it. The nudge is sent after the record write, from the sync child, never from the hook (the hook's 50 ms budget is untouched), through the one construction of `SystemNudge`.
5. **The sender is told when mail was skipped by the baseline.** On a machine's first ingest, each `mailbox.message-sent` event addressed to this machine and inside the maximum age is answered with a signed `mailbox.message-settled` of outcome `refused` and reason `before-first-sync`, so the sender's status moves from "waiting for the receiver's fetch" to a refusal it can read. The baseline itself stays (decided in V8: history is not replayed). The payload is not verified at this point, so the answer names only the id the sender chose and is bounded by the same queue as other refusals (`queue_remote_refusal`, oldest dropped past the key bound).
6. **Nothing else grows.** No settlement field for "woke" (the sender cannot act on it sooner; the receiver counts nudges in its own outcome log). No Presence port. No new stream or event type.

## Files

- `packages/mailbox/contracts/remote.v1.json`: add payload version 2 and its domain to `mailbox.message-sent` (a new field `wake`, only in version 2), the limit `mailbox.remote.wakeCap`, and the refusal code `before-first-sync`. Contract shape follows the file's current form; keep its description of what a number means.
- `packages/mailbox/contracts/limits.v1.json` and `core/src/limits.rs`: the new limit with its source and `placeholder, unmeasured` status.
- Core `remote.rs`: `RemoteMail` gains `wake: bool`; `ingest_remote` computes the effective wake; the remote wake count lives in `remote` state (`state.rs`, serde with a default so a version-2 record loads). `wake.rs`: `effective_wake` takes the lifetime rule as a parameter (generation key, remote sender key, or exempt) instead of inferring it from the missing generation; the local caller passes what it passes today. `counters.rs`/`policy.rs`: the new refusal code and, if needed, the wake-drop reason `remote-wake-cap` in `WakeDrop`.
- `apps/fgos/src/wiring/mailbox_remote.rs`: `--wake` on a remote send (`sent_payload`, domain and version). `mailbox_ingest.rs`: `verify` reads `wake` only from a version 2 payload under domain 2; `ingest` hands each recorded message with an effective wake to the nudge step and answers baseline-skipped mail. `mailbox_sync.rs`: runs the nudge step after the ingest report and writes its outcome to the outcome log. The nudge call reuses the function phase 01 added for a local send; it is not a second copy.
- Tests: core `remote.rs` unit tests (cap, exemption removed, drop never refuses), `apps/fgos/src/wiring/mailbox_ingest.rs` tests (domain 2 verify, domain 1 unchanged), `apps/fgos/tests/mailbox_routes.rs` one wiring proof (two clones on one bare remote, stand-in `codex` on PATH printing a tested version as in phase 01).

## Steps

1. Core first: lifetime rule parameter in `effective_wake`, remote wake count, `ingest_remote` wake, unit tests (red then green).
2. Contract and limits, then `send --wake` signing and `verify` of version 2, with the old-reader behaviour proved: a version 2 event given to today's `verify` is a `remote-malformed` drop (kept as a test before the function changes).
3. The nudge step in the sync child with the stand-in `codex`; the baseline answer.
4. OPC review of the new call site (the sync child's nudge call) before it lands; census regenerated in the same commit, 0 undeclared; rebase onto origin/main; msvc check, clippy `-D warnings` and the darwin check before landing Rust.
5. Release to fg-server2 and fg-server through their windows; live proof (below). design-lap only with the owner's go.

## Validation

- Unit and wiring tests as above: an idle Codex head on a tested version is nudged once for a confirmed machine's `--wake` mail; a machine whose key is `seen` is dropped before any wake; a flood of `--wake` mail from one remote sender stops at the wake cap while the mail still lands; a plain send is unchanged byte for byte (golden signed bytes); a head on an untested version is recorded without a nudge.
- Live proof between fg-server and fg-server2 with a real Codex head on the receiver: the nudge starts a turn and the head runs `inbox --claim`; recorded under `plans/reports/`. Heavy runs: one two-machine run, no model-run campaign (the harmful-mail safety of the line is phase 01's measurement).
- Size: 250-400 lines of source, 150 of tests. Over that, stop and ask.

## Risk and rollback

- A machine whose key is confirmed can start a turn on another machine. Bounded by: the confirmed pin, the fixed line, the tested-version gate, the exchange quota and the per-sender cap of 5. The line carries no body; the mail is read only through `inbox --claim` under the receiver instruction.
- Receiver and sender must both run the new release for a wake to cross; a sender on the old release sends plain mail, a receiver on the old release drops a wake mail with the counted reason `remote-malformed` (the sender sees nothing sooner than the next settlement; document it in the guide).
- Rollback: set `mailbox.crossMachine.enabled` false to stop all cross-machine mail, or send without `--wake`; delivery of plain mail is unaffected. The wake count in the record is additive and ignored by an older reader of the version-2 record.

## Not decided here

- Whether a remote wake should also reach Claude Code: depends on V7n.
- Whether the cap should reset over time: kept "never reset" like the local lifetime cap until a measurement says otherwise.
