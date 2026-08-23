---
id: system-events
type: cross-cutting
name: "System Events"
status: active
---

# System events

Backend signals surfaces listen to. Dotted names, exempt from
VR-LISTEN-ORPHAN (they come from the gateway, not from a component).

**These are client-derived events, not server-pushed ones.** The gateway
has no SSE and no WebSocket — its only change-detection surface is a cheap
poll of `GET /v1/state/digest`, which returns a `data_hash`
(`docs/contracts/fgos-gateway-api-v1.yaml`; 17 routes, none of them a
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
