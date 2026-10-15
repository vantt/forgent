# Phase 02: Doctor check kiểm tra posture readiness của các executor cho core capabilities

## Bối cảnh và Context links

- `src/setup/registrations.mjs:4665-4682` — Nơi đăng ký các check doctor liên quan đến workflow pools và capability (`workflow-pools-satisfy-independence`, `blind-steps-use-proven-pools`).
- `src/setup/checks.mjs` — Bề mặt re-export và điều phối các check của doctor.
- `src/runner/execution/bind.mjs:260-268` — Lõi lọc posture của `bind()`: gọi `resolvePostureInvocation(cand, posture, ...)` và ném lỗi `posture-unavailable` nếu không executor nào đáp ứng.
- `src/runner/dispatch/confinement/policies.mjs:717-745` — Hàm `resolvePostureInvocation`: xác định invocation có thể chạy posture đó dựa trên cấu hình `sandbox.backend === 'bwrap'`, đăng ký máy trong `~/.fgos/confinement-backends.json` và khả dụng của nhị phân `bwrap`.
- `src/runner/execution/dry-bind.mjs:22-43` — Hàm `simulateUnitBindings(unit, runnerConfig, { session })`: mô phỏng bind khô không spawn tiến trình.
- `plans/261014-1400-two-doors-one-rununit/plan.md:140-143` — Sự cố `mcp-skill-hub`: doctor gần như sạch nhưng toàn bộ lệnh `fgos run` đều thất bại vì cấu hình executor local của dự án định nghĩa kiểu cũ (không có sandbox confinement), đè lên cấu hình global chuẩn.

## Yêu cầu (Requirements)

1. Đăng ký check mới trong `src/setup/registrations.mjs`:
   - ID: `executor-posture-coverage`
   - Description: `core capabilities (execute, code:implement, and capabilities declaring a pool) have at least one candidate executor capable of applying read-only and workspace-write postures`
2. Core capabilities được kiểm tra:
   - Các capability trọng yếu: `execute`, `code:implement`.
   - Bất kỳ capability nào được khai báo trong `runner.capabilities` có danh sách `prefer` chứa ít nhất 1 executor.
3. Cơ chế kiểm tra hoàn toàn khô (Dry check):
   - Nạp cấu hình runner của project (kết hợp global + project qua `loadRunnerConfig`).
   - Chạy mô phỏng `bind()` (sử dụng `simulateUnitBindings` hoặc gọi trực tiếp `resolvePostureInvocation` cho từng ứng viên của pool).
   - Kiểm tra hai posture cơ bản:
     (1) `read-only` (Unit với `writes: []`);
     (2) `workspace-write` (Unit với `writes: ['scratch/placeholder']`).
   - Tuyệt đối không spawn tiến trình, không tạo pane herdr, không kích hoạt sandbox thật.
4. Báo cáo kết quả và hướng dẫn khắc phục:
   - **Xanh (Pass):** Nêu rõ tên các executor được chọn cho từng core capability và posture (ví dụ: `all core capabilities can apply read-only and workspace-write postures: execute -> openai (bwrap), code:implement -> claude (bwrap)`).
   - **Đỏ (Fail):** Nêu chi tiết capability và posture không có executor đáp ứng, kèm nguyên nhân (`posture-unavailable`). Đồng thời in hướng dẫn sửa chữa cụ thể gồm 2 giải pháp:
     - *Cách 1:* Bổ sung cấu hình invocation có sandbox backend bwrap vào executor trong `.fgos/config.json`:
       `invocations: [{ id: "confined", sandbox: { backend: "bwrap" } }]`
     - *Cách 2:* Nếu dự án đang override executor (ví dụ `runner.executors.<id>`) kiểu cũ, hãy xoá bỏ override này khỏi `.fgos/config.json` của dự án để fgOS kế thừa cấu hình global đã cấu hình bwrap trong `~/.fgos/config.json`.

## Files sở hữu

- `src/setup/executor-posture-coverage.mjs` (NEW)
- `src/setup/registrations.mjs`
- `test/setup/executor-posture-coverage-check.test.mjs` (NEW)

## Các bước thực hiện

### Bước 1: Hiện thực module `src/setup/executor-posture-coverage.mjs`
1. Khai báo hàm `checkExecutorPostureCoverage(cwd, options = {})`:
   - Lấy `runnerConfig` từ `options.loadRunnerConfig(cwd)`.
   - Xác định danh sách capability cần kiểm tra:
     - Bắt buộc: `execute`, `code:implement`.
     - Bổ sung: Các capability có `prefer` trong `runnerConfig.capabilities` hoặc `runnerConfig.runner?.capabilities`.
   - Thiết lập phiên giả lập: `session = { headless: true, herdrPresent: detectHerdrPresent() }`.
2. Vòng lặp kiểm tra:
   - Với mỗi capability:
     - Tạo Unit thử nghiệm cho `read-only`: `{ capability, objective: 'Check read-only posture', writes: [] }`.
     - Tạo Unit thử nghiệm cho `workspace-write`: `{ capability, objective: 'Check workspace-write posture', writes: ['scratch/test-write'] }`.
     - Gọi `simulateUnitBindings(unit, runnerConfig, { session })`.
     - Kiểm tra kết quả `roles[0]`:
       - Nếu binding trả về `refused` với reason `posture-unavailable` hoặc không tìm được executor hợp lệ: ghi nhận lỗi vào danh sách `failures`.
       - Nếu thành công: ghi nhận executor được chọn vào danh sách `coverage`.
3. Tổng hợp kết quả:
   - Nếu `failures.length === 0`:
     - Trả về `{ passed: true, message: `all core capabilities have executors capable of read-only and workspace-write: ${summary}` }`.
   - Nếu `failures.length > 0`:
     - Trả về `{ passed: false, message: `core capabilities lack executors capable of applying required postures: ${failures.join('; ')}. Fix: (1) Add an invocation with sandbox.backend "bwrap" to executors.<id> in .fgos/config.json, or (2) remove project-level executors.<id> overrides from .fgos/config.json to inherit healthy global executors from ~/.fgos/config.json.` }`.

### Bước 2: Đăng ký check trong `src/setup/registrations.mjs`
1. Import `checkExecutorPostureCoverage`:
   ```javascript
   import { checkExecutorPostureCoverage } from './executor-posture-coverage.mjs';
   ```
2. Đăng ký check bằng `registerCheck`:
   ```javascript
   registerCheck({
     id: 'executor-posture-coverage',
     description: 'core capabilities (execute, code:implement, and capabilities with a pool) have at least one candidate executor capable of applying read-only and workspace-write postures',
     check: (cwd) => checkExecutorPostureCoverage(cwd, {
       loadRunnerConfig: loadRunnerConfigFromDir,
     }),
   });
   ```

### Bước 3: Viết test suite `test/setup/executor-posture-coverage-check.test.mjs`
1. Test pass case: Cấu hình chuẩn với executor mang invocation `bwrap` -> check pass xanh và liệt kê executor.
2. Test fail case (mcp-skill-hub scenario): Executor không có invocation bwrap (cấu hình agent kiểu cũ) -> check fail đỏ, thông điệp chứa chính xác 2 hướng khắc phục.
3. Test native-agent exemption: Agent in-process không qua bwrap vẫn được tính hợp lệ khi phù hợp quy chuẩn native.

## Test đỏ trước (Tên test cụ thể)

1. `test('executor-posture-coverage passes when all core capabilities have bwrap-capable executors')`
   - Tạo runner config fixture có `execute` và `code:implement` trỏ tới executor có invocation bwrap.
   - Gọi `checkExecutorPostureCoverage`.
   - Khẳng định `result.passed === true` và `result.message` liệt kê tên executor.
2. `test('executor-posture-coverage fails and suggests remediation when an executor lacks bwrap sandbox')`
   - Tạo runner config fixture mô phỏng mcp-skill-hub: `openai` không có `invocations` và không có `sandbox.backend`.
   - Gọi `checkExecutorPostureCoverage`.
   - Khẳng định `result.passed === false`.
   - Khẳng định `result.message` chứa `posture-unavailable` và 2 hướng dẫn khắc phục: `sandbox.backend "bwrap"` và `remove project-level executors.<id> overrides`.
3. `test('executor-posture-coverage doctor check is registered and visible in DOCTOR_CHECKS')`
   - Khẳng định `DOCTOR_CHECKS.some(c => c.id === 'executor-posture-coverage') === true`.

## Rủi ro và Rollback

- **Rủi ro:** Một số dự án có thể dùng custom capability không có pool; check nếu duyệt nhầm có thể báo fail sai.
  - *Kiểm soát:* Chỉ kiểm tra các capability cốt lõi (`execute`, `code:implement`) và những capability có khai báo `prefer` pool với ít nhất 1 candidate. Bỏ qua các capability không khai báo pool.
- **Rollback:** Gỡ đăng ký `registerCheck` trong `registrations.mjs` và xoá `src/setup/executor-posture-coverage.mjs`.

## Spec & CHANGELOG delta

- **docs/specs/runner.md:** Cập nhật mục Doctor check chẩn đoán runner: bổ sung check `executor-posture-coverage` xác minh khả năng thực thi posture tĩnh trước khi chạy thật.
- **CHANGELOG.md:**
  > - Added: `fgos doctor` check `executor-posture-coverage` verifies that core capabilities have executors capable of `read-only` and `workspace-write` postures, providing actionable remediation instructions when misconfigured.
