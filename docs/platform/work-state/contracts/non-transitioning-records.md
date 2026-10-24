# Non-Transitioning Decision And Outcome Records

```txt
Document type: Contract
Audience: Work-state and runner maintainers, record-producing implementation agents, conservation reviewers
Purpose: Preserve decision and outcome record semantics without changing work-item status or workflow step
Design status: Candidate conservation of existing record behavior; STR70a remains proposed, not implemented here
Last reviewed: 2026-10-24
Related:
- docs/platform/work-state/spec.md
- docs/platform/runner/spec.md
```

Owner: Work-state
Status: Candidate conservation of existing two-verb precedent, not implementation of STR70a.
Related links: [Work-state spec](../spec.md), [Runner spec](../../runner/spec.md).

`decision` and `outcome` append durable records through the existing store without changing the work item status or workflow step. Engine bookkeeping is not the same as a design decision. This is the precedent the STR70a proposal cites; the proposal remains proposed and gains no new distillate/gate mechanism here.

### Bản ghi kết quả (outcome) — dự đoán / thực tế

Ngoài bảng trường của work item, một item có thể mang thêm một **bản ghi outcome**: hai nửa
đến ở hai thời điểm khác nhau trong đời của một lần chạy, gộp theo id — nửa đến sau CỘNG
THÊM vào bản ghi, không bao giờ đè mất nửa đã có.

| # | Nửa | Element | Meaning | Values | Ghi khi nào |
|---|-----|---------|---------|--------|-------------|
| O1 | dự đoán | tier dự kiến | Hạng nặng-nhẹ dự kiến của việc tại thời điểm nhận việc | `light` / `standard` / `heavy` | lúc nhận việc (claim) |
| O2 | dự đoán | số dep | Số lượng việc phụ thuộc của item tại thời điểm nhận việc | số nguyên ≥ 0 | lúc nhận việc |
| O3 | dự đoán | số lần nhận trước đó | Item này đã từng được nhận (chuyển sang "đang làm") bao nhiêu lần trước lần này | số nguyên ≥ 0 | lúc nhận việc |
| O4 | thực tế | kết cục (disposition) | Kết cục cuối của lần chạy | `awaiting-approval` — goal-check đạt, thành đề xuất chờ duyệt · `parked` — dừng lại theo lẽ thường (hết trần thử lại, hoặc lỗi không thử lại được), item bị đỗ · `halted` — cầu dao chấm-trượt-liên-tiếp cắt cả vòng chạy, item bị đỗ trước khi vòng dừng hẳn | lúc item tới trạng thái cuối |
| O5 | thực tế | đạt goal-check | Phép đo goal-check của chính vòng tự hành có đạt hay không | boolean | lúc item tới trạng thái cuối |
| O6 | thực tế | số lần thử | Số lần thử trong đúng lần chạy này | số nguyên ≥ 1 | lúc item tới trạng thái cuối |
| O7 | thực tế | lớp lỗi | Lớp lỗi (theo bảng phục hồi của spec Runner) nếu thất bại; rỗng nếu thành công | free text hoặc rỗng | lúc item tới trạng thái cuối |
| O8 | thực tế | số commit | Số commit mà item để lại trên nhánh đề xuất | số nguyên ≥ 0 | lúc item tới trạng thái cuối |
| O9 | thực tế | số lần nhận (đến giờ) | Item này đã từng được nhận bao nhiêu lần tính đến hết lần chạy này | số nguyên ≥ 0 | lúc item tới trạng thái cuối |
| O10 | — (trực giao) | phân loại tài liệu (docType) | Nhãn Diataxis TÙY CHỌN gắn trên bản ghi — chiều AUDIENCE/loại-tài-liệu, TRỰC GIAO với chiều type-axis kỹ sư (pattern/decision/failure), một chiều CỘNG THÊM chứ không thay thế. Kiểm hình dạng khi CÓ MẶT (phải là đúng một trong bốn quadrant); vắng mặt/`null` = chưa gắn nhãn, luôn hợp lệ, không bao giờ bắt buộc — cùng khuôn optional-additive với `docsRef` (Data Dictionary #23). Đi ké payload thô của sự kiện capture nên sống sót replay qua chính spread-fold sẵn có, không đổi cơ chế | `tutorial` / `how-to` / `reference` / `explanation` (bốn quadrant Diataxis; giá trị khác khi có mặt bị từ chối `validation`) | tùy — bên sản xuất `compound --doc-type` (RUL51 (verb compound — nay là cửa gắn nhãn, không còn là cửa chuyển stage)/52) hoặc bất kỳ bên ghi capture nào cung cấp |
| O11 | — (trực giao) | con trỏ tài liệu (docPath) | Con trỏ TÙY CHỌN tới tài liệu người-dùng-cuối mà bản ghi outcome này sinh ra — chiều LINKAGE nguồn↔tài-liệu, đứng CẠNH `docType` (O10) chứ không thay thế: `docType` nói "loại tài liệu", `docPath` nói "đúng tài liệu nào". Ghi lúc `compound --doc-path <path>` (RUL53 (con trỏ tài liệu docPath — trường linkage cộng-thêm trên outcome)); không kiểm hình dạng (đường dẫn tự do), vắng mặt/`null` = chưa gắn linkage, luôn hợp lệ, không bao giờ bắt buộc — cùng khuôn optional-additive với `docType`/`docsRef`. Đi ké payload thô của sự kiện capture nên sống sót replay/rebuild qua chính spread-fold sẵn có, tầng lưu không đổi một byte. Là móc để chỉ mục đọc-theo-tag truy ngược tài liệu về capture (area `enduser-docs-index`), đảm bảo dựng lại tài liệu không mất chi tiết/cấu trúc (per bước-3 compound-learn-enduser-docs) | chuỗi đường dẫn tài liệu (vd `docs/how-to/x.md`); vắng/`null` khi chưa gắn | tùy — bên sản xuất `compound --doc-path` (RUL53 (con trỏ tài liệu docPath — trường linkage cộng-thêm trên outcome)) |

Item chưa từng chạy không mang bản ghi outcome nào — vắng mặt hoàn toàn, không phải bản ghi
rỗng. Nhật ký ghi trước khi bản ghi này tồn tại replay lại nguyên vẹn, không sinh ra outcome
nào cho item nào (tương thích ngược, theo luật tiến hóa schema RUL11 (tiến hóa schema)).

### Ghi quyết định (decision)

- **Blocked when:** thiếu nội dung chữ — `validation`.
- **What changes:** một sự kiện quyết-định vào nhật ký; quyết định đọc được lại từ bản chiếu sau replay.

### Ghi kết quả dự đoán/thực tế (outcome)

- **Runs when:** không qua verb CLI riêng — được ghi từ bên trong vòng tự hành (spec Runner): nửa dự đoán ngay khi item được nhận việc; nửa thực tế khi item tới trạng thái cuối, CẢ khi thành công lẫn khi thất bại.
- **Blocked when:** thiếu id — `validation`.
- **What changes:** một sự kiện outcome vào nhật ký cho MỖI nửa (hai sự kiện riêng biệt, cùng id, đến ở hai thời điểm khác nhau); bản chiếu gộp hai nửa theo id — nửa đến sau CỘNG THÊM vào nửa đã có, không bao giờ đè mất.
- **Side effects:** không.
- **Afterwards:** `fgos check` đọc được cả hai nửa cho item đó ngay khi chúng tồn tại; item chưa từng chạy hoàn toàn không xuất hiện trong `check`.
