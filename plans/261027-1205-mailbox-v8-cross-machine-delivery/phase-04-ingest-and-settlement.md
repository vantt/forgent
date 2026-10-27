# Phase 04: ingest and settlement

- `fgos mailbox ingest` internals run from the `fetch+ingest` child, `send` and `inbox --claim` only. Incremental cursor in the local record (schema v2); baseline at the first run and after any reset.
- Checks in order: signature, signer machine, pin `confirmed` (`mailbox.remote.requireConfirmed`), `owns_id`, recipient published id and `registeredAt`, maximum age, dedupe `(machine, id)` over the ingest horizon, over cap. Bind to the head's current generation at ingest.
- Deferred or bad events are skipped and counted; they never stop other mail.
- Settlement: the receiver appends `mailbox.message-settled` (`offered` at first offer, `refused` with reason on refusal or TTL); the sender folds it into `list` and `status`; a sender with no settlement yet shows "waiting for the receiver's fetch".
- Verification: two clones on one bare remote: delivered once, right generation, never replayed after `/clear`, record deletion or cursor reset; forged, `seen`, unpinned, duplicate, over-cap, too-old cases dropped with counted reasons and a settled refusal.
