# Mail bodies in Git: how to expire them (design, for review)

Date: 2026-11-06. Lane MAIL. Status: proposal, nothing built. Owner decision of 2026-11-06: accept that mail is
visible on the public remote (option a), but old mail must be cleaned up after some time.

## Facts checked today

- The remote `origin` (github.com/vantt/forgent) is PUBLIC. `git ls-remote` with no credentials lists
  `refs/fgos/events/<machine>`, so the three machines' event refs are world-readable.
- A `mailbox.message-sent` event carries `payload.body` (the message text), so bodies are on the remote.
- The local mailbox record already expires: `mailbox.record.ttlSec` and `bodyRetentionSec` are 86400 s.
  Nothing expires in Git. One ref per machine, one seal commit per seal, about 100 commits since 2026-10-25
  on this machine, 1.7 KB for the latest commit's tree: the size is small, the retention is unbounded.
- Event Store spec, "Chain invariant": every seal commit of a (origin, stream) descends from every earlier one,
  and the reader's coverage walk and `certified` set depend on it. Squashing or rewriting a machine's event ref
  would break other machines' cursors. So expiry cannot be a history rewrite of the event ref.

## What expiry has to mean

A body older than N days is no longer readable from the refs a fresh clone fetches. The signed header (who,
to whom, when, settled offered or refused) may stay: it carries no text. On a public host nothing is ever
fully recalled: a clone made before the cleanup keeps its copy, and GitHub keeps unreachable objects
reachable by id for some time. The goal is bounded exposure, not erasure.

## Options

1. **Body in a separate, rotating ref.** The sent event keeps a hash of the body; the body goes into
   `refs/fgos/mail-bodies/<machine>`, which is not an event stream and so is outside the chain invariant. Every
   N days the sender resets that ref to a new root holding only the bodies younger than N days. The header
   event never changes. Cost: one new ref and a receiver that fetches it with the events; a receiver that
   fetches late sees header without body (the same state as an expired record). Touches the sent event
   shape (signing domain `mailbox.message-sent`), so an Event Store change.
2. **Encrypted body, key expires.** The body is encrypted with a per-message key held only in the two local
   records; the key is deleted at the TTL. Git keeps ciphertext forever, which is unreadable once keys are
   gone. Cost: key delivery between machines is a new secret path, which is more than this problem is worth.
3. **Rewrite the event ref (squash old seals).** Cheap to describe, but breaks the chain invariant and other
   machines' certified sets. Rejected unless Event Store itself defines a certified truncation.
4. **Do nothing more.** Accept as the owner did, with the 1 day record TTL only.

## Recommendation

Option 1, after OPC and the Event Store lane agree that the body leaves the signed event. Start with a
measurement: how many bodies, how large, to size N (7 days is a starting guess, owner to set). Until it
lands, option 4 stands.

## Open questions

- Does Event Store accept a signed event that holds a body hash and not the body (spec change to the signing
  domain, owner of that spec: ES lane)?
- N, the body lifetime in the rotating ref (7 days proposed)?
- Does a receiver need the body after its own record TTL (1 day)? If not, N could be 2 days.
