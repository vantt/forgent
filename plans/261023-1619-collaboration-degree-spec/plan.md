---
title: "Collaboration degree, Part A: declare, request, resolve and pin the degree of applying a pattern through bounded params"
description: "BA-grade change spec draft for owner approval. Part A is the params mechanism only (activity unit reusing the step shape, one precedence chain, a --params request door, a separate ceiling key, an effective-collaboration pin, solo verify with a harness receipt, red-team as a resolver default). Milestone evidence hardening is split out as Part B."
status: draft
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

Split decided by the COOK lead (RUL104) after two red-team reviews (20 findings, 3 Critical): Part A is what the owner asked for; Part B is a separate backlog item.

| Item | Where |
|---|---|
| Part A, the draft | [spec-draft.md](spec-draft.md) |
| Part B, outline for a separate backlog item (evidence hardening, assessor, consent, freshness, coding-guide restructure) | [part-b-evidence-hardening.md](part-b-evidence-hardening.md) |
| Red-team reviews | [reports/red-team-contracts.md](reports/red-team-contracts.md), [reports/red-team-assumptions-scope.md](reports/red-team-assumptions-scope.md) |
| Where each of the 20 findings went | spec-draft.md section 14 |
| Design source (advisory packet rev.3: advice plus the owner's 2026-10-23 decisions) | `.fgos/assignments/unit-run-1792741678364-45ec2060/producer/2/runs/01/outbox/report-1.md` |
| Spec choices to confirm, and the one owner question (D1) | spec-draft.md section 15 |
| Area specs Part A merges into | spec-draft.md section 17 (`workflow.md`, `runner.md`, `seat-binding.md`) |

Acceptance of Part A: the owner answers D1 and confirms or amends the spec choices in section 15.2; after approval section 17 is merged into the area specs with a minted D-ADR and implementation is planned separately. The runtime verification engineer's replay of P6 rows 6-7 and the solo-verify crash windows is owed against the draft; the deferred non-coding guide author and downstream operator review it.

Nothing in the repository other than this directory changed.
