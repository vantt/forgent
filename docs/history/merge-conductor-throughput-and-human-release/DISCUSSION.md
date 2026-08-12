# Merge Conductor: gỡ nghẽn throughput + giải phóng người khỏi việc canh merge

## 1. Trạng thái hiện tại

Vòng 2 (2026-08-12). Người đã trả lời cả 3 câu hỏi vòng 1; **chưa mint D-ID
nào** — theo luật của skill, một điểm phải đứng vững qua hơn một vòng mà
không bị sửa mới được chốt thành D-ID. Ba điểm đang chờ đủ điều kiện đó:
thứ tự "ba fix nhỏ trước", Q2 "không land từng phần vào `main`", Q3 "không
auto-rebase".

Điểm mở chính của vòng 2 là **#12**: ý (3) của người không dừng ở "không
auto-rebase" mà đổi luôn đề bài sang "nhánh active cần một thời điểm rõ
ràng để refresh base". Scout đã tìm ra cơ chế cụ thể gây outdated
(`worktree.mjs:438` + `:749`). Cần chốt refresh xảy ra ở điểm nào trong
vòng đời trước khi §6 viết được.

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
| 7 | Câu hỏi mở Q2: merge-set bound-to-main có được land từng phần khi root chưa sync đủ? | **chốt vòng 1 — KHÔNG** | Người quyết: root tồn tại để gom con; root thiếu con mà ra `main` có thể gây hỏng. Khớp đề xuất gốc của thiết kế (luôn escalate). Chờ vòng 2 để mint D-ID |
| 8 | Câu hỏi mở Q3: auto-rebase leaf lên root tip mới, hay chỉ cảnh báo? | **chốt vòng 1 — không auto-rebase, NHƯNG đề bài đổi** | Người quyết: không tự rebase nhánh đang active. Đồng thời mở lối thứ ba mà Q3 gốc không có: nhánh active cần **thời điểm rõ ràng để rebase**, rebase sớm đỡ conflict sau — vì tốc độ agent nhanh, work sinh ra đến lúc được pick đã outdated. Xem #12 |
| 9 | tsk-280 (FSM guard) có phải chặn §E không | **rõ** | Chặn §E, KHÔNG chặn ba fix nhỏ. Hiện `todo`/stage `discovery`, tier standard, dep `tsk-4on`, mang nhãn "[MUST khi bắt đầu] quét lại codebase" + ghi chú 2026-08-09 chưa xác định lỗ ở cửa `move` hay `return` |
| 12 | Thời điểm refresh base cho nhánh đang mở là ở đâu | **rõ dần — 3 ứng viên, #2 đã giải** | Cơ chế gây outdated: `createWorktree` bỏ qua `opts.baseRef` trên đường reuse (`worktree.mjs:438`), mà `fgw/<id>` thường đã tạo từ lúc decompose (`createBranchRef(..., baseRef:'main')`, `worktree.mjs:749`) → pick dựng worktree trên base đóng băng. `docs/decisions/0022` từng nêu nhưng xếp lại. Ứng viên: #1 lúc `pick`, #2 sau khi root sync, #3 trước `return`. #2 xử lý ở hàng dưới |
| 13 | Verify nên chạy ở cửa vào hay cửa ra | **chốt vòng 2 — cửa vào, ngoài lock** | `mergedTreeAlreadyVerified` (`merge.mjs:803`, tsk-516) đã cho phép cửa ra bỏ verify khi target là ancestor + tip = `branchHeadAtReturn`. Catchup verify chính là thứ cấp lại bằng chứng đó. Bỏ verify ở catchup ⇒ verify rơi vào trong lock. Chờ vòng 3 để mint D-ID |
| 14 | Trigger nào cho refresh ở #2 | **chốt vòng 2 — giao đường dẫn thật, và #2 chỉ là điểm PHÁT HIỆN** | "root vừa nhích" là trigger sai (root 13 con ⇒ ~78 lượt verify ≈ 4h, phần lớn vô ích). Dùng `changedFiles` (`merge.mjs:362`) cho cả hai phía, KHÔNG dùng footprint khai báo. Không giao ⇒ không làm gì; có giao + phiên sống ⇒ báo phiên đó tự xử; có giao + không phiên ⇒ đánh dấu stale. Chờ vòng 3 để mint D-ID |
| 15 | §E (hàng đợi theo target) còn là hạng mục "để sau" không | **CHƯA RÕ — cần xác nhận lại** | Lập luận vòng 2 nâng §E từ "xa xỉ" lên "điều kiện để verify chỉ chạy một lần": nếu target nhích giữa catchup-verify và land thì bằng chứng vỡ, verify lại rơi vào lock. Có thể phải xếp lại so với quyết định "ba fix nhỏ trước" |
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

- **2026-08-12T08:02Z — người trả lời 3 câu hỏi vòng 1**:
  1. *Thứ tự*: đồng ý ba fix nhỏ (tsk-1zd / tsk-kv3 / tsk-60h) làm trước.
     Hỏi lại trạng thái tsk-280 → `todo`, stage `discovery`, dep `tsk-4on`,
     có nhãn quét-lại-trước-khi-làm; xác định nó chặn §E chứ không chặn ba
     fix nhỏ.
  2. *Q2 — land từng phần vào `main`*: **không nên**. Lý do người nêu: "root
     là để gom con, nên root thiếu con mà ra main có thể gây hỏng."
  3. *Q3 — auto-rebase*: **không tự rebase**. Nhưng người mở rộng đề bài:
     "các nhánh đang active working nên có thời điểm rõ ràng để rebase,
     rebase sớm thì đỡ phải conflict sau. Vì thực tế tốc độ làm việc agent
     nhanh, work tạo ra mà đến khi được pick là outdated rồi."

- **2026-08-12T08:04Z — scout xác nhận cơ chế đằng sau ý (3)**:
  `worktree.mjs:438` — `opts.baseRef` bị bỏ qua trên đường reuse, nhánh có
  sẵn được dùng lại nguyên trạng. `worktree.mjs:749` — `createBranchRef`
  tạo `fgw/<id>` từ `main` ngay lúc decompose. Hệ quả: item con sinh lúc
  decompose giữ base của thời điểm đó cho tới lúc được pick, không refresh.
  `docs/decisions/0022` đã nêu chỗ này nhưng chưa sửa.

- **2026-08-12T08:25Z — người chất vấn verify của catchup**: "catchup đầu
  vào tại sao phải verify... verify đầu ra thôi chứ. catchup mà mượt thì
  đâu có chuyện gì." Scout trả lời: `merge.mjs:803`
  `mergedTreeAlreadyVerified` (tsk-516) ĐÃ cho phép bỏ verify ở cửa ra, với
  2 điều kiện — target là ancestor của nhánh, và tip nhánh bằng
  `branchHeadAtReturn`. `merge.mjs:1046` `skipRedundantChecks`. Comment
  trong hàm nói thẳng: main nhích một commit là điều kiện vỡ, verify đầy đủ
  chạy lại TRONG lock. Catchup tạo commit mới nên làm vỡ điều kiện 2 — đó
  chính là lý do nó phải verify: để cấp lại bằng chứng cho cửa ra tiêu thụ.
  Bỏ verify ở catchup ⇒ cửa ra mất bằng chứng ⇒ verify chạy trong lock, chỗ
  đắt nhất. Kết luận đề xuất: **verify đầu vào (ngoài lock), cửa ra khỏi
  verify** — nghịch với phát biểu ban đầu của người nhưng phục vụ đúng mục
  tiêu của người (không trả verify hai lần). Ghi nhận vòng lặp tự siết:
  merge chậm → main nhích → verify phải chạy trong lock → merge chậm hơn.

- **2026-08-12T08:31Z — người hỏi trigger cho thời điểm #2**: "cái giá thật
  sự là ở số 2, trigger nào để catchup ở số 2?" Phân tích: trigger "root vừa
  nhích" là sai vì lấy sự kiện topology làm proxy cho rủi ro thật — root 13
  con, land tuần tự cả cây ⇒ ~78 lượt catchup+verify (~4h verify thuần) mà
  phần lớn phát hiện ra không có gì đụng nhau. Đề xuất: trigger bằng **giao
  đường dẫn thật**, dùng `changedFiles` (`merge.mjs:362`,
  `git diff --name-only trunk...branch`) cho CẢ HAI phía — không dùng
  `footprintOverlapAmong` (`graph-metrics.mjs:598`) vì nó so footprint KHAI
  BÁO, trường có thể thiếu/lệch (agent contention nêu đây là ẩn số chưa xác
  minh). Ba nhánh: không giao ⇒ không làm gì, catchup lười lúc tới lượt; có
  giao + phiên đang sống ⇒ báo phiên đó tự xử (đúng ca "rebase sớm đỡ
  conflict sau", và không vi phạm ràng buộc không-đụng-nhánh-người-khác); có
  giao + không phiên sống ⇒ chỉ đánh dấu stale. Hệ quả: **#2 là điểm PHÁT
  HIỆN, không phải điểm catchup** — catchup thật chỉ xảy ra do phiên sở hữu
  tự làm, hoặc lười lúc tới lượt land.

## 6. Thiết kế đã chốt {#design}

*(Chưa viết — §6 chỉ được sinh khi đã có quyết định làm đổi hình dạng thiết
kế. Vòng 1 mới scout xong.)*

## 7. Danh mục hạng mục / task {#tasks}

*(Chưa viết — chờ §6.)*
