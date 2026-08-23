# tsk-vms — Chi phí verify thực đo từ event log

## Feature boundary

Đo (không sửa) chi phí verify của một work item trong fgOS: số vòng
pick/return/approve trung bình, phân phối, và nguyên nhân thất bại thật —
trích xuất từ `.fgos/events.jsonl` (append-only, nguồn thật per D3) và
`.fgos/friction` (kênh 2 của capture 2 kênh). Đầu ra là một báo cáo số liệu,
không phải kết luận — hai quyết định đang chờ (D7 discovery-machinery,
parallel.maxRoots/maxLeavesPerRoot) đọc báo cáo này làm input, quyết định
thực sự nằm ở phiên khác.

## Scout evidence (đã xác nhận trong repo)

- `src/state/events.mjs` — log append-only, mỗi dòng `{seq, ts, type,
  payload, v}`. Không tự resolve `.fgos/` — luôn cần `--dir`.
- `src/state/replay.mjs` — fold event thành view. Các case liên quan trực
  tiếp tới câu hỏi này: `work.move` (mọi chuyển trạng thái, gồm claim
  to:'doing', return to:'blocked'/'awaiting-approval'), `work.friction`
  (append-per-id, KHÔNG merge/replace — một id có thể tích nhiều bản ghi
  qua nhiều lần re-claim), `work.outcome` (predicted/actual merge theo id).
- `.fgos/events.jsonl` hiện có 9286 dòng (kiểm tra trực tiếp, không suy
  đoán).
- Đếm thật trên log hiện tại (script Python một lần, đọc trực tiếp từng
  dòng JSON):
  - Claim (`to:'doing'`) theo `role`: `session` 599, `human` 333, không rõ
    (thiếu field, log cũ) 35. **Không có claim nào role `runner`** — nghĩa
    là dữ liệu thật trong repo này 100% đi qua đường pull-door
    (`take`/`pick`/`return`/`approve`), autonomous headless loop
    (`src/runner/loop.mjs`, role `runner`) tồn tại trong code nhưng KHÔNG
    xuất hiện trong lịch sử claim thật của repo này. Điều này khớp với việc
    `fgos-fanout` (cơ chế parallel thật đang dùng) spawn nhiều Agent session
    độc lập, mỗi cái tự gọi `/fgOS:pick` (role `session`) — không phải
    headless watch-loop.
  - `work.friction` — 141 bản ghi, `disposition`: `blocked` 133, `parked`
    4 (không cộng đủ 141 vì có bản ghi thiếu field ở log cũ/phase-1).
    `errorClass`: `verify-miss` 84, `merge-conflict` 41,
    `merge-failed-unclassified` 7, `fgos-write-blocked` 4, `worker-timeout`
    1.
- **Phát hiện quan trọng cho phương pháp đo (methodology gap thật, không
  phải giả định):** verb `return` (`bin/fgos.mjs:2312-2470`) luôn ghi
  `errorClass: 'verify-miss'` cho MỌI lần goal-check thất bại — kể cả khi
  nguyên nhân thật là timeout. `runGoalCheck` (`src/runner/goal-check.mjs`)
  trả `status: null` khi bị kill do timeout; `return` nhét thẳng giá trị đó
  vào chuỗi `detail: "goal-check failed (exit ${check.status})"` — nên
  timeout để lại dấu vết duy nhất là chuỗi con `"(exit null)"` trong
  `detail`, KHÔNG có field riêng. Tách timeout khỏi verify-fail thật (câu
  hỏi (3) của item) vì vậy chỉ làm được bằng cách parse chuỗi `detail`, là
  suy luận gián tiếp (heuristic), không phải field có sẵn — khác với
  `worker-timeout` (errorClass riêng, `detail` ghi rõ "executor timed out
  after Nms", xuất hiện 1 lần trong log) vốn đến từ một code path khác
  (dispatch executor, không phải `return`'s runGoalCheck timeout).
  → Đây là chi tiết PHƯƠNG PHÁP đo (implementation của báo cáo), không phải
  quyết định sản phẩm — để `fgos-coding-planning` quyết cách parse cụ thể; ghi lại
  ở đây để không ai phải re-scout lần hai.
- Số lần chạy full verify (`npm test`) trên một item không nằm gọn trong
  MỘT loại event — mỗi lệnh `return` gọi `runGoalCheck` đúng 1 lần
  (`bin/fgos.mjs:2392,2456`); `approve` cho item nguồn pull/legacy cũng gọi
  lại `runGoalCheck` một lần nữa trước khi merge
  (`bin/fgos.mjs:3111`), và với item nguồn runner, merge lại chạy verify
  thêm lần nữa bên trong `src/runner/merge.mjs:832,893`. Tổng "số lần chạy
  full suite" = số lần `return` bị gọi cho id đó + số lần `approve` (khi
  verify-on-merge áp dụng) — không đọc được từ một field đơn lẻ, phải cộng
  qua nhiều verb. Ghi lại làm methodology cho `fgos-coding-planning`, không tự
  quyết ở đây.
- "Worktree lệch" (tsk-2cd — worktree dài hạn của item cha lệch khỏi
  branch của nó sau khi approve merge một child) là một BUG đã biết, không
  phải một `errorClass` hay `reason` riêng trong log — không có tín hiệu
  cơ học nào trong `events.jsonl` đánh dấu "verify này chạy trên code lệch
  worktree". Báo cáo chỉ có thể nêu đây là một nguyên nhân đã biết bằng
  cách đối chiếu thời điểm/id với các item bug đã ghi nhận (tsk-2cd,
  tsk-53o), không mechanically đếm được từ log — giới hạn thật của dữ
  liệu, không phải thiếu sót của người đo.
- Impact-analysis capability gate (`CLAUDE.md`): GitNexus `present`,
  provider `gitnexus`, kiểm tra trực tiếp — trạng thái `full`. Không liên
  quan tới scope item này (item không sửa symbol nào, chỉ đọc log và viết
  báo cáo).

## Locked decisions

Không có quyết định sản phẩm nào cần khoá qua Socratic round: mô tả gốc
của item đã tự khoá đầy đủ phạm vi (đo không sửa), nguồn dữ liệu bắt buộc
(`.fgos/events.jsonl` + `.fgos/friction`), 4 câu hỏi cụ thể phải trả lời,
và các việc cấm (không ước lượng, không sửa hành vi, không kết luận D7/
parallel config). Scout ở trên xác nhận phạm vi dữ liệu hiện có (100%
pull-door, không có nhánh runner nào cần tách riêng) — đây là một sự thật
thực nghiệm, không phải một lựa chọn cần người quyết.

Những khoảng xám còn lại (heuristic tách timeout khỏi verify-fail; cách
cộng dồn số lần chạy full verify qua nhiều verb; worktree-lệch không có
tín hiệu cơ học) đều là chi tiết PHƯƠNG PHÁP đo — thuộc thẩm quyền của
`fgos-coding-planning`/người viết script phân tích, không phải quyết định sản
phẩm mà `fgos-coding-exploring` cần khoá. Không câu hỏi nào trong số này qua được
bộ lọc material/grounded/answerable theo nghĩa "cần MỘT NGƯỜI chọn" — câu
trả lời đã nằm sẵn trong code, chỉ cần đọc.

## Pinned terms

- **"vòng pick"** = một sự kiện `work.move` với `to:'doing'` cho id đó.
  Pick đầu tiên = `from:'todo'`; pick lại sau blocked = `from:'blocked'`.
- **"return"** = lệnh `fgos return` (`bin/fgos.mjs:2312`), luôn kết thúc ở
  `to:'awaiting-approval'` (verify xanh) hoặc `to:'blocked'` (verify đỏ),
  reason `'verify-fail'`.
- **"approve"** = lệnh `fgos approve` (`bin/fgos.mjs:2645`), có thể kết
  thúc `to:'delivered'`, hoặc `to:'blocked'` với reason
  `'merge-conflict'`/`'fgos-write-rejected'`/`'integration-drift'`/
  `'merge-failed-unclassified'`, hoặc lỗi environment (`--github` path).
- **"nguyên nhân thật"** cho mục (3) của item = giá trị `errorClass` thật
  trong `work.friction`, cộng thêm heuristic phân tách timeout/verify-fail
  từ chuỗi `detail` khi `errorClass === 'verify-miss'` (xem scout ở trên).

## Canonical references

- `src/state/events.mjs`, `src/state/replay.mjs` (đọc trước theo yêu cầu
  của item).
- `bin/fgos.mjs:2312-2470` (`return`), `bin/fgos.mjs:2645-3230` (`approve`,
  `sync-root`).
- `src/runner/goal-check.mjs` (timeout → `status: null`).
- `src/runner/merge.mjs` (`merge-conflict`/`fgos-write-rejected` outcomes).
- `docs/history/fanout-and-delegation-rubric/DISCUSSION.md` dòng 34 (câu
  hỏi D7 đang chờ báo cáo này).
- `.fgos-runner.json` (`parallel.maxRoots`/`maxLeavesPerRoot` — câu hỏi
  (b) đang chờ).

## Outstanding questions deferred to planning

- Cách chính xác parse `detail` string để tách timeout khỏi verify-fail
  thật trong `errorClass: 'verify-miss'` (regex trên `"(exit null)"` là
  ứng viên, cần `fgos-coding-planning` chốt shape script/report cụ thể).
- Cách trình bày "worktree-lệch" trong báo cáo khi log không có tín hiệu
  cơ học — đề xuất: liệt kê định tính (tham chiếu tsk-2cd/tsk-53o), không
  đếm số.
- Format/đường dẫn báo cáo cuối cùng (Markdown dưới `plans/reports/` theo
  quy ước báo cáo hiện có của repo) — chi tiết thực thi, không phải quyết
  định sản phẩm.
