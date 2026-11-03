---
id: system-events
type: cross-cutting
name: "System Events"
status: active
---

# System events

```txt
Document type: Contract
Audience: Maintainer, implementer, agent
Purpose: Define the stated scope and preserve its source provenance and limits
Design status: Accepted at atomic cutover
Implementation: Carriage only; current implementation truth is not certified
Provenance: docs/ui-spec/15-system-events.md at 111adc51fd047d99121fd9d076eb4794c87045a4
Writer type: Agent draft writer
Canonical: Yes
Canonical for: The document scope stated above; source implementation limits remain explicit
Use this when: Reading or changing the stated scope and its contracts
Do not use this for: Standalone implemented-behavior proof or claims outside the stated scope
Last reviewed: No current review date recorded; retained source dates are historical
Related:
- Source coordinate (provenance only; not a reader destination): `docs/ui-spec/15-system-events.md` at `1839de60b72e1cc1848f4f686f8a13ed6dfef667`
Supersedes: The mapped source location at atomic cutover
Superseded by: None
```

> Retained source: `docs/ui-spec/15-system-events.md` at `947dc310396071a4d530216d5c06d05993d63bf5`; source assertions retain their recorded limits.

Backend signals surfaces listen to. Dotted names, exempt from
VR-LISTEN-ORPHAN (they come from the gateway, not from a component).

**These are client-derived events, not server-pushed ones.** The gateway
has no SSE and no WebSocket — its only change-detection surface is a cheap
poll of `GET /v1/state/digest`, which returns a `data_hash`
(`docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml`; 17 routes, none of them a
stream). The client polls that digest, and when the hash differs from the
one it last saw, it re-reads whatever the open screen needs and raises the
events below itself. Nothing in the gateway emits them.

That distinction is load-bearing for anyone implementing a screen: there is
no subscription to open, no connection to keep alive, and no ordering
guarantee between events — only "the hash changed, so something did." An
event here names *what the client concluded changed*, not a message that
arrived.

R11 still pins that nothing on this surface alerts a person, so these
events only keep an already-open screen current. A person who is not
looking learns nothing — and with polling that is doubly true, since a
screen that is closed is not polling at all.

| Event | Meaning | Listened to by |
|---|---|---|
| `work.changed` | One work item's status/stage changed | S02, S03 |
| `question.opened` | An item parked and now needs a person | S02, S04 |
| `question.answered` | A parked item resumed | S03, S04 |
| `merge.settled` | An approve-merge finished (delivered or blocked) | S03 |
| `gateway.unreachable` | The digest poll itself failed | S02, S03, S04 |

`gateway.unreachable` is the one event every data-bearing screen must
handle, because the area spec's Edge Cases pin the behaviour: say so
plainly, offer retry, and never present stale data as current. Under
polling it is also the most common of the five, since every poll is a fresh
chance for the gateway to be unreachable.

```yaml herdrweb-contract
system: gateway
```
