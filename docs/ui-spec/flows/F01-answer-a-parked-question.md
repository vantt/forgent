---
id: F01
type: flow
name: "Answer a parked question, end to end"
platforms: [desktop, mobile]
hosts: []
status: active
design_ref: ""
rules: []
regions: []
---

# F01 — Answer a parked question, end to end

## Purpose

The flow the whole cluster exists for: a person picks up their phone, finds
out something needs them, and answers it — without opening a terminal.

Measured against the real acceptance criterion (*a person with no context
in their head can answer quickly*), this flow is where that is either true
or false. It is five taps from cold to answered, and only one of them
requires reading.

## Steps

1. **Sign in** (S01) — one field. On a phone, usually already a live
   session, so this step is skipped in practice.
2. **Land on the taskboard** (S02) — `NEEDS ANSWER` is the first group on
   mobile and the pinned rail on desktop. The count answers "is there
   anything for me" before anything is read.
3. **Open the question** — either straight from the rail, or via the
   questions list (S04) when there is more than one to triage. S04's rows
   carry the question text itself, so triage happens without opening.
4. **Read** (S03) — question, then why it is being asked (including what
   was already tried), then the item. This is the only step that takes
   real attention, and the region order is what makes it short.
5. **Answer** (M01) — the question and its "why" are repeated inside the
   modal, so nothing has to be dismissed to re-read. Submit runs
   `fgos answer` through the gateway.
6. **Confirmation** — the item resumes, `question.answered` arrives, the
   row leaves S04 and the open round on S03's timeline closes.

## Branches

- **The item is no longer parked** when the answer is submitted (someone
  answered from a terminal first): fgOS refuses the write, and
  ERR-WRITE-REFUSED shows the engine's own words with the typed answer
  preserved.
- **The gateway is unreachable** mid-flow: ST-DISCONNECTED marks content
  stale and disables the write controls, rather than accepting an answer
  it cannot deliver.

```yaml herdrweb-contract
flow:
  goal: "Answer a question that is blocking a work item, from a phone, without a terminal"
  preconditions:
    - "at least one item is parked awaiting a person"
    - "the client has a reachable gateway"
  steps:
    - A-S01-002
    - A-S02-006
    - A-S04-001
    - A-M01-001
    - A-M01-002
  branches:
    - when: "triage several questions before answering"
      action: A-S04-002
    - when: "answer directly from the item's own detail screen"
      action: A-S03-001
    - when: "gateway drops mid-flow"
      action: A-S04-006
```
