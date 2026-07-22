---
area: enduser-docs-index
updated: 2026-07-22
sources: [compound-learn-enduser-docs, str64-backfill]
decisions: [1d336d8a, 02623bff, c74bcef9, acda11a7]
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
liên kết. Việc **dựng/nuôi tài liệu prose sống** từ các capture là area chị em
`enduser-docs-authoring` (write-side); area này là read-side: liệt kê, liên kết, và
cung cấp truy vấn ngược "một tài liệu sinh ra từ những capture nào".

## Entry Points & Triggers

- **`fgos docs-index`** — người hoặc agent gọi verb này để (tái) sinh chỉ mục. Đây là
  bề mặt duy nhất; không có lịch chạy tự động, không có sự kiện nào kích hoạt nó. Bề
  mặt CLI sống ở area work-state (cửa lệnh `fgos` một cửa); hành vi sống ở đây.
- Kỳ vọng chạy sau khi một tài liệu người-dùng-cuối mới được soạn ở khâu
  compound-learn, để chỉ mục bắt kịp tài liệu và linkage mới.
- **`fgos doc-sources <docPath>`** — người hoặc agent gọi verb này để lấy **mọi**
  capture đã liên kết tới một đường dẫn tài liệu (truy vấn ngược nhiều-kết-quả), làm
  nguồn cho area `enduser-docs-authoring` dựng lại tài liệu không mất chi tiết. Cũng
  đọc-thuần, không lịch chạy tự động, không sự kiện kích hoạt.

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

### Đầu-mô-tả riêng của mỗi tài liệu (self-description header)

Độc lập với chỉ mục, mỗi tài liệu người-dùng-cuối tự mang một **khối mô tả** ở đầu
tệp — soạn lúc tài liệu được tạo/backfill, không phải do `fgos docs-index` sinh ra:

| # | Trường | Nghĩa | Miền giá trị |
|---|---|---|---|
| 1 | loại | Loại tài liệu (khớp `quadrant`) | `tutorial` / `how-to` / `reference` / `explanation` |
| 2 | tiêu đề | Tên hiển thị của tài liệu | chuỗi |
| 3 | nhãn | Nhãn phân loại tự do theo chủ đề/thực thể (trục thứ hai, độc lập với quadrant — xem R10) | danh sách chuỗi, có thể rỗng |
| 4 | thời điểm | Lúc khối mô tả này được ghi/sửa gần nhất | thời khắc ISO 8601 |
| 5 | móc-liên-kết-nguồn | Bản sao-ghi-lúc-soạn của những capture đã sinh ra tài liệu này | danh sách mã việc, có thể rỗng |

Trường `móc-liên-kết-nguồn` KHÔNG phải nguồn thẩm quyền (xem R1 mở rộng, R11) — nó là
bản sao tiện dụng để tài liệu tự-đọc-được mà không cần chạy verb; nguồn thẩm quyền
duy nhất của linkage vẫn là nhật ký capture, tra qua `fgos doc-sources`.

## Behaviors & Operations

### Sinh chỉ mục (fgos docs-index)

- **Triggers:** gọi `fgos docs-index`.
- **Blocked when:** không có điều kiện chặn riêng. Verb đọc-thuần đối với trạng thái
  việc; nếu nhật ký capture hỏng, tầng đọc chung báo lỗi log-hỏng như mọi bên đọc.
- **Điều gì xảy ra:**
  1. Với mỗi ngăn Diataxis, tìm thư mục CHÍNH tương ứng trên đĩa, **cộng thêm mọi vị
     trí thay thế đã khai cho ngăn đó** (hiện có đúng một: ngăn `explanation` còn nhận
     tài liệu từ vị trí sổ quyết định sản phẩm, coi như cùng ngăn — xem R10). **Thư
     mục vắng thì bỏ qua sạch sẽ** — không lỗi, không mục — vì không phải ngăn nào
     cũng đã có tài liệu, dù là vị trí chính hay vị trí thay thế.
  2. Với mỗi tài liệu tìm thấy trong một thư mục ngăn (chính hoặc thay thế): suy
     `quadrant` từ NGĂN (không phải từ tên thư mục vật lý — vị trí thay thế mang tên
     khác nhưng vẫn gắn đúng ngăn), tra
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

### Truy nguồn của một tài liệu (fgos doc-sources)

- **Triggers:** gọi `fgos doc-sources <docPath>`.
- **Blocked when:** không có điều kiện chặn riêng; đọc-thuần đối với trạng thái việc.
- **Điều gì xảy ra:** dựng bản chiếu capture từ nhật ký (đọc-thuần), rồi trả về **mọi**
  bản ghi outcome khai `docPath` trùng đúng tệp được hỏi, theo thứ tự ghi ổn định —
  không chỉ cái đầu tiên (khác móc `sourceCaptureId` của chỉ mục, vốn chỉ giữ một). Mỗi
  kết quả kèm nội dung capture (mã việc, docType, docPath, và các trường dự-đoán/thực-tế
  nếu có) đủ để dựng lại tài liệu.
- **Side effects:** không có — không ghi sự kiện, không đổi trạng thái, không đụng tài
  liệu.
- **Sau đó, hệ tiêu thụ quan sát:** danh sách đầy đủ các capture của đường dẫn đó
  (rỗng nếu không có capture nào liên kết) — đây là bề mặt gom-nguồn mà area
  `enduser-docs-authoring` dùng để nuôi tài liệu không mất chi tiết (per D13/D17).

## Actors & Access

- **Người vận hành / agent trong repo** — gọi `fgos docs-index`, đọc manifest. Không
  có vai trò đặc quyền: verb mang quyền `read` (chỉ đọc trạng thái việc; ghi manifest
  là artifact dẫn xuất, không phải một lần ghi sự kiện hay đổi trạng thái).
- **Hệ tiêu thụ** — bất kỳ công cụ/agent nào cần bảng tra tài liệu hoặc muốn dựng lại
  tài liệu hợp nhất từ nguồn, đọc manifest và đi theo `sourceCaptureId` về capture.

## Business Rules

- **R1 (chỉ mục là dẫn xuất, không phải nguồn).** Manifest được sinh lại được hoàn
  toàn từ cây tài liệu trên đĩa và nhật ký capture; nó không giữ sự-thật nào của riêng
  mình. Xóa đi rồi chạy lại verb cho ra cùng nội dung (per D12). **Mở rộng (per D3 của
  str64-backfill):** đầu-mô-tả riêng của mỗi tài liệu (self-description header) là một
  bề mặt KHÁC, tồn tại song song — nó KHÔNG đổi tính chất dẫn-xuất-thuần của manifest.
  Manifest vẫn tính lại 100% từ đĩa+log mỗi lần chạy; đầu-mô-tả là bản sao ghi-lúc-soạn,
  không quyền, chỉ để tài liệu tự-đọc-được (xem R11).
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
- **R5 (tự-mô-tả; Diataxis là trục cấu trúc DUY NHẤT).** Vì mỗi mục mang sẵn
  purpose+audience chứ không chỉ tên ngăn, người đọc chỉ mục hiểu ngay "để làm gì / ai
  dùng" mà không cần thuộc Diataxis. Nghi vấn "Diataxis một mình có đủ không" đã được
  **chốt**: ngăn Diataxis là trục cấu trúc duy nhất của tài liệu; purpose/audience là
  trường **mô tả** (metadata), không phải trục cấu trúc thứ hai. Chỉ thêm trục thứ hai
  (vd đối tượng/persona) khi tài liệu thật va chạm — rẻ vì audience đã là trường sẵn có
  (per D16, giải quyết nghi vấn D14).
- **R9 (truy nguồn là gom NHIỀU, khác móc chỉ mục gom MỘT).** `fgos doc-sources` trả về
  mọi capture của một đường dẫn; móc `sourceCaptureId` trong manifest chỉ giữ capture
  đầu tiên khớp. Sự khác biệt là có chủ đích: chỉ mục cần một con trỏ gọn, còn việc nuôi
  tài liệu cần trọn nguồn để không mất chi tiết (per D13/D17).
- **R6 (dung sai ngăn vắng).** Ngăn chưa có thư mục trên đĩa (chính lẫn thay thế) bị bỏ
  qua sạch; verb không bao giờ gãy vì thiếu ngăn. Hiện `how-to` và `explanation` đã có
  tài liệu thật; `tutorial`/`reference` còn trống (per D12, ràng buộc validation
  bước-3; mở rộng per str64-backfill).
- **R7 (idempotent).** Chạy lại verb không sinh mục trùng cho cùng
  `docPath`/`sourceCaptureId`.
- **R8 (vị trí manifest ngoài cây spec).** Manifest KHÔNG sống dưới cây tài liệu tham
  chiếu BA nội bộ; nó là artifact sản phẩm ở vị trí riêng (per D8/D12).
- **R10 (một ngăn có thể nhận thêm ĐÚNG MỘT vị trí thay thế đã khai — không phải cơ chế
  đa-vị-trí chung).** Hiện chỉ ngăn `explanation` có vị trí thay thế: sổ quyết định
  sản phẩm đã tồn tại từ trước, đã tự chưng cất product-facing, được công nhận là một
  nguồn hợp lệ của ngăn `explanation` thay vì di dời/viết lại (per D2 của
  str64-backfill). Đây là một khai báo tường minh cho từng ngăn, không phải quy tắc
  "mọi ngăn đều có thể có nhiều vị trí" — thêm vị trí thay thế cho một ngăn khác cần
  quyết định riêng, không suy diễn từ R10.
- **R11 (nhãn tự do là trục MÔ TẢ thứ hai, không phải trục cấu trúc).** Đầu-mô-tả của
  mỗi tài liệu mang thêm `nhãn` tự do theo chủ đề/thực thể — độc lập với `purpose`/
  `audience` (đã gieo theo quadrant, R4) và không thay thế Diataxis làm trục cấu trúc
  (R5 giữ nguyên). `nhãn` cho phép lọc theo thực thể/chủ đề (vd "tất cả tài liệu về
  X") mà không cần đổi cấu trúc thư mục (per D3 của str64-backfill).

## Edge Cases Settled

- Ngăn Diataxis chưa có thư mục (vd `tutorial`/`reference` hiện chưa tồn tại): bỏ qua,
  không lỗi, không mục — verb vẫn chạy trọn và ghi manifest cho các ngăn đã có (per
  D12, ràng buộc validation).
- Tài liệu không có capture nào khai `docPath` tới nó: vẫn được liệt kê,
  `sourceCaptureId: null` — không phải lỗi (per D13/D15). (Tài liệu how-to đầu tiên nay
  ĐÃ được liên kết tới capture `doc-fgos-rollup-howto` qua slice gộp-sống, nên mục của
  nó mang `sourceCaptureId` thật, không còn `null`.)
- Tài liệu backfill từ nội dung di sản (không qua compound-learn): đầu-mô-tả của nó
  khai `móc-liên-kết-nguồn` rỗng một cách trung thực — không bịa linkage giả (per D1/D4
  của str64-backfill).
- Chạy `fgos docs-index` nhiều lần liên tiếp: manifest hội tụ, không mục trùng (R7).

## Open Gaps

- **Bề rộng ngăn.** `how-to` và `explanation` đã có tài liệu thật (explanation qua cả
  vị trí chính lẫn vị trí thay thế, R10); `tutorial`/`reference` còn trống cho tới khi
  tài liệu loại đó được soạn.
- **Chưa có kiểm tra lệch giữa đầu-mô-tả và log.** `móc-liên-kết-nguồn` (R1 mở rộng)
  có thể lệch theo thời gian với sự thật trong log nếu tài liệu được liên kết lại sau
  khi đầu-mô-tả đã ghi; hiện chưa có cơ chế phát hiện lệch tự động — ưu tiên thấp, chỉ
  xây khi quan sát thấy lệch thật.

## Pointers (implementation)

- Bộ sinh thuần (không I/O): `repo/src/report/enduser-index.mjs` — export
  `QUADRANTS`, bảng nguồn-sự-thật `QUADRANT_META` (cặp purpose/audience mỗi ngăn — R4),
  `QUADRANT_DIR_ALIASES` (khai vị trí thay thế mỗi ngăn — R10; hiện `explanation` ->
  `['decisions']`), `findSourceCaptureId` (gom một, cho chỉ mục), `findSourceCaptureIds`
  (gom mọi capture của một đường dẫn, cho `doc-sources` — R9), `buildEnduserIndex`.
- I/O + verb: nhánh `docs-index` trong `repo/bin/fgos.mjs` (quét thư mục ngăn CHÍNH và
  mọi vị trí thay thế trong `QUADRANT_DIR_ALIASES`, rút tiêu đề H1 đầu, fold nhật ký qua
  bề mặt đọc-thuần `listWork`, ghi manifest); nhánh `doc-sources` cùng tệp (gom nguồn
  của một đường dẫn qua `findSourceCaptureIds` + `listWork`); đăng ký cả hai verb ở
  `repo/src/cli/command-registry.mjs` với quyền `read`.
- Bộ đọc/ghi đầu-mô-tả (không I/O, không phụ thuộc thư viện ngoài): `repo/src/report/frontmatter.mjs`
  — `parseFrontmatter`/`renderFrontmatter`; đây là cơ chế đọc/ghi khối mô tả riêng của
  từng tài liệu (mục "Đầu-mô-tả riêng của mỗi tài liệu" ở trên), tách biệt với bộ sinh
  chỉ mục.
- Manifest sinh ra: `repo/docs/enduser-docs-index.json`.
- Vị trí chính + vị trí thay thế trên đĩa: `repo/docs/how-to/`, `repo/docs/explanation/`
  (chính, ngăn `explanation`), `repo/docs/decisions/` (thay thế đã khai cho ngăn
  `explanation`, R10).
- Kỹ năng vận hành: `fgos-indexing` (cả hai gốc skill) — khi nào chạy verb, trỏ về
  `QUADRANT_META`/`QUADRANT_DIR_ALIASES` làm nguồn ánh xạ duy nhất.
- Kiểm thử: `repo/test/report/enduser-index.test.mjs` (chạy verb thật trên cây `docs/`
  thật và đọc manifest sinh ra, không dùng proxy — gồm cả `findSourceCaptureIds` đa-kết-
  quả và vị trí thay thế của ngăn `explanation`); `repo/test/report/frontmatter.test.mjs`
  (đầu-mô-tả, round-trip); hành vi verb `doc-sources` ở `repo/test/cli/fgos.test.mjs`.
