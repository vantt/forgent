# Council: nhận diện hết hạn mức ở cửa dispatch

Ngày: 2026-10-14. Lane C, đề xuất 7. Hình thức: `fgos-architecture-panel` (`architecture-advisory` rồi `architecture-advisory-reopen`). Chỉ tư vấn, không phải lệnh triển khai.

## Các lượt chạy

| Bước | Unit run | Kết quả |
|---|---|---|
| framing | `unit-run-1791949049231-c85629ae` | pass |
| shaping (3 panelist mù + synthesizer) | `unit-run-1791949146687-89aeb9f5` | pass (claude, openai, gemini, xai) |
| critique | `unit-run-1791949420784-be623cf6` | producer r1 pass, reviewer r1 findings, producer r2 **policy-refusal `read-only-mutation`** |
| synthesis (reopen `wf-run-1791949883129-135c25c8`) | `unit-run-1791949883982-8247182c` | producer r1/r2 pass; reviewer + red-team r1 findings; reviewer + red-team r2 **execution-failure** |

Workflow gốc `wf-run-1791949048629-6a0f38c5` dừng ở critique. Reopen dừng ở synthesis vòng 2. Không có bước explanation và cổng close.

**Vì sao hai lần dừng (proven, không phải do panel):**

- critique r2: chính em (lane C) ghi hai file test đỏ chưa commit vào worktree đích trong lúc vòng read-only chạy. `evidence.json` liệt kê đúng `test/runner/dispatch.test.mjs` và `test/runner/execution/run-provider-failover.test.mjs` (`new-dirty-after-run`, `coverageMatched: false`). Từ đó reopen chạy trên worktree sạch `dispatch-usage-limit-panel`.
- synthesis r2: stderr ghi "wrote outside its workspace … these paths became dirty in /home/vantt/projects/forgentX during the round: plans/261014-1033-dispatch-operator-improvements/reports/". Một phiên khác (lane khác) ghi báo cáo vào main checkout, và việc ghi đó bị gán cho seat openai. Đây đúng là lỗi đề xuất #8 (lane D) đang nói tới.

Hệ quả: packet cuối (synthesis producer r2) đã sửa đủ mọi finding của reviewer/red-team vòng 1. Nhưng reviewer và red-team **chưa kiểm lại** packet r2 (gap, UNPROVEN).

## Packet cuối (tóm tắt)

Nguồn: `.fgos/assignments/unit-run-1791949883982-8247182c/producer/2/runs/01/outbox/report-1.md`.

**Đúng với mọi hình dạng cửa:**

- A1: một lượt exit khác 0 mà không có claim hoàn thành thì không bao giờ mang nghĩa "suy ra xong từ HEAD", bất kể nguyên nhân. Dùng `nonzero-process-exit` thay cho `unsignaled`. Giữ head before/after, thêm `branchAdvanced` làm bằng chứng để resume.
- A2: hết hạn mức là `provider-limit` với `cause: 'quota'` (cạnh `credential`), không thêm outcome `usage-limited`. Tách hai mốc thời gian:
  - `retryAt` = giờ reset do provider ghi, null khi không ghi. Không bao giờ lấy TTL 1 giờ nội bộ.
  - Mốc "đủ điều kiện chạy lại" của một run đã cạn, luôn kèm `basis: provider-reset | internal-ttl`.
- A3: process mà caller chờ phải thoát khác 0 khi lượt không xong. Mọi mã khác 1 phải đăng ký vào `EXIT_CODES` (`src/state/store.mjs`) và `docs/io-contract.md`.
- B1: một classifier stderr thuần, không import, dùng chung cho mọi đường post-exit (raw execute cli-spawn, settlement, `classifyProviderCapacityFault`). Điều kiện: exit khác 0, không timeout, không claim, kiểm auth trước, câu chữ đã đo neo `^ERROR:` trong 5 dòng cuối. Hai parser reset chuyển vào đây. Xoá regex OpenAI quét cả stderr ở `provider-capacity.mjs:1209`.
- B2: không có account thì không quarantine. Danh sách màn hình herdr giữ riêng; nó chỉ dùng chung kiểu kết quả và parser reset.
- C1: không xây scheduler. Thứ tự là xoay account, rồi candidate kế (0058), rồi mới chờ. Run cạn báo mốc đủ-điều-kiện kèm basis. Với unit run, mốc này lưu trong run record và hiện trong status/stale.
- C2: "nhánh đã tiến nhưng dừng" không bao giờ là "xong". Retry phải resume trên nhánh đã tiến, và cần test.

**Phụ thuộc kết luận một-cửa:**

- Vị trí trong envelope và tên trường (A-shape).
- Giá trị mã thoát (A-exit).
- Cách mỗi cửa nhận biết "không claim" (B-claim).
- Chỗ quarantine (B-quarantine).
- Ai giữ `retryAt` (C-holder).

**Bất đồng còn mở:**

- panelist-2 đề xuất envelope hai trục `completion` / `providerDisposition`. Đây là phương án duy nhất đóng lớp lỗi đọc nhầm ngay từ contract.
- Mã 75 hay chỉ khác 0.
- Phạm vi mốc đủ-điều-kiện: chỉ candidate đã thử, hay mọi provider.

**Rủi ro còn lại:**

- Codex có thể in dạng reset theo ngày/tuần mà mới có một mẫu đo. Nếu đúng vậy, account bị thử lại mỗi giờ.
- Parser giờ phụ thuộc múi giờ máy.
- Resume sau commit dở chưa có cơ chế.
- Run chạy không người canh mà cạn account thì không ai đánh thức.

**Thiếu chuyên môn:** định dạng thông báo hạn mức của codex qua các cửa sổ ngày/tuần/có ngày tháng, đo thêm ngoài mẫu turn-07.
