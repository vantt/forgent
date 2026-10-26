---
title: "Collaboration degree, Part A: patterns declared in config over four loops, params tuned per run"
description: "BA-grade change spec, Part A approved by the owner 2026-10-24 18:09 (not implemented). Part A: a pattern catalog in config (loop + defaults + invariants + promise) over the four code-held loops, replaceable two-way params over unioned floors, a generic bounds shape per loop, a --pattern/--params/--param door, an expanded fail-closed pin, solo verify with a harness receipt, and the physical rename (patterns/ loops vs catalog, runner.loops). Milestone evidence hardening is Part B."
status: approved
created: 2026-10-23
links:
  - spec-draft.md
  - part-b-evidence-hardening.md
  - reports/red-team-contracts.md
  - reports/red-team-assumptions-scope.md
  - ../../.fgos/assignments/unit-run-1792741678364-45ec2060/producer/2/runs/01/outbox/report-1.md
  - ../../docs/specs/workflow.md
  - ../../docs/specs/runner.md
  - ../../docs/specs/seat-binding.md
  - ../reports/measure-261022-1758-cook-p6-pane-launch.md
---

# Collaboration degree spec

A spec, not an implementation plan: behaviour, contracts, ownership and acceptance scenarios. No phases, no code.

Split decided by the COOK lead (RUL104) after two red-team reviews (20 findings, 3 Critical); revised after review r2 and, on 2026-10-24, after the owner asked for config-declared, flexible patterns and a second panel (`wf-run-1792756301921-5ca8b9bb`). Part A is what the owner asked for; Part B is a separate backlog item.

| Item | Where |
|---|---|
| Part A, the draft | [spec-draft.md](spec-draft.md) |
| Part B, outline for a separate backlog item (evidence hardening, assessor, consent, freshness, coding-workflow restructure) | [part-b-evidence-hardening.md](part-b-evidence-hardening.md) |
| Red-team reviews | [reports/red-team-contracts.md](reports/red-team-contracts.md), [reports/red-team-assumptions-scope.md](reports/red-team-assumptions-scope.md) |
| Where the findings went (first panel, r2, second panel) | spec-draft.md section 15 |
| Design sources | first packet `.fgos/assignments/unit-run-1792741678364-45ec2060/producer/2/runs/01/outbox/report-1.md`; second panel `.fgos/assignments/unit-run-1792758630825-12eb2f56/producer/2/runs/01/outbox/report-1.md` |
| Glossary (workflow, case, unit, pattern, loop, params, seat, run; D-ADR0073) | spec-draft.md section 2 |
| Spec choices to confirm, and the one owner question (D1) | spec-draft.md section 16 |
| Area specs Part A merges into | spec-draft.md section 18 (`workflow.md`, `runner.md`, `seat-binding.md`, `docs/platform/config/spec.md`) |

Acceptance of Part A: the owner answered D1 and approved Part A on 2026-10-24 18:09; section 18 is merged into the area specs with a minted D-ADR and implementation is planned separately. The runtime verification engineer's replay of P6 rows 6-7 and the solo-verify crash windows is owed against the draft; the deferred non-coding workflow author and downstream operator review it.

Nothing in the repository other than this directory changed.
