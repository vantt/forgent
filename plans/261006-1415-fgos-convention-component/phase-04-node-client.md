# Phase 04 — Client Node mỏng qua invokeHost

Trạng thái: pending · Công: 0.5d · Phụ thuộc: phase 03

## Bối cảnh

Node chỉ có cầu nối tạm (biến mất khi Node core bị thay). Hai caller Node cần nó: pre-commit (`.githooks/pre-commit`, script Node) và doctor (`src/setup/registrations.mjs`). Mẫu: `src/observe/friction-client.mjs` dùng `invokeHost` (`src/util/host-bin.mjs:72`). Điểm khác bắt buộc: client convention **không** giữ bảng hợp lệ nào (friction-client có `PUBLISHED_LAYERS` ở Node — không chép kiểu này).

## Yêu cầu

- `src/convention/convention-client.mjs` export `conventionName(opts)`, `conventionPath(opts)`, `conventionCheck(paths | {all:true}, {dir})`: dựng argv, gọi `invokeHost`, trả `data`. Không regex, không danh sách kind/type/dir, không xử lý ngày.
- Lỗi host: phân biệt `host-unavailable`, `host-version-mismatch` (gồm host cũ không biết verb `convention`), lỗi validation của host (mã thoát 4 + thông điệp từ host).
- Sửa nhận diện mismatch trong `invokeHost`: hiện chỉ khớp stderr có cả `unknown` và `subcommand` (`host-bin.mjs:91`); host cũ in `fgos: unknown verb "convention"` (`apps/fgos/src/main.rs:108-113`). Mở rộng để `unknown verb` cũng là `host-version-mismatch` (theo Q11 của spec).

## Files

Tạo: `src/convention/convention-client.mjs`, `test/convention/convention-client.test.mjs`.
Sửa: `src/util/host-bin.mjs` (`invokeHost` nhận diện mismatch), `test/util/host-bin.test.mjs` (case `unknown verb`), `test/test-ownership.mjs` nếu manifest yêu cầu khai file nguồn mới (UNPROVEN: kiểm `npm run test:ownership:lint` sau khi thêm).
Xoá/gộp: không có Node implementation thứ hai để xoá; nguyên tắc là không tạo ra nó.

## Các bước

1. `impact` upstream cho `invokeHost` và `resolveHostBin` (dự kiến nhiều caller: observe client, doctor checks). Báo blast radius; nếu HIGH, báo anh. Đối chiếu `rtk proxy rg -n 'invokeHost\(' src bin scripts`.
2. Sửa nhận diện mismatch; thêm test.
3. Viết client + test chạy thật với host do `ensureHostBin` build (`scripts/run-tests.mjs:37`), không mock host cho đường thành công; dùng `FGOS_HOST_BIN` trỏ script giả chỉ cho case host cũ (mẫu `test/setup/observe-doctor-checks.test.mjs:172-197`).

## Kiểm chứng

- `node --test test/convention/convention-client.test.mjs test/util/host-bin.test.mjs`.
- Tiêu chí 9: `rtk proxy rg -n 'RegExp|\\d\{6\}|YYMMDD' src/convention` = 0.
- Rộng: `env -u CLAUDE_CODE_SESSION_ID npm test`.
- `detect_changes()` trước commit.

## Rủi ro

| Rủi ro | Khả năng × tác động | Giảm thiểu |
|---|---|---|
| Đổi `invokeHost` làm một caller hiện có hiểu nhầm lỗi | Thấp × Trung bình | Chỉ thêm điều kiện; lỗi khác giữ mã cũ; test hiện có của observe doctor chạy lại. |
| Client bị "làm dày" dần (thêm kiểm tra ở Node) | Trung bình × Trung bình | Tiêu chí 9 là grep chạy được trong review; spec ghi luật. |

## Rollback

Revert commit; caller duy nhất (phase 05) chưa vào.

## Commit

`feat(convention): add a thin Node client over the host convention command`

## Hiệu chỉnh sau red-team (2026-10-06)

Mục này **thắng** nội dung cũ của phase khi mâu thuẫn. Bằng chứng đã được lead tự đo lại (script hoặc `rtk proxy`), chi tiết ở bảng Red Team Review trong `plan.md`.

- **Chỉ xuất `conventionCheck`** (`conventionName` và `conventionPath` không có nơi gọi nào: Phase 07 tự ghi không có JS nào sinh tên báo cáo).
- **Nhận biết host cũ bằng tín hiệu có cấu trúc, không bằng chuỗi con của stderr:** `invokeHost` hiện coi stderr chứa cả `unknown` và `subcommand` là `host-version-mismatch` (`src/util/host-bin.mjs:95`), nên một tên file hay một lỗi gõ sai lệnh con trên host mới có thể tắt chốt chặn trong lặng lẽ. Dùng khớp chính xác `unknown verb "convention"`, hoặc dò danh sách verb của `fgos version`.
- **Bảng quyết định cho mọi mã lỗi** của `invokeHost` (`host-unavailable`, `host-version-mismatch`, `host-exec-error`, `host-invalid-envelope`, thoát 1): mỗi mã một quyết định cảnh báo hoặc bỏ qua, ghi trong spec. Thêm `timeout` cho `execFileSync` để một host treo không treo mọi `git commit`.
- Hôm nay chốt chặn **không chặn gì trên máy này**: host tìm qua activation của main checkout (`src/util/host-bin.mjs:18-35`) là release 2026-10-04 chưa có verb `convention`. Tiêu chí "pre-commit chặn" chỉ đúng sau khi stage lại hoặc khi đặt `FGOS_HOST_BIN`; nêu rõ điều này.
