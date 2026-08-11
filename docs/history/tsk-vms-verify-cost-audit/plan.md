# plan.md — tsk-vms: đo chi phí verify từ event log

Mode: small

Flags counted (per `fgos-routing`'s Mode gate — 0 of 10 apply): không auth,
không authorization, không data model mới, không audit/security, không hệ
thống ngoài, không public contract, không cross-platform, không sửa hành vi
đã có test bao phủ (item này KHÔNG sửa code, chỉ đọc log có sẵn), không có
vùng chứng cứ yếu cần củng cố (ngược lại — item NÀY chính là bằng chứng),
không multi-domain. 0 cờ → tiny/small; chọn **small** (không phải tiny) vì
có 4 câu hỏi con phải trả lời riêng biệt và cần một report có cấu trúc, chứ
không phải một tác vụ đơn giản một dòng.

## Quyết định đã khoá (CONTEXT.md)

- Nguồn dữ liệu duy nhất: `.fgos/events.jsonl` (9286 dòng tại thời điểm
  scout) + kênh `work.friction` bên trong nó — không dùng công cụ đo mới.
- Phạm vi = 100% pull-door (`role: session`/`human`) — xác nhận thực
  nghiệm, không có claim `role: runner` nào trong log thật.
- Không sửa hành vi, không kết luận D7/parallel-config — chỉ số liệu.
- Ba khoảng xám phương pháp đã ghi lại trong CONTEXT.md, giao cho bước
  Approach dưới đây tự quyết (không cần hỏi lại người, đã qua bộ lọc
  material/grounded/answerable ở fgos-coding-exploring và trượt cả ba — xem
  CONTEXT.md § Locked decisions):
  1. Tách timeout khỏi verify-fail thật trong `errorClass: 'verify-miss'`.
  2. Cộng dồn số lần chạy full verify qua nhiều verb (`return` + `approve`).
  3. "Worktree lệch" không có tín hiệu cơ học — chỉ liệt kê định tính.

## Approach

**Một script Node zero-dep, một lần chạy, ghi báo cáo Markdown** — cùng
khuôn mẫu đã có trong `scripts/check-events-seq-contiguity.mjs` (đọc
`.fgos/events.jsonl` trực tiếp, không phụ thuộc ngoài). Tái dùng
`readEvents`/`foldEvents` từ `src/state/events.mjs`/`src/state/replay.mjs`
(đã đọc ở bước exploring) thay vì tự viết lại parser JSONL — DRY, và đây
chính là "nguồn thật" theo D3 mà item yêu cầu dùng, không phải suy đoán.

Phương án khác đã loại: viết một `fgos <verb>` mới cho việc đo này —
loại bỏ theo YAGNI, đây là một lần đo ad hoc phục vụ 2 quyết định cụ thể
đang chờ, không phải một khả năng lặp lại thường xuyên cần thành lệnh CLI
chính thức. Item tự ghi rõ "KHÔNG sửa hành vi" — thêm verb mới là vượt phạm
vi.

**Cách giải quyết 3 khoảng xám (thẩm quyền của bước này, theo CONTEXT.md):**

1. Đếm "vòng pick" = mọi `work.move` có `to:'doing'` cho id đó, dùng
   `from` để tách pick đầu (`from:'todo'`) khỏi pick lại (`from:'blocked'`).
2. Đếm "vòng return" = mọi `work.move` có `to` ∈
   {`blocked`,`awaiting-approval`} do `return`/`approve` tạo ra (nhận diện
   qua `reason`/context, không phải suy đoán) — % blocked so với tổng.
3. Nguyên nhân thật (mục 3 của item) = `errorClass` trong `work.friction`,
   NHƯNG khi `errorClass === 'verify-miss'`, tách thêm một nhãn phụ
   `verify-miss (timeout, suy luận)` nếu `detail` khớp `/exit null\)$/`,
   còn lại là `verify-miss (that)`. Báo cáo phải nói rõ nhãn phụ này là suy
   luận từ chuỗi `detail`, không phải field gốc — tsk-53o là bằng chứng nền
   cho việc này đã được biết, không phải phát hiện mới của báo cáo.
   `merge-conflict`/`merge-failed-unclassified`/`fgos-write-blocked`/
   `worker-timeout` đọc thẳng, không cần suy luận.
4. Số lần chạy full verify = với mỗi id, đếm số event dẫn tới một lần
   `runGoalCheck` thật: mỗi `work.move` mà `to` ∈
   {`blocked`,`awaiting-approval`} có nguồn từ `return` (nhận diện qua
   `reason: 'verify-fail'` hoặc việc đây là lần chuyển từ `doing`) CỘNG mỗi
   lần `approve` chạy lại verify trước khi merge (nguồn pull/legacy —
   không tách được 100% từ event log một mình vì `approve` không luôn ghi
   riêng "đã chạy verify lại"; báo cáo phải nêu đây là cận dưới
   (lower-bound), không phải số chính xác tuyệt đối cho nhánh
   runner-merge). Ghi caveat này thẳng trong báo cáo, không che giấu.
5. Thời lượng: KHÔNG cố suy ra thời gian chạy thật từ `ts` chênh lệch giữa
   claim và return (nhiễu bởi thời gian người suy nghĩ, không phải thời
   gian test chạy) — báo cáo chỉ trích dẫn khung 161–370s đã biết
   (từ mô tả item) làm hệ số nhân cho "số lần chạy" ở mục 4, không đo lại
   thời lượng thật per-run vì log không có tín hiệu bắt đầu/kết thúc test
   riêng (chỉ có thời điểm return hoàn tất). Đây LÀ một giới hạn dữ liệu
   thật, ghi rõ trong báo cáo, không giả vờ đo được cái không đo được.

**Risk map:**

| Thành phần | Rủi ro | Bằng chứng chứng minh |
|---|---|---|
| Logic đếm pick/return/approve | Thấp — đọc thẳng field đã biết shape (`replay.mjs`, đã đọc) | Script tự assert tổng con số khớp tổng đã xác nhận thủ công ở CONTEXT.md (9286 dòng, 141 friction, role counts 599/333/35) |
| Heuristic tách timeout | Trung bình — suy luận từ string, có thể sai nếu format `detail` đổi trong tương lai | Script in kèm SỐ DÒNG khớp regex + số dòng KHÔNG khớp `errorClass==='verify-miss'` nhưng cũng không khớp pattern (fail loud nếu lệch giả định) |
| Đếm số lần full verify (mục 4) | Trung bình — là cận dưới, không chính xác tuyệt đối cho nhánh approve/merge | Báo cáo tự ghi caveat, không báo con số như thể chính xác tuyệt đối |

Impact-analysis (`CLAUDE.md` gate): GitNexus `present`, kiểm tra trực tiếp
ở bước exploring → posture `full`. Không áp dụng cho proof point nào ở đây
— item không sửa/edit một symbol code nào, chỉ đọc log và ghi báo cáo mới.

## Shape

Một mảnh duy nhất, không cần tách con (`fgos add --parent`) — toàn bộ việc
nằm gọn trong một script + một báo cáo, không có ranh giới độc lập nào
đáng tách riêng.

Case cần thử trong script (khớp mode `small`):
- Log rỗng/không tồn tại → `readEvents` đã trả `[]` (đã kiểm trong
  `src/state/events.mjs`), script phải không crash, in "no data" thay vì
  chia cho 0.
- Một id có friction nhưng chưa từng `work.move` (ghost-id, log cũ) →
  không đếm vào mẫu số của bất kỳ tỉ lệ nào (guard `view.work[id]` tồn tại,
  giống cách `replay.mjs` tự guard).
- `errorClass` lạ (không nằm trong 5 giá trị đã biết) → xếp vào nhóm
  "khác" thay vì crash hoặc bị bỏ sót âm thầm.

## Files

- `scripts/measure-verify-cost.mjs` (mới) — script phân tích, zero-dep,
  tái dùng `src/state/events.mjs`/`src/state/replay.mjs`.
- `plans/reports/verify-cost-empirical-260807-1540-pick-return-approve-audit-report.md`
  (mới) — báo cáo số liệu, output của script trên.

## Verify

```
node scripts/measure-verify-cost.mjs
```

Script tự assert nội bộ trước khi ghi báo cáo (fail loud, exit khác 0 nếu
vi phạm — không phải test ngoài kiểm tra riêng vì đây là báo cáo một lần,
không phải hành vi lặp lại cần bộ test riêng):
- tổng số dòng event đọc được > 0 và khớp `wc -l .fgos/events.jsonl` tại
  thời điểm chạy;
- tổng `disposition` count trong friction khớp tổng `errorClass` count
  (không dòng nào bị rơi khi group-by);
- mọi phần trăm tính ra nằm trong [0, 100];
- file báo cáo được ghi ra đúng đường dẫn ở trên và không rỗng.

## Open questions (không cần trước khi thực thi — đã có phương án ở trên)

Không còn câu hỏi mở nào chặn việc thực thi — ba khoảng xám từ CONTEXT.md
đã có phương án cụ thể ở mục Approach, kèm caveat sẽ được viết thẳng vào
báo cáo thay vì che giấu.
