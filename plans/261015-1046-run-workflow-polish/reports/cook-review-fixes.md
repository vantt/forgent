# Báo cáo Thực thi Sửa lỗi theo Đánh giá Độc lập (Review Fixes)

Kế hoạch: `plans/261015-1046-run-workflow-polish/`
Báo cáo: `cook-review-fixes.md`
Ngày thực hiện: 2026-10-15

---

## 1. Chi tiết sửa đổi từng mục theo quyết định của Lead (file:line) & Bằng chứng Đỏ → Xanh

### Mục H1: Sửa kỳ vọng của 3 test cũ đang đỏ sang exit code outcome mới
- **Các file sửa đổi**:
  - `test/cli/dir-differs-from-cwd.test.mjs:92`: Cập nhật `result.status` từ `0` sang `4` (mã của outcome `policy-refusal` do mock plan không có executor hợp lệ chạy foreground).
  - `test/cli/dir-differs-from-cwd.test.mjs:110`: Cập nhật `result.status` từ `0` sang `4`.
  - `test/runner/dispatch-execute-effort.test.mjs:13,329-333`: Chuyển từ `execFileSync` (ném lỗi khi exit non-zero) sang `spawnSync`, kiểm tra `res.status === 4` tương ứng với outcome `policy-refusal` khi yêu cầu reasoning effort `max` không được executor khai báo hỗ trợ.
- **Test đỏ trước sửa**:
  - `test/cli/dir-differs-from-cwd.test.mjs`: 2 tests thất bại với `AssertionError: 4 !== 0`.
  - `test/runner/dispatch-execute-effort.test.mjs`: Test `fgos run --effort reaches bind()` thất bại do `execFileSync` ném `Command failed ... status: 4`.
- **Test xanh sau sửa**: 29/29 tests pass trên 2 suite.

---

### Mục M1: Ghim account per-seat, bỏ qua unit không khớp provider, từ chối account không tồn tại lúc start
- **Các file sửa đổi**:
  - `src/workflow/runner.mjs:33,1047-1056`: Import `providerAccountInventory` từ `../runner/dispatch/provider-capacity.mjs`. Trong `prepareWorkflowRun`, kiểm tra nếu `account !== null`, kiểm tra tính tồn tại của account trong bất kỳ `runner.providers.*.accounts` nào; nếu không tồn tại, ném `RunnerConfigError` từ chối ngay trước khi tạo run.
  - `src/workflow/runner.mjs:618-641`: Trong `advanceWorkflowRun`, trước khi chạy `runUnit`, thực hiện dry-bind qua `simulateUnitBindings`. Nếu không có seat nào của unit khớp với provider của account (`!dry.roles.some((r) => r.account)`), gán `unitAccount = null` để unit chạy không ghim, không ném lỗi `RunnerConfigError: the pinned account applies to no seat of this unit`, không làm hỏng workflow.
  - `src/cli/command-registry.mjs:2067`: Cập nhật mô tả tham số `--account` phản ánh chính xác hành vi: `Pin the provider account for seats belonging to that provider; kept for resume. Seats on another provider run unpinned; refused if the account does not exist in any runner.providers.*.accounts.`
- **Test đỏ trước sửa**:
  - `test/workflow/units-runner.test.mjs`: Thêm 2 test:
    1. `workflow start with invalid --timeout or --account is refused before run exists`: fail vì account sai tên `unknown-acct` không bị từ chối lúc start.
    2. `workflow with two units on different providers pins account only on matching unit and both run`: fail vì unit thứ 2 (khác provider) bị lỗi `execution-failure`.
- **Test xanh sau sửa**: Cả 2 test mới và toàn bộ 21/21 tests trong `units-runner.test.mjs` pass xanh.

---

### Mục M2: Exit code outcome theo lệnh foreground, workflow status luôn 0, pendingInline luôn 0
- **Các file sửa đổi**:
  - `bin/fgos.mjs:5058-5079`: Giới hạn `isForegroundWorkflow` chỉ áp dụng cho `['start', 'resume', 'answer'].includes(positional[0]) && Boolean(flags.foreground)`. Nếu `data?.pendingInline` (hoặc `data?.results?.some(r => r.pendingInline)`) tồn tại (bàn giao inline bình thường), gán `process.exitCode = 0`. Lệnh `workflow status` không khớp điều kiện foreground nên luôn giữ `process.exitCode = 0`.
  - `docs/io-contract.md:82-83`: Cập nhật hợp đồng rõ ràng về các lệnh áp dụng outcome exit codes (`fgos run` và `fgos workflow start|resume|answer --foreground`), ghi nhận ngoại lệ bàn giao inline bình thường (`outcome: 'blocked'` kèm `pendingInline`) trả về 0, và các lệnh chỉ đọc như `workflow status` luôn trả về 0.
  - `docs/specs/runner.md:1120`: Cập nhật RUL99 liệt kê chính xác các lệnh áp dụng.
  - `test/cli/execution-outcome-exit-codes.test.mjs:192-225`: Thêm test CLI thực tế xác nhận `workflow status` trên workflow run đã thất bại luôn trả về mã thoát `0`.

---

### Mục M3 & M4: Đơn giản hóa Doctor check posture coverage & Xử lý cảnh báo thiếu pool
- **Các file sửa đổi**:
  - `src/setup/executor-posture-coverage.mjs`:
    - Loại bỏ mảng `POSTURES` và vòng lặp tách riêng `read-only`/`workspace-write`. Mỗi capability thực hiện đúng 1 lần dry `bind()` qua `bind({ unit, role: 'producer' }, { runnerConfig, session })`.
    - Loại bỏ seam tiêm `simulateUnitBindings` giả.
    - Phân loại lỗi:
      - `posture-unavailable` là lỗi chặn cứng (`passed: false`).
      - `headless-no-executor` hoặc `no-candidate` chỉ là CẢNH BÁO: `passed: true`, thông điệp bắt đầu bằng `'warning:'`. Hướng dẫn sửa: `Fix: Declare runner.capabilities.<cap>.prefer in .fgos/config.json.` (không nói dựa vào global pool nếu global cũng không có).
  - `docs/specs/distribution.md:71`: Cập nhật mô tả check trong Data Dictionary #7 sang "applying required posture; dry simulation via bind(), no process spawn".
  - `docs/specs/runner.md:1121`: Cập nhật mô tả check thành RUL100 có đánh số chuẩn mực.
  - `test/setup/executor-posture-coverage-check.test.mjs`:
    - Xoá 2 test tiêm mock `simulateUnitBindings` cũ.
    - Bổ sung 2 test chạy `bind()` thật với config fixture: 1 config có invocation bwrap (pass xanh); 1 config chỉ có invocation unconfined (fail đỏ với `posture-unavailable`).
    - Cập nhật test thiếu pool kiểm tra `passed: true` kèm tiền tố `warning:`.
- **Kết quả kiểm thử**: 11/11 tests pass trong `test/setup/executor-posture-coverage-check.test.mjs`.

---

### Mục L1: Tách riêng bảng OUTCOME_EXIT_CODES
- **Các file sửa đổi**:
  - `src/state/store.mjs:88-114`: Tách `OUTCOME_EXIT_CODES` đóng băng (`Object.freeze`) độc lập khỏi `EXIT_CODES` để tránh xung đột tên phân loại lỗi; `exitCodeForOutcome` đọc trực tiếp từ `OUTCOME_EXIT_CODES`.
  - `bin/fgos.mjs:18-22,32`: Cập nhật comment header và import `OUTCOME_EXIT_CODES`.
  - `test/cli/execution-outcome-exit-codes.test.mjs:48-59`: Kiểm tra `OUTCOME_EXIT_CODES` định nghĩa các mã kết cục, đồng thời xác nhận `EXIT_CODES` không bị trộn lẫn các mã outcome.

---

### Mục L2: Test CLI thực tế cho mã 10-14 và dọn sạch môi trường test
- **Các file sửa đổi**:
  - `test/cli/execution-outcome-exit-codes.test.mjs`:
    - Thêm test CLI thực tế chạy `fgos run` với worker script thoát mã 1, xác nhận CLI trả về exit code `11` (`execution-failure`) kèm JSON envelope `fgos.v1`.
    - Thay thế các đường dẫn `/tmp` hardcode bằng `makeFixtureDir()`.
    - Phân lập thư mục `stateDir` riêng cho từng test qua `XDG_STATE_HOME`, thu dọn sạch sẽ trong khối `finally`.
    - Trong test `workflow start detached`, chờ tiến trình con hoàn tất trạng thái trước khi xóa thư mục ở `finally` để tránh xóa repo khi tiến trình con đang chạy.
  - `test/helpers/fixture-dir.mjs`: Bổ sung kiểm tra ghi được (`isWritable`) và hỗ trợ `.fgos/runtime/tmp` khi `/var/tmp` read-only.
  - `test/runner/confinement-registry-fixture.helper.mjs`: Bảo đảm `XDG_STATE_HOME` được gán đường dẫn tạm thời ghi được trong sandbox test.

---

### Mục L3: Chuẩn hóa tài liệu RUL98, RUL99, RUL100 và CHANGELOG.md
- **Các file sửa đổi**:
  - `docs/specs/runner.md:1119-1121`:
    - RUL98: Ghi đúng nơi lưu là payload của sự kiện `workflow.start` (không phải `meta.json`); nêu rõ độ ưu tiên `--timeout`: của `fgos run` THẮNG `unit.timeoutMs` của Unit (RUL96), của `fgos workflow start` NHƯỜNG cho `unit.timeoutMs` tự khai; quy định rõ hành vi ghim `--account`.
    - RUL99: Cập nhật đầy đủ các lệnh áp dụng outcome exit code (`fgos run` và `fgos workflow start|resume|answer --foreground`), ghi nhận ngoại lệ `pendingInline` và `workflow status` trả về 0.
    - RUL100: Đặt bullet doctor check `executor-posture-coverage` đúng chỗ (sau RUL99) và đúng dạng (numbered RUL).
  - `CHANGELOG.md:10-14,32`:
    - Gộp danh sách `### Added` liền mạch, loại bỏ dòng trống chia cắt danh sách.
    - Bỏ tiền tố `Added:` thừa ở mục doctor check, sửa mô tả phù hợp với posture check đơn nhất.
    - Cập nhật mục `### Changed` ghi nhận chính xác các lệnh foreground và ngoại lệ `pendingInline`/`status`.

---

## 2. Kết quả kiểm thử toàn diện

Lệnh chạy theo yêu cầu:
```bash
env -u CLAUDE_CODE_SESSION_ID node --test \
  test/cli/dir-differs-from-cwd.test.mjs \
  test/cli/execution-outcome-exit-codes.test.mjs \
  test/runner/dispatch-execute-effort.test.mjs \
  test/setup/executor-posture-coverage-check.test.mjs \
  test/architecture.test.mjs \
  test/cli/subcommand-flag-drift.test.mjs \
  test/setup/checks.test.mjs \
  test/workflow/units-runner.test.mjs \
  test/workflow/business-discussion-workflow.test.mjs \
  test/workflow/discussion-workflows.test.mjs \
  test/workflow/seat-evidence.test.mjs \
  test/workflow/seats.test.mjs \
  test/workflow/units-source.test.mjs \
  test/workflow/workflow-runner.test.mjs \
  test/workflow/advisory-m-contracts.test.mjs \
  test/workflow/architecture-advisory-workflow.test.mjs
```

Kết quả tổng hợp:
```
ℹ tests 317
ℹ suites 0
ℹ pass 317
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 46947.921655
```

Toàn bộ 16 file kiểm thử (317 tests) đạt 100% GREEN, không có lỗi rớt, không có test bị bỏ qua hay hủy.

---

Status: DONE
Summary: Hoàn tất 8/8 yêu cầu rà soát độc lập (H1..L3) theo chỉ đạo của Lead. Sửa 3 test CLI cũ sang kỳ vọng exit code mới (H1); hoàn thiện cơ chế ghim account workflow per-seat linh hoạt và từ chối tài khoản không tồn tại lúc start (M1); chuẩn hóa exit code foreground, lệnh status đọc luôn 0 và bàn giao inline 0 (M2); tinh giản doctor check posture chạy bind khô trực tiếp không mock (M3); chuyển thiếu pool sang cảnh báo passed:true (M4); tách riêng OUTCOME_EXIT_CODES (L1); bổ sung test CLI thực tế cho exit 11 và dọn dẹp fixture an toàn (L2); đồng bộ tài liệu RUL98, RUL99, RUL100 và CHANGELOG (L3). 317/317 tests xanh toàn bộ.
