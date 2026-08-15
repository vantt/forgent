---
id: S03
type: screen
name: "Task detail"
platforms: [desktop, mobile]
hosts: []
status: active
design_ref: ""
rules: [R1, R5, R7, R8, R9, R10]
regions: [topbar, question, why, context, timeline, actions]
---

# S03 — Task detail

## Purpose

**The core deliverable of the whole cluster.** The area spec says the
taskboard exists mainly to reach this screen
(`docs/specs/herdr-web-dashboard.md` §View a task's detail).

The acceptance criterion is subjective and stated plainly in the item that
commissioned this spec: *a question framed so a person with no context in
their head can answer it quickly*. That sentence is the whole design
brief. Everything below is downstream of it, and it is why the layout
leads with the question rather than with the item.

## Layout

Three regions, in a fixed reading order, because the order **is** the
design: what is being asked → why it is being asked → what it is about.

```
┌ TOPBAR ────────────────────────────────────────────────────────────────┐
│ ← Board    tsk-4id · Task detail pairing        ⚠ reachable on network │
├ QUESTION ──────────────────────────────────────────────────────────────┤
│                                                                        │
│  NEEDS YOUR ANSWER · parked 2h ago · round 3 of 3                      │
│                                                                        │
│  Which pairing key should the timeline use when askHistory and         │
│  settlements have drifted by one?                                      │
│                                                                        │
│  [ Answer this ]                                                       │
│                                                                        │
├ WHY ───────────────────────────────────────────────────────────────────┤
│  Why you're being asked                                                │
│  Two options are still standing after a real comparison, and the       │
│  locked decision (D2) deliberately added no linking key.               │
│  Tried already: read D2, ran the pairing on tsk-48i's 23/23 records.   │
├ CONTEXT ───────────────────────────────────┬ TIMELINE ─────────────────┤
│  What this item is                         │  round 1 · 4d ago         │
│                                            │  Q  Should the detail     │
│  tsk-4id · P4 task detail                  │     screen show the       │
│  ● awaiting-human · executing · high-risk  │     machine log at all?   │
│                                            │  A  No — narrative first. │
│  What the agent did                        │                          │
│  Read ports.rs, confirmed WorkItemSource   │  round 2 · 2d ago         │
│  has 5 fetch_* methods. Wrote the pairing  │  Q  Collapse or omit?     │
│  read on top of settlements[] ordered by   │  A  Collapse.             │
│  seq, no schema change (D2).               │                          │
│                                            │  round 3 · 2h ago         │
│  ▸ Machine decision log (12)               │  Q  Which pairing key…    │
│                                            │  A  — waiting             │
├ ACTIONS ───────────────────────────────────┴──────────────────────────┤
│  [ Answer this ]   [ Edit ]   [ Retire ]      [ Approve merge ⓘ ]     │
└────────────────────────────────────────────────────────────────────────┘
```

Mobile stacks the same order — question, why, context, timeline — because
the order is the value, not the columns. The timeline collapses to its
most recent round with "show 2 earlier rounds".

### Why the three regions sit in this order

- **QUESTION first, alone, large.** A person arriving cold reads one
  thing. Putting item metadata above it would make them scroll past
  bookkeeping to reach the only thing that needs them.
- **WHY second, and it carries what was already tried.** This is the
  difference between a question a person can answer in ten seconds and one
  they have to go investigate. It names the options still standing and the
  work already done — so the person is editing reasoning, not starting
  from nothing.
- **CONTEXT third, narrative before machine log.** R10 exactly: the human
  narrative is the primary account, the machine decision log renders
  collapsed behind a disclosure showing its count.

### The question/answer timeline across rounds

R9 governs this and constrains it honestly: pairing is **positional** —
the i-th question with the i-th answer, in recorded order. So the timeline
renders as an ordered list of rounds and **never draws a link the data
does not carry**. No arrows implying causality between a specific answer
and a specific later question; just order, with timestamps.

The still-open round renders with its answer slot visibly empty (`—
waiting`) rather than omitted, so a person can see at a glance that
exactly one round is outstanding and which one.

## States

- **ST-NEVER-PARKED** — the QUESTION region is replaced by a quiet "This
  item has never needed a person", and TIMELINE says the same. Not an
  error, and not an empty box with no explanation.
- **ST-NARRATIVE-MISSING** — CONTEXT keeps the item's own fields and says
  the narrative directory was not found, naming the path it looked for.
- **ERR-NARRATIVE-PATH** — same region, different sentence: the reference
  resolved outside the documentation tree and was refused.
- **ERR-APPROVE-UNAVAILABLE** — R7 rendered: `Approve merge` is shown
  **disabled with the reason attached** (the ⓘ in the layout above), never
  hidden and never offered-then-failed.
- **ST-DISCONNECTED** — content marked stale, actions disabled, retry
  offered.

Per R8, the three write controls in ACTIONS are visually distinct from
everything above them, and `Approve merge` is distinct again from the
other two — it is the only control on this client that changes trunk.

## Interactions

```yaml herdrweb-contract
interactions:
  - id: A-S03-001
    element: answer_button
    region: question
    trigger: click
    guard: "item.isParked"
    action: open_overlay
    target: M01
    payload: { item_id: "$item.id" }
  - id: A-S03-002
    element: approve_merge_button
    region: actions
    trigger: click
    guard: "item.awaitingApproval && gateway.atMainWorkingTree"
    action: open_overlay
    target: M02
    payload: { item_id: "$item.id" }
  - id: A-S03-003
    element: edit_button
    region: actions
    trigger: click
    action: open_overlay
    target: M03
    payload: { item_id: "$item.id", mode: "edit" }
  - id: A-S03-004
    element: machine_log_disclosure
    region: context
    trigger: click
    action: mutate
    effects: [toggle_machine_log]
  - id: A-S03-005
    element: back_to_board
    region: topbar
    trigger: click
    action: navigate
    target: S02
  - id: A-S03-006
    element: timeline_show_earlier
    region: timeline
    trigger: click
    action: mutate
    effects: [expand_earlier_rounds]
  - id: A-S03-007
    element: detail
    listens_to: work.changed
    action: mutate
    effects: [refresh_item]
  - id: A-S03-008
    element: timeline
    listens_to: question.answered
    action: mutate
    effects: [close_open_round]
  - id: A-S03-009
    element: actions
    listens_to: merge.settled
    action: mutate
    effects: [refresh_item, show_outcome]
  - id: A-S03-010
    element: detail
    listens_to: gateway.unreachable
    action: mutate
    effects: [mark_stale, disable_writes]
  - id: A-S03-011
    element: retire_action
    listens_to: item.quick_action
    action: mutate
    effects: [run_move_to_wontfix]
```
