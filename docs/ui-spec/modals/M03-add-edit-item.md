---
id: M03
type: modal
name: "Add or edit a work item"
platforms: [desktop, mobile]
hosts: []
status: active
design_ref: ""
rules: [R2]
regions: [header, form, footer]
---

# M03 — Add or edit a work item

## Purpose

Create a new work item, or overwrite the fields of an existing one
(`docs/specs/herdr-web-dashboard.md` §Add a work item, §Edit a work item).
One modal in two modes, because the fields and the validation are the
same; only the verb underneath differs.

## Layout

```
┌────────────────────────────────────────────────────┐
│ New work item                                 [✕]  │  header
│ (edit mode: "Edit · tsk-4id")                      │
├────────────────────────────────────────────────────┤
│ Description                                        │  form
│ ┌────────────────────────────────────────────────┐ │
│ │ What needs doing, in plain language.           │ │
│ └────────────────────────────────────────────────┘ │
│                                                    │
│ (edit mode also shows: title, kind, risk, verify,  │
│  deps, priority — the fields `fgos edit` accepts)  │
│                                                    │
│ Goes through `fgos add` / `fgos edit`.             │
├────────────────────────────────────────────────────┤
│                             [ Cancel ]  [ Create ] │  footer
└────────────────────────────────────────────────────┘
```

**Add mode is deliberately one field.** Intake derives title, kind, risk
and id from the description — asking a person to fill those in would be
asking them to do work the engine already does, and would make capturing
a thought from a phone slow enough that they would not bother.

**Edit mode shows the real fields** `fgos edit` accepts, because editing
is a deliberate correction rather than a capture.

Validation is not reimplemented here: the same rules a terminal edit gets
apply, and the engine's refusal is what the person sees (R2).

## States

- **ST-READY** — create disabled while the description is empty.
- **ST-SUBMITTING** — button shows progress; fields read-only, still
  visible.
- **ERR-WRITE-REFUSED** — shown verbatim from the engine, with everything
  typed preserved.

## Interactions

```yaml herdrweb-contract
interactions:
  - id: A-M03-001
    element: description_field
    region: form
    trigger: input
    action: mutate
    effects: [enable_submit_when_non_empty]
  - id: A-M03-002
    element: submit_button
    region: footer
    trigger: submit
    guard: "description.nonEmpty"
    action: close_overlay
    target: return_to_invoker
    effects: [run_fgos_add_or_edit_verb]
  - id: A-M03-003
    element: cancel_button
    region: footer
    trigger: click
    action: close_overlay
    target: return_to_invoker
  - id: A-M03-004
    element: close_icon
    region: header
    trigger: click
    action: close_overlay
    target: return_to_invoker
```
