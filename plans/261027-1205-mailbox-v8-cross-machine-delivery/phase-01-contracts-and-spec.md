# Phase 01: contracts and spec

Goal: freeze what V8 stores and says before code. Starts after the board says DOC has landed, or DOC is told first.

- `packages/mailbox/contracts/event-streams.v1.json`: stream `project:mailbox`, types `mailbox.message-sent` and `mailbox.message-settled`, scope project, `sealOnWrite: false`; payload schemas, signing domain texts, 2 KiB body cap, maximum age and skew tolerance. Consumer entry in `packages/event-store/contracts/consumers.v1.json` decided from phase 00.
- Spec `docs/platform/agent-mailbox/spec.md`: 15.2 rewritten from "later part" to the decided design; 4 and 13 (the port and host adapter; mailbox crates still never call the Event Store or Identity); 5.1 (remote address, full id, handle derived from verified id, no sender time other than display `sentAt`); 8 (trust boundary: confirmed pins, plaintext in Git, trusted-sender instruction not extended); 10 (failure modes: refused, unpinned, over cap, stale, replay after record deletion); 12 (config keys); 17 (decision row). Pointers in the Event Store and Identity specs.
- Needs WORK/lead:ES agreement on the stream registration. Verification: Event Store contract checks; links checked.
