# Phase report: mail-ack receiver across machines (P3)

Branch `mail/ack-p3` (not landed).

## Changed
- `core/src/remote.rs`: `RemoteMail.ack_within_sec`, `RemoteMail.reply_to` (sender machine's id); `ingest_remote` copies the flag to `Header.ack_within_sec` and calls `mark_acked(reply_to, Some(machine))` right after the `(machine, id)` seen mark (before any admission check, so a refused verified reply still acknowledges; a replay is `Duplicate` and changes nothing). New `remote_reply_parent(from, from_generation, hint, to_machine) -> Option<String>`: hint must name a header offered to `from`'s current generation whose origin machine is `to_machine`; marks it answered, returns `origin.id`.
- `apps/fgos/src/wiring/mailbox_ingest.rs`: `verify` reads `ackWithinSec` (integer 1..=maxAgeSec) and `reply_to` (string) in v1-v3; other type/range is `remote-malformed`, before the signature check, like any shape fault. `MAX_AGE_SEC` is now `pub(super)` for the contract test.
- `apps/fgos/src/wiring/mailbox_remote.rs`: `send` maps `--reply-to` through `reply_parent` (one record hold, before `admit_remote`); an unknown hint is refused with the same text as local `reply-to-not-offered`; the payload now carries the sender-machine id, not the raw local id.
- `packages/mailbox/contracts/remote.v1.json`: `reply_to` meaning redefined, `ackWithinSec` payload row, `ackRequest` block (versions 1-3, 1..86400, no new domain, olderReaders).
- Mechanical: `RemoteMail` constructions in `core/tests/remote.rs`, `store/tests/record_ingest.rs`; census digests regenerated.

## Older receiver, v3 payload with `ackWithinSec`
Its shape check (`mailbox_ingest.rs` `verify`, version match then `shape()`) reads only named fields and has no unknown-field refusal; the signature is verified over the whole unsigned payload, so the extra field is covered and the check passes. The message is taken and shown as the plain frame; only the ack line is missing. Same for v1/v2. No payload version, no signing domain; event-streams schemaVersion untouched.

## Tests (behaviour in title)
- ingest unit: extended `only_a_message_that_passes_every_check...` with ackWithinSec taken in v1-v3, absent stays None, 0/-5/1.5/"600"/null/max+1 and non-text reply_to dropped malformed, max accepted.
- `core/tests/remote.rs`: `a_verified_cross_machine_reply_naming_a_watched_id_marks_it_acknowledged_once_only_from_the_machine_it_went_to` (also covers flag carried to header, hint not offered / other machine / unknown refused, answered mark). The remote watch is built by editing a state JSON (`to_machine`), since only P5's `admit_remote` will create one.
- host `the_wire_cap_and_signing_domain_equal_the_remote_contract` extended for `ackRequest`.

## Gates (all green)
core + `-p fgos-mailbox` + `-p fgos-config`, `-p fgos --test mailbox_routes` (47), `--test mailbox_sync_child` (2), `--bin fgos mailbox` (19), fmt, clippy -D warnings (core, store, fgos, all targets), msvc and aarch64-apple-darwin check, census 0 undeclared.

## Deviations / notes for lead
- Status line "takes acknowledgement requests" NOT added: it lives in `mailbox_verbs.rs` (P2 owns). Add next to the "takes mail payload versions" line (~440), and ideally `data["crossMachine"]["acceptsAckRequests"]`.
- Hint mapping runs before `admit_remote`: a bad hint is refused without counting an attempt (local check 4 counts one). `reply_parent` marks answered before the event append; a failed append leaves the original marked answered (rare; mark is advisory).
- `reply_to` presence of a non-string type is now `remote-malformed` (before it was ignored); our senders always write strings.
- Behavior change for unflagged cross-machine replies: wire `reply_to` is now the origin's id instead of the raw local id.

Status: DONE_WITH_CONCERNS

## Review fix (OPC)
- `remote_reply_parent` is now a read-only lookup (`&self`); the host marks the original answered with `mark_answered` only after the append succeeded, so a failed publish/open/append leaves it unanswered. Core test asserts the lookup leaves it unanswered until `mark_answered`.
- Contract: trust unit is the machine; any session of the target machine can acknowledge (watch keyed on `to_machine` only).
- Noted, accepted by OPC: a bad `--reply-to` hint is refused without counting an attempt, unlike local check 4.
