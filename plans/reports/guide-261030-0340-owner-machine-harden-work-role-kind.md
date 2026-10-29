# Hướng dẫn cho máy owner: loại role `work:<tên>` (30/10)

Hướng dẫn này áp dụng cho máy owner và máy thứ ba. Máy fg-server2 đã chạy full gate trên đúng commit này.

## Đã land trên main

Một commit: `6f6e1f257`, theo quyết định 52 trong plan HARDEN.

Một agent chỉ làm một việc, không phải lead của một lane, giờ nhận role bằng `fgos identity session --role work:<tên> [--take]`. Role này dùng chung với `lead:<LANE>`:
- cùng trường `roles`;
- cùng luật mỗi role chỉ một phiên còn sống giữ;
- cùng `--take` để lấy role khỏi một phiên đã đứng;
- cùng `fgos identity resolve`;
- cùng địa chỉ trong `fgos mailbox send --to work:<tên>`.

Dòng này đã có trong `CHANGELOG.md`, mục `[Unreleased]`.

## Cập nhật

1. Kéo main về: `git pull --rebase`.
2. Build, stage và kích hoạt release như thường lệ.
3. Chạy `fgos doctor </dev/null`.

Đợt này không đổi file config, không đổi định dạng dữ liệu trên đĩa, và không cần bước nào trước khi chạy release mới.

Một máy còn chạy release cũ vẫn đọc được role `work:` do máy khác ghi: nó coi role đó là một chuỗi bình thường, nên chạy lẫn hai phiên bản không làm hỏng gì. lead:ES đã kiểm điểm này.

## Kết quả gate trên fg-server2

- `npm test`: 8787 pass, 0 fail, 34 skip.
- `cargo test --workspace`: 2010 pass, 0 fail.

## Cách quay lại

Revert `6f6e1f257` trên main, rồi kích hoạt lại release trước đó.

Một phiên đang giữ role `work:` sẽ không `resolve` được role đó nữa. Phiên ấy nhận lại một role `lead:` hoặc bỏ role đi.
