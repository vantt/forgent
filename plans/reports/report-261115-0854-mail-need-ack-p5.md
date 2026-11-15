# Mail need-ack, sender across machines

Branch `mail/need-ack-p5` (from origin/main c21bf2d11). Not landed.

## What changed
- core `policy.rs`: `RemoteSend.ack: Option<RemoteAck>`; `admit_remote` records an `AckWatch` with `to_machine` (the field and `mark_acked(.., machine)` already existed). A flagged send that answers a flagged message is refused `ack-on-ack` (same rule as a local send).
- core `ack.rs`: `judge_remote_ack_watches(RemoteAckFacts{fetch_started, skew_sec, offers})` is the only judge of a remote watch: applies signed offers (restarts the deadline), fires only when fetch_started > due + skew. Local sweep still never judges a remote watch. An open remote watch the sync never judged is retired after the header horizon.
- host `mailbox_remote.rs`: `Outgoing.ack_within`, `ackWithinSec` signed in whichever version's domain; refuses a wait longer than the receiver's max age; recorded text names the wait; `SentRow` ack column (text + `ackWithinSec` in JSON); `signed_offers` reads verified settlements.
- host `mailbox_sync.rs`: after take_mail, `judge_remote_acks` uses the clone's last successful fetch start time (`sync_status.last_fetch`, `time` is taken before the fetch runs) and notifies through the normal notice lane.
- host `mailbox_verbs.rs`: refusal "not across machines yet" and `names_remote_head` removed; flag passed through.
- CHANGELOG line updated; census regenerated (0 undeclared).

## Reused (one door)
- `AckWatch.to_machine`, `mark_acked(machine)`, `mark_ack_offered(machine)`, `notify`, notice reasons, status `ack_signal` (already handled remote watches).
- `reply_parent` / `remote_reply_parent` (reply_to translation was already done earlier; nothing open there).
- `signed_by` + settlement parsing: extracted `verified_settlement` shared by `sent_summary` and `signed_offers` (signature checked lazily, as before).
- `CLOCK_SKEW_SEC` from ingest (now `pub(super)`).

## Tests
- core/tests/remote.rs: "a remote watch never goes overdue from a stale fetch and goes overdue once after a fetch that started past its deadline" (also: other machine's offer ignored, ack-on-ack).
- mailbox_remote.rs unit: "a flagged send signs ackWithinSec under its version's domain and an unflagged send is unchanged" (v1, v2, v3; tamper fails verify).
- mailbox_routes.rs: the old refusal test is replaced (behaviour removed) by one proving the request is signed into the event, status shows the watch awaiting and the recent send's wait.

## Gates
fmt check; clippy -D warnings (fgos-mailbox-core, fgos-mailbox, fgos, all targets) clean; `cargo test -p fgos-mailbox-core -p fgos-mailbox`, `-p fgos-config`, `-p fgos --bin fgos mailbox` (20), `--test mailbox_routes` (50), `--test mailbox_sync_child` (2) green; msvc check ok (known warnings: `envelopes`, `sync_child_args`, `SYNC_CHILD_ENV_REMOVE`, none from this change); aarch64-apple-darwin check ok; census 0 undeclared. No npm test run.

## Open questions / concerns
- A remote notice names the recipient by its unregistered label (`unregistered-xxxx` style from the remote session id), not its handle, because `Notice.about_to` is a `WriterKey` looked up in local bindings. A handle label needs a field on the watch/notice; not done.
- Over-long `--reply-by` (> receiver's 86400 s max age) is refused in the remote branch, but with default limits the local range check (header horizon = 86400) refuses first, so that branch is only reachable when the owner raises `record.ttlSec`; it has no test.
- The sync judge path itself (clock-dependent) has only the core proof; live proof is the two-machine run.
- Risk accepted by design: a fetch that began just after due+skew but before the receiver pushed its "offered" settlement can send one "not offered" notice for a message that was offered.
- Did not touch hook/ or counters files.
