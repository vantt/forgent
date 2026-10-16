# Phase 08: cutover full-suite queue (họ `machine-files`)

Wave 3. Nhánh `holder-lock/p08-full-suite`, worktree `.claude/worktrees/hl-p08`. Phụ thuộc: P03, P04. Luật chung: [phase 06](phase-06-cutover-gateway-sessions-runner.md#luật-chung-của-mọi-phase-cutover-p06p10).

## Yêu cầu

- `acquireFullSuiteQueue` ([`full-suite-queue.mjs:53`](../../scripts/lib/full-suite-queue.mjs)): v3 = lease phạm vi máy ở `<lockRoot>/full-suite.lock`, chờ không giới hạn như hôm nay nhưng bằng `--try` lặp mỗi 2 s (giữ thông báo "another full-suite run holds..."; holder liệt kê bằng `holders()` thay vì đọc record). Giữ `QUEUE_SWITCH_ENV=off` và `QUEUE_HELD_ENV` (hành vi người dùng có sẵn, không phải nhánh test).
- Tiến trình con của suite: `QUEUE_HELD_ENV=1` như hôm nay; **không** truyền description cho con (không mượn).
- `scripts/` chạy từ checkout, không qua release: facade tìm binary qua `FGOS_HOST_BIN` hoặc activation của checkout; không tìm được → đường v1 (marker họ máy chỉ được bật khi driver có, nên nhánh này chỉ xảy ra trên checkout không có binary — ghi rõ trong thông báo).

## Rủi ro riêng

Worktree nhánh cũ (trước 4.2) chạy `npm test` sau khi bật họ máy: v1 gặp tombstone ở `os.tmpdir()/fgos-full-suite.lock` → `open('wx')` trả `EEXIST`, `readHolder` trả `null`, vòng `unlinkSync` thất bại trên thư mục → **lặp vô hạn** ([`full-suite-queue.mjs:66-86`](../../scripts/lib/full-suite-queue.mjs)). Giảm thiểu: runbook P12 catch-up mọi worktree đang mở trước khi bật họ máy; CHANGELOG nói rõ `FGOS_FULL_SUITE_QUEUE=off` là cách chạy nhánh cũ. `/tmp` bị dọn khi reboot làm mất tombstone: chấp nhận (tác hại tối đa là hai suite chạy cùng lúc, không sai dữ liệu).

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `scripts/lib/full-suite-queue.mjs` |
| sửa | `test/scripts/full-suite-queue.test.mjs`, `test/scripts/run-tests.test.mjs` (bản sao lib ở `:262-276` phải kèm `src/holder-lock/`) |

## Test

Hai chế độ; v3: hai process `acquireFullSuiteQueue` → một chờ; holder SIGKILL → người chờ vào trong ≤ 2 s. Lệnh: `env -u ... FGOS_HOST_BIN=<build> node --test test/scripts/full-suite-queue.test.mjs test/scripts/run-tests.test.mjs`.

## Dòng CHANGELOG

- Changed: hàng đợi full suite dùng kernel lock phạm vi máy (`<state root>/locks/full-suite.lock`) sau khi bật `machine-files`. Nhánh tạo trước thay đổi này chạy `npm test` sẽ đứng chờ mãi ở hàng đợi cũ: rebase, hoặc chạy với `FGOS_FULL_SUITE_QUEUE=off`.

## Rollback

Revert commit; họ đã bật thì revert cutover trước.
