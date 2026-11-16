# Ma sát từ lượt pilot plan-supervisor trên pkm (cho lane HARDEN)

Ghi 2026-11-16 từ lượt chạy thật đầu tiên: leader `claude -p` điều phối `fgos-cook` cho plan
`261115-2140-packaging-followups` trong `~/projects/pkm`, bản fgOS `v0.2.0-rc.10`, case
`wf-run-1794802682737-94357571`. Bối cảnh: `plans/reports/spec-261116-1042-plan-supervisor.md`. Mục nào chưa kiểm ghi rõ.
Chủ dự án đã chấp nhận việc nhiều family AI nhận nội dung repo; không phải điểm cần HARDEN quyết.

## Sự thật đã kiểm

1. **`validate-plan` lượt 1 thất bại** (`execution-failure / infra-exec-failed`, 04:18:43Z đến 04:34:03Z). Chuỗi thật:
   seat producer gemini bị dừng sau 17 s (`gate-exit.json`: exit 143, `cause: cancel`; `stderr.log`: "The account's quota
   or credits are used up… the seat walk falls back"); seat dự phòng deepseek chạy 15 phút rồi `gate-exit.json`:
   `exitCode 0, stoppedBy soft-deadline`, không kết quả (đầu vào ~437k token).
2. **Lượt 2** lặp lại ở reviewer: gemini hết quota, dự phòng claude. Khi chủ dự án dừng leader (SIGTERM), tiến trình điều
   khiển của lượt 2 nhận SIGTERM (`cancel-requested.json`: `requestedBy controller pid …, by signal:SIGTERM`) và lượt
   2 không bao giờ settle; case giữ một reservation `validate-plan` còn sống.

## Câu hỏi và nghi vấn cho HARDEN

- **Nhãn sai?** Một seat thoát `exitCode 0` do `soft-deadline` được ghi thành `infra-exec-failed`/`infrastructure: true`.
  Đó là hết hạn, không phải hạ tầng hỏng. Chưa kiểm xem đây là cố ý.
- **Hạn mềm** lấy từ đâu? `fgos config show --path runner.timeout` không có giá trị; hạn ~15 phút không thấy trong config.
- **Quota đã biết vẫn rơi xuống seat chậm**: sau khi gemini báo hết quota, lượt sau vẫn chọn gemini cho reviewer.
- **Không có đường dọn reservation mồ côi.** Sau khi cha của controller chết: `fgos dispatch reconcile` trả
  `blocked: no cwd lock is held`; `fgos dispatch recover <unit-run-id>` trả `no run …`; `fgos workflow status` vẫn liệt
  kê `liveReservations`. Chưa thử `workflow resume`/`close` (chờ chủ dự án). Cần một verb hoặc một câu trả lời rõ.
- **Giết tiến trình cha giết cả tiến trình điều khiển** của một lượt chạy nền: `workflow start` "chạy tách rời" nhưng
  lượt `fgos run` do leader chạy thì chết theo leader.
- **Tài liệu sai khoá cấu hình.** `workflow propose` từ chối với `gate-command-missing` và `references/propose.md` dòng
  `gate-command-missing` nói khai `capabilities.code:implement.verify`; khoá thật là
  `runner.capabilities.code:implement.verify` (`fgos config set capabilities…` báo `config-key-unknown`).
- **`fgos friction record`**: giá trị hợp lệ của `--layer` và `--disposition` chỉ biết qua thông báo lỗi.
- **Nhãn egress** `repo-content` gắn cho mọi seat, kể cả lượt `fgos run "reply ok"` chỉ có một câu prompt; nhãn nói seat
  được phép thấy gì, không nói đã đọc gì. pkm không có chính sách egress nào.
- **Leader `claude -p` không in gì tới khi thoát**; lỗi giữa chừng không ai thấy (khoảng trống phía supervisor, đã vá
  bằng `plan-board.mjs health`).

## Phát hiện thêm (case claude-only `wf-run-1794809700851-9da29b42`)

- Đặt `prefer: [claude]` cho mọi capability của pkm khiến mọi lượt `reviewed` bị **`policy-refusal /
  independence-unsatisfiable`**: reviewer và red-team phải khác family với producer, mà chỉ còn một family. Producer vẫn
  `pass`, nhưng milestone `plan-validated` không đạt và lượt đó vẫn tốn một lượt khung (còn 10 trong 12). Không có cảnh
  báo khi đặt cấu hình: lỗi chỉ lộ lúc dispatch. Đề xuất: `fgos config check` nên báo khi một pattern cần độc lập mà tập
  executor cho phép chỉ có một family.

- Sau `fgos workflow close` của case treo (07:46Z), `workflow status` vẫn ghi `status: running` và còn một
  `liveReservation` của lượt `validate-plan` mồ côi, dù `closed.closedAt` đã có. Reservation mồ côi vẫn không có đường dọn.

## Còn mở

Case `wf-run-1794802682737-94357571` để nguyên làm bằng chứng; chưa resume hay close.

## Kết quả pilot (2026-11-16) và retro

Plan `261115-2140-packaging-followups` trong pkm: phase 1 (`d6e153e`), 4 (`b32228e`), 3 (`378f8ad`) xong và được người
điều phối tự kiểm lại (fmt, clippy `-D warnings`, `cargo test --workspace --locked` 902 pass/0 fail/9 ignored ở phase 3;
chạy thật binary). Phase 2 (token CI ở repo ngoài) để chủ dự án. Chưa merge; chưa chạy `parity check` (không có
`PKM_KG_SOLO`). Số đo: `fgos metrics case` đóng với 9 lần can thiệp, `usable`.

Đi đúng: `fgos-cook` + `propose` (phân loại rigor, từ chối `write-overlap`); judge và validate phát hiện plan lệch code
(phase 3 và 4) trước khi tốn slice ghi; worker viết đủ ba thứ của `AGENTS.md`; worker lệch brief có lý do và ghi lại
(phase 3 đổi `cargo metadata` sang `cargo tree` vì feature hợp nhất kéo `ort` vào bộ `core`).

Ma sát: (1) leader headless im lặng khi lỗi; (2) claude-only bị `independence-unsatisfiable`, rồi `solo` bị
`deviation-limit-reached` sau 2 lần lệch, nên phải mở một case mỗi phase; (3) `propose` từ chối `write-overlap` cho hai
slice tuần tự cùng ghi `crates/pkm-cli`, phải tách thành hai đề xuất; (4) hook `main-checkout-delete-guard` chặn `eval`;
(5) hook `decision-question` chỉ đọc nội dung trong chính câu hỏi; (6) thông báo "chạy nền xong" của lệnh khởi động bị
nhầm với kết quả phép kiểm (lỗi của người điều phối, đã sửa bằng file đánh dấu).

Đề xuất đổi: cho phép đặt `solo` làm pattern gốc của một dự án để không tính deviation; `config check` cảnh báo khi tập
executor không đủ family cho pattern cần độc lập; cho `propose` chấp nhận chuỗi slice cùng ghi một đường dẫn khi có
`dependsOn`.
