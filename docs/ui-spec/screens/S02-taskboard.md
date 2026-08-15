---
id: S02
type: screen
name: "Taskboard"
platforms: [desktop, mobile]
hosts: []
status: active
design_ref: ""
rules: [R1, R5, R11]
regions: [topbar, controls, board, needs_answer_rail]
---

# S02 — Taskboard

## Purpose

The landing surface after sign-in, and the way to reach everything else.
The area spec is explicit that this is **a board, not a flat table**, with
Monday.com/ClickUp as the reference: items grouped by status, state
legible at a glance, quick actions in place, and controls to filter and
regroup (`docs/specs/herdr-web-dashboard.md` §View the taskboard).

That reference is not decoration. The thing this whole cluster is for is a
person opening their phone and finding out, in one look, whether anything
needs them. A flat table makes that a reading exercise; a grouped board
with coloured status makes it a glance.

## Layout

Desktop — status groups stacked vertically, each collapsible, with the
"needs answer" rail pinned right so the one urgent category is never
scrolled past:

```
┌ TOPBAR ────────────────────────────────────────────────────────────────┐
│ herdr   [project ▾]  [gateway: dev-box ▾]      ⚠ reachable on network  │
├ CONTROLS ──────────────────────────────────────────────────────────────┤
│ [search…]  Group by: [Status ▾]  Filter: [Stage ▾][Risk ▾]  [+ Add]    │
├ BOARD ──────────────────────────────────┬ NEEDS ANSWER ────────────────┤
│                                         │                              │
│ ▾ NEEDS ANSWER · 2          ● amber     │  tsk-4id                     │
│  ┌────────────────────────────────────┐ │  "Which pairing key…"        │
│  │ tsk-4id  Task detail pairing    ⋯ │ │  parked 2h ago               │
│  │ ● awaiting-human · executing      │ │  [ Answer ]                  │
│  └────────────────────────────────────┘ │                              │
│  ┌────────────────────────────────────┐ │  tsk-k4v                     │
│  │ tsk-k4v  Webserver core         ⋯ │ │  gate: validateApprove       │
│  │ ● awaiting-approval · executing   │ │  [ Review ]                  │
│  └────────────────────────────────────┘ │                              │
│                                         │                              │
│ ▾ IN PROGRESS · 3           ● blue      │                              │
│  ┌────────────────────────────────────┐ │                              │
│  │ tsk-5jr  Taskboard              ⋯ │ │                              │
│  │ ● doing · executing               │ │                              │
│  └────────────────────────────────────┘ │                              │
│                                         │                              │
│ ▸ TODO · 11                 ● slate     │                              │
│ ▸ DONE · 48                 ● green     │                              │
└─────────────────────────────────────────┴──────────────────────────────┘
```

Mobile — the rail becomes the first group, because on a phone the whole
point is "does anything need me":

```
┌────────────────────────────┐
│ herdr  [dev-box ▾]   ⚠     │
│ [search…]      [Filter ▾]  │
├────────────────────────────┤
│ ▾ NEEDS ANSWER · 2   ●     │
│ ┌────────────────────────┐ │
│ │ tsk-4id             ⋯ │ │
│ │ Task detail pairing    │ │
│ │ ● awaiting-human       │ │
│ │ [ Answer ]             │ │
│ └────────────────────────┘ │
│ ▸ IN PROGRESS · 3    ●     │
│ ▸ TODO · 11          ●     │
└────────────────────────────┘
```

Three layout decisions worth stating, because each one is load-bearing:

- **Groups are collapsible and remember their state.** `DONE · 48` is
  noise on a phone; it collapses and stays collapsed.
- **The exposure indicator lives in the topbar, always.** R5 says the
  surface is on by default and reachable beyond loopback. That is a
  standing fact about this deployment, so it gets a standing indicator,
  never a dismissable toast.
- **The gateway picker is in the topbar too**, because R1 forbids
  assuming one fixed origin, and a person aggregating several machines
  needs to know which one they are looking at before they read a number.

## States

**ST-LOADING** shows skeleton cards inside real group headers, so counts
appear before content and the layout never jumps.
**ST-EMPTY-BOARD** and **ST-EMPTY-FILTER** are deliberately different
screens — see `30-states-and-errors.md`. **ST-DISCONNECTED** marks the
board stale in place rather than blanking it.

No bell, no notification badge that implies push: **R11** — the count in
a group header is current only because the person is looking at it.

## Interactions

```yaml herdrweb-contract
interactions:
  - id: A-S02-001
    element: item_card
    region: board
    trigger: click
    action: navigate
    target: S03
    payload: { item_id: "$item.id" }
  - id: A-S02-002
    element: add_item_button
    region: controls
    trigger: click
    action: open_overlay
    target: M03
  - id: A-S02-003
    element: group_header
    region: board
    trigger: click
    action: mutate
    effects: [toggle_group_collapsed, persist_collapse_state]
  - id: A-S02-004
    element: filter_control
    region: controls
    trigger: change
    action: mutate
    effects: [apply_filter, show_active_filter_summary]
  - id: A-S02-005
    element: group_by_control
    region: controls
    trigger: change
    action: mutate
    effects: [regroup_board]
  - id: A-S02-006
    element: needs_answer_entry
    region: needs_answer_rail
    trigger: click
    action: navigate
    target: S04
  - id: A-S02-007
    element: gateway_picker
    region: topbar
    trigger: change
    action: mutate
    effects: [switch_gateway_endpoint, reload_board]
  - id: A-S02-008
    element: board
    listens_to: work.changed
    action: mutate
    effects: [refresh_affected_card]
  - id: A-S02-009
    element: needs_answer_rail
    listens_to: question.opened
    action: mutate
    effects: [add_to_rail]
  - id: A-S02-010
    element: board
    listens_to: gateway.unreachable
    action: mutate
    effects: [mark_stale, offer_retry]
  - id: A-S02-011
    element: card_quick_action
    listens_to: item.quick_action
    action: mutate
    effects: [run_one_door_write_verb]
```
