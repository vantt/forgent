# Phase 02: `fgos run --resume` nhận kết quả attempt qua adopt

Wave 1. Nhánh `controller-death/p02-resume-adopt`, worktree `.claude/worktrees/cd-p02`. Phụ thuộc: P00. Chủ `src/runner/execution/run.mjs`. `impact` trên `runUnit` trước khi sửa.

## Đọc trước

r6 §9.7 điểm 5, §16; T8 §4.4; plan.md D2, D6; [`run.mjs:160-190`](../../src/runner/execution/run.mjs) (`lastAttempts`, `commitPending`, `assertNoStrayCommit`), [`:329-372`](../../src/runner/execution/run.mjs) (nhánh resume, guard lock cwd do 4.2 P10 đã đổi), [`:687`](../../src/runner/execution/run.mjs) (`commitUnitWork`); [`assignment-runner.mjs:1574`](../../src/runner/dispatch/assignment-runner.mjs) (`supersedesRunId: record.predecessorRunId`).

## Yêu cầu

1. Trong nhánh `options.resumeUnitRunId`, trước `assertNoStrayCommit`: với mỗi attempt cuối (`lastAttempts`) có run dir v3 → `adoptRun(runDir)`:
   - `closed` và `result.json` có → đánh dấu attempt "đã có kết quả"; đường dispatch của unit **không** launch lại attempt đó; dùng `result.json` như kết quả trả về từ `executeAssignment` (cùng hình dạng `runResult`) rồi đi tiếp: commit `writes` (qua `commitPending`/`commitUnitWork` sẵn có), vòng reviewer, attempt kế, `unit-summary.json`.
   - `running`/`being-adopted` → ném `RunnerConfigError` mã `attempt-still-running` kèm runDir và lệnh xem.
   - `abandoned-not-started` (đã `closed` không có `result.json` pass) → attempt mới; ghi `predecessorRunId` để `supersedesRunId` khác null.
   - `legacy-run` → hành vi hôm nay (chạy lại) kèm cảnh báo một dòng (run cũ trước 6.2).
2. Tạo `runs/NN` mới bằng `mkdir` không `recursive` (D6) → `EEXIST` → `resume-in-progress`.
3. Nối `installCancelOnSignal` (P01) ở đầu `runUnit` (cả đường mới và resume).
4. Ghi `controller.json {tuple}` vào thư mục unit lúc bắt đầu (contract P00) để `inspect` biết controller còn sống.

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `src/runner/execution/run.mjs` |
| tạo | `test/run-supervisor/resume-adopts.test.mjs` |
| sửa | `test/runner/execution/run-resume*.test.mjs` (nếu kỳ vọng "chạy lại attempt đã pass") |

## Test

1. Controller SIGKILL sau binding; attempt settle bởi supervisor; `--resume` → không `runs/02`; agent fixture chạy đúng 1 lần; `unit-summary.json` có; commit `writes` có.
2. `--resume` khi attempt còn chạy → `attempt-still-running`, không side effect.
3. Controller chết trước spawn supervisor → adopt `abandoned-not-started` → `--resume` launch `runs/02` với `supersedesRunId = runs/01`.
4. Settle xong nhưng commit `writes` thất bại trước khi controller chết → `--resume` commit lại không spawn (đường `commitPending` hiện có).
5. Hai `--resume` đồng thời → một `resume-in-progress`.

Lệnh: `env -u … FGOS_HOST_BIN=<build> node --test test/run-supervisor/resume-adopts.test.mjs test/runner/execution/*.test.mjs`.

## Tiêu chí nghiệm thu / rollback

Năm ca xanh. Rollback: revert.
