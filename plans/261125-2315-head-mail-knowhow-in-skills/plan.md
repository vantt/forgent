---
contract: plan-v1
title: "Heads learn mail from one shared file: send once with --wake, read the answer; session-host spec and the pane lookup follow the mail door"
status: draft
priority: P2
blockedBy:
  - 261126-2318-plan-footprint-overlap-warns
base: 5466f387d67f8dbc7c95c15a441814a6d42e15e3
footprint:
  - plans/261125-2315-head-mail-knowhow-in-skills/**
  - core/skills/_shared/head-mail.md
  - core/skills/fgos-secretary/SKILL.md
  - core/skills/fgos-supervisor/SKILL.md
  - core/skills/fgos-lead/SKILL.md
  - .agents/skills/**
  - plugins/fgOS/skills/**
  - .claude/skills/**
  - docs/platform/session-host/spec.md
  - apps/fgos/src/wiring/supervision.rs
  - apps/fgos/tests/supervision_verbs.rs
  - CHANGELOG.md
source:
  - plans/discussions/ds-h3fvnp6qbt-head-communication-and-requests/DISCUSSION.md
  - plans/261125-2313-head-communication-agent-to-agent/plan.md
  - p-nnaksnxtwu
created: 2026-11-25
---

# Heads learn mail from one shared file

The skill half of discussion task `task-knowhow-and-spec` (HC-D1: the know-how lives in the door and its answers,
and heads read it from one place). Split from `261125-2313-head-communication-agent-to-agent` only because every
file here belongs to the running plan `261124-2143-head-lifecycle-events` until it lands. Its first blockers (`261125-2313`,
`261124-2143`) are `done`. On 2026-11-26 `base` was reset to main `5466f387d` and the facts below re-checked
there, but the plan stays `draft`: the contract check refuses it for footprint overlap with the running plans
`261122-0056-orchestration-skeleton` (`supervision.rs`, `supervision_verbs.rs`, the supervisor skill, the
session-host spec, the skill renders) and `261125-2041-gather-fgos-rules-to-one-owner` (`core/skills/**`,
`CHANGELOG.md`). It waits on `261126-2318-plan-footprint-overlap-warns`, which turns that overlap into a
warning; when 2318 is `done` (or both running plans are), re-run the check and set `ready`. If `changelog.d/`
(plan `261126-2324`) is on main by then, criterion 4 becomes a `changelog.d` fragment and `CHANGELOG.md` leaves
the footprint.

## Outcome

One `core/skills/_shared/head-mail.md` says: send once with `fgos mailbox send --wake --to <role>`, read the
answer's `path` and refusal code, read your own mail with `fgos mailbox inbox --claim`, and what each answer means.
The secretary, supervisor and lead skills point to it instead of their own copies (the lead skill no longer says
"you have no mailbox"). The session-host spec names the `mailbox inbox` row. `supervision.rs` `pane_of` uses
Identity's `Listed::terminal_key()`, so one pane lookup remains (L10).

## Acceptance criteria

1. `core/skills/_shared/head-mail.md` exists, under 40 lines, every answer `path` value and every refusal code of
   plan `261125-2313` covered; `rg -n "mailbox send" core/skills/fgos-{secretary,supervisor,lead}/SKILL.md` shows
   only a pointer line per skill.
2. `npm run build:skills` regenerates the renders with no hand edit; `npm test -- test/setup` green.
3. `docs/platform/session-host/spec.md` permission section lists the base `head` `mailbox inbox` row.
4. `CHANGELOG.md` `[Unreleased]` has one line: heads mail each other from inside the cage, read their own inbox,
   get named refusals, idle recipients are woken, and the answer names the path.
5. `rg -n "fn pane_of" apps/fgos/src/wiring/supervision.rs` is gone or a one-line call of `terminal_key()`;
   `cargo test -p fgos --test supervision_verbs` green.

## Non-goals

Anything in plan `261125-2313` (code of the mail door); the owner channel; new grants.

## Authority map

| New thing | Model row | Note |
|---|---|---|
| Shared head-mail know-how fragment | `agent-mailbox` | the door's usage, placed where skills read it |
| `pane_of` onto `Listed::terminal_key()` | `identity` | overlaps `supervision.rs` `pane_of`; survivor: identity; retired: apps/fgos/src/wiring/supervision.rs pane_of body |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Shared know-how, skills, spec and pane lookup](phase-01-knowhow-skills-spec.md) | - | core/skills/_shared/head-mail.md, core/skills/fgos-secretary/SKILL.md, core/skills/fgos-supervisor/SKILL.md, core/skills/fgos-lead/SKILL.md, .agents/skills/**, plugins/fgOS/skills/**, .claude/skills/**, docs/platform/session-host/spec.md, apps/fgos/src/wiring/supervision.rs, apps/fgos/tests/supervision_verbs.rs, CHANGELOG.md | 1 | draft |

One phase: the files are small and the renders are a hot generated file set with one writer.

## Owner questions

None.

## Risks and rollback

Low risk: prose and one helper call. A wrong sentence in the shared file teaches every head the wrong answer, so the
reviewer checks each answer value against the landed `frame.v1.txt`. Rollback: revert the commit and re-run
`npm run build:skills`.
