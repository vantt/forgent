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

Desktop offers **two board views of the same underlying grouped data** —
a person picks whichever reading suits the moment, and the choice is
remembered (D16, `docs/history/herdr-web-dashboard/CONTEXT.md`). Neither
view is a separate screen; both read the same `GET /work` grouped-by-status
data, they only differ in how that grouping renders.

**Group view** (default) — status groups stacked vertically, each
collapsible, with the "needs answer" rail pinned right so the one urgent
category is never scrolled past. Best for triage: scan every group's count
without horizontal scanning.

```
┌ TOPBAR ────────────────────────────────────────────────────────────────┐
│ herdr   [project ▾]  [gateway: dev-box ▾]      ⚠ reachable on network  │
├ CONTROLS ──────────────────────────────────────────────────────────────┤
│ [search…]  Group by: [Status ▾]  Filter: [Stage ▾][Risk ▾]  View:[▤ ▥]  [+ Add] │
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

**Kanban view** — the same groups as side-by-side columns, each with its
own colored header bar; cards move by drag or by the same `⋯` quick-action
menu group view uses. Best for working a single group's queue left-to-right
without collapsing everything else. The "needs answer" rail still pins
right, unchanged, because A-S02-006's target (S04) does not depend on
which board view is active.

```
┌ TOPBAR ────────────────────────────────────────────────────────────────┐
│ herdr   [project ▾]  [gateway: dev-box ▾]      ⚠ reachable on network  │
├ CONTROLS ──────────────────────────────────────────────────────────────┤
│ [search…]  Group by: [Status ▾]  Filter: [Stage ▾][Risk ▾]  View:[▤ ▥]  [+ Add] │
├ BOARD (kanban) ─────────────────────────────────────────┬ NEEDS ANSWER ┤
│ ●AMBER        │ ●BLUE          │ ●SLATE      │ ●GREEN   │              │
│ NEEDS ANSWER·2│ IN PROGRESS·3  │ TODO·11     │ DONE·48  │  tsk-4id     │
│ ┌───────────┐ │ ┌────────────┐ │ ┌─────────┐ │          │  "Which…"    │
│ │ tsk-4id ⋯ │ │ │ tsk-5jr  ⋯ │ │ │ ...   ⋯ │ │          │  [ Answer ]  │
│ │ awaiting- │ │ │ doing ·    │ │ └─────────┘ │          │              │
│ │ human     │ │ │ executing  │ │ ┌─────────┐ │          │  tsk-k4v     │
│ └───────────┘ │ └────────────┘ │ │ ...   ⋯ │ │          │  gate: ...   │
│ ┌───────────┐ │                │ └─────────┘ │          │  [ Review ]  │
│ │ tsk-k4v ⋯ │ │                │             │          │              │
│ └───────────┘ │                │             │          │              │
└────────────────┴────────────────┴─────────────┴──────────┴──────────────┘
```

Mobile always uses group view (kanban's side-by-side columns do not fit a
phone width) — the rail becomes the first group, because on a phone the
whole point is "does anything need me":

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

Four layout decisions worth stating, because each one is load-bearing:

- **Groups are collapsible and remember their state.** `DONE · 48` is
  noise on a phone; it collapses and stays collapsed.
- **The exposure indicator lives in the topbar, always.** R5 says the
  surface is on by default and reachable beyond loopback. That is a
  standing fact about this deployment, so it gets a standing indicator,
  never a dismissable toast.
- **The gateway picker is in the topbar too**, because R1 forbids
  assuming one fixed origin, and a person aggregating several machines
  needs to know which one they are looking at before they read a number.
- **Group view and kanban view are the same data, two renderings** (D16).
  The toggle lives in CONTROLS next to Group by, not in the topbar — it is
  a reading preference, not deployment state like the exposure indicator.
  Desktop only; a phone always gets group view (side-by-side columns do
  not fit).

## States

**ST-LOADING** shows skeleton cards inside real group headers (both
views), so counts appear before content and the layout never jumps.
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
  - id: A-S02-012
    element: view_toggle_control
    region: controls
    trigger: click
    action: mutate
    effects: [switch_board_view, persist_view_state]
  - id: A-S02-013
    element: kanban_card
    region: board
    trigger: drag_drop
    guard: "board.view === 'kanban'"
    action: mutate
    effects: [run_one_door_write_verb, regroup_board]
```
