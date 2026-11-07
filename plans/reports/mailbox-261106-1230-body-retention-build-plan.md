# Mail body retention: build plan for owner approval

Date: 2026-11-06. Lane MAIL. Status: plan only, no code. Design: `mailbox-261106-1215-mail-retention-in-git-design.md`.
Agreed so far: owner chose 7 days and option 1; ES accepted the payload change (no Event Store code);
OPC accepted the Git side with conditions (leased replace, one ref per machine, grant only for
`refs/fgos/mail-bodies/*`, own writer lock, body pushed before the event).

## Outcome

A message body leaves the signed event. The event keeps `bodyHash` (sha256) and `bodyBytes`; the body is
written to `refs/fgos/mail-bodies/<machine>`, which its owner machine resets every 7 days to a new root holding
only the bodies younger than 7 days. A receiver that finds a header without its body treats it as expired.

## Not in scope

Until step 7 runs, mail already sent keeps its body in the event ref (chain invariant). Earlier clones and
GitHub's unreachable objects keep what they saw, even after step 7. Windows scheduler, Codex wake, a delivery daemon.

## Phases (each lands on its own, in this order; the owner approved 1 to 6 on 2026-11-06 and asked for 7)

1. **Git crate: body ref namespace.** Fetch maps `refs/fgos/mail-bodies/*` with `+` into its own local mirror.
   Push of that namespace only is a leased replace (`--force-with-lease=<ref>:<remote_old>`, the tip the
   RemotePush intent already records). New writer authority and lock for the body ref. Commit/tree door only,
   census regenerated in the same commit. Review: OPC. Gates: msvc, clippy `-D warnings`, darwin check.
2. **Mailbox: receiver understands payload v3.** Verify `fgos-mailbox-message/3`, read the body from the body
   mirror by hash, header-without-body is the expired state, older receivers still drop v3 as
   remote-malformed. Register the new schemaVersion (ES reviews). No sender change yet.
2b. **Mailbox sync child fetches the body mirror (added 2026-11-07, OPC ruling).** After the Event Store sync returns,
   `PublicationPort::fetch_refs` takes the mail-bodies mapping alone (events first, then bodies, then ingest), under the
   body ref's own authority and the fixed writer id. A v3 header without its blob is settled `remote-body-expired` only
   when a body fetch started after this sync's event fetch succeeded on a clone that has the third mapping; in every
   other case (mapping missing, fetch failed, Git read error) the header is held: the cursor for that origin stops
   before it, bounded by the existing MAX_AGE stale rule. No Event Store change. Step 2 landed (`336073f11`, `60a430f8e`).
   **Gate: no machine sends v3 until 2b has landed and every receiver runs it.**
3. **Upgrade every receiver.** fg-server2, fg-server (via RULE), design-lap. `fgos mailbox status` shows
   the payload version each machine accepts. Nothing is sent as v3 before all three accept it.
4. **Mailbox: sender switches to v3.** (Condition: the body push is acknowledged before the event is appended; test it on the sender side.) Write the body to the body ref, push it before the event ref, keep
   v2 only for a receiver that has not been upgraded (decided by a per-remote setting, off by default).
5. **Rotation.** Every 7 days the owner machine builds a new root with the bodies younger than 7 days and
   replaces the ref under the lease. `fgos mailbox status` lists the oldest body kept.
6. **Proof on two machines.** Send, receive, rotate, show the expired state; add the numbers to the existing
   cross-machine report.

7. **Delete the old mail from the event history (owner decision 2026-11-06: delete, keep nothing).** After step 4 no
   new body enters the event refs, so the set of old `project:mailbox` seal commits stops growing. One
   coordinated operation removes them from the three event refs (each ref also holds identity and other
   streams, which stay). It needs what the other steps do not: Event Store defines a certified truncation of a
   stream (sequence numbers and the reader's certified commit set stay valid), the three machines rebuild their
   caches, and the event refs are replaced under a lease (a new publication grant, OPC and the census).
   GitHub keeps unreachable objects for some time and earlier clones keep their copy; only a request to GitHub
   support removes the cached objects. Starts only after steps 1 to 6 are proven and OPC and the Event Store
   owner agree on the truncation.

## Budget

Phase 7 is a separate design first (Event Store truncation), about 2 days with review once it starts. Phases 1 and 2 are the bulk (about 2 working days each with review); 3 is waiting on RULE and design-lap;
4 and 5 are small; 6 is half a day. The plan stops after any phase if OPC or ES finds a problem.

## Risks

- Known downgrade limit: `CounterReason` (counters.rs) has no `#[serde(other)]`, so a binary older than step 2 cannot load a record that counted `remote-body-expired`; every earlier reason was added the same way.
- A sender switches before a receiver is upgraded: mail is dropped as remote-malformed. Mitigation: phase 3
  gate and the per-remote setting.
- The leased replace loses a race with another writer: the push is refused, rotation retries next sync.
- A body is pushed but its event is not (crash): an orphan body is dropped at the next rotation.

## Questions for the owner

- Approve the six phases and the order (nothing is sent as v3 until all three machines accept it)?
- design-lap runs another lead (LAND/DOC); who upgrades it?
