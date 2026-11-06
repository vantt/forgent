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

Mail already sent keeps its body in the event ref (chain invariant). Earlier clones and GitHub's
unreachable objects keep what they saw. Windows scheduler, Codex wake, a delivery daemon.

## Phases (each lands on its own, in this order)

1. **Git crate: body ref namespace.** Fetch maps `refs/fgos/mail-bodies/*` with `+` into its own local mirror.
   Push of that namespace only is a leased replace (`--force-with-lease=<ref>:<remote_old>`, the tip the
   RemotePush intent already records). New writer authority and lock for the body ref. Commit/tree door only,
   census regenerated in the same commit. Review: OPC. Gates: msvc, clippy `-D warnings`, darwin check.
2. **Mailbox: receiver understands payload v3.** Verify `fgos-mailbox-message/3`, read the body from the body
   mirror by hash, header-without-body is the expired state, older receivers still drop v3 as
   remote-malformed. Register the new schemaVersion (ES reviews). No sender change yet.
3. **Upgrade every receiver.** fg-server2, fg-server (via RULE), design-lap. `fgos mailbox status` shows
   the payload version each machine accepts. Nothing is sent as v3 before all three accept it.
4. **Mailbox: sender switches to v3.** Write the body to the body ref, push it before the event ref, keep
   v2 only for a receiver that has not been upgraded (decided by a per-remote setting, off by default).
5. **Rotation.** Every 7 days the owner machine builds a new root with the bodies younger than 7 days and
   replaces the ref under the lease. `fgos mailbox status` lists the oldest body kept.
6. **Proof on two machines.** Send, receive, rotate, show the expired state; add the numbers to the existing
   cross-machine report.

## Budget

Phases 1 and 2 are the bulk (about 2 working days each with review); 3 is waiting on RULE and design-lap;
4 and 5 are small; 6 is half a day. The plan stops after any phase if OPC or ES finds a problem.

## Risks

- A sender switches before a receiver is upgraded: mail is dropped as remote-malformed. Mitigation: phase 3
  gate and the per-remote setting.
- The leased replace loses a race with another writer: the push is refused, rotation retries next sync.
- A body is pushed but its event is not (crash): an orphan body is dropped at the next rotation.

## Questions for the owner

- Approve the six phases and the order (nothing is sent as v3 until all three machines accept it)?
- design-lap runs another lead (LAND/DOC); who upgrades it?
