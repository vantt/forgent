# Context — tsk-2l8: lock self-heal cho main-checkout.lock's AMBIGUOUS case

## Feature boundary

Item gốc đề xuất một cơ chế 2-tầng soft/hard window (học từ
`upstreams/beehive/skills/bee-hive/templates/lib/lock.mjs:172-352`) để tự
reclaim `.fgos/main-checkout.lock` khi holder mang identity CHUỖI (session
id), thay `/fgOS:unlock` thủ công.

Research vòng `discovery` (`docs/history/tsk-2l8/RESEARCH.md`)
xác nhận tiền đề đó không khớp code thật hôm nay — xem mục "Locked decisions"
bên dưới. Sau khi loại bỏ phần sai, phạm vi thật của item co lại thành một
việc nhỏ, cụ thể:

**`claimWork` (`src/runner/claim-port.mjs`) tự gọi
`forceReclaimAmbiguousLock` (đã có sẵn, `src/runner/main-checkout-lock.mjs:655-676`)
và retry-once ngay trong cùng lệnh khi `acquireMainCheckoutLock` trả về
`AMBIGUOUS`, thay vì throw `ClaimError('lock-ambiguous', ...)` bắt một
session/người chạy `/fgOS:unlock` như một bước riêng.** `pick`/`take` là
2 caller thật của `claimWork` — cả hai được lợi trực tiếp.

## Scout evidence

- `src/runner/main-checkout-lock.mjs:275-292` (`tryAcquireOnce`) — nhánh
  string-identity chỉ trả `AMBIGUOUS` khi `typeof ttlMs !== 'number'`; mọi
  call site sống đều truyền `ttlMs: DEFAULT_TTL_MS` nên nhánh này là dead
  code trên mọi đường gọi thật hôm nay.
- `src/runner/main-checkout-lock.mjs:256-257` — `AMBIGUOUS` thật sự chỉ
  đến từ nội dung file không parse được (`record === null`) — trục "parse
  failure", khác hẳn "identity kiểu chuỗi".
- `src/runner/main-checkout-lock.mjs:655-676` (`forceReclaimAmbiguousLock`)
  — đã tồn tại, đã có kỷ luật re-read-trước-khi-unlink chống TOCTOU
  (`no-longer-ambiguous` khi nội dung đổi giữa 2 lần đọc). Đây chính là cơ
  chế item này sẽ gọi thêm từ `claimWork`, không viết mới.
- `src/runner/claim-port.mjs:97-119` (`claimWork`) — điểm gọi
  `acquireMainCheckoutLock` duy nhất phục vụ `pick`/`take`; nhánh
  `AMBIGUOUS` hiện tại (dòng 116-118) throw thẳng, không tự chữa.
- `bin/fgos.mjs:3895-3930` (verb `unlock`) — mẫu tham chiếu cho cách gọi
  `forceReclaimAmbiguousLock` đúng (dòng 3927-3929); `claimWork` sẽ mirror
  cùng shape, không phát minh cơ chế mới.
- `src/runner/merge.mjs:789-791,916-917` — 2 call site khác của cùng
  `AMBIGUOUS` status (merge target-slot lock, merge main lock) — CHỦ ĐỊNH
  không đụng tới (D4).
- `src/runner/merge.mjs:795-807` — heartbeat renew thật
  (`renewMainCheckoutLockIfOwn` trên `setInterval`) đã bảo vệ
  approve/staged-verify (~6 phút) khỏi tự-stale — phản chứng cho giả
  thuyết "cần soft window ≥10 phút" trong đề xuất gốc.
- `src/state/events.mjs:295-330` — lock riêng của `events.jsonl`, chỉ có
  mẫu reclaim cho identity SỐ; không có mẫu string-identity nào để soi
  theo (đề xuất gốc suy rộng sai từ mẫu numeric này).
- `.fgos/events.jsonl` — 7 lần xuất hiện `lock-ambiguous`/`lock-held`
  trong lịch sử, toàn bộ từ 2026-08-03 đến 2026-08-16, đều đã có commit
  fix landed (`1c60a75f`, `92b31dd6`, `435ddf3d`, `9f7dd3cc`); không sự
  kiện nào từ sau đó xác nhận vấn đề còn sống hôm nay.
- `impact-analysis`: **full** — GitNexus `present` (`fgos tool query
  --capability impact-analysis --status present`, 2026-08-23T17:44Z).

## Locked decisions

| D-ID | Quyết định |
|---|---|
| D1 | pham vi thu hep con dung 1 viec -- gop forceReclaimAmbiguousLock (da co, xu ly AMBIGUOUS-do-noi-dung-file-hong) thang vao vong reclaim-and-retry cua claimWork (src/runner/claim-port.mjs), de pick/take tu lanh trong 1 lenh thay vi throw ClaimError('lock-ambiguous') bat nguoi chay /fgOS:unlock rieng. |
| D2 | bo hoan toan de xuat string-identity/AMBIGUOUS + 2-tang soft/hard window hoc tu beehive -- xac nhan dead code (moi call site song deu truyen ttlMs, main-checkout-lock.mjs:275-292) va soft-window/heartbeat cho approve da co san (merge.mjs:795-807). |
| D3 | khong them hard-ceiling takeover moi cho main-checkout.lock -- khong co bang chung song nao (0 su kien lock-ambiguous/lock-held tu 24/8, history cu da fix) can no; YAGNI. |
| D4 | merge.mjs's 2 AMBIGUOUS call site (target-slot lock dong 789, main lock dong 916) va /fgOS:unlock verb khong dong den -- giu nguyen lam duong du phong ngoai scope; scope chi claimWork/pick/take. |

## Outstanding questions

None — merge.mjs's 2 AMBIGUOUS call site và `/fgOS:unlock` verb giữ
nguyên, chủ định ngoài scope (D4). Cơ chế retry-once cụ thể (điều gì xảy
ra khi `forceReclaimAmbiguousLock` trả `no-longer-ambiguous`) là chi tiết
implementation, để `fgos-coding-planning` quyết dựa trên shape sẵn có của
`tryAcquireOnce`'s own `retry` convention.
