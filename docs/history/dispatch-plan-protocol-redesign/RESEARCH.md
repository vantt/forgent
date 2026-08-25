# RESEARCH — dispatch-plan-protocol-redesign

Tích luỹ theo vòng, không đè. Mỗi vòng là một section riêng có ngày.

---

## Vòng 1 — 2026-08-25 (gọi từ stage `discovery`, `fgos-coding-discovering`)

### Đã hỏi

Hai gap mà 5 vòng `fgos-coding-shaping` KHÔNG chạm tới, nhưng material cho
planning:

1. Baseline verify của epic có đáng tin không? Item tự khai verification tối
   thiểu là `node --test test/runner/dispatch.test.mjs`, nhưng item mở
   `tsk-4wo` khẳng định chính file đó đang **đỏ trên main** vì test lỗi thời.
2. Repo này thật sự dùng pattern gì cho `verify` của một item **cha đã chia
   con**? `tsk-5x7` sẽ tách ~7 con (§7 DISCUSSION.md) và `verify` hiện vẫn là
   placeholder `"chưa xác định — P15 bổ sung"`.

### Đã kiểm

**Điểm 1** — chạy thật, không đọc doc rồi suy:

```
node --test test/runner/dispatch.test.mjs
→ tests 319 | pass 319 | fail 0 | duration_ms 12230.98
```

Đọc `tsk-4wo` (status `todo`, stage `discovery`): nó chỉ đích danh test tên
`"the committed .fgos/config.json runner section declares the gather capacity
(tsk-28o)"` ở dòng 651, assert hai thứ đã bị rút có chủ ý (`capacities.gather`
xoá bởi `b1e8e111`/tsk-5tm-2 D6; trường `needs` rút bởi `f8c9f135`/tsk-5tm-1
D1). Kiểm tra file hôm nay:

```
grep -n "declares the gather capacity|capacities.gather|tsk-28o" test/runner/dispatch.test.mjs
→ 0 hit
```

Dòng 645-655 giờ là một test khác hẳn (`bare-capabilities.json` /
`loadRunnerConfig`). Test lỗi thời **đã bị gỡ** bởi công việc khác.

**Điểm 2** — đọc `verify` thật của bốn item cha đã chia con:

| Item | children | `verify` thật |
|---|---|---|
| `tsk-2uf` (cùng dòng dõi dispatch) | 3 (đã đóng) | `test -f .../DISCUSSION.md && test -f .../CONTEXT.md && test -f .../plan.md && grep -q "^\| D7 " ...` |
| `tsk-2t6` | 3 | `grep -q "Lớp 1 — cell (ghi file)" docs/distillery/... && grep -q ...` |
| `tsk-5td` | 0 | `grep -q '0029' docs/history/dispatch-concept-boundary/DISCUSSION.md && grep -q 'tsk-1o7' ... && node --test --test-skip-pattern=...` |
| `tsk-in1` | 5 | `npm test` |

### Tìm được

**F1 — Baseline XANH, `tsk-4wo` mang tiền đề đã cũ.** `test/runner/
dispatch.test.mjs` hôm nay 319/319 pass. Test lỗi thời mà `tsk-4wo` mô tả
không còn tồn tại trong file. Hệ quả: (a) epic này **có** baseline đáng tin,
mọi con phân biệt được regression của mình với hỏng sẵn; (b) `tsk-4wo` là ứng
viên đóng (`wontfix`/superseded) — nó còn khai "chặn 18 item đang mở có
`npm test` trong verify, và chặn mọi `sync-root`", một tác động lớn nếu ai đó
tin mà không kiểm lại. Đây là finding cho caller, không phải quyết định của
skill này.

**F2 — Pattern `verify` của cha-đã-chia-con là *chứng minh artifact của chính
nó*, không phải rollup con.** Không item nào trong bốn cái trên dùng
`fgos rollup` hay aggregate trạng thái con. Hình dạng chủ đạo: `test -f` các
file `docs/history/<feature>/` của chính nó **+** `grep -q` một D-ID/chuỗi
khoá đã mint bên trong — tức verify hỏi *"phần việc tư duy đã để lại dấu vết
kiểm được chưa"*, còn phần code để con tự verify. `tsk-2uf` là tiền lệ gần
nhất (cùng dòng dõi dispatch, cùng ra từ một vòng shaping, chia 3 con) và là
cái duy nhất kiểm cả ba file `DISCUSSION.md`/`CONTEXT.md`/`plan.md` cộng một
D-ID grep. `tsk-in1` (`npm test`) là ngoại lệ ở đầu kia của phổ.

### Còn mở

Không có. Cả hai điểm đã đóng bằng bằng chứng chạy thật/đọc thật.

### Verdict trả về caller

- **Điểm 1: `clear`** — verify đề xuất: `node --test test/runner/dispatch.test.mjs`
  (đã xác nhận xanh 319/319 hôm nay).
- **Điểm 2: `clear`** — pattern đã xác định (F2), tiền lệ gần nhất `tsk-2uf`.
