# Tổng hợp: agent-executor — mục tiêu, ràng buộc, rủi ro, và những gì chưa bàn

Tài liệu này nhìn lại toàn bộ chuỗi thảo luận agent-executor (bắt đầu
2026-07-31) ở tầm tổng quát, không lặp lại chi tiết kỹ thuật đã có trong
`agent-executor-design-260731-1758-capacity-backend-dispatch-proposal-report.md`
(design chính) và `distill-consult-260731-1733-agent-executor-backend-dispatch-report.md`
(consult prior-art) — chỉ trỏ vào đó khi cần.

**Trạng thái backlog lúc viết:** cụm `tsk-64p` (4 con: `tsk-62v`, `tsk-slq`,
`tsk-5l2`, `tsk-g18`), tất cả `todo`/`clarify`, chưa item nào bắt đầu build.

## 1. Mục tiêu — phát biểu lại 1 câu, rồi bung ra

**Mục tiêu tối thượng:** mọi capacity (việc agent làm) chọn được đúng
backend/model/tool-scope để đạt **chất lượng phù hợp với giá RẺ NHẤT**, qua
**1 điểm cấu hình duy nhất** — không phải hardcode rải rác trong từng skill.

Vì sao việc này đáng làm (lý do gốc, không phải tiện ích): hôm nay mỗi skill
tự quyết định riêng lẻ có nên gọi model khác không (`/research`'s Gemini
Toggle là ví dụ DUY NHẤT đã chạy thật) — không có chỗ nào NHÌN THẤY hay
SO SÁNH được toàn cảnh "capacity nào đang tốn bao nhiêu, có thể rẻ hơn ở
đâu". agent-executor không phải tính năng mới — nó là **hạ tầng để mục tiêu
cost/quality trở thành thứ quan sát và điều chỉnh được**, thay vì nằm rải
rác trong trí nhớ từng skill.

## 2. Khung/ràng buộc đã framing — 6 quyết định kiến trúc, theo thứ tự phát hiện

1. **2 domain invocation không giống nhau** (mục 0 design): domain 1
   (forgent's Node runner tự spawn process, code thật, enforce được) vs
   domain 2 (phiên tương tác, Task/Agent tool của HARNESS người khác, chỉ
   prose+config, không enforce được từ code forgent).
2. **Đệ quy, không tĩnh** (mục 0.5): domain không cố định theo ai khởi
   xướng chuỗi — mỗi hop tự hỏi lại "process hiện tại có gì native", ưu
   tiên ở lại native (rẻ/nhẹ) trước khi cross sang process khác.
3. **Cơ học, không phải tự tin** (mục 0.5, port từ gate-bypass D1-D5 đã
   locked sẵn trong forgent): phán xét dời sang người, dời sang lúc author
   config — agent lúc chạy KHÔNG BAO GIỜ tự chấm bài mình. Chỉ 1 sàn thật
   sự cần hỏi người: cấp tool-scope CAO HƠN baseline, hỏi 1 lần lúc author,
   không phải mỗi lần dispatch.
4. **Tool-scope là trục thứ 3** (mục 9), tách khỏi backend + model — phát
   hiện từ bằng chứng thật (`judge` tier bị lạm dụng làm "synthetic role
   key" trong code đang chạy), không phải giả thuyết.
5. **"Trơn tru" = 4 thuộc tính đo được** (mục 0.5): thông suốt, đầy đủ tool,
   an toàn, quan sát được — áp ở MỖI hop, không chỉ hop đầu.
6. **Capacity là 1 khái niệm, 2 tầng** (mục 4.0): tầng discovery (`fgos
   tool`, đã build, tsk-1dj) và tầng dispatch (`capacities`, đang thiết
   kế) dùng CHUNG từ vựng `kind` — không merge schema, nhưng không được
   phép trôi thành 2 khái niệm khác nhau.

## 3. Vấn đề CHẮC CHẮN sẽ gặp khi build 4 item hiện có

Đây là khoảng cách giữa "thiết kế đã chốt" và "code sẽ chạy" — không phải
lý thuyết, mà là chỗ cụ thể sẽ vấp khi implement:

- **Argv-template chỉ verify cho `claude`.** `SUPPORTED_EXECUTOR_TEMPLATES`
  hôm nay CHỈ có 1 entry (`claude`) — `tsk-5l2` (submit-assist qua CLI rẻ)
  cần 1 provider THẬT (agy/gemini/codex) có argv template đã verify. Chưa
  ai xác nhận flag/cách truyền prompt của provider đó khớp giả định
  `{prompt}`/`{model}` placeholder — mỗi provider mới cần tự verify 1 lần,
  giống đúng nguyên tắc "hỏi 1 lần lúc author" ở mục 0.5, nhưng cho SHAPE
  argv chứ không chỉ cho tool-scope.
- **Không có sanity-check cho output từ backend thay thế.** `tsk-5l2` dùng
  kết quả model rẻ làm tier/kind/risk suggestion — nếu backend đó trả JSON
  sai/malformed, thiết kế hôm nay KHÔNG có bước fallback-về-inline giống
  `judge-executor.mjs`'s `MAX_JUDGE_ATTEMPTS`/`JUDGE_STRICT_JSON_SUFFIX`
  retry pattern đã có cho Claude. Cần quyết: dùng lại đúng pattern đó, hay
  chấp nhận rủi ro thấp hơn (vì submit-assist vốn non-authoritative)?
- **Recursive hop (mục 0.5's nguyên tắc "ưu tiên native mỗi hop") CHƯA có
  work item nào implement/test thật.** Cả 4 item hiện có đều là single-hop
  cụ thể (domain 1 runner, hoặc domain 2 gọi 1 lần). Nguyên tắc đệ quy vẫn
  chỉ là triết học chưa gắn code — sẽ lộ ra khi có capacity THẬT tự gọi
  capacity khác (chain 2+ hop), hiện chưa xảy ra trong 4 item này.
- **`.fgos-runner.json` là file JSON thường, không qua one-door-write.**
  Repo này ĐANG chạy nhiều session song song thật (chứng kiến ngay trong
  phiên này — 1 session khác sửa 1 report khác cùng lúc). `ensureRunnerConfig`
  tự merge-và-ghi-đè khi thiếu key mặc định — 2 session cùng lúc chỉnh
  `capacities` có nguy cơ ghi đè nhau (không phải lý thuyết, đã có tiền lệ
  concurrent write ngay trong ngày hôm nay).

## 4. Phát sinh khác — góc nhìn chưa ai đề cập trong toàn bộ chuỗi thảo luận

Đây là phần anh yêu cầu rõ: những gì CHƯA được đặt lên bàn, tôi chủ động
nêu ra, không né:

### 4.1 Dữ liệu rời khỏi Claude khi cross-provider (chưa ai nói tới)

Khi capacity route sang `agy`/`gemini` (khác họ), **nội dung prompt (có thể
chứa code, mô tả work item, nội dung repo) rời khỏi hệ Anthropic, đi tới
1 provider LLM khác** (Google, hay bất kỳ ai đứng sau CLI đó). `dispatch.mjs`
đã tự cảnh báo `.fgos-runner.json` là "EXECUTABLE config... chỉ áp dụng từ
checkout đã tin cậy" — nhưng CHƯA có cảnh báo tương đương cho việc "capacity
X gửi nội dung gì sang provider khác". Không có phân biệt "capacity này an
toàn gửi ra ngoài" vs "capacity kia chạm code/dữ liệu nhạy cảm, phải giữ
trong Claude". Đây là câu hỏi **governance**, không phải kỹ thuật — cần
người quyết, không tự động hoá được.

### 4.2 "Chất lượng phù hợp" chưa có định nghĩa đo được

Mục tiêu tối thượng nói "quality phù hợp, giá rẻ nhất" — nhưng KHÔNG có
capacity nào (kể cả `tsk-5l2` proof-of-concept) có 1 tiêu chí "phù hợp" cụ
thể để so sánh model rẻ với baseline. Không đo được thì không biết thiết kế
có đạt đúng mục tiêu của chính nó hay không — nguy cơ: chọn rẻ mà không
biết có đang âm thầm hạ chất lượng.

### 4.3 Năng lực agentic khác năng lực rẻ

Model rẻ hơn (vd flash-3.5) có thể RẺ về token nhưng KHÔNG NHẤT THIẾT giỏi
tool-use nhiều bước (đọc-sửa-verify lặp) như Claude trong 1 vòng lặp agent
thật. Nếu 1 capacity cần multi-turn tool-use phức tạp (vd `coding:executing`
thật) bị route sang backend rẻ nhưng yếu ở agentic loop, "rẻ hơn" có thể
đổi thành "phải làm lại, đắt hơn thật". Thiết kế hôm nay chỉ có trục
cost-tier + tool-scope — CHƯA có trục "năng lực agentic phù hợp việc gì".

### 4.4 Không có đường escalate khi backend rẻ thất bại

`judge-executor.mjs` đã có sẵn pattern retry-rồi-escalate cho Claude. Thiết
kế agent-executor CHƯA nói: nếu dispatch sang backend rẻ mà process đó lỗi/
timeout/trả rác, có tự động rơi về Claude không, hay đứng yên báo lỗi? Mục
5 chỉ nói "backend vắng mặt = skip sạch" — khác với "backend có mặt nhưng
làm hỏng việc".

### 4.5 Độ trễ khi domain 2 gọi CLI ngoài đồng bộ

Domain 2's nhánh `kind: "cli"` gọi qua Bash — Bash tool chờ đồng bộ tới khi
xong. Nếu capacity đó là việc nặng (không phải classify nhanh như
`tsk-5l2`), phiên tương tác sẽ "đứng hình" đợi process ngoài — chưa ai bàn
trải nghiệm này có chấp nhận được không.

### 4.6 Đo tiết kiệm thật — mục 8 mới dừng ở "biết ĐÃ gọi gì", chưa "tiết
kiệm được bao nhiêu"

Announce+audit trả lời "capacity nào gọi provider/model nào" — nhưng
KHÔNG có số $ hay token thật (không phải mọi CLI đều in usage). Mục tiêu
"giá rẻ nhất" hôm nay được PHỤC VỤ bằng cách chọn tier tĩnh lúc author
config, chứ chưa được ĐO lại bằng dữ liệu thật sau khi chạy — vòng lặp
"đo → biết có đúng rẻ hơn không → điều chỉnh" chưa khép kín. Đã cố tình ghi
YAGNI cho `fgos capacity gain` — nhưng nên biết đây là khoảng trống thật,
không phải đã giải quyết.

## 5. Việc CHƯA cần quyết ngay — chỉ để lộ diện, không phải cảnh báo khẩn

Toàn bộ mục 4 ở trên là **quan sát**, không phải khối chặn đường build 4
item hiện có (`tsk-62v`/`tsk-slq`/`tsk-5l2`/`tsk-g18`) — 4 item đó vẫn có
thể chạy được với scope hẹp đã chốt. Mục 4 chỉ nói: khi cụm mở rộng thêm
(nhiều capacity hơn, provider ngoài Claude thật sự vào production, hoặc
domain-2 lên multi-agent thật như mục 6 design đã nói), những góc này sẽ
bắt đầu đòi quyết định thật — nêu ra bây giờ để không bị bất ngờ.

## Câu hỏi mở (nếu anh muốn xử lý ngay, không bắt buộc)

1. Governance dữ liệu cross-provider (mục 4.1) — có cần 1 field
   `sensitiveData: true/false` trên capacity để chặn route sang ngoài
   Claude không, hay để sau khi thật sự có provider ngoài Claude?
2. Escalate-on-failure (mục 4.4) — `tsk-5l2` có nên tự có fallback-về-Claude
   khi backend rẻ trả rác, hay chấp nhận rủi ro thấp vì non-authoritative?
3. Có cần bổ sung `tsk-5l2`'s acceptance với 1 phép so sánh chất lượng (mục
   4.2) trước khi coi proof-of-concept là "chứng minh cơ chế hoạt động
   đúng" như mục tiêu ban đầu anh đặt ra?
