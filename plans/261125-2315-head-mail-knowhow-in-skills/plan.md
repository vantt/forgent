---
contract: plan-v1
title: "Heads learn mail from one shared file: send once with --wake, read the answer; session-host spec and the pane lookup follow the mail door"
status: ready
priority: P2
blockedBy: []
base: 49f851828f014b235e911e89e9737e5e88bde7d7
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
  - changelog.d/261128-0541-heads-mail-each-other-from-inside-the-cage.md
source:
  - plans/discussions/ds-h3fvnp6qbt-head-communication-and-requests/DISCUSSION.md
  - plans/261125-2313-head-communication-agent-to-agent/plan.md
  - p-nnaksnxtwu
created: 2026-11-25
---

# Heads learn mail from one shared file

The skill half of discussion task `task-knowhow-and-spec` (HC-D1: the know-how lives in the door and its answers,
and heads read it from one place). Split from `261125-2313-head-communication-agent-to-agent` only because its files belonged to
running plans at the time. On 2026-11-28 every blocker and every overlapping plan (`261126-2318`, `261122-0056`,
`261125-2041`, `261126-2324`) is `done`; `base` was reset to main `49f851828` and the facts re-checked there: no
`core/skills/_shared/head-mail.md` yet; the secretary skill carries its own mail lines (33, 71, 116), the lead
skill still says "You have no mailbox" (line 15), the supervisor skill names the mailbox at line 162;
`head-permissions.v1.json` holds the `mailbox inbox` allow row but the session-host spec does not name it;
`supervision.rs` `pane_of` (line 3086) still copies the body of `Listed::terminal_key()`
(`packages/identity/rust/src/directory.rs:406`). `changelog.d/` is on main, so criterion 4 is a fragment and
`CHANGELOG.md` left the footprint. Status set `ready`.

## Outcome

One `core/skills/_shared/head-mail.md` says: send once with `fgos mailbox send --wake --to <role>`, read the
answer's `path` and refusal code, read your own mail with `fgos mailbox inbox --claim`, and what each answer means.
The secretary, supervisor and lead skills point to it instead of their own copies (the lead skill no longer says
"you have no mailbox"). The session-host spec names the `mailbox inbox` row. `supervision.rs` `pane_of` uses
Identity's `Listed::terminal_key()`, so one pane lookup remains (L10).

## Acceptance criteria

1. [core] `core/skills/_shared/head-mail.md` exists, under 40 lines, every answer `path` value and every refusal code of
   plan `261125-2313` covered; `rg -n "mailbox send" core/skills/fgos-{secretary,supervisor,lead}/SKILL.md` shows
   only a pointer line per skill.
2. [core] `npm run build:skills` regenerates the renders with no hand edit; `npm test -- test/setup` green.
3. [core] `docs/platform/session-host/spec.md` permission section lists the base `head` `mailbox inbox` row.
4. [core] `changelog.d/261128-0541-heads-mail-each-other-from-inside-the-cage.md` holds one `- Changed:` bullet: heads
   mail each other from inside the cage, read their own inbox, get named refusals, idle recipients are woken, and
   the answer names the path.
5. [core] `rg -n "fn pane_of" apps/fgos/src/wiring/supervision.rs` is gone or a one-line call of `terminal_key()`;
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
| 1 | [Shared know-how, skills, spec and pane lookup](phase-01-knowhow-skills-spec.md) | - | core/skills/_shared/head-mail.md, core/skills/fgos-secretary/SKILL.md, core/skills/fgos-supervisor/SKILL.md, core/skills/fgos-lead/SKILL.md, .agents/skills/**, plugins/fgOS/skills/**, .claude/skills/**, docs/platform/session-host/spec.md, apps/fgos/src/wiring/supervision.rs, apps/fgos/tests/supervision_verbs.rs, changelog.d/261128-0541-heads-mail-each-other-from-inside-the-cage.md | 1 | ready |

One phase: the files are small and the renders are a hot generated file set with one writer.

## Unattended run

### Host steps
| step | argv | executor |
|---|---|---|
| full gate on the integrated tree | fgos release check --worktree <path> | lead |

### Cleanup
Standing rule.

### Beyond the rule
None.

### Split
One phase in one step: prose, generated renders with one writer and one helper call; nothing outside the worktree is touched before land, so a revert is the whole reverse path.

## Owner questions

None.

## Risks and rollback

Low risk: prose and one helper call. A wrong sentence in the shared file teaches every head the wrong answer, so the
reviewer checks each answer value against the landed `frame.v1.txt`. Rollback: revert the commit and re-run
`npm run build:skills`.
