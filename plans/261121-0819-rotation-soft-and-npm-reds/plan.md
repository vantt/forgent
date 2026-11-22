---
contract: plan-v1
title: "Secretary and supervisor rotate at 0.15 soft, and three red npm tests are fixed at their cause"
status: done
lead: lead:SMALLFIX
base: 258c2db98af1c583592de43dec05cb546934fa97
priority: P1
blockedBy: []
footprint:
  - plans/261121-0819-rotation-soft-and-npm-reds/**
  - core/config-standard/sessionRotation.yaml
  - core/config-schema/sessionRotation.schema.yaml
  - test/session-rotation/**
  - src/session-host/head-start.mjs
  - test/**
  - apps/fgos/src/wiring/session_rotation_hook.rs
  - packages/git/contracts/mutation-census.v1.json
  - CHANGELOG.md
source:
  - p-4r4h3jqtth
created: 2026-11-21
---

# Secretary and supervisor rotate at 0.15 soft, and three red npm tests are fixed at their cause

## Outcome
The secretary and supervisor personas rotate at soft 0.15 (hard stays 0.7, every other persona keeps 0.4), and `npm test` has no red from the assignment-tree listing guard or the merge-slot answer.

## Non-goals
No change to hard, to other personas, or to the merge-slot semantics beyond what the land spec says.

## Acceptance criteria
1. A supervisor persona's resolved soft is 0.15; a persona with no override resolves to 0.4.
2. The assignment-tree listing guard and the two merge-slot tests pass with no skip.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | Persona soft 0.15 and the three reds | - | config, schema, tests, head-start.mjs | 1 | done |

## Owner questions

None.

## Risks and rollback
Risk: low. Rollback: git revert.
