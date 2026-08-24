# Plan — tsk-2l8: fold AMBIGUOUS-lock reclaim into claimWork

Mode: high-risk

Lý do không chọn lane nhỏ hơn: item sửa đúng đường tranh chấp
`.fgos/main-checkout.lock` — cơ chế tồn tại để ngăn race clobbering
`.git/index` (STR65, `docs/decisions/0021-wire-main-checkout-hook-qua-doctor-setup.md`)
và từng có sự cố TOCTOU thật (tsk-2tm, xem RESEARCH.md). Đây là hard-gate
flag "audit/security"-adjacent (an toàn dữ liệu qua concurrency), cộng
thêm flag "public contracts" — 2 skill doc khác
(`plugins/fgOS/skills/approve/SKILL.md:159`,
`.agents/skills/fgos-unlock/SKILL.md`) mô tả prose hành vi hiện tại của
đúng nhánh `lock-ambiguous` này. Bất kỳ flag hard-gate nào cũng đủ đẩy lên
high-risk theo `fgos-routing`'s Mode gate, bất kể tổng flag count. Item's
tier gốc (`heavy`) cũng nhất quán với lựa chọn này.

## Approach

**Đường chọn (khớp D1, `docs/history/tsk-2l8/CONTEXT.md`):** sửa
`claimWork` (`src/runner/claim-port.mjs:97-119`) — khi
`acquireMainCheckoutLock` trả `status === AMBIGUOUS`, thay vì throw
`ClaimError('lock-ambiguous', ...)` ngay, gọi
`forceReclaimAmbiguousLock(dir)` (đã có sẵn,
`src/runner/main-checkout-lock.mjs:655-676`) rồi thử `acquireMainCheckoutLock`
lại đúng MỘT lần nữa; chỉ throw `ClaimError('lock-ambiguous', ...)` như
hôm nay nếu lần thử lại đó VẪN `AMBIGUOUS` (nội dung hỏng dai dẳng, không
phải một race thoáng qua). Mirror đúng shape verb `unlock` đã dùng
(`bin/fgos.mjs:3927-3929`) — không phát minh cơ chế mới, không sửa
`main-checkout-lock.mjs`/`tryAcquireOnce` (giữ nguyên phạm vi 1-lần-thử-lại
mà file đó đã tự khai).

**Vì sao không sửa `main-checkout-lock.mjs`/`acquireMainCheckoutLock`
trực tiếp:** hàm đó phục vụ 4 caller (`claim-port.mjs`, 2 site trong
`merge.mjs`, verb `unlock` tự nó) và D4 đã chốt chỉ `claimWork` nằm trong
scope. Sửa ở tầng gọi (`claim-port.mjs`) giữ 3 caller còn lại nguyên vẹn,
đúng blast radius hẹp nhất.

**Alternatives rejected:**
- Sửa `acquireMainCheckoutLock` tự gọi `forceReclaimAmbiguousLock` bên
  trong — bị loại vì đổi hành vi của cả 4 caller cùng lúc (kể cả 2 site
  merge.mjs D4 chốt không đụng), vi phạm blast radius đã khoá.
- Thêm 2-tầng soft/hard window kiểu bee — bị loại ở D2/D3 (dead code,
  không có bằng chứng sống cần).

**Files touched:**
1. `src/runner/claim-port.mjs` — sửa nhánh `AMBIGUOUS` (dòng 116-118),
   import thêm `forceReclaimAmbiguousLock` từ `./main-checkout-lock.mjs`.
2. `test/runner/claim-port.test.mjs` — cập nhật test dòng 127 (hành vi cũ:
   "throws ... genuinely ambiguous, fails closed" — sau fix, một lock nội
   dung hỏng THOÁNG QUA phải tự lành, không throw nữa) + thêm 1 test mới
   cho case "vẫn ambiguous sau khi đã retry" (fails closed thật, phải vẫn
   throw).
3. `docs/history/tsk-2l8/plan.md` (chính file này).

**Không đụng (D4, xác nhận lại ở Approach):** `src/runner/merge.mjs`
(2 call site AMBIGUOUS khác), `src/runner/main-checkout-lock.mjs`,
`src/runner/lock-wait.mjs` (đọc dòng 26-31: `withLockRetry` cố ý KHÔNG
retry `lock-ambiguous`, rethrows ngay — hành vi này vẫn đúng sau fix, vì
`lock-ambiguous` giờ chỉ còn nổi lên sau khi `claimWork` đã tự thử lành
1 lần, tức là case còn lại thật sự nên fail-closed, không nên retry thêm
ở tầng CLI), `bin/fgos.mjs`'s `unlock` verb (giữ nguyên, vẫn là đường dự
phòng cho case dai dẳng).

**Order:** không có phụ thuộc — `fgos graph tsk-2l8 --json` xác nhận item
là 1 connected component riêng, size 1, không block/bị block bởi item
nào khác (`topUnblock` không cần, `criticalPath` không chứa tsk-2l8).
Một pass, một file code + một file test.

**impact-analysis posture:** degraded — GitNexus `present` nhưng index
được báo stale (hook cảnh báo "last indexed: 7bb3231" lúc bắt đầu phiên
này, chưa phản ánh HEAD hiện tại). Bù bằng cross-check thủ công: grep toàn
repo cho `acquireMainCheckoutLock(` (4 kết quả, liệt kê đủ ở trên) và cho
`lock-ambiguous` (liệt kê đủ ở RESEARCH.md, không sót call site sống nào
ngoài 4 cái đã biết).

## Risk map

| Thành phần | Rủi ro | Proof point (cho validating) |
|---|---|---|
| `claimWork`'s AMBIGUOUS branch | Trung bình — an toàn concurrency, lịch sử có TOCTOU thật (tsk-2tm) | `forceReclaimAmbiguousLock` đã tự có kỷ luật re-read-trước-khi-unlink (dòng 655-676) — fix này CHỈ gọi lại hàm đã proven, không viết logic unlink mới. Test mới phải cover: (a) nội dung hỏng thoáng qua → tự lành, claim thành công; (b) nội dung hỏng dai dẳng (giả lập forceReclaimAmbiguousLock trả 'reclaimed' nhưng file bị ghi hỏng lại ngay hoặc retry vẫn đọc ra null) → vẫn throw đúng như hôm nay, không nuốt lỗi. |
| Test baseline | Thấp — nhưng cần biết trước | `node --test test/runner/claim-port.test.mjs` hiện có 1 test THẤT BẠI SẴN, không liên quan (`claimWork reads the event log fully 3 times...`, dòng 67, `4 !== 3`, xác nhận trên baseline sạch trước khi item này đổi gì). Không sửa test đó (ngoài scope) — verify command dưới đây SCOPE HẸP để không bị nhiễu bởi failure có sẵn này. |
| `lock-wait.mjs`'s `withLockRetry` | Thấp | Đọc trực tiếp: cố ý không retry `lock-ambiguous` (dòng 26-31) — hành vi đó ĐÚNG cả trước và sau fix, không cần sửa, chỉ cần xác nhận không có test nào giả định `lock-ambiguous` luôn tức thời (chưa từng self-heal) mà giờ sẽ sai. |

## Verify (proof surface cho piece này)

```
node --test --test-name-pattern="ambiguous|self-heal" test/runner/claim-port.test.mjs
```

Baseline (trước fix, đã chạy thật 2026-08-23T17:5x): 2/2 pass với đúng
2 test hiện có khớp pattern này (dòng 98, dòng 127) — dòng 127 SẼ đổi nội
dung assertion khi fix landed (không còn throw cho case thoáng qua), và
1 test mới ("case vẫn ambiguous sau retry") sẽ được thêm, khớp cùng
pattern (`self-heal`/`ambiguous` trong tên). Đủ 3 test khớp pattern sau
khi fix, tất cả pass, là bằng chứng đủ — không cần chạy toàn bộ
`test/runner/claim-port.test.mjs` (bị nhiễu bởi failure có sẵn không liên
quan, xem Risk map).

## Outstanding questions

None
