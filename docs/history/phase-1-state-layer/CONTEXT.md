# Phase 1 State Layer — Context

**Feature slug:** phase-1-state-layer
**Date:** 2026-07-14
**Exploring session:** complete
**Scope:** Standard
**Domain types:** CALL, ORGANIZE

## Feature Boundary

Xây tầng state/FSM đầu tiên của forgent (code sản phẩm đầu tiên của repo): store zero-dep + FSM có precondition + single-door + CAS + event log, quản **work-state của chính forgent** — dừng ở đó: không routing (Phase 2), không compound loop (Phase 3), không interop với bee — không đọc/ghi work-state trong `.bee/`. Ngoại lệ duy nhất, tường minh: ghi nhận lệnh test/verify mới của Phase 1 vào `.bee/config.json` `commands` (housekeeping của harness phát triển theo quy tắc scribing, không phải product state).

## Locked Decisions

These are fixed. Planning must implement them exactly — cited, never reinterpreted.
Changing one requires the user, a new D-ID or an explicit supersession note, never
a silent edit.

| ID | Decision | Rationale (only if it changes implementation) |
|----|----------|-----------------------------------------------|
| D1 | Domain đầu tiên của state layer là **work-state của chính forgent** (việc của repo: item, trạng thái, quyết định). Distillery là consumer thứ hai, đến sau — không thiết kế cho nó ở Phase 1. | Khớp thang L6: F2 = "6 câu trả lời từ state", F3 = "agent lạ tự tìm việc kế tiếp" — cả hai nói về việc của repo. |
| D2 | **Song song với bee, không thay thế, không interop.** Phase 1 là code sản phẩm fgOS, độc lập với `.bee/`; bee vẫn là harness phát triển. Việc thay bee chỉ mở lại khi chạm ngưỡng có tên: forgent đạt F3 (agent lạ tự tìm việc kế tiếp từ state forgent). | Giữ scope Phase 1 nhỏ; tránh phải cover gates/cells/reservations ngay từ đầu. |
| D3 | **Physics theo đúng luật L3 áp lên chính nó:** truth = event log append-only (transitions + decisions) committed vào git (mức bền D2); file state hiện hành là view mức D4, dựng lại được từ replay toàn bộ event log. | Agent lạ trên clone mới trả lời được 6 câu từ state — tiêu chí F2. Transition = append event + update view qua cùng một cửa ghi. |
| D4 | **Đơn vị việc phẳng + deps:** một loại work item duy nhất, một FSM; item trỏ deps vào nhau; "epic" là item thường được deps trỏ vào, không phải cấp entity riêng. Vòng đời cấp-câu-chuyện (context, phê duyệt) là thuộc tính/tài liệu gắn vào item, không phải entity. | Frontier sẵn-sàng toàn cục (mọi item deps-đã-xong) → fan-out đa-agent xuyên câu chuyện tự nhiên; đúng R5 (việc kế tiếp = truy vấn derive); hội tụ độc lập với beads `bd ready`. Độ mịn item là kỷ luật planning, không phải tính chất schema. |
| D5 | **Đặt tên (chốt tại Gate 2, decision log 55ad2f9f):** CLI = `fgos`, entity = `work`, data dir = `.fgos/` (events.jsonl committed = truth, state.json = view gitignored). Lưu ý: "D5" ở đây là D-ID của feature này, không liên quan mức bền D5 trong thang durability L7. | User chốt tại Gate 2, thay đề xuất fg/item. |

### Agent's Discretion

- Cấu trúc file/thư mục của event log và view, format từng event, tên lệnh CLI — miễn tuân D3 (một cửa ghi, replay được từ zero) và các luật R1–R10 trong `docs/specs/platform-foundations.md`.
- Chọn tập trường tối thiểu của work item, miễn đủ trả lời 6 câu hỏi (R6) từ state.

## Terms

| Term | Meaning in this feature |
|------|-------------------------|
| Work item | Đơn vị việc duy nhất của forgent, mọi kích cỡ; có trạng thái FSM + deps trỏ item khác (D4). Tên entity đã chốt: `work` (per D5). |
| Frontier sẵn-sàng | Tập work item chưa xong mà mọi deps đã xong — kết quả truy vấn derive, không bao giờ là danh sách tay (R5). |
| Event log | Chuỗi append-only các thao tác ngữ nghĩa (transition, decision) — truth duy nhất, committed (D3). Chính là "changeset" theo nghĩa R3/L3 — mọi quy tắc R3 áp cho nó. |
| View state | File trạng thái hiện hành dựng lại được từ replay event log; mức bền D4, không bao giờ là truth (D3). |
| Single-door / một cửa ghi | Mọi mutation đi qua đúng một CLI; không tool nào ghi thẳng file state/log. Khai audience theo R4: consumer không-chắc-là-agent → kỷ luật data (exit-code theo phạm trù); reliability layer đầy đủ (recovery matrix, anti-loop) thuộc Phase 2, không kéo vào đây. |
| CAS expected-status | Ghi transition kèm trạng thái kỳ vọng; trạng thái thực khác kỳ vọng → từ chối, không ghi đè mù. |

## Specific Ideas And References

- Consult report §Phase 1: store JSON/JSONL zero-dep (bee), policy-vs-ops split, transition-là-API-có-precondition (bee `startFeature` pattern), terminal state một-cửa (harness), CAS hội tụ ×3, đường nâng cấp SQLite-as-view. Lưu ý: cụm "event-sourced decisions song song state overwrite" của report bị **D3 siết lại** — file state không bao giờ là truth ghi-đè ngang hàng, nó là view D4 derive từ event log; D3 thắng, không diễn giải lại.
- beads đã scan (`docs/distillery/sources/beads.md`): `bd ready` topo-sort, JSONL-truth + SQLite-cache — đối chiếu khi thiết kế frontier query và store.

## Existing Code Context

Repo chưa có runtime code sản phẩm — không có asset tái dùng trực tiếp. Điểm neo:

### Established Patterns

- Luật nền R1–R10 — `docs/specs/platform-foundations.md` (spec) + `docs/platform-foundations.md` (văn bản gốc L1–L8, có ngưỡng xem lại từng luật).
- Pattern tham chiếu ngoài: bee `.bee/bin/` (zero-dep helpers, single dispatcher), beads (`upstreams/beads` — flat items + ready query), harness (single-door terminal state) — tra qua `docs/distillery/sources/*.md`.

### Integration Points

- `.bee/config.json` `commands.verify` hiện là distill check — Phase 1 thêm test/verify của chính nó thì cập nhật commands trong cùng pass (quy tắc scribing).
- `docs/specs/system-overview.md` — thêm area mới khi feature này đóng.

## Canonical References

- `docs/specs/platform-foundations.md` — R1–R10 ràng mọi thiết kế của feature này
- `docs/platform-foundations.md` — văn bản luật đầy đủ + ngưỡng xem lại
- `plans/reports/distill-consult-260713-2323-compound-learning-stack-report.md` — chất liệu Phase 1 + candidate map
- `docs/distillery/sources/beads.md` — nguồn hội tụ gần nhất cho flat+deps

## Outstanding Questions

### Resolve Before Planning

(none)

### Deferred To Planning

- [x] Tên riêng cho work item — **đã chốt tại Gate 2 (decision 55ad2f9f): CLI `fgos`, entity `work`, data dir `.fgos/`**.
- [ ] Tập trạng thái FSM cụ thể và bảng transition+precondition — planning đề xuất từ 6 câu hỏi (R6) + pattern bee/beads, user duyệt ở Gate 2.
- [ ] Ngôn ngữ/runtime (Node zero-dep là mặc định tự nhiên theo distill + bee) — planning xác nhận theo YAGNI.

## Deferred Ideas

- Distillery làm consumer thứ hai của state layer (porting lifecycle lên FSM) — sau Phase 1, đã có hàng backlog riêng khi tới lúc.
- Thay bee bằng state layer của forgent — mở lại khi forgent đạt F3 (ngưỡng tên trong D2).
- Phase 2 routing (frontier query thành lệnh, chain handoff, recovery matrix) và Phase 3 compound — theo trình tự đã khóa trong platform-foundations.

## Handoff Note

CONTEXT.md is the source of truth. Decision IDs are stable. Planning reads locked
decisions, code context, canonical references, and deferred-to-planning questions.
Validating and reviewing use locked decisions for coverage and UAT.
