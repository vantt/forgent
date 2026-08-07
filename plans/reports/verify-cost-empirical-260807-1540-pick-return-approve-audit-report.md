# Chi phí verify thực đo — pick/return/approve (tsk-vms)

Nguồn: `.fgos/events.jsonl` (9331 dòng tại thời điểm chạy). Số liệu thật, không suy đoán — xem `docs/history/tsk-vms-verify-cost-audit/` cho phương pháp đầy đủ.

## (1) Số vòng pick trên một item, tới khi delivered

- Item đã từng delivered: **181**. Trung bình **3.10** vòng pick, trung vị **3**, min **1**, max **25**.
- Pick đầu (từ `todo`): **316**. Pick lại sau blocked (từ `blocked`/khác): **246**.
- Phân phối: 1 pick — 63 item; 2 pick — 24 item; 3+ pick — 94 item.
- Item CHƯA từng delivered (đang mở/blocked/wontfix, không tính vào trung bình trên): **188**, trung bình **2.16** vòng pick tính tới hiện tại.
- Claim với `role:'runner'` tìm thấy trong log: **0** (0 nghĩa là toàn bộ dữ liệu là pull-door thật, xác nhận thực nghiệm CONTEXT.md).

## (2) Số vòng return, % trả về blocked

- Tổng vòng return: **425** (`from:'doing'` → `blocked`/`awaiting-approval'`).
- Về `blocked`: **59** (**13.9%**). Về `awaiting-approval`: **366** (**86.1%**).
- Trung bình mỗi item có return: **1.23** vòng, trung vị **1**.

### Approve rounds (bổ sung, không nằm trong "return" nhưng cùng vòng đời)

- Tổng: **256**. Về `delivered`: **175**. Về `blocked`: **81** (**31.6%**).
- Nguyên nhân blocked ở approve (từ `reason`): `merge-conflict`: 32, `verify-fail`: 7, `verify-fail-post-merge`: 22, `integration-drift`: 10, `fgos-write-rejected`: 3, `merge-failed-unclassified`: 7.

## (3) Phân bổ nguyên nhân thất bại thật (work.friction.errorClass)

- Tổng bản ghi friction: **138**.
  - `verify-miss`: 85 (61.6%)
  - `merge-conflict`: 41 (29.7%)
  - `merge-failed-unclassified`: 7 (5.1%)
  - `fgos-write-blocked`: 4 (2.9%)
  - `worker-timeout`: 1 (0.7%)
- Disposition: `parked`: 4, `blocked`: 134.

- **Tách timeout khỏi verify-fail thật trong `verify-miss` (suy luận từ `detail`, KHÔNG phải field gốc — xem CONTEXT.md):** timeout nghi vấn (`detail` khớp `"(exit null)"`) — **1**; verify-fail thật (`detail` có exit code cụ thể) — **84**. Tổng hai số này bằng đúng số `verify-miss` ở trên (kiểm chứng nội bộ).
- `worker-timeout` là một errorClass RIÊNG (không phải từ `return`, mà từ một dispatch executor khác) — không cần suy luận, đọc thẳng: 1 bản ghi.
- "Worktree lệch" (tsk-2cd) không có tín hiệu cơ học trong log — không đếm được, chỉ đối chiếu định tính bằng id/thời điểm với các bug đã biết (tsk-2cd, tsk-53o).

## (4) Số lần chạy full verify (npm test) — tổng và ước lượng

- Tổng số lần chạy full verify trên toàn bộ log: **681** (từ return: 425, từ approve: 256).
- fromApprove giả định mọi approve chạy lại verify cục bộ (đúng khi không dùng --github); log không phân biệt được approve --github (không chạy verify cục bộ) khỏi approve nội bộ ở transition to:delivered — số liệu này có thể hơi CAO hơn thực tế nếu từng có approve --github, không phải cận dưới.
- Thời lượng mỗi lần chạy KHÔNG được suy ra từ chênh lệch timestamp trong log (nhiễu bởi thời gian người suy nghĩ giữa các bước) — dùng khung 161–370s đã biết (mô tả item gốc) làm hệ số nhân định tính, không phải số đo trực tiếp.

## Giới hạn dữ liệu (nêu thẳng, không giấu)

- Heuristic tách timeout dựa trên chuỗi `detail`, không phải field gốc — nếu format `detail` từng đổi ở một phiên bản code cũ, có thể sai lệch nhẹ.
- Số lần approve chạy verify cục bộ có thể hơi CAO hơn thực tế nếu có approve từng dùng `--github` (log không phân biệt được).
- "Worktree lệch" không đếm được cơ học từ log — chỉ liệt kê định tính.

## Không thuộc phạm vi báo cáo này

Báo cáo này KHÔNG kết luận về câu hỏi D7 (DISCUSSION.md dòng 34) hay về `parallel.maxRoots`/`maxLeavesPerRoot` trong `.fgos-runner.json` — chỉ cung cấp số liệu làm input cho phiên quyết định riêng.
