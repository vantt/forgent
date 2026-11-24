---
id: ds-ubqlutna6r
title: "A domain-agnostic item component, split from Work, settled before Work"
status: open
source:
  - ds-wqsrwmiier
created: 2026-11-24
---

discussion: open

Opened by the shaper of `ds-wqsrwmiier` (HARDEN next round) at the owner's order of 2026-11-24 09:37 and 09:4x. Its premise
(§3 rows I1 and I2) was moved here from that discussion's rows N14 and N15. No shaper has been assigned yet; the secretary
arranges one, and a backlog row of its own if one is wanted.

## 1. Trạng thái hiện tại

**Opened 2026-11-24, not yet shaped.** The premise is in §3 (I1, I2). The fixed points are in §4 (A1–A3): this
discussion must settle, and its plan must land, before phase T7 Work of `ds-wqsrwmiier` opens. The direction proposed
in I2 has not been put to the owner as a decision yet. The first round reads I1 and I2, D-ADR0079, D-ADR0082 and the
work-state spec §3, §5 and §6, then takes up the open rows I3–I6.

## 2. Mục tiêu & đề bài

fgOS keeps items in two places today: the portfolio files under `plans/` (backlog items, discussions, plans; D-ADR0082) and
the Work store (`tsk-` items in the Event Store, on hold and frozen). Work also carries a mapping layer that keeps its core
domain-agnostic. The owner wants item storage and management (fields, properties, status, a step reference and triage)
split out of Work into one component of its own that no domain shapes. This must happen before Work's own phase opens,
so that Work's council can decide whether to keep, shrink or delete what is left of Work. The outcome is one item model with
one door: its authority, contract and Rust/Node boundary, the fields it holds, where the status FSM lives, and how domains
and Workflow attach to it without the component knowing them.

## 3. Vấn đề rõ / chưa rõ

| # | Point | State | Evidence / note |
|---|---|---|---|
| I1 | **A domain-agnostic item-data component, apart from Work.** What already exists: D-ADR0079 and D-ADR0082 (2026-11-19) made the portfolio files under `plans/` (backlog items, discussions, plans) the source of truth, domain-agnostic. They made Work a replaceable UX layer on hold, and froze the old Work store; triage of the open Work items is its own backlog row. Owner questions and gates are already the `questions` component (tier 3, Rust). The supervision crate reads the portfolio (`portfolio.rs`, `discussion_source.rs`). **Gaps in the model:** (1) no component owns the portfolio item data. `fgos authority locate` falls back to `work-state` with a weak match, and supervision owns only "portfolio status and plan lane pool"; (2) `packages/portfolio/*.mjs` (item parsing, backlog index, check) is in no component's `paths`; (3) `work-state` still owns "questions, human gates" while `questions` owns "owner question shape" and "workflow gates", so two components own one job. What stays inside Work: work-item lifecycle (`tsk-` ids, stage, claim and return), its events, and `src/intake` (classification, risk keywords; the keywords are coding-specific). **Proposal:** declare one item-data component (items, ids, statuses, links, one write door, one check, per D-ADR0082), with domain-agnostic triage in it and domain rules left in `domains/`. Its boundary is settled in this discussion (A1); phase T7 then opens with "keep, shrink or delete Work". A new component needs the owner's answer (`fgos authority declare`). | premise (from `ds-wqsrwmiier` N14) | `plans/discussions/ds-an5r4pyyto-work-data-model/DISCUSSION.md` §2, §3 row 7, D-ADR0082; `components.yaml` rows work-state, questions, supervision; `fgos authority locate` 2026-11-24 |
| I2 | **The sensitive part: two item models and Work's mapping layer.** Today there are two item stores. (1) Portfolio (D-ADR0082, live): `p-` item files with `id, title, status, priority, area, created`, five statuses (`proposed, parked, in-flight, done, dropped`), plus discussions (`open, paused, settled`) and plans (`draft, ready, running, done, withdrawn`). It has no domain and no step. (2) Work (on hold, store frozen): `tsk-` items with about 26 fields, Event Store truth, and a fixed 10-status base FSM (`fsm.mjs`; no domain may change an edge, and the four tail statuses are shared). On top of that sits the **mapping layer that keeps Work domain-agnostic**. Each domain declares its steps and maps each one onto one of the five base-workflow steps (Init, Clarify, Decompose, Execute, Compound), along with its transitions, a skill per step, `worktreeBacked`, category labels for its head statuses, and valid `kind` and `risk` values. The core never reads a domain's step names; the engines ask the registry "which step of this domain is Clarify". Part of this layer has already moved: an item carries `workflowStep` instead of `stage`, and the steps, transitions and aliases live in Workflow definitions (`domains/<domain>/workflows/*.yaml`, `src/workflow/definition.mjs`), read through `src/state/domain-registry.mjs`. **Proposed direction for N14:** one item model, not two (one door). It starts from the portfolio model, since D-ADR0082 made it the truth and froze Work's store. It takes from Work only the fields a council proves are needed (for example status category, parent and deps, refs). The item component stores the step only as an opaque reference and never interprets it. Workflow owns step meaning and the mapping onto base steps, and `domains/` owns labels and value sets. Where the base status FSM belongs (item component or Workflow) is I3. | premise (from `ds-wqsrwmiier` N15); the direction is proposed, not yet put to the owner | `docs/platform/work-state/spec.md` §3 row 4, §5 "Workflow Step Replaces Stage", §6 Domain Model; `packages/portfolio/contracts/portfolio-vocabulary.v1.json`; D-ADR0082; decision 78 frame (§6 Shape) |
| I3 | Where does the base status FSM live: in the item component or in Workflow? | open | I2; `fsm.mjs`; work-state spec §3 row 4 |
| I4 | Which Work fields does the item model take beyond the portfolio fields, and what proof does each need? | open | I2; work-state spec §3 |
| I5 | What happens to the `tsk-` items and Work's frozen streams: migrated, kept as read-only history, or triaged? The triage of Work's open items is already a separate backlog row (ds-an5r4pyyto round 12). | open | `plans/discussions/ds-an5r4pyyto-work-data-model/DISCUSSION.md` §3 row 7 |
| I6 | The component needs `fgos authority declare` (a new component needs the owner's answered question), and `work-state`'s claim on "questions, human gates" overlaps the `questions` component. | open | I1; `packages/component-authority/model/components.yaml` |

## 4. Quyết định đã chốt

| D-ID | Decision | Rounds held | Source |
|---|---|---|---|
| A1 | Item storage and management is split from Work into its own domain-agnostic component, shaped in this discussion. | owner answer | `ds-wqsrwmiier` D19; chat 2026-11-24 09:37 |
| A2 | It comes before Work: phase T7 of `ds-wqsrwmiier` opens only after this discussion is settled and its plan has landed. | owner answer | `ds-wqsrwmiier` D19 |
| A3 | Inherited, not reopened: D-ADR0079 (the portfolio travels with the project; Work is a replaceable layer) and D-ADR0082 (the portfolio data model; the Work store is frozen). | prior decisions | `docs/platform/runner/decisions/h-36d872fbb0e5.md#d-adr0082` |

## 5. Q&A log

- **2026-11-24 09:4x — opened** from `ds-wqsrwmiier` at the owner's order ("thôi tách việc này thành 1 discussion riêng phải làm
  trước Work"; "move các chi tiết liên quan làm tiền đề cho thảo luận đó"). I1 and I2 were moved from that discussion's N14 and
  N15, with their evidence.

## 6. Thiết kế đã chốt {#design}

*Nothing settled yet beyond A1–A3.*

## 7. Danh mục hạng mục / task {#tasks}

*Filled once the shape is settled.*
