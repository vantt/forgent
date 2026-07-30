# Design Note: `--wait` flag cho main-checkout-lock verbs

Conducted: 2026-07-30 | Repo: forgentX (fgOS) | Trạng thái: đề xuất, chưa implement

**Tracking**: `tsk-6c2` (submit từ báo cáo này, deps: `tsk-3vo`) — xem mục 6 cho lý do 2 item phải làm cùng lúc. `tsk-3vo` (đã tồn tại sẵn trong backlog) là dependency bắt buộc.

## TOC
1. Vấn đề
2. Root cause cụ thể (đã xác nhận trong code)
3. Cơ chế đề xuất
4. Case cụ thể nó giải quyết
5. Cái nó KHÔNG giải quyết (non-goals)
6. Rủi ro cần xử lý trước khi implement (tsk-3vo liên đới)
7. Implementation sketch
8. Test cần thêm
9. Unresolved Questions

## 1. Vấn đề

`acquireMainCheckoutLock` (`src/runner/main-checkout-lock.mjs`) là non-blocking CÓ CHỦ ĐÍCH — 1 lần thử `wx`-create, tối đa 1 lần reclaim-retry, không sleep/loop. Nhưng verb CLI gọi nó (`take`/`pick`/`return`/`merge`/`approve`) thừa hưởng nguyên tính "trả lời ngay" đó lên UX: gặp `HELD` → in lỗi, exit non-zero, người dùng phải tự `fgos lock-status`, tự đợi, tự rerun, hoặc tự `fgos-unlock`.

## 2. Root cause cụ thể (đã xác nhận trong code)

`main-checkout-lock.mjs:63-76` (comment DEFAULT_TTL_MS): git pre-commit hook acquire/refresh `main-checkout.lock` (string identity) mỗi lần commit và **cố ý không bao giờ tự release** — TTL (mặc định 3 phút, hạ từ 5 phút) là cơ chế dọn DUY NHẤT. Khoảng cách quan sát thực tế giữa 2 commit của cùng 1 luồng việc: **~2-3.5 phút**.

Case điển hình: session A vừa commit xong (hook để lại lock, tự nó đã thoát) → vài chục giây tới vài phút sau, session B (terminal khác/agent khác) chạy `take`/`pick`/`return`/`merge` trên CÙNG repo → dính `HELD` dù A không còn hoạt động, chỉ vì lock chưa hết TTL. Case tương tự: 2 session cùng `take`/`pick` gần nhau, dính numeric-pid holder còn sống trong TTL.

## 3. Cơ chế đề xuất

Flag optional ở **lớp CLI verb** (`bin/fgos.mjs`), không đụng `tryAcquireOnce`/lock primitive: vd `--wait[=<ms>]`.

- Gặp `HELD`: sleep khoảng ngắn (backoff, vd 500ms → 1s → 2s), gọi lại **y nguyên** `acquireMainCheckoutLock`.
- Lặp tới `min(remainingTtlMs đọc được lần đầu, giá trị --wait do user chỉ định)`.
- Holder cũ tự hết TTL trong lúc chờ → lần gọi lại tự `ACQUIRED` nhờ logic reclaim **đã có sẵn** trong `tryAcquireOnce` — vòng lặp mới không cần biết gì về reclaim.
- Hết ngân sách chờ mà vẫn `HELD`/`AMBIGUOUS` → fail như hôm nay.

## 4. Case cụ thể nó giải quyết

Đúng case mục 2: tranh chấp **ngắn hạn, trong cửa sổ TTL**, giữa lock để lại bởi hook (đã hết việc thật) hoặc holder vừa xong việc. Đây là loại tranh chấp phổ biến khi nhiều `take`/`pick`/`return` chạy gần nhau trên cùng repo (nhiều session/terminal/agent).

## 5. Cái nó KHÔNG giải quyết (non-goals — quan trọng, tránh kỳ vọng sai)

- **Holder live đang tự refresh liên tục** (việc dài, tự "chạm" lock nhiều lần) → lock "live" mãi từ góc nhìn người đợi, `--wait` chờ hết ngân sách của chính nó rồi vẫn fail. Đúng thiết kế: lock này không dành cho việc dài.
- **`AMBIGUOUS`** (lock file corrupt/không parse được) → cố tình KHÔNG tự reclaim (fail-closed, D5). `--wait` retry bao nhiêu cũng vẫn `AMBIGUOUS` — vẫn cần `fgos-unlock`.
- **Claim-level race (không phải file-lock)**: `--wait` chỉ đụng `main-checkout.lock`. Tranh chấp ở tầng session-role claim (runner dispatcher độc lập pick trùng item — xem tsk-49a, báo cáo tách riêng) nằm ngoài phạm vi flag này hoàn toàn.
- **Chỗ lock bị THIẾU chứ không phải bị TRANH CHẤP**: vd `docs-index` verb ghi file thật nhưng không acquire lock (tsk-1wn) → lost-update giữa các session, không phải lỗi "chờ" mà lỗi "quên khoá". `--wait` không sửa được — phải thêm acquire ở đúng chỗ trước.

## 6. Rủi ro cần xử lý trước khi implement (tsk-3vo liên đới)

`tsk-3vo` (open, todo/clarify) ghi nhận: `fgos return` release lock **CHỈ SAU KHI verify trả về** (`bin/fgos.mjs:1503,1521`), và verify hiện KHÔNG có timeout mặc định. Nếu verify treo, lock vẫn bị giữ tới khi TTL (3 phút) hết hạn — rồi cửa sổ đó **mở ra cho writer khác trong lúc verify vẫn đang chạy thật**.

→ Nếu `--wait` chỉ retry mù tới khi TTL hết hạn, nó sẽ **acquire thành công ngay giữa lúc holder gốc (verify treo) vẫn còn sống và vẫn coi mình đang giữ việc dở** — 2 tiến trình cùng tưởng mình an toàn. Đây không phải lỗi riêng của `--wait`, mà là lỗ hổng có sẵn (bất kỳ ai gọi lại `acquireMainCheckoutLock` sau TTL cũng dính) — nhưng `--wait` sẽ khiến lỗ hổng này **xảy ra thường xuyên hơn** vì nó chủ động retry thay vì con người tình cờ rerun. **Khuyến nghị: implement `--wait` và fix `tsk-3vo` (verify timeout mặc định) CÙNG LÚC, không tách rời** — nếu không, `--wait` làm race window ở tsk-3vo dễ trúng hơn.

## 7. Implementation sketch

- Vị trí: các case `take`/`pick`/`return`/`merge`/`approve` trong `bin/fgos.mjs`, quanh chỗ gọi `acquireMainCheckoutLock` (qua `claimWork`/`mergeRunnerItem` hoặc trực tiếp).
- Thêm 1 helper dùng chung (tránh lặp ở nhiều verb — DRY): `acquireMainCheckoutLockWithWait(dir, opts, waitMs)` — bọc quanh `acquireMainCheckoutLock` đã có, KHÔNG sửa file `main-checkout-lock.mjs`.
- Backoff đơn giản (500ms/1s/2s, cap ở 2s) — không cần thuật toán phức tạp, đây là chờ vài phút không phải vài giờ.
- Log mỗi lần retry ở mức debug/verbose (để chẩn đoán, không spam stdout mặc định).

## 8. Test cần thêm

- Unit test cho helper: giả lock `HELD` với `remainingTtlMs` ngắn (vd 1s) → xác nhận retry rồi `ACQUIRED` đúng lúc TTL hết.
- Test timeout: `--wait` hết ngân sách mà vẫn `HELD` → fail với message rõ (khác message fail-ngay hôm nay, nói rõ "đã chờ Xs").
- Test `AMBIGUOUS`: xác nhận `--wait` KHÔNG loop vô ích trên `AMBIGUOUS` (fail nhanh, không đợi hết TTL vô nghĩa vì AMBIGUOUS có thể không có TTL để tính).
- Không cần sửa `main-checkout-lock.test.mjs` hiện có (lock primitive không đổi).

## 9. Unresolved Questions

- `--wait` mặc định BẬT hay phải flag tường minh? (đổi default = đổi hành vi công khai, cần cân nhắc như tsk-3vo đang tự hỏi tương tự cho verify timeout).
- Có nên áp `--wait` cho TẤT CẢ verb ghi lock, hay chỉ `take`/`pick` (nơi user tương tác trực tiếp, chờ được) — không áp cho verb chạy trong runner loop tự động (nơi context khác)?
- Thứ tự làm: `--wait` trước hay `tsk-3vo` (verify timeout) trước? Báo cáo này khuyến nghị làm cùng lúc — cần user xác nhận ưu tiên.
