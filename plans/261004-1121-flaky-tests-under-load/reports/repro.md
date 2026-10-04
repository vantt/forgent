# Tái hiện dưới tải

Base: `d4ca40ad0` (worktree `forgentX-flaky-base`). Sau sửa: HEAD của nhánh `fix/flaky-tests-under-load`.

## Nguyên nhân và cách sửa

| Test | Nguyên nhân (trên base) | Sửa |
|---|---|---|
| `test/runner/provider-capacity.test.mjs:403` (marker-race, kéo cả file treo) | Mỗi trial fork ~15 contender (`:444`, ~150 tiến trình tổng). Một contender chết (người giữ khoá đói quá ngân sách chờ của khoá làm các contender khác throw) khiến cha chờ phản hồi mãi. Contender sống giữ event loop của file sau khi test timeout vì dọn dẹp nằm trong `finally` (`:469`) mà thân test đã timeout không bao giờ chạy tới. | Một pool contender cho mỗi test, dùng lại qua mọi trial (10 tiến trình thay ~150); trial fail có tên contender thoát sớm; kill pool qua `t.after`. Code khoá không đổi: không thấy cấp trùng. |
| `test/runner/dispatch.test.mjs:6016` (overlapping execution windows) | Executor ngủ 3s (`:6028`, `Atomics.wait`) trong timeout executor 5s (`:6043`); máy bận làm executor thứ hai quá 5s. | Mỗi executor chờ tới khi thấy peer đã start (rendezvous); fan-out tuần tự không thể thoả, máy chậm không phá được. Bỏ `timeoutMs: 5000` và sleep 3s. |
| `test/runner/dispatch-production-call-sites.test.mjs:708` (`settleClaim: writer identity mismatch`) | Lỗi code thật: `src/util/session-identity.mjs:116` hỏi `ps -o ppid=` cho từng tổ tiên với timeout 200ms (`:99`). Máy bận, `ps` quá hạn, vòng đi lên dừng ở hop khác nhau giữa các tiến trình, nên writer id lúc claim khác lúc settle. | Linux đọc ppid từ `/proc/<pid>/stat` (không có gì để timeout); `ps` chỉ còn là fallback ngoài Linux. Test mới trong `test/util/session-identity.test.mjs`. |

Lưới an toàn: `scripts/run-tests.mjs` + `scripts/lib/test-file-watchdog.mjs` kill cây tiến trình của file quá hạn (mặc định 10 phút, `FGOS_TEST_FILE_TIMEOUT_MS`, override theo file), báo tên, exit ≠ 0, suite tiếp tục. Test: `test/scripts/run-tests.test.mjs` (31/31 xanh, gồm "a hung test file is killed with its whole process tree, named, and the rest of the suite still runs").

## Số liệu dưới tải giả

Lệnh (mỗi bên 5 vòng, `node --test` trên 3 file, 2 vòng CPU `node` + không cấp phát RAM, kill sau khi đo):

```
node scripts/stress-test-files.mjs --rounds=5 --burners=2 --burner=node --round-timeout-s=240 \
  test/runner/provider-capacity.test.mjs test/runner/dispatch.test.mjs test/runner/dispatch-production-call-sites.test.mjs
```

| | pass | fail | hang | thời gian mỗi vòng |
|---|---|---|---|---|
| base `d4ca40ad0` | 5 | 0 | 0 | 22.4-23.4s |
| sau sửa | 5 | 0 | 0 | 18.1-18.6s, một vòng 29.8s |

Kết luận trung thực: tải nhẹ (2 vòng CPU trên 16 lõi, khoảng 3.4 GB RAM trống) KHÔNG tái hiện lỗi trên base. Các lần đỏ/treo ban đầu xảy ra khi máy vừa thiếu RAM (swap đầy) vừa có tải nặng, điều kiện mà ràng buộc an toàn của lần đo này (không cấp phát RAM, tối đa 2 vòng CPU) không dựng lại được. Nguyên nhân do đó dựa trên đọc code và bằng chứng lỗi ban đầu, không phải tái hiện số liệu. Sau sửa nhanh hơn do ít tiến trình hơn (10 thay vì ~150 contender).
