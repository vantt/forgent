# Báo cáo Thực thi Phase 02: Doctor check kiểm tra posture readiness của các executor

Kế hoạch: `plans/261015-1046-run-workflow-polish/`
Phase: 02 (`phase-02-doctor-posture-readiness-check.md`)
Ngày thực hiện: 2026-10-15

---

## 1. Các file và vị trí sửa đổi (file:line)

1. **`src/workflow/runner.mjs`** (`lines 195-197`):
   - Bỏ nhánh backward compatibility nhận chuỗi `options` trong `unitOverridesOf` theo yêu cầu review của Lead:
     `const { effort = null, timeoutMs = null, account = null } = options ?? {};`
   - Kiểm tra toàn bộ test workflow (`test/workflow/*.test.mjs`), 120/120 test xanh tuyệt đối.

2. **`src/setup/executor-posture-coverage.mjs`** (NEW, `lines 1-127`):
   - Hiện thực hàm chẩn đoán tĩnh hoàn toàn khô: `checkExecutorPostureCoverage(cwd, options = {})`.
   - Quét các core capabilities bắt buộc (`execute`, `code:implement`) và tất cả capability có khai báo pool agent (`prefer`) trong cấu hình runner (`runnerConfig.capabilities`).
   - Lọc bỏ các capability chỉ có executor dạng công cụ (`kind: 'tool'`, ví dụ `impact-analysis -> gitnexus`), vì posture (`read-only`, `workspace-write`) chỉ áp dụng cho agent execution.
   - Chạy mô phỏng tĩnh qua `simulateUnitBindings(unit, runnerConfig, { session })` cho cả hai posture `read-only` (`writes: []`) và `workspace-write` (`writes: ['scratch/placeholder']`).
   - Tuyệt đối không spawn tiến trình, không tạo pane herdr, không ghi file.
   - Khi phát hiện vi phạm (`posture-unavailable` hoặc thiếu executor), trả về `passed: false` kèm danh sách chi tiết lỗi và đúng 2 hướng khắc phục theo spec:
     (1) Khai báo invocation có sandbox backend `bwrap` vào executor trong `.fgos/config.json`;
     (2) Xóa bỏ override executor local khỏi `.fgos/config.json` để kế thừa cấu hình global chuẩn từ `~/.fgos/config.json`.
   - Khi tất cả đều đáp ứng, trả về `passed: true` kèm danh sách ánh xạ capability sang executor và invocation tương ứng.

3. **`src/setup/registrations.mjs`** (`lines 57, 4684-4691`):
   - Import `checkExecutorPostureCoverage` từ `./executor-posture-coverage.mjs`.
   - Đăng ký check `executor-posture-coverage` vào hệ thống doctor qua `registerCheck`:
     - ID: `executor-posture-coverage`
     - Description: `core capabilities (execute, code:implement, and capabilities declaring a pool) have at least one candidate executor capable of applying read-only and workspace-write postures`
     - Handler: `(cwd) => checkExecutorPostureCoverage(cwd, { loadRunnerConfig: loadRunnerConfigFromDir })`

4. **`test/setup/executor-posture-coverage-check.test.mjs`** (NEW, `lines 1-181`):
   - Xây dựng 7 ca kiểm thử tự động toàn diện:
     (1) `executor-posture-coverage doctor check is registered and visible in DOCTOR_CHECKS`
     (2) `executor-posture-coverage passes when all core capabilities have bwrap-capable executors`
     (3) `executor-posture-coverage fails and suggests remediation when an executor lacks bwrap sandbox`
     (4) `executor-posture-coverage passes when executors are native agents (in-process exemption)`
     (5) `executor-posture-coverage handles runner config loading failure gracefully`
     (6) `executor-posture-coverage only inspects core capabilities and capabilities declaring a pool`
     (7) `executor-posture-coverage skips tool-only capabilities that do not use agent postures`

5. **`test/setup/checks.test.mjs`** (`line 142`):
   - Thêm `'executor-posture-coverage'` vào danh sách kiểm tra snapshot của `DOCTOR_CHECKS`.

6. **`docs/specs/distribution.md`** (`line 71`):
   - Bổ sung tên check `executor-posture-coverage` kèm mô tả vào danh mục Doctor check (Data Dictionary mục #7).

7. **`docs/specs/runner.md`** (`line 1120`):
   - Bổ sung quy tắc nghiệp vụ cho doctor check `executor-posture-coverage` ngay sau RUL98.

8. **`CHANGELOG.md`** (`line 12`):
   - Ghi nhận tính năng mới dưới `## [Unreleased] -> ### Added`.

---

## 2. Kết quả kiểm thử Đỏ → Xanh (TDD)

Trước khi viết code sản xuất, file test `test/setup/executor-posture-coverage-check.test.mjs` được tạo và kiểm tra thấy đỏ đúng như kỳ vọng:

- **Fail ban đầu (Red):**
  ```
  Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../src/setup/executor-posture-coverage.mjs' imported from .../test/setup/executor-posture-coverage-check.test.mjs
  ```
- **Xanh sau khi hiện thực (Green):**
  Toàn bộ 7/7 ca test trong `test/setup/executor-posture-coverage-check.test.mjs` pass xanh (thời gian chạy ~211ms).

Tiếp đó, kiểm tra `test/setup/checks.test.mjs`:
- **Fail ban đầu (Red):**
  Tại dòng 56 (`DOCTOR_CHECKS has exactly the registered setup/doctor checks, including instruction-projections-stale`), `actual` đã có `executor-posture-coverage` do `registrations.mjs` đăng ký, nhưng `expected` chưa có.
- **Xanh sau khi cập nhật (Green):**
  Thêm `'executor-posture-coverage'` vào danh sách `expected`, test pass hoàn toàn.

---

## 3. Kết quả các bài kiểm thử Focused

Tất cả các bài kiểm thử focused chạy độc lập và chuẩn xác:

1. **`test/setup/*.test.mjs` liên quan doctor/registrations:**
   - `test/setup/executor-posture-coverage-check.test.mjs`: **7/7 pass**.
   - `test/setup/registrations.test.mjs`: **pass**.
   - `test/setup/workflow-pool-independence-check.test.mjs`: **pass**.
   - `test/setup/blind-steps-proven-pools-check.test.mjs`: **pass**.
   - `test/setup/checks.test.mjs`: **pass**.
   - Tổng cộng cụm setup doctor tests: **196/196 pass**.

2. **`test/workflow/*.test.mjs`:**
   - `test/workflow/units-runner.test.mjs`: **20/20 pass**.
   - `test/workflow/workflow-runner.test.mjs`: **58/58 pass**.
   - `test/workflow/units-source.test.mjs`: **pass**.
   - `test/workflow/seats.test.mjs`: **pass**.
   - `test/workflow/seat-evidence.test.mjs`: **pass**.
   - `test/workflow/discussion-workflows.test.mjs`: **pass**.
   - `test/workflow/business-discussion-workflow.test.mjs`: **pass**.
   - `test/workflow/architecture-advisory-workflow.test.mjs`: **pass**.
   - `test/workflow/advisory-m-contracts.test.mjs`: **pass**.
   - Tổng cộng: **120/120 pass**.

3. **`test/cli/subcommand-flag-drift.test.mjs`:**
   - **13/13 pass** (0 flag drift).

4. **`test/architecture.test.mjs`:**
   - **22/24 pass**. 2 ca fail liên quan đến kiểm tra đối chiếu file manifest kiến trúc:
     - `đủ sổ: file .mjs trên đĩa ↔ row trong manifest, một-một`
     - `import một chiều xuống: không file nào import ngược lên tầng trên`
     Nguyên nhân: file mới `src/setup/executor-posture-coverage.mjs` cần một dòng trong `docs/architecture-manifest.json` (`"src/setup/executor-posture-coverage.mjs": "use-case"`), nhưng file `docs/architecture-manifest.json` nằm ngoài write scope của Assignment này. Tuân thủ nghiêm ngặt execution contract ("Do not write it: list it in needsWrites"), file này được giữ nguyên và khai báo trong `needsWrites`.

---

## 4. Chạy thử check mới trên repository hiện tại

Chạy lệnh gọi trực tiếp qua Node.js trên repository `forgent`:

```bash
node -e '
import { checkExecutorPostureCoverage } from "./src/setup/executor-posture-coverage.mjs";
const res = await checkExecutorPostureCoverage(".");
console.log(JSON.stringify(res, null, 2));
'
```

**Kết quả thực tế trả về:**
```json
{
  "passed": true,
  "message": "all core capabilities have executors capable of read-only and workspace-write: execute -> claude (claude-cli-bwrap), code:implement -> gemini (agy-herdr-mucdong), advise -> claude (claude-cli-bwrap), fgos-coding-implement -> gemini (agy-herdr-mucdong), code:review -> openai (codex-herdr-fgovn), code:test -> claude (claude-cli-bwrap), code:debug -> openai (codex-herdr-fgovn), code:refactor -> claude (claude-cli-bwrap), marketing:research -> claude-herdr (claude-herdr-bwrap), marketing:write -> claude-herdr (claude-herdr-bwrap), marketing:publish -> claude-herdr (claude-herdr-bwrap), architecture:frame -> claude-herdr (claude-herdr-bwrap), architecture:shape -> claude-herdr (claude-herdr-bwrap), architecture:critique -> claude-herdr (claude-herdr-bwrap), architecture:synthesize -> claude-herdr (claude-herdr-bwrap), architecture:explain -> claude-herdr (claude-herdr-bwrap), business:frame -> claude-herdr (claude-herdr-bwrap), business:perspectives -> claude-herdr (claude-herdr-bwrap), business:critique -> claude-herdr (claude-herdr-bwrap), business:synthesize -> claude-herdr (claude-herdr-bwrap), business:plan -> claude-herdr (claude-herdr-bwrap), delphi:propose -> claude-herdr (claude-herdr-bwrap), delphi:synthesize -> claude-herdr (claude-herdr-bwrap), group-cognition:explore -> claude-herdr (claude-herdr-bwrap), group-cognition:critique -> claude-herdr (claude-herdr-bwrap), group-cognition:synthesize -> claude-herdr (claude-herdr-bwrap), nominal-group:generate -> claude-herdr (claude-herdr-bwrap), nominal-group:share -> claude-herdr (claude-herdr-bwrap), nominal-group:vote -> claude-herdr (claude-herdr-bwrap), nominal-group:rank -> claude-herdr (claude-herdr-bwrap), coding:discover -> claude-herdr (claude-herdr-bwrap), coding:explore -> claude-herdr (claude-herdr-bwrap), coding:plan -> claude-herdr (claude-herdr-bwrap), coding:validate -> claude-herdr (claude-herdr-bwrap)"
}
```

Check hoàn toàn PASS xanh trên repo, liệt kê rõ ràng các executor đáp ứng cả `read-only` và `workspace-write` cho mọi capability có pool.

---

## 5. Spec Delta & CHANGELOG Delta đã áp dụng

- **`docs/specs/distribution.md`**: Đã bổ sung check `executor-posture-coverage` vào bảng Data Dictionary #7.
- **`docs/specs/runner.md`**: Đã bổ sung quy tắc nghiệp vụ cho Doctor check `executor-posture-coverage`.
- **`CHANGELOG.md`**: Đã bổ sung mục ghi nhận tính năng mới dưới `## [Unreleased] -> ### Added`:
  > `- Added: `fgos doctor` check `executor-posture-coverage` verifies that core capabilities have executors capable of `read-only` and `workspace-write` postures, providing actionable remediation instructions when misconfigured.`

---

## 6. Phần còn ngỏ

1. `docs/architecture-manifest.json` cần bổ sung một dòng:
   `"src/setup/executor-posture-coverage.mjs": "use-case"`
   Do file này nằm ngoài write scope của Assignment nên không được phép sửa trực tiếp; đã đưa vào `needsWrites` trong claim kết quả.

---

Status: DONE_WITH_CONCERNS
