# Phase 01: đo trên herdr thật

Wave 1. Nhánh `terminal-control/p01-measure`, worktree `.claude/worktrees/tc-p01`. Phụ thuộc: P00. Cần máy có herdr và đủ 5 CLI (claude, codex, agy, pi, omp) đã đăng nhập — máy của anh. Mọi tab đo tự tạo rồi đóng (như `probe_herdr_geometry.py`, r6 §12.8); không chạm pane của người.

## Câu hỏi và cách đo

| # | Câu hỏi | Cách đo | Ra gì |
|---|---|---|---|
| 1 | Socket herdr nằm đâu, lấy pid server thế nào | Đọc env pane (`HERDR_SOCKET`?, `HERDR_SESSION`), `herdr --help`/`herdr server …`; `connect` + `SO_PEERCRED` bằng script Python nhỏ | Nguồn `serverIncarnation` cho driver (D1); có/không cách gắn incarnation vào `pane close` |
| 2 | JSON của `herdr pane layout`, `tab list`, `tab get`, `pane list`, `pane process-info`, `pane split` | Chạy từng lệnh trên tab đo, lưu nguyên văn | Fixture cho P03 (đặt vào `packages/terminal-control/rust/tests/fixtures/herdr/`) |
| 3 | Pane cuối đóng → tab tự xoá? Neo chết → lỗi `pane_not_found`? | Lặp lại 2.4 của hội đồng trên herdr hiện tại | Xác nhận luật 7.4 còn đúng với bản herdr đang cài (ghi version) |
| 4 | Kích thước nhỏ nhất mỗi CLI còn hiện đủ prompt + paste-chip | Mỗi CLI: mở pane, thu nhỏ dần (`pane resize` nếu có, không thì tách), gửi brief mẫu, xác nhận bằng regex hôm nay (`PASTE_CHIP_RE`, [`herdr-round.mjs:1040`](../../src/runner/dispatch/herdr-round.mjs)) và fixture màn hình 2.4 | `minCols`, `minRows` mặc định (D6) = max của 5 CLI |
| 5 | Ánh xạ thao tác agent của herdr | Liệt kê mọi method của [`createHerdrClient`](../../src/runner/dispatch/herdr-agent.mjs) (`:91-430`) và lệnh herdr thật nó gọi | Bảng method → op cổng (đầu vào P06) |
| 6 | Chi phí một lệnh herdr CLI | 200 lần `pane list` | p50/p95 (để P05 cộng chi phí route) |

## File sở hữu

| Hành động | File |
|---|---|
| tạo | báo cáo đo (đường dẫn bằng `fgos convention path`, loại report) kèm JSON nguyên văn |
| tạo | `packages/terminal-control/rust/tests/fixtures/herdr/*.json` |
| tạo | script đo dưới `.fgos/runtime/tmp/` (không commit) |

## Tiêu chí nghiệm thu

Sáu câu có câu trả lời đo được hoặc ghi "không đo được + lý do"; bảng mặc định `minCols/minRows/maxPanesPerTab` có nguồn. Nếu câu 1 không có cách lấy pid server: báo Lead trước khi P03 chốt phần incarnation (P03 khi đó dùng `server.incarnation = unsupported` → mọi `close` cần kiểm incarnation trả `unknown`… điều này chặn đóng pane: Lead quyết, có thể hỏi kongming).

## Rollback

Không đổi code production.
