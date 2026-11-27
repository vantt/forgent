---
contract: plan-v1
title: "When to ask the owner: one shared rule (intent, deviation, reverse path) replaces the file-and-budget approved frame"
status: running
priority: P0
blockedBy: []
footprint:
  - plans/261127-0144-when-to-ask-owner-rule/**
  - core/skills/_shared/decision-question.md
  - core/instructions/decision-question-template.md
  - core/skills/_shared/coordination-driver.md
  - core/skills/_shared/plan-contract.md
  - core/skills/fgos-lead/SKILL.md
  - core/skills/fgos-supervisor/SKILL.md
  - core/skills/fgos-secretary/SKILL.md
  - domains/coding/skills/fgos-coding-planning/references/approach-and-shape.md
  - core/agents/secretary.yaml
  - core/agents/supervisor.yaml
  - core/agents/shaper.yaml
  - .claude/agents/secretary.md
  - .claude/agents/supervisor.md
  - .claude/agents/shaper.md
  - docs/platform/questions/spec.md
  - test/docs/rul11-anchor-phrase.test.mjs
  - AGENTS.md
  - .fgos/instructions/effective/**
  - packages/git/contracts/mutation-census.v1.json
  - .agents/skills/**
  - plugins/fgOS/skills/**
  - .claude/skills/**
  - CHANGELOG.md
base: b6b8681d2325f431be369175233c45180acef5c3
source:
  - plans/discussions/ds-jxoz3h2qgk-when-to-ask/DISCUSSION.md
  - p-tcm4j3nosu
created: 2026-11-27
lead: head:lead-forgent-261127-0144-when-t-540ce
---

# When to ask the owner

Answers the settled discussion `plans/discussions/ds-jxoz3h2qgk-when-to-ask/DISCUSSION.md` (decisions WA-D1 to WA-D8,
design in its section 6) and backlog row `p-tcm4j3nosu`. The discussion's task "Shared ask rule" is phases 1 to 3.

## Outcome

Every agent (lead, supervisor, secretary, shaper, planner, worker) reads one rule for when a question goes to the owner.
The owner answers only questions that set or change a direction (WA-D2). Before asking, an agent runs three questions:
is the intent clear, does the fastest direction deviate from the approved goal, is there a real reverse path (WA-D6).
The approved frame is the approved goal (outcome, acceptance, standing constraints, owner orders and deadlines), not a
file list: widening a plan's footprint to meet its own acceptance is decided, done and recorded, never asked (WA-D3).
A self-decision is recorded where the work lives and reaches the owner through the secretary's normal report, with no
new channel (WA-D7). The rule lives in the section that held the old approved-frame text, so every existing pointer
keeps working, and the places that told an agent to ask the owner for something the rule now settles point at it.

## Acceptance criteria

1. `core/skills/_shared/decision-question.md` has a `## When to ask the owner` section carrying the principle, the
   three questions, the "not an owner question" list and the ask / don't-ask table of discussion section 6, and no
   longer defines the frame as "which files/contracts may change":
   `grep -c "which files/contracts may change" core/skills/_shared/decision-question.md` prints `0` (phase 1).
2. No skill, agent definition or instruction still defines the approved frame as scope-and-budget:
   `git grep -n -e "scope and budget set at approval" -e "scope + budget set at approval" -- core domains AGENTS.md .claude/agents`
   prints nothing (phase 1).
3. `fgos-lead`'s refusal table no longer sends `land-recovery-required` to the owner:
   `grep -n "ask the owner to run" core/skills/fgos-lead/SKILL.md` prints nothing (phase 1).
4. `node --test test/docs/rul11-anchor-phrase.test.mjs` passes with its assertion moved to the new always-loaded
   sentence (phase 1).
5. `npm run build:skills && node scripts/project-agents.mjs` leaves `git status --porcelain -- .agents plugins .claude AGENTS.md .fgos/instructions`
   empty after phase 1 lands, and `node --test test/setup/git-mutation-census.test.mjs` passes (phase 1).
6. `plans/261127-0144-when-to-ask-owner-rule/reports/` holds a review that re-judges the 163 questions of
   `plans/discussions/ds-jxoz3h2qgk-when-to-ask/evidence-question-classification.md` against the new text and finds
   that only the direction class and the five owner overrides come out as "ask"; every accepted finding is fixed in
   phase 1's files and rechecked (phase 2).
7. `npm test` and `cargo test --workspace` green on the combined tree; `CHANGELOG.md` `## [Unreleased]` has one line
   for the rule (phase 3).

## Non-goals

- Moving the template into a new communication standard file, lettered options, a stated default, or a friction
  layer: plan `261122-1950-owner-communication-standard` owns those and moves this section with the rest of the file.
- The "hands" class (a confined head cannot run a host step) and precedent learning (WA-D8): backlog `p-uagjwlfowo`
  and the coach `p-kmavlfevvu`. The rule only names them as not owner questions.
- A door that accepts a recorded decision instead of an answered `q-` id (the footprint widen door of discussion
  `ds-mzyircswox`, and `authority declare --approved-by`): discussion section 3 row 6 left it open, and it was
  handed off (event `fbcde1f09192d9c2`). Until that door exists, a lead raises a footprint widen to the supervisor,
  who lands plan files; it is not an owner question.
- "A ready plan runs without the owner" (WA-D4): discussion `ds-que32ftgg6`.
- A goal set the agent reads for question 1: discussion `ds-3in4yb5thk`. The rule reads it "when it exists".
- Changing the product priority order (`core/instructions/product-priority-order.md`, D-ADR0030): its "phạm vi +
  ngân sách" reads as approved scope and time, which the new rule defines; its text does not change.
- Any new verb, store record kind or channel (WA-D7, RUL104).

## Authority map

| New thing | Model row | Note |
|---|---|---|
| The when-to-ask rule (section of the decision-question fragment) | `questions` (component and decision kind) | Replaces the approved-frame section in place. survivor: `questions`; retired: the "which files/contracts may change" frame definition in `core/skills/_shared/decision-question.md`. No new component, verb or contract. |
| Decision narrative WA-D1 to WA-D8 | `questions` (decision kind) | Recorded in `docs/platform/questions/spec.md` section 11, the holder for `questions` in `docs/platform/governance.md`. |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Write the rule and repoint the askers](phase-01-rule-and-askers.md) | - | core/skills/_shared/decision-question.md, core/instructions/decision-question-template.md, core/skills/_shared/coordination-driver.md, core/skills/_shared/plan-contract.md, core/skills/fgos-lead/SKILL.md, core/skills/fgos-supervisor/SKILL.md, core/skills/fgos-secretary/SKILL.md, domains/coding/skills/fgos-coding-planning/references/approach-and-shape.md, core/agents/secretary.yaml, core/agents/supervisor.yaml, core/agents/shaper.yaml, .claude/agents/secretary.md, .claude/agents/supervisor.md, .claude/agents/shaper.md, docs/platform/questions/spec.md, test/docs/rul11-anchor-phrase.test.mjs, AGENTS.md, .fgos/instructions/effective/**, packages/git/contracts/mutation-census.v1.json, .agents/skills/**, plugins/fgOS/skills/**, .claude/skills/** | 1 | draft |
| 2 | [Re-judge the 163 questions against the rule](phase-02-rejudge-evidence.md) | 1 | plans/261127-0144-when-to-ask-owner-rule/reports/rejudge/** | 2 | draft |
| 3 | [Integration: changelog and full gate](phase-03-integration.md) | 1, 2 | CHANGELOG.md, plans/261127-0144-when-to-ask-owner-rule/reports/integration/** | 3 | draft |

Capabilities: phase 1 `code:implement`, phase 2 `code:review`, phase 3 `code:test`.

Wave reasoning: phase 1 is one writer because every file it edits renders into the same generated surfaces
(`.agents/skills/**`, `plugins/fgOS/skills/**`, `AGENTS.md`, the census); splitting it would put two writers on hot
files. Phase 2 reviews phase 1's text, so it follows it. Phase 3 is the integration phase and the only `CHANGELOG.md`
writer. If phase 2 accepts a finding, the lead re-runs phase 1 for that fix before phase 3.

### Decisions taken in this plan

- **Stand alone, land before plan `261122-1950-owner-communication-standard`; do not fold into it or follow it.** That
  plan moves the approved-frame text into a new file "word for word" and lists changing it as a non-goal, so this rule
  is not in its scope. Folding would also mean editing another plan, which a planner does not do. Following it would
  hold a P1 owner order (2026-11-27) behind a plan the owner ordered to run last (2026-11-22 23:30). This plan rewrites
  the section in place with a narrow footprint; when 1950 is set `ready` it overlaps this plan, so the contract check
  makes it wait until this one is `done`, and its phase 1 then moves the new section as written. No duplicate: this
  plan adds no file, field, letter or layer that 1950 adds.
- **The rule replaces `## Approved frame` inside `decision-question.md`** (discussion section 6, first paragraph),
  under the heading `## When to ask the owner (khi nào hỏi chủ)` with an explicit anchor, so the 20 existing pointers to
  the file stay valid. Only pointers that tell an agent to ask the owner for something the rule settles are edited.
- **Frame definition.** The approved frame is the approved goal: outcome, acceptance criteria, standing constraints
  (trust boundaries), and owner orders and deadlines. A plan's footprint and size budget are the planner's direction:
  widening them to meet the plan's own acceptance is actionable (WA-D3). The kept lines (narrowed, never widened;
  consolidating by a new tool is a question; done means done; progress is behaviour, not staged evidence) stay, reworded
  to the goal-based frame.
- **Language.** The section is written in English like the rest of the fragment, with the Vietnamese terms from the
  discussion in brackets where the owner coined them (phép thử con đường; giá phải chờ so với giá làm sai).
- **Prior art reused:** the five-part template and its door check (`src/state/decision-question.mjs`) stay unchanged;
  the always-loaded instruction `decision-question-template` keeps its id and gains the three questions in one line;
  the decision history table in `docs/platform/questions/spec.md` section 11. Missing and added: only the rule text.
- **Backlog row.** No row existed for this discussion and the contract needs one; `p-tcm4j3nosu` was minted and added
  with this plan.

### Contract check

`node scripts/plan-contract-check.mjs --plan plans/261127-0144-when-to-ask-owner-rule` was run before landing; result
in the landing commit's message. Phases sit in three serial waves, so no two phases share a wave.

## Owner questions

None. WA-D1 to WA-D8 settle the rule; the open rows of discussion section 3 (6, 7, 10) are settled by WA-D7 and WA-D8
or handed off, as listed under Non-goals.

## Risks and rollback

- **An agent reads "decide and report" as permission to change an approved outcome.** WA-D5 is written into question 2
  word for word, and phase 2 proves the three component-authority overrides still come out as "ask". Proof point:
  phase 2's report.
- **Overlap with active plans** (contract check warnings at writing time): `261125-2041-gather-fgos-rules-to-one-owner`
  (running; its phase 1 gathers rules into `core/instructions/**` units and repoints skill copies) and
  `261122-0056-orchestration-skeleton` (running; `fgos-supervisor`, the questions spec). Whichever lands second rebases
  onto main: a pointer edit of theirs is kept, the when-to-ask section is this plan's, and generated surfaces are
  rebuilt by their tools, never merged by hand. If gather-rules has moved a line this plan edits into a rule unit,
  phase 1 edits the unit that now owns it instead (same sentence, new owner).
- **The activated release lags the source:** heads keep the old skill text until a release with these skills is
  staged and activated; activation is the owner's (not in this plan).
- **Rollback:** each phase lands as one commit; `git revert` phase 1's commit restores the old section, every pointer
  and the generated surfaces together.
