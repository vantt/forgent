# Phase 2 Routing — Context

**Feature slug:** phase-2-routing
**Date:** 2026-07-14
**Exploring session:** complete
**Scope:** Deep
**Domain types:** CALL, RUN, ORGANIZE

## Feature Boundary

Xây tầng routing trên work-state (Phase 1): lệnh frontier derive từ deps+status, request-class ở cửa, chain-handoff contract, recovery matrix + anti-loop — **và một runner tối thiểu** làm vòng lặp thật: đọc frontier → dispatch một agent headless trên nhánh cô lập → goal-check bằng `verify` của item → ghi kết quả qua cửa `fgos`. Dừng ở: tuần tự một việc một lúc, kết quả worker là đề xuất trên nhánh (chưa merge tự động), chưa intent-scoring, chưa signal-driven chaining.

## Locked Decisions

These are fixed. Planning must implement them exactly — cited, never reinterpreted.
Changing one requires the user, a new D-ID or an explicit supersession note, never a silent edit.

| ID | Decision | Rationale (only if it changes implementation) |
|----|----------|-----------------------------------------------|
| D1 | **Phase 2 ôm đủ bốn món consult:** frontier-thành-lệnh, chain handoff, request-class ở cửa, recovery matrix + anti-loop. Không cắt xuống frontier-only. | User chốt sau khi được trình phương án nhỏ hơn; hai món thiếu consumer được D2 cấp consumer thật. |
| D2 | **Có runner tối thiểu.** Vòng lặp thật: đọc frontier → lấy một việc → dispatch → thu kết quả → ghi qua `fgos`. Recovery matrix + anti-loop sống TRONG runner và được test bằng vòng chạy thật, không phải bảng chính sách treo. | Đồ bảo hộ phải có máy để bảo vệ; bước đầu của hướng fan-out đa-agent. |
| D3 | **Executor = agent headless** (ví dụ `claude -p`, chọn cụ thể ở planning theo máy user): prompt dựng từ chính work item (title/kind/refs/verify); `verify` của item là goal-check do RUNNER tự chạy — không tin lời worker. **Trong vòng dispatch, runner là người ghi duy nhất** qua `fgos` — worker không bao giờ tự gọi `fgos`; quyền ghi của người vận hành ngoài vòng dispatch giữ nguyên theo spec work-state (giữ tiền đề single-writer của L3 — phá là chạm ngưỡng mở lại luật). | Đúng định vị fgOS (platform chạy agent app); goal-check độc lập là pattern đã dogfood ở bee (decision 0018). |
| D4 | **Worker chạy trên nhánh/worktree cô lập; kết quả là ĐỀ XUẤT** — commit trên nhánh + báo cáo, mức bền D1 theo thang L7; con người (hoặc vòng review được gọi riêng) duyệt rồi mới merge. Worker không bao giờ sửa thẳng working tree chính. | Sai thì vứt nhánh; runner tự hành được mà không cần phòng tuyến hoàn hảo ngay ngày đầu. |
| D5 | **FSM thêm trạng thái `proposed`:** cạnh mới `doing → proposed`, `proposed → done`, và `proposed → todo` (từ chối — event mang lý do, item vào lại frontier; anti-loop max-visits chặn lặp; muốn park dùng cạnh `todo → blocked` sẵn có). Blocked giữ nguyên hai chiều với todo/doing. Goal-check pass → runner ghi `proposed`; duyệt/merge → `done`; `done` vẫn terminal và từ nay nghĩa là "đã nhận vào cây chính". Frontier chỉ mở việc phụ thuộc khi dep thật sự `done`. Supersede tập trạng thái Phase 1 (spec work-state cập nhật khi đóng feature). | Giải bài toán ghép nối qua nhánh chưa merge (fresh-eyes P1) + lối ra khi từ chối (fresh-eyes loop-2 P2): B phụ thuộc A không bao giờ chạy trên nền thiếu code A; trạng thái chờ-duyệt nhìn thấy được. |
| D6 | **Tier→model trong scope:** schema work thêm trường `tier`; runner đọc bảng map tier→model từ config khi dispatch worker. | Món thứ 5 của consult §Phase 2; đúng cost-tiered delegation; rẻ nhất khi làm cùng runner. |
| D7 | **Luật tiến hóa schema/event:** (a) log đã commit bất khả xâm phạm — không bao giờ migration ghi đè event cũ; (b) replay backward-compatible CÓ TEST — item/event thiếu trường mới nhận default khai báo tường minh (log Phase 1 nguyên bản phải replay được dưới code Phase 2); (c) từ Phase 2, mỗi event mang trường schema version. | User chốt 2026-07-14 khi rà lỗ hổng tiến hóa schema; hệ quả trực tiếp của D5/D6 đổi shape dữ liệu trên log D2-durability. |

### Agent's Discretion

- Tên lệnh/verbs mới của CLI, shape bảng recovery matrix, cấu trúc prompt worker, cách dựng worktree — miễn tuân D1–D6, R1–R10, và spec `docs/specs/work-state.md` (đặc biệt: mọi ghi qua một cửa, exit-code theo phạm trù, event log là truth).
- Bộ đếm anti-loop đặt ở đâu (trường trên work item vs event-derived) — quyết ở planning, nhưng phải khai physics theo R1 và rebuild được từ log theo R3.

## Pinned Assumptions (có nhãn, không phải quyết định user)

- **A1 — Tuần tự:** Phase 2 chạy 1 việc một lúc. Nâng song song N là ngưỡng có tên: sau khi anti-loop chứng minh hoạt động trong vòng chạy thật ("anti-loop trước fan-out").
- **A2 — Thứ tự frontier:** FIFO theo seq tạo item; KHÔNG thêm trường priority ở Phase 2 — thêm khi có nhu cầu thật (backlog).

## Terms

| Term | Meaning in this feature |
|------|-------------------------|
| Frontier (lệnh) | Truy vấn trả về mọi work item `todo` có toàn bộ deps `done` (done = đã duyệt/merge, per D5) — derive từ state, không danh sách tay (R5). |
| `proposed` (trạng thái) | Goal-check pass, đề xuất nằm trên nhánh chờ duyệt — chưa phải "xong"; duyệt/merge mới chuyển `done` (per D5). |
| Tier | Hạng nặng-nhẹ item tự khai; runner map tier→model qua bảng config khi dispatch (per D6). |
| Runner | Vòng lặp tự hành: frontier → claim → dispatch worker → goal-check → ghi kết quả. Trong vòng dispatch là người ghi duy nhất qua `fgos` (per D3; quyền ghi của người vận hành ngoài vòng giữ nguyên). |
| Worker | Một phiên agent headless chạy một work item trên nhánh cô lập; trả kết quả cho runner, không ghi state (per D3/D4). |
| Goal-check | Runner tự chạy `verify` của item sau khi worker xong; miss = việc chưa xong, không cần tin báo cáo. |
| Recovery matrix | Bảng máy-đọc-được: lớp lỗi (worker chết, timeout, verify đỏ, log hỏng…) → hành động (retry/park/dừng) — nội dung chốt ở planning. |
| Anti-loop | Bộ đếm + ngưỡng chặn lặp vô hạn: số lần một item được thăm/re-dispatch, circuit breaker khi miss liên tiếp (per D2). |
| Request-class | Phân lớp thao tác ở cửa: đọc (frontier/list) không sinh nghi thức; ghi/dispatch mới đi qua kiểm soát. |
| Chain handoff | Contract chuyển việc agent↔agent trong chain: prose-handoff + bảng entry-router (per L4/14ebeea9) — shape ở planning. |
| Đề xuất (proposal) | Kết quả worker: commit trên nhánh cô lập + báo cáo, mức D1 — chưa phải thay đổi đã nhận. |

## Specific Ideas And References

- Consult report §Phase 2: derived next-work (readyCells/runnable pattern), request-class, failure→recovery matrix + anti-loop (fgOS: 8 error type, circuit breaker, max_skill_visits/chain_depth, quality-decay), cognitive-tier map.
- Pattern goal-check + rescue ladder + external-executor đã dogfood trong bee (bee-swarming) — tham chiếu hành vi, không copy máy móc.
- beads `bd ready` (topo-sort frontier) — `docs/distillery/sources/beads.md`.

## Existing Code Context

### Reusable Assets

- `src/state/replay.mjs` (fold events → view, thuần) + `src/state/work.mjs` (schema, deps validation) — frontier derive đứng trên fold này.
- `src/state/store.mjs` — facade lỗi EXIT_CODES/categoryOf + một cửa ghi; verbs mới đi qua đây.
- `bin/fgos.mjs` — CLI hiện hành (init/add/move/decision/list/rebuild), pattern exit-code phạm trù.
- Test harness: node:test + mkdtemp pattern (82 test đang xanh, e2e chạy binary thật).

### Established Patterns

- R1–R10 (`docs/specs/platform-foundations.md`); spec area `docs/specs/work-state.md` (đọc trước code, đặc biệt Business Rules R1–R10 của area).
- Critical patterns: verify chạy nguyên văn lệnh literal; glob luôn quote.

### Integration Points

- `docs/specs/work-state.md` — mở rộng area hoặc thêm area `routing` khi đóng feature (scribing quyết).
- `.bee/config.json` `commands` — nếu thêm lệnh test/verify mới.

## Canonical References

- `docs/platform-foundations.md` L4 (routing theo audience) + L6 (F3) + L7 (mức bền D1 cho đề xuất)
- `plans/reports/distill-consult-260713-2323-compound-learning-stack-report.md` §Phase 2
- `docs/specs/work-state.md` — hợp đồng state layer mà routing đứng trên

## Outstanding Questions

### Resolve Before Planning

(none)

### Deferred To Planning

- [ ] Chọn agent CLI cụ thể cho executor (claude -p / codex exec / cấu hình được) — theo máy user, xác nhận bằng probe thật ở validating.
- [ ] Nội dung recovery matrix (danh sách lớp lỗi + hành động + ngưỡng anti-loop mặc định) — đề xuất từ fgOS 8-error-type + bee rescue ladder, user duyệt ở Gate 2.
- [ ] Anti-loop counters: event-derived hay trường trên item (R1/R3 ràng buộc).
- [ ] Shape chain-handoff + request-class cụ thể trên CLI.

## Deferred Ideas

- Song song N worker (fan-out thật) — ngưỡng tên A1: anti-loop chứng minh xong.
- Trường priority cho frontier — khi FIFO seq lộ giới hạn thật.
- Intent-scoring (fgOS) + signal-driven chaining — đã chốt hướng từ consult, sau Phase 2.
- Merge tự động đề xuất khi review sạch — sau khi vòng đề-xuất-duyệt chạy tay đủ tin.

## Handoff Note

CONTEXT.md is the source of truth. Decision IDs are stable. Planning reads locked
decisions, code context, canonical references, and deferred-to-planning questions.
Validating and reviewing use locked decisions for coverage and UAT.
