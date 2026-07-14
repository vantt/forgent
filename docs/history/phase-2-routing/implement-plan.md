---
feature: phase-2-routing
status: Ready for Review
lane: high-risk
sources: [CONTEXT.md, approach.md, plan.md]
updated: 2026-07-14
---

# Implement Plan: Phase 2 Routing

## Review Status

Gate 1: approved (CONTEXT D1–D7). Gate 2: **pending — tài liệu này là đối tượng duyệt.** Gate 3: chưa.

## Goal / Success

Agent lạ tự tìm việc kế tiếp từ state bằng truy vấn derive (F3, per D1), và một vòng tự hành chạy trọn một work item thành đề xuất trên nhánh cô lập, goal-check độc lập, ghi qua một cửa (per D2–D4). Thành công đo bằng proof từng epic trong plan.md §Shape, không bằng cảm giác.

## Current State

Phase 1 work-state đang chạy: CLI `fgos` 6 verbs, event log truth + view rebuild, FSM 4 trạng thái, 82 test xanh, spec `docs/specs/work-state.md` coverage full. Chưa có: truy vấn frontier, trạng thái chờ-duyệt, tier, version event, runner.

## Scope

**In:** ba epic E1 substrate (D5/D6/D7) → E2 frontier + request-class → E3 runner + recovery/anti-loop + tier→model + chain-handoff contract. **Out:** song song N, priority, intent-scoring, signal-driven, auto-merge, SQLite (P6–P9 + ngưỡng L3 — backlog).

## Proposed Approach

Nền-trước-máy-sau, một slice mỗi epic, cells chỉ cho slice hiện tại (S1). Chi tiết + rejected alternatives + risk map: `approach.md`.

## Technical Design (authored từ artifacts)

**Dòng dữ liệu:** mọi thay đổi trạng thái vẫn là event append vào `.fgos/events.jsonl` (truth, per R3/D7a) rồi view rebuild — không đường ghi mới. E1 mở rộng *hình* dữ liệu: work thêm `tier` (default khai báo cho item cũ), event thêm `v` (schema version); FSM thêm `proposed` với đúng 3 cạnh mới (`doing→proposed`, `proposed→done`, `proposed→todo` kèm lý do). Replay là điểm tương thích ngược duy nhất: fold phải đọc log Phase 1 nguyên bản (thiếu tier/v) và log mới lẫn lộn — default hóa tại fold, không bao giờ sửa log (D7). **E2:** frontier = hàm thuần trên view (todo + mọi deps done + FIFO seq, per A2) lộ ra verb đọc-không-ghi (request-class: verbs đọc không sinh event). **E3:** runner là process riêng đứng NGOÀI store nhưng ghi CHỈ qua cửa `fgos` (per D3): vòng lặp claim → tạo worktree/nhánh từ main → dựng prompt từ item → spawn agent headless theo map tier→model từ config → đợi → tự chạy `verify` của item (goal-check) → pass: `proposed`; miss/lỗi: tra recovery matrix (bảng lớp-lỗi→hành-động, máy-đọc-được) + tăng visit-count (derive từ event re-dispatch, per R3) → max-visits/circuit-breaker thì park + báo. Chain-handoff contract là tài liệu + bảng entry-router cho skill forgent tương lai — chiếu từ L4, không code runtime mới ngoài runner.

**An toàn (nói thật về mức chống đỡ — security panel):** chống đỡ bằng CHỈ DẪN + nhánh-vứt-được, không phải sandbox: worker là process full quyền user, không có cơ chế cứng chặn nó ra khỏi worktree hay gọi thẳng fgos — cấm bằng prompt (per D3), kiểm soát thật nằm ở chỗ kết quả chỉ là đề xuất D1 phải qua người duyệt (D4) và goal-check độc lập. Rủi ro tồn dư chấp nhận được trong mô hình single-user máy mình; BẤT BIẾN phải giữ: work item (nhất là trường verify — được chạy như shell) do chính user tạo, không bao giờ ingest từ nguồn ngoài khi chưa có vòng kiểm. .fgos-runner.json là config thực thi được (trusted input). Nhánh worker prefix fgw/; xóa nhánh = hủy đề xuất, log không đổi.

## Affected Files

S1 (chiếu từ cells đã tạo): cell 1 → `src/state/{work,fsm,events}.mjs` + tests; cell 2 → `src/state/replay.mjs`, `test/fixtures/phase1-events.jsonl` (sinh từ binary commit 31c1300), `test/state/backward-compat.test.mjs`; cell 3 → `src/state/store.mjs`, `bin/fgos.mjs`, `test/cli/fgos.test.mjs`. S2/S3: chiếu lại khi slice đến lượt (brief refresh).

## Implementation Steps

S1 = `phase-2-routing-1` (schema+FSM+version, không đụng replay/store) → `phase-2-routing-2` (replay backward-compat + fixture thật, deps: 1) → `phase-2-routing-3` (cửa ghi proposed/--reason/--tier qua move/add, deps: 1+2). Mỗi cell một commit, verify `npm test`.

## Validation Plan

**Validating S3 đã chạy (2026-07-14) — bằng chứng: `reports/validation-s3.md`.** Panel đầy đủ 5 lăng kính (reliability + security kích theo trigger). Đáng giá nhất: reliability bắt 3 BLOCKER thiết kế (runner-chết-giữa-chừng làm item vô hình ở `doing`; retry tự-va nhánh; breaker không event-derive được) — cả ba vá vào cells TRƯỚC khi có dòng code nào, cùng startup-reap làm `--once` idempotent sau crash. Probe chặn: `claude -p` exit 0; worktree lifecycle ×2. Verdict: READY WITH CONSTRAINTS.

**Validating S2 đã chạy (2026-07-14) — bằng chứng: `reports/validation-s2.md`.** Kết quả: panel 2 lăng kính + cold-pickup, 0 BLOCKER; FIFO chứng minh bằng probe insertion-order (không cần sửa fold); `ready` thừa hưởng ngữ nghĩa đọc của `list` (dir trống → rỗng exit 0, không tạo `.fgos/`); facade chốt `store.readyWork`. Mọi WARNING/minor vá vào cells trong vòng. Verdict: READY WITH CONSTRAINTS.

**Validating S1 đã chạy (2026-07-14) — bằng chứng: `reports/validation-s1.md`.** Kết quả: reality gate PASS; spike sinh-fixture-từ-31c1300 YES (×2 độc lập: orchestrator + feasibility persona); whole-suite scan xác nhận đúng MỘT test breaks-by-design (fsm.test.mjs:10 STATUSES deepEqual, thuộc scope cell 1); persona panel 3 lăng kính + cold-pickup: 0 BLOCKER, mọi WARNING vá trong vòng. Verdict: READY WITH CONSTRAINTS (1 test edit chủ đích duy nhất; worktree cleanup từ repo gốc; tier enum provisional reconcile tại E3). S3 giữ điều kiện chặn: probe `claude -p` thật + spike worktree TRƯỚC khi cell S3 tồn tại.

## Risks & Mitigation

Risk map đầy đủ: `approach.md`. Đỉnh: backward-compat replay (MEDIUM — fixture thật), dispatch headless (HIGH — probe chặn trước code), worktree lifecycle (MEDIUM — spike).

## Rollback Plan (authored)

S1: revert các commit của cell (mỗi cell một commit, tuyến tính). **Ràng buộc thật:** sau khi event mang `v`/trạng thái `proposed` đã được GHI vào log committed, code Phase 1 cũ sẽ không hiểu các event đó — rollback code phải kèm một trong hai: (a) chấp nhận `fgos` cũ từ chối log (corrupt-category) cho tới khi re-apply, hoặc (b) rollback trước khi bất kỳ event shape-mới nào được ghi (điểm không-quay-lại rõ ràng: event `v` đầu tiên trong log). Log KHÔNG bao giờ bị sửa để rollback (D7a). S3: dừng runner = kill process; nhánh worker là đề xuất D1 — xóa nhánh là hủy sạch, không đụng main.

## Open Questions

- Fixture log Phase 1: sinh từ binary tại commit 31c1300 (khuyến nghị của approach) — validating chốt.
- S3: lệnh headless cụ thể trên máy user — probe tại validating S3.
