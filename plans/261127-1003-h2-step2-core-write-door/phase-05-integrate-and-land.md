---
phase: 5
title: "Integrate, land, retire the draft plan"
status: draft
dependencies: [1, 2, 3, 4]
---

# Phase 5: integrate, land, retire the draft plan

## Inputs

- The branches of phases 1–4.
- `plan.md` acceptance criteria 1–5 and 7.
- `plans/261113-0124-docos-retrospective-claim-units/plan.md`.
- `plans/backlog/p-ixrbglli5o-the-retrospective-writer-opens-a-new-topic-for.md` and its row in `plans/backlog.md`.
- The changelog door in use on `main` at this time: `changelog.d/` if plan `261126-2324` has landed, otherwise
  `CHANGELOG.md` `## [Unreleased]`.

## Footprint

`CHANGELOG.md`, `changelog.d/**`, `plans/261113-0124-docos-retrospective-claim-units/plan.md`,
`plans/backlog/p-ixrbglli5o-the-retrospective-writer-opens-a-new-topic-for.md`, `plans/backlog.md`. After phases
1–4 have merged, it also edits these implementation-alignment rows only: the documentation spec header
"Implementation" line, write-door spec section 12, and document identity section 14 (the retrospective-writer row
and the locate row's "writer's decision" cell).

## Steps

1. Merge the phase branches and run the full gate on the combined tree:
   `npm test` and `cargo test --workspace`. Compare any failure with `main` before calling it pre-existing.
2. Alignment rows:
   - write-door 12: the retrospective writer follows the shared door on `fgos doc locate`; the skill and templates
     are still planned for step 5.
   - document identity 14: the retrospective-writer row is built; the locate row's decision cell is recorded on
     attest and handoff.
   - documentation spec header: add step 2.
   - Section 4's plan column for step 2: `done` once landed.
3. Changelog: one user-visible line. Agents now find the document that carries a claim with `fgos doc locate`
   before writing, and `fgos knowledge attest` records the locate result.
4. Old draft plan: set `status: withdrawn`, with one line saying it is replaced by
   `plans/261127-1003-h2-step2-core-write-door/plan.md` (its phases 1–2 landed as `4a731ffa9` and `26d61be01`).
5. Backlog: link the item file's notes and its row's plan column to this plan. Its status becomes done in phase 6,
   after the measurement.
6. Land through `fgos land`. Ask the landing lane for a release build and activation, because phase 6 needs the
   activated skill and verbs.

## Verify

```bash
npm test
cargo test --workspace
node scripts/plan-contract-check.mjs --plan plans/261127-1003-h2-step2-core-write-door
node scripts/plan-contract-check.mjs --plan plans/261113-0124-docos-retrospective-claim-units
```

Pass: green, apart from failures identical on `main`, which are named in the land message.

## Rollback

Revert the merge commit. The draft plan's status revert is part of the same commit.
