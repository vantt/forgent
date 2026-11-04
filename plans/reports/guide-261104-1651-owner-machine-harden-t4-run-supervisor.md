# Hướng dẫn cho máy owner: làm cứng run supervisor và launch gate (T4)

Hướng dẫn này áp dụng cho máy owner và máy thứ ba. Mỗi phase của T4 có một mục riêng. fg-server2 đã tự land và đã chạy cổng cho từng phase. Anh chọn giờ cập nhật; nên cập nhật một lần sau khi P07 land. Mục P07 sẽ được thêm vào sau và có một bước kiểm trước khi cập nhật.

Plan: [`plans/261103-1347-harden-t4-run-supervisor`](../261103-1347-harden-t4-run-supervisor/plan.md).

## Đã land trên main

| Phase | Commit | Thay đổi người dùng thấy |
|---|---|---|
| Giới hạn idle của pane | `16150dca1` | Một seat chạy trong pane mà màn hình không có chữ mới trong 20 phút thì bị dừng. Spinner và đồng hồ không còn được tính là đang làm việc. |
| P03 gate một cửa | `fa9e84c1c..8e0f53264` | Agent không chạy được: mã thoát 127 chỉ khi thiếu chương trình, các trường hợp khác là 126. |
| P02 một chỗ quyết outcome | `0c1e509e2..231c91f51` | Receipt ghi rõ nhà cung cấp dừng vì hết lượt hay hết đăng nhập (`reason`), và ghi tên file kết quả mới nhất (`outboxResult`). Bước settle không còn tự đọc màn hình. Lần chạy hết lượt được báo là giới hạn nhà cung cấp, kèm giờ reset nếu màn hình có in. |
| P05 phía controller | `864a390fd..23740e065`, `fab7438dd` | Ctrl-C trong lúc đang khởi chạy huỷ attempt ngay. Chờ supervisor nhận việc tối đa 45 s. Adapter `http`, `via: api` và đường chạy không qua supervisor đã bị xoá; executor dùng adapter không chạy được dưới supervisor bị từ chối với mã `supervised-adapter-required`. |
| P04 một bước theo dõi gate | `fad7e0fab` | File `supervisor-heartbeat.json` không còn được ghi. File do agent ghi được đọc an toàn: không đi theo symlink, không treo khi gặp FIFO. |
| P01 adopt giữ quyền | `3a940e2a8` | `fgos doctor` của lớp này còn 5 dòng: `run-supervisor-route` (gồm containment), `runtime-socket-dir`, `run-attempts-stuck` (gồm unit chờ resume), `run-supervisor-config` (gộp `gate-kill-grace` và `cancel-wait`), `legacy-attempts-stuck`. Attempt mà release viết ra nó đã bị xoá giờ chỉ cảnh báo, không còn là lỗi. |
| P06 cấu trúc test | `4e86aec63`, `1dc20857b` | Chỉ test và một dòng spec, không cần làm gì. |

Ngoài các phase: `c37d76811` format toàn bộ Rust (không đổi hành vi). Hai hồi quy do lần format này đã được sửa: `45e07caf2` (bộ quét census) và `b6260e061` (một test).

## Cập nhật

1. Chờ không còn `fgos run` hay dispatch nào đang chạy trên máy.
2. Kéo main về: `git pull --rebase`.
3. Build, stage và kích hoạt release như thường lệ. Lệnh `fgos` thường chạy release đã kích hoạt, nên chỉ có hành vi mới sau bước này.
4. Chạy `fgos doctor </dev/null` trên từng workspace.

Đợt này không đổi file config. Hai key `dispatch.gateKillGraceMs` và `dispatch.cancelWaitMs` vẫn giữ nguyên; chỉ có tên dòng doctor báo chúng là đổi.

## Doctor sau cập nhật

- `run-supervisor-route`: pass, kèm tên driver containment. Trên Linux không có user namespace thì là cảnh báo `best-effort`.
- `runtime-socket-dir`: pass.
- `run-attempts-stuck`: pass. Nếu nó cảnh báo một attempt có release đã bị xoá, đó là attempt cũ; cách xử lý được ghi ngay trong dòng cảnh báo.
- `run-supervisor-config`: pass, kèm hai giá trị và nguồn của từng giá trị.
- `legacy-attempts-stuck`: pass. Dòng này sẽ bị xoá ở P07.

Các dòng `process-containment`, `gate-kill-grace`, `cancel-wait`, `units-awaiting-resume` không còn xuất hiện; đó là đúng.

## Định dạng trên đĩa

- Receipt có thêm trường `outboxResult` và thêm giá trị cho `reason`. Đây là phần thêm vào; release trước bỏ qua trường lạ.
- `supervisor-heartbeat.json` không còn được ghi. Trước đây cũng không có gì đọc file này.

## Cách quay lại

1. Chờ không còn dispatch nào đang chạy.
2. Kích hoạt lại release trước đó.
3. Nếu cần quay lại cả mã nguồn, revert các commit trong bảng trên main theo thứ tự ngược lại.

Release trước đọc được receipt do release mới viết, vì phần đổi chỉ là phần thêm vào.
