---
area: work-state
updated: 2026-07-16
sources: [phase-1-state-layer, phase-1-review-fixes, phase-2-routing-s1, phase-2-routing-s2, phase-3-compound-learning-s1, phase-3-compound-learning-s2, async-human-gate, stage-intake, stage-clarify]
decisions: [9ac6ca50, 0790031c, 451ca088, fd17309a, 55ad2f9f, feed7428, 1a80b4d3, 65c642a8, 9f6b52c8, 9a19eea5]
coverage: full
---

# Spec: Work-State (tầng quản việc của forgent)

Bộ nhớ công việc tự quản của forgent: nơi duy nhất ghi nhận "đang có việc gì, việc nào ở trạng thái nào, quyết định nào đã chốt". Người dùng: người vận hành repo và agent làm việc trong repo — cả hai thao tác qua đúng một cửa lệnh `fgos`. Sự thật nằm ở **nhật ký sự kiện** append-only được commit; **bản chiếu trạng thái** hiện hành chỉ là dẫn xuất, xóa đi dựng lại được nguyên vẹn.

## Entry Points & Triggers

- `fgos init` → khởi tạo kho work-state rỗng tại thư mục làm việc hiện hành (nhật ký rỗng + bản chiếu rỗng)
- `fgos submit "<mô tả tự do>" [--async|--unattended]` → **cửa vào công khai duy nhất** cho việc mới: khai một work item từ một câu mô tả văn xuôi duy nhất — id, title, kind, risk, tier đều TỰ SUY (không cần người submit tự đặt); `verify` nhận placeholder cố định chờ bổ sung sau; kết quả in ra bọc trong một phong bì máy-đọc chuẩn (xem "Phong bì output" dưới)
- `fgos move` → chuyển trạng thái một item, kèm `--expect` (kỳ vọng, chống ghi đè mù); cạnh từ-chối-đề-xuất bắt buộc `--reason`
- `fgos decision --text "..."` → ghi một quyết định vào nhật ký
- `fgos ask <id> --text "..."` → đưa một item vào chờ người (`awaiting-human`), kèm **câu hỏi** người phải quyết; item rời tập việc-sẵn-sàng cho tới khi được trả lời
- `fgos answer <id> --text "..."` → **trả lời** câu hỏi của một item đang chờ; ghi câu trả lời vào nhật ký rồi đưa item rời `awaiting-human` về `todo`, thành việc actionable trở lại
- `fgos list` → đọc danh sách item từ bản chiếu hiện hành; item đang `awaiting-human` hiện kèm câu hỏi của nó (không cần lệnh đọc riêng)
- `fgos ready` → đọc frontier: mọi item `todo` có toàn bộ deps đã `done` (đã duyệt/merge) VÀ đang ở stage `executing`, thứ tự đúng thứ tự khai — thao tác ĐỌC thuần; item `awaiting-human` hoặc còn ở stage `clarify` KHÔNG BAO GIỜ xuất hiện trong tập này
- `fgos discover <id>` → chạy context-discovery cho một item đang ở stage `clarify` — đọc gì trước "Giai đoạn Làm-rõ (stage clarify)" dưới
- `fgos rebuild` → dựng lại bản chiếu từ zero bằng cách phát lại toàn bộ nhật ký
- `fgos check [id]` → đọc bản chiếu, in cặp dự đoán/thực tế (outcome) đã gộp cho một item, hoặc cho mọi item đang có dữ liệu nếu không truyền id — thao tác ĐỌC thuần
- Bản ghi dự đoán/thực tế (outcome) không có verb ghi riêng qua cửa lệnh: nó được ghi từ bên trong vòng tự hành (xem spec Runner) — nửa dự đoán lúc nhận việc, nửa thực tế lúc việc tới trạng thái cuối (thành công lẫn thất bại)

## Data Dictionary

| # | Element | Meaning | Values | Required | Default |
|---|-------|---------|--------|----------|---------|
| 1 | id | Định danh bền của work item, dạng kebab-case chữ thường, mở đầu bằng chữ cái; không trùng | ví dụ `add-login-form` | yes | — |
| 2 | title | Tên việc người đọc hiểu; nhận mọi ký tự unicode | free text | yes | — |
| 3 | kind | Loại việc (trả lời "việc này thuộc loại gì" — câu 2 của sáu câu) | free text | yes | — |
| 4 | status | Trạng thái vòng đời; schema từ chối giá trị ngoài sáu trạng thái này (phạm trù `validation`) kể cả qua tầng thư viện | `todo` — chưa bắt đầu · `doing` — đang làm · `blocked` — kẹt vì lỗi/runner-park, hai chiều với todo/doing · `awaiting-human` — đậu chờ người quyết, mang một câu hỏi; runner/frontier KHÔNG BAO GIỜ pick; rời khi người trả lời (một lối vào từ `todo` hoặc `doing`, một lối ra về `todo`); đậu vô thời hạn, không timeout · `proposed` — goal-check đạt, đề xuất nằm trên nhánh chờ duyệt · `done` — đã nhận vào cây chính, TERMINAL: hai lối vào (`doing→done` thao tác tay, `proposed→done` duyệt đề xuất), không bao giờ ra | yes | `todo` |
| 5 | deps | Các id item phải xong trước; mọi id phải tồn tại, cấm tự trỏ; "epic" chỉ là một item thường được deps trỏ vào | danh sách id | yes (rỗng được) | `[]` |
| 6 | risk | Mức rủi ro của việc (câu 4) | free text | yes | — |
| 7 | refs | Đọc gì trước / chạm contract nào (câu 1 + 3) | danh sách tham chiếu | yes (rỗng được) | — |
| 8 | verify | Proof gì thì xong (câu 5) | free text | yes | — |
| 9 | learn | Link bài học để lại (câu 6 — chỗ cắm vòng học sau này) | text | no | — |
| 10 | tier | Hạng nặng-nhẹ của việc, để chọn model thực thi (bảng tier→model đến ở Phase 2 E3; tập giá trị provisional tới lúc đó) | `light` · `standard` · `heavy` | no | `standard` |
| 11 | mode | Chế độ submit đã dùng khi item được tạo qua `submit` — quy ước NGƯỜI-GỌI-NÀO-NÊN-CHẠY-DISCOVERY-TRƯỚC (agent đang sống hay runner tự hành), KHÔNG phải điều kiện mà code rẽ nhánh (xem R17) | `sync` (mặc định — người submit tương tác ngay) · `async` (người submit rời đi ngay) | no | `sync` (khi tạo qua `submit`; vắng mặt trên item tạo qua `add`) |
| 12 | stage | Giai đoạn vòng đời VĨ MÔ của item — chiều MỚI, song song với `status` (chiều vi mô, không đổi). Quyết định loại tác vụ/persona nào xử lý item ở thời điểm hiện tại; `status` vẫn áp dụng như cũ BÊN TRONG mỗi stage | `clarify` — chưa qua kiểm chất lượng thông tin, context-discovery còn phải chạy · `executing` — đã qua kiểm (hoặc chưa từng cần), sẵn sàng cho vòng thi công hiện có | no | `executing` khi vắng mặt (item tạo qua `add`, hoặc mọi item tạo trước tính năng này); `clarify` khi tạo qua `submit` |
| — | Sự kiện (không hiển thị) | Đơn vị ghi của nhật ký; mỗi thao tác ghi đúng MỘT sự kiện, số thứ tự tăng dần + thời điểm + phiên bản schema `v` (hiện hành: 2; sự kiện di sản không có `v` vẫn đọc được) | `work.add` — khai item (luôn mang tier tường minh từ v2) · `work.move` — chuyển trạng thái (from/to; cạnh từ-chối mang `reason`; cạnh vào chờ mang `ask`, cạnh rời chờ mang `answer`) · `decision` — quyết định kèm chữ · `work.outcome` — dự đoán HOẶC thực tế cho một item (mỗi nửa là một sự kiện riêng, cùng id; xem "Bản ghi kết quả" dưới) · `work.friction` — một lần thất bại tự-quy-tội tại park/halt (xem "Bản ghi friction" dưới) · `work.stage` — chuyển stage (from/to; có thể kèm `verify` khi rời clarify — xem "Giai đoạn Làm-rõ" dưới) · `work.discovery` — một lần context-discovery phán (xem "Bản ghi cổng discovery" dưới) | — | — |
| — | Phạm trù lỗi (không hiển thị) | Hợp đồng cho consumer: rẽ nhánh theo mã thoát, không theo thông điệp | `precondition` → mã 2 · `conflict` (kỳ vọng lệch) → mã 3 · `validation` → mã 4 · `corrupt-log` → mã 5 · bất ngờ → mã 1 · thành công → 0 | — | — |

### Bản ghi kết quả (outcome) — dự đoán / thực tế

Ngoài bảng trường của work item, một item có thể mang thêm một **bản ghi outcome**: hai nửa
đến ở hai thời điểm khác nhau trong đời của một lần chạy, gộp theo id — nửa đến sau CỘNG
THÊM vào bản ghi, không bao giờ đè mất nửa đã có.

| # | Nửa | Element | Meaning | Values | Ghi khi nào |
|---|-----|---------|---------|--------|-------------|
| O1 | dự đoán | tier dự kiến | Hạng nặng-nhẹ dự kiến của việc tại thời điểm nhận việc | `light` / `standard` / `heavy` | lúc nhận việc (claim) |
| O2 | dự đoán | số dep | Số lượng việc phụ thuộc của item tại thời điểm nhận việc | số nguyên ≥ 0 | lúc nhận việc |
| O3 | dự đoán | số lần nhận trước đó | Item này đã từng được nhận (chuyển sang "đang làm") bao nhiêu lần trước lần này | số nguyên ≥ 0 | lúc nhận việc |
| O4 | thực tế | kết cục (disposition) | Kết cục cuối của lần chạy | `proposed` — goal-check đạt, thành đề xuất chờ duyệt · `parked` — dừng lại theo lẽ thường (hết trần thử lại, hoặc lỗi không thử lại được), item bị đỗ · `halted` — cầu dao chấm-trượt-liên-tiếp cắt cả vòng chạy, item bị đỗ trước khi vòng dừng hẳn | lúc item tới trạng thái cuối |
| O5 | thực tế | đạt goal-check | Phép đo goal-check của chính vòng tự hành có đạt hay không | boolean | lúc item tới trạng thái cuối |
| O6 | thực tế | số lần thử | Số lần thử trong đúng lần chạy này | số nguyên ≥ 1 | lúc item tới trạng thái cuối |
| O7 | thực tế | lớp lỗi | Lớp lỗi (theo bảng phục hồi của spec Runner) nếu thất bại; rỗng nếu thành công | free text hoặc rỗng | lúc item tới trạng thái cuối |
| O8 | thực tế | số commit | Số commit mà item để lại trên nhánh đề xuất | số nguyên ≥ 0 | lúc item tới trạng thái cuối |
| O9 | thực tế | số lần nhận (đến giờ) | Item này đã từng được nhận bao nhiêu lần tính đến hết lần chạy này | số nguyên ≥ 0 | lúc item tới trạng thái cuối |

Item chưa từng chạy không mang bản ghi outcome nào — vắng mặt hoàn toàn, không phải bản ghi
rỗng. Nhật ký ghi trước khi bản ghi này tồn tại replay lại nguyên vẹn, không sinh ra outcome
nào cho item nào (tương thích ngược, theo luật tiến hóa schema R11).

### Bản ghi friction — kênh 2 của capture (Phase 3 Slice 2)

Mỗi lần một item kết thúc thất bại (`parked` hoặc `halted`) sinh thêm một **bản ghi
friction**, ghi cùng lúc với nửa thực tế của outcome, tại cùng một điểm trong runner.
Khác outcome (hai nửa gộp làm một theo id), friction là **chuỗi lần xảy ra** — mỗi
record CỘNG THÊM vào danh sách của id, không bao giờ gộp/đè lên record trước.

| # | Element | Meaning | Values | Ghi khi nào |
|---|---------|---------|--------|-------------|
| F1 | disposition | Kết cục của lần thất bại này | `parked` / `halted` | lúc item tới trạng thái cuối (park/halt) |
| F2 | lớp lỗi | Lớp lỗi theo bảng phục hồi (spec Runner) | free text | lúc item tới trạng thái cuối |
| F3 | lớp friction | Runner tự quy tội — 5 lớp cơ học suy ra từ lớp lỗi: `task-spec` · `context` · `environment` · `verification` · `state` | một trong 5 lớp | lúc item tới trạng thái cuối |
| F4 | số lần thử | Số lần thử của lần chạy dẫn tới thất bại này | số nguyên ≥ 1 | lúc item tới trạng thái cuối |
| F5 | chi tiết | Thông điệp lỗi cụ thể (vd nội dung goal-check miss) | free text | lúc item tới trạng thái cuối |

Item chưa từng thất bại không mang bản ghi friction nào — vắng mặt hoàn toàn (tương
thích ngược, R11). `fgos check` in mục friction: đếm theo lớp trên TOÀN BỘ record,
kèm tối đa 5 record gần nhất (không xả vô hạn); và nhắc mọi item đã tới trạng thái
cuối (`proposed`/`blocked`/`done`) mà chưa có nửa outcome thực tế — hai cảnh báo này
đọc từ view, không sự kiện mới nào sinh ra khi chạy `check` (vẫn là read thuần, D1).

Settlement dạng đầy đủ (kênh 1 của capture 2 kênh) dời sau, tới khi các stage
lifecycle (exploring-lock, PR review) tồn tại để làm điểm ghi (decision 719cbe3a).

### Bản ghi cổng-người (gate) — câu hỏi / câu trả lời

Một item từng đi qua cổng chờ-người mang thêm một **bản ghi cổng**: cặp câu hỏi/câu trả lời
đến ở hai thời điểm khác nhau, gộp theo id — hệt khuôn bản ghi outcome. Câu hỏi ghi lúc item
vào chờ; câu trả lời ghi lúc người trả lời; nửa đến sau CỘNG THÊM, không đè mất nửa đã có.

| # | Nửa | Element | Meaning | Values | Ghi khi nào |
|---|-----|---------|---------|--------|-------------|
| G1 | hỏi | câu hỏi (ask) | Điều người phải quyết trước khi việc đi tiếp (vd "OAuth hay mật khẩu?") — nhãn trạng thái đơn thuần không nói được "chờ gì" | free text (không rỗng) | lúc item vào `awaiting-human` |
| G2 | trả lời | câu trả lời (answer) | Quyết định của người; ghi xong thì item rời `awaiting-human` | free text (không rỗng) | lúc người trả lời |

Item chưa từng vào cổng chờ-người không mang bản ghi cổng nào — vắng mặt hoàn toàn, không phải
bản ghi rỗng. Item đang chờ có G1 mà G2 chưa tới (đang chờ trả lời). Nhật ký không có sự kiện
cổng nào replay lại không sinh bản ghi cổng nào (tương thích ngược, cùng khuôn R11/R13).

### Giai đoạn Làm-rõ (stage clarify)

Song song với `status` (vi mô, không đổi), mỗi item mang một chiều thứ hai —
`stage` — trả lời "loại tác vụ nào đang cần cho item này ngay lúc này". Hôm
nay có hai stage: `clarify` (chưa qua kiểm chất lượng thông tin) và
`executing` (đã qua, hoặc chưa từng cần qua). `status` vẫn vận hành y hệt
BÊN TRONG mỗi stage — một item ở stage `clarify` vẫn có thể là `todo` hay
`awaiting-human`, ý nghĩa của hai status đó không đổi.

Item vào stage `clarify` phải đi qua **context-discovery**: một phép phán
(gọi model thật, đọc toàn bộ item, không phải quy tắc cơ học) xem thông tin
đã đủ để bắt tay thi công chưa.

- **Đủ rõ** — item chuyển `clarify → executing`; MỘT sự kiện `work.stage`
  vừa đổi stage vừa gắn lại `verify` bằng một lệnh chạy được thật (đề xuất
  của model), thay cho placeholder cố định `submit` đã điền lúc tạo — không
  bao giờ để placeholder giả sống sót qua khỏi clarify.
- **Chưa đủ rõ** — item đậu vào `awaiting-human` (như mọi cổng chờ-người
  khác — xem "Bản ghi cổng-người" trên), mang đúng một câu hỏi cụ thể;
  người trả lời xong, item về `todo` (vẫn ở stage `clarify`), và
  context-discovery chạy lại — lặp tới khi đủ rõ. Không có cơ chế "quay lại"
  riêng; đây là hành vi tự nhiên của vòng lặp.
- **Phán không ra kết quả tin cậy được** (model lỗi/timeout/trả lời không
  đọc được) — KHÔNG BAO GIỜ tự cho qua: rơi về "chưa đủ rõ" với một câu hỏi
  mặc định cố định, y hệt nhánh chưa-đủ-rõ ở trên.

**Ai chạy context-discovery, khi nào:** hai điểm gọi cùng một phép phán —
(a) lệnh `fgos discover <id>` (gọi tay/agent đang sống, dùng khi người submit
còn ở đó — mode `sync`); (b) vòng tự hành, MỖI lần chạy, quét TOÀN BỘ item
đang ở stage `clarify` và status `todo` rồi tự chạy phán cho từng item —
BẤT KỂ giá trị `mode` mang gì, TRƯỚC khi giao bất kỳ việc thi công nào trong
cùng lượt chạy đó (xem spec Runner). Vòng tự hành là lưới đỡ: dù phiên sống
(mode `sync`) không kịp gọi `discover` — chết giữa chừng, hay người rời đi
không dùng `--async` — lượt chạy kế tiếp của vòng tự hành vẫn tự quét, không
item nào kẹt vô hình. `mode` chỉ là quy ước NGƯỜI-GỌI-NÀO-NÊN-LÀM-TRƯỚC,
không phải điều kiện mà code rẽ nhánh (R17).

### Bản ghi cổng discovery

Mỗi lần context-discovery phán (dù đủ rõ hay chưa) sinh thêm một **bản ghi
discovery**, ghi CẢ hai kết cục — cùng khuôn "cộng thêm không đè" với bản
ghi friction: mỗi lần phán là một lần xảy ra, APPEND vào danh sách của id,
không bao giờ gộp/đè lên lần trước.

| # | Element | Meaning | Values | Ghi khi nào |
|---|---------|---------|--------|-------------|
| C1 | đủ rõ | Kết quả phán của lần này | boolean | mỗi lần context-discovery chạy |
| C2 | câu hỏi | Điều cần người làm rõ (chỉ có khi chưa đủ rõ) | free text | khi đủ rõ = false |
| C3 | verify đề xuất | Lệnh proof thật model đề xuất (chỉ có khi đủ rõ) | free text | khi đủ rõ = true |

Item chưa từng qua context-discovery không mang bản ghi discovery nào — vắng
mặt hoàn toàn (tương thích ngược, R11).

### Phong bì output (envelope) — chuẩn máy-đọc của `submit`

`submit` in kết quả bọc trong một phong bì chuẩn thay vì in thẳng dữ liệu: bốn
trường `contract` (tên+phiên bản chuẩn phong bì), `generated_at` (thời điểm in),
`data_hash` (dấu vân tay của dữ liệu — bên đọc biết dữ liệu đổi chưa mà không
cần so từng trường), và `data` (dữ liệu thật, ở đây là work item vừa tạo). Đây
là hợp đồng máy-đọc đầu tiên của CLI này có code thật; các verb khác (`add`,
`list`...) chưa dùng phong bì này.

## Behaviors & Operations

### Khai việc (add) — bề mặt nội bộ

`add` không còn là cửa vào của câu chuyện public (đó là `submit`, per D9
stage-intake) — vẫn hoạt động nguyên vẹn cho test/tooling nội bộ, đòi người
gọi tự điền mọi trường (kể cả tự đặt id kebab-case), khác hẳn UX "nộp rồi đi"
của `submit`. Số phận cuối cùng (giữ/xóa) chưa quyết — xem backlog P22.

- **Blocked when:** thiếu trường bắt buộc, id sai dạng kebab-case, id trùng, dep trỏ id không tồn tại — tất cả trả phạm trù `validation` (mã 4), KHÔNG sự kiện nào được ghi.
- **What changes:** một sự kiện khai-item vào nhật ký, item xuất hiện trong bản chiếu ở `todo`.
- **Side effects:** không.
- **Afterwards:** người/agent thấy item trong `list`; clone khác thấy sau khi nhận commit chứa nhật ký.

### Nộp vấn đề tự do (submit)

- **Runs when:** người/agent gọi `fgos submit "<mô tả>" [--async|--unattended]` —
  song song với `add`, không thay thế; dùng khi người submit không muốn/không
  thể tự điền các trường tách rời của `add`.
- **Blocked when:** thiếu mô tả (không truyền văn bản nào) — `validation` (mã
  4), KHÔNG sự kiện nào được ghi. Không có điều kiện chặn nào khác — mọi mô tả
  không khớp từ khóa phân loại nào vẫn tạo item thành công (rơi về mặc định an
  toàn), đúng tinh thần "không bao giờ chặn vì không đoán được loại".
- **What changes:** một sự kiện khai-item (đúng loại `work.add` như `add`,
  không phải sự kiện mới) vào nhật ký. Các trường được suy tự động từ mô tả:
  - **title** — câu/dòng đầu tiên của mô tả, hoặc một đoạn cắt gọn nếu mô tả
    không có ranh giới câu tự nhiên.
  - **id** — sinh từ title, kèm hậu tố chống trùng; nếu trùng với id đã có
    (hai mô tả tương tự nhau), tự thử lại với hậu tố khác cho tới khi ra một
    id chưa dùng.
  - **tier, kind, risk** — suy bằng cách đếm các từ khóa rủi ro/loại-việc xuất
    hiện trong mô tả (quy tắc cơ học, không dùng model/AI) — không khớp từ
    khóa nào thì `tier`/`risk` về mặc định `standard`, `kind` về mặc định
    `task`. Luôn ghi đè được bằng một sửa (`move`/edit) sau đó.
  - **verify** — một giá trị placeholder cố định, đánh dấu "chưa xác định" —
    một stage sau bổ sung proof thật.
  - **mode** — `sync` nếu không truyền cờ; `async` nếu truyền `--async` hoặc
    `--unattended` (hai cờ cùng nghĩa). Chỉ được GHI lại ở bước này, chưa có
    hành vi nào khác đi kèm — không có gì tự động đậu chờ người ở bước submit,
    kể cả với `--async`.
  - item xuất hiện trong bản chiếu ở `todo` — y hệt `add`, ngay lập tức actionable
    nếu deps rỗng (mặc định của submit).
  - **stage** — luôn `clarify` (xem "Giai đoạn Làm-rõ" dưới); item từ `submit`
    KHÔNG BAO GIỜ xuất hiện trong `ready` cho tới khi context-discovery cho
    qua, dù deps đã rỗng.
- **Side effects:** không.
- **Afterwards:** kết quả in ra là work item vừa tạo, bọc trong phong bì máy-đọc
  (xem dưới); item xuất hiện trong `list` ngay (ở stage `clarify`); chỉ xuất
  hiện trong `ready` sau khi qua context-discovery.

### Chạy context-discovery (discover)

- **Runs when:** người/agent gọi `fgos discover <id>` cho một item đang ở
  stage `clarify` — điểm gọi tay/phiên-sống (mode `sync`); vòng tự hành cũng
  gọi đúng phép phán này cho mọi item clarify+todo mỗi lượt chạy (xem spec
  Runner) — cùng một hành vi, hai điểm gọi.
- **Blocked when:** item không tồn tại — `validation`. Không có điều kiện
  chặn nào khác — kể cả khi context-discovery chính nó không phán ra kết
  quả tin cậy (lỗi/timeout), item vẫn chuyển hợp lệ sang `awaiting-human`
  (xem dưới), không bao giờ crash/throw ra ngoài.
- **What changes:** một bản ghi discovery (xem dưới); rồi HOẶC một sự kiện
  đổi-stage `clarify → executing` (kèm `verify` thật) NẾU đủ rõ, HOẶC một
  sự kiện đổi-status sang `awaiting-human` (kèm câu hỏi) NẾU chưa đủ rõ.
- **Side effects:** một lời gọi model thật (không phải quy tắc cơ học).
- **Afterwards:** đủ rõ → item xuất hiện trong `ready` (nếu deps cũng đã
  xong) với `verify` thật, không còn placeholder; chưa đủ rõ → item xuất
  hiện trong `list` ở `awaiting-human` kèm câu hỏi, y hệt mọi cổng chờ-người
  khác — trả lời xong rồi gọi lại `discover` (hoặc để vòng tự hành tự quét)
  sẽ phán lại.

### Chuyển trạng thái (move)

- **Blocked when:** (a) cạnh chuyển không có trong bảng — `todo→doing`, `doing→done`, `doing→proposed`, `proposed→done`, `proposed→todo` (bắt buộc lý do), `todo/doing→blocked`, `blocked→todo/doing`, `todo/doing→awaiting-human` (bắt buộc câu hỏi), `awaiting-human→todo` (bắt buộc câu trả lời) là toàn bộ cạnh hợp lệ — trả `precondition` (mã 2); (a2) cạnh từ-chối `proposed→todo` thiếu/rỗng lý do, hoặc cạnh vào chờ thiếu/rỗng câu hỏi, hoặc cạnh rời chờ thiếu/rỗng câu trả lời — trả `validation` (mã 4); (b) trạng thái thực khác `--expect` — trả `conflict` (mã 3); (c) cờ thiếu giá trị hoặc rỗng (`--to` trống, `--expect ""`) — trả `validation` (mã 4), không bao giờ lọt sang phạm trù 2/3. Cả ba trường hợp KHÔNG ghi sự kiện nào.
- **What changes:** một sự kiện chuyển-trạng-thái (kèm from/to) vào nhật ký, rồi bản chiếu cập nhật — luôn theo thứ tự nhật-ký-trước, bản-chiếu-sau.
- **Side effects:** không.
- **Afterwards:** `done` là cửa một chiều ra: item đã done thì mọi lần move tiếp theo đều bị `precondition`. Item bị từ chối về `todo` mang lý do trong nhật ký, vào lại hàng chờ làm tiếp.

### Ghi quyết định (decision)

- **Blocked when:** thiếu nội dung chữ — `validation`.
- **What changes:** một sự kiện quyết-định vào nhật ký; quyết định đọc được lại từ bản chiếu sau replay.

### Đưa vào chờ người (ask)

- **Runs when:** người/agent gọi `fgos ask <id> --text "..."` để đậu một việc lại chờ người quyết.
- **Blocked when:** item không ở `todo`/`doing` (cạnh vào chờ không hợp lệ) — `precondition`; câu hỏi thiếu/rỗng — `validation`; trạng thái thực khác `--expect` — `conflict`. Không ghi sự kiện nào.
- **What changes:** một sự kiện chuyển-trạng-thái mang câu hỏi vào nhật ký; item sang `awaiting-human`, bản chiếu gộp câu hỏi vào bản ghi cổng của item (theo id).
- **Side effects:** không.
- **Afterwards:** `list` hiện item ở `awaiting-human` kèm câu hỏi; `ready` không còn liệt kê item; mọi việc khác vẫn chạy bình thường — cổng bất đồng bộ, không chặn tiến trình khác. Việc đậu vô thời hạn cho tới khi có người trả lời.

### Trả lời (answer)

- **Runs when:** người gọi `fgos answer <id> --text "..."` để trả lời câu hỏi của một việc đang chờ.
- **Blocked when:** item không ở `awaiting-human` (không có cạnh rời chờ từ trạng thái khác) — `precondition`; câu trả lời thiếu/rỗng — `validation`; trạng thái thực khác `--expect` — `conflict`. Không ghi sự kiện nào.
- **What changes:** một sự kiện chuyển-trạng-thái mang câu trả lời vào nhật ký; item về `todo`, bản chiếu gộp câu trả lời vào bản ghi cổng (cạnh câu hỏi đã có vẫn còn — cộng thêm, không đè).
- **Side effects:** không.
- **Afterwards:** item lại actionable — xuất hiện trong `ready` khi deps đủ điều kiện; bản ghi cổng giữ cả câu hỏi lẫn câu trả lời để tra sau.

### Ghi kết quả dự đoán/thực tế (outcome)

- **Runs when:** không qua verb CLI riêng — được ghi từ bên trong vòng tự hành (spec Runner): nửa dự đoán ngay khi item được nhận việc; nửa thực tế khi item tới trạng thái cuối, CẢ khi thành công lẫn khi thất bại.
- **Blocked when:** thiếu id — `validation`.
- **What changes:** một sự kiện outcome vào nhật ký cho MỖI nửa (hai sự kiện riêng biệt, cùng id, đến ở hai thời điểm khác nhau); bản chiếu gộp hai nửa theo id — nửa đến sau CỘNG THÊM vào nửa đã có, không bao giờ đè mất.
- **Side effects:** không.
- **Afterwards:** `fgos check` đọc được cả hai nửa cho item đó ngay khi chúng tồn tại; item chưa từng chạy hoàn toàn không xuất hiện trong `check`.

### Đọc kết quả (check)

- **Runs when:** người/agent gọi `fgos check [id]`.
- **Blocked when:** nhật ký hỏng → `corrupt-log`. Không bao giờ ghi gì — đọc thuần, cùng họ với `list`/`ready`.
- **What changes:** không gì.
- **Afterwards:** truyền id → in đúng một khối cho item đó, mỗi nửa (dự đoán/thực tế) in giá trị thật nếu đã có, hoặc thông báo "chưa có dữ liệu" nếu nửa đó chưa tới; không truyền id → in một khối cho mỗi item ĐANG có ít nhất một nửa outcome; kho/log không mang bản ghi outcome nào → in đúng một dòng "chưa có dữ liệu" — thành công, không phải lỗi.

### Dựng lại (rebuild) — thao tác phục hồi

- **Runs when:** người/agent gọi, đặc biệt khi bản chiếu mất hoặc nghi lệch so với nhật ký.
- **What changes:** bản chiếu được dựng lại từ zero bằng phát lại toàn bộ nhật ký — kết quả giống hệt bản chiếu trước đó (đã chứng minh bằng test đầu-cuối chạy lệnh thật: xóa bản chiếu → rebuild → so sánh sâu bằng nhau).
- **On failure:** nhật ký có dòng cuối dở dang (đứt giữa chừng khi ghi) → báo `corrupt-log` (mã 5) nói rõ lỗi, phần nguyên vẹn phía trước vẫn đọc được; hỏng ở GIỮA nhật ký là lỗi cứng, không tự sửa, không nuốt.

### Đọc (list / ready)

- **Blocked when:** nhật ký hỏng → `corrupt-log` (mã 5). Đọc không bao giờ ghi gì — chạy bao nhiêu lần nhật ký cũng không đổi một byte (có test so byte khóa).
- **ready:** trả danh sách việc sẵn-sàng dẫn xuất từ trạng thái (`todo` + mọi dep `done` thật + đang ở stage `executing`; dep đang `proposed`/`doing`/`blocked`/`awaiting-human` KHÔNG mở việc phụ thuộc), thứ tự đúng thứ tự khai việc; kho chưa khởi tạo → danh sách rỗng, thành công. Đầu ra máy-đọc-được. Item `awaiting-human` không lọt vào tập này vì chỉ trạng thái `todo` mới sẵn-sàng — cổng chờ-người được loại "miễn phí" bởi chính bộ lọc trạng thái, và một item có dep đang chờ-người cũng không được mở. Item còn ở stage `clarify` cũng không lọt vào tập này dù status là `todo` — "sẵn sàng" nghĩa là đã qua context-discovery, không chỉ đã hết dep.

## Actors & Access

| Capability | Người vận hành | Agent trong repo | Clone/máy khác |
|---|---|---|---|
| Mọi thao tác ghi (init/add/move/decision/ask/answer) | ✓ qua cửa lệnh duy nhất | ✓ qua cửa lệnh duy nhất | — (nhận qua commit) |
| Trả lời một cổng chờ-người (answer) | ✓ — người là bên quyết | ✓ về mặt cơ chế (cùng cửa lệnh); ai được phép trả lời cổng nào chưa phân quyền | — |
| Đọc (list) / rebuild | ✓ | ✓ | ✓ sau khi clone/pull |
| Ghi thẳng vào nhật ký hay bản chiếu không qua cửa | — cấm | — cấm | — cấm |

## Business Rules

- **R1.** Sự thật duy nhất là nhật ký sự kiện append-only, được commit; bản chiếu là dẫn xuất dựng lại được từ zero — không bao giờ là truth (per D3 / 451ca088; luật nền L3).
- **R2.** Mọi mutation đi qua đúng MỘT cửa; mỗi mutation để lại đúng một sự kiện (per D3).
- **R3.** Thứ tự ghi bất biến: sự kiện vào nhật ký TRƯỚC, bản chiếu cập nhật SAU; bản chiếu lệch thì rebuild là đường phục hồi (per D3).
- **R4.** Chuyển trạng thái chỉ theo bảng cạnh tường minh; `done` terminal: hai lối vào (thao tác tay / duyệt đề xuất), không lối ra (per D4 / fd17309a; mở rộng per D5 phase-2-routing / feed7428).
- **R5.** Ghi có kỳ vọng: trạng thái thực khác kỳ vọng → từ chối, không ghi đè mù (per D3).
- **R6.** Consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp (per luật L4 / 14ebeea9).
- **R7.** Schema item mang đủ chất liệu trả lời sáu câu hỏi harness: refs (đọc gì/contract), kind (loại), risk (rủi ro), verify (proof), learn (bài học) (per luật L5).
- **R8.** Deps phải trỏ id tồn tại, cấm tự trỏ; một loại item duy nhất, không cấp bậc entity (per D4 / D1).
- **R9.** Tầng này quản việc của chính forgent; không generic hóa cho consumer khác khi chưa tới lượt (per D1 / 9ac6ca50).
- **R10 (tiền đề có ngưỡng).** Một người ghi tại một thời điểm; khi nhiều agent ghi đồng thời thành tải chính, mở lại thiết kế store theo ngưỡng đã ghi trong luật L3 (per ae461c8b).
- **R12 (frontier dẫn xuất).** Việc-kế-tiếp là truy vấn dẫn xuất từ trạng thái, không bao giờ là danh sách tay; dep chỉ mở việc phụ thuộc khi thật sự `done` — đề xuất chưa duyệt không mở (per D5 phase-2-routing / luật R5 nền tảng).
- **R11 (tiến hóa schema).** Nhật ký đã commit bất khả xâm phạm — không bao giờ migration ghi đè; replay tương thích ngược có test khóa (bản ghi di sản thiếu trường nhận default khai báo, fixture nhật ký Phase 1 thật là chuẩn nghiệm thu); mỗi sự kiện mới mang phiên bản schema (per D7 phase-2-routing / feed7428).
- **R13 (bản ghi outcome, cộng thêm không đè).** Dự đoán và thực tế của cùng một item là hai sự kiện outcome riêng, gộp theo id ở bản chiếu; nửa đến sau CỘNG THÊM vào nửa đã có, không bao giờ đè mất nửa trước (per D2 phase-3-compound-learning / 1a80b4d3). Đây là một ca cụ thể của luật tiến hóa schema R11: cộng thêm, không migration, log cũ replay nguyên vẹn không sinh outcome nào.
- **R14 (cổng chờ-người, awaiting-human).** "Chờ người quyết" là một trạng thái RIÊNG, tách bạch khỏi `blocked` (kẹt vì lỗi/runner-park) — "việc đang chờ tôi" tra được sạch theo một status (per D1). Là MỘT trạng thái chung, không đẻ nhiều loại cổng (need-review/need-approval/…) khi chưa có consumer thật cần — nội dung câu hỏi/câu trả lời đã gánh phần "chờ gì" (per D3). Mỗi cổng mang một cặp câu hỏi/câu trả lời cụ thể, không chỉ nhãn: câu hỏi ghi lúc vào chờ, câu trả lời ghi lúc người trả lời (per D2). Đậu VÔ THỜI HẠN — không timeout, không hết-hạn, không đánh-thức tự động; người quay lại lúc nào trả lời lúc đó (per D4). Người trả lời qua một lệnh CLI; câu trả lời thành một sự kiện trong nhật ký, rồi item RỜI `awaiting-human` về `todo` và chạy tiếp (per D5). Câu hỏi của một cổng đang chờ đọc được qua `list` sẵn có — không cần surface đọc riêng (per D7). Tất cả per 65c642a8 (khóa exploring async-human-gate).
- **R15 (runner/frontier loại cổng chờ-người — ràng buộc cứng).** Bộ chọn việc-sẵn-sàng và runner KHÔNG BAO GIỜ pick một item `awaiting-human`; một item có dep đang `awaiting-human` cũng không được mở (dep chỉ mở khi thật `done`). Đây là tiêu chí nghiệm thu, không phải khuyến nghị: một việc chờ người mà runner vẫn pick thì phá cả ý nghĩa cổng (per D6 / 65c642a8). Là hệ quả trực tiếp của R12 (chỉ `todo` mới sẵn-sàng) áp cho trạng thái mới — không cần điều kiện lọc thêm, có test khóa cả hai chiều.
- **R16 (submit là cơ học, không bao giờ chặn).** Phân loại tier/kind/risk của `submit` chỉ đếm từ khóa, không gọi model/AI; mô tả không khớp từ khóa nào KHÔNG BAO GIỜ chặn tạo item — luôn rơi về mặc định an toàn, luôn ghi đè được sau (per D1/D5 stage-intake / 9f6b52c8).
- **R17 (mode là quy ước gọi, không phải điều kiện code).** Trường `mode` do `submit` ghi lại chế độ đã dùng khi tạo item; KHÔNG có đoạn code nào (submit, discover, hay vòng tự hành) đọc/rẽ nhánh theo giá trị của nó. Ý nghĩa của `mode` là quy ước NGƯỜI-GỌI-NÀO-NÊN-CHẠY-discover-TRƯỚC (per D6 stage-intake / 9f6b52c8, làm rõ tại D5/D13 stage-clarify / 9a19eea5): `sync` gợi ý phiên đang sống nên tự gọi `discover` ngay; `async` gợi ý không ai làm vậy, để vòng tự hành lo. Dù người gọi bỏ qua gợi ý này (gọi sai chiều, hoặc không gọi gì cả), R18 đảm bảo item vẫn được xử lý.
- **R18 (stage — chiều vĩ mô song song với status).** Mỗi item mang thêm một trường `stage` (`clarify`/`executing`), tách bạch khỏi `status` (vi mô, không đổi ở quyết định này): `stage` trả lời "loại tác vụ nào đang cần", `status` trả lời "việc đang ở đâu trong vòng đời của tác vụ đó". Item vào hệ qua `submit` bắt đầu ở `clarify`; qua `add` (hoặc bất kỳ item nào tạo trước tính năng này) mặc định `executing` (per D1/D8 stage-clarify / 9a19eea5).
- **R19 (vòng tự hành là lưới đỡ context-discovery, bất kể mode).** Mỗi lượt chạy, vòng tự hành quét TOÀN BỘ item đang `stage: clarify` VÀ `status: todo` — không phân biệt giá trị `mode` — và tự chạy context-discovery cho từng item, TRƯỚC khi giao bất kỳ việc thi công executing nào trong cùng lượt. Không bao giờ chạm item đang `awaiting-human` (hệ quả trực tiếp của R15, áp dụng cho cả sweep này). Đảm bảo không item nào kẹt vô hình dù phiên sống đã chết giữa chừng hoặc người submit bỏ đi không gọi `discover` (per D13 stage-clarify / 9a19eea5).

## Edge Cases Settled

- Tiêu đề unicode (tiếng Việt, CJK, emoji) đi qua toàn tuyến ghi-đọc-rebuild nguyên vẹn (test đầu-cuối).
- Kỳ vọng cũ dùng lại lần hai (double-apply) bị chặn ở `conflict`, nhật ký không phình (test đầu-cuối).
- Dòng cuối nhật ký đứt giữa chừng: phát hiện to và rõ, phần trước còn nguyên; đây là trường hợp DUY NHẤT được tha thứ khi đọc — hỏng giữa nhật ký là lỗi cứng.
- Id trùng khi khai: từ chối, không sự kiện thừa.
- Cờ thiếu giá trị/rỗng ở `move` được phân loại `validation` (mã 4), không nhầm sang `precondition`/`conflict` — chốt từ review, có test khóa (phase-1-review-fixes).
- Nhật ký di sản (trước v2, thiếu tier/v) replay nguyên vẹn với default; nhật ký trộn cũ/mới cùng kết quả — test khóa bằng fixture sinh từ binary Phase 1 thật (`test/fixtures/phase1-events.jsonl`).
- View lệch-còn-tồn-tại (khác view mất): `rebuild` ghi đè toàn phần từ log, có test khóa đúng chế độ hỏng này; đọc không bao giờ tự sửa file view.
- Item được nhận rồi đóng ở hai thời điểm khác nhau (dự đoán lúc nhận, thực tế lúc đóng): cả hai nửa còn sống trong bản chiếu, không nửa nào bị mất — test khóa.
- Log không mang bản ghi outcome nào: bản chiếu không có key outcome (vắng mặt, không phải rỗng) — hành vi so-khớp bản chiếu cũ giữ nguyên (test tương thích ngược).
- Item `awaiting-human` không bao giờ vào tập việc-sẵn-sàng, và item có dep đang `awaiting-human` không được mở — cả hai có test khóa (không cần sửa bộ lọc frontier: bộ lọc `todo` sẵn có đã loại).
- Cạnh vào chờ thiếu câu hỏi / cạnh rời chờ thiếu câu trả lời bị chặn ở `validation` — cùng khuôn cạnh từ-chối `proposed→todo` thiếu lý do; câu hỏi/câu trả lời bị bỏ qua (không vào payload) trên mọi cạnh khác, hệt như `reason`.
- Log không mang sự kiện cổng nào: bản chiếu không có key bản-ghi-cổng (vắng mặt, không phải rỗng) — tương thích ngược, cùng khuôn bản ghi outcome.
- Hai lần `submit` cùng một mô tả (cùng title suy ra): id lần hai tự khác id lần đầu — thử lại với hậu tố dài hơn cho tới khi hết trùng, cả hai item cùng tồn tại, không lỗi "id trùng".
- `submit` với mô tả không khớp từ khóa phân loại nào: vẫn tạo item thành công, `tier`/`risk` về mặc định `standard`, `kind` về mặc định `task` — không lỗi, không chặn.
- Context-discovery phán đủ rõ: item chuyển thẳng `clarify → executing` MANG THEO verify thật trong đúng một sự kiện — không có khoảng hở nào item ở executing mà verify còn placeholder giả.
- Context-discovery phán chưa đủ rõ nhiều lần liên tiếp trên cùng item (người trả lời rồi vẫn chưa đủ): mỗi lần phán một bản ghi discovery riêng, tất cả còn sống — không lần nào bị mất; vòng lặp không có trần cố định (con người luôn là bên gate mỗi lượt lặp).
- Model gọi cho context-discovery lỗi/timeout/trả lời không đọc được: KHÔNG BAO GIỜ crash vòng tự hành hay lệnh `discover` — luôn rơi về "chưa đủ rõ" với câu hỏi mặc định cố định, item vẫn actionable (ở `awaiting-human`, không kẹt vô hình).
- Item tạo qua `add` không mang field `stage`: đọc ra `executing` (mặc định lazy), xuất hiện trong `ready` ngay như hôm nay — hành vi `add`/legacy không đổi một byte.

## Open Gaps

- Bản ghi thực tế (outcome) chưa có trường "thời lượng chạy" — nếu cần, đây là một mở rộng schema cộng thêm mới, chưa quyết (nêu lúc validate slice 1 của phase-3-compound-learning).
- Cổng có-phân-loại (typed gates: need-review / need-approval) — vẫn cố ý gộp về một `awaiting-human` chung; thêm nhãn loại chỉ khi có consumer thật cần (per D3, deferred). Riêng nhu cầu "cần làm rõ trước khi thi công" đã giải qua chiều `stage` (clarify/executing) thay vì một loại cổng mới — xem "Giai đoạn Làm-rõ".
- Stage `planning` (chia-việc, sinh item con) chưa tồn tại — `clarify → executing` là cạnh duy nhất hôm nay; item con và quan hệ `parent`/lineage chưa mô hình hóa (deferred, xem backlog P16).
- Timeout / nhắc-nhở / đánh-thức khi người vắng lâu — cố ý không làm; đậu vô thời hạn (per D4, deferred).
- Phân quyền / nhiều người / giao việc: ai được trả lời cổng nào — chưa mô hình hóa (deferred).

## Visuals

Not applicable — không có màn hình.

## Pointers (implementation)

- `bin/fgos.mjs` — CLI một cửa, bảng EXIT_CODES, resolve `.fgos/` từ cwd
- `src/state/store.mjs` — chủ ghi duy nhất (append event → update view); facade lỗi: EXIT_CODES + categoryOf + re-export 4 error class; STATUSES sống ở work.mjs (fsm re-export); `addOutcome` — cửa ghi outcome (mẫu `addDecision`), gọi trực tiếp từ runner (không qua verb CLI); `addFriction` — cửa ghi friction (mẫu giống `addOutcome`), cũng gọi trực tiếp từ runner; `moveWork` chuyển tiếp `ask`/`answer` cho `transitionWork`; `putInAwaiting`/`answerAwaiting` — hai verb mỏng đưa-vào-chờ / trả-lời (append event chuyển-trạng-thái mang câu hỏi/câu trả lời rồi refresh view); `moveStage` — cửa ghi đổi-stage (mẫu `moveWork`, một tầng phía trên), chuyển tiếp `transitionStage`; `addDiscovery` — cửa ghi bản ghi discovery (mẫu `addFriction`)
- `src/state/events.mjs` — append/read JSONL `.fgos/events.jsonl` (seq + ts ISO, path tường minh), phát hiện corrupt tail
- `src/state/fsm.mjs` — bảng TRANSITIONS + precondition + CAS, thuần (chiều `status`, KHÔNG đổi bởi stage-clarify); cạnh `todo/doing→awaiting-human` bắt buộc `ask`, cạnh `awaiting-human→todo` bắt buộc `answer` (cùng cơ chế `reason`-trên-`proposed→todo`), giá trị trim vào `payload.ask`/`payload.answer`
- `src/state/stage.mjs` — bảng chuyển-stage + precondition + CAS, thuần, mẫu hệt `fsm.mjs` một tầng phía trên (chiều `stage`); hôm nay đúng một cạnh hợp lệ `clarify → executing`; `expectedStage` CAS chống đua giữa phiên sống và vòng tự hành cùng phán một item
- `src/state/work.mjs` — schema + validate (ID_PATTERN kebab-case); STATUSES gồm `awaiting-human`; STAGES = `clarify`/`executing`, field `stage` optional (đọc lazy `?? 'executing'` khi vắng mặt, không có trong DEFAULTS)
- `src/state/replay.mjs` — fold events → view, thuần; case `work.outcome` gộp theo id vào `view.outcomes` (key lazy, cộng thêm không đè); case `work.friction` APPEND theo id vào `view.frictions` (key lazy, mảng — mỗi record một lần xảy ra, không gộp/không đè); case `work.move` mang `ask`/`answer` gộp theo id vào `view.gates` (key lazy có bảo vệ, cộng thêm không đè); case `work.stage` set `item.stage` (và `item.verify` khi payload mang verify — một sự kiện làm cả hai); case `work.discovery` APPEND theo id vào `view.discovery` (key lazy, mảng, cùng khuôn `view.frictions`)
- `src/state/frontier.mjs` — bộ lọc `status === 'todo'` (đã loại `awaiting-human`) VÀ `(stage ?? 'executing') === 'executing'` (đã loại item clarify) khỏi ready set
- `src/intake/discovery.mjs` — Use-case: `judgeDiscovery` (gọi model thật qua `resolveExecutorCommand`/`modelForTier` của `dispatch.mjs`, fail-safe try/catch bao trọn mọi lỗi spawn/timeout/parse về `{clear:false, question:...}` mặc định, không bao giờ throw); `resolveDiscovery` — hàm chung DUY NHẤT cho cả verb `discover` và vòng tự hành: đọc item, gọi judgeDiscovery, ghi bản ghi discovery LUÔN, rồi `moveStage`(đủ rõ, kèm verify thật)hoặc `putInAwaiting`(chưa đủ rõ, kèm câu hỏi)
- `bin/fgos.mjs` — verb `check`: đọc `listWork(dir).outcomes`, in predicted-vs-actual; cộng thêm mục friction (đọc `view.frictions`, đếm theo lớp + cap 5 record gần nhất) và nhắc item trạng thái cuối thiếu outcome — cả hai đều read-only, không sự kiện mới; verb `ask`/`answer` gọi `putInAwaiting`/`answerAwaiting`; `list` mang `view.gates` (câu hỏi hiện ra không cần formatter mới); verb `submit` — gọi `classify.mjs` (deriveTitle/classify/generateId) + `envelope.mjs` (wrapEnvelope) rồi `addWork` sẵn có, KHÔNG cửa ghi mới, gắn `stage:'clarify'`; verb `discover` — gọi thẳng `resolveDiscovery`
- `src/runner/loop.mjs` — `runOnce`: NGAY SAU startupReap, TRƯỚC vòng dispatch executing, quét mọi item `stage==='clarify' && status==='todo'` (không đọc `item.mode`) và gọi `resolveDiscovery` cho từng item — lưới đỡ R19
- `src/intake/classify.mjs` — thuần, không import store.mjs: `deriveTitle` (cắt câu/dòng đầu hoặc N ký tự), `classify` (bảng từ khóa → tier/kind/risk, mặc định standard/task khi không khớp), `generateId` (slug + hậu tố hash base36 adaptive 3-8 ký tự, thử lại khi trùng)
- `src/state/envelope.mjs` — thuần: `wrapEnvelope(data)` → `{contract:'fgos.v1', generated_at, data_hash (sha256 hex của data), data}`
- `.fgos/events.jsonl` (committed, truth) · `.fgos/state.json` (gitignored, view D4)
- Test: `npm test` (353 test; e2e tại `test/e2e/rebuild-determinism.test.mjs` + `test/e2e/runner-loop.test.mjs` — bao gồm 3 kịch bản stage-clarify (verdict pass/unclear/rác) chạy qua binary thật; round-trip cổng chờ-người tại `test/state/awaiting.test.mjs` + e2e CLI tại `test/cli/fgos.test.mjs` bao gồm `submit`/`discover`; unit tại `test/intake/{classify,discovery}.test.mjs` + `test/state/{envelope,stage}.test.mjs`)
