---
phase: 5
title: "Integrate, land, retire the draft plan"
status: draft
dependencies: [1, 2, 3, 4, 7]
---

# Phase 5: integrate, land, retire the draft plan

## Inputs

- The branches of phases 1–4 and 7.
- `plan.md` acceptance criteria 1–5, 7, 8 and 9.
- `plans/261113-0124-docos-retrospective-claim-units/plan.md`.
- `plans/backlog/p-ixrbglli5o-the-retrospective-writer-opens-a-new-topic-for.md` and its row in `plans/backlog.md`.
- `changelog.d/README.md` (one fragment file per change; the release step assembles them).

## Footprint

`changelog.d/261127-1003-h2-step2-core-write-door.md`, `plans/261113-0124-docos-retrospective-claim-units/plan.md`,
`plans/backlog/p-ixrbglli5o-the-retrospective-writer-opens-a-new-topic-for.md`, `plans/backlog.md`. After phases
1–4 and 7 have merged, it also edits these implementation-alignment rows only: the documentation spec header
"Implementation" line, write-door spec section 12, and document identity section 14 (the retrospective-writer row
and the locate row's "writer's decision" cell).

## Steps

1. Merge the phase branches and run the full gate on the combined tree:
   `npm test` and `cargo test --workspace`. Compare any failure with `main` before calling it pre-existing.
2. Alignment rows:
   - write-door 12: the retrospective writer follows the shared door on `fgos doc locate`; the skill and templates
     are still planned for step 5.
   - document identity 14: the retrospective-writer row is built; the locate row's decision cell is recorded on
     attest and handoff; a row for exact mentions (built: scan, `missedBySearch`, `--exact`, handling refused when
     missing; not built: G4 completeness check, G6 identifier kinds).
   - documentation spec header: add step 2.
   - Section 4's plan column for step 2: `done` once landed.
3. Changelog: one user-visible line in `changelog.d/261127-1003-h2-step2-core-write-door.md`, in the README's form. Agents now find the document that carries a claim with `fgos doc locate`
   before writing; locate also lists every section that names the same terms (`--exact` for more) and flags those
   its search missed; `fgos knowledge attest` records the locate result and how each mention was handled.
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
