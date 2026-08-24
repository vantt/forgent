# Research — tsk-2l8: lock self-heal 2 tầng cho main-checkout.lock

## Round 1 (2026-08-23, fgos-researching via fgos-coding-discovering)

**Asked:** Xác nhận nhánh AMBIGUOUS/string-identity fail-closed trong
`src/runner/main-checkout-lock.mjs` (dòng, điều kiện kích hoạt, hành vi khi
exit 7), và xác nhận pattern stale-pid-reclaim trong `src/state/events.mjs`
được item cite làm mẫu để soi theo.

**Checked (repo, cited):**

- `src/runner/main-checkout-lock.mjs:275-292` (`tryAcquireOnce`) — nhánh
  string-identity (`typeof record.pid !== 'number'`) chỉ trả `AMBIGUOUS`
  khi `typeof ttlMs !== 'number'` (dòng 285-290). Khi `ttlMs` có giá trị,
  held-ness được xét thuần bằng TTL (dòng 291: `held = now - record.ts <=
  ttlMs`), và nếu stale thì bị unlink tự động ngay trong cùng lệnh (dòng
  304-323, có re-read-trước-khi-unlink để chống TOCTOU) — không cần
  `/fgOS:unlock`.
- Mọi call site sống của `acquireMainCheckoutLock` đều truyền
  `ttlMs: DEFAULT_TTL_MS` — không có call site nào bỏ trống `ttlMs`:
  - `src/runner/claim-port.mjs:105` (`claimWork`, dùng bởi `pick`/`take`)
  - `src/runner/merge.mjs:779` (`withMergeTargetSlot`)
  - `src/runner/merge.mjs:906` (site còn lại, `mergeRunnerItem`)
  - `bin/fgos.mjs:3904` (verb `unlock` tự nó)
  → Nhánh `AMBIGUOUS`-vì-string-identity-thiếu-ttlMs (dòng 285-290) là
  **dead code trên mọi đường gọi thật hiện có** — không path nào trong repo
  hôm nay có thể trigger nó.
- `DEFAULT_TTL_MS = 3 * 60 * 1000` (`main-checkout-lock.mjs:110`) — 3 phút,
  không phải giá trị task mô tả cần "nâng lên >=10 phút".
- `AMBIGUOUS` thật sự chỉ phát sinh từ nội dung file KHÔNG PARSE ĐƯỢC
  (`record === null`, dòng 256-257) — một trục hoàn toàn khác (parse
  failure) so với "identity kiểu chuỗi" mà item mô tả. Verb `unlock`
  (`bin/fgos.mjs:3903-3930`) đã xử lý case này tự động, một lệnh, qua
  `forceReclaimAmbiguousLock` (`main-checkout-lock.mjs:655-676`) — hàm này
  ĐÃ có kỷ luật re-read-trước-khi-unlink chống TOCTOU
  (`no-longer-ambiguous` nếu nội dung đã đổi giữa 2 lần đọc), tương đương
  tinh thần "post-rename verify" của bee, chỉ khác cơ chế (read-compare-
  unlink thay vì atomic-rename-rồi-verify).
- `unlock` verb's `HELD` nhánh (`bin/fgos.mjs:3915-3917`, từ fix
  `92b31dd6`/tsk-24t) đã tự mô tả đúng: với string identity, "liveness
  không xác định được" — nhưng đây vẫn là refuse hợp lệ (lock chưa qua
  TTL), không phải một lỗi cần self-heal.
- `src/state/events.mjs:295-330` (lock riêng cho `events.jsonl`, khác lock
  với `main-checkout.lock`) — stale-pid-reclaim ở đây CHỈ xử lý identity
  SỐ (`Number.isInteger(holderPid)`); nội dung không phải số nguyên dương
  bị coi "ambiguous holder... never reclaim it here" (dòng 325-329) — tức
  là **không có** một mẫu string-identity-reclaim nào để soi theo trong
  file này; nó chỉ có mẫu numeric-pid-reclaim, và item đã cite đúng phần
  đó (numeric) nhưng suy rộng sai sang string.
- `upstreams/beehive/skills/bee-hive/templates/lib/lock.mjs:172-352` — xác
  nhận ĐÚNG như item mô tả: `STALE_MS=30_000` (soft), `HARD_STALE_MS=
  3_600_000` (hard, dòng 34-37), takeover bằng atomic rename sang
  `<lock>.stale-<pid>-<ts>-<rand>` (dòng 259-268) + verify danh tính
  pid+token+ts SAU rename (`sameHolderIdentity`, dòng 247-249,
  `settleTakeover`, dòng 276-304) trước khi xoá — khớp mô tả của item.
  Nhưng: cơ chế "soft" của bee vẫn dựa trên `isPidAlive(pid)` (dòng 205)
  — tức vẫn là numeric-pid-liveness + mtime, không phải một cơ chế
  string-identity mới; với string identity, bee cũng chỉ còn lại trục
  hard-ceiling theo thời gian, y hệt cách fgOS xử lý qua `ttlMs` hôm nay
  (chỉ khác 1 tầng so với 2 tầng).
- `src/runner/merge.mjs:795-807` (`withMergeTargetSlot`) — ĐÃ có heartbeat
  renewal thật (`renewMainCheckoutLockIfOwn` trên `setInterval`, unref'd)
  trong lúc giữ merge-slot lock qua staged-verify — nghĩa là giả thuyết
  của item ("phải nâng soft window lên >=10 phút HOẶC dùng heartbeat renew
  vì approve giữ lock ~6 phút") đã có nhánh heartbeat renew SẴN RỒI cho
  đúng call site approve/staged-verify; không phải một khoảng trống chưa
  vá.
- `docs/history/tsk-3tp-worker-write-events-tang-b/DISCUSSION.md` §1 vòng
  5 (đọc từ worktree sống `tsk-3tp-0YK44Z` — file này CHƯA merge vào
  main, nên vô hình từ worktree tsk-2l8; không phải file bị xoá) dòng
  14-18: nguồn gốc thật của item — "món thật sự còn thiếu đáng học: lock
  self-heal 2 tầng của bee thay cho /fgOS:unlock thủ công — item riêng
  nếu làm, ngoài scope này". Xác nhận: tsk-2l8 sinh ra đúng từ quyết định
  này của người dùng — mục tiêu tổng quát (mượn ý 2-tầng của bee) là chủ
  đích, không phải bịa; nhưng doc KHÔNG đi sâu cơ chế cụ thể, không giải
  thích tại sao AMBIGUOUS lại bị gán cho "string identity" thay vì đúng
  "nội dung không parse được".
- `.fgos/events.jsonl` — 7 lần chuỗi "lock-ambiguous"/"lock-held" xuất
  hiện, toàn bộ là các work-item cũ (tsk-2tm, tsk-2rf 2026-08-03; tsk-5k4
  2026-08-13; tsk-2qp 2026-08-16) đã có commit fix landed
  (`1c60a75f`, `92b31dd6`, `435ddf3d`, `9f7dd3cc`, `d562bd6d`,
  `8ef58808`...) — không có sự kiện nào từ 24/8 (ngày item claim verify)
  xác nhận vấn đề CÒN đang xảy ra sống hôm nay.

**Still open (unclear):**

1. Mục tiêu thật của tsk-2l8, sau khi loại bỏ phần tiền đề sai (string-
   identity không hề đi vào nhánh AMBIGUOUS hôm nay), có thể thu hẹp lại
   thành: gộp `forceReclaimAmbiguousLock` (hoặc một bản atomic-rename
   TOCTOU-cứng hơn, học từ bee) THẲNG vào vòng reclaim-and-retry của
   `claimWork`, để một lock-file thật sự hỏng (unparseable) tự lành trong
   CÙNG một lệnh `pick`/`take`, không cần một lệnh `/fgOS:unlock` riêng
   nữa. Đây có phải đúng phạm vi item muốn không — hay item vẫn muốn thêm
   một tầng "soft window" mới cho trường hợp string-identity dù trường
   hợp đó hôm nay đã tự lành qua TTL rồi (không đổi hành vi thật, chỉ đổi
   cơ chế nội bộ)?
2. `/fgOS:unlock` có tiếp tục tồn tại như đường dự phòng cho case
   HELD-nhưng-thực-ra-live-mãi-mãi (không TTL nào giải quyết được một
   holder cứ heartbeat vô hạn) hay item này có ý định thêm một "hard
   ceiling" mới (như `HARD_STALE_MS` của bee) cho main-checkout.lock nói
   chung — điều mà claim-port.mjs hôm nay không có (chỉ merge-slot lock
   có heartbeat, không có ai áp một trần cứng buộc-takeover)?

**Verdict:** `unclear` — tiền đề kỹ thuật của item (string-identity dẫn
đến AMBIGUOUS, cần "unlock thủ công") không khớp với hành vi thật của code
hôm nay; cần một người xác nhận lại phạm vi trước khi lock vào một plan cụ
thể.
