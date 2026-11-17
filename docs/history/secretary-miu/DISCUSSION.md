# Discussion: secretary role (Miu)

discussion: open

## 1. Trạng thái hiện tại

Round 1 (2026-11-17). Owner decisions from the brief are inputs (§2). Five open points (§3); discussing point 1
(persona content and protocol). No D-ID minted yet.

## 2. Mục tiêu & đề bài

Define the **secretary** role (id **Miu**) as a core, domain-free fgOS persona: the owner's single front session in
the driving chain boss → secretary → shaper / planner / supervisor → leader → worker (+ watcher). It routes every
request to the right domain's shaper/planner, keeps topic status, reports short, batches decision questions, and
does no detail work, so the owner's front chat stays cheap in tokens. Settled inputs (owner 2026-11-17): name
secretary / id Miu; domain-free, lives in core; portfolio files are the source of truth (D-ADR0079), Work is a
replaceable UX layer; plans follow `core/skills/_shared/plan-contract.md`; discussions happen in per-topic shaper
sessions, not in the secretary's chat.

## 3. Vấn đề rõ / chưa rõ

| # | Point | State |
|---|---|---|
| 1 | Persona content and protocol (does / never does) | discussing |
| 2 | Placement and activation (`core/agents/secretary.yaml`, `claude --agent secretary` in herdr, opening shaper tabs) | open |
| 3 | Domain classification without Work (reuse fgos-clarifying; default when a domain has no shaper) | open |
| 4 | Token saving (3x always-loaded rules, model choice, short agent results, peer mail only on decisions) | open, needs owner approval |
| 5 | Where the topic list lives (portfolio file vs board) without coupling to Work | open |

## 4. Quyết định đã chốt

| D-ID | Decision | Rationale | Date |
|---|---|---|---|

## 5. Q&A log

- 2026-11-17 — session opened from `.fgos/runtime/tmp/secretary-brief.md`; scouted `core/agents/planner.yaml`
  (persona shape: role, persona, decision_boundary, tool-scope, skills), `core/skills/_shared/decision-question.md`,
  `plans/261117-1430-portfolio-driving-draft/plan.md`, audit `plans/reports/audit-261117-1545-supervisor-watcher-audit.md`
  (main checkout).

## 6. Thiết kế đã chốt {#design}

Not yet.

## 7. Danh mục hạng mục / task {#tasks}

Not yet.
