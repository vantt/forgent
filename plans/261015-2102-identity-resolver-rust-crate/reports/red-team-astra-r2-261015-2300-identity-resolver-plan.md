# Red-team Astra vòng 2 (vòng cuối): plan identity resolver sang Rust

- Ngày: 2026-10-15. Executor `openai` (gpt-6-astra, tetcu72) qua herdr, `--rigor critical --effort high`, unit run `unit-run-1792075791619-832a2a11`. Report gốc: `.fgos/assignments/unit-run-1792075791619-832a2a11/producer/1/runs/01/outbox/report-1.md` (evidence cùng thư mục). Astra đọc plan ở `5c73fcf57`.
- Kết luận Astra: R1, R2, R4, R5, R6, R7 đóng trên thiết kế; R3 đóng một phần. Ba finding mới, đều medium. Được tiếp tục phase 01/02; chốt N1, N2, N3 trước khi nối phase 03; chưa land khi R3 chưa khép.

## Xử lý

| Mã | Phát hiện | Xử lý | Ở đâu |
|---|---|---|---|
| R3 (phần còn mở) | Rollback ở hai chỗ khác thứ tự; sau khi activate bản cũ, source/hook vẫn là 5.1 nên commit trần lỗi `host-version-mismatch` | **Nhận.** Một runbook duy nhất ở phase 06: quiesce → drain bằng bản mới → revert source bằng `git commit` trần với binary mới đã pin → activate bản cũ → restart, doctor bản cũ, kiểm commit/Node trực tiếp/shim, claim rỗng. P00 chỉ trỏ tới đó | phase 06, P00 §14 |
| N1 | Khoá cache env theo realpath đổi giữa lúc prime và lúc dùng khi thư mục mới được lock helper tạo dưới symlink; lời gọi không dir chưa có khoá | **Nhận.** Khoá dir = realpath tổ tiên sâu nhất đang tồn tại + phần còn thiếu; không dir là sentinel riêng (không xác nhận registry, không suy ra cwd); test cả hai | P00 §6, §11 |
| N2 | Cho `resolveHostBin` dùng module lá có thể mất kiểm symlink-thoát-release (`e36fcc861`), đổi contract `null`/`host-unavailable`, lẫn phạm vi `packageRoot` | **Nhận, đổi cách gom.** Luật activation → binary là một hàm có kiểm containment; `resolveWorkspaceInstallationBin` giữ tên và contract nhưng gọi hàm đó, nên `resolveHostBin` và `resolveFgosBin` không đổi gì. Dạng "manifest ngay trong installation" chủ ý bỏ vì shim chưa từng chạy được dạng đó; ghi lý do khi xoá test. Hồi quy ở cửa caller thật | P00 §6, D5, phase 03 |
| N3 | Guard chỉ ở chỗ trượt cache; `probeIdentity` gọi thẳng trong lock đi vòng được | **Nhận.** Guard nằm trong `probeIdentity` trước khi spawn; bộ đếm giảm đúng một lần lúc nhả thật (sync, Promise, `releaseLock()` sớm) | P00 §6, §7, §11 |
| Phụ | P04 còn chữ "gọi facade" | **Nhận.** Sửa thành `probeIdentity` với từng binary | phase 04 |

Không bác điểm nào. Bất đồng còn giữ: không có. Theo luật tối đa 2 vòng, không chạy vòng 3; các sửa trên là đúng những gì Astra yêu cầu, không mở authority mới.
