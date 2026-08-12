# Merge Conductor: gỡ nghẽn throughput + giải phóng người khỏi việc canh merge

## 1. Trạng thái hiện tại

Vòng 1 (2026-08-12). Scout xong, **chưa chốt D-ID nào**.

Phát hiện lớn nhất của vòng scout: **thiết kế cho đúng bài toán này đã tồn
tại từ 2026-08-01** — "Merge Conductor", §A–§I, trong
`plans/reports/internal-research-260801-1823-merge-mechanism-grand-orchestrator-design-report.md`
(refs của tsk-3bn, item đó nay đã `done`). Phần lớn thiết kế đó **đã ship**.
Phần chưa ship lại đúng là hai phần trả lời trực tiếp nỗi đau đang nêu.

Vì vậy đề bài của buổi này KHÔNG còn là "thiết kế lại cơ chế merge" mà là:
**quyết định xây nốt phần nào của Conductor đã thiết kế, theo thứ tự nào, và
trả lời những câu hỏi mở mà thiết kế đó tự đánh dấu là cần người quyết.**

Đang chờ người xác nhận khung tái định vị này trước khi đi tiếp.

## 2. Mục tiêu & đề bài

Merge của fgOS vừa chậm vừa buộc người ngồi canh. Nguồn chậm là vùng găng
quá rộng: `mergeRunnerItem` giữ `.fgos/main-checkout.lock` toàn repo suốt cả
merge lẫn verify (đo ~185s, trong khi `DEFAULT_TTL_MS` chỉ 180s nên phải chắp
heartbeat ở `merge.mjs:745` để lock khỏi tự hết hạn giữa chừng) — trong khi
phần thật sự cần độc quyền chỉ là git-merge-stage cộng commit, vài giây.
Verify bị kẹt bên trong lock vì không có chỗ cô lập nào để chạy nó sau khi đã
merge vào checkout dùng chung. Chồng lên đó là ba tầng nghẽn khác: `merge next`
chỉ tiêu thụ `ready[0]` nên một item kẹt làm đứng cả vòng merge của repo
(tsk-1zd đo được 13 lượt liên tiếp trả về cùng một item, 7 item sẵn sàng không
bao giờ tới lượt); cổng cây-sạch của `approve`/`sync-root` đòi cây chung sạch
tuyệt đối nên merge bị ghép cứng vào việc dang dở của session khác (tsk-kv3,
tái hiện live ngay trong phiên tạo item này); và người vẫn bị giữ lại ở những
điểm dừng mà máy đã đủ năng lực tự quyết — rõ nhất là `merge-conflict`, nơi
verb `catchup` đã tồn tại và nhận đúng reason nhưng skill chưa bao giờ được
bảo dùng nó (tsk-60h). Mục tiêu cuối: throughput merge không còn là hàm của
việc có ai đang ngồi canh hay không, và người chỉ bị gọi cho những phán đoán
thật sự cần người.

## 3. Vấn đề rõ / chưa rõ

| # | Vấn đề | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | Thiết kế Conductor đã có chưa | **rõ** | Có, từ 2026-08-01, §A–§I + thứ tự triển khai + 4 câu hỏi mở |
| 2 | Phần nào của Conductor đã ship | **rõ** | §B drift pre-flight, §C sync-root (tsk-3bn done); §D merge-set clustering (tsk-2u0 done); §A lock scope thật (tsk-2eq done); §F một phần (tsk-2vd done); §I audit trail (tsk-19j done) |
| 3 | Phần nào CHƯA ship | **rõ** | **§E — hàng đợi đơn cho mỗi target branch** (chưa từng xây) và **§H — chính sách escalation thu hẹp** (chưa từng áp) |
| 4 | "Pipeline 16 làn" có thật đang chạy không | **rõ — KHÔNG** | `capacity.dispatch` = 1 event trên ~14.500 (D5 của tsk-3cs đo 0 lúc 2026-08-10). Song song thật đến từ N phiên người/agent: 7–8 item vào `doing` mỗi giờ lúc cao điểm |
| 5 | Câu hỏi mở Q1 (lock có chặn worktree không) | **rõ — đã giải** | tsk-45y đóng `wontfix`, tsk-2eq `done` → chốt là CÓ, lock thật áp cho leaf merge |
| 6 | Câu hỏi mở Q4 (chặn git op huỷ diệt trên main checkout) | **rõ — đã giải** | `fgos main-checkout-reset --sha --confirm` đã có (AGENTS.md, tsk-3au) |
| 7 | Câu hỏi mở Q2: merge-set bound-to-main có được land từng phần khi root chưa sync đủ? | **CHƯA RÕ** | Thiết kế đề xuất luôn escalate; chưa ai xác nhận |
| 8 | Câu hỏi mở Q3: auto-rebase leaf lên root tip mới, hay chỉ cảnh báo? | **CHƯA RÕ** | Đánh đổi tự-động-hoá vs rủi ro ghi đè nhánh phiên khác đang làm |
| 9 | tsk-280 (FSM guard) có phải chặn §E không | **CHƯA RÕ** | Thứ tự triển khai của thiết kế xếp nó ở bậc 8, "land trước khi Conductor được tin để tự hành động"; nay vẫn `todo` |
| 10 | Verify chạy ở đâu khi ra khỏi lock | **CHƯA RÕ** | Clone dùng-một-lần, worktree ephemeral tái dùng, hay cơ chế khác — quyết định này định hình cả §E |
| 11 | Cổng cây-sạch thu về footprint item, hay merge chạy hẳn ngoài cây chung | **CHƯA RÕ** | tsk-kv3 nêu cả hai lối; chưa chọn |

## 4. Quyết định đã chốt

*(Chưa có. Theo luật của skill này, D-ID chỉ được mint sau khi một điểm đứng
vững qua hơn một vòng mà không bị sửa. Vòng 1 chưa đủ điều kiện.)*

| D-ID | Quyết định | Lý do |
|---|---|---|

## 5. Q&A log

- **2026-08-12T06:11Z — quét đội hình 4 agent** (report trong `plans/reports/`,
  tiền tố `*260812-134*`): bug-clusters gom 54 item merge thành 7 nhóm nguyên
  nhân; engine-code trace đường thực thi `merge next`/`approve` kèm cost
  profile; contention kiểm kê tài nguyên chia sẻ + audit điểm dừng chờ người;
  prior-art trích luật khoá L9/L10/0005/0020.

- **2026-08-12T07:49Z — scout trong worktree, phát hiện tái định vị**:
  `docs/history/tsk-3bn-merge-conductor-harness-v2/` (CONTEXT 17K + plan 11K)
  và `plans/reports/internal-research-260801-1823-merge-mechanism-grand-orchestrator-design-report.md`
  cho thấy thiết kế Conductor đã đầy đủ từ 2026-08-01. Đối chiếu trạng thái
  item: tsk-3bn/tsk-2u0/tsk-2eq/tsk-2vd/tsk-19j/tsk-4voj/tsk-2j9/tsk-18a/
  tsk-480/tsk-396/tsk-15k/tsk-66x đều `done`; tsk-45y `wontfix`; tsk-280 còn
  `todo`. Kết luận: §E và §H là phần chưa xây.

- **2026-08-12T07:50Z — kiểm chứng tiền đề "16 làn"**: đếm theo `.type` thật
  trên `.fgos/events.jsonl` cho `capacity.dispatch` = 1 (event duy nhất lúc
  04:55 hôm nay, capacity `gather`, provider `agy`). `grep -c` ra 138 nhưng
  đó là chuỗi nằm trong nội dung event khác. Xác nhận D5 của tsk-3cs
  (`merge-list-tree-bottleneck-priority/DISCUSSION.md`): nguồn giẫm chân là
  nhiều phiên chạy song song, không phải fanout tự động. Khung "phễu 1 làn
  dưới pipeline 16 làn" bị bác bỏ và thay bằng "phễu 1 làn dưới N phiên song
  song, 7–8 claim/giờ".

## 6. Thiết kế đã chốt {#design}

*(Chưa viết — §6 chỉ được sinh khi đã có quyết định làm đổi hình dạng thiết
kế. Vòng 1 mới scout xong.)*

## 7. Danh mục hạng mục / task {#tasks}

*(Chưa viết — chờ §6.)*
