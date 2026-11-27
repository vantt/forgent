---
id: ds-izibwo45vm
title: "Claiming a plan: who runs it, on which machine, recorded on main at once"
status: open
source:
  - p-p5k2htczq3
created: 2026-11-27
---

discussion: open

## 1. Trạng thái hiện tại

Opened 2026-11-27 at the owner's request ("bật shaper thảo luận vụ claim plan"). Nothing is settled yet. The seed
below is what the session that hit the problem found; the shaper scouts further and shapes it with the owner.

## 2. Mục tiêu & đề bài

When a plan moves to `running`, every machine must see at once who runs it and on which machine, so that no other
machine starts it and no admission can sit unpushed on one machine's local main. Today admission (`admit` in
`apps/fgos/src/wiring/supervision.rs`) writes `status: running`, `lead` and `base` through `admitted_text`
(`packages/supervision/rust/src/portfolio.rs`) and publishes the file through the paths land of a head's
`session write` (`apps/fgos/src/wiring/session_write_publish.rs`), which commits and pushes.

## 3. Vấn đề rõ / chưa rõ

| Item | State | Evidence |
|---|---|---|
| An admission commit can stay on local main without its push: the keeper's `docs(keeper): write plans/261127-1220-confined-rust-offline/plan.md` (ded8d6557) sat about 10 minutes unpushed and refused every land on fg-server (`land-target-ahead`) | observed | land logs 2026-11-27 14:33-14:44; a session pushed it by hand, then reverted it (03888152b) because the plan was not fg-server's |
| Nothing pushes a stranded write later; the next write refuses `write-branch-ahead` | observed | `CatchUpRefusal::BranchAhead` in `apps/fgos/src/wiring/supervision.rs` and `packages/run-supervisor/rust/src/head_request.rs` |
| The plan record names the lead (`lead: head:lead-forgent-…`) but not the machine | observed | `admitted_text` sets status, lead, base only |
| Which machine may admit which plans (fg-server: its assigned plans; fg-server2: the rest) is held only by people and session notes, not by the system | open | owner, 2026-11-27: "máy này chỉ làm các plan đã được giao" |
| Seed proposal from the session: admission also writes the machine (`host`), the plan contract accepts it, and a write that finds its own earlier write unpushed pushes it first (never another writer's) | proposal, not decided | — |

## 4. Quyết định đã chốt

| ID | Decision | Date | Source |
|---|---|---|---|

## 5. Q&A log

## 6. Thiết kế đã chốt {#design}

## 7. Danh mục hạng mục / task {#tasks}
