# Phase 06: cửa adopt (route `fgos internal adopt`)

Wave 1. Nhánh `run-supervisor/p06-adopt`, worktree `.claude/worktrees/rs-p06`. Phụ thuộc: P00; nghiệm thu cần step runner của P04.

## Đọc trước

r6 §9.7 (ma trận phục hồi, điểm 1–7), §9.8, §6.0.1 (adopt dùng luật này), §10; kongming N3, N6; [`settlement.mjs:403-432`](../../src/runner/dispatch/settlement.mjs) (`alreadySettledByUs`).

## Yêu cầu

1. `adopt --run-dir <p>`:
   - Run không có `attempt.lock` hoặc envelope không phải v3 → `{status: legacy-run}`, không chạm gì (D10).
   - `probe` lock attempt (`LOCK_SH|LOCK_NB`, N6) và `containment.is_empty(binding.domain)` (không binding → miền không tồn tại → rỗng). Lock bị giữ: marker `adopting.json` có → `being-adopted`; không → `running`.
   - Lock trống nhưng miền chưa rỗng → acquire EX qua holder-lock (luật 6.0.1 tự kết thúc miền và chờ trong `lock.predecessorKillWaitMs`); quá hạn → `held (predecessor-domain-not-empty)`, không làm gì thêm.
   - Giữ EX: ghi `adopting.json` → đi ma trận: không binding, không receipt → receipt tổng hợp `abandoned-not-started`; binding có, `gate-exit` chưa, receipt chưa → receipt `gate-lost` (kèm `outboxPresent`); `gate-exit` có, receipt chưa → receipt từ `gate-exit` + outbox (`synthesizedBy: adopt`); rồi chạy step runner (P04) trên các bước chưa có receipt bước. Mọi bước có receipt → publish `closed.json`, xoá `adopting.json`, nhả lock.
   - Outbox có kết quả thì bước `settle-attempt` (P07) settle từ outbox bất kể `stoppedBy` (r6 §9.7 điểm 3) — adopt chỉ ghi `outboxPresent` vào receipt.
2. `--probe-only` (cả `--run-dir` và `--scan`): chỉ `probe` + `is_empty`, trả trạng thái, không acquire EX, không ghi file.
3. `adopt --scan`: đọc danh sách run dir ở stdin (Node client liệt kê run chưa `closed.json`), probe tất cả trong **một** process, chỉ adopt run trống + rỗng; in một dòng JSON mỗi run. Mục tiêu < 50 ms cho 2000 run đã `closed` (bỏ qua bằng `stat(closed.json)` trước khi mở lock).
4. Hai adopter đồng thời: kernel lock tuần tự hoá; adopter thứ hai thấy `being-adopted` hoặc `closed`.
5. Client Node mỏng `src/run-supervisor/client.mjs`: `adoptRun(runDir, {probeOnly})`, `adoptScan({assignmentsRoot, probeOnly})` (liệt kê `*/**/runs/*` chưa `closed.json` rồi gọi route bằng `spawnSync`), `resolveHostBin` một lần mỗi process; lỗi route → ném có tên.

## File sở hữu

| Hành động | File |
|---|---|
| tạo | `packages/run-supervisor/rust/src/adopt.rs`, `packages/run-supervisor/rust/tests/{adopt_matrix.rs,adopt_concurrency.rs,adopt_scan_perf.rs}` |
| tạo | `src/run-supervisor/client.mjs`, `test/run-supervisor/adopt-client.test.mjs` |

## Test

1. Mỗi dòng ma trận 9.7 dựng bằng run dir fixture + lock thật: kết quả và file đúng; chạy adopt hai lần → lần hai `closed`, không bước nào chạy lại (đếm file side effect của bước fixture).
2. Lock bị giữ bởi process khác → `running`; có `adopting.json` → `being-adopted`.
3. Miền `linux-gate` của gate đã chết nhưng process cháu (giả lập: tuple gate trỏ process còn sống) → adopter kết thúc rồi mới đi tiếp.
4. Hai adopter đồng thời (P4 ca E): một `adopted`, một `being-adopted`; bước fixture chạy đúng một lần.
5. Scan 2000 run `closed` + 5 run cần adopt: thời gian scan phần bỏ qua < 50 ms (đo, ghi báo cáo; máy chậm cho phép ghi số thay vì fail).
6. Run cũ không có `attempt.lock` → `legacy-run`, không thay đổi file nào.

Lệnh: `cargo test -p fgos-run-supervisor adopt`; `FGOS_HOST_BIN=<build> node --test test/run-supervisor/adopt-client.test.mjs`.

## Tiêu chí nghiệm thu / rollback

Sáu ca xanh. Rollback: revert.
