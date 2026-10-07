---
title: "Council parity, first slice: verdict schema, lens personas, restate"
description: "Close most of the remaining gap to council-of-high-intelligence with output schema, persona files and one cheap first step, using existing Workflow/Pattern owners and no runtime change."
status: pending
priority: P1
branch: main
tags: [discussion, council, workflow, persona, measurement]
created: 2026-10-07
---

# Council parity, first slice

## Why

Blind A/B on 2026-10-04 (same question, opus judge): council 8, fgOS panel 5 after the synthesizer wiring fix ([comparison](../reports/council-ab-comparison-261004.md)). The report's own reading: most of the missing points are the **shape of the synthesizer's output**, not reasoning quality or a missing engine. Council's other gaps are listed in [distill report](../reports/council-of-high-intelligence-distill-and-protocol-feasibility-261004.md) §3 and `docs/distillery/porting-log.md` (candidate rows).

Observe (plan `261005-1143-observe-run-visibility-and-discussion-measurement`) now measures agreement, stance and genuine split, so the effect of this slice can be measured instead of judged by feel.

## Scope — in

| Phase | Deliverable | Runtime change |
|---|---|---|
| [01](phase-01-verdict-unresolved-first.md) | Synthesizer output schema: unknowns first, per-lens positions, genuine split, kill criteria, exactly one next step | none (workflow/skill prose + schema text) |
| [02](phase-02-lens-personas.md) | Lens persona files in `core/agents/` and per-seat use in discussion workflows | none expected; verify per-seat persona path first |
| [03](phase-03-per-seat-restate.md) | Cheap first step that makes each seat restate the question before analysing | none expected |
| [04](phase-04-remeasure.md) | Re-run the same A/B and compare with Observe's measurements | none |

Order 01 → 02 → 03 → 04. Each of 01–03 ships on its own and is measured at 04.

## Scope — out (deliberate)

- **Anonymous cross-exam and weighted tally / genuine split returned to a human.** They need contextRefs on a template and findings routed out of a pattern. Those two seams are also Phase 02 of [advisory capability completion](../261006-1408-advisory-capability-completion/plan.md) (lives on branch `feat/single-door-mechanisms`; not on main). Do NOT build them here. When this slice is measured and a gap remains, extract the shared seams as one phase serving both plans, under that plan's single-writer baton for `docs/specs/runner.md`, CHANGELOG and shared runtime.
- Mandatory dissent/agreement gate: three independent lenses advised against it; keep the passive sensor (done) until real runs justify it.
- Decision outcome ledger: Observe item, separate.
- Copying council's 18 personas or its 950-line protocol.

## Facts to respect (checked 2026-10-07 on main)

- `panel.mjs` already accepts `params` (role list, synthesizeRole); commit `52c53eee8` passes template persona and params down to the Unit run. The advisory plan's "panelist roleUnit calls omit params" is stale against main.
- `template.contextRefs` and `acceptOutcomes` do not exist in `src/workflow/definition.mjs`.
- Persona renderer injects only `description/voice/style/archetype/decision_boundary`; extending it to `method`/`blind_spot` is a renderer change (decide in Phase 02, may fold method into `description`, as the experiment did).
- `core/agents/` holds only the generic roles; the three experiment personas live in `plans/reports/council-lens-experiment-261004/personas/`.
- Skills render from `core/skills` via `npm run build:skills`; never hand-edit `.agents/` or `plugins/`.

## Acceptance criteria

- Blind A/B rerun on the same question set scores the fgOS output at least 7/10 on the council rubric, or the report states which rubric rows still lag and why.
- Observe `metrics discussions` over the new runs shows stance + agreement for every run (no `unitsUndetermined` caused by the new schema).
- Full `npm test` green; doctor/setup untouched unless a phase adds a prerequisite.
- CHANGELOG `[Unreleased]` line; `docs/specs/` area notes updated where the output contract changes; no new engine, store, registry or runtime seam.
- Component-boundary: expected "No component-boundary change"; state it explicitly in the verification note.

## Kill / re-shape

Stop and re-plan if a phase needs a runtime seam, a second sequencer, or per-seat lead choreography; if schema changes break Observe's stance/agreement parsing; or if the A/B score does not move (then the schema was not the bottleneck — report with evidence, do not add gates to compensate).

## Open questions

1. Does a panel seat get its own persona today without `--override`? (Phase 02 step 1 answers it.)
2. Which question set for the rerun: only the 2026-10-04 question, or add 2–3 new ones to avoid overfitting? Recommend adding new ones.
