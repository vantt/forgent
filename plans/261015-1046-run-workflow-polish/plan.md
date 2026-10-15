---
title: "Hoàn thiện và đánh bóng đường chạy fgos run và fgos workflow start"
description: "Kế thừa --timeout và --account cho workflow start, bổ sung doctor check kiểm tra posture readiness của executor, và chuẩn hóa bảng exit code cho các outcome không pass của run/workflow"
status: completed
priority: P1
effort: "~2d tổng công"
branch: main
tags: [runner, workflow, doctor, exit-codes, timeout, account-pin]
created: 2026-10-15
---

# Hoàn thiện và đánh bóng fgos run & fgos workflow start

## Trạng thái

Completed 2026-10-15. Plan và 3 phase do Gemini 3.8 Flash (omp, profile gemini-tetcu72) viết và cook qua `fgos run`; Lead review từng phase, sửa manifest/nhãn phase, hoàn tác một helper test né sandbox, sửa bug account `undefined`. Review độc lập + re-review: [review-run-workflow-polish.md](reports/review-run-workflow-polish.md). Suite đầy đủ: 7653 pass, 0 fail. Merge `24b8785d6`; release `sha256:1c4c84a0…` activate cho forgentX, mdview, mcp-skill-hub.

Kế hoạch này kế thừa kết quả của plan `plans/261014-1400-two-doors-one-rununit` (sau khi hai cửa `fgos run` và `fgos workflow start` đã hội tụ trên `runUnit`), giải quyết dứt điểm 3 vấn đề vận hành phát sinh trong thực tế triển khai (đặc biệt sau đợt activate trên `mcp-skill-hub` và `mdview`):
1. `fgos workflow start` chưa truyền được trần thời gian (`--timeout`) và account ghim (`--account`) xuống các Unit con.
2. `fgos doctor` thiếu chẩn đoán tĩnh phát hiện cấu hình executor không mang được posture `read-only` / `workspace-write`, dẫn đến lỗi `posture-unavailable` chỉ lộ ra khi đã spawn thật.
3. Kết cục thất bại hoặc từ chối chính sách (`policy-refusal`, `provider-limit`, `execution-failure`, `partial-writes`) của `fgos run` và `fgos workflow start` hiện thoát với exit code 0 gây khó khăn cho CI/CD và harness giám sát.

## Danh sách phase và phụ thuộc

| Phase | Nội dung chính | Ưu tiên | Phụ thuộc | Ước lượng |
|---|---|---|---|---|
| [Phase 01](phase-01-workflow-timeout-and-account.md) | `fgos workflow start` hỗ trợ `--timeout <dur>` và `--account <id>`, lưu vào workflow run, kế thừa qua `unitOverridesOf` (Unit tự khai thắng), cập nhật command-registry subcommands | Ưu tiên 1 | Không | 0.75d |
| [Phase 02](phase-02-doctor-posture-readiness-check.md) | Doctor check mới: kiểm tra năng lực posture `read-only` & `workspace-write` cho core capabilities (`execute`, `code:implement`, các capability có pool) qua `bind()` khô, báo rõ hướng khắc phục | Ưu tiên 2 | Không | 0.5d |
| [Phase 03](phase-03-outcome-exit-codes.md) | Bảng exit code chuẩn cho các outcome không pass của `fgos run` / `fgos workflow start` (pass=0, policy-refusal=4, provider-limit=10, execution-failure=11, partial-writes=12, ...), giữ nguyên envelope JSON | Ưu tiên 3 | Không (khuyến nghị sau Phase 01) | 0.5d |

## Bảng file sở hữu theo phase

| Phase | Files sửa đổi / tạo mới |
|---|---|
| Phase 01 | `bin/fgos.mjs` (case `workflow` `start` & `resume`); `src/workflow/runner.mjs` (`resolveStart`, `prepareWorkflowRun`, `advanceWorkflowRun`, `unitOverridesOf`); `src/workflow/store.mjs` (`createWorkflowRun`, `projectWorkflowState`); `src/cli/command-registry.mjs` (`workflow.subcommands.start`); `test/workflow/units-runner.test.mjs`; `test/cli/subcommand-flag-drift.test.mjs` |
| Phase 02 | `src/setup/executor-posture-coverage.mjs` (NEW); `src/setup/registrations.mjs` (đăng ký check `executor-posture-coverage`); `test/setup/executor-posture-coverage-check.test.mjs` (NEW) |
| Phase 03 | `src/state/store.mjs` (`EXIT_CODES` thêm 10-14, xem ghi chú đầu phase 03); `bin/fgos.mjs` (`main` handler gán `process.exitCode`); `docs/io-contract.md`; `CHANGELOG.md`; `docs/specs/runner.md`; `test/cli/execution-outcome-exit-codes.test.mjs` (NEW) |

## Acceptance đo được

1. **Phase 01:**
   - `fgos workflow start delphi --request "Test" --timeout 90m --account acct-1 --foreground` tạo workflow run lưu trữ chính xác `timeoutMs: 5400000` và `account: "acct-1"`.
   - Mọi unit thuộc run không tự khai `timeoutMs` đều nhận override `timeoutMs: 5400000` và `account: "acct-1"`.
   - Unit tự khai `unit.timeoutMs` giữ nguyên giá trị của chính nó, không bị workflow override đè lên.
   - Lệnh `fgos workflow resume <id>` tự động giữ nguyên `timeoutMs` và `account` ban đầu; cờ `--timeout` hoặc `--account` truyền vào `resume` bị từ chối trước khi chạy.
   - `npm test -- test/cli/subcommand-flag-drift.test.mjs` xanh tuyệt đối (không lệch flag giữa handler và command registry).

2. **Phase 02:**
   - `fgos doctor` hiển thị check mới `executor-posture-coverage`.
   - Chạy với cấu hình repo hiện tại: pass xanh, liệt kê danh sách executor đáp ứng cho các core capabilities (`execute`, `code:implement`).
   - Chạy với fixture cấu hình hỏng (executor kiểu cũ không khai sandbox backend `bwrap` hoặc shadow cấu hình global): fail đỏ, thông báo nêu rõ executor vi phạm kèm 2 hướng dẫn sửa cụ thể:
     (a) Khai báo invocation có `sandbox.backend: "bwrap"` (hoặc các cờ cô lập phiên/home);
     (b) Xoá bỏ override `executors.<id>` ở `.fgos/config.json` của project để thừa hưởng cấu hình global chuẩn từ `~/.fgos/config.json`.
   - Quá trình kiểm tra chạy hoàn toàn khô (`simulateUnitBindings`), không sinh/spawn tiến trình thật.

3. **Phase 03:**
   - `fgos run "<prompt>"` khi gặp `policy-refusal` (ví dụ `foreign-staged-index` hoặc vi phạm quyền ghi) trả về exit code `4` (validation).
   - `fgos run` gặp `provider-limit` trả về exit code `10`.
   - `fgos run` gặp `execution-failure` trả về exit code `11`.
   - `fgos run` gặp `partial-writes` trả về exit code `12`.
   - `fgos run` hoàn tất thành công (`pass`) trả về exit code `0`.
   - `fgos workflow start --foreground` khi một bước kết thúc với outcome lỗi trả về đúng exit code tương ứng của outcome đó.
   - Toàn bộ luồng stdout JSON envelope `fgos.v1` giữ nguyên 100%, không bị ảnh hưởng.
   - `docs/io-contract.md` và `CHANGELOG.md` ghi nhận đầy đủ bảng mã thoát mới.

## Quy tắc Runner mới đề xuất

- **RUL98 (`fgos workflow start` kế thừa và phân bổ `--timeout <dur>` và `--account <id>` cho từng Unit, 2026-10-15).** Workflow run hỗ trợ cờ `--timeout <dur>` (chuỗi thời lượng hợp lệ `1m`..`4h`, phân tích ra `timeoutMs`) và `--account <id>` (ghim tài khoản nhà cung cấp) giống cơ chế của `--effort`. Cả hai giá trị được lưu bền vững trong `meta.json` của workflow run và được tái tạo khi `resume`. Khi điều phối từng Unit, `unitOverridesOf` bổ sung các khoá override `timeoutMs` và `account` tương ứng; tuy nhiên, nếu một Unit tự khai `unit.timeoutMs`, giá trị tự khai của Unit luôn thắng override từ workflow.
- **RUL99 (Bảng mã thoát riêng biệt cho kết cục thực thi của `fgos run` và `fgos workflow start`, 2026-10-15).** Các outcome kết thúc không phải `pass` của `fgos run` và `fgos workflow start` (chạy foreground) chuyển từ exit code `0` sang bảng exit code xác định: `pass` = 0, `policy-refusal` = 4 (validation), `provider-limit` = 10, `execution-failure` = 11, `partial-writes` = 12, `blocked` = 13, `findings` = 14. Định dạng envelope JSON stdout giữ nguyên vẹn.

## Rủi ro chính và biện pháp kiểm soát

| Rủi ro | Khả năng × Tác động | Biện pháp giảm thiểu |
|---|---|---|
| Unit trong workflow bị ép đè `timeoutMs` dù đã tự định nghĩa thời lượng riêng | Trung bình × Cao | `unitOverridesOf` kiểm tra `if (unit.timeoutMs === undefined && timeoutMs)` trước khi gán override `timeoutMs`. Unit tự khai luôn được ưu tiên. |
| Doctor check posture chạy chậm nếu gọi nhiều lần bind | Thấp × Trung bình | Tái sử dụng `simulateUnitBindings` trong `src/runner/execution/dry-bind.mjs` với `session { headless: true }`, chỉ quét các capability độc nhất trong catalog và 2 posture (`read-only`, `workspace-write`). |
| Thay đổi exit code làm vỡ các script hoặc caller hiện tại đang giả định exit 0 | Thấp × Trung bình | Theo thỏa thuận hệ thống hiện tại ("Không cần giữ tương thích ngược (một người dùng)"). Bảng mã thoát được chuẩn hóa rõ ràng theo chuẩn Unix/CLI và tài liệu hoá tại `docs/io-contract.md`. |

## Câu hỏi còn mở

1. **Đối với `fgos workflow start` ở chế độ detached (mặc định không có `--foreground`):** Khi tiến trình nền được khởi tạo thành công và trả về `pid` cùng `status: "running"`, exit code là `0`. Nếu người dùng gọi `fgos workflow resume <id> --foreground` hoặc `fgos workflow status`, exit code có nên phản ánh outcome cuối cùng của workflow không?
   - *Tự quyết theo bằng chứng repo:* Lệnh `workflow start` detached trả về kết quả kích hoạt tiến trình thành công (exit 0). Khi chạy với `--foreground` (cả `start` lẫn `resume`), lệnh chờ đến khi hoàn tất/dừng và trả về mã thoát theo `outcome` của workflow.
2. **Đối với outcome `findings` (ví dụ reviewer/red-team tìm thấy lỗi nhưng tiến trình không crash):**
   - *Tự quyết theo bằng chứng repo:* Gán exit code `14` (phân biệt rõ với `execution-failure` là `11` và `pass` là `0`). Caller tự động biết có khiếm khuyết được phát hiện mà không cần parse JSON.
