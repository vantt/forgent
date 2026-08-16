---
item: tsk-34n
---

# DISCUSSION.md — capability-capacity-remodel

## 1. Trạng thái hiện tại

Mới mở, round 1. Đã scout xong bối cảnh kỹ thuật (capacityIdForWork,
resolveCapacityIdForPurpose, resolveExecutorConfig) và tìm ra một hệ quả
THẬT, đang sống ngay trên repo này — không phải giả thuyết — cần người
quyết trước khi đi tiếp: `fgos-fanout` hiện đang bị vô hiệu hoá thật cho
mọi coding item, vì `fgos-coding-implement` → `agy` đã được cấu hình (từ
`tsk-1m8`), và `tsk-pdg` (vừa merge) làm đúng công việc thiết kế: khiến
`decide --work` giờ trả `out-of-process` thay vì `in-process` cho mọi
candidate coding — điều mà `fgos-fanout`'s own logic đọc thành "báo lại
cho caller, không tự bắn Agent". Xem §3 dòng đầu.

## 2. Mục tiêu & đề bài

Mô hình lại `.fgos/config.json`'s `runner.capabilities`/`capacities` cho
đúng bản chất thay vì duplicate config: `fgos-coding-implement` không
phải một backend/agent riêng — nó là một **capability/purpose** (đại
diện công việc code-implement của stage `executing`), và `agy` mới là
**capacity** thật sự phục vụ nó. fgOS đã có sẵn đúng mô hình này ở nơi
khác (`gitnexus.for:["impact-analysis"]`, `herdr.for:["pane-labeling"]`)
nhưng chokepoint `capacityIdForWork`/`spawnWorker`/`decide --work` chưa
bao giờ đi qua cửa `for` (`resolveCapacityIdForPurpose`) — nó tra thẳng
`cfg.capacities[capacityId]` theo key literal. Mục tiêu của cuộc thảo
luận này: chốt hình dạng đúng cho việc thêm fallback đó, xử lý xong việc
ambiguous/override, và hiểu rõ tác động thật lên `fgos-fanout` trước khi
khoá bất kỳ quyết định nào.

## 3. Vấn đề rõ / chưa rõ

| # | Vấn đề | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | `fgos-fanout` hiện có bị vô hiệu hoá thật cho mọi coding item không, do config `fgos-coding-implement`→`agy` đã set + `tsk-pdg` đã merge? | **RÕ — xác nhận sống** | `decide --work tsk-49o --has-live-task-access` (tsk-49o là item coding thật, đang mở) → `{"mechanism":"out-of-process","configured":true}` trên chính repo này, ngay bây giờ. Theo `fgos-fanout/SKILL.md`'s own logic (dòng ~110-118): bất kỳ mechanism nào khác `in-process` → item bị báo "cần người", KHÔNG tự bắn Agent. Tức mọi lần `fgos-fanout` chạy từ giờ, KHÔNG có candidate coding nào được bắn native cả — 100% rơi về "cần người". |
| 2 | `resolveCapacityIdForPurpose` xử lý ambiguous (nhiều capacity cùng `for` trùng purpose) thế nào? | RÕ | `src/runner/dispatch.mjs:1023-1029` — vòng `for...of Object.entries`, trả `id` đầu tiên khớp, không lỗi, không cảnh báo. Thứ tự phụ thuộc thứ tự key trong object (JS: thứ tự insertion cho string key). |
| 3 | Có nên giữ khả năng override bằng key literal không (một item tự đặt `capacities.<đúng-tên-purpose>` riêng để ép dùng backend khác)? | CHƯA RÕ | Cần người quyết — đây là câu hỏi thiết kế thật, không phải kỹ thuật thuần. |
| 4 | Phạm vi: chỉ `fgos-coding-implement`/`agy`, hay MỌI stage-skill-tên-làm-capacityId trong tương lai (mọi domain khác `coding` sau này)? | CHƯA RÕ | `capacityIdForWork` đã tổng quát hoá theo domain (`getDomain(work.domain)`), không hardcode `coding` — nên fix ở đúng layer này tự động phủ mọi domain tương lai, không cần domain nào đặc cách. |

## 4. Quyết định đã chốt

*(chưa có D-ID nào ổn định qua hơn 1 vòng — bảng này sẽ điền khi có)*

## 5. Q&A log

- **2026-08-16, round 1 (session tự scout, chưa hỏi người):** Đọc
  `src/runner/dispatch.mjs:1023-1029` (`resolveCapacityIdForPurpose`),
  `:1512-1515` (`capacityIdForWork`), `:1173-1180`
  (`decideCapacityDispatchMechanism`, vừa sửa bởi `tsk-pdg`), và
  `.agents/skills/fgos-fanout/SKILL.md` dòng ~105-120 (logic đọc kết quả
  `decide --work`). Chạy sống `decide --work tsk-49o --has-live-task-access`
  trên repo thật, xác nhận vấn đề #1 ở bảng trên là thật, không phải suy
  đoán.

## 6. Thiết kế đã chốt {#design}

*(chưa có gì để tổng hợp — chưa quyết điểm nào ổn định)*

## 7. Danh mục hạng mục / task {#tasks}

*(chưa chia — chờ §6 có hình dạng)*
