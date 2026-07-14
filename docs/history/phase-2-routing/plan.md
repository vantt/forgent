---
artifact_contract: bee-plan/v1
artifact_readiness: implementation-ready
mode: high-risk
---

# Plan: Phase 2 Routing

Mode: `high-risk` — 5 risk flags: data model (proposed/tier/version), public contracts (verbs + runner surface), external systems (dispatch agent CLI), existing covered behavior (82 test phủ vùng sửa), multi-domain (state + CLI + runner).
Why this is the least workflow that protects the work: vòng tự hành đầu tiên chạm external executor và đổi schema trên log D2-durability — chuẩn dưới không đủ; hard-gate side: external dispatch chỉ ở epic 3, được chặn bằng probe thật trước khi code.

## Requirements (from CONTEXT.md)

D1 full consult scope · D2 runner tối thiểu, recovery/anti-loop sống trong runner · D3 executor agent headless, verify = goal-check runner tự chạy, runner ghi duy nhất trong dispatch · D4 worker nhánh/worktree cô lập, kết quả D1-durability, người duyệt merge · D5 FSM: `doing→proposed→done` + `proposed→todo` (từ chối), done = đã-nhận-vào-cây-chính, frontier chỉ mở khi dep done thật · D6 tier trên item + map tier→model config · D7 tiến hóa schema: log cũ bất khả xâm phạm, replay backward-compat CÓ TEST, event mang version · A1 tuần tự · A2 FIFO seq. Ràng chung R1–R10 + spec work-state.

## Discovery

L0/L1 — pattern nội bộ (store facade, replay fold, exit-code phạm trù) + bee dogfood (goal-check, rescue ladder) + beads bd-ready; chi tiết và risk map: `approach.md`. Riêng dispatch headless (epic 3) là L1 bắt buộc probe thật tại validating của slice đó.

## Approach

Xem `docs/history/phase-2-routing/approach.md` (high-risk → file riêng).

## Shape — Epic map

Outcome: agent lạ tự tìm việc kế tiếp từ state và một vòng tự hành chạy hết một work item ra đề xuất trên nhánh (F3 + nền fan-out).

| Epic | Capability/Risk Area | Why It Exists | Slices | Proof Needed |
|---|---|---|---|---|
| E1 Substrate | schema/FSM/log mở rộng D5/D6/D7 | mọi thứ sau đứng trên; đổi data trên log bất biến | S1 | suite cũ pass nguyên vẹn + fixture log Phase 1 replay đúng |
| E2 Cửa đọc | frontier derive + request-class (per D1, A2 FIFO) | F3 nghĩa đen; đọc không nghi thức | S2 | frontier đúng trên fixture deps đa tầng; đọc không ghi event |
| E3 Runner | vòng lặp tuần tự (A1) + dispatch tier→model + recovery/anti-loop + handoff contract | D2-D3-D4-D6 per D1; đồ bảo hộ có máy thật | S3 | probe `claude -p` thật + spike worktree TRƯỚC khi code; e2e một item chạy hết vòng ra nhánh đề xuất |

Slice queue: S1 (hiện tại, feasibility: sẵn — toàn nội bộ) → S2 (deps: S1) → S3 (deps: S2; feasibility: cần probe dispatch + spike worktree tại validating S3).

## Test matrix (đủ 12 dimension, độ sâu high-risk — probe chính)

(S1) Trạng thái/cạnh: mọi cạnh mới hợp lệ + mọi cạnh cấm bị từ chối precondition (đặc biệt proposed→doing cấm, done vẫn không lối ra; cạnh doing→done CŨ GIỮ NGUYÊN — lối vào thứ hai của done dành cho thao tác tay của người vận hành, khẳng định tường minh chứ không ngầm định) (S1) · CAS trên proposed (S1) · Backward-compat (S1): fixture log Phase 1 nguyên bản → replay + rebuild + list đúng; item cũ thiếu tier/version nhận default khai báo · Event version: event mới mang version, event cũ không có vẫn đọc · Frontier (S2): deps đa tầng, dep ở proposed KHÔNG mở, FIFO seq, item blocked/doing/proposed loại khỏi frontier · Từ chối: proposed→todo kèm lý do, visit-count tăng, max-visits chặn re-dispatch (S3) · Corrupt log giữa/cuối như cũ · Exit-code phạm trù cho verbs mới (S1) · Idempotency đọc (S2): frontier/list không ghi event (request-class) · Unicode như cũ · Recovery matrix từng lớp lỗi có test giả lập (S3) · Goal-check miss → không proposed (S3).

## Current slice

S1 — substrate D5/D6/D7. Entry: main sạch, 82/82. Exit: 5 trạng thái + tier + version chạy thật, fixture log Phase 1 replay đúng, cửa ghi lộ cạnh mới, suite xanh mở rộng. Files bounded: theo 3 cells. Verify tổng: `npm test`.

## Cells

- `phase-2-routing-1` — schema + FSM proposed + event version
- `phase-2-routing-2` — replay backward-compat + fixture binary 31c1300 (deps: 1)
- `phase-2-routing-3` — cửa ghi proposed/--reason/--tier (deps: 1, 2)

## Out of scope

Song song N (P6, ngưỡng A1) · priority (P7) · intent-scoring/signal-driven (P8) · auto-merge (P9) · SQLite view (ngưỡng L3) · sửa bee/harness.
