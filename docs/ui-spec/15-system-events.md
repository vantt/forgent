---
id: system-events
type: cross-cutting
name: "System Events"
status: active
---

# System events

Backend signals surfaces listen to. Dotted names, exempt from
VR-LISTEN-ORPHAN (they come from the gateway, not from a component).

Every event below arrives from the gateway this client is connected to
(`docs/specs/herdr-web-dashboard.md` R1). None of them is a push
*notification*: R11 pins that nothing on this surface alerts a person, so
these events only keep an already-open screen current. A person who is not
looking learns nothing.

| Event | Meaning | Listened to by |
|---|---|---|
| `work.changed` | One work item's status/stage changed | S02, S03 |
| `question.opened` | An item parked and now needs a person | S02, S04 |
| `question.answered` | A parked item resumed | S03, S04 |
| `merge.settled` | An approve-merge finished (delivered or blocked) | S03 |
| `gateway.unreachable` | The client lost its gateway connection | S02, S03, S04 |

`gateway.unreachable` is the one event every data-bearing screen must
handle, because the area spec's Edge Cases pin the behaviour: say so
plainly, offer retry, and never present stale data as current.

```yaml herdrweb-contract
system: gateway
```
