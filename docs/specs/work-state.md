---
area: work-state
updated: 2026-07-15
sources: [phase-1-state-layer, phase-1-review-fixes, phase-2-routing-s1, phase-2-routing-s2, phase-3-compound-learning-s1]
decisions: [9ac6ca50, 0790031c, 451ca088, fd17309a, 55ad2f9f, feed7428, 1a80b4d3]
coverage: full
---

# Spec: Work-State (tầng quản việc của forgent)

Bộ nhớ công việc tự quản của forgent: nơi duy nhất ghi nhận "đang có việc gì, việc nào ở trạng thái nào, quyết định nào đã chốt". Người dùng: người vận hành repo và agent làm việc trong repo — cả hai thao tác qua đúng một cửa lệnh `fgos`. Sự thật nằm ở **nhật ký sự kiện** append-only được commit; **bản chiếu trạng thái** hiện hành chỉ là dẫn xuất, xóa đi dựng lại được nguyên vẹn.

## Entry Points & Triggers

- `fgos init` → khởi tạo kho work-state rỗng tại thư mục làm việc hiện hành (nhật ký rỗng + bản chiếu rỗng)
- `fgos add` → khai một work item mới (kèm đủ trường bắt buộc; `--tier` tùy chọn)
- `fgos move` → chuyển trạng thái một item, kèm `--expect` (kỳ vọng, chống ghi đè mù); cạnh từ-chối-đề-xuất bắt buộc `--reason`
- `fgos decision --text "..."` → ghi một quyết định vào nhật ký
- `fgos list` → đọc danh sách item từ bản chiếu hiện hành
- `fgos ready` → đọc frontier: mọi item `todo` có toàn bộ deps đã `done` (đã duyệt/merge), thứ tự đúng thứ tự khai — thao tác ĐỌC thuần
- `fgos rebuild` → dựng lại bản chiếu từ zero bằng cách phát lại toàn bộ nhật ký
- `fgos check [id]` → đọc bản chiếu, in cặp dự đoán/thực tế (outcome) đã gộp cho một item, hoặc cho mọi item đang có dữ liệu nếu không truyền id — thao tác ĐỌC thuần
- Bản ghi dự đoán/thực tế (outcome) không có verb ghi riêng qua cửa lệnh: nó được ghi từ bên trong vòng tự hành (xem spec Runner) — nửa dự đoán lúc nhận việc, nửa thực tế lúc việc tới trạng thái cuối (thành công lẫn thất bại)

## Data Dictionary

| # | Element | Meaning | Values | Required | Default |
|---|-------|---------|--------|----------|---------|
| 1 | id | Định danh bền của work item, dạng kebab-case chữ thường, mở đầu bằng chữ cái; không trùng | ví dụ `add-login-form` | yes | — |
| 2 | title | Tên việc người đọc hiểu; nhận mọi ký tự unicode | free text | yes | — |
| 3 | kind | Loại việc (trả lời "việc này thuộc loại gì" — câu 2 của sáu câu) | free text | yes | — |
| 4 | status | Trạng thái vòng đời; schema từ chối giá trị ngoài năm trạng thái này (phạm trù `validation`) kể cả qua tầng thư viện | `todo` — chưa bắt đầu · `doing` — đang làm · `blocked` — kẹt, hai chiều với todo/doing · `proposed` — goal-check đạt, đề xuất nằm trên nhánh chờ duyệt · `done` — đã nhận vào cây chính, TERMINAL: hai lối vào (`doing→done` thao tác tay, `proposed→done` duyệt đề xuất), không bao giờ ra | yes | `todo` |
| 5 | deps | Các id item phải xong trước; mọi id phải tồn tại, cấm tự trỏ; "epic" chỉ là một item thường được deps trỏ vào | danh sách id | yes (rỗng được) | `[]` |
| 6 | risk | Mức rủi ro của việc (câu 4) | free text | yes | — |
| 7 | refs | Đọc gì trước / chạm contract nào (câu 1 + 3) | danh sách tham chiếu | yes (rỗng được) | — |
| 8 | verify | Proof gì thì xong (câu 5) | free text | yes | — |
| 9 | learn | Link bài học để lại (câu 6 — chỗ cắm vòng học sau này) | text | no | — |
| 10 | tier | Hạng nặng-nhẹ của việc, để chọn model thực thi (bảng tier→model đến ở Phase 2 E3; tập giá trị provisional tới lúc đó) | `light` · `standard` · `heavy` | no | `standard` |
| — | Sự kiện (không hiển thị) | Đơn vị ghi của nhật ký; mỗi thao tác ghi đúng MỘT sự kiện, số thứ tự tăng dần + thời điểm + phiên bản schema `v` (hiện hành: 2; sự kiện di sản không có `v` vẫn đọc được) | `work.add` — khai item (luôn mang tier tường minh từ v2) · `work.move` — chuyển trạng thái (from/to; cạnh từ-chối mang `reason`) · `decision` — quyết định kèm chữ · `work.outcome` — dự đoán HOẶC thực tế cho một item (mỗi nửa là một sự kiện riêng, cùng id; xem "Bản ghi kết quả" dưới) | — | — |
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

## Behaviors & Operations

### Khai việc (add)

- **Blocked when:** thiếu trường bắt buộc, id sai dạng kebab-case, id trùng, dep trỏ id không tồn tại — tất cả trả phạm trù `validation` (mã 4), KHÔNG sự kiện nào được ghi.
- **What changes:** một sự kiện khai-item vào nhật ký, item xuất hiện trong bản chiếu ở `todo`.
- **Side effects:** không.
- **Afterwards:** người/agent thấy item trong `list`; clone khác thấy sau khi nhận commit chứa nhật ký.

### Chuyển trạng thái (move)

- **Blocked when:** (a) cạnh chuyển không có trong bảng — `todo→doing`, `doing→done`, `doing→proposed`, `proposed→done`, `proposed→todo` (bắt buộc lý do), `todo/doing→blocked`, `blocked→todo/doing` là toàn bộ cạnh hợp lệ — trả `precondition` (mã 2); (a2) cạnh từ-chối `proposed→todo` thiếu/rỗng lý do — trả `validation` (mã 4); (b) trạng thái thực khác `--expect` — trả `conflict` (mã 3); (c) cờ thiếu giá trị hoặc rỗng (`--to` trống, `--expect ""`) — trả `validation` (mã 4), không bao giờ lọt sang phạm trù 2/3. Cả ba trường hợp KHÔNG ghi sự kiện nào.
- **What changes:** một sự kiện chuyển-trạng-thái (kèm from/to) vào nhật ký, rồi bản chiếu cập nhật — luôn theo thứ tự nhật-ký-trước, bản-chiếu-sau.
- **Side effects:** không.
- **Afterwards:** `done` là cửa một chiều ra: item đã done thì mọi lần move tiếp theo đều bị `precondition`. Item bị từ chối về `todo` mang lý do trong nhật ký, vào lại hàng chờ làm tiếp.

### Ghi quyết định (decision)

- **Blocked when:** thiếu nội dung chữ — `validation`.
- **What changes:** một sự kiện quyết-định vào nhật ký; quyết định đọc được lại từ bản chiếu sau replay.

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
- **ready:** trả danh sách việc sẵn-sàng dẫn xuất từ trạng thái (`todo` + mọi dep `done` thật; dep đang `proposed`/`doing`/`blocked` KHÔNG mở việc phụ thuộc), thứ tự đúng thứ tự khai việc; kho chưa khởi tạo → danh sách rỗng, thành công. Đầu ra máy-đọc-được.

## Actors & Access

| Capability | Người vận hành | Agent trong repo | Clone/máy khác |
|---|---|---|---|
| Mọi thao tác ghi (init/add/move/decision) | ✓ qua cửa lệnh duy nhất | ✓ qua cửa lệnh duy nhất | — (nhận qua commit) |
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

## Open Gaps

- Bản ghi thực tế (outcome) chưa có trường "thời lượng chạy" — nếu cần, đây là một mở rộng schema cộng thêm mới, chưa quyết (nêu lúc validate slice 1 của phase-3-compound-learning).

## Visuals

Not applicable — không có màn hình.

## Pointers (implementation)

- `bin/fgos.mjs` — CLI một cửa, bảng EXIT_CODES, resolve `.fgos/` từ cwd
- `src/state/store.mjs` — chủ ghi duy nhất (append event → update view); facade lỗi: EXIT_CODES + categoryOf + re-export 4 error class; STATUSES sống ở work.mjs (fsm re-export); `addOutcome` — cửa ghi outcome (mẫu `addDecision`), gọi trực tiếp từ runner (không qua verb CLI)
- `src/state/events.mjs` — append/read JSONL `.fgos/events.jsonl` (seq + ts ISO, path tường minh), phát hiện corrupt tail
- `src/state/fsm.mjs` — bảng TRANSITIONS + precondition + CAS, thuần
- `src/state/work.mjs` — schema + validate (ID_PATTERN kebab-case)
- `src/state/replay.mjs` — fold events → view, thuần; case `work.outcome` gộp theo id vào `view.outcomes` (key lazy, cộng thêm không đè)
- `bin/fgos.mjs` — verb `check`: đọc `listWork(dir).outcomes`, in predicted-vs-actual, read-only
- `.fgos/events.jsonl` (committed, truth) · `.fgos/state.json` (gitignored, view D4)
- Test: `npm test` (248 test; e2e tại `test/e2e/rebuild-determinism.test.mjs` + `test/e2e/runner-loop.test.mjs`, chạy binary thật trong tmp dir)
