# Hướng dẫn cho máy owner: lệnh `fgos` khởi động nhanh hơn (30/10)

Hướng dẫn này áp dụng cho máy owner và máy thứ ba. Máy fg-server2 đã chạy `npm test` đầy đủ trên đúng commit này.

## Đã land trên main

Gồm hai commit:
- `5933ef76c`: `bin/fgos.mjs` chỉ nạp module của các verb dispatch, merge, discover/plan, worktree, gateway, setup và doctor khi một trong các verb đó chạy. Test kiến trúc giờ kiểm cả các chỗ `import()`, nên phần nạp muộn vẫn phải theo luật phân tầng.
- `61e7d56fe`: thêm một dòng vào `CHANGELOG.md`, mục `[Unreleased]`.

Trên fg-server2 lúc máy rảnh, lấy trung vị của 5 lần chạy:
- `--help`: 115 ms → 74 ms
- `list --help`: 111 ms → 77 ms
- `list` khi lỗi: 114 ms → 74 ms

Verb cần runner (`run`, `dispatch`, merge) gần như không nhanh hơn, vì module của nó vẫn phải nạp, chỉ là nạp lúc verb chạy. `internal attempt-step` không đổi, vì host chạy thẳng file của nó chứ không đi qua `bin/fgos.mjs`.

## Cập nhật

1. Kéo main về: `git pull --rebase`.
2. Build, stage và kích hoạt release như thường lệ. Lệnh `fgos` thường chạy release đã kích hoạt, nên chỉ nhanh hơn sau bước này.
3. Chạy `fgos doctor </dev/null`.

Đợt này không đổi file config, không đổi định dạng dữ liệu trên đĩa, và không đổi Rust.

## Kết quả gate trên fg-server2

`npm test`: 8786 pass, 0 fail, 34 skip, không có dòng ERROR. Không chạy `cargo test`, vì đợt này không đổi Rust.

## Cách quay lại

Revert `5933ef76c` trên main, rồi kích hoạt lại release trước đó.
