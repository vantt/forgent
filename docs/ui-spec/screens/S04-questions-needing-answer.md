---
id: S04
type: screen
name: "Questions needing answer"
platforms: [desktop, mobile]
hosts: []
status: active
design_ref: ""
rules: [R1, R5, R9, R11]
regions: [topbar, list]
---

# S04 — Questions needing answer

## Purpose

One list of everything currently waiting on a person, across **both**
channels — `ask` questions and `gate-approve` questions (D4, and
`docs/specs/herdr-web-dashboard.md` Data Dictionary #4). D4's whole point
is that these are one category to a person even though they are two
mechanisms to the engine, so this screen never splits them into two tabs.

It is the "is there anything for me" surface. On a phone it is often the
only screen a person opens.

## Layout

```
┌ TOPBAR ────────────────────────────────────────────────────┐
│ ← Board   Needs answer · 2      ⚠ reachable on network     │
├ LIST ──────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────┐ │
│ │ tsk-4id · Task detail pairing            parked 2h ago │ │
│ │ ASK                                                    │ │
│ │ Which pairing key should the timeline use when         │ │
│ │ askHistory and settlements have drifted by one?        │ │
│ │                                    [ Answer ] [ Open ] │ │
│ └────────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ tsk-k4v · Webserver core                 parked 6h ago │ │
│ │ GATE · validateApprove                                 │ │
│ │ Plan is ready and the reality gate passed. Two CSS     │ │
│ │ options are still standing — which one?                │ │
│ │                                    [ Answer ] [ Open ] │ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

The channel shows as a small tag (`ASK` / `GATE · <gate name>`) rather
than as a section split. A person answering does not care which mechanism
parked the item; they care what is being asked. But the tag stays visible
because a gate question and an ask question have different weight, and
hiding that would be flattening real information.

**Each row carries the question text itself, not just the item title.**
That is the readability criterion applied at list level: a person should
be able to triage — "this one I can answer now, that one needs a laptop" —
without opening anything.

Rows are ordered oldest-first: the thing that has been waiting longest is
the thing most likely to be blocking something else.

## States

- **ST-EMPTY-QUESTIONS** — "Nothing is waiting on you." Reads as the good
  outcome, with no error styling and no call to action.
- **ST-DISCONNECTED** — list marked stale, answer controls disabled.

Per R11 there is no bell and no badge that implies push. The count in the
topbar is true at the moment of looking, and the screen does not pretend
otherwise.

## Interactions

```yaml herdrweb-contract
interactions:
  - id: A-S04-001
    element: answer_button
    region: list
    trigger: click
    action: open_overlay
    target: M01
    payload: { item_id: "$row.item_id" }
  - id: A-S04-002
    element: open_item_button
    region: list
    trigger: click
    action: navigate
    target: S03
    payload: { item_id: "$row.item_id" }
  - id: A-S04-003
    element: back_to_board
    region: topbar
    trigger: click
    action: navigate
    target: S02
  - id: A-S04-004
    element: list
    listens_to: question.opened
    action: mutate
    effects: [insert_row_oldest_first]
  - id: A-S04-005
    element: list
    listens_to: question.answered
    action: mutate
    effects: [remove_row]
  - id: A-S04-006
    element: list
    listens_to: gateway.unreachable
    action: mutate
    effects: [mark_stale, disable_writes]
```
