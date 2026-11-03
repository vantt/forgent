---
id: M01
type: modal
name: "Answer a parked question"
platforms: [desktop, mobile]
hosts: []
status: active
design_ref: ""
rules: [R2]
regions: [header, question_recap, answer_form, footer]
---

# M01 — Answer a parked question

```txt
Document type: Architecture
Audience: Maintainer, implementer, agent
Purpose: Define the stated scope and preserve its source provenance and limits
Design status: Accepted at atomic cutover
Implementation: Carriage only; current implementation truth is not certified
Provenance: docs/ui-spec/modals/M01-answer-question.md at 111adc51fd047d99121fd9d076eb4794c87045a4
Writer type: Agent draft writer
Canonical: Yes
Canonical for: The document scope stated above; source implementation limits remain explicit
Use this when: Reading or changing the stated scope and its contracts
Do not use this for: Standalone implemented-behavior proof or claims outside the stated scope
Last reviewed: No current review date recorded; retained source dates are historical
Related:
- Source coordinate (provenance only; not a reader destination): `docs/ui-spec/modals/M01-answer-question.md` at `515afed9d5ad1af5bd29178503943288a3c26b81`
Supersedes: The mapped source location at atomic cutover
Superseded by: None
```

> Retained source: `docs/ui-spec/modals/M01-answer-question.md` at `947dc310396071a4d530216d5c06d05993d63bf5`; source assertions retain their recorded limits.

## Purpose

Submit an answer **in place**, without sending the person to a terminal.
The area spec settles this explicitly: the gateway already runs fgOS write
verbs on a client's behalf and `answer` is named among them, so linking
out to the CLI would contradict the contract this client is written
against (`docs/platform/herdr-web-dashboard/spec.md#answer-a-parked-question` §Answer a parked question).

## Layout

```
┌────────────────────────────────────────────────────┐
│ Answer · tsk-4id                              [✕]  │  header
├────────────────────────────────────────────────────┤
│ Which pairing key should the timeline use when     │  question_recap
│ askHistory and settlements have drifted by one?    │
│                                                    │
│ Why you're being asked                             │
│ Two options still standing; D2 added no linking    │
│ key. Tried: read D2, ran pairing on tsk-48i.       │
├────────────────────────────────────────────────────┤
│ Your answer                                        │  answer_form
│ ┌────────────────────────────────────────────────┐ │
│ │                                                │ │
│ │                                                │ │
│ └────────────────────────────────────────────────┘ │
│ Goes through `fgos answer`.                        │
├────────────────────────────────────────────────────┤
│                          [ Cancel ]  [ Send answer ]│ footer
└────────────────────────────────────────────────────┘
```

The question is repeated inside the modal, with its "why", so a person
answering on a phone never has to dismiss the modal to re-read what they
are answering. The footnote naming the verb is not decoration — R2 says
every write maps to one one-door-write verb, and showing which one is how
a person knows what they are actually about to do.

## States

- **ST-READY** — send disabled until the answer is non-empty.
- **ST-SUBMITTING** — send shows progress; the textarea goes read-only but
  stays visible, so nothing typed is ever hidden mid-flight.
- **ERR-WRITE-REFUSED** — fgOS refused the write (the item was no longer
  parked, say). The engine's own message is shown verbatim, and the typed
  answer is kept, never cleared.

## Interactions

```yaml herdrweb-contract
interactions:
  - id: A-M01-001
    element: answer_textarea
    region: answer_form
    trigger: input
    action: mutate
    effects: [enable_send_when_non_empty]
  - id: A-M01-002
    element: send_answer_button
    region: footer
    trigger: submit
    guard: "answer.nonEmpty"
    action: close_overlay
    target: return_to_invoker
    effects: [run_fgos_answer_verb]
  - id: A-M01-003
    element: cancel_button
    region: footer
    trigger: click
    action: close_overlay
    target: return_to_invoker
  - id: A-M01-004
    element: close_icon
    region: header
    trigger: click
    action: close_overlay
    target: return_to_invoker
```
