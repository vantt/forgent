# Hướng dẫn cho máy owner: lô B của HARDEN và Event Store mở mọi repo (29/10)

Áp dụng cho máy owner và máy thứ ba. Máy fg-server2 đã chạy full gate trên đúng các commit này.

## Đã land trên main

Gồm 15 commit, khoảng `16c02ee11^..feb5e2d50`:

- **Lô B, các chỗ gọi config:**
  - addon config và CLI tìm checkout chính cùng một cách;
  - `fgos config show` và Node suy ra cùng giá trị cho `runner.executor`;
  - một quy tắc thư mục home dùng chung, có `USERPROFILE` trên Windows;
  - các mục doctor config không còn trùng nhau;
  - mặc định của Event Store và terminal đọc từ bản chuẩn đi kèm release.
- **Lô B, YAML và Node dispatch:**
  - bỏ hai hàm `insert` và `set_inline_comment` không ai gọi (quyết định 4a);
  - bỏ `resolveEnvPatch` không ai đọc.
- **Event Store:** clone của mọi repo đều mở được Event Store, store được tạo ở lần ghi đầu tiên. Dự án mới sau cutover không có file fence nên trước đây bị identity log bỏ qua; nay không còn nữa.

## Người dùng sẽ thấy gì

- `fgos config show` và `fgos config explain` hiện giá trị `runner.executor` đã dò được, khi không file nào đặt key này.
- Trên Windows, config bị từ chối và hệ thống dùng giá trị mặc định thì in một cảnh báo, một lần cho mỗi tiến trình.

Hai dòng này đã có trong `CHANGELOG.md` mục `[Unreleased]`.

## Cập nhật

1. Kéo main về: `git pull --rebase`.
2. Build, stage và kích hoạt release như thường lệ.
3. Chạy `fgos doctor </dev/null`.

Đợt này không đổi file config, không đổi định dạng dữ liệu trên đĩa, và không cần bước nào trước khi chạy release mới.

## Kết quả gate trên fg-server2

- `npm test`: 8762 pass, 3 fail. Ba test mailbox trong `test/setup/agent-hooks.test.mjs` vốn đã đỏ sẵn trên main, thuộc phần của MAIL.
- `cargo test --workspace`: 1994 pass, 0 fail.

## Cách quay lại

Revert khoảng commit ở phần đầu trên main, rồi kích hoạt lại release trước đó.
