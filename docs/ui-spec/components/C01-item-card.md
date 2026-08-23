---
id: C01
type: component
name: "Item card with status pill and quick actions"
platforms: [desktop, mobile]
hosts: [S02, S03]
status: active
design_ref: ""
rules: [R2, R8]
regions: [pill, title, quick_actions]
---

# C01 — Item card (status pill + quick actions)

## Purpose

The repeated unit of the taskboard, and the thing that makes it a board
rather than a table. It carries the two affordances the Monday.com/ClickUp
reference is actually about: **status legible at a glance** (a coloured
pill) and **quick actions reachable in place** without opening the item
(`docs/specs/herdr-web-dashboard.md` §View the taskboard).

## Layout

```
┌────────────────────────────────────┐
│ tsk-4id  Task detail pairing    ⋯ │  ← quick_actions menu
│ ● awaiting-human · executing       │  ← pill + stage
└────────────────────────────────────┘

⋯ menu:
  ┌──────────────────┐
  │ Answer           │  (only when parked)
  │ Edit             │
  │ Retire           │
  └──────────────────┘
```

The pill carries **status**, in colour; the stage rides alongside it as
plain text. Status is what a person triages on; stage is detail. Giving
both the same visual weight would defeat the glance.

`Retire` is worded as retire, never as delete — fgOS has no delete verb
and the history is append-only, so calling it "delete" would promise
something the system cannot do
(`docs/specs/herdr-web-dashboard.md` §Retire a work item).

Per R8 the quick-action menu is visually distinct from the card body: the
card is a read surface, the menu is where writes happen. `Approve merge`
is deliberately **not** in this menu — the one trunk-changing action does
not live behind a hover affordance on a list row.

## Component contract

Per the component model, this emits events only; hosts decide what
happens. That is what keeps the card reusable on both S02 and S03 without
either screen's navigation leaking into it.

```yaml herdrweb-contract
emits:
  - id: A-C01-001
    element: quick_action_menu_item
    region: quick_actions
    trigger: click
    event: item.quick_action
    payload: { item_id: "$item.id", verb: "$action.verb" }
```
