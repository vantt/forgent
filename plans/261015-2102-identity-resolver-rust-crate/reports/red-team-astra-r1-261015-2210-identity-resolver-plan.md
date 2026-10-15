# Red-team Astra vòng 1: plan identity resolver sang Rust

- Ngày: 2026-10-15. Executor `openai` (gpt-6-astra, account tetcu72) qua herdr, `--rigor critical --effort high`, unit run `unit-run-1792074701667-7608bc5c`. Report gốc: `.fgos/assignments/unit-run-1792074701667-7608bc5c/producer/1/runs/01/outbox/report-1.md` (evidence `evidence-1.json` cùng thư mục). Astra đọc plan ở `e8cce3203` (đã gồm phản biện trong phiên).
- Kết luận Astra: chưa triển khai nguyên trạng; 2 high, 5 medium. Không đề nghị đảo O1–O8. Crate/provider có thể bắt đầu sau khi sửa R1, R3.

## Xử lý

| Mã | Mức | Phát hiện | Xử lý | Ở đâu |
|---|---|---|---|---|
| R1 | high | Plan đòi `ok: true` trong envelope, nhưng `fgos.v1` không có `ok` → mọi lần ghi sẽ bị `bad-output` | **Nhận.** Kiểm exit 0 + bốn khoá envelope hiện hành; provider trả `JsonOutcome`; test qua presenter thật | P00 §6 |
| R2 | medium | Porting: hai `appendEventLocked` dùng `dirname(logPath)` = `.fgos/porting`, lệch với dir đã prime → `identity-in-lock` ở nhánh env | **Nhận.** Truyền cùng `fgosDir` cho cả lock helper và hai lần append; test porting có env id | P00 §7 |
| R3 | high | Drain chỉ cấm shell trần/pane codex; writer khác (runner, gateway, process sống lâu) vẫn mở claim hay giữ module cũ; rollback sai thứ tự | **Nhận.** Runbook quiesce có chủ thể, restart process sống lâu, kiểm claim rỗng trước khi mở lại; rollback: quiesce → drain bằng bản mới → activate bản cũ | phase 06 |
| R4 | medium | `ensureHostBin` nhận binary bất kỳ chạy được `version` → full suite có thể không chạy Rust của nhánh | **Nhận.** Phase 06 build host của checkout tích hợp, truyền đường tuyệt đối, ghi vào evidence | phase 06 |
| R5 | medium | Wrapper kiểm "lock tồn tại" sẽ đỏ khi lock thuộc process khác (hợp lệ) | **Nhận.** Đọc owner pid của lock, so với `--pid`; thêm ca tranh chấp có barrier | P00 §7 |
| R6 | medium | Windows không chạy full suite; plan chưa có proof Windows | **Nhận.** Thêm vào job `focused-tests` (có `windows-latest`); chỉ skip phần PTY/`sh` | P00 §14, phase 03 |
| R7 | medium | Doctor "resolve hai lần" trúng cache, không chạy binary activation | **Nhận.** `probeIdentity(bin, fgosDir)` không cache, doctor gọi với từng binary; ca "env mới + activation cũ" phải ra mismatch | P00 §6, §12 |

Sửa độ chính xác cũng nhận: CI runner "có thể" chung session; "2000 ms là lúc yêu cầu kill"; bộ đếm lock giữ suốt Promise; hook test cả hai cấu hình (hooksPath tuyệt đối và copy).

Không bác điểm nào. Bất đồng còn giữ: không có.

Điểm Astra xác nhận đứng vững (tóm tắt): một resolver Rust, không fallback Node; D5 mới đúng One Door; lock lồng đã đóng; cache nhánh pid theo env; O2 đúng bằng chứng codex; D2 không so `getppid()` hợp lý; B8 đóng cho identity; phân loại lỗi và sửa D9 đúng; Observe đổi shard an toàn; B6 được thu hẹp minh bạch; D8 hợp lý; cổng S6 đo thật.
