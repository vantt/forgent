# Survey: Toàn bộ work item ĐANG MỞ liên quan tranh chấp lock/worktree/claim trong fgOS

Conducted: 2026-07-30 | Repo: forgentX (fgOS) | Nguồn: `.fgos/state.json` (140 work item, quét toàn bộ)

**Tracking (cập nhật sau thảo luận 2026-07-30)**:
- `tsk-6c2` (mới submit — `--wait` flag, xem báo cáo `cli-wait-flag-main-checkout-lock-design.md`) deps → `tsk-3vo`. Quyết định cuối: làm NGAY bất kể fork tsk-45y đi hướng nào (thắng short-term, rủi ro kiến trúc = 0), khác khuyến nghị thận trọng ban đầu ở mục 7 điểm 5.
- `tsk-45y` giờ deps → `tsk-56t` (done) + **`tsk-49a`** (mới thêm) — xem mục 6, quan hệ đổi từ "orthogonal" (bảng gốc) thành **tiền đề bắt buộc**: reconcile nhiều worktree về 1 nguồn sự thật (kiểu event-sourcing-replay-với-CAS, không phải union/git merge) chỉ an toàn khi claim discipline giữ đúng — đúng thứ `tsk-49a` đang chứng minh là đang vỡ.
- `tsk-49a` đã thêm acceptance ghi rõ vai trò tiền đề này + ref về báo cáo.

## TOC
1. Executive Summary
2. Methodology
3. Inventory (9 item mở, phân nhóm)
4. Lineage lịch sử — đã vá bao nhiêu lần rồi
5. Fork thiết kế thật sự đang treo (tsk-45y vs giữ nguyên mô hình)
6. Ma trận tác động: quyết định tsk-45y đổi gì ở các item khác
7. Khuyến nghị
8. Unresolved Questions

## 1. Executive Summary

Backlog **đã tự nhận ra** đúng vấn đề user đang thấy — không cần đề xuất mới. `tsk-45y` là 1 đề xuất redesign cấp cao: **.fgos nên là vùng ghi độc lập thật sự cho từng worktree, không bị main-checkout lock chặn**, ai đó chủ động commit/push thủ công vào lúc phù hợp. Đây chính là câu trả lời khả dĩ cho "UX tệ vì lock" ở tầng gốc, không phải vá từng verb.

Ít nhất **1 item khác đã CHÍNH THỨC dừng lại chờ quyết định này** (`tsk-2eq` ghi rõ "XUNG ĐỘT HƯỚNG THIẾT KẾ — nếu tsk-45y được chấp nhận thì hướng sửa này đổi hẳn"). Cộng thêm 1 sự cố nghiêm trọng đã xảy ra thật (`tsk-3au` — mất uncommitted work của nhiều tiến trình khác khi 1 agent lỡ tay thao tác trên main checkout dùng chung) — bằng chứng cụ thể cho rủi ro của mô hình "1 main checkout dùng chung, nhiều tiến trình cùng lúc".

Lịch sử cho thấy đây KHÔNG phải lần đầu — đã có **7 item done** vá từng mảnh của đúng vấn đề này (release-on-exit, race ở moveWork, clean-tree quét sai phạm vi, error message thiếu TTL, claim-lock gap khi discover, cwd-relative .fgos...). Vá tiếp từng mảnh mà không quyết `tsk-45y` trước sẽ tiếp tục pattern này.

## 2. Methodology

- Quét toàn bộ `work` map trong `.fgos/state.json` (140 item) bằng từ khoá: lock, contention, concurren, race condition, tranh chấp, deadlock, main-checkout.
- Lọc còn `status != done/wontfix` → 16 match thô → đọc full nội dung, loại các false-positive (item chỉ chứa chữ "claim"/"lock" không liên quan tranh chấp thật, vd tsk-u8w về hiển thị status×stage, tsk-4op về tách compound-learn) → còn **9 item thật sự liên quan**.
- Đọc `description`/`acceptance` đầy đủ của cả 9 item (không chỉ title).

## 3. Inventory (9 item mở, phân nhóm)

### A. Đề xuất redesign cấp cao (gốc của mọi thứ dưới đây)

| ID | Status/Stage | Nội dung |
|---|---|---|
| **tsk-45y** | todo/clarify | `.fgos` nên là vùng ghi ĐỘC LẬP thật sự cho từng worktree — không bị main-checkout lock chặn. Ai đó chủ động commit/push `.fgos` về main vào lúc phù hợp, thay vì mọi ghi state phải tranh main-checkout lock. Dep: `tsk-56t` (done) + **`tsk-49a`** (thêm 2026-07-30 — tiền đề bắt buộc, xem mục 6). |

### B. Lock COVERAGE GAP — thiếu khoá, không phải tranh chấp

| ID | Status/Stage | Nội dung |
|---|---|---|
| **tsk-1wn** | todo/clarify | `docs-index` verb ghi thật file (`fs.writeFileSync` vào `docs/enduser-docs-index.json`) nhưng khai `touchesState:false`/`externalEffect:false` (sai) và KHÔNG acquire main-checkout-lock như mọi verb ghi khác. `fgos-indexing` SKILL đẩy MỌI session chạy verb này ngay sau khi viết xong 1 end-user doc — route thường xuyên. Nhiều session song song → lost-update (verb luôn regenerate FULL từ đĩa, không merge). Quan sát thật 2026-07-29: file liên tục dirty giữa các lần kiểm tra lúc 3 worktree active song song. |

### C. Lock CORRECTNESS bug — có khoá nhưng bảo vệ sai chỗ/sai lúc

| ID | Status/Stage | Nội dung |
|---|---|---|
| **tsk-2eq** | todo/clarify | Leaf `approve` truyền `ephemeral.path` (worktree tạm) vào `mergeRunnerItem` thay vì `repoRoot` thật → lock resolve nhầm vào `<ephemeral>/.fgos` — thư mục này VỪA bị `removeWorktree` xoá rồi `acquireMainCheckoutLock` lại tự tạo mới → lock LUÔN `ACQUIRED`, KHÔNG BAO GIỜ tranh chấp thật. Hệ quả: lock thật ở `<repoRoot>/.fgos/main-checkout.lock` không hề được giữ suốt quá trình merge leaf→root (git merge --no-commit + kiểm `.fgos-write` + verify chạy KHÔNG được bảo vệ). **Tự ghi rõ: xung đột hướng với tsk-45y, phải chờ quyết định trước khi sửa.** |
| **tsk-480** | todo/clarify | `approve`'s root-merge: `mergeRunnerItem` land commit thật lên main thành công, nhưng bước kế `moveWork(to:'done')` (khoá `events.jsonl` RIÊNG, không phải main-checkout lock) throw vì tranh chấp — item vĩnh viễn kẹt ở `proposed`, KHÔNG có friction record, không dấu vết chẩn đoán. Đã xảy ra thật (commit `2766e60` lên main trong lúc `tsk-3wr` vẫn `status:proposed` nhiều phút, chỉ phát hiện bằng diff tay `git log` vs `fgos list`). |
| **tsk-2j9** | todo/clarify | `mergeRunnerItem` crash khi branch đã merge sẵn vào main (no-op, không có `MERGE_HEAD`) NHƯNG verify sau đó fail (vd do "hoạt động đồng thời trên main checkout dùng chung") → code gọi `git merge --abort` vô điều kiện → crash `fatal: There is no merge to abort`. |
| **tsk-3vo** | todo/clarify | `return`/`approve`/`catchup` chạy verify KHÔNG timeout mặc định (cố ý, có ghi trong error text). `return` release lock CHỈ SAU KHI verify trả về — verify treo → lock giữ tới hết TTL (3 phút) → cửa sổ mở cho writer khác VÀO TRONG LÚC verify thật vẫn đang chạy. Runner loop tự nó ĐÃ luôn set timeout (900000ms từ `.fgos-runner.json`) — chỉ CLI verb do skill gọi trực tiếp (`/fgOS:return`, `/fgOS:cook`, `/fgOS:pick`) là thiếu. **Liên đới trực tiếp tới thiết kế `--wait` (báo cáo song song) — xem báo cáo `cli-wait-flag-main-checkout-lock-design.md` mục 6.** |

### D. Claim-level race — KHÔNG phải file-lock, tầng khác hẳn

| ID | Status/Stage | Nội dung |
|---|---|---|
| **tsk-49a** ⚠️ tiền đề cho tsk-45y | todo/clarify | `fgos take --role session` claim KHÔNG ngăn được autonomous runner/dispatcher độc lập pick TRÙNG item và hoàn thành song song. Tái hiện thật: session A `take` `tsk-4fu-2` (role session, ghi trong event log), đang tự tay implement thì phát hiện main checkout ĐÃ có commit độc lập implement CÙNG feature — landed thẳng main, không qua branch `fgw/`, không có `fgos return` event nào. Nghi vấn root cause: `loop.mjs`'s dispatch selection có kiểm session-role claim đang sống không, hay chỉ check status/stage/deps rồi bỏ qua claim. |
| **tsk-65n** | todo/clarify | Sau khi `fgos discover` release claim về `todo` (decompose→executing), dùng lại `take` (thay vì `pick`) cho item vốn là branch-source sẽ claim NHẦM thành main-source (vì `take` luôn `isolate:false`). Đường vòng đúng: `blocked` → `take` (branchExists mới trigger `isBranchTake`) — `pick` trực tiếp sẽ force-reclaim worktree đang active, dễ phá session đang chạy. |

### E. Sự cố blast-radius thật đã xảy ra (bằng chứng rủi ro mô hình hiện tại)

| ID | Status/Stage | Nội dung |
|---|---|---|
| **tsk-3au** (tier: heavy) | todo/clarify | Agent lỡ dùng absolute path trỏ về main checkout (thay vì worktree path) sau `EnterWorktree` → commit đầu tiên landed thẳng lên `main` thay vì branch `fgw/`. Sửa bằng `git reset --hard` trên main checkout — nhưng KHÔNG `git status` toàn bộ trước → xoá LUÔN uncommitted changes của tiến trình KHÁC đang chạy (`claim-port.mjs`, `loop.mjs`, `worktree.mjs` + `.fgos/entropy-history.jsonl`, `events.jsonl`, `coexistence.json`) — theo lời user, code của "vô số tiến trình đang merge". **Không cứu được** (chưa từng `git add`, không stash/reflog). Item liên quan bị block vĩnh viễn vì `branchHeadAtTake` tự re-baseline, không có field editable để patch lại. |

## 4. Lineage lịch sử — đã vá bao nhiêu lần rồi (evidence cho "cần nhìn tổng thể")

| ID | Status | Đã vá gì |
|---|---|---|
| tsk-56t | done | verb ghi state giả định cwd luôn = main checkout — sửa để không giả định sai |
| tsk-45z | done | Thêm `releaseOnExit` (opt-in) cho main-checkout lock |
| tsk-3w8 | done | `approve`'s `moveWork(to:'done')` fail khi đua session khác commit main cùng lúc — code merge an toàn, chỉ state-flip bị rớt (tiền thân trực tiếp của `tsk-480` hiện tại — **cùng loại bug tái diễn ở chỗ khác**) |
| tsk-598 | done | `return`/`approve`'s clean-tree check chặn cả file KHÔNG liên quan của phiên khác — sửa chỉ đối chiếu file của chính item |
| tsk-5z2 | done | Lỗi lock chỉ in holder pid, không in TTL/age — thêm `lock-status` verb đọc-only |
| tsk-2zv | done | claim-lock gap: discover release claim làm reset `branchHeadAtTake` khi reclaim |
| tsk-4fu-2 | done | Thêm cảnh báo/refuse khi verb ghi state chạy từ cwd khác main repo |

**7 lần vá piecemeal cho cùng 1 cụm vấn đề gốc** (main checkout dùng chung + nhiều tiến trình + lock/claim). `tsk-480` hôm nay lặp lại GẦN NHƯ NGUYÊN VẸN bug đã vá ở `tsk-3w8` — chỉ khác chỗ throw. Đây là tín hiệu rõ: vá từng điểm không hội tụ, vì nguyên nhân gốc (kiến trúc "1 main checkout, nhiều writer, lock+TTL") vẫn còn nguyên.

## 5. Fork thiết kế thật sự đang treo

**Option 1 — Giữ mô hình hiện tại (1 main checkout dùng chung, lock file + TTL), hardening piecemeal:**
- Fix coverage gap (tsk-1wn: thêm acquire chỗ thiếu)
- Fix correctness bug (tsk-2eq: tách `lockRoot` khỏi cwd; tsk-480: bọc lỗi thành friction record; tsk-2j9: check `MERGE_HEAD` trước abort)
- Fix robustness (tsk-3vo: verify timeout mặc định)
- Thêm `--wait` (báo cáo song song) để giảm đau UX tranh chấp ngắn hạn
- Fix claim-level (tsk-49a: runner phải tôn trọng session-role claim; tsk-65n: quy trình reclaim rõ ràng hơn)
- **Đặc điểm**: nhiều fix độc lập, rủi ro thấp từng cái, nhưng KHÔNG đóng được lớp nguyên nhân gốc — `tsk-3au` (blast radius khi 1 tiến trình thao tác nhầm trên checkout dùng chung) vẫn còn nguyên rủi ro dù vá hết 8 item kia.

**Option 2 — `tsk-45y`: .fgos độc lập theo worktree, bỏ main-checkout lock cho ghi state:**
- Mỗi worktree tự ghi `.fgos` của mình, không tranh lock với ai — loại bỏ TOÀN BỘ nhóm C (lock correctness bug) và phần lớn nhóm B ngay lập tức vì không còn 1 checkout dùng chung để tranh chấp trên đó nữa.
- Đổi lại: cần cơ chế reconcile (merge nhiều `.fgos` event log về 1 nguồn sự thật) — "ai đó chủ động commit/push vào lúc phù hợp" (nguyên văn đề xuất) là thủ công, CHƯA có cơ chế tự động, CHƯA rõ conflict-resolution khi 2 worktree cùng sửa cùng 1 work item.
- Không giải quyết `tsk-3au` (blast radius do lỗi thao tác con người/agent, không phải do lock) và không giải quyết `tsk-49a` (claim-level race giữa runner/dispatcher, orthogonal với việc `.fgos` ghi ở đâu).

## 6. Ma trận tác động: quyết định tsk-45y đổi gì ở item khác

| Item | Nếu Option 1 (giữ mô hình) | Nếu Option 2 (tsk-45y được chấp nhận) |
|---|---|---|
| tsk-2eq | Sửa như đề xuất (tách lockRoot) | **Phải thiết kế lại hoàn toàn** — tự ghi rõ trong item |
| tsk-1wn | Sửa: thêm acquire | Có thể MẤT Ý NGHĨA — nếu .fgos không còn tranh lock, "thiếu acquire" không còn là bug |
| tsk-480 | Sửa: bọc lỗi thành friction | Vẫn cần — đây là lock RIÊNG của `events.jsonl`, không phải main-checkout lock, tsk-45y không đụng tới |
| tsk-2j9 | Sửa: check MERGE_HEAD | Không đổi — bug ở git merge logic, độc lập với mô hình lock |
| tsk-3vo | Sửa: verify timeout mặc định | Vẫn cần — verify hang là vấn đề riêng, không phụ thuộc mô hình lock |
| `--wait` (`tsk-6c2`, đã submit) | Đáng làm — giảm đau ngay | Vẫn đáng làm — quyết định cuối: làm bất kể Option nào thắng (xem Tracking đầu báo cáo) |
| tsk-49a | Sửa: runner tôn trọng claim | **KHÔNG CÒN orthogonal** — là TIỀN ĐỀ BẮT BUỘC phải sửa TRƯỚC tsk-45y (cập nhật sau thảo luận sâu về cơ chế reconcile — xem Tracking đầu báo cáo) |
| tsk-65n | Sửa: quy trình reclaim | Không đổi — claim-flow, orthogonal |
| tsk-3au | Không tự hết — cần safeguard riêng (EnterWorktree detect sai path) | Không tự hết — cùng lý do |

**Quan sát chính**: quyết định tsk-45y ảnh hưởng trực tiếp 3/9 item (tsk-2eq, tsk-1wn, và gián tiếp cả `--wait`) — **không ảnh hưởng** 6/9 item còn lại (chúng là bug độc lập ở lớp khác: events-lock riêng, git-merge logic, verify-timeout, claim-level, human-error). Nghĩa là: **quyết định tsk-45y quan trọng nhưng không phải "giải hết mọi thứ"** — vẫn cần dọn 6 item kia dù chọn hướng nào.

## 7. Khuyến nghị

1. **Quyết `tsk-45y` TRƯỚC** (chỉ cần quyết định hướng, chưa cần implement ngay) — vì nó khoá `tsk-2eq` lại (item tự thừa nhận không sửa được cho tới khi biết hướng) và ảnh hưởng độ ưu tiên của `--wait`.
2. Trong lúc chờ quyết `tsk-45y`: làm ngay 4 item KHÔNG phụ thuộc hướng nào (tsk-480, tsk-2j9, tsk-3vo, tsk-1wn nếu Option 1 nghiêng về giữ mô hình) — rủi ro thấp, giá trị rõ, không tốn công làm lại.
3. `tsk-49a` (claim-level, runner bỏ qua session claim) nên tách ưu tiên riêng — đây là bug NGHIÊM TRỌNG NHẤT về mặt hậu quả (duplicate work, code rác lên main) trong 9 item, độc lập hoàn toàn với câu chuyện main-checkout lock.
4. `tsk-3au` cần 1 safeguard riêng ở tầng skill/harness (phát hiện path lệch ra ngoài worktree đang active) — không phải bug lock, là gap về guardrail thao tác, nên tách khỏi cụm "sửa lock" để không bị lẫn ưu tiên.
5. Đừng thêm `--wait` (báo cáo song song) TRƯỚC KHI quyết `tsk-45y` — nếu Option 2 thắng, phần lớn giá trị của `--wait` biến mất, công sẽ phí.

## 8. Unresolved Questions

- `tsk-45y` chưa có acceptance criteria/verify — cần P15 bổ sung trước khi có thể lên plan thật.
- Cơ chế "ai đó chủ động commit/push .fgos vào lúc phù hợp" (tsk-45y) — ai, khi nào, tự động hay thủ công? Chưa có câu trả lời trong item, cần làm rõ ở bước `fgos discover`/`fgos-coding-exploring` cho chính item này.
- Conflict-resolution khi 2 worktree cùng sửa cùng 1 work item trong `.fgos/state.json`/`events.jsonl` dưới Option 2 — chưa thấy đề cập ở đâu trong backlog hiện có.
- `tsk-49a`'s nghi vấn root cause (runner có check session-role claim hay không) — chưa xác nhận, cần đọc `loop.mjs`'s dispatch selection logic để trả lời dứt điểm trước khi lên plan sửa.
