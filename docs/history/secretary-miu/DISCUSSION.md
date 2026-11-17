# Discussion: secretary role (Miu)

discussion: open

## 1. Trạng thái hiện tại

Round 2 (2026-11-17). Point 1: draft persona presented (does / never does, see §5); owner chose that Miu orders
topics itself by the product priority list and reports the order (candidate D-ID, holds one more round). Rotation:
owner rejected "owner types /clear" (forgets often), so rotation must be automatic; now discussing the right moment. No D-ID minted yet.

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
| 1 | Persona content and protocol (does / never does) | discussing. Provisionally clear: Miu orders topics itself and reports (owner, round 2). Open: rotation must be automatic (owner, round 3); right moment and signal under discussion |
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
- 2026-11-17 — Miu proposed the point-1 draft: does = classify domain, answer inline only what portfolio files
  answer, open shaper for >1-2 rounds or detail reading, planner on `settled`, supervisor on `ready`, keep topic list,
  report <=10 lines, batch five-part questions, rotate own session via handoff; never = read diffs, edit code/docs
  (except topic list), run tests, land, discuss a topic in depth itself, know any domain's steps. Asked who orders
  topics. Owner: "Miu tự xếp thứ tự rồi báo lại anh." (Miu orders by product priority, reports; asks only on a tie or
  when a reorder delays something promised.)
- 2026-11-17 — Miu asked when to rotate (milestones / every N topics / never). Owner asked what the right method is.
  Miu scouted: SessionStart hook matcher `startup|resume|clear|compact` in `.claude/settings.json`; herdr
  `tab`/`pane run`/`pane close`; Miu cannot type `/clear` itself. Proposed (A) owner `/clear` + handoff updated
  every state-changing turn, (B) self-rotation via herdr later. Owner: "không đồng ý, anh còn quên miết, đưa thêm
  thảo luận: thời điểm phù hợp để đổi phiên." -> rotation must not depend on the owner.

## 6. Thiết kế đã chốt {#design}

Not yet.

## 7. Danh mục hạng mục / task {#tasks}

Not yet.
