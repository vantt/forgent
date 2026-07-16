---
area: work-state
updated: 2026-07-16
sources: [phase-1-state-layer, phase-1-review-fixes, phase-2-routing-s1, phase-2-routing-s2, phase-3-compound-learning-s1, phase-3-compound-learning-s2, phase-3-compound-learning-s3-closeout, async-human-gate, stage-intake, stage-clarify, stage-decompose-s1]
decisions: [9ac6ca50, 0790031c, 451ca088, fd17309a, 55ad2f9f, feed7428, 1a80b4d3, 65c642a8, 9f6b52c8, 9a19eea5, 96a65365, a7c099af, 43f257ae, 44936500, e1218b22]
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
- `fgos ready` → đọc frontier: mọi item `todo` có toàn bộ deps đã `done` (đã duyệt/merge), đang ở stage `executing`, VÀ không còn hậu duệ nào (qua `parent`) dang dở, thứ tự đúng thứ tự khai — thao tác ĐỌC thuần; item `awaiting-human`, còn ở stage `clarify`/`decompose`, hoặc còn con dang dở KHÔNG BAO GIỜ xuất hiện trong tập này
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
| 12 | stage | Giai đoạn vòng đời VĨ MÔ của item — chiều MỚI, song song với `status` (chiều vi mô, không đổi). Quyết định loại tác vụ/persona nào xử lý item ở thời điểm hiện tại; `status` vẫn áp dụng như cũ BÊN TRONG mỗi stage | `clarify` — chưa qua kiểm chất lượng thông tin, context-discovery còn phải chạy · `decompose` — đã qua clarify, đang chờ/qua phán chia-việc (làm giàu ngữ cảnh + phân rã thành con, hoặc pass-through nếu không cần chia) trước khi vào executing · `executing` — đã qua kiểm và qua chia-việc (hoặc chưa từng cần cả hai), sẵn sàng cho vòng thi công hiện có | no | `executing` khi vắng mặt (item tạo qua `add`, hoặc mọi item tạo trước tính năng này); `clarify` khi tạo qua `submit`. Cạnh `clarify → executing` trực tiếp vẫn hợp lệ trong bảng chuyển-stage (log di sản) nhưng không còn caller nào nhắm tới kể từ khi `decompose` chèn vào giữa — dormant, ghi nhận trung thực (xem "Giai đoạn Chia-việc" dưới) |
| 13 | parent | Lineage: id của item GỐC mà item này là hậu duệ — quan hệ HOÀN TOÀN TÁCH BẠCH khỏi `deps` (chặn); chỉ sinh ra qua phán chia-việc, không phải trường người tự điền qua `add`/`submit` | id của một work item đã tồn tại, hoặc vắng mặt | no | vắng mặt (item gốc, hoặc mọi item tạo trước tính năng chia-việc) |
| — | Sự kiện (không hiển thị) | Đơn vị ghi của nhật ký; mỗi thao tác ghi đúng MỘT sự kiện, số thứ tự tăng dần + thời điểm + phiên bản schema `v` (hiện hành: 2; sự kiện di sản không có `v` vẫn đọc được) | `work.add` — khai item (luôn mang tier tường minh từ v2) · `work.move` — chuyển trạng thái (from/to; cạnh từ-chối mang `reason`; cạnh vào chờ mang `ask`, cạnh rời chờ mang `answer`; mọi ngã-ngũ có thể mang thêm `actor` tùy chọn — xem "Bản ghi settlement" dưới; ngã-ngũ vào `done` cũng tự mang thêm một bản ghi học — xem "Bài học lúc đóng" dưới) · `decision` — quyết định kèm chữ · `work.outcome` — dự đoán HOẶC thực tế cho một item (mỗi nửa là một sự kiện riêng, cùng id; xem "Bản ghi kết quả" dưới) · `work.friction` — một lần thất bại tự-quy-tội tại park/halt (xem "Bản ghi friction" dưới) · `work.stage` — chuyển stage (from/to; có thể kèm `verify` khi rời clarify — xem "Giai đoạn Làm-rõ" dưới; ngã-ngũ rời clarify cũng có thể mang `actor` tùy chọn) · `work.discovery` — một lần context-discovery phán (xem "Bản ghi cổng discovery" dưới) | — | — |
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

### Bản ghi settlement — kênh 1 của capture 2 kênh (Phase 3 S3-closeout)

Mỗi lần một item đi qua một **ngã-ngũ** — một điểm quyết-xong cụ thể trong
vòng đời của nó — sinh thêm một **bản ghi settlement**, cùng khuôn "cộng thêm
không đè" với friction/discovery: mỗi lần ngã-ngũ là một lần xảy ra, APPEND
vào danh sách của id, không bao giờ gộp/đè lên lần trước.

| # | Element | Meaning | Values | Ghi khi nào |
|---|---------|---------|--------|-------------|
| S1 | loại ngã-ngũ (kind) | Loại điểm quyết-xong | `clarify-pass` — context-discovery cho qua, item RỜI stage `clarify` (đích hôm nay là `decompose`; log di sản đích thẳng `executing` vẫn ngã-ngũ y hệt) · `answer` — người trả lời một câu hỏi đang chờ · `close` — item tới `done` (qua cả hai lối vào) | lúc chính ngã-ngũ đó xảy ra |
| S2 | actor | Ai/cái gì đã ngã-ngũ | `runner` — vòng tự hành tự động (quét làm-rõ, nhận việc, đề xuất, đỗ) · `session` — phiên đang sống gọi tay context-discovery · `human` — người qua lệnh CLI (`move`, `answer`) · vắng mặt (rỗng) — ngã-ngũ không kèm actor (nhật ký cũ hơn tính năng này, hoặc lời gọi không khai) | lúc ngã-ngũ xảy ra, tùy chọn |
| S3 | chi tiết | Nội dung đi kèm ngã-ngũ này — verify thật (clarify-pass), câu trả lời (answer), hoặc rỗng (close) | free text hoặc rỗng | lúc ngã-ngũ xảy ra |

Bản ghi settlement không sinh event mới: nó là một **bề mặt đọc dẫn xuất** từ
ba ngã-ngũ đã có sẵn trong nhật ký — không thêm một loại sự kiện "settlement"
riêng, tránh ghi-đôi cùng một sự thật (nguyên tắc sự-thật-một-nguồn). `actor`
là trường tùy chọn cộng-thêm trên chính ngã-ngũ đó (`work.move`/`work.stage`)
— item chưa từng mang actor (nhật ký cũ) vẫn fold bình thường, chỉ với actor
rỗng.

**Bảo vệ tương thích ngược:** ngã-ngũ `answer`/`close` chỉ sinh bản ghi
settlement khi sự kiện gốc mang phiên bản schema hiện hành — một sự kiện nhật
ký thật sự tiền-phiên-bản (trước khi khái niệm phiên bản schema tồn tại) giữ
nguyên hình dạng bản chiếu lịch sử của nó, không tự nhiên "mọc thêm" một bản
ghi settlement mà nó chưa từng có (cùng luật tiến hóa schema R11).

Item chưa từng qua ngã-ngũ nào không mang bản ghi settlement — vắng mặt hoàn
toàn (tương thích ngược, R11). `fgos check` in mục settlement: đếm theo
kind+actor trên TOÀN BỘ record, kèm tối đa 5 record gần nhất (cùng cap-5 của
friction) — đọc từ view, không sự kiện mới nào sinh ra khi chạy `check`.

### Bài học lúc đóng — câu-6 tự động (Phase 3 S3-closeout)

Đúng lúc một item tới `done` — qua BẤT KỲ lối vào nào (thao tác tay
`doing→done`, hoặc duyệt đề xuất `proposed→done`) — hệ thống tự động soạn
thêm một **bản ghi học**, trả lời câu-6 của sáu câu hỏi harness ("learning gì
để lại?"). Soạn cơ học hoàn toàn từ dữ liệu item đã tích lũy — không có phán
xét bên ngoài, không gọi model, không spawn — và không bao giờ chặn việc đóng
item nếu soạn lỗi (best-effort, cùng tinh thần fail-safe của context-discovery).

| # | Element | Meaning | Values | Ghi khi nào |
|---|---------|---------|--------|-------------|
| L1 | kết cục (outcome) | Nửa thực tế của bản ghi kết quả tại thời điểm đóng — kết cục/số lần thử/lớp lỗi | object, hoặc rỗng nếu item chưa từng chạy | lúc item tới `done` |
| L2 | friction theo lớp | Đếm các bản ghi friction của item, theo lớp | map lớp→số lượng, rỗng nếu item chưa từng thất bại | lúc item tới `done` |
| L3 | settlement theo loại/actor | Đếm các bản ghi settlement của item — kể cả chính ngã-ngũ đóng vừa xảy ra — theo cặp loại+actor | map loại/actor→số lượng | lúc item tới `done` |

Item đóng mà KHÔNG có outcome/friction/settlement nào trước đó vẫn nhận một
bản ghi học tối thiểu nhưng thật — không nổ, không im lặng bỏ qua. Ngược lại,
soạn bài học không bao giờ là điều kiện chặn đóng item: nếu việc soạn lỗi,
item vẫn đóng thành công, chỉ bản ghi học bị bỏ qua lần đó.

Item chưa từng đóng không mang bản ghi học nào — vắng mặt hoàn toàn (tương
thích ngược, R11). `fgos check` in mục học: mỗi item đã đóng một dòng tóm tắt
kết cục + friction + settlement của nó, kèm tối đa 5 record gần nhất.

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
nay có ba stage: `clarify` (chưa qua kiểm chất lượng thông tin), `decompose`
(đã qua clarify, đang chờ/qua phán chia-việc — xem "Giai đoạn Chia-việc"
dưới), và `executing` (đã qua cả hai, hoặc chưa từng cần qua). `status` vẫn
vận hành y hệt BÊN TRONG mỗi stage — một item ở stage `clarify` vẫn có thể là
`todo` hay `awaiting-human`, ý nghĩa của hai status đó không đổi.

Item vào stage `clarify` phải đi qua **context-discovery**: một phép phán
(gọi model thật, đọc toàn bộ item, không phải quy tắc cơ học) xem thông tin
đã đủ để bắt tay thi công chưa.

- **Đủ rõ** — item chuyển `clarify → decompose` (không thẳng `executing` —
  giai đoạn chia-việc chèn ở giữa, xem "Giai đoạn Chia-việc" dưới); MỘT sự
  kiện `work.stage` vừa đổi stage vừa gắn lại `verify` bằng một lệnh chạy
  được thật (đề xuất của model), thay cho placeholder cố định `submit` đã
  điền lúc tạo — không bao giờ để placeholder giả sống sót qua khỏi clarify.
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

### Giai đoạn Chia-việc (stage decompose)

Mọi item RỜI stage `clarify` (đủ rõ) không còn đi thẳng sang `executing` —
giữa hai stage đó có thêm một giai đoạn thứ ba, `decompose`: item đã qua kiểm
chất lượng thông tin nhưng còn phải qua đúng một phép phán chia-việc trước
khi thi công. Cạnh `clarify → executing` trực tiếp vẫn còn hợp lệ trong bảng
chuyển-stage (log di sản chưa từng qua tính năng này đọc lại đúng), nhưng
không caller nào nhắm tới cạnh đó nữa kể từ khi `decompose` chèn vào giữa.

Item vào stage `decompose` đi qua **phán chia-việc**: một phép phán (gọi
model thật, đọc toàn bộ item, không phải quy tắc cơ học) xem item có cần
tách thành các việc con độc lập hay không.

- **Pass-through** (item đơn giản, hoặc không có gì để chia) — item chuyển
  thẳng `decompose → executing`, GIỮ NGUYÊN `verify` đã gắn từ lúc rời
  `clarify` — không có bước gắn lại verify riêng ở đây.
- **Chia (decompose)** — phán sinh ra n ≥ 1 item con ĐỘC LẬP, mỗi con mang:
  field `parent` trỏ về item gốc (lineage — xem Data Dictionary #13), `deps`
  giữa các con nếu phán đề xuất (dùng nghĩa `deps` sẵn có, không phải trường
  mới), và một `verify` THẬT — con bỏ qua clarify nên chính phán chia-việc là
  nơi duy nhất sản xuất verify đó, không bao giờ để lại placeholder. Sinh đủ
  con xong, gốc chuyển `decompose → executing` ngay — gốc KHÔNG tự động
  `done`; nó chỉ dispatch-được khi mọi con đã `done` (xem bộ lọc frontier
  lineage dưới).
- **Cần người quyết (need-human)** — rơi vào cổng có điều kiện khi (a) phán
  tự báo mơ hồ không tách được rành mạch, hoặc (b) item gốc mang risk `heavy`
  (ngưỡng risk cao ánh xạ thẳng vào giá trị risk sẵn có từ classify). Item đậu
  `awaiting-human` (như mọi cổng chờ-người khác) mang một **đề xuất chia**
  (danh sách con + deps dự kiến) làm câu hỏi — CHƯA ghi con nào vào queue.
  Người trả lời xong, item về `todo` (vẫn ở stage `decompose`), phán chia-việc
  chạy lại từ đầu ở lượt quét sau (không giữ lại đề xuất cũ, cùng khuôn lặp
  của clarify).
- **Phán không ra kết quả tin cậy được** (model lỗi/timeout/trả lời không đọc
  được), HOẶC verdict chia sinh ra ít nhất một con THIẾU verify thật — CẢ HAI
  đều là verdict KHÔNG HỢP LỆ: item ở nguyên trạng thái/stage hiện tại, không
  con nào được ghi, không pass-through ngầm; lượt quét sau thử lại (fail-safe,
  không bao giờ throw, mẫu hệt context-discovery).

**Ai chạy phán chia-việc, khi nào:** hai điểm gọi cùng một phép phán — (a)
lệnh `fgos discover <id>` khi item đang ở stage `decompose` (gọi tay/phiên
sống, mode `sync` — cùng verb, dispatch theo stage hiện tại của item); (b)
vòng tự hành, MỖI lần chạy, NGAY SAU quét làm-rõ và TRƯỚC khi giao việc thi
công, quét TOÀN BỘ item đang `stage: decompose` và `status: todo` rồi tự chạy
phán cho từng item (xem spec Runner) — cùng lưới đỡ như clarify: dù phiên
sống chết giữa chừng, lượt chạy kế tiếp của vòng tự hành vẫn tự quét.

**Lineage (`parent`) tách bạch khỏi `deps`:** `parent` trả lời "item này là
hậu duệ của gốc nào", `deps` trả lời "việc nào phải xong trước việc này" —
hai quan hệ không bao giờ trộn; con của một lần chia-việc TUYỆT ĐỐI KHÔNG bao
giờ được ghi vào `deps` của gốc. Bộ lọc frontier (tập việc sẵn-sàng) chặn một
item gốc khi bất kỳ hậu duệ nào của nó (dẫn xuất qua chuỗi `parent`, đệ quy
xuống mọi tầng) chưa `done` — chặn này DẪN XUẤT thuần từ `parent`, không thêm
cơ chế mới, không đụng `deps`. Khi hậu duệ cuối cùng đóng, gốc tự nhiên lọt
frontier ở lượt kế tiếp như một item thường: KHÔNG có bước "đóng bộ" ghi
riêng — `verify` của chính gốc (mang từ lúc rời `clarify`) đóng vai trò phép
kiểm tích hợp cho toàn bộ hậu duệ, và gốc đi hết đường thường `todo →
doing → proposed → done` (duyệt/merge) như mọi item khác. Một con bị `blocked`
hoặc đỗ giữa chừng không sinh ra một trạng thái "bộ khẩn" riêng — nó dùng
đúng cơ chế `blocked`/friction sẵn có như mọi item; gốc đơn giản vẫn bị chặn
dispatch cho tới khi con đó (và mọi hậu duệ khác) thật sự `done`.

Item được tạo trước tính năng chia-việc, hoặc tạo qua `add`, không mang
`parent` — vắng mặt hoàn toàn, không lọt vào bộ lọc lineage (tương thích
ngược, R11).

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

### Chạy context-discovery / phán chia-việc (discover)

- **Runs when:** người/agent gọi `fgos discover <id>` — điểm gọi tay/phiên-
  sống (mode `sync`); verb dispatch theo stage HIỆN TẠI của item: item ở
  stage `clarify` chạy context-discovery, item ở stage `decompose` chạy phán
  chia-việc (xem "Giai đoạn Chia-việc" dưới) — cùng một verb, hai phép phán
  khác nhau theo đúng giai đoạn item đang đứng. Vòng tự hành cũng gọi đúng
  hai phép phán này cho mọi item tương ứng mỗi lượt chạy (xem spec Runner) —
  cùng hành vi, khác điểm gọi.
- **Blocked when:** item không tồn tại — `validation`. Không có điều kiện
  chặn nào khác — kể cả khi phép phán chính nó không ra kết quả tin cậy
  (lỗi/timeout), item vẫn chuyển hợp lệ sang `awaiting-human` (context-
  discovery) hoặc ở nguyên trạng thái/stage hiện tại (phán chia-việc — xem
  dưới), không bao giờ crash/throw ra ngoài.
- **What changes:** ở stage `clarify`: một bản ghi discovery (xem trên); rồi
  HOẶC một sự kiện đổi-stage `clarify → decompose` (kèm `verify` thật) NẾU đủ
  rõ, HOẶC một sự kiện đổi-status sang `awaiting-human` (kèm câu hỏi) NẾU
  chưa đủ rõ. Ở stage `decompose`: HOẶC một sự kiện đổi-stage `decompose →
  executing` (pass-through hoặc sau khi sinh đủ con), HOẶC các sự kiện khai-
  con (verdict chia), HOẶC một sự kiện đổi-status sang `awaiting-human` (cần
  người quyết), HOẶC không gì cả nếu verdict không hợp lệ (xem "Giai đoạn
  Chia-việc" dưới).
- **Side effects:** một lời gọi model thật (không phải quy tắc cơ học).
- **Afterwards:** ở clarify, đủ rõ → item sang stage `decompose` (chưa lọt
  `ready` — còn một giai đoạn nữa phải qua) với `verify` thật, không còn
  placeholder; chưa đủ rõ → item xuất hiện trong `list` ở `awaiting-human`
  kèm câu hỏi, y hệt mọi cổng chờ-người khác. Ở decompose, pass-through hoặc
  chia xong → item/gốc sang `executing`, xuất hiện trong `ready` khi deps/
  lineage cũng đã mở; cần người quyết → `awaiting-human` mang đề xuất chia.
  Mọi nhánh chưa xong đều trả lời xong rồi gọi lại `discover` (hoặc để vòng
  tự hành tự quét) sẽ phán lại.

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
- **ready:** trả danh sách việc sẵn-sàng dẫn xuất từ trạng thái (`todo` + mọi dep `done` thật + đang ở stage `executing` + không còn hậu duệ dang dở qua `parent`; dep đang `proposed`/`doing`/`blocked`/`awaiting-human` KHÔNG mở việc phụ thuộc), thứ tự đúng thứ tự khai việc; kho chưa khởi tạo → danh sách rỗng, thành công. Đầu ra máy-đọc-được. Item `awaiting-human` không lọt vào tập này vì chỉ trạng thái `todo` mới sẵn-sàng — cổng chờ-người được loại "miễn phí" bởi chính bộ lọc trạng thái, và một item có dep đang chờ-người cũng không được mở. Item còn ở stage `clarify`/`decompose` cũng không lọt vào tập này dù status là `todo` — "sẵn sàng" nghĩa là đã qua cả context-discovery lẫn chia-việc, không chỉ đã hết dep. Một item gốc còn hậu duệ dang dở cũng không lọt vào tập này dù bản thân nó `todo`+`executing` — lineage (`parent`) là một chiều lọc riêng, tách khỏi `deps`.

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
- **R18 (stage — chiều vĩ mô song song với status).** Mỗi item mang thêm một trường `stage` (`clarify`/`decompose`/`executing`), tách bạch khỏi `status` (vi mô, không đổi ở quyết định này): `stage` trả lời "loại tác vụ nào đang cần", `status` trả lời "việc đang ở đâu trong vòng đời của tác vụ đó". Item vào hệ qua `submit` bắt đầu ở `clarify`; qua `add` (hoặc bất kỳ item nào tạo trước tính năng này) mặc định `executing` (per D1/D8 stage-clarify / 9a19eea5; giá trị `decompose` thêm sau, per D2 stage-decompose / 43f257ae).
- **R19 (vòng tự hành là lưới đỡ context-discovery, bất kể mode).** Mỗi lượt chạy, vòng tự hành quét TOÀN BỘ item đang `stage: clarify` VÀ `status: todo` — không phân biệt giá trị `mode` — và tự chạy context-discovery cho từng item, TRƯỚC khi giao bất kỳ việc thi công executing nào trong cùng lượt. Không bao giờ chạm item đang `awaiting-human` (hệ quả trực tiếp của R15, áp dụng cho cả sweep này). Đảm bảo không item nào kẹt vô hình dù phiên sống đã chết giữa chừng hoặc người submit bỏ đi không gọi `discover` (per D13 stage-clarify / 9a19eea5).
- **R20 (settlement — kênh 1 của capture 2 kênh).** `actor` là trường cộng-thêm tùy chọn trên chính ngã-ngũ (`work.move`/`work.stage`) — không sinh event mới. Bản ghi settlement là bề mặt đọc dẫn xuất từ ba loại ngã-ngũ đã có (clarify-pass/answer/close), cộng thêm không đè theo id, và giữ nguyên nhật ký di sản thật (không tự "mọc" bản ghi cho một ngã-ngũ tiền-phiên-bản) (per D2/D3 phase-3-compound-learning S3-closeout / 96a65365; hoàn thành quyết định trì hoãn 719cbe3a).
- **R21 (câu-6 tự động — bài học lúc đóng).** Bất kỳ item nào tới `done`, qua CẢ HAI lối vào, đều tự động sinh một bản ghi học cơ học — không phán xét, không gọi model. Soạn bài học là best-effort: lỗi soạn không bao giờ chặn việc đóng item; item không dữ liệu nào trước đó vẫn nhận một bản ghi tối thiểu, không rỗng-im-lặng (per D3 phase-3-compound-learning S3-closeout / 96a65365).
- **R22 (mọi item qua chia-việc trước executing).** Item rời `clarify` luôn vào stage `decompose` trước — không còn cạnh nào đi thẳng `clarify → executing` trong thực tế, dù cạnh đó vẫn hợp lệ trong bảng chuyển-stage cho log di sản. Item đơn giản được phán pass-through rẻ; chỉ item cần chia mới tốn công thật (per D2 stage-decompose / 43f257ae).
- **R23 (hợp đồng con — verify thật, không placeholder).** Mỗi con sinh ra từ phán chia-việc phải mang `verify` THẬT (lệnh chạy được) ngay từ lúc sinh — con bỏ qua `clarify` nên chính phán chia-việc là nơi sản xuất verify đó. Verdict có bất kỳ con nào thiếu verify là verdict KHÔNG HỢP LỆ toàn bộ: không con nào được ghi, item ở nguyên trạng cho lượt quét sau (per D2 stage-decompose / 43f257ae).
- **R24 (lineage `parent` tách bạch tuyệt đối khỏi `deps`).** `parent` là quan hệ lineage (hậu duệ→gốc); `deps` là quan hệ chặn. Hai quan hệ không bao giờ trộn: con của một lần chia-việc TUYỆT ĐỐI KHÔNG được ghi vào `deps` của gốc (per D4/D5 stage-decompose / 43f257ae).
- **R25 (frontier chặn gốc theo lineage, gốc tự chứng minh khi bộ đóng).** Bộ lọc frontier chặn một gốc khi bất kỳ hậu duệ nào (qua chuỗi `parent`, đệ quy) chưa `done` — dẫn xuất thuần từ `parent`, không cơ chế mới. Khi hậu duệ cuối đóng, gốc tự lọt frontier như một item thường; `verify` của chính gốc (mang từ lúc rời clarify) là phép kiểm tích hợp của cả bộ — không có bước "đóng bộ" ghi riêng, không auto-`done` không chứng minh (per D4 stage-decompose / 43f257ae).
- **R26 (cổng-người có điều kiện trên kết quả chia).** Con mặc định vào queue thẳng; item đậu `awaiting-human` mang đề xuất chia CHỈ KHI phán tự báo mơ hồ HOẶC risk của gốc là `heavy`. Chế độ sync hỏi ngay trong phiên, dấu vết y hệt async (per D3 stage-decompose / 43f257ae).
- **R27 (settlement `clarify-pass` theo rời-clarify, không theo đích cụ thể).** Bản ghi settlement kind `clarify-pass` ghi khi item RỜI stage `clarify`, bất kể đích là `decompose` (hôm nay) hay `executing` (log di sản/cạnh cũ) — khóa theo cạnh RỜI, không theo cạnh ĐẾN, để việc chèn stage mới ở giữa không làm câm bản ghi settlement đã có (per D2 stage-decompose / 43f257ae).

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
- Context-discovery phán đủ rõ: item rời `clarify` vào stage `decompose` (không thẳng `executing`) MANG THEO verify thật trong đúng một sự kiện — không có khoảng hở nào item rời clarify mà verify còn placeholder giả; cạnh `clarify → executing` cũ vẫn hợp lệ trong bảng chuyển-stage nhưng không còn caller nào nhắm tới sau khi chia-việc chèn vào giữa (dormant, ghi nhận trung thực).
- Phán chia-việc trả verdict pass-through (item đơn giản, hoặc không có gì để chia): gốc chuyển thẳng `decompose → executing`, giữ nguyên verify đã có từ lúc rời clarify — không gắn lại verify lần hai.
- Phán chia-việc trả verdict chia (n≥1 con): mỗi con sinh qua đúng một cửa ghi, mang `parent` trỏ về gốc, `deps` nội bộ theo đề xuất mô hình, và verify THẬT của riêng nó; gốc chuyển `decompose → executing` ngay sau khi sinh đủ con nhưng KHÔNG lọt frontier cho tới khi mọi con `done` (chặn qua lineage, không qua deps).
- Sinh con giữa chừng bị crash (một vài con đã ghi, gốc chưa kịp chuyển stage): lượt quét sau phát hiện gốc đã có con mang `parent` trỏ về nó qua view hiện hành, không sinh thêm con trùng — chỉ hoàn tất việc chuyển stage gốc còn dang dở (re-entrancy an toàn, không đẻ đôi con).
- Phán chia-việc trả verdict cần người quyết (tự báo mơ hồ) hoặc gốc mang risk `heavy`: gốc đậu `awaiting-human` mang đề xuất chia (danh sách con + deps đề xuất) làm câu hỏi — chưa ghi con nào vào queue; người trả lời xong, gốc về `todo` ở stage `decompose`, lượt quét sau phán lại từ đầu.
- Phán chia-việc lỗi/timeout/verdict không đọc được, HOẶC bất kỳ con nào trong verdict chia thiếu verify thật: verdict bị coi là không hợp lệ toàn bộ — gốc ở nguyên trạng thái/stage hiện tại, không con nào được ghi, không pass-through ngầm; lượt quét sau thử lại (fail-safe, không bao giờ throw).
- Gốc có ≥1 hậu duệ dang dở (chưa `done`): gốc không bao giờ được runner dispatch dù chính gốc đang `todo` ở stage `executing` — bộ lọc frontier chặn qua chuỗi `parent`, không qua `deps`; khi hậu duệ cuối cùng đóng, gốc tự nhiên lọt frontier ở lượt quét kế tiếp mà không cần thao tác tay nào, rồi tự chứng minh bằng verify của chính nó.
- Một con bị `blocked`/đỗ giữa chừng không sinh trạng thái "bộ khẩn" mới: nó đi qua đúng cơ chế `blocked`/friction sẵn có như mọi item; gốc đơn giản vẫn bị chặn dispatch cho tới khi con đó thật sự `done`.
- Item đơn giản đi qua quét làm-rõ rồi quét chia-việc trong CÙNG một lượt chạy `--once`: cả hai ngã-ngũ (clarify-pass rồi pass-through) hoàn tất trước khi vòng dispatch thi công của lượt đó bắt đầu — không cần đợi lượt sau.
- Context-discovery phán chưa đủ rõ nhiều lần liên tiếp trên cùng item (người trả lời rồi vẫn chưa đủ): mỗi lần phán một bản ghi discovery riêng, tất cả còn sống — không lần nào bị mất; vòng lặp không có trần cố định (con người luôn là bên gate mỗi lượt lặp).
- Model gọi cho context-discovery lỗi/timeout/trả lời không đọc được: KHÔNG BAO GIỜ crash vòng tự hành hay lệnh `discover` — luôn rơi về "chưa đủ rõ" với câu hỏi mặc định cố định, item vẫn actionable (ở `awaiting-human`, không kẹt vô hình).
- Item tạo qua `add` không mang field `stage`: đọc ra `executing` (mặc định lazy), xuất hiện trong `ready` ngay như hôm nay — hành vi `add`/legacy không đổi một byte.
- Nhật ký di sản thật đã có sẵn một ngã-ngũ đóng (`→done`) từ trước khi khái niệm phiên bản schema tồn tại: replay KHÔNG tự sinh bản ghi settlement cho nó — bản chiếu lịch sử giữ nguyên byte-for-byte (test khóa bằng fixture nhật ký Phase 1 thật).
- Item đóng mà chưa từng chạy, chưa từng thất bại, chưa từng qua ngã-ngũ nào khác vẫn nhận đúng một bản ghi học tối thiểu — không rỗng-im-lặng, không lỗi.
- Soạn bài học lúc đóng gặp dữ liệu bất thường: transition đóng vẫn thành công (item vẫn thành `done`), chỉ bản ghi học của lần đó bị bỏ qua — chưa từng làm hỏng một lần đóng item nào.

## Open Gaps

- Bản ghi thực tế (outcome) chưa có trường "thời lượng chạy" — nếu cần, đây là một mở rộng schema cộng thêm mới, chưa quyết (nêu lúc validate slice 1 của phase-3-compound-learning).
- Cổng có-phân-loại (typed gates: need-review / need-approval) — vẫn cố ý gộp về một `awaiting-human` chung; thêm nhãn loại chỉ khi có consumer thật cần (per D3, deferred). Riêng nhu cầu "cần làm rõ trước khi thi công" đã giải qua chiều `stage` (clarify/decompose/executing) thay vì một loại cổng mới — xem "Giai đoạn Làm-rõ" và "Giai đoạn Chia-việc".
- Timeout / nhắc-nhở / đánh-thức khi người vắng lâu — cố ý không làm; đậu vô thời hạn (per D4, deferred).
- Phân quyền / nhiều người / giao việc: ai được trả lời cổng nào — chưa mô hình hóa (deferred).
- Cửa pull giao–nhận việc (take/return trên claim CAS sẵn có, cho tác nhân ngoài runner) — slice S2-pull riêng của cùng feature stage-decompose, chưa tới lượt (deferred, per D1 stage-decompose).
- Orchestrator service tầng fleet (registry/heartbeat/push assignment/lease, giao thức+auth cho worker từ xa) — không thuộc slice này, đắp sau trên cùng nhật ký sự kiện chỉ khi cần fleet worker (deferred, per D1 stage-decompose).
- Rollup view theo bộ (tổng hợp trạng thái mọi hậu duệ của một gốc trong một màn hình) — P24, chưa làm (deferred).

## Visuals

Not applicable — không có màn hình.

## Pointers (implementation)

- `bin/fgos.mjs` — CLI một cửa, bảng EXIT_CODES, resolve `.fgos/` từ cwd
- `src/state/store.mjs` — chủ ghi duy nhất (append event → update view); facade lỗi: EXIT_CODES + categoryOf + re-export 4 error class; STATUSES sống ở work.mjs (fsm re-export); `addOutcome` — cửa ghi outcome (mẫu `addDecision`), gọi trực tiếp từ runner (không qua verb CLI); `addFriction` — cửa ghi friction (mẫu giống `addOutcome`), cũng gọi trực tiếp từ runner; `moveWork` chuyển tiếp `ask`/`answer` cho `transitionWork`, GẮN `actor` vào payload SAU khi transition thuần trả về (không truyền vào transitionWork — payload bị rebuild sẽ nuốt mất), và khi `to==='done'` compose bài học câu-6 (`composeLearning`, thuần, try/catch best-effort) từ view TRƯỚC transition + settlement đóng sắp sinh, gắn additive vào CÙNG event `work.move`; `putInAwaiting`/`answerAwaiting` — hai verb mỏng đưa-vào-chờ / trả-lời (append event chuyển-trạng-thái mang câu hỏi/câu trả lời rồi refresh view); `moveStage` — cửa ghi đổi-stage (mẫu `moveWork`, một tầng phía trên), chuyển tiếp `transitionStage`, cùng cách gắn `actor` post-transition; `addDiscovery` — cửa ghi bản ghi discovery (mẫu `addFriction`)
- `src/state/events.mjs` — append/read JSONL `.fgos/events.jsonl` (seq + ts ISO, path tường minh), phát hiện corrupt tail
- `src/state/fsm.mjs` — bảng TRANSITIONS + precondition + CAS, thuần (chiều `status`, KHÔNG đổi bởi stage-clarify); cạnh `todo/doing→awaiting-human` bắt buộc `ask`, cạnh `awaiting-human→todo` bắt buộc `answer` (cùng cơ chế `reason`-trên-`proposed→todo`), giá trị trim vào `payload.ask`/`payload.answer`
- `src/state/stage.mjs` — bảng chuyển-stage + precondition + CAS, thuần, mẫu hệt `fsm.mjs` một tầng phía trên (chiều `stage`); cạnh hợp lệ hôm nay: `clarify → decompose`, `decompose → executing`; cạnh `clarify → executing` cũ vẫn còn trong bảng (hợp lệ, log di sản đọc lại đúng) nhưng không caller nào nhắm tới nữa — dormant, chưa gỡ (quyết theo bằng chứng grep, xem `docs/history/stage-decompose/`); `expectedStage` CAS chống đua giữa phiên sống và vòng tự hành cùng phán một item
- `src/state/work.mjs` — schema + validate (ID_PATTERN kebab-case); STATUSES gồm `awaiting-human`; STAGES = `clarify`/`decompose`/`executing`, field `stage` optional (đọc lazy `?? 'executing'` khi vắng mặt, không có trong DEFAULTS); field `parent` optional (lineage, validate string non-self-referencing, không đòi tồn tại — additive, không có trong DEFAULTS)
- `src/state/replay.mjs` — fold events → view, thuần; case `work.outcome` gộp theo id vào `view.outcomes` (key lazy, cộng thêm không đè); case `work.friction` APPEND theo id vào `view.frictions` (key lazy, mảng — mỗi record một lần xảy ra, không gộp/không đè); case `work.move` mang `ask`/`answer` gộp theo id vào `view.gates` (key lazy có bảo vệ, cộng thêm không đè); case `work.move` mang `answer` hoặc `to==='done'` (VÀ sự kiện mang phiên bản schema — bảo vệ nhật ký di sản thật) APPEND một bản ghi settlement theo id vào `view.settlements` (key lazy, mảng, kind answer/close); case `work.move` với `to==='done'` mang thêm `learning` APPEND theo id vào `view.learnings` (key lazy, mảng); case `work.add` fold thêm `item.parent` khi payload mang (additive, key lazy); case `work.stage` set `item.stage` (và `item.verify` khi payload mang verify — một sự kiện làm cả hai) và, khi RỜI clarify (guard `from === 'clarify'`, không phải đích cụ thể — chốt tại validating để retarget đích không làm câm settlement), APPEND một bản ghi settlement kind clarify-pass vào `view.settlements`; case `work.discovery` APPEND theo id vào `view.discovery` (key lazy, mảng, cùng khuôn `view.frictions`)
- `src/state/frontier.mjs` — bộ lọc `status === 'todo'` (đã loại `awaiting-human`) VÀ `(stage ?? 'executing') === 'executing'` (đã loại item clarify/decompose) VÀ, dẫn xuất thuần từ `parent` (đệ quy qua chuỗi hậu duệ, KHÔNG đụng `deps`), loại một gốc khi bất kỳ hậu duệ nào của nó chưa `done` khỏi ready set
- `src/intake/discovery.mjs` — Use-case: `judgeDiscovery` (gọi model thật qua `resolveExecutorCommand`/`modelForTier` của `dispatch.mjs`, fail-safe try/catch bao trọn mọi lỗi spawn/timeout/parse về `{clear:false, question:...}` mặc định, không bao giờ throw); `resolveDiscovery` — hàm chung DUY NHẤT cho cả verb `discover` và vòng tự hành: đọc item, gọi judgeDiscovery, ghi bản ghi discovery LUÔN, rồi `moveStage`(đủ rõ → **`decompose`**, kèm verify thật)hoặc `putInAwaiting`(chưa đủ rõ, kèm câu hỏi)
- `src/intake/decompose.mjs` — Use-case tầng sau discovery: `judgeDecompose` (gọi model thật, cùng executor/fail-safe pattern với `judgeDiscovery`, mọi lỗi spawn/timeout/parse → verdict không hợp lệ mặc định, không bao giờ throw); `resolveDecompose` — hàm chung cho cả verb `discover` (khi item ở stage `decompose`) và vòng tự hành: đọc item, gọi judgeDecompose, rồi một trong bốn nhánh — pass-through (`moveStage` decompose→executing, giữ verify cũ), chia (ghi n con qua `addWork` — `parent`/`deps`/verify thật từng con — rồi `moveStage` gốc; re-entrancy: view đã có con mang `parent` trỏ về gốc thì không sinh thêm, chỉ hoàn tất chuyển stage gốc), cần-người (`putInAwaiting` mang đề xuất chia làm câu hỏi, gate risk `heavy` đọc từ `item.risk`), hoặc không hợp lệ (không ghi gì, item ở nguyên cho lượt quét sau)
- `bin/fgos.mjs` — verb `check`: đọc `listWork(dir).outcomes`, in predicted-vs-actual; cộng thêm mục friction (đọc `view.frictions`, đếm theo lớp + cap 5 record gần nhất), mục settlement (đọc `view.settlements`, đếm theo kind+actor + cap 5), mục học (đọc `view.learnings`, cap 5), và nhắc item trạng thái cuối thiếu outcome — tất cả read-only, không sự kiện mới; tín hiệu entropy-trend + seal-digest trên cùng `check` — xem spec Runner; verb `ask`/`answer` gọi `putInAwaiting`/`answerAwaiting`; `list` mang `view.gates` (câu hỏi hiện ra không cần formatter mới) và trường `parent` khi item mang (đã đi qua `listWork`'s full-object dump, không cần formatter mới); verb `submit` — gọi `classify.mjs` (deriveTitle/classify/generateId) + `envelope.mjs` (wrapEnvelope) rồi `addWork` sẵn có, KHÔNG cửa ghi mới, gắn `stage:'clarify'`; verb `discover` — dispatch theo `item.stage` hiện tại: gọi `resolveDiscovery` (stage clarify) hoặc `resolveDecompose` (stage decompose), cùng `actor:'session'`
- `src/runner/loop.mjs` — `runOnce`: NGAY SAU startupReap, TRƯỚC vòng dispatch executing: (1) quét mọi item `stage==='clarify' && status==='todo'` và gọi `resolveDiscovery` — lưới đỡ R19; (2) NGAY SAU đó, đọc lại view TƯƠI rồi quét mọi item `stage==='decompose' && status==='todo'` và gọi `resolveDecompose` — cùng lưới đỡ, cùng lượt chạy có thể chaining cả hai sweep trên một item vừa rời clarify; không đọc `item.mode` ở cả hai sweep; mọi `moveWork` runner tự ghi (claim/propose/park) gọi kèm `actor:'runner'`; cả hai sweep gọi `resolveDiscovery`/`resolveDecompose(..., 'runner')`
- `src/intake/classify.mjs` — thuần, không import store.mjs: `deriveTitle` (cắt câu/dòng đầu hoặc N ký tự), `classify` (bảng từ khóa → tier/kind/risk, mặc định standard/task khi không khớp), `generateId` (slug + hậu tố hash base36 adaptive 3-8 ký tự, thử lại khi trùng)
- `src/state/envelope.mjs` — thuần: `wrapEnvelope(data)` → `{contract:'fgos.v1', generated_at, data_hash (sha256 hex của data), data}`
- `.fgos/events.jsonl` (committed, truth) · `.fgos/state.json` (gitignored, view D4)
- Test: `npm test` (443 test; e2e tại `test/e2e/rebuild-determinism.test.mjs` + `test/e2e/runner-loop.test.mjs` — bao gồm 3 kịch bản stage-clarify (verdict pass/unclear/rác) VÀ 3 kịch bản stage-decompose (pass-through, chia-con-chặn-frontier, cần-người) chạy qua binary thật; round-trip cổng chờ-người tại `test/state/awaiting.test.mjs` + e2e CLI tại `test/cli/fgos.test.mjs` bao gồm `submit`/`discover`/settlement/học/parity chia-việc; unit tại `test/intake/{classify,discovery,decompose}.test.mjs` + `test/state/{envelope,stage,store,frontier,work,replay}.test.mjs`; entropy-trend tại `test/report/entropy.test.mjs`; benchmark ngoài suite (F4, expected-delta khai trước run) tại `docs/history/phase-3-compound-learning/reports/f4-benchmark.md`)
