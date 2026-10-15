# Báo cáo Thực thi Phase 03 & Việc A: Chuẩn hóa bảng exit code cho run/workflow & Hoàn thiện posture check

Kế hoạch: `plans/261015-1046-run-workflow-polish/`
Phase: 03 (`phase-03-outcome-exit-codes.md`) kèm Review Việc A Phase 02
Ngày thực hiện: 2026-10-15

---

## 1. Các file và vị trí sửa đổi (file:line)

### Việc A: Hoàn thiện Phase 02 theo review của Lead
1. **`src/setup/executor-posture-coverage.mjs`** (`lines 62, 68-73, 84, 89-94, 112-122, 132-159`):
   - Nhận `options.simulateUnitBindings` nếu có (hỗ trợ mô phỏng test khô mà không cần spawn tiến trình thật).
   - Kiểm tra thuộc tính `mutates` của capability: `const requiresWorkspaceWrite = CORE_CAPABILITIES.includes(cap) || entry?.serves?.mutates === true;`. Nếu capability chỉ-đọc (không có `serves.mutates === true`), chỉ kiểm tra posture `read-only`.
   - Phân loại và gom nhóm lỗi theo nguyên nhân từ chối:
     - `posture-unavailable`: Hướng dẫn thêm invocation có `sandbox.backend "bwrap"` hoặc gỡ bỏ override local khỏi `.fgos/config.json`.
     - `headless-no-executor` / `no-candidate`: Hướng dẫn khai báo `runner.capabilities.<cap>.prefer` trong `.fgos/config.json` hoặc cấu hình pool global `~/.fgos/config.json`.
     - Các lỗi khác: Liệt kê chi tiết nguyên nhân.

2. **`test/setup/executor-posture-coverage-check.test.mjs`** (`lines 183-331`):
   - Bổ sung 4 ca kiểm thử chuyên sâu:
     (1) Capability chỉ-đọc có pool chỉ mang được `read-only` posture vẫn pass xanh.
     (2) Capability có `serves.mutates === true` đòi hỏi `workspace-write` và fail nếu thiếu.
     (3) Lỗi `headless-no-executor` / `no-candidate` báo đúng hướng dẫn cấu hình pool prefer thay vì bwrap.
     (4) Gom nhóm rõ ràng khi đồng thời xuất hiện cả 2 loại lỗi `posture-unavailable` và `headless-no-executor`.

### Việc B: Thực hiện Phase 03 (Outcome Exit Codes)
1. **`src/state/store.mjs`** (`lines 88-95, 97-108`):
   - Bổ sung mã `policy-refusal` (4) và các mã kết cục thực thi mới 10-14 vào bảng hằng số `EXIT_CODES` duy nhất của repo:
     - `policy-refusal`: 4
     - `provider-limit`: 10
     - `execution-failure`: 11
     - `partial-writes`: 12
     - `blocked`: 13
     - `findings`: 14
   - Export hàm thuần `exitCodeForOutcome(outcome)`: ánh xạ `'pass' -> 0`, các mã kết cục sang `EXIT_CODES[outcome]`, và fallback mã `1` cho các outcome không xác định.

2. **`bin/fgos.mjs`** (`lines 18-21, 31, 5051-5070`):
   - Cập nhật comment header tại dòng 18-21 ghi nhận bảng mã thoát `EXIT_CODES` mở rộng 10-14 cho execution outcomes.
   - Import `exitCodeForOutcome` từ `../src/state/store.mjs`.
   - Cập nhật logic gán `process.exitCode` trong hàm `main()`: khi `verb === 'run'` có `data.outcome` hoặc `verb === 'workflow'` chạy foreground kết thúc (không phải `running`) có `data.outcome`, gán `process.exitCode = exitCodeForOutcome(data.outcome)`. Envelope JSON stdout `fgos.v1` được giữ nguyên vẹn 100%. Lệnh `workflow start` detached vẫn giữ mã thoát 0 khi spawn daemon thành công.

3. **`test/cli/execution-outcome-exit-codes.test.mjs`** (NEW, `lines 1-155`):
   - Kiểm tra `EXIT_CODES` khai báo đầy đủ 10-14 và `policy-refusal: 4`.
   - Kiểm tra `exitCodeForOutcome` ánh xạ chuẩn xác mọi trường hợp (`pass`, non-pass, null, undefined, unknown).
   - Kiểm tra tích hợp CLI `fgos run` trả về exit code `0` trên `pass`, `4` trên `policy-refusal` kèm JSON envelope hợp lệ `fgos.v1`.
   - Kiểm tra tích hợp CLI `fgos workflow start` detached trả về exit code `0`.
   - Kiểm tra tích hợp CLI `fgos workflow start --foreground` trả về exit code tương ứng outcome của step thất bại.

4. **`docs/specs/runner.md`** (`lines 1120-1121`):
   - Cập nhật chi tiết quy tắc Doctor check posture cho capability chỉ-đọc và gom lỗi.
   - Bổ sung quy tắc nghiệp vụ **RUL99** về bảng mã thoát outcome thực thi của `fgos run` và `fgos workflow start`.

5. **`docs/io-contract.md`** (`lines 73-83`):
   - Cập nhật mục "Mã thoát (exit code) — một nguồn duy nhất" ghi nhận các mã 10-14 và mô tả hợp đồng CLI exit code cho `fgos run` và `fgos workflow start --foreground`.

6. **`CHANGELOG.md`** (`line 33`):
   - Ghi nhận thay đổi exit codes dưới `## [Unreleased] -> ### Changed`.

---

## 2. Kết quả kiểm thử Đỏ → Xanh (TDD)

### Việc A
- **Fail ban đầu (Red):**
  - Ca test `executor-posture-coverage demands workspace-write for capabilities with serves.mutates === true`: nhận `actual: true` thay vì `false` do chưa truyền hàm mock `simulateUnitBindings`.
  - Ca test `executor-posture-coverage fails and provides pool configuration guidance on headless-no-executor / no-candidate`: `result.message` không khớp `/no candidate executor available/` và vẫn in hướng dẫn bwrap.
  - Ca test `executor-posture-coverage groups failures by reason when both posture and candidate failures occur`: lỗi chưa được gom nhóm theo nguyên nhân.
- **Xanh sau khi sửa (Green):**
  - Toàn bộ 11/11 tests trong `test/setup/executor-posture-coverage-check.test.mjs` pass xanh (thời gian chạy ~109ms).

### Việc B
- **Fail ban đầu (Red):**
  - Chạy `test/cli/execution-outcome-exit-codes.test.mjs`: ném lỗi cú pháp `SyntaxError: The requested module '../../src/state/store.mjs' does not provide an export named 'exitCodeForOutcome'`.
- **Xanh sau khi sửa (Green):**
  - Toàn bộ 7/7 tests trong `test/cli/execution-outcome-exit-codes.test.mjs` pass xanh (~19.9s).

---

## 3. Kết quả các bài kiểm thử Focused

Tất cả các bài kiểm thử chỉ định chạy độc lập:
- `test/cli/execution-outcome-exit-codes.test.mjs`: **7/7 pass**.
- `test/setup/executor-posture-coverage-check.test.mjs`: **11/11 pass**.
- `test/cli/subcommand-flag-drift.test.mjs`: **13/13 pass**.
- `test/cli/fgos-workflow.test.mjs`: **7/7 pass**.
- `test/setup/checks.test.mjs`: **110/110 pass**.
- `test/setup/workflow-pool-independence-check.test.mjs`: **pass**.
- `test/setup/blind-steps-proven-pools-check.test.mjs`: **pass**.
- `test/architecture.test.mjs`: **22/24 pass**. 2 ca fail liên quan đến `docs/architecture-manifest.json` do file này nằm ngoài write scope (giữ nguyên không sửa để tuân thủ execution contract; ghi vào `needsWrites`).

---

## 4. Chạy thử `fgos run "x" --writes README.md` từ thư mục repo trong sandbox

Khi thực thi trực tiếp:
```bash
node bin/fgos.mjs run "x" --writes README.md
```
- **Kết quả thực tế:** Quá trình dừng với exit code `1` kèm thông báo:
  ```
  fgos: ENOENT: no such file or directory, mkdir '/home/vantt/projects/forgentX/.fgos/assignments/unit-run-1792040461721-4c0b9b5c'
  ```
  Khi truyền `--dir .`:
  ```
  fgos: /home/vantt/projects/forgentX-worktrees/plan-run-polish is not the main checkout of its repository; pass the main checkout as repoRoot
  ```
- **Giải thích nguyên nhân:** Thư mục môi trường làm việc hiện tại (`/home/vantt/projects/forgentX-worktrees/plan-run-polish`) là một git worktree liên kết được mount vào sandbox. Đường dẫn main checkout gốc theo git là `/home/vantt/projects/forgentX` không tồn tại thư mục `.fgos/` trên hệ thống file của container sandbox, dẫn đến việc tạo thư mục assignments bị lỗi ENOENT trước khi đi vào logic kiểm tra worktree.
- **Chứng minh trong môi trường tiêu chuẩn:** Trong ca test tự động của `test/cli/execution-outcome-exit-codes.test.mjs` trên repo fixture cô lập, khi gặp `policy-refusal`, `fgos run` trả về đúng exit code `4` và xuất toàn vẹn phong bì JSON `fgos.v1`.

---

## 5. Spec Delta & CHANGELOG Delta đã áp dụng

- **`docs/specs/runner.md`**:
  - Cập nhật quy tắc Doctor check posture cho capability chỉ-đọc và gom lỗi theo lý do.
  - Bổ sung quy tắc **RUL99** về bảng exit codes thực thi `0, 4, 10, 11, 12, 13, 14`.
- **`docs/io-contract.md`**:
  - Bổ sung bảng mã thoát kết cục thực thi 10–14 vào mục "Mã thoát (exit code) — một nguồn duy nhất".
  - Nêu rõ hợp đồng trả mã lỗi cho `fgos run` và `fgos workflow start --foreground` khi outcome không phải `pass`.
- **`CHANGELOG.md`**:
  - Bổ sung mục ghi nhận dưới `## [Unreleased] -> ### Changed`.

---

## 6. Phần còn ngỏ

1. `docs/architecture-manifest.json` cần bổ sung một dòng:
   `"src/setup/executor-posture-coverage.mjs": "use-case"`
   Do file nằm ngoài write scope của Assignment nên không được phép chỉnh sửa trực tiếp; đã đưa vào `needsWrites` trong claim kết quả.

---

Status: DONE_WITH_CONCERNS
