# Dò lại quyết định: vì sao fgOS bỏ "branch tự viết event + merge git union", chuyển sang "mọi write dồn về main checkout"

## TL;DR

- **Trí nhớ đúng một nửa, 2 cơ chế đang bị nhớ lẫn.** "Branch tự viết event, merge về bằng git union" từng xảy ra thật (28/7), nhưng đó là **hệ quả phụ** của việc `.fgos/` git-tracked + `git worktree add` mặc định copy nó theo — không ai chủ đích thiết kế thế, không ai chặn worker ghi vào bản copy đó.
- **Khó khăn buộc đổi hướng:** 2 sự cố mất data thật, cách nhau 14 phút, cùng 1 session, ngày 2026-07-28 — git 3-way text merge không hiểu semantics của 1 append-only log, hand-resolve conflict 2 lần theo 2 cách khác nhau, cả 2 đều làm mất event thật (`seq` trùng + nhảy cóc).
- **Quyết định (ADR0020, cùng ngày 28/7, ~19:58-20:11):** xét đúng option "isolate-tree" (bootstrap-copy + union-merge-at-merge-back — nguyên văn "pattern beegog uses") và **bác bỏ**, chọn "block-tree" (chặn hẳn `.fgos/` khỏi worktree). Lý do bác: YAGNI thật (verify bằng đọc code — không có chỗ nào trong dispatch path đọc/ghi `.fgos/` từ worktree) + build nửa vời một cơ chế union-merge lúc đó (chưa có content-addressing, chưa có contiguity check) sẽ chỉ lặp lại đúng loại mất-data vừa xảy ra.
- **Cơ chế "git union" anh nhớ đến SAU và Ở CHỖ KHÁC.** `.gitattributes: .fgos/events.jsonl merge=union` chỉ thêm 2026-08-10 (tsk-3wq), áp cho `.fgos/events.jsonl` của **main checkout dùng chung** (multi-session/catch-up merge trực tiếp) — không phải cơ chế merge-back của nhánh `fgw/<id>`. ADR0020 (block-tree) chưa từng bị đảo — nhánh vẫn không bao giờ mang `.fgos/`.
- **repository-harness thật sự không làm đúng cách anh nhớ.** Grep nguồn: cơ chế của họ là content-addressed changeset + append JSONL trong cùng SQLite transaction, chống double-apply bằng identity — không phải "git-union thô". fgOS mới có phần tương đương (`events-jsonl-contiguity.mjs`) sau, như 1 fix vá, không phải thiết kế gốc.
- **Điểm mở cho quyết định hôm nay:** hạ tầng ADR0020 từng nói "chưa cần xây" — union-merge driver + contiguity-dedupe — **giờ đã tồn tại thật** (từ 10/8), chỉ đang áp cho main checkout, chưa áp cho nhánh. Nếu muốn tái mở isolate-tree cho `fgw/<id>`, hạ tầng đã đủ chín hơn 28/7 nhiều — nhưng đây là đảo 1 quyết định đã chốt, cần xác nhận trade-off trước khi động vào code.

---

## Timeline đầy đủ (nguồn: git log + docs)

| time | hash/nguồn | sự kiện |
|---|---|---|
| trước 28/7 | (mặc định git) | `.fgos/` git-tracked. `git worktree add` cho `fgw/<id>` tự động checkout kèm `.fgos/`. Không có cơ chế nào chặn worker ghi vào bản copy này — worker viết event trực tiếp trên nhánh, y hệt trí nhớ của anh. |
| 2026-07-28 17:21:50 | `aa9ae156` | `fix: resolve events.jsonl merge conflict - keep both sides sorted by timestamp` — git 3-way text merge coi 2 phía cùng append cuối file là conflict thật, hand-resolve. |
| 2026-07-28 17:35:32 | `9e3fb469` | `fix: merge tsk-3oa events (keep theirs, rebuild)` — 1 conflict khác, **cùng session window**, resolve theo cách khác hẳn lần trước. |
| (phát hiện sau) | `docs/history/live-events-seq-corruption/CONTEXT.md` (tsk-n4i) | `git blame` xác nhận chính 2 commit trên đã ghi 2 dòng `seq` trùng lặp + 5 chỗ nhảy cóc — mất event thật, không phải race trong `appendEvent`/`events.lock` (lock đã có từ 17/7, đi trước 11 ngày, không liên quan). D1 khoá: root cause là "ad hoc git-merge-conflict hand-resolution trên `.fgos/events.jsonl` được git-track" — chưa có quy trình resolve conflict nào được định nghĩa cho file này. |
| 2026-07-28 19:58:18 | `59551886` | `fix(tsk-1an): keep .fgos/ out of fgw/<id> worker worktrees` — code fix thật: `createWorktree` xoá hẳn `.fgos/` sau khi `git worktree add`, không symlink, không giữ lại gì. |
| 2026-07-28 20:11:53 | `4dc91711` | `docs: renumber ADR to 0020, sync docs index` — chốt tài liệu `docs/decisions/0020-chan-fgos-khoi-worktree-worker.md`. |
| 2026-08-10 19:43:12 | `fbd856bc` (tsk-3wq) | `.gitattributes: .fgos/events.jsonl merge=union` — **route mọi `git merge` chạm path này qua union merge driver**, kèm `scripts/events-jsonl-contiguity.mjs` (dedupe theo content, resequence `seq` 1..N contiguous). Đây là mảnh "git union" anh nhớ — nhưng áp cho main checkout's own file, không phải merge-back của nhánh worker. |

## Quyết định thật (đọc trực tiếp từ `docs/explanation/worktree-isolation-axis-decision.md`)

Câu hỏi mở trên bàn lúc đó (`docs/distillery/porting-log.md:101`, gắn cờ `candidate`, chưa quyết):

> "should the per-worktree checkout **lock-in-tree** (symlink `.fgos/` back to the shared store) or **isolate-tree** (bootstrap-copy `.fgos/` per worktree with union-merge at merge-back, the pattern beegog uses for its worker fan-out)?"

`isolate-tree` = chính xác cơ chế anh nhớ (branch có bộ event riêng, merge về bằng union). Quyết định thực tế **không chọn 1 trong 2**, chọn phương án thứ 3 — **block-tree**:

> "Đã chốt: chặn-cây (không khóa/symlink, không cô-lập/copy). worktree.mjs's createWorktree xóa hẳn .fgos/ khỏi checkout worker; merge.mjs's mergeRunnerItem từ chối cứng (fgos-write-rejected) bất kỳ diff nào chạm .fgos/ trước khi tin merge."

Lý do bác `isolate-tree`, trích nguyên văn:

> "Why not full isolate-tree: nothing in the dispatch path actually reads or writes `.fgos/` from inside a worktree today (verified by reading the code, not assumed) — building a whole bootstrap-copy-plus-union-merge subsystem for a need that doesn't exist yet is building ahead of YAGNI."

Lý do bác `lock-in-tree` (không phải lý do bác isolate-tree, khác trục):

> "a symlink pointing back out of the worktree is a classic sandbox escape — a worker's execution context has no real capability wall ... a stray write would land directly in the live `.fgos/events.jsonl`, unreviewed."

## Vì sao đây không phải "union-merge tự nó tệ" mà là "chưa có hạ tầng an toàn cho nó"

Đọc `docs/history/events-jsonl-merge-driver-recurring-write-loss/CONTEXT.md` (tsk-3wq, D1) cho thấy khi fgOS **thật sự** xây union-merge (10/8, cho main checkout), 2 phương án bị bác là:

> "rejected: stop-committing entirely (bigger behavior change...); rejected: guard-only (only detects the problem after a merge attempt, doesn't prevent the loss)"

— tức lúc build thật, KHÔNG hề cân nhắc lại việc trả `.fgos/` về cho nhánh (`isolate-tree`/ADR0020 vẫn đứng nguyên, không phải lựa chọn được xét lại). Đồng thời chính `.gitattributes` comment tự thừa nhận residue của `union`:

> "It does not guarantee order or dedupe/reseq the result" — cần thêm `events-jsonl-contiguity.mjs` mới đủ an toàn.

Nghĩa là: **union-merge chỉ an toàn khi đi kèm content-addressed dedupe + contiguity resequence** — 2 mảnh này KHÔNG tồn tại ngày 28/7 (lúc đang cân nhắc isolate-tree lần đầu), chỉ xuất hiện 10/8. Nếu 28/7 chọn isolate-tree mà không có 2 mảnh này, sẽ tái diễn đúng loại mất-data 2 lần vừa xảy ra — chỉ khác vị trí (nhánh thay vì main).

## repository-harness/beegog thật sự làm gì (grep trực tiếp, không suy diễn)

`docs/distillery/sources/repository-harness.md`, dòng 221:

> "giải bài toán 'SQLite không diff được trong git' bằng event log commit được; **content-addressed identity chống double-apply lệch nội dung**. ... changeset chỉ ghi khi env `HARNESS_RUN_ID` set, **append JSONL trong cùng SQLite transaction** (rollback chung), payload là full-record chứ không phải column diff."

Dòng 371 (biến thể mới hơn):

> "SQLite baseline ... tách thành: snapshot read-only committed + JSONL changesets committed riêng theo thời gian; mỗi worktree tự `materialize-core-state.sh` ghi ra bản `harness.db` writable-**ignored** (gitignored, không commit) từ 2 nguồn commit đó."

Không có chỗ nào mô tả "mỗi branch tự viết JSONL rồi git-union thô về". Cơ chế thật của họ: **content-addressed identity** (chống double-apply bằng hash nội dung, không dựa vào `seq` tuần tự hay git union tự nhiên) + local materialized copy luôn được **regenerate từ nguồn committed**, không phải nguồn ghi trực tiếp rồi merge. fgOS's `events-jsonl-contiguity.mjs` (dedupe theo content, resequence) là mảnh gần tương đương nhất — nhưng ra đời sau, như fix vá cho 1 sự cố cụ thể, không phải thiết kế gốc như bên harness.

## So sánh chi tiết: repository-harness vs beehive cho đúng bài toán racing/mất-data

### repository-harness giải bài toán khác hẳn — không đối chứng trực tiếp được

Đọc toàn bộ `docs/distillery/sources/repository-harness.md` (457 dòng): họ **không có** cơ chế "branch tự viết event, merge về bằng git union" ở bất kỳ đâu. Cơ chế thật:

- **`durable-sqlite-layer`/`changeset-event-sourcing`** (dòng 25-29, 218-222): state sống ở SQLite `harness.db`, **gitignored**, rebuild được từ đầu bằng `db rebuild` replay changeset. Chỉ JSONL changeset (append-only, `content_sha256`-keyed, chống double-apply) mới git-tracked. → họ né hẳn bài toán "merge 1 file structured trong git" bằng cách không commit state có thể conflict.
- **`symphony-isolated-runner`** (dòng 145-150): worktree riêng nhận **copy** `harness.db`, chạy xong trả về 1 **semantic changeset** để apply — "root db never source of truth of a run". Không có bước git-merge nào trên state cả.
- **`story-status-single-door`** (dòng 175-180): an toàn concurrent bằng **compare-and-set** (`--expected-status`) ở tầng DB, lệch trạng thái → CONFLICT exit 3, không ghi gì — hoàn toàn không dùng git merge semantics.
- **Giới hạn cấu trúc quan trọng nhất, tự lộ trong nguồn:** `auto-polling-bounded` (dòng 152-157) nói thẳng "**single-active-run lock** trong `.symphony/state.db`" — kiến trúc của họ **chủ đích chỉ có 1 run sống tại 1 thời điểm**. Họ chưa từng phải giải bài toán "nhiều session/worktree ghi đồng thời" mà fgOS đang gặp — CAS + changeset của họ mạnh cho 1-writer-tại-1-thời-điểm, không có bằng chứng nào cho N-concurrent-writer thật.
- Tự thừa nhận giới hạn khác (dòng 50-54, `instruction-level-enforcement`): "Trước E12 ... Permissions are instruction-level only" — không hook, không CI gate, không git hook cho phần lớn lịch sử dự án; **chính distillery note kết luận**: "quỹ đạo của harness đang tiến dần về phía enforce — xác nhận hướng beehive chọn từ đầu là đúng."
- Thêm 1 tín hiệu thật: `repository-centered-default-workflow` (dòng 125-129) — Phase 1-2 **bỏ hẳn SQLite/CLI khỏi default path**, chuyển thành add-on `--with-cli`. Chính họ rút lui khỏi việc bắt mọi repo gánh cả durable-layer nặng ký này làm mặc định — dấu hiệu chi phí/độ phức tạp thật, không phải giả thuyết.

**Kết luận:** repository-harness không phải đối chứng tốt cho câu hỏi "làm sao nhiều nhánh/session ghi đồng thời vào 1 event log mà không mất data" — vì kiến trúc của họ tránh né chính bài toán đó bằng cách không cho phép nhiều writer đồng thời từ đầu.

### beehive giải đúng bài toán fgOS đang gặp — và khớp gần nhất với trí nhớ của anh

`independent-feature-worktrees` (dòng 415-421, beehive.md) là mảnh khớp thật với "branch tự viết + merge git union" — nhưng có 3 lớp phụ trợ mà trí nhớ "chỉ merge bằng git union" bỏ sót:

1. **Log-tier union-merge có phạm vi hẹp, không phải toàn bộ state.** Nguyên văn: "`.gitattributes` merge=union" chỉ áp cho **`decisions/backlog/review-candidates.jsonl`** — không áp cho state.json-tương-đương. Union-merge chỉ an toàn cho log append-only, order-independent-by-content; beehive tự giới hạn phạm vi đúng chỗ này, và còn thêm `replayLog` dedup khi tái hợp — không tin union thô là đủ, giống hệt fgOS's `events-jsonl-contiguity.mjs` (nhưng của beehive được thiết kế kèm từ đầu, không phải vá sau).
2. **`cross-worktree-holds-ledger`** (dòng 444-449): ledger chia sẻ chỉ sống ở main checkout, mirror mọi reservation sang các worktree anh em — worktree A biết worktree B đang giữ path nào TRƯỚC KHI ghi, không phải advisory đọc sau như `/fgOS:conflicts` hiện tại của fgOS.
3. **`worktree-merge-staged-verify-gate`** (dòng 451-456) — đây là mảnh mạnh nhất, trực tiếp áp được cho đúng lỗ hổng còn mở của fgOS (`tsk-1i3`, merge-content-precedence overwrite 22:51 20/8): merge-back là `git merge --no-ff --no-commit` **stage trước**, verify chạy trên cây **chưa commit**, chỉ commit khi xanh; đỏ → `git merge --abort` + bằng chứng typed (HEAD không đổi, không MERGE_HEAD, tracked status sạch) — **không bao giờ tạo merge commit khi verify đỏ**. fgOS hiện tại là ngược lại: merge trước (commit thật), verify sau — đúng khe hở khiến sự cố 22:51 20/8 phải restore tay 58 giây sau khi phát hiện.
4. **`worktree-protected-attestation`** (dòng 486-491): orchestrator tự chụp identity thật của worktree (`commonDir`/`worktreePath`/`headRef`/`baseCommit`) TRƯỚC khi dispatch worker, rồi 4 loại halt cơ học nếu lệch — đây chính là cơ chế lẽ ra bắt được `tsk-43z` (agy spawn nhầm cwd, commit thẳng lên main) một cách máy móc, thay vì phải phát hiện bằng may mắn + git revert như fgOS đã làm.
5. **`store-lock-named-mutex`** (dòng 437-442): named lockfile cross-process, staleness 2 tầng — quá 30s mới là ứng viên, còn phải chứng minh pid chủ cũ đã chết mới được cướp, trần cứng 1h chống pid tái dụng. Đây đúng loại cơ chế còn thiếu ở guard mark file hiện tại của fgOS (`events-jsonl.truncation-guard.json` không lock/scope per-session — gây false positive 03:19:28 sáng nay, đã ghi trong report sáng).

### Bên nào hay hơn cho đúng bối cảnh racing liên tục của fgOS

**beehive rõ ràng là đối chứng đúng và mạnh hơn** — vì nó giải chính xác bài toán fgOS đang có (N worktree/session ghi đồng thời), còn repository-harness giải 1 bài toán dễ hơn (1 writer tại 1 thời điểm) nên không đối chứng được. Đây không phải nhận định chủ quan — nó dựa trên đúng 1 dòng tự thừa nhận trong nguồn (`auto-polling-bounded`, single-active-run lock) và 1 kết luận tự thân của distillery note (harness "đang tiến về phía beehive").

### Giới hạn thật của beehive (đọc trực tiếp từ nguồn, không suy diễn)

1. **`withStoreLock` không reentrant** — 1 lần acquire lồng nhau tự đợi chính nó tới timeout (dòng 438). Đây là 1 lớp bug-class hoàn toàn mới nếu fgOS copy nguyên xi mà không cẩn thận ở chỗ nào 1 verb gọi verb khác cùng giữ lock.
2. **Staleness cần cả 2 điều kiện (30s + pid-liveness), không dùng heartbeat** — vì 1 lock hợp lệ có thể "đứng hình" cả phút do `spawnSync` (chạy verify lúc merge worktree) khiến timer không renew kịp (dòng 440). Trade-off có chủ đích, nhưng nghĩa là 1 verify chạy lâu trên fgOS's full-suite 6 phút (đã đo trong report sáng) sẽ liên tục chạm ngưỡng "ứng viên stale" nếu bê nguyên tham số 30s.
3. **Cơ chế đã từng vỡ thật trong production của chính beehive**: bản cắt sớm của `cross-worktree-holds-ledger` "release theo holder" đã **xoá sạch hold mirror của worker khác đang chạy song song** vì `holder:"main"` là identity dùng chung cho mọi agent trong main checkout (dòng 447) — bằng chứng cơ chế này tinh vi, dễ vỡ đúng kiểu silent-cross-session-damage mà fgOS đang cố tránh, không phải thứ copy 1 lần là xong.
4. **Threat model bị giới hạn tường minh, không phải sandbox thật**: "worktree isolation is a git boundary, explicitly not a sandbox" (`worktree-protected-attestation`, `unattended-agent-accepted-risk-posture` dòng 534-539) — worker vẫn dùng chung máy/network/credentials; chạy `bypassPermissions` không allowlist là rủi ro *được chủ động chấp nhận*, không phải rủi ro đã triệt tiêu. Nếu fgOS học theo, vẫn phải tự chịu đúng loại rủi ro dispatch-out-of-process mà `tsk-43z`/`tsk-9tu` (report sáng) đang treo.
5. **Chi phí xây dựng thật, không rẻ**: toàn bộ combo (named mutex + holds ledger + staged-verify-merge + attestation + wave scheduling `computed-parallel-schedule`) là ~5 cơ chế phối hợp, và chính delta note của beehive tự mô tả đây là "đợt hardening đa-phiên" ra đời SAU nhiều sự cố sống thật, không phải thiết kế đúng ngay từ đầu (dòng 20: "mọi thứ trước đây đúng-nhờ-quy-ước nay đúng-nhờ-khoá") — beehive đi đúng con đường "vá sau khi vỡ" mà fgOS đang đi, chỉ là họ đã đi xa hơn.

### fgOS nên đi hướng nào — khuyến nghị cụ thể theo mức độ đòn bẩy

Không đề xuất copy nguyên khối beehive (chi phí xây + rủi ro bug-class mới ở mục Giới hạn #1-3 là thật) và không đề xuất hướng SQLite của repository-harness (không đối chứng đúng bài toán, và chính họ đã rút lui khỏi việc ép làm mặc định). Theo đúng root cause đang mở trong report sáng (`investigation-260821-1050-...`), xếp theo đòn bẩy/root-cause khớp trực tiếp:

| Mức | Mảnh mượn từ beehive | Root cause nó đóng | Ghi chú |
|---|---|---|---|
| **Cao nhất** | `worktree-merge-staged-verify-gate` — stage-merge (`--no-ff --no-commit`) → verify trên cây chưa commit → chỉ commit khi xanh | Đóng chính xác root cause #2 report sáng (merge-content-precedence overwrite 22:51 20/8, `tsk-1i3` đang mở, chưa ai target) | fgOS's `merge.mjs` hiện làm ngược: merge trước (commit), verify sau — đổi thứ tự này không cần đảo ADR0020 |
| **Cao** | `worktree-protected-attestation` — chụp identity worktree trước dispatch, halt cơ học khi lệch | Đúng lớp lỗi `tsk-43z` (dispatch cwd bug) — hiện chỉ phát hiện bằng may + revert | Không cần ADR0020, độc lập với isolate-tree |
| **Trung bình** | `store-lock-named-mutex` (2-tầng staleness: soft-time + pid-liveness, không heartbeat) | Guard mark file hiện tại không lock/scope per-session (`tsk-1vc` đang mở đúng chỗ này) | Cần chỉnh ngưỡng 30s cho phù hợp full-suite verify 6 phút của fgOS, xem Giới hạn #2 |
| **Cần quyết định của anh trước** | `independent-feature-worktrees` + log-tier union-merge phạm vi hẹp (chỉ `events.jsonl`, không phải toàn `.fgos/`) + `cross-worktree-holds-ledger` | Root cause #1 (mọi write dồn về main checkout, đúng câu hỏi gốc anh hỏi) | Đây là đảo ADR0020 — hạ tầng union+contiguity đã đủ chín (xem trên), nhưng cần verify lại YAGNI-check + chấp nhận thêm ~3 cơ chế phối hợp mới (không rẻ, xem Giới hạn beehive #1/#3) |

Thứ tự đề xuất: làm 3 mục đầu trước (không đụng ADR0020, đóng đúng 2 root cause cụ thể đã biết), rồi mới cân nhắc mục cuối — vì 3 mục đầu tự nó có thể giảm đáng kể áp lực dồn-về-main-checkout (verify sớm hơn/rẻ hơn, ít lần phải revert tay) trước khi phải trả thêm chi phí đảo 1 decision đã chốt.

## Phát hiện mới: fgOS đã biết đúng hướng harness từ 28/7, kẹt vì áp lực khẩn cấp

### Bằng chứng — bị bỏ sót ở lần điều tra đầu

`plans/reports/distill-consult-worktree-in-out-repository-harness-260728.md` — **2026-07-28 17:26**, tức **cùng ngày ADR0020, trước lúc chốt (~19:58-20:11) khoảng 2.5 giờ**. Tài liệu này phân tích đúng cơ chế repository-harness's `symphony-isolated-runner`/`changeset-event-sourcing` (copy db lúc fork, changeset JSONL commit git, `content_sha256` chống double-apply, CAS merge gate) — **đúng y hệt cơ chế cả buổi hôm nay mới đào lại**. Kết bằng "Recommended ForgentX Adoptions (Priority Order)":

1. Commit changesets to git (unlocks reproducibility)
2. Pre-fork snapshot (blocks fork-time data loss)
3. Compare-and-set merge gate (blocks concurrent merge races)
4. Epoch-fence journal (blocks partial/torn writes)
5. Orchestrator state isolation (reduces contention)

### Timeline ghép lại — vì sao kẹt

| time | sự kiện |
|---|---|
| 17:21:50 | sự cố mất data thật lần 1 (`aa9ae156`) |
| 17:26 | consult harness ra đời — rất có thể là phản ứng trực tiếp với sự cố vừa xảy ra |
| 17:35:32 | sự cố mất data thật lần 2 (`9e3fb469`) — ngay trong/ngay sau lúc viết consult |
| ~19:58-20:11 | ADR0020 chốt: **block-tree** — không theo 5 mục trên, cũng không theo isolate-tree của beegog (ADR0020's doc chỉ trích beegog, không hề nhắc report harness này) |

**Lý do kẹt thật:** 5 mục trên không phải fix-trong-ngày — mục 1/3/4 đòi xây cả 1 tầng durable-state mới (CAS semantics, epoch-fence journal). Dưới áp lực 2 sự cố mất data trong 14 phút, cần chặn NGAY — `block-tree` là vài dòng, ship cùng ngày (`59551886`, 19:58). Đúng lý lẽ ADR0020 tự ghi ("build ahead of YAGNI") áp được y hệt cho cả 5 mục harness, không chỉ isolate-tree của bee — không phải hướng harness sai, mà lúc đó không có thời gian xây nó.

**Đã đi được nửa đường mà không nhận ra:** `.gitattributes merge=union` (10/8, tsk-3wq) ≈ 1 phần mục 1/3; `main-checkout-lock.mjs` (đã có, proven) ≈ 1 phần mục 4; `events-jsonl-contiguity.mjs` ≈ phần dedupe của mục 3 — xây rải rác qua nhiều task riêng, không theo đúng thứ tự ưu tiên report 28/7 đã xếp.

## bee vs harness — cả 2 đều "isolate nhánh", nhưng khác nhau ở CƠ CHẾ HỢP NHẤT, không phải ở chỗ cô lập

Cả 2 đều cho worktree 1 bản state riêng lúc bắt đầu — giống nhau ở ĐÓ. Khác nhau hoàn toàn ở lúc **hợp nhất lại**:

- **bee**: worktree có bản `.bee/` ĐẦY ĐỦ, tự do sửa/phân kỳ độc lập — lúc hợp nhất, phải **git merge thật** (dù chỉ scope hẹp vài file jsonl qua `merge=union`) 2 bản đã phân kỳ đó lại thành 1. Vẫn là mô hình **branch-and-merge** — cùng bản chất với merge code, chỉ áp cho metadata. Vì vậy vẫn cần thêm cả bộ máy phụ trợ (holds-ledger, worktree-admin lock, TTL+heartbeat) để tránh 2 bên phân kỳ đụng nhau.
- **harness**: worktree KHÔNG sửa đè lên 1 bản chung nào — mọi thay đổi từ worktree sinh ra thành 1 **file changeset MỚI, độc lập, chưa từng tồn tại**. Hợp nhất không phải "merge 2 bản phân kỳ" — mà là "thêm 1 file mới" (luôn sạch trong git, không bao giờ conflict) rồi **replay** (phát lại) vào db. Không cần holds-ledger, không cần worktree-admin lock cho layer metadata — vì khái niệm "conflict" (2 bên cùng sửa 1 chỗ) không hề phát sinh.

**1 câu:** bee vẫn dùng **merge** (đối chiếu 2 bản đã khác nhau); harness dùng **event-sourcing/replay** (không có 2 bản nào khác nhau để đối chiếu cả, chỉ có nhiều mảnh mới cộng dồn). Đây là lý do harness không cần bộ máy phối hợp sống phức tạp như bee cho đúng layer này.

## Step-by-step để đạt hướng harness cho fgOS

**Tầng A — không cần đảo ADR0020, sửa đúng bài toán mất-data/conflict, TÁI DÙNG code đã có nhiều nhất có thể:**

1. Đổi identity `events.jsonl` từ `seq` sang content-hash 16 hex — **đã submit `tsk-3ve`**, nền tảng cho mọi bước sau.
2. Tách `events.jsonl` thành nhiều file nhỏ theo session/burst (`.fgos/events/<session-id>-<ts>.jsonl`, git-tracked) — loại bỏ hẳn nhu cầu `.gitattributes merge=union` cho log này (không còn 2 bên cùng sửa 1 file).
3. Sửa `rebuildView`/`replayView` (`src/state/replay.mjs`, đã có) đọc từ CẢ THƯ MỤC thay vì 1 file — gom mọi file, sort theo `ts` trong nội dung, phát lại như cũ. Tái dùng logic replay hiện có, chỉ đổi bước liệt kê file.
4. `state.json`'s cơ chế đọc gia tăng (`tsk-49e`, đã xong) giữ nguyên — chỉ cần đổi "anchor" từ byte-offset trong 1 file sang "danh sách file đã tiêu thụ".
5. Thêm bước compaction định kỳ (≈ `publish-core-snapshot.sh`) — gộp file nhỏ cũ thành 1 baseline, KHÔNG xoá file gốc (archive, giữ đúng kỷ luật log bất biến RUL11/ADR-0019) — dùng lại trigger event-count đã chốt ở `tsk-1vc` D2, không bày lịch mới.
6. Thêm gate kiểm tra trước khi publish baseline (≈ `verify-core-snapshot.sh`) — đăng ký vào `fgos doctor`'s check registry đã có sẵn (đúng theo AGENTS.md's Install/setup/doctor gate rule).
7. Layer CODE (không phải metadata) không cần đổi gì — `merge.mjs`'s staged-verify-merge hiện tại đã tương đương (thậm chí tự động hơn) cách harness đẩy code qua PR+CI ngoài.

→ Tầng A giải xong bài toán **mất data/conflict**, nhưng CHƯA giảm áp lực "mọi write dồn về main checkout" — vì mọi session vẫn ghi trực tiếp vào main (chỉ là ghi an toàn hơn, không phải ghi ít hơn hay ghi từ nơi khác).

**Tầng B — cần đảo 1 phần ADR0020 (hẹp, không phải full isolate-tree như bee), mới thật sự giảm tải main checkout:**

8. Cho phép worktree ghi **đúng 1 file changeset MỚI của riêng nó** (không phải toàn bộ `.fgos/`, không phải sửa `state.json`/file chung nào) — merge.mjs's guard `.fgos-write-rejected` cần 1 ngoại lệ hẹp: chấp nhận diff chỉ THÊM (không sửa/xoá) 1 file mới dưới `.fgos/events/`. Đây mới là phần thật sự để event "sinh ra ngoài main checkout" — điều kiện cần để giảm root cause #1 (report sáng nay).

Tầng B là đảo quyết định đã chốt (dù hẹp hơn nhiều so với bee's full isolate-tree) — cần xác nhận của anh trước khi lên plan, theo đúng rule "User Decisions" đã áp dụng suốt buổi.

## Câu hỏi mở cho anh quyết

ADR0020 (block-tree) là quyết định đã chốt, chưa từng bị đảo, và tại thời điểm chốt (28/7) lý do YAGNI + thiếu hạ tầng an toàn là **thật, có bằng chứng cụ thể** (2 sự cố mất data trong 14 phút ngay trước đó). Nhưng bối cảnh đã đổi:

1. Hạ tầng union-merge + contiguity-dedupe ADR0020 nói "chưa cần xây" nay **đã tồn tại** (từ 10/8), chỉ đang phục vụ main checkout.
2. Report điều tra sáng nay (`investigation-260821-1050-eventlog-loss-merge-speed-root-cause-report.md`) xác nhận root cause #1 hiện tại chính là: mọi write (kể cả periodic checkpoint mỗi ≤15 phút) đều dồn về 1 main checkout dùng chung → chính là áp lực mà `isolate-tree` (nếu tái mở, dùng đúng hạ tầng đã có) sẽ giảm.
3. YAGNI-check của ADR0020 ("không có chỗ nào trong dispatch path đọc/ghi `.fgos/` từ worktree") cần verify lại — dispatch path 28/7 khác dispatch path hôm nay (đã có agy dispatch-out-of-process, fanout, v.v. — xem `tsk-43z` trong report sáng nay).

**Chưa tự ý đề xuất phương án — đây là quyết định của anh**, vì nó đảo 1 decision đã chốt (theo rule "User Decisions"). Nếu anh muốn, bước tiếp theo hợp lý là: verify lại YAGNI-check #3 bằng code thật (không giả định), rồi đặt câu hỏi tái mở ADR0020 kèm trade-off cụ thể (an toàn hạ tầng đã đủ chưa vs. thêm 1 lớp phức tạp mới) — em có thể làm phần verify này nếu anh muốn trước khi quyết.

## Nguồn đã đọc trực tiếp (không suy diễn từ memory)

- `docs/explanation/worktree-isolation-axis-decision.md`
- `docs/decisions/0020-chan-fgos-khoi-worktree-worker.md` → giờ đã retired vào `docs/specs/runner.md` (tsk-1lv-4), `docs/decisions/index.md` dòng 23
- `docs/history/live-events-seq-corruption/CONTEXT.md` (tsk-n4i)
- `docs/history/events-jsonl-merge-driver-recurring-write-loss/CONTEXT.md` (tsk-3wq)
- `docs/explanation/events-jsonl-lost-update-race-under-concurrent-session-writes.md`
- `docs/distillery/sources/repository-harness.md` (đọc toàn bộ 457 dòng — không chỉ trích đoạn cũ)
- `docs/distillery/sources/beehive.md` (đọc trực tiếp các đoạn dòng 415-599: `independent-feature-worktrees`, `store-lock-named-mutex`, `cross-worktree-holds-ledger`, `worktree-merge-staged-verify-gate`, `worktree-protected-attestation`, `unattended-agent-accepted-risk-posture`)
- `.gitattributes` (nội dung + commit `fbd856bc`)
- `git log` trực tiếp cho các hash: `59551886`, `aa9ae156`, `9e3fb469`, `4dc91711`, `fbd856bc`

## Câu hỏi chưa giải (bổ sung từ phần so sánh)

1. Nếu chọn mượn `worktree-merge-staged-verify-gate` (đòn bẩy cao nhất) — `fgos approve`/`merge.mjs` hiện có sẵn cấu trúc `git merge --no-commit` chưa? Chưa đọc code `src/runner/merge.mjs` trong lượt này, cần verify trước khi lên plan.
2. Ngưỡng staleness 30s của `store-lock-named-mutex` cần chỉnh bao nhiêu cho phù hợp full-suite verify ~6 phút của fgOS (Giới hạn beehive #2) — chưa có số đo thật, cần đo trước khi chọn số.

## Câu hỏi chưa giải (unresolved)

1. YAGNI-check của ADR0020 có còn đúng với dispatch path hôm nay không (agy, fanout, checkpoint periodic)? Chưa verify — cần đọc code thật trước khi tính tái mở.
2. Nếu tái mở isolate-tree cho `fgw/<id>`, phần content-addressed identity (như repository-harness làm) có cần xây thêm hay `events-jsonl-contiguity.mjs` hiện tại đã đủ? Chưa đánh giá.
