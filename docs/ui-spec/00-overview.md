---
id: overview
type: meta
name: "herdr web dashboard UI Spec — Overview"
status: active
version: "0.1.0"
---

# herdr web dashboard — UI spec overview

Interaction and layout layer for the herdr web dashboard.

**Product source of truth:** `docs/specs/herdr-web-dashboard.md` (the area
spec, `tsk-54j`). Every surface, rule and behaviour here traces back to a
section of that document. This layer never settles a product question —
where the area spec has an Open Gap, so does this spec.

**Human-readable companion:** `docs/reference/herdr-web-dashboard-layout.md`
— the read-in-one-pass layout document that `tsk-5jr` (taskboard) and
`tsk-4id` (task detail) open while building.

## Surface index

| ID | Name | Type | Source in the area spec |
|---|---|---|---|
| S01 | Sign in | screen | §Sign in |
| S02 | Taskboard | screen | §View the taskboard |
| S03 | Task detail | screen | §View a task's detail |
| S04 | Questions needing answer | screen | §Entry Points, Data Dictionary #4 |
| M01 | Answer a parked question | modal | §Answer a parked question |
| M02 | Approve a merge | modal | §Approve a merge |
| M03 | Add or edit a work item | modal | §Add a work item, §Edit a work item |
| C01 | Item card with status pill and quick actions | component | §View the taskboard |
| F01 | Answer a parked question, end to end | flow | commissioning item's required userflow |
| F02 | Approve a merge, end to end | flow | commissioning item's required userflow |

All eight `###` behaviour subsections of the area spec are covered.
"Retire a work item" has no surface of its own by design — it is a quick
action on C01 plus a confirmation, matching the area spec's own framing of
retirement rather than deletion.

## Directory tree

```
docs/ui-spec/
├── spec.config.yaml
├── 00-overview.md                  ← this file
├── 15-system-events.md
├── 20-domain-rules.md              ← R1–R11, taken from the area spec
├── 30-states-and-errors.md
├── schema/
│   └── surface-contract.schema.json
├── screens/
│   ├── S01-sign-in.md
│   ├── S02-taskboard.md
│   ├── S03-task-detail.md
│   └── S04-questions-needing-answer.md
├── modals/
│   ├── M01-answer-question.md
│   ├── M02-approve-merge.md
│   └── M03-add-edit-item.md
├── components/
│   └── C01-item-card.md
└── flows/
    ├── F01-answer-a-parked-question.md
    └── F02-approve-a-merge.md
```

## How to work on this spec

The compiler lives with the `ui-spec` skill, not in this tree. Run it
against this root:

```bash
cd ~/.claude/skills/ui-spec/tools
npm ci                                   # once, if node_modules is absent
node validate.mjs --root <repo>/docs/ui-spec
node build.mjs    --root <repo>/docs/ui-spec
node interpret-wireframe.mjs --root <repo>/docs/ui-spec
```

`validate` is the trust gate — dangling navigate targets, bad component
hosts, listen-orphans and rule drift are errors, not warnings.
`interpret-wireframe` produces the clickable wireframe;
`generated/` is build output and is gitignored.

## A note on scale

The `ui-spec` skill states it is for applications of ~20 surfaces or more.
This one has ten. It is used here anyway, deliberately: the thing this
cluster actually needs is a **clickable wireframe to test readability
before any pixel exists**, and that is what this tooling produces
regardless of surface count. Recorded so a later reader does not think the
skill's own threshold was overlooked.
