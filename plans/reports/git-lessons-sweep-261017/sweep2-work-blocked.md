# Báo cáo phân tích các fgOS work items tồn đọng đối với Component Git Rust duy nhất

Trạng thái: **done** (thao tác đọc-chỉ, không thay đổi workspace). Ngày: 2026-10-17. Vai trò: producer, assignment `unit-run-1792199169847-b8f27fd9/producer/1`.

## 1. Tóm tắt kết quả phân loại

Từ danh sách 117 work items chưa hoàn thành (trạng thái `blocked`, `todo`, `doing`, `awaiting-*`) trong `.fgos/runtime/tmp/work-open-git-blocked.json`, qua rà soát toàn bộ mã nguồn hiện tại (`src/`, `bin/`, `test/`, `.githooks/`) và đối chiếu với Catalogue bài học Git (`G-001`…`G-182` tại `plans/reports/research-261017-1032-git-lessons-catalogue.md`), kết quả phân loại như sau:

- **Tổng số work items đã rà soát:** 117 items.
- **Số items LIÊN QUAN (RELEVANT) tới Git component:** 39 items (chiếm 33.3%). Các items này chạm trực tiếp vào các hành vi: đột biến kho (repo mutation), cô lập và dọn dẹp worktree, quản lý branch/ref, các quy trình merge/land/sync/approve/catchup, khóa điều phối và race conditions, phục hồi crash, pre-commit hook và checkpoint commit cho `.fgos`.
- **Số items KHÔNG LIÊN QUAN (NOT RELEVANT):** 78 items (chiếm 66.7%). Đây là các dương tính giả khớp từ khóa git (nội dung thảo luận kỹ năng, cấu hình UI/terminal Herdr, tài liệu hướng dẫn, tối ưu hóa JSON, quy tắc FSM tổng quát, hậu kiểm lịch sử).
- **Số bài học MỚI (NEW) bổ sung cho Catalogue:** 5 bài học (được xếp hạng theo P1 và P2; không có P0 mới vì các vấn đề mất dữ liệu cốt lõi đã được bao phủ bởi G-001..G-182).

---

## 2. Bảng các work items LIÊN QUAN (RELEVANT)

Dưới đây là 39 items liên quan trực tiếp tới thành phần Git, tình trạng tồn tại hiện nay kèm bằng chứng mã nguồn (`file:line`, commit, test), bài học tương ứng, ánh xạ Catalogue (`G-xxx` hoặc `NEW`) và định đoạt (`absorbed by component`, `still needed separately`, hoặc `obsolete`).

| Item ID | Status | Title ngắn gọn | Còn tồn tại? (Bằng chứng mã nguồn) | Bài học / Yêu cầu cho Rust Git Component | G-id / NEW | Định đoạt |
|---|---|---|---|---|---|---|
| **tsk-1q1** | blocked | Cleanup stage lệch decision: TTL harness D8 và huỷ sớm worktree/branch | **partly** (`src/state/cleanup-harness.mjs:18-35`; `src/runner/loop.mjs:598`; `src/runner/merge.mjs:1633`) | Landing và cleanup là hai pha tách biệt: approve không dọn; cleanup chỉ chạy sau khi TTL trôi qua và harness xác nhận; worktree và branch phải được bảo lưu trong cửa sổ TTL sau merge để phục vụ cứu hộ/tái dùng khi có sự cố hậu kiểm. | G-175 | absorbed by component |
| **tsk-1l9** | blocked | Land fgw/tsk-64h và fgw/tsk-2t5 vào main: delivered nhưng chưa merge | **no** (`git rev-parse --verify fgw/tsk-64h` không còn ref; guard chặn tại `src/verbs/state/move.mjs:24-28`) | Trạng thái delivered bắt buộc phải có bằng chứng ref đã merge vào trunk; cấm chuyển trạng thái delivered thuần bằng tay nếu nhánh git tương ứng chưa được tích hợp vào trunk. | G-080, G-085 | obsolete |
| **tsk-1wr** | blocked | Hai merge cùng session id, khác tiến trình, vào cùng target ref | **no** (đã sửa tại `src/runner/merge.mjs:788` commit `d74dfea58`, tsk-18k/tsk-70l; dùng `process.pid`) | Khóa vị trí merge (merge target slot) phải định danh bằng process/handle độc quyền của hệ điều hành, không được dùng session ID kế thừa qua biến môi trường để tránh hiện tượng hai tiến trình con cùng phiên tự nhận diện nhau (self-recognition) và cùng ghi vào một đích git. | G-147, G-148, G-157 | absorbed by component |
| **tsk-5dk** | blocked | Ghi bằng chứng merge (mergedSha/mergedInto) vào sự kiện delivered | **no** (đã cài đặt tại `src/verbs/merge/approve.mjs:886-887`; guard tại `src/verbs/state/move.mjs:24`) | Mọi thao tác land/approve thành công phải ghi nhận SHA của commit merge và ref đích vào payload của sự kiện chuyển trạng thái delivered, bảo đảm tính xác minh mật mã của trạng thái phân phối thay vì chỉ tin vào nhãn trạng thái. | NEW (G-NEW-1) | absorbed by component |
| **tsk-56u** | blocked | Lệnh git (git add -A) trong linked worktree stage xoá toàn bộ .fgos | **partly** (`.githooks/pre-commit:183-221`; `src/runner/worktree.mjs:645-683`) | Linked worktree không được mang `.fgos/` trong working tree lẫn git index; component phải cô lập index của worktree hoặc loại trừ đường dẫn metadata điều khiển khỏi staging để ngăn các lệnh git thông thường vô tình huỷ hoại event log. | G-029, G-054, G-166 | absorbed by component |
| **tsk-5k4** | blocked | withLockRetry không thực sự bọc merge-target-slot lock trong sync-root/approve | **no** (đã sửa tại `src/verbs/merge/approve.mjs:460-465`; `src/verbs/merge/sync-root.mjs:207-212`) | Cơ chế thử lại khóa (lock retry) phải bọc lấy toàn bộ hành vi xin cấp phát tài nguyên khóa (acquire target slot lock), không được chỉ bọc phần thân logic bên trong sau khi đã lấy khóa. | G-147, G-150 | absorbed by component |
| **tsk-64o** | blocked | Điều tra sự kiện delivered của tsk-5dk thiếu mergedSha trên fast-path | **no** (`src/verbs/merge/approve.mjs:886-887`; log tại `src/cli/approve-fault-log.mjs:29`) | Bất kể merge đi qua đường thực thi đầy đủ hay đường tắt bỏ qua kiểm tra (verify skipped fast-path), commit SHA đích phải luôn được phân giải và đính kèm vào biên nhận hoàn thành. | G-085, G-087 | absorbed by component |
| **tsk-2u5** | blocked | Stale-worktree-index khi ref bị force-move từ process khác | **partly** (`.githooks/pre-commit:344-406`; `src/runner/worktree.mjs:849-874`) | Tránh cập nhật con trỏ branch từ bên ngoài khi có worktree đang checkout branch đó; nếu ref bị dịch chuyển, mọi thao tác commit/stage từ worktree phải bị từ chối trừ khi index và working tree được đồng bộ lại với reflog mới nhất của HEAD. | G-025, G-040, G-171 | absorbed by component |
| **tsk-2q8** | blocked | checkMergeStillResolves thiếu fallback khi parent branch fgw/<rootId> bị rebase | **yes** (`src/state/cleanup-harness.mjs:235-265`) | Kiểm tra giải quyết merge trong dọn dẹp phân cấp (hierarchical merge resolution) phải xử lý trường hợp nhánh cha bị rebase (thay đổi SHA nhưng giữ nguyên nội dung) chứ không chỉ trường hợp nhánh cha bị xoá (prune); cần cơ chế fallback kiểm tra tương đương nội dung (patch-id / tree diff) khi kiểm tra tổ tiên bằng SHA thất bại. | NEW (G-NEW-2) | absorbed by component |
| **tsk-25r** | blocked | Audit và sửa 9 lỗi ẩn trong vòng đời worktree claim/merge/cleanup | **no** (commit merge `4e32e953d` vào main; toàn bộ 9 task con đã hoàn thành) | Toàn bộ vòng đời tạo worktree, cấp phát (provisioning), thu hồi (reclaim), khóa vị trí merge, và dọn dẹp phải có ranh giới tuần tự hóa chặt chẽ và xử lý dọn dẹp an toàn khi tiến trình crash. | G-032, G-038, G-147, G-175 | obsolete |
| **tsk-sdr** | blocked | Ghi event khi --acknowledge-iron-law thực sự được dùng trong approve/sync-root | **no** (`src/verbs/merge/iron-law-level.mjs:43-55`; `src/verbs/merge/approve.mjs:323`; `src/verbs/merge/sync-root.mjs:85`) | Mọi hành vi bypass hoặc chấp nhận rủi ro cổng an toàn (Iron Law gate) trong quá trình merge/land phải được ghi nhận thành sự kiện kiểm toán bền vững, không được chỉ log mức warning thoáng qua. | NEW (G-NEW-4) | absorbed by component |
| **tsk-64hk** | blocked | dispatch.mjs execute thiếu per-item concurrency guard cho cùng worktree | **no** (`src/runner/main-checkout-lock.mjs:79,166`; test tại `test/runner/dispatch.test.mjs:3551`) | Thực thi tác vụ (dispatch) trên một worktree phải có khóa đồng thời theo từng item/worktree (`dispatchLockFile`), ngăn chặn hai worker độc lập cùng chạy đè lên nhau trên cùng một thư mục làm việc. | G-147, G-155, G-159 | absorbed by component |
| **tsk-1uf** | blocked | fgos return và fgos approve đều chạy lại toàn bộ lệnh verify tốn nhiều phút | **partly** (`src/runner/merge.mjs:1023-1048`; `docs/skills` background guidance) | Bỏ qua verify thừa khi cây sau merge chứng minh được là đồng nhất với cây đã pass ở return; component cần bộ nhớ đệm xác minh dựa trên SHA cây git (tree hash) để tránh re-verify tốn kém. | G-087 | absorbed by component |
| **tsk-2lq** | blocked | mergedTreeAlreadyVerified skip-fast-path bỏ sót trường hợp main tiến trên path không giao cắt | **no** (đã sửa tại `src/runner/merge.mjs:1014-1044`) | Thuật toán kiểm tra cây đã xác minh (verified-skip) phải nhận biết tính chất 3-way merge độc lập: khi trunk tiến trên các đường dẫn hoàn toàn không giao cắt với footprint của nhánh, cây sau merge vẫn giữ nguyên vẹn nội dung của nhánh đã verify. | G-087 | absorbed by component |
| **tsk-6ci** | blocked | main-checkout.lock wait thiếu thông tin hàng đợi và tiến độ | **partly** (`src/runner/lock-wait.mjs:93-117`) | Quản lý tranh chấp khóa git trong môi trường đa tác vụ cần cơ chế hàng đợi có cấu trúc (FIFO queue hoặc reservation slot) thay vì vòng lặp polling backoff mù, giúp người dùng và agent biết vị trí chờ và thời gian dự kiến. | NEW (G-NEW-5) | absorbed by component |
| **tsk-43z** | blocked | Out-of-process dispatch.mjs execute chạy nhầm cwd ở main checkout thay vì worktree | **partly** (`src/runner/dispatch/cli.mjs:462-468`; `test/runner/attestation-guard.test.mjs:120`) | Khi khởi tạo môi trường thực thi cho worker, component phải bắt buộc `cwd` là thư mục gốc của worktree cô lập; từ chối thực thi bất kỳ lệnh nào của worker trên main checkout. | G-002, G-019, G-050 | absorbed by component |
| **tsk-5k1** | blocked | claimWork opportunistic checks gây commit/write bất ngờ trên main checkout | **no** (`src/state/events-jsonl-truncation-guard.mjs:208,364`) | Các kiểm tra cơ hội (opportunistic maintenance/checkpoint) không được tự ý thực hiện commit git hoặc làm bẩn working tree trong luồng nghiệp vụ nhạy cảm hoặc trong môi trường kiểm thử. | G-118, G-120 | absorbed by component |
| **tsk-6av** | blocked | Gom cơ chế merge self-recovery vào approve; biến merge-next/merge-loop thành thin callers | **no** (commit merge `a39f0296d`, `src/verbs/merge/approve.mjs`) | Logic tự phục hồi khi merge (catch-up, giải quyết conflict, xử lý timeout/drift) phải nằm tập trung ở tầng use-case cốt lõi của thao tác land/approve, các vòng lặp ngoài chỉ là bộ điều phối mỏng. | G-082, G-084, G-085, G-175 | obsolete |
| **tsk-oet** | blocked | npm test lỗi do runOpportunisticMainCheckoutChecks tự động commit trên main checkout | **no** (`src/state/events-jsonl-truncation-guard.mjs:208,364`) | Checkpoint tự động của git state không được can thiệp vào các assertion kiểm tra độ sạch của checkout chính (`isWorkingTreeClean`). | G-118, G-120 | absorbed by component |
| **tsk-4te** | blocked | Trạng thái doing của claimed item bị biến mất khỏi events.jsonl do ghi đè/truncation | **partly** (`src/state/events.mjs:475-541`; `src/runner/claim-port.mjs`) | Tách biệt hoàn toàn kho lưu trữ trạng thái điều khiển khỏi các nhánh làm việc của worker (ADR0020), và đảm bảo các thao tác checkout/reset/clean của git không bao giờ có thể ghi đè hoặc cắt cụt (truncate) nhật ký sự kiện của hệ thống. | G-120, G-121, G-170 | absorbed by component |
| **tsk-3tv** | blocked | sync-root nuốt lỗi git thật dưới outcome merge-failed-unclassified | **no** (đã sửa tại `src/verbs/merge/sync-root.mjs:158-179`) | Mọi lỗi git thất bại không phân loại được trong sync/merge phải giữ nguyên stderr, stdout và mã thoát (exit code), không được nuốt lỗi thành thông báo chung chung. | G-009, G-078, G-082 | absorbed by component |
| **tsk-6uc** | blocked | main-checkout.lock wait hiển thị holder identity không phân biệt được cùng hay khác session | **no** (đã sửa tại `src/runner/lock-wait.mjs:94-109`) | Thông báo chờ khóa phải phân biệt rõ liệu người giữ khóa hiện tại là một tác vụ chạy nền của chính phiên làm việc này hay là một tiến trình/phiên độc lập khác, giúp agent nhận biết nguy cơ tự deadlock. | G-144, G-157 | absorbed by component |
| **tsk-3bh** | blocked | Dispatching Implement Step 2 out-of-process làm mất uncommitted changes trong worktree | **no** (`src/runner/worktree.mjs:408-423`) | Trước khi giao việc cho worker trên một worktree có sẵn, phải kiểm tra trạng thái bẩn (`dirtyPaths`), từ chối dispatch nếu có sửa đổi chưa commit để tránh worker ghi đè hoặc làm mất công việc dang dở. | G-021, G-053 | absorbed by component |
| **tsk-2xg** | blocked | fgos catchup/approve thiếu đường xử lý khi root branch có conflict nội dung thật | **yes** (`src/runner/merge.mjs:1728-1738`) | Cần thống nhất cơ chế giải quyết conflict giữa sync unit và catchup: khi có xung đột nội dung thật, cho phép giữ trạng thái merge mở (có đánh dấu sở hữu) để worker hoặc phiên làm việc giải quyết conflict, thay vì chỉ có một lối thoát duy nhất là abort toàn bộ. | NEW (G-NEW-3) | absorbed by component |
| **tsk-26r** | blocked | Worktree tạm phục vụ fgos return verify không strip thư mục .fgos | **no** (đã sửa tại `bin/fgos.mjs:3358-3374`) | Mọi worktree tạm thời (ephemeral worktree) được tạo ra từ branch để verify phải lập tức xoá bỏ snapshot `.fgos/` đã checkout để tuân thủ ADR0020 và không làm sai lệch các phép kiểm tra độ sạch. | G-029 | absorbed by component |
| **tsk-tr9** | blocked | fgos catchup thành công append event vào shard trên main checkout, tái mở phân kỳ .fgos trước approve | **no** (`src/runner/merge.mjs:1718-1726`, hàm `resolveFgosOnlyConflict`) | Khi merge/catchup, các xung đột thuần túy về file nhật ký sự kiện (`.fgos/*.jsonl`) có thuộc tính `merge=union` phải được tự động giải quyết về phía target (HEAD của main), không coi đó là conflict nội dung làm đình trệ quy trình approve. | G-076, G-089, G-090 | absorbed by component |
| **tsk-1wk** | blocked | .gitattributes thiếu quy tắc merge=union cho các file sharded .fgos/events/*.jsonl | **no** (đã sửa tại `.gitattributes:17`) | Tất cả các file nhật ký sự kiện chỉ-thêm (kể cả sharded per-writer) phải được cấu hình thuộc tính `merge=union` trong gitattributes để git tự động ghép dòng thay vì báo conflict. | G-090, G-121 | absorbed by component |
| **tsk-4gi** | blocked | mergeRunnerItemLocked từ chối fgos-write-rejected kể cả khi merge=union auto-resolve sạch sẽ | **no** (`src/runner/merge.mjs:1372-1434`) | Khâu kiểm tra vi phạm ghi vào `.fgos` (`fgos-write-rejected`) sau merge phải phân biệt giữa việc worker chủ động sửa file `.fgos` và việc git tự động dàn xếp nội dung theo `merge=union`; hoàn nguyên file union về bản HEAD của target trước khi áp dụng guard. | G-088, G-089 | absorbed by component |
| **tsk-1t2** | blocked | fgos edit append trực tiếp vào events.jsonl baseline thay vì shard per-writer | **no** (`test/cli/fgos-edit.test.mjs:97-128`) | Mọi cổng ghi trạng thái của hệ thống phải ghi vào shard riêng biệt của từng writer, không bao giờ ghi đè hoặc nối đuôi vào file baseline tĩnh để tránh xung đột git merge. | G-090, G-121 | absorbed by component |
| **tsk-2ep** | blocked | Trùng lặp với tsk-tr9 (catchup tạo event mới làm tái mở phân kỳ .fgos) | **no** (`src/runner/merge.mjs:1718-1726`) | Tương tự tsk-tr9: tự động giải quyết phân kỳ `.fgos` union về phía target. | G-076, G-089, G-090 | obsolete |
| **tsk-4s6** | blocked | fgos-write-rejected restore chỉ tin HEAD của main cho merge=union paths, chặn worker branch cũ | **no** (`src/runner/merge.mjs:1428-1430`) | Khi khôi phục các đường dẫn `.fgos/` trên worker branch cũ, nếu đường dẫn đó được chứng minh là không hề thay đổi trên branch kể từ điểm phân nhánh (fork/take point), an toàn khôi phục nó về HEAD của target mà không đánh lỗi `fgos-write-rejected`. | G-089 | absorbed by component |
| **tsk-2e7** | blocked | Khóa global main-checkout trong dispatch execute serialize toàn bộ dispatch | **no** (`src/runner/dispatch/cli.mjs:728`; `docs/explanation/main-checkout-lock-scope-audit.md:15`) | Tách biệt phạm vi khóa: khóa checkout chính (`main-checkout.lock`) chỉ giữ trong các thao tác đột biến trunk hoặc checkpoint trạng thái chung; các tác vụ chạy trong worktree cô lập chỉ giữ khóa cục bộ của chính worktree đó. | G-147, G-155, G-159 | absorbed by component |
| **tsk-198** | blocked | isUnchangedSinceBranchHeadAtTake dùng so sánh blob gây ném ngoại lệ khi path chưa từng tồn tại | **no** (`src/runner/merge.mjs:1184-1192`) | Khi kiểm tra một file có bị thay đổi trên branch hay không, sử dụng `git diff --quiet` có giới hạn pathspec thay vì đọc blob trực tiếp bằng `rev-parse`, tránh lỗi khi file không tồn tại ở một trong hai đầu so sánh. | G-089 | absorbed by component |
| **tsk-52p** | blocked | Kiểm tra toàn vẹn sau merge (branchContentMismatch) báo dương tính giả trên đường dẫn .fgos | **no** (`src/runner/merge.mjs:1087-1099`) | Thuật toán kiểm tra toàn vẹn nội dung sau merge (`branchContentMismatch`) để phát hiện nuốt code kiểu `-s ours` phải loại trừ toàn bộ đường dẫn `.fgos/` vì worker branch cố tình không mang trạng thái của control plane. | G-086 | absorbed by component |
| **tsk-2jg** | blocked | assertPlanEvidence trong approve lỗi đối với item heavy-risk không có nhánh riêng | **no** (`src/state/store.mjs:601-645`, commit `8e952d76`, test tại `test/state/store.test.mjs:1058`) | Cổng xác thực bằng chứng kế hoạch (`assertPlanEvidence`) trước khi land phải hỗ trợ trường hợp item được triển khai gộp trong nhánh của parent hoặc trực tiếp trên trunk mà không có branch lá riêng. | G-044, G-049, G-080 | obsolete |
| **tsk-1ck** | blocked | Guard an toàn main-checkout-reset chỉ kiểm tra bẩn, không kiểm tra commit đã commit bị vứt bỏ | **no** (`src/runner/main-checkout-reset-guard.mjs:18-47`; `bin/fgos.mjs:4393`) | Thao tác `git reset --hard` trên checkout chính phải được bảo vệ bởi hai tầng guard: kiểm tra working tree bẩn VÀ kiểm tra xem commit đích có làm mất các commit đã ghi trước đó trên HEAD hay không. | G-177 | absorbed by component |
| **tsk-22bm** | blocked | dispatch.mjs execute báo verifiedSha không khớp với commit thật của worker | **no** (`src/runner/dispatch/result-ladder.mjs:69`; `docs/explanation/dispatch-execute-repo-root-cwd-separation.md:109`) | Khi trích xuất SHA commit đã kiểm chứng (`verifiedSha`) sau khi worker hoàn thành, phải đọc HEAD trực tiếp từ worktree của worker bằng ngữ cảnh tin cậy, không được nhầm lẫn với HEAD của repo root. | G-024, G-087 | absorbed by component |
| **tsk-myq** | blocked | default fileKey trong events-jsonl-truncation-guard sai đối với shard file dưới .fgos/events/ | **no** (`src/state/events-jsonl-truncation-guard.mjs:214-226`) | Cơ chế sidecar đánh dấu vị trí đọc/ghi (guard marks) cho các file nhật ký sự kiện sharded phải tính toán khóa định danh bao gồm cả thư mục con tương đối (`events/<name>.jsonl`) để tránh ghi đè dữ liệu đánh dấu giữa các file có cùng tên gốc. | G-120, G-121 | absorbed by component |
| **tsk-4p6** | blocked | Các nhánh lỗi fgos approve làm rò lỗi thô transitionWork CAS thay vì trả kết quả có cấu trúc | **no** (`src/verbs/merge/approve.mjs:112-129`) | Khi thao tác merge/land gặp lỗi và chuyển trạng thái công việc về `blocked`, việc ghi trạng thái phải xử lý an toàn lỗi xung đột đồng thời (CAS conflict) và trả về kết quả có cấu trúc thay vì để lọt ngoại lệ thô làm crash tiến trình. | G-009, G-082, G-117 | absorbed by component |

---

## 3. Danh sách các work items KHÔNG LIÊN QUAN (NOT RELEVANT)

Dưới đây là 78 work items được xác định là dương tính giả hoặc không liên quan trực tiếp đến thành phần Git (kèm lý do phân loại một từ):

1. **tsk-2gw**: gitignore
2. **tsk-42i**: conversation
3. **tsk-67t**: audit
4. **tsk-4dy**: audit
5. **tsk-5z9**: audit
6. **tsk-1oz**: config
7. **tsk-3q8**: documentation
8. **tsk-4ry**: herdr
9. **tsk-5x4**: documentation
10. **tsk-f3p**: fsm
11. **tsk-7l9**: gateway
12. **tsk-2y4**: config-test
13. **tsk-6d2**: dashboard
14. **tsk-5er**: rename
15. **tsk-3xog**: heading-parsing
16. **tsk-bc7**: audit
17. **tsk-4sx**: planning-docsRef
18. **tsk-3vk**: changelog
19. **tsk-pdg**: dispatch-precedence
20. **tsk-6at**: review
21. **tsk-2uf-1**: dispatch-refactor
22. **tsk-2uf-2**: worker-contract
23. **tsk-1xm**: executor-permissions
24. **tsk-2yu**: citation-cleanup
25. **tsk-47r**: runtime-capacity
26. **tsk-7u7**: doctrine
27. **tsk-3wl5**: survey
28. **tsk-34o**: edit-provenance
29. **tsk-3tkc**: executor-config
30. **tsk-5zi**: build-skills
31. **tsk-1jt**: executor-test
32. **tsk-3uw4**: doc-test
33. **smoke-tsk-56w-1**: smoke-test
34. **smoke-tsk-56w-9**: smoke-test
35. **tsk-2ky**: worker-verify
36. **tsk-37l**: shell-helper
37. **tsk-3ps**: cli-flag
38. **tsk-3ti**: refactor-cleanup
39. **tsk-37d**: perf-serialization
40. **tsk-577p**: shell-integration
41. **tsk-4oq**: dispatch-tokens
42. **tsk-2y1**: test-flake
43. **tsk-5n6**: test-flake
44. **tsk-jyn**: skill-docs
45. **tsk-4zr**: list-payload
46. **tsk-2ck**: schema-validation
47. **tsk-2yog**: routing-gate
48. **tsk-3f9k**: tool-call
49. **tsk-ut6**: ux-prompt
50. **tsk-3hks**: cli-edit
51. **tsk-ri8**: documentation
52. **tsk-13g**: planning-verify
53. **tsk-3df**: test-gap
54. **tsk-22b**: documentation
55. **tsk-12o**: test-gap
56. **tsk-67o**: footprint-noise
57. **tsk-3qo**: skill-loop
58. **tsk-vim**: test-regex
59. **tsk-3i6**: dead-citation
60. **tsk-3gr**: executor-test
61. **tsk-4dc**: skill-docs
62. **tsk-os6**: skill-docs
63. **tsk-31v**: gateway-cli
64. **tsk-2n2**: gateway-lock
65. **tsk-1sl**: doc-status
66. **tsk-4ah**: doc-disambiguation
67. **tsk-2ii**: config-edit
68. **tsk-2uh**: claim-cas
69. **tsk-2tr**: dispatch-normalization
70. **tsk-4zi**: executor-config
71. **tsk-4kn**: spec-alignment
72. **tsk-2rr**: terminal-adapter
73. **tsk-5cr**: terminal-timing
74. **tsk-r81**: changelog
75. **tsk-uio**: claim-orphan
76. **tsk-4lh**: skill-docs
77. **tsk-5mh**: knowledge-migration
78. **tsk-43q**: docs-index

---

## 4. Các bài học MỚI (NEW Lessons) xếp hạng P0 / P1 / P2

Qua khảo sát 39 items liên quan, có 5 bài học/yêu cầu kỹ thuật chưa được ghi nhận tường minh trong Catalogue G-001..G-182. Dưới đây là các bài học được xếp hạng theo mức độ nghiêm trọng:

### Mức P1 (Sai lệch logic kiểm tra, kẹt quy trình, hoặc thiếu bằng chứng xác minh)

#### 1. G-NEW-1 (P1, kind: verify/land) — Ràng buộc bằng chứng mật mã (Cryptographic Merge Provenance) khi chuyển trạng thái delivered
- **Nguồn:** `tsk-5dk` (và sự cố `tsk-64o`, `tsk-1l9`).
- **Bài học (Thiếu thì hỏng gì):** Nếu trạng thái `delivered` chỉ là sự thay đổi chuỗi trạng thái trong store (`work.move`) mà không bắt buộc đính kèm bằng chứng merge từ git, hệ thống sẽ rơi vào tình trạng các item được báo là "đã giao" nhưng code thực tế chưa bao giờ nằm trên trunk main (đã ghi nhận 352 lần chuyển trạng thái delivered lịch sử chỉ mang vỏn vẹn trường `role: human`, dẫn tới các branch mồ côi bị bỏ quên).
- **Hành vi Rust Git Component phải có:**
  Thao tác land/approve thành công phải trả về một giao dịch nguyên tử gồm SHA của merge commit (`mergedSha`) và tên ref đích (`mergedInto`). Component phải từ chối hoàn tất việc land nếu không lấy được SHA hợp lệ từ ref đích, và store chỉ được phép chấp nhận chuyển trạng thái sang `delivered` khi payload mang đầy đủ chứng chỉ mã hóa này.
- **Bằng chứng mã nguồn:** `src/verbs/merge/approve.mjs:886-887`; `src/verbs/state/move.mjs:24-28`.

#### 2. G-NEW-2 (P1, kind: cleanup/verify) — Xác minh tổ tiên merge trong cấu trúc phân cấp khi nhánh cha bị rebase
- **Nguồn:** `tsk-2q8`.
- **Bài học (Thiếu thì hỏng gì):** Quy tắc G-175 hiện tại chỉ xử lý trường hợp nhánh cha trung gian bị xóa (`pruned`). Khi một nhánh cha phân rã (`fgw/<rootId>`) vẫn còn tồn tại nhưng đã được rebase lên trunk (thay đổi toàn bộ commit SHA), kiểm tra `merge-base --is-ancestor <leaf_sha> <parent_branch>` thất bại hoàn toàn. Kết quả là các item lá đã merge thực tế vào nhánh cha và đã lên main vẫn bị đánh dấu lỗi hệ thống `system-error` và kẹt vĩnh viễn ở cleanup.
- **Hành vi Rust Git Component phải có:**
  Trong thủ tục `checkMergeStillResolves`, khi kiểm tra tổ tiên bằng SHA thất bại trên một nhánh cha còn tồn tại, component phải có cơ chế fallback kiểm tra tương đương nội dung (patch-id hoặc 3-way tree diff rỗng) để chứng minh các thay đổi của item lá đã thực sự có mặt trên nhánh cha và trên trunk, giải phóng item sang `done` thay vì kẹt ở `blocked`.
- **Bằng chứng mã nguồn:** `src/state/cleanup-harness.mjs:235-265`.

#### 3. G-NEW-3 (P1, kind: sync/catchup) — Cơ chế cầu nối giải quyết xung đột có kiểm soát cho catch-up merge
- **Nguồn:** `tsk-2xg`.
- **Bài học (Thiếu thì hỏng gì):** Thiết kế `performCatchUp` hiện tại áp dụng chính sách tất-cả-hoặc-không (all-or-nothing): hễ gặp bất kỳ xung đột văn bản nào ngoài `.fgos/`, lệnh lập tức abort toàn bộ và trả về `conflict`. Người vận hành buộc phải chạy `git merge main` thủ công bên ngoài, dẫn tới việc vô tình kéo theo các file `.fgos/*` của main vào branch worker và kích hoạt lỗi `fgos-write-rejected`.
- **Hành vi Rust Git Component phải có:**
  Component cần thống nhất cơ chế giải quyết conflict giữa `unit-sync` (vốn giữ conflict mở cho agent xử lý theo G-071) và `catchup`. Khi catchup gặp conflict thật, component cung cấp tùy chọn mở một worktree biệt lập có đánh dấu trạng thái `conflicted`, cho phép worker hoặc session giải quyết các file conflict trong write scope được kiểm soát mà không làm ô nhiễm thư mục `.fgos/`.
- **Bằng chứng mã nguồn:** `src/runner/merge.mjs:1728-1738`; `.gitattributes:1-17`.

---

### Mức P2 (Khả năng quan sát, công thái học vận hành, kiểm toán)

#### 4. G-NEW-4 (P2, kind: hook/audit) — Ghi nhận sự kiện kiểm toán bền vững khi bypass cổng Iron Law
- **Nguồn:** `tsk-sdr`.
- **Bài học (Thiếu thì hỏng gì):** Khi người dùng hoặc session sử dụng cờ `--acknowledge-iron-law` để vượt qua kiểm tra failing-test-first lúc approve hoặc sync-root, hệ thống trước đây chỉ ghi log cảnh báo thoáng qua (warning). Khâu kiểm toán sau này không thể phân biệt giữa một thay đổi hoàn toàn không chạm vào vùng nhạy cảm của Iron Law với một thay đổi đã vi phạm nhưng được bypass có chủ đích.
- **Hành vi Rust Git Component phải có:**
  Khi một cổng an toàn bị bỏ qua thông qua cờ xác nhận tường minh, component phải phát sinh một sự kiện kiểm toán có cấu trúc ghi nhận vào event log (loại sự kiện quyết định hoặc audit tag), lưu rõ danh sách cờ và module vi phạm đã được người dùng chấp thuận.
- **Bằng chứng mã nguồn:** `src/verbs/merge/iron-law-level.mjs:43-55`; `src/verbs/merge/approve.mjs:323`; `src/verbs/merge/sync-root.mjs:85`.

#### 5. G-NEW-5 (P2, kind: lock/observability) — Khóa hàng đợi có thứ tự và khả năng quan sát tiến độ chờ (Queued Lock Visibility)
- **Nguồn:** `tsk-6ci` (và `tsk-6uc`).
- **Bài học (Thiếu thì hỏng gì):** Hiện tại việc chờ khóa `main-checkout.lock` dựa vào vòng lặp polling backoff mù. Người dùng và các agent con chỉ nhìn thấy các dòng log `still waiting on main-checkout lock (holder pid X, Ns elapsed)` mà không có thông tin về vị trí hàng đợi (queue position), ước lượng thời gian chờ (ETA), hay tiến trình nào đang xếp hàng tiếp theo, dễ dẫn đến việc timeout oan hoặc hủy tiến trình nhầm.
- **Hành vi Rust Git Component phải có:**
  Component Git Rust nên thay thế polling phân tán trên file lock bằng cơ chế đăng ký hàng đợi có thứ tự (ticket lock hoặc FIFO queue trong runtime daemon/host), cung cấp API phản ánh vị trí hàng đợi và danh tính chi tiết của người giữ khóa để các agent có quyết định chờ đợi thông minh hơn.
- **Bằng chứng mã nguồn:** `src/runner/lock-wait.mjs:93-117`.
