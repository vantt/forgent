# Hướng dẫn: máy của anh sau khi T9 (Host và Surface) vào main

Dành cho: anh (owner). Người viết: COOK. Trạng thái: **chưa áp dụng**. T9 đã nằm trên main (commit `2788a0d0f`, CI và Release assets check xanh) nhưng **không có trong rc.8**; rc.8 được cắt trước đó. Các thay đổi dưới đây đến máy anh cùng bản phát hành đầu tiên cắt sau rc.8 (chưa có tag, tên tag do HARDEN đặt). Hướng dẫn nâng lên bản đó là `guide-261113-2007-owner-machine-upgrade-rc8.md` (đổi tag cho đúng); tài liệu này chỉ nói **phần khác** so với rc.8.

HARDEN và COOK không tự sửa tệp cấu hình nào của anh (`~/.fgos/`, `~/.fgos/private/`). Các bước dưới chưa chạy thử trên máy nào, vì bản phát hành chứa T9 chưa có.

## 1. Cái gì đổi, nói với anh

| Thay đổi | Ảnh hưởng tới anh |
|---|---|
| **`fgos preflight` bị bỏ** (quyết định 81 Q1) | Lệnh này giờ báo "unknown verb" như mọi lệnh lạ. Trong repo fgOS dùng `npm run check:before-merge` (ba kiểm tra: lệch skill wrapper, lệch trích dẫn quyết định, đối chiếu backlog). Script hay hook nào của anh còn gọi `fgos preflight` phải đổi. |
| **Doctor nhanh hơn, còn 109 dòng** | Mỗi lệnh gọi hook shim chỉ thử một lần mỗi lần chạy, ba câu hỏi plugin của `claude` chạy song song. Đo khi máy đang tải: 2 052 ms xuống 1 450 ms. Dòng `agent-claims-resolve` bị bỏ (từ 110 xuống 109), vì một dự án không tự đưa task-spec; `npm test` đã kiểm bản cài. `agent-type-names-unique` chỉ xét các tầng của chính dự án. |
| **Timer đồng bộ thư mục mail chỉ dùng host của bản đang kích hoạt** | `fgos doctor --fix` không còn ghi vào unit một script trong checkout, bản cài trong dự án hay `fgos` nào PATH tìm thấy; nó chỉ ghi shim cài đặt của dự án hoặc host của bản đang kích hoạt. Nếu đường dẫn dự án, binary hoặc remote có `%` hay ký tự điều khiển, nó từ chối: lúc kiểm báo cảnh báo, lúc `--fix` bỏ qua. |
| **Doctrine của domain chỉ đọc từ bản cài** (quyết định 79 Q4) | Thư mục `domains/` của một dự án không còn được đọc: định nghĩa agent, roster, mẫu prompt, doctor và sổ đăng ký Work đều lấy từ bản fgOS đang chạy. `fgos agents list` luôn liệt kê các persona domain đã cài, bỏ qua `domains/` của dự án, và mục `masked` chỉ còn persona **core** bị che bởi một dự án có `core/agents` riêng. |
| **`compiled.json` có số phiên bản hợp đồng** | Đọc phiên bản lạ sẽ từ chối theo tên. `npm run build:domains` ghi lại các tệp này. Chỉ liên quan đến người dựng release. |
| **Lệnh sai tham số ghi đúng loại lỗi** | Việc nội bộ (`withFaultClass`); anh không thấy gì khác. |

## 2. Việc anh làm

1. **Sau khi nâng bản (mục 3 của guide rc.8), chạy `fgos doctor` ở mỗi dự án.** Mong đợi 109 dòng, `ok: true`. Không còn dòng `agent-claims-resolve`.
2. **Máy nào đang chạy timer đồng bộ mail** (cài bằng `fgos doctor --fix` ở lần trước): chạy `fgos doctor` rồi `fgos doctor --fix` một lần để unit được ghi lại theo quy tắc mới. Nếu doctor báo cảnh báo về timer, đọc dòng đó: nó nêu đúng giá trị bị từ chối.
3. **Tìm chỗ còn gọi `fgos preflight`** trong script hoặc ghi chú của anh: `grep -rn "fgos preflight" ~/<thư mục script của anh>`. Đổi sang `npm run check:before-merge` nếu là repo fgOS, còn lại bỏ.
4. **Dự án nào có `domains/<tên>/AGENTS.md` hay `domains/*/agents` riêng** sẽ không còn được đọc. Kiểm: `ls <dự án>/domains 2>/dev/null`. Nếu có và anh đang dựa vào nó thì báo HARDEN trước khi nâng; đây là thay đổi hành vi có chủ đích (một dự án không tự đưa doctrine của domain), không phải lỗi.

## 3. Quay lại

Cùng đường như guide rc.8: `fgctl repair` kích hoạt lại bản trước (`previousArtifactDigest`), rồi `fgctl verify` và `fgos doctor`. Chưa thử xem timer đã ghi lại theo quy tắc mới có chạy với bản cũ không; nếu doctor báo timer lạ sau khi quay lại, chạy `fgos doctor --fix` một lần nữa.

## 4. Kết quả chạy thử

Chưa có. Điền sau khi bản phát hành chứa T9 được kích hoạt trên fg-server2: ngày, tag, `fgos doctor` (số dòng, cảnh báo), `fgos agents list`, và timer sau `--fix`.

## Câu hỏi còn mở cho anh

1. Có dự án nào của anh dựa vào `domains/` riêng (mục 2.4) không? Nếu có, HARDEN cần biết trước khi cắt bản phát hành.
