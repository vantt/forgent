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

```txt
Document type: Architecture
Audience: Maintainer, implementer, agent
Purpose: Define the stated scope and preserve its source provenance and limits
Design status: Accepted at atomic cutover
Implementation: Carriage only; current implementation truth is not certified
Provenance: docs/ui-spec/screens/S04-questions-needing-answer.md at 111adc51fd047d99121fd9d076eb4794c87045a4
Writer type: Agent draft writer
Canonical: Yes
Canonical for: The document scope stated above; source implementation limits remain explicit
Use this when: Reading or changing the stated scope and its contracts
Do not use this for: Standalone implemented-behavior proof or claims outside the stated scope
Last reviewed: No current review date recorded; retained source dates are historical
Related:
- Source coordinate (provenance only; not a reader destination): `docs/ui-spec/screens/S04-questions-needing-answer.md` at `515afed9d5ad1af5bd29178503943288a3c26b81`
Supersedes: The mapped source location at atomic cutover
Superseded by: None
```

> Retained source: `docs/ui-spec/screens/S04-questions-needing-answer.md` at `947dc310396071a4d530216d5c06d05993d63bf5`; source assertions retain their recorded limits.

## Purpose

One list of everything currently waiting on a person: owner-question store
questions, `fgos ask` items and gates. The screen renders exactly what
`GET /v1/questions` returns and makes no other list call. The answer door
stays per kind, but the person sees one screen and one count.

It is the "is there anything for me" surface. On a phone it is often the
only screen a person opens.

## Layout

```
┌ TOPBAR ────────────────────────────────────────────────────┐
│ ← Board   Needs answer · 3      ⚠ reachable on network     │
├ LIST ──────────────────────────────────────────────────────┤
│ QUESTIONS                                                  │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Ship the store first?                                  │ │
│ │ QUESTION                                               │ │
│ │ Recommended: B · blocks: phase 8 · 2h                  │ │
│ │ Expand                                                 │ │
│ │   What is happening / Cause                            │ │
│ │   (o) B (recommended): wait  gain · harm · cost        │ │
│ │   ( ) A: ship now            gain · harm · cost        │ │
│ │   Recommendation / Scope of the answer                 │ │
│ │   [ note field ]                           [ Answer ]  │ │
│ └────────────────────────────────────────────────────────┘ │
│ ASK ITEMS                                                  │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ tsk-4id · Task detail pairing                          │ │
│ │ ASK                                                    │ │
│ │ [ answer field ]                   [ Open ] [ Answer ] │ │
│ └────────────────────────────────────────────────────────┘ │
│ GATES                                                      │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ workflow:r1#s1                                         │ │
│ │ GATE                                                   │ │
│ │ approve?                                               │ │
│ │ fgos workflow answer r1 s1                             │ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

Rows come in three groups, each tagged (`QUESTION` / `ASK` / `GATE`), and
no row appears twice. The topbar count is the list's `needsYou`.

**Layered reading.** A store question's row shows its headline, its
recommended option, what it blocks and its age. Expanding it fetches the
question (`GET /v1/questions/{id}`) and shows the five parts, each option with
its gain, harm and cost, a radio group with the recommended option
preselected, and a note field. Answering posts `{option?, text?}` to
`POST /v1/questions/{id}/answer`; the verb's refusal (already answered, not
the owner) shows under the question.

`fgos ask` items keep the Work answer route (`POST /v1/work/{id}/answer`).
Gates only show their `fgos workflow answer` command, because the Work
layer is on hold.

Rows follow the order the list returns: plan priority, then age.

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
