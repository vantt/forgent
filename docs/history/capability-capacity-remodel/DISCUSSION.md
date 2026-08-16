---
item: tsk-34n
---

# DISCUSSION.md — capability-capacity-remodel

## 1. Trạng thái hiện tại

Round 2. `fgos-fanout` bị vô hiệu hoá thật cho mọi coding item (config
`fgos-coding-implement`→`agy` + `tsk-pdg`) — đã hỏi có cần gỡ config gấp
không. **Người quyết: không cần** — team này chưa từng dùng `fgos-fanout`
trong plan thật, nên việc nó tạm "báo cần người" cho mọi candidate không
gây thiệt hại vận hành. Không sửa gì về việc này ngay bây giờ; sẽ tự hết
khi remodel (§3 câu 3/4 dưới) hoàn tất, vì lúc đó `agy` sẽ tự khai `for`
đúng cách thay vì duplicate key. Đang chờ người trả lời tiếp câu 3 (giữ
override bằng key literal hay không) — đã trình bày phân tích, chưa có
câu trả lời.

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
| 5 | Có cần gỡ gấp config `fgos-coding-implement` khỏi `.fgos/config.json` sống trong lúc chờ remodel, để không chặn `fgos-fanout`? | **RÕ** | Người quyết (round 2): không cần — team chưa từng dùng `fgos-fanout` trong plan thật, việc nó tạm báo "cần người" không gây thiệt hại. Giữ nguyên config, đi tiếp remodel bình thường. |

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
- **2026-08-16, round 2:** Hỏi có cần gỡ gấp config `fgos-coding-implement`
  khỏi `.fgos/config.json` sống không (chặn `fgos-fanout` cho mọi coding
  item). Người trả lời: không cần, team chưa từng dùng `fgos-fanout`
  trong plan thật.

## 6. Thiết kế đã chốt {#design}

*(chưa có gì để tổng hợp — chưa quyết điểm nào ổn định)*

## 7. Danh mục hạng mục / task {#tasks}

*(chưa chia — chờ §6 có hình dạng)*
