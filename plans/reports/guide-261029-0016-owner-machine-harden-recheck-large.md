# Hướng dẫn cho máy owner: các commit HARDEN ngày 28–29/10

Hướng dẫn này áp dụng cho máy owner và máy thứ ba. Máy fg-server2 đã kiểm xong.

## Đã land trên main

- **Lô A của vòng soát T0–T3:** khoảng `d52b65f74^..df2428181`, 22 commit.
- **Ba câu Q1–Q3 owner chọn «a a a»:** khoảng `ffec96b7e^..bf1362808`, 11 commit.
  - Q1: xoá thao tác checkpoint Git và cutover grant.
  - Q2: chuyển chỗ đọc `.git` của confinement sang cổng Git.
  - Q3: host đăng ký stream Identity qua manifest consumer.

## Bước bắt buộc trước khi chạy release mới

Release mới không còn đọc được một thao tác Git đang dở nếu thao tác đó được ghi kèm một grant thật. Chỉ lệnh `fgos events migrate` cũ từng ghi kiểu này. Trước khi stage hoặc kích hoạt release mới, chạy trong checkout chính:

```sh
d="$(git rev-parse --git-common-dir)/fgos/git/operations"
grep -rl legacyRefOid "$d" | wc -l
```

- **Kết quả 0:** đi tiếp. Trên fg-server2 kết quả là 0 trong 598 thao tác.
- **Kết quả lớn hơn 0:** chưa cập nhật. Dùng release hiện tại chạy `fgos doctor --fix </dev/null` (mục sửa `git-land-recovery` khôi phục các thao tác Git còn dở), rồi grep lại cho tới khi ra 0.

## Cập nhật

1. Kéo main: `git pull --rebase`.
2. Build, stage và kích hoạt release như thường lệ.
3. Chạy `fgos doctor </dev/null`.

Các thay đổi trong đợt này không đổi file config và không đổi định dạng dữ liệu trên đĩa. Riêng bản ghi WAL Git vẫn đọc được bản cũ có `"cutoverGrant": null`.

## Lưu ý

- **Commit Git từ fgOS:** hook commit không còn nhận `-c fgos.operationId`. Hook của repo này không dùng tới giá trị đó.
- **Thao tác Git làm dở:** nếu một commit đang dở lúc nâng cấp và được thử lại với cùng mã thao tác, nó sẽ bị từ chối với lỗi `operation-id-reused`. Khi đó chạy `fgos doctor --fix </dev/null`.

## Cách quay lại

Revert hai khoảng commit ở phần đầu trên main, rồi kích hoạt lại release trước đó.
