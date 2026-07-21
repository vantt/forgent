---
area: enduser-docs-index
updated: 2026-07-21
sources: [compound-learn-enduser-docs]
decisions: [1d336d8a]
coverage: full
---

# Spec: Chỉ mục đọc-theo-tag tài liệu người-dùng-cuối (enduser-docs-index)

Một **chỉ mục máy-đọc-được** của toàn bộ tài liệu hướng người-dùng-cuối trong repo,
sinh theo yêu cầu từ hai nguồn sự-thật đã có — cây tài liệu trên đĩa và nhật ký
capture của việc — chứ không tự nó là nguồn sự-thật. Mục đích: cho người và agent
một bảng tra "có tài liệu gì, thuộc loại nào, phục vụ mục đích/đối tượng nào, và nó
sinh ra từ việc nào" mà không phải mở từng tệp; và giữ **móc truy ngược** từ mỗi tài
liệu về capture đã sinh ra nó, để một slice về sau dựng lại tài liệu hợp nhất từ
nguồn mà không mất chi tiết hay cấu trúc.

Chỉ mục này KHÔNG hợp nhất, viết lại, hay sửa bất kỳ tài liệu nào — nó chỉ liệt kê và
liên kết. Việc gộp tài liệu thành prose sống là một area/slice khác, để sau.

## Entry Points & Triggers

- **`fgos docs-index`** — người hoặc agent gọi verb này để (tái) sinh chỉ mục. Đây là
  bề mặt duy nhất; không có lịch chạy tự động, không có sự kiện nào kích hoạt nó. Bề
  mặt CLI sống ở area work-state (cửa lệnh `fgos` một cửa); hành vi sống ở đây.
- Kỳ vọng chạy sau khi một tài liệu người-dùng-cuối mới được soạn ở khâu
  compound-learn, để chỉ mục bắt kịp tài liệu và linkage mới.

## Data Dictionary

Chỉ mục là một **danh sách mục** (thứ tự theo quadrant rồi theo tài liệu). Mỗi mục mô
tả đúng một tài liệu người-dùng-cuối:

| # | Trường | Nghĩa | Miền giá trị |
|---|---|---|---|
| 1 | quadrant | Ngăn Diataxis của tài liệu, suy ra từ thư mục chứa nó | `tutorial` / `how-to` / `reference` / `explanation` |
| 2 | purpose | Mục đích của ngăn — "tài liệu loại này dùng để làm gì" — lấy từ một bảng ánh xạ CỐ ĐỊNH theo quadrant, nên chỉ mục tự-mô-tả, không buộc người đọc đã thuộc Diataxis | câu mô tả mục đích của ngăn (xem Business Rules R4) |
| 3 | audience | Đối tượng của ngăn — "ai đọc tài liệu loại này" — lấy từ cùng bảng ánh xạ cố định | câu mô tả đối tượng của ngăn (xem R4) |
| 4 | docPath | Đường dẫn tới tệp tài liệu trong repo | chuỗi đường dẫn (vd `docs/how-to/x.md`) |
| 5 | title | Tiêu đề tài liệu — dòng tiêu đề cấp cao nhất đầu tiên bên trong tệp | chuỗi; rỗng nếu tệp không có tiêu đề |
| 6 | sourceCaptureId | Móc truy ngược: mã của bản ghi capture (outcome) đã khai `docPath` đúng bằng tệp này — tức việc đã sinh ra tài liệu; `null` khi không việc nào khai linkage tới nó (tài liệu di sản soạn trước khi có cơ chế linkage) | mã item, hoặc `null` |

`purpose`/`audience` được **gieo từ quadrant**, không đọc từ bên trong tài liệu: mọi
tài liệu cùng ngăn mang cùng cặp purpose/audience. Bảng ánh xạ quadrant→{purpose,
audience} có đúng MỘT nguồn sự-thật (xem R4).

## Behaviors & Operations

### Sinh chỉ mục (fgos docs-index)

- **Triggers:** gọi `fgos docs-index`.
- **Blocked when:** không có điều kiện chặn riêng. Verb đọc-thuần đối với trạng thái
  việc; nếu nhật ký capture hỏng, tầng đọc chung báo lỗi log-hỏng như mọi bên đọc.
- **Điều gì xảy ra:**
  1. Với mỗi ngăn Diataxis, tìm thư mục tương ứng trên đĩa. **Thư mục vắng thì bỏ
     qua sạch sẽ** — không lỗi, không mục — vì không phải ngăn nào cũng đã có tài liệu.
  2. Với mỗi tài liệu tìm thấy trong một thư mục ngăn: suy `quadrant` từ thư mục, tra
     `purpose`/`audience` từ bảng cố định, đọc `title` là tiêu đề cấp cao nhất đầu tiên
     của tệp, và ghi `docPath`.
  3. Truy `sourceCaptureId`: dựng bản chiếu capture từ nhật ký sự kiện (đọc-thuần) và
     tìm bản ghi outcome nào khai `docPath` trùng đúng tệp này; thấy thì lấy mã việc
     của nó, không thấy thì để `null`.
  4. Ghi/ghi-đè manifest thành một tệp máy-đọc-được ở vị trí cố định ngoài cây spec.
- **Side effects:** chỉ tạo/ghi-đè đúng một tệp manifest. Không ghi sự kiện, không đổi
  trạng thái việc, không đụng vào bất kỳ tài liệu người-dùng-cuối nào.
- **Sau đó, người/hệ tiêu thụ quan sát:** một manifest đầy đủ — mỗi tài liệu hiện có
  một mục với ngăn, mục đích, đối tượng, đường dẫn, tiêu đề, và linkage ngược (hoặc
  `null`). Chạy lại verb cho ra manifest tương đương: **không nhân đôi** mục cho cùng
  một `docPath`/`sourceCaptureId`.

## Actors & Access

- **Người vận hành / agent trong repo** — gọi `fgos docs-index`, đọc manifest. Không
  có vai trò đặc quyền: verb mang quyền `read` (chỉ đọc trạng thái việc; ghi manifest
  là artifact dẫn xuất, không phải một lần ghi sự kiện hay đổi trạng thái).
- **Hệ tiêu thụ** — bất kỳ công cụ/agent nào cần bảng tra tài liệu hoặc muốn dựng lại
  tài liệu hợp nhất từ nguồn, đọc manifest và đi theo `sourceCaptureId` về capture.

## Business Rules

- **R1 (chỉ mục là dẫn xuất, không phải nguồn).** Manifest được sinh lại được hoàn
  toàn từ cây tài liệu trên đĩa và nhật ký capture; nó không giữ sự-thật nào của riêng
  mình. Xóa đi rồi chạy lại verb cho ra cùng nội dung (per D12).
- **R2 (chỉ liệt kê và liên kết, không viết lại).** Verb là đọc-thuần với tài liệu:
  không hợp nhất, không sửa, không sinh tài liệu. Việc gộp tài liệu là slice sau (per
  D10/D12).
- **R3 (linkage nguồn↔tài-liệu là bắt buộc-nếu-có, không bắt buộc-phải-có).** Mỗi mục
  cố truy `sourceCaptureId` qua `docPath` đã ghi lúc capture; tài liệu không có capture
  nào khai linkage vẫn được liệt kê với `sourceCaptureId: null`. Linkage đảm bảo slice
  gộp-sống dựng lại tài liệu không mất chi tiết/cấu trúc (per D13).
- **R4 (bảng quadrant→{mục-đích,đối-tượng} có đúng MỘT nguồn sự-thật).** Cặp
  purpose/audience của mỗi ngăn được định nghĩa một chỗ duy nhất trong phần hiện thực
  và mọi nơi khác (kỹ năng `fgos-indexing`, tài liệu) TRỎ tới nó, không chép lại giá
  trị. Ý nghĩa từng ngăn theo Diataxis: `tutorial` — dẫn người mới học qua một trải
  nghiệm; `how-to` — chỉ các bước đạt một mục tiêu cụ thể đã hiểu rõ; `reference` — tra
  cứu chính xác, khô khan; `explanation` — làm rõ bối cảnh/lý do. Câu chữ đích xác của
  từng cặp là của phần hiện thực (per D12/D14).
- **R5 (tự-mô-tả, không khóa cứng vào Diataxis).** Vì mỗi mục mang sẵn purpose+audience
  chứ không chỉ tên ngăn, người đọc chỉ mục hiểu ngay "để làm gì / ai dùng" mà không
  cần thuộc Diataxis; đây là hàng rào cho nghi vấn Diataxis-đủ-hay-không còn để ngỏ
  (per D12/D14).
- **R6 (dung sai ngăn vắng).** Ngăn chưa có thư mục trên đĩa bị bỏ qua sạch; verb không
  bao giờ gãy vì thiếu ngăn. Hiện chỉ ngăn `how-to` tồn tại (per D12, ràng buộc
  validation bước-3).
- **R7 (idempotent).** Chạy lại verb không sinh mục trùng cho cùng
  `docPath`/`sourceCaptureId`.
- **R8 (vị trí manifest ngoài cây spec).** Manifest KHÔNG sống dưới cây tài liệu tham
  chiếu BA nội bộ; nó là artifact sản phẩm ở vị trí riêng (per D8/D12).

## Edge Cases Settled

- Ngăn Diataxis chưa có thư mục (vd `tutorial`/`reference`/`explanation` hiện chưa
  tồn tại): bỏ qua, không lỗi, không mục — verb vẫn chạy trọn và ghi manifest cho các
  ngăn đã có (per D12, ràng buộc validation).
- Tài liệu di sản không có capture nào khai `docPath` tới nó (vd tài liệu how-to đầu
  tiên soạn trước cơ chế linkage): vẫn được liệt kê, `sourceCaptureId: null` — không
  phải lỗi (per D13/D15).
- Chạy `fgos docs-index` nhiều lần liên tiếp: manifest hội tụ, không mục trùng (R7).

## Open Gaps

- **Gộp-sống (hợp nhất tài liệu).** Dựng tài liệu prose sống từ các capture đã liên
  kết — dùng chính linkage của chỉ mục để không mất chi tiết/cấu trúc — được HOÃN có
  chủ ý sang slice sau (per D10/D14). Chỉ mục này là nền cho nó.
- **Backfill.** Đưa nội dung di sản (ghi chép mẫu-hình then-chốt, bản ghi quyết định)
  vào bốn ngăn để chỉ mục phủ rộng hơn — chưa làm, ưu tiên thấp.
- **Bề rộng ngăn.** Mới ngăn `how-to` có tài liệu thật; ba ngăn còn lại trống cho tới
  khi tài liệu loại đó được soạn.
- **Nghi vấn Diataxis-đủ.** Liệu bốn ngăn Diataxis một mình có cấu trúc nổi "tài liệu
  đủ phẩm chất" hay không — để ngỏ, cặp purpose/audience (R5) là hàng rào tạm; slice
  gộp-sống phải trả lời (per D14).

## Pointers (implementation)

- Bộ sinh thuần (không I/O): `repo/src/report/enduser-index.mjs` — export
  `QUADRANTS`, bảng nguồn-sự-thật `QUADRANT_META` (cặp purpose/audience mỗi ngăn — R4),
  `findSourceCaptureId`, `buildEnduserIndex`.
- I/O + verb: nhánh `docs-index` trong `repo/bin/fgos.mjs` (đọc thư mục ngăn, rút tiêu
  đề H1 đầu, fold nhật ký qua bề mặt đọc-thuần `listWork`, ghi manifest); đăng ký verb
  ở `repo/src/cli/command-registry.mjs` với quyền `read`.
- Manifest sinh ra: `repo/docs/enduser-docs-index.json`.
- Kỹ năng vận hành: `fgos-indexing` (cả hai gốc skill) — khi nào chạy verb, trỏ về
  `QUADRANT_META` làm nguồn ánh xạ duy nhất.
- Kiểm thử: `repo/test/report/enduser-index.test.mjs` (chạy verb thật trên cây `docs/`
  thật và đọc manifest sinh ra, không dùng proxy).
