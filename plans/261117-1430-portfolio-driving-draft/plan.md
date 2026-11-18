---
title: "Portfolio and plan driving (DRAFT, not ready)"
description: "Draft design for the project's portfolio (backlog, program portfolio, plans) as the generic source of truth that short-lived driving roles run from; kept as a draft because it touches the Work layer."
status: draft
priority: P2
created: 2026-11-17
tags: [portfolio, planning, driving, supervisor, work-layer]
---

# Portfolio and plan driving (DRAFT)

**Status: draft.** Kept to dig deeper later, because the design touches the Work layer (owner, 2026-11-17 14:30).
No phase is ready.

## Owner direction (verbatim and settled inputs)

- 2026-11-17 ~13:26, recorded as D-ADR0079 (`docs/platform/runner/decisions/h-36d872fbb0e5.md`): the portfolio,
  board, backlog and plans are the project's source of truth and travel with the project. Work is the UX layer: it
  may hold more detailed exchanges, manages its own data, and can be replaced by another UI/UX or integration layer.
- 2026-11-17 ~13:2x (board): build the driving first as this repository's own tool, measure it, then move it into
  fgOS as verbs and skills; start with `fgos run --pattern solo`, deeper patterns later; run state through fgOS
  doors (Event Store, holder-lock); the engine is Workflow (D-ADR0076).
- 2026-11-17 14:30 (in HARDEN's session): "Mong muốn của anh là lớp data của planning (bao gồm backlogs, program
  portfolio, plans) đều ở dạng thuần nhất có thể để có thể được integrate vào lớp Work hoặc một lớp tương tự lớp Work
  mà không phải viết quá specific. nó phải generic đủ, không được hard code. ... với data thô này, chưa cần ui/ux thì
  engine có thể tự vận hành từ nguồn sự thật này. rồi với nguồn sự thật này có thể giao tiếp qua một lớp trung gian
  để làm ui dễ dùng hơn."

Requirement that follows: the planning data is uniform, self-describing and generic (no project- or UI-specific
shapes); the engine operates on the raw files with no UI; any UI or Work-like layer reaches it through one
intermediate layer (a contract/adapter), never by reading engine internals.

## Advice received (architecture-advisory council, 2026-11-17)

Runs: `wf-run-1794890645429-10371a2f` (framing, shaping, critique), reopened as `wf-run-1794898080160-96bfd8f5`
(synthesis in two reviewed rounds, explanation; closed with no extra expertise).

- Full recommendation: [reports/council-final-recommendation.md](reports/council-final-recommendation.md)
- Final packet (raw JSON, with dissent, findings and missing expertise): [reports/council-final-packet.json](reports/council-final-packet.json)

Summary of the recommended starting design (not adopted): two authored sources (backlog rows say why, plan
directories say what and how); add-only record files beside each plan keyed by a digest of the plan; one generated,
committed board holding durable facts only, with a command for the live overlay; `ready` = published and validated
at the same digest before pickup; every source change lands with its record; a no-LLM sweep keeps it healthy; each
role is one short invocation; run state (claims, running, settle) through the Event Store and holder-lock.

## Open before this draft can become a plan

- The council's nine preserved dissents and its open owner questions Q1 (committed board vs command), Q2 (when
  planless runs stop being admitted), Q4 (where the claim for a running plan lives).
- Red-team findings RT-5.1 to RT-5.4 and tester REV-1/2/3/5: answered by proposal, not reviewed.
- The Work-layer contract (D-ADR0076 "not decided here") and the intermediate layer above the raw data.
- Measurements from real solo driving (below) to ground the record shapes and roles.

## Meanwhile: drive solo, observe, measure

Drive real plans with today's tools (ak:plan plans, `fgos workflow propose|start`, `fgos run --case ... --pattern
solo`), by hand, and record every friction (`fgos friction record`) and the measures from the prototype's spec §13.3.
Findings feed this draft. Tracked separately as its own small plan when started.

## Moved out: supervisor liveness, no-progress and pace detection

Owner 2026-11-18 (through the secretary): the supervisor observation that
`plans/reports/audit-261117-1545-supervisor-watcher-audit.md` section D assigned to this draft (leader liveness,
two ticks without progress, adaptive pace) moves to the operations measurement plan `plans/261118-0936-ops-metrics`.
Scope there is detection only, shown in the attention view (`fgos dispatch inspect --attention`); no alerts while
mailbox stays deferred. This draft no longer owns it. The seven measures of the prototype's spec §13.3 are computed
by that plan as well.
