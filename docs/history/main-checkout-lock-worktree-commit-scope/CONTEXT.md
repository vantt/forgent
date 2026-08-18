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
Bước này (`fgos-coding-exploring`) chỉ re-scout để xác nhận không còn gray area
sản phẩm nào bị bỏ sót trước khi qua `fgos-coding-planning`.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | *(Sửa bởi D7 — xem dưới)* `repoRoot` trong `.githooks/pre-commit` luôn resolve về main checkout, bất kể worktree nào gọi `git commit`. Giải thích cơ chế ban đầu ("relative hooksPath resolve theo main working tree") SAI — verify thật của KẾT QUẢ (`git config --get core.hooksPath` ra cùng 1 đường tuyệt đối từ mọi worktree) vẫn đúng, chỉ nguyên nhân sai. |
| D2 | Áp `main-checkout.lock` lên worktree git commit là gap thiết kế, không phải quyết định cân nhắc. 3 bằng chứng: decision `0021` chỉ bàn race trên main's index file, không hề nhắc worktree; mỗi linked worktree có index file riêng nên hazard đó không áp dụng cơ học; guard 2 cùng file (`currentFgwBranchIfMainCheckout`) đã phân biệt worktree/main mà guard 1 (`acquireMainCheckoutLock`) thì không. |
| D3 | `tsk-45y` (đã đóng wontfix) không giải bài này — khác lớp (fgOS state-write qua `events.lock` vs git-commit hook qua `main-checkout.lock`), và scout evidence của tsk-45y chưa từng grep `.githooks/` — blind spot thật trong bằng chứng đóng của chính nó. |
| D4 | *(Sửa bởi D10 — xem dưới)* Hướng fix: skip lock check khi chạy từ linked worktree, không sửa primitive `acquireMainCheckoutLock` chính nó. Cơ chế cụ thể ban đầu đề xuất (mirror `gitDir !== gitCommonDir`) SAI — xem D10. |
| D5 | Re-scout xác nhận (`fgos-coding-exploring`, phiên này): `acquireMainCheckoutLock` chỉ có 3 call site thật trong `src`/`bin` — `claimWork` (claim-port.mjs), `mergeRunnerItem` (merge.mjs), và `fgos unlock` verb (bin/fgos.mjs:3591, diagnostic, luôn chạy tường minh chống main). Không call site nào khác ngoài `.githooks/pre-commit` bị ảnh hưởng bởi ordinary worktree git commit — D4's fix chỉ cần đổi đúng 1 chỗ. |
| D6 | GitNexus's own call-graph (`impact`/graph query) cũng KHÔNG liệt kê `.githooks/pre-commit` là caller của `acquireMainCheckoutLock` — chỉ thấy `claimWork`/`mergeRunnerItem`/`merge.test.mjs`. Corroborate thêm cho D3's luận điểm blind-spot (không chỉ manual grep bỏ sót, tool-based graph cũng bỏ sót nơi này). |
| D7 | **Sửa D1**: `core.hooksPath` trên checkout thật này bị set thành 1 đường TUYỆT ĐỐI (`git config --get --show-origin` xác nhận origin là repo config file dùng chung, giá trị là đường tuyệt đối tới main checkout's `.githooks`), KHÔNG phải relative `.githooks` mà `installGitHooks`/toàn bộ test suite (`test/scripts/install-git-hooks.test.mjs`, `test/setup/checks.test.mjs`, `test/e2e/main-checkout-lock-hook.test.mjs`) đều ghi/kỳ vọng. Thực nghiệm cô lập (2 script trong `scratchpad/`) chứng minh: khi hooksPath THẬT SỰ relative, 1 hook thật KHÔNG chạy khi commit từ linked worktree (resolve theo worktree's own top-level, nơi hook không tồn tại) — phủ nhận thẳng D1's giả thuyết gốc. `installGitHooks` là fill-only, và decision `0021` tự ghi nhận (dòng "Dogfood thật") checkout này CÒN relative `.githooks` lúc 2026-07-28 (doctor xanh) — nên giá trị tuyệt đối phải được ghi đè SAU thời điểm đó, bởi thứ gì đó ngoài `installGitHooks`. Nguyên nhân cụ thể chưa xác định — ngoài phạm vi tsk-sir. D4 (hướng fix) không đổi: nó nhắm hành vi hook một khi đã chạy, độc lập với cơ chế đưa nó tới đó. |
| D9 | Dưới cấu hình `core.hooksPath` RELATIVE mà code thật sự có ý định (`.githooks`, không phải absolute như D7 phát hiện trên checkout này), 1 commit trong linked worktree KHÔNG chạy hook CHÚT NÀO — cả 2 guard đều không fire (cùng thực nghiệm cô lập của D7). `fgos pick`'s worktree creation (`src/runner/worktree.mjs`) không hề đụng `core.hooksPath` (grep xác nhận 0 hit trên `worktree.mjs`/`claim-port.mjs`/`session.mjs`). Nghĩa là bug quan sát được của tsk-sir CHỈ xảy ra trên checkout nào bị trôi hooksPath thành absolute (như checkout này, D7) — dưới cấu hình đúng-ý-định, bug này không thể xảy ra về mặt cơ học, nhưng cũng không có lock nào bảo vệ worktree commit cả — ổn theo D2 (worktree commit vốn không cần bảo vệ đó, index riêng). D4's fix vẫn đúng và là defense-in-depth: làm hành vi hook đúng bất kể checkout đang ở shape hooksPath nào, thay vì dựa vào việc relative-path tình cờ loại trừ worktree. |
| D10 | **Sửa D4 (implementation, fgos-coding-implement)**: `gitDir !== gitCommonDir` một mình không phân biệt được 2 shape worktree thật của repo này — linked fgos-pick worktree dùng chung hooksPath với main (phải skip guard) vs 1 detached worktree TỰ có bản hooksPath riêng độc lập (bee `--with-companion`/session-start, `test/e2e/main-checkout-lock-hook.test.mjs` truth-6 — PHẢI vẫn lock, `.fgos` riêng). Cả 2 đều là worktree về mặt cấu trúc git — implement bản D4 gốc thật sự khiến truth-6 FAIL thật (không chỉ suy luận). Tín hiệu đúng, verify bằng thực nghiệm (probe hook in `process.cwd()`): git luôn set cwd của hook subprocess = toplevel THẬT của checkout đang commit, không phải thư mục hooksPath. So `repoRoot` (từ `__dirname`, nơi file script vật lý nằm) với toplevel thật đó — bằng nhau = hook chạy "tại nhà" (main thật, HOẶC 1 worktree tự trị có hooksPath riêng — cả 2 case đều giữ nguyên guard); khác nhau = hook chạy "xa nhà" (case tsk-sir thật) — skip mọi guard. Implement: `hookRunsAtHome(repoRoot)` gate cả 2 guard; `currentFgwBranchIfMainCheckout`'s check `gitDir`/`gitCommonDir` nội bộ giữ NGUYÊN như code gốc (trả lời câu hỏi khác — repoRoot, khi đã "tại nhà", có phải main thật không). Kết quả: 11/11 test pass (repro mới + toàn bộ e2e cũ, không regress). |
| D8 | Phát hiện phụ, ngoài scope tsk-sir: `mainCheckoutHookWired`/`installGitHooks` (`src/setup/git-hooks.mjs:46,62`) so khớp CHUỖI CHÍNH XÁC với `.githooks` — 1 giá trị tuyệt đối-nhưng-tương-đương đọc thành "chưa wired". Xác nhận sống: `node bin/fgos.mjs doctor` trên chính checkout này, ngay trong phiên này, báo `main-checkout-hook-wired` **failed** ("core.hooksPath not wired... commits here are NOT guarded") — dù hook rõ ràng đang chặn commit (2 lần thật trong phiên này, bao gồm cả lúc commit `DISCUSSION.md`). False negative thật trên chính safety check của `fgos doctor`, tương phản trực tiếp với decision `0021`'s dogfood note ("doctor báo xanh" lúc 2026-07-28) — đáng 1 work item riêng, không sửa trong tsk-sir. |

## Pinned terms

- **Guard 1** — bước gọi `acquireMainCheckoutLock` trong `.githooks/pre-commit`'s `main()`, hiện chạy vô điều kiện.
- **Guard 2** — `currentFgwBranchIfMainCheckout`, bước check thứ 2 cùng file, đã biết skip worktree qua so `git-dir`/`git-common-dir`.

## Scout evidence

- `git config --get core.hooksPath` chạy từ main checkout VÀ từ
  `.claude/worktrees/tsk-1p9-rF2BQk` (2026-08-05) — cùng 1 đường tuyệt đối.
- `git config --get --show-origin core.hooksPath` (main checkout, phiên
  này) — origin là repo config file dùng chung, giá trị là đường tuyệt
  đối `/home/vantt/projects/forgentX/.githooks`, không phải relative.
- Thực nghiệm cô lập (repo scratch tạm, 2 script, phiên này): set
  `core.hooksPath` relative trên main, tạo linked worktree, xác nhận qua
  1 hook echo thật rằng nó KHÔNG chạy khi commit từ worktree (chỉ chạy
  khi commit từ main) — phủ nhận giả thuyết relative-resolve-về-main ban
  đầu (D1 → D7).
- `node bin/fgos.mjs doctor --dir <repo>` (phiên này) — `main-checkout-hook-wired`
  báo `failed`, dù hook thật đang chặn commit ngay trong phiên này (D8).
- `docs/decisions/0021-...md` dòng "Dogfood thật" — xác nhận checkout này
  còn relative `.githooks` và doctor xanh lúc 2026-07-28, tương phản trực
  tiếp với trạng thái quan sát được hôm nay (D7/D8).
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
  `judgeDiscovery` verdict trước đó, item này lần đầu qua `fgos-coding-exploring`.
- `rg -- "hooksPath" src/runner/worktree.mjs src/runner/claim-port.mjs src/runner/session.mjs` (D9) — 0 hit, `fgos pick` không đụng `core.hooksPath` khi tạo worktree.
- `node --test test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs` (viết + chạy trong phiên này) — FAIL hôm nay đúng như bug mô tả, dùng làm `verify` field của item; đã pass `judgeVerifySemanticCorrectness` sau 5 vòng do 4 lần trước không phải lệnh chạy được/không cover đúng claim.
- Report gốc: `plans/reports/internal-design-260805-1327-tsk-sir-worktree-commit-lock-scope-report.md`.
- `DISCUSSION.md` cùng thư mục — nguồn distill của CONTEXT.md này.

## Canonical references

- `.githooks/pre-commit`
- `src/runner/main-checkout-lock.mjs` (`acquireMainCheckoutLock`)
- `src/runner/claim-port.mjs` (`claimWork`), `src/runner/merge.mjs` (`mergeRunnerItem`)
- `docs/decisions/0021-wire-main-checkout-hook-qua-doctor-setup.md`
- `docs/history/tsk-45y-worktree-fgos-lock-decouple-stale-premise/CONTEXT.md`
- `test/e2e/main-checkout-lock-hook.test.mjs` (fixture cũ, per-root hooksPath — không share lock thật giữa main/worktree, xem D9)
- `test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs` (test mới của item này — repro thật, dùng làm `verify`)
- `docs/history/main-checkout-lock-worktree-commit-scope/DISCUSSION.md`

## Outstanding questions deferred to planning

- §3 dòng 4/5 của DISCUSSION.md (bug thật đã từng xảy ra chưa; có race ẩn
  nào vẫn cần lock cho worktree không) — chưa tìm thêm bằng chứng nào ở
  vòng scout này, D4/D5 đã đủ vững để `fgos-coding-planning` tự quyết mode/shape
  mà không cần chặn lại vì 2 điểm này.
- Test plan cụ thể (mirror `test/e2e/main-checkout-lock-hook.test.mjs`,
  thêm case worktree-commit-succeeds-while-main-locked) — thuộc phạm vi
  `fgos-coding-planning`, không phải việc của `fgos-coding-exploring`.
