# Báo cáo Thực thi Phase 01: fgos workflow start hỗ trợ --timeout và --account

Kế hoạch: `plans/261015-1046-run-workflow-polish/`
Phase: 01 (`phase-01-workflow-timeout-and-account.md`)
Ngày thực hiện: 2026-10-15

---

## 1. Các file và vị trí sửa đổi (file:line)

1. **`src/workflow/store.mjs`**:
   - `createWorkflowRun` (`lines 28, 51-53`): Nhận thêm `timeoutMs` và `account` vào tham số; ghi nhận vào payload của sự kiện `workflow.start`.
   - `projectWorkflowState` (`lines 148-149, 169-170, 316-317`): Khởi tạo biến `timeoutMs` và `account`, trích xuất từ payload `workflow.start` (`p.timeoutMs ?? null`, `p.account ?? null`), đưa vào đối tượng `state` trả về.

2. **`src/workflow/runner.mjs`**:
   - `import` (`line 32`): Import `parseRunTimeout, assertRunTimeoutMs` từ `../runner/dispatch/config.mjs`.
   - `unitOverridesOf` (`lines 195-225`): Nâng cấp chữ ký hàm nhận `options = {}` (hỗ trợ backward compatibility nếu truyền chuỗi `effort`), trích xuất `{ effort, timeoutMs, account }`. Kiểm tra `applyTimeout = (unit.timeoutMs ?? unit.template?.timeoutMs) === undefined && timeoutMs !== null` (bảo đảm Unit tự khai `unit.timeoutMs` luôn thắng override workflow). Phân bổ các khoá vào `seatScoped` và fallback `{ origin: 'human-cli' }`.
   - `advanceWorkflowRun` (`lines 619-623`): Chuyển `{ effort: state.effort, timeoutMs: state.timeoutMs, account: state.account }` vào `unitOverridesOf`.
   - `resolveStart` (`lines 955-970, 990`): Phân tích và kiểm tra tính hợp lệ của `params.timeout` (dùng `parseRunTimeout` hoặc `assertRunTimeoutMs`) và `params.account` (chuỗi định danh không rỗng, ném `RunnerConfigError` nếu rỗng/sai dạng); trả về `timeoutMs`, `account`.
   - `prepareWorkflowRun` (`lines 1028, 1040-1041`): Nhận `timeoutMs`, `account` từ `resolveStart` và chuyển tiếp cho `createWorkflowRun`.

3. **`bin/fgos.mjs`**:
   - Nhánh `sub === 'start'` (`lines 2272-2273`): Đọc `flags.timeout` và `flags.account` qua `requireField`, chuyển vào `startParams`.
   - Nhánh `sub === 'resume'` (`lines 2310-2311`): Kiểm tra nếu `flags.timeout !== undefined` hoặc `flags.account !== undefined`, ném `StoreError('validation', ...)` từ chối thay đổi cấu hình trên workflow run được phục hồi.

4. **`src/cli/command-registry.mjs`**:
   - `workflow.subcommands.start.parameters.properties` (`lines 2061-2068`): Bổ sung định nghĩa schema cho 2 cờ `timeout` và `account`.
   - `workflow.subcommands.resume.parameters.properties` (`lines 2125-2132`): Bổ sung định nghĩa schema cho 2 cờ `timeout` và `account` kèm mô tả cấm đổi khi resume (đồng bộ tuyệt đối với CLI handler).

5. **`docs/specs/runner.md`**:
   - Bổ sung quy tắc **RUL98** (`line 1119`) ngay sau RUL97.

6. **`CHANGELOG.md`**:
   - Bổ sung mục ghi nhận tính năng mới dưới `## [Unreleased] -> ### Added` (`line 11`).

7. **`test/workflow/units-runner.test.mjs`**:
   - Thêm 5 ca test tự động (`lines 399-551`) bao quát toàn diện các kịch bản của Phase 01.

---

## 2. Kết quả kiểm thử Đỏ → Xanh (TDD)

Trước khi sửa code sản xuất, 5 ca test mới được viết vào `test/workflow/units-runner.test.mjs` và kiểm tra thấy đỏ đúng như kỳ vọng:

1. `test('--timeout gives every unit of the workflow run its own timeoutMs, kept for resume')`
   - **Fail ban đầu:** Dòng 410: `state.timeoutMs` là `undefined`, kỳ vọng `5400000`.
   - **Xanh sau khi sửa:** `state.timeoutMs === 5400000`, unit run có override `{ origin: 'human-cli', timeoutMs: 5400000 }` và binding mang `timeoutMs: 5400000` với provenance `override:human-cli`; sau `answerWorkflow` giá trị được giữ nguyên.
2. `test('a unit with its own timeoutMs wins over workflow start --timeout')`
   - **Fail ban đầu:** Dòng 433: `state.timeoutMs` là `undefined`, kỳ vọng `5400000`.
   - **Xanh sau khi sửa:** Unit mặc định nhận `timeoutMs: 5400000` (provenance `override:human-cli`), Unit tự khai giữ đúng `timeoutMs: 120000` (provenance `unit`).
3. `test('--account pins provider account on every unit of the workflow run, kept for resume')`
   - **Fail ban đầu:** Dòng 473: `state.account` là `undefined`, kỳ vọng `'acct-test'`.
   - **Xanh sau khi sửa:** Workflow run lưu `account: 'acct-test'`, Unit run nhận binding `account: { provider: 'node', id: 'acct-test' }` với provenance `override:human-cli`.
4. `test('workflow start with invalid --timeout or --account is refused before run exists')`
   - **Fail ban đầu:** Dòng 498: `Missing expected rejection` (do `startWorkflow` chưa validate).
   - **Xanh sau khi sửa:** `timeout: '10h'` ném lỗi `/at most 4h/`, `account: ''` ném lỗi `/account/`, không thư mục `.fgos/workflow-runs` nào được tạo.
5. `test('CLI workflow start accepts --timeout and --account, while resume refuses them')`
   - **Fail ban đầu:** Dòng 535: CLI start không tiếp nhận cờ, chạy thất bại.
   - **Xanh sau khi sửa:** `workflow start` với `--timeout 90m --account acct-cli` hoàn thành pass và lưu đúng metadata; `workflow resume` kèm `--timeout` hoặc `--account` bị từ chối validation ngay trước khi chạy.

---

## 3. Kết quả các bài kiểm thử Focused

Tất cả các bài kiểm thử chỉ định chạy độc lập và không phụ thuộc env ẩn:
- `test/cli/subcommand-flag-drift.test.mjs`: **13/13 pass** (0 drift giữa `bin/fgos.mjs` và `command-registry.mjs`).
- `test/cli/fgos-workflow.test.mjs`: **7/7 pass**.
- `test/architecture.test.mjs`: **24/24 pass** (tuân thủ tuyệt đối ranh giới kiến trúc và A4 boundary guard).
- `test/workflow/units-runner.test.mjs`: **20/20 pass** (toàn bộ 15 test cũ + 5 test mới).
- `test/workflow/workflow-runner.test.mjs`: **58/58 pass**.
- `test/workflow/units-source.test.mjs`: **pass**.
- `test/workflow/seats.test.mjs`: **pass**.
- `test/workflow/seat-evidence.test.mjs`: **pass**.
- `test/workflow/discussion-workflows.test.mjs`: **pass**.
- `test/workflow/business-discussion-workflow.test.mjs`: **pass**.
- `test/workflow/architecture-advisory-workflow.test.mjs`: **pass**.
- `test/workflow/advisory-m-contracts.test.mjs`: **pass**.

---

## 4. Spec Delta & CHANGELOG Delta đã áp dụng

- **`docs/specs/runner.md`**: Đã bổ sung quy tắc kinh doanh **RUL98**:
  > `fgos workflow start` kế thừa và phân bổ `--timeout <dur>` và `--account <id>` cho từng Unit, 2026-10-15.
- **`CHANGELOG.md`**: Đã bổ sung dòng trong phần `## [Unreleased] -> ### Added`:
  > `- `fgos workflow start` supports `--timeout <dur>` and `--account <id>` flags, propagating overrides down to each Unit run while honoring Unit self-declared timeouts.`

---

## 5. Phần còn ngỏ

Không có. Mọi yêu cầu và acceptance criteria của Phase 01 đã được hoàn thành đầy đủ, không để lại nợ kỹ thuật hay lỗi tiềm ẩn.

---

Status: DONE
