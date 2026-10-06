# Provider-capacity lease lock-wait fix (S3 vòng 1 flake)

Ngày 2026-10-06. Nhánh main, chưa commit (lead commit).

## Kết luận

Flake của test S3 vòng 1 (`concurrent contenders racing a pre-seeded stale lock (dead pid) never lose a lease`) là **hết thời hạn chờ khoá 5 s**, không phải mất lease. Đã thêm tham số tuỳ chọn `lockWaitMs` cho `acquireProviderAccountLease`; contender của S3 vòng 1 truyền `300_000`, giống tiền lệ vòng 2. Dưới tải fsync: trước 7/10 fail, sau 0/10, đột biến 8/10 fail.

## Số đo

Lệnh: `env -u CLAUDE_CODE_SESSION_ID node scripts/stress-test-files.mjs --burner=fsync --burners=16 --rounds=10 [--log-dir=…] test/runner/provider-capacity.test.mjs`. Máy 16 lõi. Chạy tuần tự, không chồng nhau.

| Phép đo | Giờ | loadavg lúc bắt đầu → lúc kết thúc | Kết quả | Thời gian mỗi vòng |
|---|---|---|---|---|
| TRƯỚC (code gốc) | 22:03:55–22:09:34 | 1.39 → 22.43 | **7/10 fail**, 0 hang | 25.6–45.7 s |
| SAU (có sửa) | 22:10:55–22:18:14 | 7.48 (còn dư sau phép đo trước) → 24.11 | **0/10 fail**, 0 hang | 32.3–58.6 s |
| ĐỘT BIẾN (bản sao, bỏ `lockWaitMs` của contender) | 22:18:32–22:25:21 | 18.06 → 23.03 | **8/10 fail**, 0 hang | 30.9–50.9 s |

Chữ ký lỗi, giống nhau ở cả 7 + 8 vòng fail. Chỉ test S3 vòng 1 fail, không test nào khác:

```
Error: a contender failed:
ProviderCapacityLockError: provider-capacity lock at ".../state-lock" is still held by a live process (pid N) after waiting.
    at acquireGenerationLock (provider-capacity.mjs:494)
    at withFileLock (provider-capacity.mjs:536)
    at acquireProviderAccountLease (provider-capacity.mjs:650)
```

Không vòng nào có lỗi khẳng định "lease in state.json" (mất lease thật): 0/7 trước, 0/8 đột biến. Vậy giả thuyết đúng, nên làm tiếp.

## Thay đổi

- `src/runner/dispatch/provider-capacity.mjs`: `acquireProviderAccountLease` nhận thêm `lockWaitMs` (tuỳ chọn, ở cuối đối tượng đối số) và truyền `{ waitMs: lockWaitMs }` cho `withFileLock`. Nếu không truyền thì giá trị là `undefined`, nên tham số mặc định `waitMs = 5000` của `withFileLock` được dùng. Hành vi sản phẩm vì vậy giữ nguyên 5000. Các hàm khác (release/quarantine/clear) không đổi.
- `test/runner/provider-capacity.test.mjs`:
  - Contender của S3 vòng 1 truyền `lockWaitMs: 300_000`, kèm chú thích: thuộc tính được kiểm là "không mất lease", không phải "chờ bao lâu". Số lượt, số contender, đồng bộ 'go' và khẳng định đều giữ nguyên.
  - Test mới `lease acquire waits for a live lock holder only as long as lockWaitMs, and by default outlasts a short hold`. Một tiến trình node thật giữ khoá 1500 ms bằng `withFileLock`. `lockWaitMs: 50` phải ném `ProviderCapacityLockError` (đúng `holderPid`) trước 1500 ms. Khi bỏ `lockWaitMs`, lệnh gọi phải chờ qua lúc người giữ nhả khoá rồi mới `selected`. Kiểm bằng hành vi, không phải chờ 5 s thật.
  - Thêm import `spawn` và `ProviderCapacityLockError`.

Test hẹp: `env -u CLAUDE_CODE_SESSION_ID node --test test/runner/provider-capacity.test.mjs` cho kết quả 24/24 pass (≈8 s). Test mới chạy mất ≈1.6 s.

## Mutation check

Bản sao tạm `/var/tmp/fgos-mutation-lockwait-ddWl`, gồm `src/`, `package.json`, file test và script stress. Trong bản sao chỉ xoá dòng `lockWaitMs: 300_000,` của contender; diff xác nhận đúng 1 dòng. Kết quả dưới cùng tải fsync: 8/10 fail với đúng chữ ký `ProviderCapacityLockError`. Như vậy chính bản sửa đã làm hết flake. Bản sao đã được xoá.

## Impact (GitNexus)

- `impact acquireProviderAccountLease --direction upstream` cho kết quả **suy giảm**: index chậm 21 commit so với HEAD, truy vấn depth lỗi (`Binder exception: Cannot find property staticGated`), risk = `UNKNOWN`, impactedCount = 0 (cận dưới). Bằng chứng này yếu.
- Đối chiếu bằng grep, các nơi gọi gồm: `src/runner/dispatch/assignment-runner.mjs:1175` (`attemptProviderCapacityFallback`), `:1644` (`executeAssignment`), bản re-export ở `src/runner/dispatch.mjs:51` và các test trong `test/runner/provider-capacity.test.mjs`. Không nơi nào truyền `lockWaitMs`, nên hành vi các nơi này không đổi. Rủi ro thực tế: **LOW**.

## UNPROVEN

- Test mới chỉ chứng minh mặc định chờ **lâu hơn ~1.5 s**, chưa chứng minh nó đúng 5000 ms. Muốn khẳng định đúng con số thì phải chờ 5 s thật, việc này đã cố tình tránh. Việc "đúng 5000" dựa vào đọc mã: `undefined` kích hoạt giá trị mặc định khi destructuring trong `withFileLock`.
- K = 10 mỗi phía. 0/10 sau sửa không loại trừ được tỉ lệ fail nhỏ còn sót (khoảng tin cậy 95% trên cho tỉ lệ fail vào cỡ ~26%). Tuy vậy, trước sửa là 7/10 và đột biến là 8/10, nên khác biệt rất rõ.
- Tải nền lúc bắt đầu phép đo SAU (7.48) và ĐỘT BIẾN (18.06) cao hơn phép TRƯỚC (1.39), do tải dư của phép đo liền trước. Lệch này khiến điều kiện của phép SAU nặng hơn chứ không nhẹ hơn, nên không làm yếu kết luận.
- Chưa chạy `npm test` toàn bộ; việc này để lead chạy.

## Đề xuất về thời hạn 5 s (chưa sửa ở lượt này)

Trong sản phẩm, `acquireProviderAccountLease` (và release/quarantine/clear) chờ khoá tối đa 5 s. Trong lúc đó người giữ khoá gọi fsync bên trong vùng găng: `writeFsyncedTemp` khi lấy generation, `writeState` và cả lúc nhả. Khi đĩa bận, 10 tiến trình xếp hàng sau vài lần fsync chậm là đủ vượt 5 s, và `executeAssignment` sẽ nhận `ProviderCapacityLockError` dù người giữ khoá vẫn đang làm việc hợp lệ. Các hướng có thể chọn, xếp theo mức xâm lấn tăng dần:

1. Nới mặc định, ví dụ 30–60 s. Người giữ là tiến trình còn sống, đã được kiểm qua `resolveHolderLiveness`; khoá của tiến trình đã chết thì được thu hồi ngay. Vì vậy chờ lâu hơn chỉ trả giá bằng độ trễ, không gây treo vĩnh viễn.
2. Đưa fsync `writeState` ra khỏi vùng găng. Cách này khó, vì tính bền của state cần fsync trước khi nhả khoá.
3. Đổi deadline cố định thành "không có tiến triển trong X s": thời hạn được làm mới mỗi khi generation tăng.

Em nghiêng về phương án 1 vì nhỏ và nhất quán với lý do đã ghi ở test. Cần một quyết định riêng và thêm số đo ở mức sản phẩm.

## Cần cập nhật tài liệu

Không. `lockWaitMs` là tham số nội bộ, chưa nơi gọi sản phẩm nào dùng, hành vi người dùng không đổi, nên không đụng `CHANGELOG.md` hay `docs/**`. Nếu sau này đổi mặc định 5 s theo đề xuất trên thì cần ghi vào spec của vùng dispatch/runner và CHANGELOG.

## Dọn dẹp

Script stress dùng thư mục `/tmp/fgos-stress-round-*` và tự xoá; thư mục log nằm trong scratchpad của phiên. Sau khi đo: `ls /var/tmp | grep -c fgos-stress` = 0, `/tmp` cũng = 0. Bản sao đột biến `/var/tmp/fgos-mutation-lockwait-ddWl` đã xoá. Không còn tiến trình burner.
