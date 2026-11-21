---
contract: plan-v1
title: "Head tab labels read `role: subject` and head names are unique by construction"
status: running
lead: lead:NAMES
base: c24ea6e5ba985698ccf7535d35900b0ade6fb906
priority: P1
blockedBy: []
footprint:
  - plans/261121-0707-head-tab-labels/**
  - packages/terminal-control/rust/src/port.rs
  - packages/terminal-control/rust/tests/**
  - packages/terminal-control/contracts/terminal-control.port.v1.json
  - packages/supervision/rust/src/portfolio.rs
  - packages/supervision/rust/tests/portfolio.rs
  - packages/supervision/contracts/plan-vocabulary.v1.json
  - src/session-host/head-start.mjs
  - src/session-host/head-plan.mjs
  - test/session-host/head-name-labels.test.mjs
  - test/session-host/head-plan.test.mjs
  - test/scripts/mailbox-wake-probe.test.mjs
  - core/skills/**
source:
  - p-mhwe24fttr
created: 2026-11-21
---

# Head tab labels read `role: subject`

## Outcome
A head's tab reads `lead: work-data-model`, `secretary: miu`: the role whole, then the subject. Every tab uses `: ` as its
separator. Two plans whose directories share their first 24 characters can both start a lead.

## Reused
The display fields and `Display::tab_label` (the one place labels are built), `head_name` and its vocabulary file, and
`planOfHead`. No new field and no new scheme.

## Acceptance criteria
1. A display with a role, a title and no id builds `<role>: <title>` with the role whole; an id still builds `<id>: <title>`.
2. A head starts with the role and the subject (plan directory without its date prefix, or the head name) in the display fields.
3. `head_name` stays within the limit and differs for two plans sharing their first 24 characters; `planOfHead` resolves each back.
4. No caller or test is left on ` · ` for a tab label. Worker pane labels are not tabs and keep ` · `.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Label rule, head display, unique head names](phase-01-label-rule-and-unique-names.md) | - | packages/terminal-control/**, packages/supervision/**, src/session-host/**, test/session-host/head-name-labels.test.mjs, core/skills/** | 1 | running |

## Non-goals
Worker pane labels, the launch path, head confinement, and any new display field.

## Owner questions
None. The owner decided the label shape on 2026-11-21 (backlog row p-mhwe24fttr).

## Shared files
`docs/platform/terminal-control/spec.md` and `CHANGELOG.md` are in another running plan's footprint; this plan makes one small edit to each at landing, rebased on the trunk tip, after the supervisor agrees.

## Risks and rollback
Head names of already running plan leads keep resolving (names that fit in full are unchanged). Rollback is a revert.
