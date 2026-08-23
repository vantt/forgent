# tsk-4so — advisory frontier blindness (ready/conflicts) ngoài stage executing

Nguồn sự thật riêng cho `tsk-4so`. `plan.md` (chung feature area) mục
Validating đã nêu context nền — không lặp lại ở đây, chỉ trích khi cần.

## Feature boundary

Hai verb read-only đang bị mù với item chưa ở stage `executing`:

1. `fgos ready --step <name>` — flag `step` bị nuốt im, luôn trả Execute
   frontier bất kể flag.
2. `fgos conflicts` — advisory footprint-overlap luôn chỉ so trong Execute
   frontier, không thấy item ở `clarify`/`decompose`.

`computeSchedule` cũng hardcode Execute-only ở lời gọi mặc định
(`graph-metrics.mjs:717-719`), nhưng đó là quyết định ĐÃ KHOÁ ở
`plan.md`/`CONTEXT.md` (execution-fanout, backward-compat cho case2/
runner) — **ngoài phạm vi tsk-4so**, chỉ nêu để giải thích vì sao ba verb
cùng chung root cause (`frontier(view)` mặc định `step: 'Execute'`).

## Bằng chứng scout

| Vị trí | Bằng chứng |
|---|---|
| `bin/fgos.mjs:1746` | `case 'ready': return paginateVerbResult(readyWork(dir), ...)` — không đọc `flags.step` ở đâu cả trong toàn file (`grep -n "flags.step" bin/fgos.mjs` → 0 match) |
| `src/state/store.mjs:969` | `export function readyWork(dir) { ...; return frontier(rebuildView(logPath)); }` — không nhận `step` |
| `src/state/frontier.mjs:78-98` | `export function frontier(view, { step = 'Execute' } = {})` — đã support step từ tsk-19j D9, chỉ chưa được gọi với step khác |
| `src/state/graph-metrics.mjs:603-605` | `footprintOverlap(view) { return footprintOverlapAmong(frontier(view)); }` — không truyền step |
| `bin/fgos.mjs:1798` | `case 'conflicts': return footprintConflicts(dir);` — không đọc flag nào |
| `src/state/graph-metrics.mjs:717-719` | `computeSchedule(view, candidateIds)` — `frontier(view)` cũng hardcode, `candidateIds` chỉ sub-filter TRONG Execute frontier, không mở rộng ra step khác. Default giữ nguyên theo quyết định đã khoá ở execution-fanout — không đổi ở đây |

**Ca thật (data `.fgos/state` lúc chứng minh, 2026-08-07):** `tsk-1ug`
(`todo`, stage `decompose`), `tsk-4fg` và `tsk-59x` (khi đó `todo`, stage
`executing`) cùng khai `footprint` đụng `bin/fgos.mjs`. `fgos conflicts`
báo 0 cặp vì `tsk-1ug` không lọt Execute frontier ở bất kỳ lần gọi nào.

**Test hiện có:** `test/cli/fgos.test.mjs` có nhiều test cho `ready`
(dòng 452, 1540-1580, 2171+) nhưng **0 test nào truyền `--step`**.
`test/state/graph-metrics.test.mjs` có test cho `footprintOverlap`
(dòng 570-612) nhưng chỉ trên single-stage frontier mặc định — không có
test cross-stage.

**Impact-analysis posture:** `fgos tool query --capability impact-analysis
--status present` → gitnexus `present`. Không xác nhận độ tươi so HEAD
hiện tại (`8b42f298...`) trong phiên này — theo CLAUDE.md's gate, coi là
`degraded`: mọi proof point ở trên đều lấy từ `grep`/đọc trực tiếp state,
không riêng tin gitnexus.

## Quyết định đã khoá

| D-ID | Quyết định |
|---|---|
| **D1** | `fgos conflicts` đổi default: gộp candidate từ CẢ BA step (Clarify+Divide+Execute) rồi mới tìm footprint overlap — thay vì chỉ Execute frontier như hôm nay. Lý do: phương án "thêm `--step` mirror `ready`" không bắt được ca thật tsk-1ug/tsk-4fg/tsk-59x (item ở step khác nhau đụng chung file — overlap chỉ hiện khi gộp, không phải khi so riêng từng step). Đánh đổi chấp nhận: item còn ở `clarify` có footprint tự khai sớm, advisory có thể ồn hơn ở early stage — chấp nhận được vì đây vẫn chỉ là advisory, không blocking (`footprintOverlapAmong`'s "advisory, never blocking" stance không đổi) |

`ready --step <name>` wiring (readyWork → frontier(view,{step})) không cần
hỏi — mechanical, `frontier.mjs` đã sẵn tính năng, chỉ thiếu dây nối; default
khi không truyền flag giữ nguyên `Execute` (không đổi hành vi caller hiện
có, cùng nguyên tắc `computeSchedule`'s `candidateIds` optional đã dùng).

## Thuật ngữ

- **step** — một trong `Clarify`/`Divide`/`Execute`, ánh xạ sang `stage`
  theo domain qua `stageForStep` (`workflow-stage-graphs.mjs`). Coding
  domain: `clarify→Clarify`, `decompose→Divide`, `executing→Execute`.
- **candidate (cho conflicts, sau D1)** — hợp của `frontier(view,{step:
  'Clarify'})`, `frontier(view,{step:'Divide'})`, `frontier(view,
  {step:'Execute'})`, dedupe theo id (một item chỉ map đúng 1 stage tại
  một thời điểm nên không có double-count thật, nhưng union phải dedupe
  để an toàn nếu domain nào đó map nhiều stage vào cùng step).

## Ngoài phạm vi (không đụng trong tsk-4so)

- `computeSchedule`'s default behavior — khoá ở `docs/history/
  execution-fanout/CONTEXT.md`/`plan.md`, backward-compat cho case2/runner.
- Thêm `--step` flag cho `conflicts` để narrow xuống 1 step riêng — không
  được hỏi/chọn, để `fgos-coding-planning` quyết nếu thấy cần khi thi công (không
  material ở tầng quyết định sản phẩm).

## Tham chiếu

- `docs/history/execution-fanout/plan.md` (mục Validating — nguồn item
  này trích trong description)
- `docs/history/execution-fanout/CONTEXT.md` (D1-D10, execution-fanout gốc)
- `src/state/frontier.mjs:78-98` (`frontier(view,{step})`)
- `src/state/graph-metrics.mjs:560-605,717-780` (`footprintOverlapAmong`,
  `footprintOverlap`, `computeSchedule`)
- `bin/fgos.mjs:1741-1800` (`ready`, `conflicts` verb cases)

## Outstanding questions cho planning

- Không có câu hỏi mở còn lại ở tầng sản phẩm. Implementation shape (nơi
  đặt hàm union step, có cần helper riêng trong `frontier.mjs` hay gộp
  ngay trong `graph-metrics.mjs`, tên hàm) thuộc `fgos-coding-planning`.
