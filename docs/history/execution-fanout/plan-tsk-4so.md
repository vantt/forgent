# tsk-4so — plan

`docs/history/execution-fanout/CONTEXT-tsk-4so.md` (D1) khoá WHAT. Plan này
không mở lại D1, chỉ định HOW.

## Mode: small

0-1 cờ áp: chỉ **existing covered behavior** (`ready`/`conflicts` đã có
test phủ ở `test/cli/fgos.test.mjs` và `test/state/graph-metrics.test.mjs`).
Không auth, không data model, không audit/security, không external
system, không cross-platform, không multi-domain. **public contracts**
không tính vì cách làm dưới đây chủ động tránh đụng `footprintOverlap(view)`
— hàm được 3 doc quyết định khác (`merge-standardization` D4-revised,
`parallel-decomposition-footprint-avoidance`, `tsk-5e97-decompose-
footprint-overlap-gate`) trích tên trực tiếp làm "contract". `fgos graph
--what-if tsk-4so`: `unblocksTransitive: 0` — lá, không chặn việc khác.
5 file chạm (2 code thật ngoài test), không gray area vì D1 đã khoá thiết
kế — khớp "a few files, no gray areas".

## Approach

**Đường chọn: KHÔNG đụng `footprintOverlap(view)`.** Thêm một hàm union
mới, chỉ đấu dây vào `conflicts`, để lại `footprintOverlap` byte-for-byte
như 3 doc kia đã trích dẫn — giảm blast radius xuống đúng phạm vi D1 cần
(hành vi verb `conflicts`), không chạm hàm mà tài liệu khác coi là danh
tính cố định.

**Đường loại, và vì sao:**

| Đường | Lý do loại |
|---|---|
| Sửa thẳng `footprintOverlap(view)` để tự union step bên trong | Đổi ngầm hành vi một hàm 3 doc quyết định khác trích tên làm "chạy trên frontier()" — dù test hiện có (4 test, không set `stage`) vẫn xanh (`item.stage ?? executeStage` fallback khiến item không-stage khớp MỌI step, nên union rồi dedupe cho cùng set như hôm nay), rủi ro không cần thiết khi có đường an toàn hơn |
| Đổi chữ ký `footprintOverlap(view, steps)` | Merge-standardization D4-revised đã nói thẳng: 4 test hiện có "assert its internal frontier-filtering as part of its contract" — đổi chữ ký là đúng thứ D4-revised cảnh báo tránh |

### Risk map

| Thành phần | Mức | Proof point |
|---|---|---|
| `readyWork(dir, {step})` thêm param optional | thấp | 5 caller production hiện có (`loop.mjs:1124,1162`, `bin/fgos.mjs:1746,2111,2208`) đều gọi `readyWork(dir)` không tham số thứ hai — `grep -rn "readyWork("` xác nhận; optional param mặc định giữ hành vi cũ |
| Hàm union step mới (tên: `frontierAcrossSteps`, đặt cạnh `frontier` trong `frontier.mjs`) | thấp | hàm thuần mới, không caller cũ nào gọi nó; test mới viết trực tiếp |
| `footprintConflicts(dir)` đổi nguồn candidate | trung bình | chỉ 1 caller (`bin/fgos.mjs:1799` verb `conflicts`) — `grep -rn "footprintConflicts("` xác nhận. `npm test` xanh chứng minh không caller nào khác gãy |
| `ready --step` wiring trong `bin/fgos.mjs` | thấp | flag hiện bị nuốt hoàn toàn (`grep -n "flags.step" bin/fgos.mjs` → 0 match hôm nay), nên không có hành vi cũ nào để gãy |

`impact-analysis: degraded` (gitnexus `present`, độ tươi không xác nhận
trong phiên này) — mọi proof point trên đều từ `grep`/đọc trực tiếp mã
nguồn, không tin riêng gitnexus, theo CLAUDE.md's gate.

### Thứ tự

`fgos graph --what-if tsk-4so --json`: `unblocksTransitive: 0` — lá, không
chặn item nào khác, không cần cân nhắc thứ tự liên-item. Trong nội bộ
item, phụ thuộc thật: hàm union step (`frontier.mjs`) phải xong trước khi
`footprintConflicts` gọi nó; wiring `ready --step` độc lập, làm song song
hoặc trước/sau đều được.

## Shape

Một mảnh, không split (leaf, đã đủ nhỏ):

1. **`src/state/frontier.mjs`** — thêm `frontierAcrossSteps(view, steps =
   ['Clarify', 'Divide', 'Execute'])`: gọi `frontier(view, {step})` cho
   từng step trong `steps`, gộp kết quả, dedupe theo `id` (giữ instance
   đầu tiên gặp — thứ tự `steps` mảng quyết định ai "thắng" khi trùng,
   không quan trọng vì cùng object item), rồi `sort(compareReadyOrder)`
   lại một lần trên tập đã gộp (giữ đúng FRONTIER_ORDER_VERSION, không
   chỉ nối 3 mảng đã sort riêng — nối thô sẽ phá thứ tự priority/intent
   xuyên step).
2. **`src/state/store.mjs`**:
   - `readyWork(dir, { step } = {})` — truyền `{ step }` xuống
     `frontier(rebuildView(logPath), { step })` khi `step` có giá trị;
     giữ nguyên khi không truyền (default `frontier`'s own `'Execute'`).
   - `footprintConflicts(dir)` — đổi từ `footprintOverlap(rebuildView(...))`
     sang `footprintOverlapAmong(frontierAcrossSteps(rebuildView(...)))`
     (cả hai hàm đã có sẵn, không hàm nào bị đổi chữ ký).
3. **`bin/fgos.mjs`**:
   - `case 'ready'` (dòng ~1746) — đọc `flags.step` (string), truyền
     `readyWork(dir, flags.step ? { step: flags.step } : undefined)`.
     Step không hợp lệ (không khớp domain nào) đã có fail-safe sẵn trong
     `frontier.mjs` (`executeStage === undefined -> continue`), trả mảng
     rỗng thay vì throw — không cần validate thêm ở đây.
   - `case 'conflicts'` (dòng ~1798) — không đổi, vẫn `return
     footprintConflicts(dir);` (hành vi mới đã nằm trong `footprintConflicts`
     ở bước 2).

`computeSchedule` (graph-metrics.mjs:717) **không đụng** — giữ đúng D1 của
CONTEXT-tsk-4so.md, khớp quyết định đã khoá ở execution-fanout gốc.

### Các ca đáng chứng minh

- **`ready --step Divide`** trên item ở stage `decompose` → xuất hiện
  đúng bằng bộ đó, không lẫn item `executing`.
- **`ready` không cờ** → byte-for-byte như hôm nay (default `Execute`,
  không đổi hành vi caller cũ — `loop.mjs` runner đặc biệt phải giữ
  nguyên).
- **`conflicts` bắt overlap chéo step**: item A ở `decompose`, item B ở
  `executing`, cùng khai `footprint` một file → được báo cặp (ca thật
  tsk-1ug/tsk-4fg/tsk-59x tái tạo bằng fixture).
- **Dedupe khi item không có `stage`**: `frontier.mjs:105`'s
  `item.stage ?? executeStage` khiến item thiếu `stage` khớp CẢ BA step —
  `frontierAcrossSteps` phải trả đúng 1 lần, không nhân ba.
- **Rỗng/biên**: không item nào ở bất kỳ step nào → `conflicts` trả `[]`,
  không lỗi.

## Giả định

Không giả định chưa chứng minh nào ở tầng đáng kể — mọi proof point trên
là grep/đọc mã trực tiếp, không dựa suy đoán.

## Verify (item, không split)

```
node --test test/cli/fgos.test.mjs && node --test test/state/graph-metrics.test.mjs && npm test
```

(khớp `verify` đã khoá trên item từ lúc submit — không đổi.)
