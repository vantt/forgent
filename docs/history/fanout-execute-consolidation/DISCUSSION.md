# fanout-execute-consolidation — DISCUSSION

## 1. Trạng thái hiện tại

Round 3. Đã chốt 1 điểm (D1 — verb mới đặt trong `dispatch.mjs`, giữ
nguyên qua 2 round). 4 điểm còn lại (phạm vi gom, risk-keyword-check lộ ra
skill, note hazard trong CONTEXT.md, mở rộng `fgos schedule`) mới được trả
lời lần đầu ở round 3 — đang nghiêng theo hướng người trả lời, chờ round 4
xác nhận không đổi ý mới mint D-ID. Câu hỏi mới nổi ở round 3 (nhánh
in-process là lỗi gì) đã trả lời trực tiếp trong hội thoại, không phải 1
quyết định thiết kế — không cần D-ID, chỉ ghi lại làm bối cảnh.

## 2. Mục tiêu & đề bài

`fgos-fanout`'s workflow hiện tại spell ra từng bước bash/prose cho agent
tự chạy tuần tự: đọc `fgos list --json`, gọi `computeSchedule` (thật ra
đây là 1 hàm JS pure, không phải verb CLI — nghĩa là hiện tại KHÔNG agent
nào gọi trực tiếp được hàm này qua CLI, phải suy luận lại logic của nó
bằng tay từ mô tả prose), đọc `fgos slots --json`, tự trim batch theo
`execution.free`, rồi với mỗi candidate out-of-process: 3 lệnh riêng
(`fgos pick` → `dispatch.mjs execute --cwd <worktree>` → `fgos return`).
Đây chính là phần "code nhúng trong skill" bị nghi ngờ — không phải bash
đơn lẻ (như hầu hết skill khác), mà là 1 thuật toán nhiều bước với biến
truyền qua các bước, loop, điều kiện.

Mục tiêu của item này: xác định phần nào trong luồng đó gom được thành 1-2
verb thật (chạy 1 lần, trả JSON có cấu trúc), và phần nào BẮT BUỘC ở lại
skill vì lý do kiến trúc thật (không phải vì lười refactor).

**Ràng buộc kiến trúc đã xác nhận (không phải điểm cần bàn — sự thật kỹ
thuật)**: nhánh in-process của Step 3/4 (fire native Agent chạy
`/fgOS:pick <id>`) không thể gom vào `dispatch.mjs`/`fgos` verb, vì
`dispatch.mjs` tự nhận nó "has no Task/Agent tool to call (a passive
CLI/library)" (`src/runner/dispatch/cli.mjs`'s own docblock). Chỉ live
session mới gọi được Agent tool. Vòng lặp đó ở lại skill vĩnh viễn, không
phải một quyết định cần chốt ở đây.

**Bối cảnh bổ sung (round 3, không phải quyết định — giải thích 1 sự
thật kỹ thuật đã biết từ trước)**: nhánh in-process hiện có 1 "known
hazard" ghi sẵn trong `fgos-fanout/SKILL.md` — khi nhiều Agent chạy song
song, mỗi Agent tự `EnterWorktree` vào worktree riêng của nó, nhưng harness
(Claude Code CLI) lưu "đang ở worktree nào" bằng 1 cờ CHUNG cấp session,
không phải 1 cờ riêng cho từng Agent đang chạy song song — Agent sau ghi
đè cờ của Agent trước, gây từ chối Edit/Write/Bash hoặc trôi cwd của chính
session điều phối. Đây là giới hạn tầng HARNESS, không phải lỗi trong code
`dispatch.mjs` hay `fanout`'s own logic — `dispatch.mjs` không hề tham gia
nhánh này (chỉ được hỏi 1 lần qua `decide`, không biết gì thêm), và
`fanout` chỉ là nơi kích hoạt (vì là skill duy nhất bắn nhiều Agent cùng
lúc), không phải nguồn gây lỗi. Không có code nào trong repo sửa được
hành vi harness này — cách khắc phục hiện tại chỉ là né tránh (tự phát
hiện bị từ chối → tự vào lại đúng worktree → thử lại). Item `tsk-3av`
không chạm, không sửa hazard này ở bất kỳ phạm vi nào được chọn.

## 3. Vấn đề rõ / chưa rõ

| # | Câu hỏi | Trạng thái |
|---|---|---|
| 1 | Phạm vi gom: chỉ 3-lệnh out-of-process (pick→execute→return), hay gom cả slot-poll/trim-batch vào cùng 1 verb? | **Trả lời round 3: gom cả 2 phần.** Chờ round 4 xác nhận không đổi ý → mint D-ID. |
| 2 | Verb mới đặt ở đâu: `dispatch.mjs` hay `bin/fgos.mjs`? | **D1 — đã chốt** (xem §4). |
| 3 | Risk-keyword approve check — gom vào verb hay giữ lộ ra ở skill? | **Trả lời round 3: giữ lộ ra ở skill** (verb không tự approve giùm, chỉ trả kết quả gather; check + gọi `fgos approve` vẫn do skill làm, để gate an toàn không bị ẩn trong verb). Chờ round 4 xác nhận. |
| 4 | Có cần ghi chú trong CONTEXT.md rằng item này không chạm known hazard? | **Trả lời round 3: người giao quyền quyết định lại cho phiên này** ("làm sao tốt nhất là được"). Quyết định: CÓ, sẽ ghi 1 dòng tường minh trong CONTEXT.md ở bước `fgos-coding-exploring`/`fgos-coding-planning` sau này. Coi như đã chốt về HÀNH ĐỘNG (không cần round 4 xác nhận thêm — đây là quyết định uỷ quyền, không phải 1 điểm thiết kế đang dao động), nhưng D-ID thật sẽ mint khi CONTEXT.md thực sự viết ra dòng đó (ở stage exploring), không phải ở đây. |
| 5 | `fgos schedule` chỉ có bản KHÔNG scoped — mở rộng thêm `--candidates`, hay verb mới riêng? | **Trả lời round 3: mở rộng `fgos schedule`** thêm `--candidates <id,id,...>` optional filter (không tạo verb mới cho phần schedule). Chờ round 4 xác nhận. |

## 4. Quyết định đã chốt

| D-ID | Tóm tắt | Round chốt |
|---|---|---|
| D1 | Verb mới (chain out-of-process pick→execute→return, gộp cả slot-poll/trim) đặt làm subcommand mới trong `dispatch.mjs`, cạnh `decide`/`execute`/`log` sẵn có — không tạo verb riêng trong `bin/fgos.mjs`. | Trả lời round 2, giữ nguyên không đổi qua round 3 → chốt tại round 3. |

## 5. Q&A log

- **2026-08-19 (round 1, kickoff)** — Item tạo từ audit dispatch-execute
  optimization pass cùng ngày
  (`plans/reports/audit-260819-2045-dispatch-execute-optimization-report.md`)
  và quan sát của user: "code ở skill nhiều quá có tốt không... dispatch
  xử được không". Scout xong `fgos-fanout/SKILL.md` +
  `references/wave-dispatch-mechanics.md` (nguồn duy nhất trong 14
  dev-skill có loop/điều kiện đa bước thật, 12/14 skill còn lại chỉ có
  bash 1-lệnh) + xác nhận `computeSchedule`/`hasWorkerSlotRoom`/
  `countWorkerSlots` đã là hàm JS pure có sẵn (`src/state/graph-
  metrics.mjs`, `src/state/worker-slots.mjs`). Verify thêm: `fgos schedule`
  (CLI, `bin/fgos.mjs:2550`) đã bọc `computeSchedule` nhưng chỉ bản KHÔNG
  scoped (toàn frontier, không nhận `candidateIds`) — không phủ case
  fanout cần. Đặt 5 câu hỏi ở §3.
- **2026-08-19 (round 2)** — User trả lời câu 2 (verb theo `dispatch`),
  yêu cầu giải thích thêm câu 1/3/4/5 trước khi quyết. Giải thích lại từng
  câu bằng ví dụ cụ thể (slot-poll/trim với số liệu 5 candidate/2 free
  slot; risk-keyword với ví dụ "production"/"security"; phân biệt
  `fgos schedule` (đồ thị/wave) vs `dispatch` (cơ chế chạy 1 item); "tiện
  thể fix luôn" giải thích là giả định nhầm khi sửa vùng lân cận).
- **2026-08-19 (round 3)** — User trả lời câu 1 (gom cả 2 phần), câu 3
  (giữ lộ ra ở skill), câu 5 (mở rộng `fgos schedule`), uỷ quyền câu 4 cho
  phiên quyết. Hỏi thêm: nhánh in-process đang lỗi gì, dispatch hay fanout
  — trả lời trực tiếp: lỗi ở tầng harness (worktree-isolation state lưu
  theo session, không theo từng Agent song song), không phải lỗi code của
  `dispatch.mjs` hay `fanout` — cả hai module đều không có cách sửa được.
  D1 mint (verb location, giữ ổn định qua round 2→3).

## 6. Thiết kế đã chốt {#design}

**Trạng thái: đang hình thành — 1/5 điểm đã D-ID (D1), 4/5 điểm đang
nghiêng theo câu trả lời round 3, chưa đủ 1 round ổn định để mint D-ID.**
Phần dưới đây phản ánh hướng hiện tại, không phải quyết định cuối.

`fgos-fanout`'s nhánh out-of-process (Step 2-3-5 hiện tại của
`wave-dispatch-mechanics.md`) dự kiến gom thành:

1. **`fgos schedule` mở rộng** (Q5, đang nghiêng): thêm `--candidates
   <id,id,...>` optional. Khi có, `computedSchedule` truyền candidateIds
   xuống `computeSchedule(view, candidateIds)` thay vì tính cả frontier —
   phủ đúng case fanout cần (1 parent, tập con của nó), không đổi hành vi
   khi cờ vắng mặt (mọi caller cũdùng `fgos schedule` không candidates vẫn
   y nguyên).
2. **1 subcommand mới trong `dispatch.mjs`** (D1, đã chốt + Q1 đang
   nghiêng: gom cả chain lẫn slot-poll/trim): nhận 1 batch candidate (đã
   qua bước 1 ở trên), tự đọc `fgos slots --json`, tự trim theo
   `execution.free`, rồi với từng candidate trong batch đã trim: tự chạy
   `fgos pick` → (gọi `decide` để xác nhận vẫn `out-of-process` — tránh
   race giữa lúc fanout hỏi lần đầu và lúc verb này chạy thật) →
   `execute` → `fgos return`. Trả về JSON liệt kê từng candidate: đã fire
   / cần người (dispatch-unavailable) / lỗi. Risk-keyword check (Q3, đang
   nghiêng: KHÔNG gom) không nằm trong verb này — verb chỉ lo tới
   `awaiting-approval`, không tự approve.
3. **Approve vẫn ở skill**: sau khi verb ở bước 2 trả về, `fgos-fanout`
   tự đọc lại state, tự chạy risk-keyword check + `fgos approve` cho từng
   leaf đạt `awaiting-approval` — y hệt hành vi hôm nay, chỉ khác là
   không còn tự tay lo claim/execute/return/slot-poll nữa.

Nhánh in-process (fire native Agent) không đổi — bắt buộc ở lại skill (lý
do kiến trúc, §2). Known hazard worktree-isolation race không bị chạm —
sẽ ghi chú tường minh trong `CONTEXT.md` sau này (Q4, đã quyết định hành
động, D-ID thật mint ở stage exploring).

Chưa vẽ diagram — thiết kế còn 4/5 điểm chưa đủ ổn định qua 1 round, vẽ
bây giờ sẽ phải vẽ lại. Sẽ vẽ khi round 4 xác nhận không ai đổi ý.

## 7. Danh mục hạng mục / task {#tasks}

(chưa chia — chờ §6 ổn định hết 5 điểm trước, dự kiến 1 task duy nhất vì
đây là 1 khối thay đổi liền mạch, không có dấu hiệu cần tách)
