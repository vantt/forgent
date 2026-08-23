---
id: M02
type: modal
name: "Approve a merge"
platforms: [desktop, mobile]
hosts: []
status: active
design_ref: ""
rules: [R2, R7, R8]
regions: [header, what_lands, consequence, footer]
---

# M02 — Approve a merge

## Purpose

Confirm and run the one operation on this client that changes trunk
(`docs/specs/herdr-web-dashboard.md` §Approve a merge). It exists as its
own modal, rather than an inline button, precisely because of R8: a person
must never change trunk by muscle memory.

## Layout

```
┌────────────────────────────────────────────────────┐
│ Approve merge · tsk-k4v                       [✕]  │  header
├────────────────────────────────────────────────────┤
│ What lands                                         │  what_lands
│ 6 files, +412 / −18                                │
│ into  fgw/tsk-ldb                                  │
│                                                    │
│ herdr-plugin/src/web/mod.rs                        │
│ herdr-plugin/src/web/auth.rs                       │
│ … 4 more                                           │
├────────────────────────────────────────────────────┤
│ This changes trunk.                                │  consequence
│ Runs `fgos approve` on dev-box. The item's own     │
│ verify runs again first; if it fails the item      │
│ parks blocked instead of merging.                  │
├────────────────────────────────────────────────────┤
│                        [ Cancel ]  [ Approve merge ]│ footer
└────────────────────────────────────────────────────┘
```

The consequence panel is not a warning banner to be skimmed — it states
three specific facts (what verb, on which machine, and what happens if
verify fails) so that confirming is an informed act rather than a reflex.

**Where approve cannot run, this modal never opens.** R7 puts the
constraint on the invoking control instead: `Approve merge` on S03 renders
disabled with the reason attached (ERR-APPROVE-UNAVAILABLE). Offering the
modal and failing at submit would be exactly the offered-then-failed
pattern the area spec rules out.

## States

- **ST-READY** — the diff summary and target branch are loaded.
- **ST-SUBMITTING** — approve in flight; both buttons disabled, progress
  on the approve button. This one is not instant, and the modal must not
  look frozen while the verify re-runs.
- **ERR-WRITE-REFUSED** — fgOS refused or the post-merge verify failed and
  the item parked blocked. The engine's own outcome is shown verbatim,
  including the park reason, and the modal stays open so the person reads
  it rather than being dropped back to a screen that silently did nothing.

## Interactions

```yaml herdrweb-contract
interactions:
  - id: A-M02-001
    element: approve_merge_button
    region: footer
    trigger: submit
    guard: "gateway.atMainWorkingTree"
    action: close_overlay
    target: return_to_invoker
    effects: [run_fgos_approve_verb]
  - id: A-M02-002
    element: cancel_button
    region: footer
    trigger: click
    action: close_overlay
    target: return_to_invoker
  - id: A-M02-003
    element: close_icon
    region: header
    trigger: click
    action: close_overlay
    target: return_to_invoker
```
