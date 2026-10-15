# Phase 03: Chuẩn hóa bảng exit code cho non-pass outcomes của fgos run và fgos workflow start

> **Lead sửa trước khi cook (2026-10-15):** repo có MỘT bảng exit code chuẩn là `EXIT_CODES` trong `src/state/store.mjs` (header `bin/fgos.mjs:18-20` trỏ về đó; 2-5, 7-9 đã dùng, 6 là `EXIT_BUSY` của loop). Không tạo module `outcome-exit-codes.mjs` riêng: thêm các mã mới (10-14) vào `EXIT_CODES` với tên theo outcome, và một hàm thuần ánh xạ `outcome → EXIT_CODES[...]` đặt cạnh nơi `fgos run` / `fgos workflow start` dựng kết quả (hoặc export từ `store.mjs` nếu đó là chỗ tự nhiên). Cập nhật comment header ở `bin/fgos.mjs`. Mọi chỗ dưới đây nhắc `src/runner/execution/outcome-exit-codes.mjs` hiểu theo ghi chú này.

## Bối cảnh và Context links

- `bin/fgos.mjs:5040-5079` — Lôgic kết thúc trong hàm `main()` của CLI: in stdout JSON và quyết định `process.exitCode`.
- `docs/io-contract.md:73-80` — Hợp đồng nhập xuất (I/O contract): quy định các mã thoát exit code một nguồn duy nhất từ `src/state/store.mjs`'s `EXIT_CODES` và `src/runner/loop.mjs`'s `EXIT_BUSY`.
- `src/state/store.mjs:72-88` — Khai báo hằng số `EXIT_CODES` cho các phân loại lỗi (2 precondition, 3 conflict, 4 validation, 5 corrupt-log, 7 lock-timeout, 8 session-fail, 9 merge-fail).
- `src/runner/execution/run.mjs:241-256, 635-640, 672-678, 858-865, 938-961` — Các outcome trả về từ `runUnit`: `pass`, `policy-refusal`, `provider-limit`, `execution-failure`, `partial-writes`, `blocked`.
- `src/workflow/runner.mjs:615-619, 632, 652-684` — Các outcome và sự kiện thất bại của Workflow: `step.fail` và `workflow.fail` ghi nhận outcome của Unit (`execution-failure`, `findings`, `policy-refusal`, v.v.).

## Yêu cầu (Requirements)

1. Khi `fgos run` hoặc `fgos workflow start` (chạy foreground) hoàn thành với một outcome không phải `pass`, tiến trình CLI KHÔNG được thoát với mã `0`. Thay vào đó, nó phải thoát với một mã lỗi Unix xác định theo bảng mã kết cục thực thi (Execution Outcome Exit Codes).
2. Quy định bảng exit code:
   - `pass`: mã `0` (thành công).
   - `policy-refusal`: mã `4` (đồng nhất với mã `validation` của hệ thống store/preflight).
   - `provider-limit`: mã `10` (hết hạn ngạch, rate limit, hoặc tài khoản provider bị phong tỏa/không thể quay vòng).
   - `execution-failure`: mã `11` (worker crash, lỗi adapter/spawn không xử lý được, ngoại lệ tiến trình).
   - `partial-writes`: mã `12` (ghế ghi dừng giữa chừng khi đã làm bẩn worktree trước khi gặp provider-limit).
   - `blocked`: mã `13` (tiến trình dừng ở trạng thái chờ can thiệp thủ công hoặc pending inline turn).
   - `findings`: mã `14` (reviewer / red-team phát hiện sai sót hoặc verify thất bại).
   - Các outcome không xác định khác: mã `1` (lỗi không phân loại).
3. Giữ nguyên vẹn hợp đồng JSON:
   - Chuẩn phong bì stdout `fgos.v1` (`wrapEnvelope(data)`) giữ nguyên 100%.
   - Cấu trúc trường `outcome`, `results`, `findings` trong JSON không bị thay đổi.
4. Tài liệu hoá:
   - Cập nhật mục "Mã thoát (exit code)" trong `docs/io-contract.md`.
   - Ghi nhận thay đổi vào `CHANGELOG.md` dưới mục `## [Unreleased]`.
   - Bổ sung quy tắc **RUL99** vào `docs/specs/runner.md`.
   - Không cần giữ tương thích ngược (chỉ một người dùng chính).

## Bảng mã thoát kết cục thực thi (Execution Outcome Exit Codes)

| Outcome / Phân loại | Exit Code | Ý nghĩa ngữ nghĩa |
|---|---|---|
| `pass` | `0` | Lượt chạy hoàn thành đạt yêu cầu, không có lỗi hay khiếm khuyết. |
| (generic error / bug) | `1` | Ngoại lệ chưa phân loại hoặc lỗi bất thường của runtime. |
| `precondition` | `2` | Store error: điều kiện tiên quyết không thoả. |
| `conflict` | `3` | Store error: xung đột phiên bản/trạng thái. |
| `validation` / `policy-refusal` | `4` | Vi phạm chính sách: foreign index, bwrap từ chối, merge dở, v.v. |
| `corrupt-log` | `5` | Hỏng tệp nhật ký sự kiện. |
| `busy` | `6` | Runner loop bận (`EXIT_BUSY`). |
| `lock-timeout` | `7` | Quá thời gian chờ khoá. |
| `session-fail` | `8` | Lỗi quản lý phiên worktree. |
| `merge-fail` | `9` | Thất bại khi hoà trộn nhánh. |
| `provider-limit` | `10` | Hết quota / rate limit / tài khoản provider không thể quay vòng tiếp. |
| `execution-failure` | `11` | Worker sập, thoát bất thường, hoặc lỗi crash adapter. |
| `partial-writes` | `12` | Worker ghi dở dang lên worktree trước khi cạn provider quota. |
| `blocked` | `13` | Tiến trình tạm dừng chờ lượt inline hoặc khoá phụ thuộc. |
| `findings` | `14` | Reviewer hoặc red-team tìm thấy khiếm khuyết cần sửa (không đạt pass). |

## Files sở hữu

- `src/runner/execution/outcome-exit-codes.mjs` (NEW)
- `bin/fgos.mjs`
- `docs/io-contract.md`
- `docs/specs/runner.md`
- `CHANGELOG.md`
- `test/cli/execution-outcome-exit-codes.test.mjs` (NEW)

## Các bước thực hiện

### Bước 1: Tạo module `src/runner/execution/outcome-exit-codes.mjs`
1. Khai báo hằng số ánh xạ:
   ```javascript
   export const EXECUTION_OUTCOME_EXIT_CODES = Object.freeze({
     'pass': 0,
     'policy-refusal': 4,
     'provider-limit': 10,
     'execution-failure': 11,
     'partial-writes': 12,
     'blocked': 13,
     'findings': 14,
   });

   export function exitCodeForOutcome(outcome) {
     if (typeof outcome !== 'string') return 1;
     return EXECUTION_OUTCOME_EXIT_CODES[outcome] ?? (outcome === 'pass' ? 0 : 1);
   }
   ```

### Bước 2: Tích hợp vào `bin/fgos.mjs`
1. Import `exitCodeForOutcome`:
   ```javascript
   import { exitCodeForOutcome } from '../src/runner/execution/outcome-exit-codes.mjs';
   ```
2. Tại hàm `main()`, sau khối in stdout thành công:
   ```javascript
   const isExecutionRun = verb === 'run';
   const isForegroundWorkflow = verb === 'workflow' && data?.status !== 'running' && data?.outcome !== undefined;

   if (isExecutionRun && data?.outcome) {
     process.exitCode = exitCodeForOutcome(data.outcome);
   } else if (isForegroundWorkflow) {
     process.exitCode = exitCodeForOutcome(data.outcome);
   } else if (verb === 'plan-lint') {
     process.exitCode = data.ok ? 0 : 1;
   } else if (verb === 'doctor' && flags.strict === true && data.checks.some((c) => !c.passed)) {
     process.exitCode = 1;
   } else {
     process.exitCode = 0;
   }
   ```
   *Lưu ý:* Nếu `workflow start` chạy detached (mặc định), `data` trả về `{ workflowRunId, status: 'running', detached: { pid } }`, không có `data.outcome`, nên `process.exitCode` vẫn là `0` (khởi chạy daemon thành công).

### Bước 3: Cập nhật tài liệu và hợp đồng
1. Cập nhật `docs/io-contract.md` tại mục "Mã thoát (exit code) — một nguồn duy nhất":
   - Bổ sung bảng mã thoát kết cục thực thi `10-14`.
   - Nêu rõ: Cửa `fgos run` và `fgos workflow start` (foreground) trả mã lỗi theo bảng này khi outcome không phải `pass`, trong khi JSON stdout vẫn được giữ nguyên vẹn định dạng phong bì `fgos.v1`.
2. Cập nhật `docs/specs/runner.md`:
   - Bổ sung mục **RUL99** ghi nhận quy tắc mã thoát outcome thực thi.
3. Cập nhật `CHANGELOG.md`:
   - Bổ sung ghi chú dưới `## [Unreleased]`.

### Bước 4: Viết test suite `test/cli/execution-outcome-exit-codes.test.mjs`
1. Test `fgos run` trả exit code 4 khi gặp `policy-refusal`.
2. Test `fgos run` trả exit code 10 khi gặp `provider-limit`.
3. Test `fgos run` trả exit code 11 khi gặp `execution-failure`.
4. Test `fgos run` trả exit code 12 khi gặp `partial-writes`.
5. Test `fgos run` trả exit code 0 khi outcome là `pass`.
6. Test `fgos workflow start --foreground` trả exit code tương ứng với outcome của bước thất bại.
7. Kiểm tra stdout của mọi trường hợp trên đều là JSON hợp lệ mang `contract: "fgos.v1"`.

## Test đỏ trước (Tên test cụ thể)

1. `test('fgos run exits with code 4 on policy-refusal while emitting valid json envelope')`
2. `test('fgos run exits with code 10 on provider-limit')`
3. `test('fgos run exits with code 11 on execution-failure')`
4. `test('fgos run exits with code 12 on partial-writes')`
5. `test('fgos run exits with code 0 on pass')`
6. `test('fgos workflow start --foreground exits with non-zero matching the workflow failure outcome')`
7. `test('fgos workflow start detached exits 0 on successful process spawn')`

## Rủi ro và Rollback

- **Rủi ro:** Các test tích hợp hiện có sử dụng `execFileSync` gọi `bin/fgos.mjs` cho các ca test mong đợi outcome thất bại có thể bị ném ngoại lệ nếu chưa bọc `try/catch`.
  - *Kiểm soát:* Rà soát các tệp test trong `test/cli/run-verb.test.mjs` và cập nhật các ca kiểm tra mong đợi outcome lỗi để bắt `err.status` / `err.stdout`.
- **Rollback:** Đặt lại `process.exitCode = 0` cho nhánh thành công của `run` và `workflow` trong `bin/fgos.mjs`.

## Spec & CHANGELOG delta

- **docs/specs/runner.md:** Bổ sung **RUL99**:
  > Các outcome kết thúc không phải `pass` của `fgos run` và `fgos workflow start` (chế độ foreground) chuyển sang sử dụng bảng exit code xác định: `pass` = 0, `policy-refusal` = 4, `provider-limit` = 10, `execution-failure` = 11, `partial-writes` = 12, `blocked` = 13, `findings` = 14. Định dạng envelope JSON stdout giữ nguyên vẹn.
- **docs/io-contract.md:**
  > Bổ sung bảng mã thoát kết cục thực thi (Execution Outcome Exit Codes 10–14).
- **CHANGELOG.md:**
  > - Changed: `fgos run` and `fgos workflow start` now exit with distinctive non-zero exit codes for non-pass outcomes (`policy-refusal`: 4, `provider-limit`: 10, `execution-failure`: 11, `partial-writes`: 12, `blocked`: 13, `findings`: 14) while preserving the structured JSON envelope.
