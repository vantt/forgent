---
area: enduser-docs-authoring
updated: 2026-07-21
sources: [compound-learn-enduser-docs]
decisions: [02623bff, c74bcef9]
coverage: full
---

# Spec: Soạn & nuôi tài liệu người-dùng-cuối (enduser-docs-authoring)

Ở khâu **compound-learn** của vòng đời một việc, một kỷ luật soạn tài liệu biến outcome
đã capture thật của việc thành một **tài liệu người-dùng-cuối thật**, xếp theo ngăn
Diataxis. Mỗi đường dẫn tài liệu là một **tài liệu sống**: các capture kế tiếp cùng khai
một đường dẫn được **tích luỹ** vào tài liệu đó mà không mất chi tiết đã có. Đây là mặt
write-side, đối trọng với mặt read-side (area `enduser-docs-index` — liệt kê + liên kết).

## Entry Points & Triggers

- **Việc tới khâu compound-learn** — người hoặc agent thực thi kỷ luật soạn tài liệu cho
  việc đó. Không có lịch tự động; kỷ luật chạy khi việc ở đúng khâu này.
- **`fgos compound <id> --doc-type <quadrant> --doc-path <path>`** — bề mặt producer duy
  nhất được phép dùng: nó lưu **tag ngăn Diataxis** và **móc đường-dẫn** lên capture của
  việc trong một lần gọi. Vì chỉ chạy khi việc đã ở compound-learn, lần gọi này chỉ gắn
  tag, không dời khâu thêm.
- **`fgos doc-sources <docPath>`** (đọc-thuần, area `enduser-docs-index`) — gom **mọi**
  capture đã liên kết tới một đường dẫn, làm nguồn để dựng/nuôi tài liệu không mất chi
  tiết.

## Data Dictionary

| # | Trường | Nghĩa | Miền giá trị |
|---|---|---|---|
| 1 | quadrant | Ngăn Diataxis của tài liệu — quyết định cả **hình dạng** tài liệu lẫn thư mục chứa nó | `tutorial` / `how-to` / `reference` / `explanation` |
| 2 | docPath | Vị trí tài liệu — đồng thời là **danh tính** của tài liệu sống; các capture cùng docPath tích luỹ vào cùng một tệp | chuỗi đường dẫn (vd `docs/how-to/x.md`) |
| 3 | capture | Bản ghi outcome thật của việc (dự-đoán/thực-tế, friction ghi được, và tham chiếu lịch sử nếu có) — nguồn DUY NHẤT được phép tổng hợp ra tài liệu | bản ghi capture của một việc |
| 4 | chế-độ grow-vs-create | Nuôi tài liệu có sẵn hay tạo mới — suy hoàn toàn từ việc tệp tại `docPath` đã tồn tại trên đĩa hay chưa | `create` (tệp chưa có) / `grow` (tệp đã có) |

## Behaviors & Operations

### Soạn / nuôi một tài liệu người-dùng-cuối

- **Triggers:** việc ở khâu compound-learn; agent thực thi kỷ luật.
- **Điều gì xảy ra:**
  1. **Gom capture thật.** Đọc outcome dự-đoán/thực-tế và friction của việc; nếu việc có
     tham chiếu lịch sử, đọc thêm câu chuyện đầy đủ ở đó. Đây là bằng chứng DUY NHẤT được
     tổng hợp từ.
  2. **Phân ngăn.** Chọn đúng một ngăn Diataxis cho nội dung thật của capture — quyết
     định phán đoán, không mặc định, không tung đồng xu.
  3. **Lưu tag + móc.** Gọi producer với ngăn đã chọn và đúng đường dẫn tài liệu sẽ đặt —
     lưu tag ngăn và móc đường-dẫn lên capture.
  4. **Gom mọi nguồn rồi nuôi/tạo tài liệu.** Trước khi viết, gom **mọi** capture đã liên
     kết tới đường dẫn (không chỉ cái vừa gắn) — đây là gom-không-mất. Rồi:
     - **Tệp chưa tồn tại → tạo mới** từ (các) capture đã gom, trích dẫn, không diễn giải
       lại.
     - **Tệp đã tồn tại → nuôi:** thêm (các) capture mới gom vào prose sống như **mục bổ
       sung** — thêm phần mới, KHÔNG xoá/rút gọn/xáo lại prose đã có. Tài liệu giữ trọn
       mọi chi tiết và cấu trúc cũ, đồng thời nhận thêm những gì capture mới mang lại.
     Khớp hình dạng của ngăn (tutorial = các bước có thứ tự; how-to = công thức cho một
     mục tiêu; reference = bảng/danh sách tra cứu; explanation = prose bàn luận). Ngăn
     Diataxis là trục cấu trúc DUY NHẤT — nuôi prose, không thêm trục tổ chức thứ hai
     bên trong tài liệu.
  5. **Xác nhận đóng.** Kiểm lại: tag `docType` của việc hiện đúng ngăn vừa lưu, và tài
     liệu ở bước 4 tồn tại trên đĩa. Tag không có tài liệu, hoặc tài liệu không có tag,
     là chưa xong.
- **Side effects:** một sự kiện capture (tag + móc đường-dẫn) được ghi lên việc; một tệp
  tài liệu được tạo hoặc mọc thêm. Không dời khâu/đổi trạng thái việc trực tiếp — việc để
  engine tự áp.
- **Sau đó, người/hệ quan sát:** một tài liệu người-dùng-cuối thật ở đúng ngăn, trích từ
  capture thật (evidence quote được); capture của việc mang tag ngăn + móc đường-dẫn; và
  area `enduser-docs-index` chạy lại sẽ liệt kê tài liệu với `sourceCaptureId` thật.

## Actors & Access

- **Agent/kỹ năng soạn tài liệu ở compound-learn** — đọc capture, viết tài liệu, lưu tag
  + móc qua bề mặt producer. Không vai trò đặc quyền; đi qua đúng cửa lệnh có sẵn.
- **Hệ tiêu thụ** — area `enduser-docs-index` (liệt kê tài liệu đã soạn); người đọc tài
  liệu (nhận một tài liệu người-dùng-cuối sống).

## Business Rules

- **R1 (chỉ soạn từ capture thật).** Tài liệu chỉ được tổng hợp từ outcome/friction thật
  của việc (và lịch sử tham chiếu nếu có), không bao giờ từ tiêu đề hay phán đoán.
- **R2 (một tài liệu sống trên mỗi đường dẫn).** Các capture cùng khai một `docPath` tích
  luỹ vào đúng một tài liệu tại đường dẫn đó — độ mịn là theo-đường-dẫn (per D17).
- **R3 (nuôi là bổ sung, không mất).** Khi nuôi tài liệu đã có, chỉ thêm phần mới; không
  xoá, rút gọn, hay xáo lại prose/cấu trúc đã có — tài liệu giữ trọn chi tiết cũ (per
  D13).
- **R4 (grow-vs-create theo tồn-tại-tệp).** Phân biệt nuôi hay tạo hoàn toàn bằng việc
  tệp tại `docPath` đã tồn tại chưa — không cờ phụ, không dấu trên capture.
- **R5 (Diataxis là trục cấu trúc DUY NHẤT).** Ngăn Diataxis là trục cấu trúc duy nhất
  của một tài liệu; không tổ chức lại theo trục thứ hai (đối tượng/persona, mảng sản
  phẩm) bên trong. Thư mục tài liệu khớp tag ngăn của nó. Chỉ cân nhắc trục thứ hai khi
  tài liệu thật va chạm (per D16).
- **R6 (trích, không diễn giải lại).** Nội dung được trích từ capture thật, không diễn
  giải lại hay bịa.
- **R7 (tag và tài liệu đi liền).** Một tag không có tài liệu, hoặc một tài liệu không có
  tag, là chưa xong — quay lại làm nốt nửa còn thiếu.

## Edge Cases Settled

- **Capture chỉ mang tag ngăn (không có prose dự-đoán/thực-tế phong phú):** tài liệu vẫn
  được soạn từ bối cảnh thật của việc (hành vi thật, lịch sử), trích dẫn — cơ chế tích
  luỹ vẫn chạy dù một capture mỏng. Tài liệu how-to đầu tiên (`docs/how-to/`) được soạn
  đúng theo lối này.
- **Tài liệu đầu tiên tại một đường dẫn (create) vs capture về sau (grow):** phân biệt
  thuần bằng tồn-tại-tệp (R4).

## Open Gaps

- **Tích luỹ nhiều-capture phong phú** mới được thử nhẹ: hiện mỗi đường dẫn mới có một
  capture liên kết, nên nhánh "nuôi" (grow nhiều capture qua nhiều chu kỳ) chưa được chạy
  nặng — kỷ luật đã hỗ trợ, chờ thêm capture thật.
- **Bề rộng ngăn:** mới ngăn `how-to` có tài liệu thật; ba ngăn còn lại chờ tài liệu loại
  đó được soạn.

## Pointers (implementation)

- Kỷ luật soạn: kỹ năng `fgos-compounding` (cả hai gốc `repo/.claude/skills/fgos/` và
  `repo/.agents/skills/fgos/`), Flow bước 1-5 — gom capture, phân ngăn, lưu tag+móc, gom
  mọi nguồn qua `fgos doc-sources` rồi grow-or-create theo tồn-tại-tệp, xác nhận.
- Producer tag+móc: nhánh `compound` trong `repo/bin/fgos.mjs` (nhánh compound-learn ghi
  outcome mang `docPath`).
- Gom nguồn: verb `fgos doc-sources` (area `enduser-docs-index`).
- Tài liệu thật đầu tiên: `repo/docs/how-to/check-rollup-progress.md`, liên kết tới
  capture `doc-fgos-rollup-howto`.
