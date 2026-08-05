# tsk-sir — main-checkout-lock áp lên worktree git commit

## Feature boundary

`.githooks/pre-commit` chặn `git commit` bằng cách acquire
`.fgos/main-checkout.lock`, vô điều kiện, cho MỌI commit trên repo —
kể cả commit trong 1 linked worktree, dù worktree đó không đụng gì tới
main checkout's index/working tree. Item này khóa: cơ chế thật gây ra
việc đó, đây có phải chủ ý thiết kế không, và hướng fix tối thiểu đúng
chỗ — không đụng tới `acquireMainCheckoutLock` primitive (dùng chung
`claimWork`/`mergeRunnerItem`/`unlock` verb) hay việc khác (`.fgos`
per-worktree isolation, đã bàn riêng ở `tsk-45y`).

Đã distill từ 1 hội thoại shaping trước
(`docs/history/main-checkout-lock-worktree-commit-scope/DISCUSSION.md`,
D1-D4 đã khóa ở đó và ghi qua `fgos decision --id tsk-sir` cùng session).
Bước này (`fgos-exploring`) chỉ re-scout để xác nhận không còn gray area
sản phẩm nào bị bỏ sót trước khi qua `fgos-planning`.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | `repoRoot` trong `.githooks/pre-commit` luôn resolve về main checkout, bất kể worktree nào gọi `git commit` — vì `core.hooksPath` (relative) nằm trong `.git/config` dùng chung mọi worktree, git resolve nó theo main working tree. Verify thật: `git config --get core.hooksPath` chạy từ main checkout và từ `.claude/worktrees/tsk-1p9-rF2BQk` ra CÙNG 1 đường tuyệt đối. |
| D2 | Áp `main-checkout.lock` lên worktree git commit là gap thiết kế, không phải quyết định cân nhắc. 3 bằng chứng: decision `0021` chỉ bàn race trên main's index file, không hề nhắc worktree; mỗi linked worktree có index file riêng nên hazard đó không áp dụng cơ học; guard 2 cùng file (`currentFgwBranchIfMainCheckout`) đã phân biệt worktree/main mà guard 1 (`acquireMainCheckoutLock`) thì không. |
| D3 | `tsk-45y` (đã đóng wontfix) không giải bài này — khác lớp (fgOS state-write qua `events.lock` vs git-commit hook qua `main-checkout.lock`), và scout evidence của tsk-45y chưa từng grep `.githooks/` — blind spot thật trong bằng chứng đóng của chính nó. |
| D4 | Hướng fix: thêm check `gitDir !== gitCommonDir` (mirror `currentFgwBranchIfMainCheckout`'s logic sẵn có) ngay trước dòng gọi `acquireMainCheckoutLock` trong hook's `main()` — skip lock check khi chạy từ linked worktree. Không sửa primitive `acquireMainCheckoutLock` chính nó. |
| D5 | Re-scout xác nhận (`fgos-exploring`, phiên này): `acquireMainCheckoutLock` chỉ có 3 call site thật trong `src`/`bin` — `claimWork` (claim-port.mjs), `mergeRunnerItem` (merge.mjs), và `fgos unlock` verb (bin/fgos.mjs:3591, diagnostic, luôn chạy tường minh chống main). Không call site nào khác ngoài `.githooks/pre-commit` bị ảnh hưởng bởi ordinary worktree git commit — D4's fix chỉ cần đổi đúng 1 chỗ. |
| D6 | GitNexus's own call-graph (`impact`/graph query) cũng KHÔNG liệt kê `.githooks/pre-commit` là caller của `acquireMainCheckoutLock` — chỉ thấy `claimWork`/`mergeRunnerItem`/`merge.test.mjs`. Corroborate thêm cho D3's luận điểm blind-spot (không chỉ manual grep bỏ sót, tool-based graph cũng bỏ sót nơi này) — không dùng để phủ nhận D1 (đã verify trực tiếp bằng đọc file + lệnh git thật), chỉ ghi nhận tool posture. |

## Pinned terms

- **Guard 1** — bước gọi `acquireMainCheckoutLock` trong `.githooks/pre-commit`'s `main()`, hiện chạy vô điều kiện.
- **Guard 2** — `currentFgwBranchIfMainCheckout`, bước check thứ 2 cùng file, đã biết skip worktree qua so `git-dir`/`git-common-dir`.

## Scout evidence

- `git config --get core.hooksPath` chạy từ main checkout VÀ từ
  `.claude/worktrees/tsk-1p9-rF2BQk` (2026-08-05) — cùng 1 đường tuyệt đối.
- `rg -- "acquireMainCheckoutLock" src bin test docs dogfood-fixture` (phiên
  này) — 140 match/39 file, thực chất chỉ 3 call site sản xuất
  (claim-port.mjs, merge.mjs, bin/fgos.mjs:3591 `unlock`), còn lại là
  docs/comment nhắc tên hàm.
- `fgos tool query --capability impact-analysis --status present`: 1
  provider (`gitnexus`, `present`) — nhưng index báo stale (hook cảnh báo
  "last indexed 251d0b5") → `impact-analysis: degraded` theo gate của
  CLAUDE.md. GitNexus's graph cho `acquireMainCheckoutLock` không thấy
  `.githooks/pre-commit` làm caller (D6) — corroborate D3, không mâu thuẫn
  D1/D2 (đã verify độc lập bằng đọc code + lệnh thật).
- `fgos list --id tsk-sir --json`: `discovery` rỗng — chưa có
  `judgeDiscovery` verdict trước đó, item này lần đầu qua `fgos-exploring`.
- Report gốc: `plans/reports/internal-design-260805-1327-tsk-sir-worktree-commit-lock-scope-report.md`.
- `DISCUSSION.md` cùng thư mục — nguồn distill của CONTEXT.md này.

## Canonical references

- `.githooks/pre-commit`
- `src/runner/main-checkout-lock.mjs` (`acquireMainCheckoutLock`)
- `src/runner/claim-port.mjs` (`claimWork`), `src/runner/merge.mjs` (`mergeRunnerItem`)
- `docs/decisions/0021-wire-main-checkout-hook-qua-doctor-setup.md`
- `docs/history/tsk-45y-worktree-fgos-lock-decouple-stale-premise/CONTEXT.md`
- `test/e2e/main-checkout-lock-hook.test.mjs` (test shape để mirror khi viết fix's regression test)
- `docs/history/main-checkout-lock-worktree-commit-scope/DISCUSSION.md`

## Outstanding questions deferred to planning

- §3 dòng 4/5 của DISCUSSION.md (bug thật đã từng xảy ra chưa; có race ẩn
  nào vẫn cần lock cho worktree không) — chưa tìm thêm bằng chứng nào ở
  vòng scout này, D4/D5 đã đủ vững để `fgos-planning` tự quyết mode/shape
  mà không cần chặn lại vì 2 điểm này.
- Test plan cụ thể (mirror `test/e2e/main-checkout-lock-hook.test.mjs`,
  thêm case worktree-commit-succeeds-while-main-locked) — thuộc phạm vi
  `fgos-planning`, không phải việc của `fgos-exploring`.
