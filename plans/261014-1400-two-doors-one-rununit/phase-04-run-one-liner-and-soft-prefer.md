# Phase 04 — `bind()` ưu tiên mềm + `fgos run "<prompt>"` + `--effort`

Mốc M1, bước B (song song 02, 03, 05-core; cần 01) · Lane L4 (`feat/rununit-run`) · Ước lượng 1.25d · Rủi ro: trung bình (`bind` HIGH) · Red-team bắt buộc

## Context

- Quyết định Lead #2, #3; packet r4 C, R1. 01 đã cho Unit có `prefer` (`[executorId | {executor, invocation?}]`) và `persona`.
- Hiện trạng của `bind()`:
  - Override có `executor` thay cả pool bằng đúng một ứng viên (`src/runner/execution/bind.mjs:149-156`).
  - `candidateSource` là biến cục bộ, một giá trị cho cả pool (`:151-162`). Provenance ghi `provenance.executor = { value, source: candidateSource }` (`:413-414`). Record thật: `{"value":"openai","source":"override"}` (V-M2).
  - Persona theo thứ tự override > locked > capability (`:390-409`).
  - Không có filter quarantine. `provider-limit` đi qua failover `nextCandidate` (`:468`, `run.mjs:~530`).
- `fgos run` chỉ nhận `--unit`/`--resume` (`bin/fgos.mjs:2682-2685`). Lane B (đã gom ở 00) đã có `--effort` làm override của `bind()`.

## Requirements

1. **`bind()` mềm.** Khi không có override `executor`:
   - Pool = `unit.prefer` (chuẩn hoá) đặt trước `capability.prefer`, khử trùng theo executor+invocation, giữ thứ tự.
   - Mỗi phần tử của pool mang `source` riêng: `'unit-prefer'` hoặc `'capability:<key>'`. `provenance.executor.source` lấy `source` của **ứng viên được chọn**.
   - Executor trong `unit.prefer` mà chưa đăng ký: bỏ qua như một filter (`refusalReason: 'unknown-executor'`), không ném lỗi.
   - Mọi filter cũ vẫn áp như cũ: governance, family-excluded, independence, posture, blind.
   - `--override` vẫn là ghim cứng.
2. **Persona.** Thứ tự: override > unit.persona > capability.
   - `lockedPersona` xung đột với `unit.persona` thì `refused: locked-persona`.
   - Provenance `persona.source: 'unit'`.
3. **Cổng mutating (RUL73.4).** Assignment-runner tính lại `bind()` từ `unit.json`; Unit có `prefer` vẫn phải qua được cổng này.
4. **One-liner.** `fgos run "<prompt>" [--provider <id>[,<id>...]] [--persona <name>] [--writes <a>,<b>] [--capability <c>] [--rigor <r>] [--pattern <p>] [--effort <e>] [--worktree <wt>] [--override <json>]`.
   - Dựng `unitData` rồi gọi `runUnit({unitData})`.
   - `id`: `adhoc-<slug ascii ≤40>-<4 hex>`.
   - `--provider` sai: lỗi liệt kê các id hợp lệ, **trước khi** tạo thư mục unit run.
   - `--writes` chạy từ main checkout mà không có `--worktree`: lỗi hướng dẫn tạo worktree. Tự tạo worktree là item riêng sau M1 (Lead #11).
   - Không có `--writes`: Unit chỉ đọc, thay cho `--contract`.
   - `--effort` đi đúng đường của lane B.
   - `--capability` mặc định là `execute`. Posture lấy từ `writes` (`bind.mjs:139`).
5. **Help** trong `src/cli/command-registry.mjs`, rồi chạy `node scripts/export-command-selectors.mjs --check`. Không thêm verb.

## Files

Sở hữu: `src/runner/execution/bind.mjs`; `bin/fgos.mjs` (case `run`); `src/cli/command-registry.mjs`; các test `test/runner/execution/bind.test.mjs`, `run-provider-failover.test.mjs`, `test/cli/run-verb.test.mjs`.

Chỉ đọc: `unit.mjs` (01), `run.mjs`, `assignment-runner.mjs`, `src/workflow/runner.mjs`.

## Bước

1. Chạy impact cho `bind` và ghi lại.
2. Test đỏ `bind`:
   - prefer [A], capability [B, C]: chọn A, `provenance.executor.source == 'unit-prefer'`.
   - Chọn B (A bị lọc): source là `capability:<key>`.
   - A bị governance chặn: rơi sang B.
   - Reviewer có `independentOf` cùng họ với A: A bị lọc.
   - A không có invocation ghi: A bị lọc.
   - Executor không tồn tại: bỏ qua.
   - Persona: locked xung đột thì từ chối; override thắng unit.
   - `nextCandidate` sau A rơi sang B.
   - Unit không có `prefer`: binding y hệt snapshot cũ.
3. Test đỏ failover (fixture câu hết hạn mức của lane C): Unit prefer [A] với A hết hạn mức, attempt 2 chạy B. Unit mutating có prefer qua được cổng binding.
4. Test đỏ `run-verb`:
   - Dựng unit đúng.
   - `--provider` sai: lỗi, không có thư mục mới.
   - `--writes` từ main checkout: lỗi đúng câu.
   - Không `--writes`: `writes: []`.
   - `--effort` vào override.
   - Có cả `--provider` và `--override`: override thắng.
5. Sửa code cho xanh, rồi `npm test`. Báo cáo kèm Spec delta (decision 0061) và CHANGELOG delta.

## Đòn red-team (tối thiểu)

1. Prefer mềm vượt qua được bất kỳ filter nào của `bind()`, ví dụ governance hay independence. Nếu có thì sửa tích hợp; failover vẫn giữ (owner #3).
2. Resume Unit có `prefer` sau khi config đổi (executor bị xoá hoặc bị governance chặn): binding đã ghi được dùng lại hay bị tính lại? Kết quả phải khớp với cổng mutating.
3. Prefer với blind panel, `--seats`, spread `preferIndependentOf`: thứ tự ưu tiên có phá spread không?
4. Prompt có ký tự đặc biệt hoặc rất dài: `id` vẫn ascii và ổn định.
5. `--persona` trỏ tới persona không tồn tại: lỗi lúc nào, trước hay sau khi spawn.

## Rủi ro + rollback

- `bind` HIGH (6 caller). Unit không có `prefer` phải cho binding giống hệt cũ; snapshot test hiện có không được đổi.
- Rollback: revert commit của lane.

## Xong khi

- Các ca ở bước 2-4 xanh; snapshot cũ không đổi.
- `npm test` exit 0.
- Review và red-team pass.
