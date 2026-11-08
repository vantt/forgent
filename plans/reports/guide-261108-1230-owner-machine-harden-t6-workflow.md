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

## P08: giữ custody worktree trước khi case đặt chỗ, ghim account của Workflow, đọc một seat

- **Commit trên main:** `2465e26c8`.
- **Người dùng thấy gì:**
  - `fgos run --case` ghi vào worktree mà tiến trình khác đang giữ bị từ chối `dispatch-in-flight` ngay, trước khi case đặt chỗ; không còn reservation treo chờ trả lại `not-started`.
  - Một account mà chỉ Workflow ghim và không seat nào của unit nhận thì unit chạy không ghim (provenance của seat ghi lý do); `fgos run --account` vẫn bị từ chối như trước.
  - `unit-run:<id>/<seat>` chỉ đọc kết quả của đúng seat đó, không đọc cả thư mục run.
  - Không đổi byte nào trên đĩa.
- **Lệnh trên từng workspace:** `git pull --rebase`; build, stage, kích hoạt release như thường lệ; `fgos doctor </dev/null`. Kích hoạt khi không có `fgos run --case` nào đang chạy (một run bản cũ đang ở giữa đặt chỗ và custody sẽ để lại reservation với custody trống).
- **Doctor mong đợi:** không có dòng mới.
- **Kiểm nhanh:** giữ custody một worktree ở tiến trình khác, chạy `fgos run --case <id> --writes <path>` ở đó: bị từ chối, `fgos workflow status <case>` không có reservation mới.
- **Quay lại:** revert; không có thay đổi trên đĩa. Nếu bản release của P04 đã land, revert commit release của P04 trước (nó dựa vào thứ tự này).

## P07: lối vào của conductor (propose đọc mỗi ledger đã đóng một lần, một bộ so glob, một chỗ kiểm hình dạng slice)

- **Commit trên main:** `a7b70d50f..bb388da2e` (commit đầu là bằng chứng đỏ, hai commit sau là thay đổi và baseline test).
- **Người dùng thấy gì:**
  - `fgos workflow propose` nhanh hơn rõ rệt trên checkout có nhiều ledger Playbook (55 ledger trên fg-server2: 3,9 s xuống 0,35 s cùng tải); không đổi byte nào trên đĩa.
  - Đường ghi có dấu `\`, bắt đầu bằng `:` hoặc `**` trong tên bị từ chối ngay lúc phân loại với mã `slice-write-invalid` (trước đây `write-path-invalid`); `.` được đọc như `**` và bị từ chối vì chạm `.git`.
  - Đường ghi có `?` không còn bị coi là ký tự đại diện khi so chồng lấn giữa các slice.
  - Slice chỉ đọc có `capability` hoặc `pattern` sai kiểu bị từ chối `slice-invalid` thay vì làm sập propose.
- **Lệnh trên từng workspace:** `git pull --rebase`; build, stage, kích hoạt release như thường lệ; `fgos doctor </dev/null`. Không có yêu cầu thứ tự kích hoạt.
- **Doctor mong đợi:** không có dòng mới.
- **Kiểm nhanh:** `fgos workflow propose --slices <file> --plan <plan> --json` trả lời trong dưới một giây.
- **Quay lại:** revert hai commit sau cùng (thay đổi và baseline); không có thay đổi trên đĩa.
