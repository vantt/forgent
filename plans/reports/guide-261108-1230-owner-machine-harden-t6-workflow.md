# Hướng dẫn cho máy owner: làm cứng Workflow (guide và case), T6

Hướng dẫn này cho máy owner và máy thứ ba (forgentX, mdview, mcp-skill-hub). fg-server2 tự land từng phase của T6 (quyết định 71, 7a). Mỗi phase land thêm một mục bên dưới; P15 hoàn thiện hướng dẫn khi đóng T6. Plan: [`plans/261108-0934-harden-t6-workflow`](../261108-0934-harden-t6-workflow/plan.md).

Các mục của P01 (đồng ý và biên nhận gate) và P02 (bỏ bước `integrate` của Playbook) đã land trước khi hướng dẫn này được mở; HARDEN lead hoặc P15 bổ sung hai mục đó từ board.

## P03: một bộ đọc case, một cửa đường dẫn run, ghi bền cho ledger

- **Commit trên main:** khoảng `639bf6986..b353b95bf` (refactor, báo cáo, thông báo `invalid-case-id` nêu mã).
- **Người dùng thấy gì:**
  - `fgos workflow status|close|answer|...` từ chối id không phải một đoạn đường dẫn case (ví dụ `../x`, `.bindings`) bằng tên: `"../x" is not a case id (invalid-case-id)`, trước khi tạo bất kỳ đường dẫn nào. Trước đây `.fgos/workflow-runs/.bindings/advance.lock` từng được tạo vì lỗ này.
  - Một dòng ledger mà đĩa chỉ ghi một phần được ghi nốt; không ghi được byte nào thì từ chối `ledger-short-write` (đuôi dang dở được holder `advance` kế tiếp gỡ như trước).
  - `status` và `doctor` đọc khi một tiến trình khác đang append sẽ đọc lại tối đa 3 lần thay vì báo lỗi; ledger hỏng giữa file vẫn từ chối ngay.
  - Không đổi byte nào trên đĩa: 54 ledger thật trên fg-server2 cho kết quả gấp (fold) giống hệt trước và sau.
- **Lệnh trên từng workspace:** `git pull --rebase`; build, stage và kích hoạt release như thường lệ (mdview, mcp-skill-hub rồi forgentX); `fgos doctor </dev/null`. Trên fg-server (`~/projects/forgent`) làm tương tự.
- **Doctor mong đợi:** không có dòng mới; các dòng workflow-case và holder-lock `advance` đọc cùng thư mục như trước.
- **Kiểm nhanh:** `fgos workflow status <run mới nhất>` in trạng thái; `fgos workflow close ../x` bị từ chối `invalid-case-id`.
- **Quay lại:** revert hai commit; không có thay đổi trên đĩa nên release cũ đọc được mọi thứ release mới ghi.
