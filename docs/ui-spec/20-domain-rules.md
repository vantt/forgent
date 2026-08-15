---
id: domain-rules
type: cross-cutting
name: "Domain Rules"
status: active
---

# Domain rules

Every rule here is taken from `docs/specs/herdr-web-dashboard.md`
`## Business Rules` (R1-R11). **No rule is invented at this layer** — the
UI spec draws the product's rules, it does not add any. The mapping below
is bidirectional: a surface listed under a rule must carry that rule ID in
its own frontmatter `rules:` array, or `npm run check` errors with
VR-RULE-DRIFT.

| Rule | What it means for the UI |
|---|---|
| **R1** | The client addresses a gateway, and must not assume a single fixed one. Every data-bearing surface shows which endpoint it is reading, and the endpoint is switchable rather than baked in. |
| **R2** | Every write on screen maps to one fgOS one-door-write verb. A control that cannot name its verb does not belong in this spec. |
| **R3** | Nothing is readable before sign-in, and a failed sign-in reveals nothing — one indistinguishable failure state, never "wrong password" vs "no such user". |
| **R4** | The token is never displayed, never copied into the DOM, and never persisted by the client beyond its session cookie. |
| **R5** | The surface is on by default and reachable beyond loopback; the UI carries a standing, non-dismissable exposure indicator rather than a one-time notice. |
| **R6** | Dashboard availability is independent of the cockpit — the UI never tells a person to "open the cockpit first". |
| **R7** | Approve-merge is only offered where fgOS can actually run it. Where it cannot, the control is shown disabled **with the reason**, never hidden and never offered-then-failed. |
| **R8** | Because the surface is exposed by default and can change trunk, the write controls are visually distinct from the read surface — a person must never trigger a trunk change by muscle memory. |
| **R9** | Question/answer pairing is positional. The timeline renders pairs in recorded order and never implies a link the data does not carry. |
| **R10** | The human narrative is the primary account; the machine decision log renders collapsed by default. |
| **R11** | Nothing pushes. The UI must not imply it will alert anyone — no bell, no "we'll notify you". |

```yaml herdrweb-contract
rules:
  - id: R1
    name: Client of a gateway, never a fixed origin
    surfaces: [S02, S03, S04]
  - id: R2
    name: Every write goes through a one-door-write verb
    surfaces: [M01, M02, M03, C01]
  - id: R3
    name: No read before sign-in, opaque failure
    surfaces: [S01]
  - id: R4
    name: Token never surfaced or persisted by the client
    surfaces: [S01]
  - id: R5
    name: Standing exposure indicator
    surfaces: [S02, S03, S04]
  - id: R6
    name: Availability independent of the cockpit
    surfaces: [S01]
  - id: R7
    name: Approve-merge only where it can run, disabled with a reason otherwise
    surfaces: [S03, M02]
  - id: R8
    name: Write controls visually distinct from the read surface
    surfaces: [S03, M02, C01]
  - id: R9
    name: Positional question/answer pairing
    surfaces: [S03, S04]
  - id: R10
    name: Narrative primary, machine log collapsed
    surfaces: [S03]
  - id: R11
    name: Nothing pushes; being informed is a pull
    surfaces: [S02, S04]
```
