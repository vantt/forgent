# Event store của Work: upstream repository-harness, dòng thời gian trôi dạt của fgOS, và chẩn đoán cho council L3

Ngày: 2026-10-17. Vai trò: producer, chỉ đọc (không đổi workspace). Mọi `sha` là commit trong repo này; `docs/...` và `plans/...` là đường dẫn trong repo.

## Kết luận trước

1. **fgOS chưa bao giờ chọn bỏ mô hình upstream; nó trôi dạt qua hơn hai chục bản vá cục bộ (bảng ở Phần 2) trong khoảng 13 tuần từ 07-14 đến 10-17, mỗi bản đều hợp lý tại thời điểm đó.** Điểm rẽ gốc là khác biệt về vị trí ghi: upstream cho mỗi run sinh ra một file changeset mới, bất biến, còn fgOS giữ một log dùng chung, mở, ghi liên tục ngay trong cây làm việc của main checkout.
2. **Tiền đề đầu tiên của L3 đã gãy từ 2026-07-17, ba ngày sau khi luật được viết.** L3 nêu tên ngưỡng xem lại là "multi-writer trở thành tải chính" và quy định "chạm ngưỡng thì mở lại luật, không vá tại chỗ" (`docs/specs/platform-foundations.md` ADR 0001, mục Quyết định; `docs/platform-foundations.md` L3, đoạn "Ngưỡng xem lại"). Nhưng `events.lock` (`3adfb3fec`, 2026-07-17) ra đời vì nhiều session ghi đồng thời, và `docs/history/events-lock-concurrency-race/CONTEXT.md` D2 ghi nhận người dùng có 8 cửa sổ đang chạy, 15 đến 20 cửa sổ là bình thường. Không có quyết định nào chính thức mở lại L3; thay vào đó là các bản vá tại chỗ.
3. **Phần lớn sự cố mất log và chi phí cơ chế (khoảng 43 trên 182 bài học git theo `plans/reports/investigation-261017-1027-fgos-event-store-git-coupling.md`) đến từ việc log sống trong cây làm việc của git, không đến từ luật L3 "truth ở JSONL".** L3 không đòi JSONL nằm trong cây git; chỉ đòi JSONL là truth và db là view.
4. **fgOS đã mượn đúng hai thứ từ upstream (content-hash identity và log nhiều file) nhưng bỏ phần quyết định nhất: nơi ghi và tính bất biến của file.** TA-D0 của tsk-3ve nói thẳng: "mượn cấu trúc dữ liệu harness, KHÔNG mượn vị trí ghi" (`docs/history/eventlog-tier-a-multifile-content-hash/CONTEXT.md`).
5. **Giới hạn của bằng chứng:** repo upstream không có trong máy (`upstreams/` không tồn tại), nên Phần 1 dựa vào bản distillery (`docs/distillery/sources/repository-harness.md`, phân tích đến commit `0a79bbe`, 2026-08-07) cộng báo cáo consult ngày 2026-07-28. Chính báo cáo consult đó ghi "actual source implementation unavailable locally". Mọi chi tiết cơ chế upstream dưới đây là chi tiết do distillery ghi lại, chưa đối chiếu với mã nguồn upstream.

---

## Phần 1. Thiết kế upstream

### 1.1 repository-harness lưu truth như thế nào

Nguồn: `docs/distillery/sources/repository-harness.md`, trừ khi ghi khác.

| Tính chất | Mô tả upstream | Dòng |
|---|---|---|
| Tách policy và durable layer | Tài liệu markdown nói cách làm việc; SQLite `harness.db` qua Rust CLI lưu những gì đã xảy ra. Db gitignored, dựng lại từ changesets. | 25-29 |
| Changeset JSONL theo run | Mỗi run ghi một changeset JSONL (header cộng các operation như `story.add`, `trace.add`, `decision.add`). Chỉ ghi khi biến môi trường `HARNESS_RUN_ID` có mặt. | 218-221 |
| Ghi trong cùng transaction | Dòng JSONL được append trong cùng SQLite transaction với mutation, rollback chung; payload là full-record, không phải column diff. | 221 (deep-dive 11/07 §6) |
| Identity theo nội dung | Changeset mang `content_sha256`; ID trùng mà content khác thì CONFLICT. Có `db changeset status` (kiểm tra không ghi) và `db snapshot` (SQLite online backup nguyên tử, báo logical hash và file hash). | 219 |
| Replay idempotent | `db rebuild` dựng lại toàn bộ db từ changesets; replay hai lần không double-apply nhờ identity. | 219 |
| Thư mục changesets được commit, db bị ignore | `.harness/*` ignored nhưng `.harness/changesets/` được commit nhờ negation pattern; gitignore có comment giải thích từng nhóm. | 378-381 |
| Snapshot cộng changesets | Baseline db được tách thành snapshot read-only được commit (`.harness/core-state/harness.db`) cộng changesets JSONL commit riêng theo thời gian; mỗi worktree tự chạy `materialize-core-state.sh` để ghi ra `harness.db` writable-ignored từ hai nguồn commit đó. `publish-core-snapshot.sh` sinh manifest; `verify-core-snapshot.sh` kiểm checksum, không WAL sidecar, không lộ secret trước khi publish. | 370-374 |
| Mỗi story một worktree cô lập với bản sao db | Story thành run cô lập: git worktree riêng cộng bản copy `harness.db` cộng `RUN_CONTRACT.json`; "root db không bao giờ là source of truth của run"; lane tiny được phép `--here`. Phần này đã chuyển sang repo Symphony ở `9cc306d`. | 145-150 |
| Thay đổi bền chỉ quay về qua changeset | "durable changes về qua changeset, không ghi thẳng". Hợp nhất là thêm một file mới (không bao giờ conflict trong git) rồi replay; không có hai bản phân kỳ nào để đối chiếu. | 148; `plans/reports/investigation-260821-1202-eventlog-branch-union-decision-history-report.md` mục "bee vs harness" |
| Mutation trên revision cũ bị chặn lúc replay | "mutation trên stale revision bị CHẶN REPLAY chứ không âm thầm merge". Ở tầng story còn có compare-and-set `--expected-status`, lệch thì CONFLICT exit 3 và không ghi gì. | 373, 175-180 |
| Lệnh ghi được phân loại tập trung | `Cli::mutates_state()` quyết định lệnh nào cần epoch-fence guard; read-only luôn được phép. | 189-193 |

### 1.2 Những giới hạn của upstream mà chính nguồn tự lộ

- **Một run sống tại một thời điểm.** `auto-polling-bounded` ghi "single-active-run lock trong `.symphony/state.db`" (dòng 152-157). Báo cáo `investigation-260821-1202-...` đã rút ra: harness tránh bài toán nhiều writer đồng thời bằng cách không cho phép nhiều writer đồng thời; CAS và changeset của nó mạnh cho một writer tại một lúc.
- **Chính harness rút lui khỏi durable layer nặng.** Phase 1-2 (2026-07-20/21) bỏ SQLite và CLI khỏi default path, thành add-on `--with-cli` (dòng 125-129); Phase 4 đóng băng ghi SQLite lifecycle mặc định (dòng 131-135).
- **Chưa có cơ chế đọc tươi giữa các run.** Consult 2026-07-28 liệt kê các "index gaps": worktree phát hiện root db thay đổi sau fork bằng cách nào, có sync trước khi chạy không, schema migrate giữa chừng thì sao. Nguồn không trả lời (`plans/reports/distill-consult-worktree-in-out-repository-harness-260728.md`, các mục "Index Gaps").
- **Tự thừa nhận phần lớn lịch sử chỉ enforce ở mức hướng dẫn** (`instruction-level-enforcement`, dòng 50-54).

### 1.3 beads chuyển sang Dolt-as-truth và lý do

Nguồn: `docs/distillery/sources/beads.md`, mục `dolt-as-versioned-truth` (dòng 67-73).

- **Cái gì đổi.** Dolt SQL (`.beads/dolt/`, gitignored) thành nguồn canonical duy nhất; JSONL chỉ còn là export/interchange. Đồng bộ qua `bd dolt push/pull` (Dolt native, không dùng git). Commit theo ba pha (mutation, PostWriteCommit, PostWritePush).
- **Vì sao.** Mô hình concurrency chuyển từ branch-per-worker sang all-on-main kèm kỷ luật transaction, vì tải chính là nhiều agent ghi đồng thời. Distillery kết luận: "quỹ đạo beads RẼ KHỎI JSONL-truth khi multi-agent write trở thành tải chính" (dòng 70).
- **Đánh đổi.** Mất khả năng diff trong git; được multi-writer cộng history/branch/merge cấp db.
- **Hệ quả cho fgOS.** Đây chính là "ngưỡng xem lại có tên" của L3 (`docs/platform-foundations.md` L3, đoạn "Ngưỡng xem lại", dòng 98-106). Ba hướng truth-store hiện có: file-in-git (beehive), JSONL-in-git cộng db-view (harness), versioned-DB-as-truth (beads).
- **Ghi chú quan trọng:** `docs/history/tsk-3tp-worker-write-events-tang-b/DISCUSSION.md` §5 vòng 2 từng đề xuất tách state plane thành nested git repo riêng, gitignored, và bị bác ở vòng 3 và 5 vì D1 ("`.fgos` state phải sống cùng một git history với code").

---

## Phần 2. Dòng thời gian của fgOS

Ký hiệu cột "Hướng": **→U** là tiến về phía upstream, **←U** là xa upstream, **±** là trung tính hoặc vá triệu chứng.

| # | Ngày | Commit / tài liệu | Thay đổi | Sự cố hoặc nhu cầu kích hoạt | Hướng | Vấn đề mới sinh ra |
|---|---|---|---|---|---|---|
| 1 | 2026-07-14 | ADR 0001 (`docs/specs/platform-foundations.md:102`), L3, `e034e3b6d` | Chốt log JSONL commit vào git là truth, `state.json` gitignored là view; engine nặng hoãn tới khi có bằng chứng. Bố cục `.fgos/` ở ADR 0003 (`docs/specs/work-state.md:1405-1430`). | Nguồn: `repository-harness:changeset-event-sourcing`. | →U ban đầu, nhưng thiếu thư mục changesets theo run | Tiền đề "single-writer" không được kiểm bằng số đo nào. |
| 2 | 2026-07-17 | `f812fa3b9` (log đầu tiên được commit), `3adfb3fec` | Một file `.fgos/events.jsonl` dùng chung; thêm `events.lock` liên-process quanh đọc-seq-rồi-append. | Hai process cùng đọc seq N và cùng ghi N+1 (spike xác nhận). | ± | Xác nhận multi-writer đã là thực tế; ADR 0001 không được mở lại. |
| 3 | 2026-07-23 | `1f7a0e473` (STR65) | Pre-commit hook ép main-checkout lock; sau này nhiều lần tinh chỉnh (`1d38f4c20` 08-03 chặn commit khi main đứng trên nhánh `fgw/*`; `318098bdd` 08-13 chặn commit stage xóa `.fgos/`). | Nhiều session dùng chung một cây làm việc. | ← | Lock mức repo gắn với log; cây git thành tài nguyên tranh chấp. |
| 4 | 2026-07-28 17:21 và 17:35 | `aa9ae156`, `9e3fb469`; `docs/history/live-events-seq-corruption/CONTEXT.md` D1 | Hai lần tay giải conflict merge `events.jsonl`, theo hai cách khác nhau, đều làm mất event (seq trùng, nhảy cóc). | Git 3-way text merge không hiểu log append-only. | Sự cố gốc | Không có quy trình giải conflict cho file này. |
| 5 | 2026-07-28 17:26 | `plans/reports/distill-consult-worktree-in-out-repository-harness-260728.md` | Consult về upstream đề xuất 5 việc theo thứ tự: commit changesets, snapshot trước fork, CAS merge gate, epoch-fence journal, tách state orchestrator. | Phản ứng ngay với sự cố 17:21. Báo cáo ghi sai hiện trạng ("event log gitignored, không commit"); thực tế log đã commit từ ADR 0001, nên mục 1 của nó vô nghĩa với fgOS. | →U (không được thi hành) | Không ai nhận đây là lộ trình; xem mục 6. |
| 6 | 2026-07-28 19:58 và 20:11 | `59551886a` (tsk-1an), `4dc91711`; ADR0020 (`docs/specs/runner.md:1692`) | **Block-tree**: `createWorktree` xóa hẳn `.fgos/` sau `git worktree add`; `merge.mjs` từ chối cứng mọi diff chạm `.fgos/` (`fgos-write-rejected`, `src/runner/merge.mjs:686-1164`). Bác isolate-tree (copy cộng union merge) vì YAGNI và thiếu hạ tầng an toàn; bác lock-in-tree (symlink) vì thoát sandbox. | Hai sự cố mất dữ liệu trong 14 phút ở mục 4. | **←U** (quyết định rẽ nhánh lớn nhất) | Index của worktree vẫn giữ các file đã bị xóa khỏi đĩa, nên `git add -A` stage xóa log: `1367126cb` (2026-08-02) phải khôi phục; `318098bdd` (08-13) và `902c97d58` (`fgos resync-worktree`) phải vá. Mọi lệnh phải đi ngược về `.fgos` của main (`getMainFgosDir`). |
| 7 | 2026-08-10 | `fbd856bc2` (tsk-3wq), `47a0f9c4e`; `docs/history/events-jsonl-merge-driver-recurring-write-loss/CONTEXT.md` D1 | `.gitattributes` `merge=union` cho `events.jsonl` cộng `events-jsonl-contiguity.mjs` (khử trùng theo nội dung, đánh lại seq 1..N). Bác "ngừng commit" và "chỉ guard". | Ít nhất ba lần mất event tái diễn (tsk-4vo, tsk-5td, tsk-2x9k), cùng dấu hiệu seq bị dùng lại. | ± (vá merge, không thay mô hình) | `union` không đảm bảo thứ tự, tự `.gitattributes` thừa nhận; cần thêm script dedupe. |
| 8 | 2026-08-10 | `eb95a63b3`, `7e2f3e487` (tsk-4mx), `8596f7a56` (tsk-49e); `docs/history/tsk-1q5-events-jsonl-lost-update-race/plan.md` | `refreshView` chuyển vào trong `events.lock`; `state.json` ghi nguyên tử (tmp cộng rename) và đọc gia tăng. | Lost-update ở tầng view: process kết thúc sau ghi đè bản mới hơn bằng bản cũ hơn. | ± | Chính plan ghi nhận nguyên nhân B (log tracked trong main dùng chung) là rủi ro HIGH không chứng minh được bằng test. |
| 9 | 2026-08-11 | `484536700` (tsk-cgg); `docs/history/events-jsonl-git-tracked-truncation/CONTEXT.md` D1 | Truncation guard: high-water-mark seq trong sidecar gitignored; không bao giờ chặn đường ghi nóng. Bác việc untrack `events.jsonl`. | `git stash` trên main cắt 65 event (seq 11627-11691), vô hình với mọi guard liên tục vì seq được tính lại từ cuối log. Tracking sẽ "mất lịch sử, cần câu chuyện backup mới". | ± | Cần thêm sidecar, file cảnh báo và hàng loạt test. Việc bác untrack (nhắc lại là quyết định D10 trong CONTEXT.md đó) thành tiền đề cho các quyết định sau, kể cả tsk-3tp D1. |
| 10 | 2026-08-20 | `5439eaa2b` (tsk-1ji) | Guard cơ hội và commit checkpoint định kỳ mỗi 15 phút (900 s) trên main. | Hai lần mất event 17:13 và 17:33 (`0f09d479`, `46d74517`). | ← | 17 commit checkpoint trong chưa đến 13 giờ, làm HEAD main di chuyển nhanh và các nhánh `fgw/*` phải catch-up nhiều lần (`plans/reports/investigation-260821-1050-eventlog-loss-merge-speed-root-cause-report.md`). |
| 11 | 2026-08-20 22:51 | `e921fdb4`, khôi phục `165bc0cb` | Merge nhánh `fgw/tsk-6al` đè snapshot `.fgos/` cũ lên bốn file sống của main. Guard của tsk-1ji chỉ cảnh báo, không chặn. | Cơ chế merge-content-precedence mà guard không bao phủ. | Sự cố do mô hình (xem Phần 3) | Cần thêm tsk-1i3, hook content-precedence (`fc6de76ed`, 08-21). |
| 12 | 2026-08-21 | `8607438e9` (tsk-oet), `7956a8a84` (tsk-1vc-2), `00aafe0ce` (tsk-32v) | Cờ tắt `FGOS_DISABLE_OPPORTUNISTIC_CHECKS`; guard fail-closed trong đường ghi nội bộ; checkpoint chuyển từ theo thời gian sang theo số event; sửa việc checkpoint tự va khóa với chính người gọi. | Guard gây friction cho luồng khác; cảnh báo 03:19 là false positive vì mark sidecar không có khóa và không theo session. | ± | Cảnh báo ghi ra không ai đọc (`recordMainCheckoutGuardWarning` write-only). |
| 13 | 2026-08-23 | `18e3f4502`, `49b87f21f`, `69313c04d`; `docs/history/eventlog-tier-a-multifile-content-hash/CONTEXT.md` TA-D1..D14 | **Tầng A**: identity là SHA-256 16 hex của dòng (`h`) cộng `src` (writer); event mới ghi vào `.fgos/events/<writer-id>-<openTs>.jsonl`; replay đa file theo `(ts, tên file, seq trong file)`; `events.jsonl` cũ đóng băng thành baseline-0 không rewrite; `events.lock` giữ phạm vi toàn `.fgos/` (TA-D14). | Mất 7 lệnh `fgos decision` dù exit 0 (sự cố ghi trong CONTEXT.md, ~10:29-10:33Z) cộng nỗi đau merge. | **→U** (mạnh nhất) | Shard vẫn nằm trong cây làm việc của main, vẫn mở và append (không bất biến), vẫn do main một mình ghi. |
| 14 | 2026-08-24 | `3c999f838`, `d1e2cb15d`, `b727d9a76`, `453dbd4ac` (tsk-3tp-1), `92e533a8f`; `docs/history/tsk-3tp-worker-write-events-tang-b/CONTEXT.md` D1-D4 | **Tầng B đóng vĩnh viễn** (D3, ADR0020 không ngoại lệ). Xóa checkpoint chuyên dụng, thay bằng sweep: gom shard dirty vào commit merge/approve cộng một fallback thưa (3600 s). Gỡ `merge=union` và bề mặt contiguity của `events.jsonl`. Thêm compaction (`events-compaction.mjs`). | Churn của checkpoint (mục 10). Đo vòng 3: coordination event chiếm khoảng 40% khối lượng, bắt buộc ghi vào main ngay để chống nhận việc trùng. | ← cho vị trí ghi, → cho identity | Hiện chưa có thư mục `.fgos/events/archive/` (`ls .fgos/events` chỉ có shard, 90 file); catalogue git xác nhận `compactColdWriterFiles` không có người gọi production (`plans/reports/research-261017-1032-git-lessons-catalogue.md`). |
| 15 | 2026-08-24 | `836bd8006`, `543596230`, `017e31d42`; `docs/history/tsk-1wk-events-shard-gitattributes-union/CONTEXT.md` | Khôi phục `merge=union` cho `events.jsonl`, rồi revert; cuối cùng `.gitattributes` chỉ còn `.fgos/events/*.jsonl merge=union`. | Có đường ghi (`fgos edit`, tsk-1t2) vẫn append vào baseline; mỗi shard của session sống bị conflict append khi `fgos catchup`. | ± | Cả bản chất "file riêng mỗi writer" lẫn union đều cần, tức file chưa thật sự bất biến. |
| 16 | 2026-08-25 | `dcaa6deec`, `444a8e263`, `435444eff` | Log chẩn đoán chuyển vào `.fgos/logs/` (ignored); `state.json` chuyển sang `.fgos/cache/` (ignored); sidecar guard chuyển vào `.fgos/runtime/`; `fgos-file-registry.mjs` làm nơi duy nhất khai báo đường dẫn. | Bốn bản copy đường dẫn `state.json` làm hỏng 51 test lần di chuyển đầu. | → (view ra khỏi git) | Dòng ignore của `.fgos/state.json` bị bỏ cùng lúc (`435444eff`, `git log -S'state.json' -- .gitignore`). |
| 17 | 2026-09-06 | `46c5b060a` ("state: record coordination runtime artifacts") | Commit nhầm `.fgos/state.json` (146.395 dòng) vào git; sau đó chỉ còn bị sửa lần cuối 09-18 (`55eb7fab6`). | Hậu quả mục 16: file cũ không còn được ignore. | ← | View stale 9,3 MB bị track, không ai đọc (code đọc `src/state/fgos-file-registry.mjs:36` là `.fgos/cache/state.json`); spec ADR 0003 ("đọc `.gitignore` là thấy sự thật") không còn đúng. |
| 18 | 2026-09-09 | `8033890ad`, `692076c6`, `ecd2a9bf6`; `docs/history/agent-coordination-state-root/rfc-state-root-fix.md`, `findings.md` | Thêm `isSessionWorktree` và guard "disconnected worktree" cho 32 verb ghi (sau mở rộng 44 verb mang `touchesState`). | Worktree tạo ngoài vòng đời fgOS (git thường, công cụ ngoài) kế thừa snapshot `.fgos/` cũ vì nó được track; `dataDir()` chấp nhận và verb ghi vào store tách rời. Bằng chứng sống: tsk-5x7-1 hiện `blocked` ở main nhưng `retrospective` ở worktree khác. | ± | Một lớp guard nữa, và minh chứng ADR0020 không bao phủ mọi cách tạo worktree. |
| 19 | 2026-10-05 | `af0103da4` | Hook pre-commit chỉ canh các log append-only bị co lại, không canh file config. | Hook từ chối nhầm commit hợp lệ. | ± | Thêm quy tắc phải nhớ. |
| 20 | 2026-10-15 | `e8176287f`, `e27182da4` | Hook để lại "beacon" hoạt động, không còn ghi `main-checkout.lock`; checkpoint `.fgos` giữ mutex main trong cả add, commit, reset; Rust `lock.rs` đọc cùng schema TTL. | Commit trên main chặn claim và land 3 phút. | ← | Mutex cho code và mutex cho checkpoint state bị trộn: đúng điều investigation 10-17 chỉ ra ở "Khoá". |
| 21 | 2026-10-16/17 | `c0e8aa2c6`, `10e6f4c55`, `f2c5be8b2`, `94c7fcab6` (plan `261016-1306-main-checkout-single-door-hot-lock`) | Plan cửa một cho main checkout bị hoãn, rồi chỉ giữ phần state để chờ council event store. | Nhận ra hai khóa khác bản chất bị gộp. | → (đang mở lại) | Chính là lý do council này tồn tại. |

### Hai quyết định ADR liên quan trực tiếp

- **ADR 0001** (`docs/specs/platform-foundations.md:102`): log committed vào git, replay dựng view, ngưỡng xem lại là multi-writer. Quyết định này đúng với "truth ở JSONL"; nó chỉ nói "committed vào git", không nói "ghi liên tục trong cây làm việc".
- **ADR0020** (`docs/specs/runner.md:1692`, gốc là commit `59551886a`): bác isolate-tree với lý do "không có chỗ nào trong dispatch path đọc hay ghi `.fgos/` từ worktree" (đã kiểm bằng đọc mã). Câu này đúng ngày 07-28; xem Phần 3 về việc nó còn đúng hôm nay không.

### Cách trôi dạt diễn ra (cơ chế, không chỉ sự kiện)

1. Mỗi sự cố được trả lời bằng bản vá nhỏ nhất ngay tại chỗ, đúng với ưu tiên "Ship Faster" ở `AGENTS.md`, nên không bước nào đủ lớn để buộc mở lại L3.
2. Mỗi bản vá thường tạo ra bài toán mới ở tầng kế (mục 6 sinh mục 11; mục 10 sinh mục 14; mục 16 sinh mục 17).
3. Lộ trình của consult 07-28 không được ai nắm làm kế hoạch: `investigation-260821-1202-...` kết luận fgOS "đã đi được nửa đường mà không nhận ra", với `merge=union` thay một phần mục 1 và 3, `main-checkout-lock` thay một phần mục 4, `events-jsonl-contiguity.mjs` thay phần dedupe của mục 3, tất cả xây rải rác qua các task riêng. Lưu ý: chính các mảnh này sau đó bị xóa (`92e533a8f`) khi chuyển sang shard.

---

## Phần 3. Chẩn đoán

### 3.1 Các điểm rẽ nhánh khỏi upstream và lý do còn đúng hay không

| Điểm rẽ | Upstream | fgOS | Lý do lúc quyết | Còn đúng hôm nay? |
|---|---|---|---|---|
| **D-A. Nơi ghi và hình dạng file** | Mỗi run một file changeset mới, bất biến; hợp nhất là thêm file. | Một log dùng chung trong cây làm việc main; sau Tầng A là shard theo writer-session nhưng vẫn mở, vẫn append, vẫn trong cây main (`49b87f21f`). | Cần thấy tức thì giữa các session để chống nhận việc trùng (coordination chiếm khoảng 40%, `DISCUSSION.md` §3 hàng 9); D1 "state cùng git history với code" (tsk-3tp D1). | **Một phần.** Nhu cầu thấy tức thì là thật. Nhưng nhu cầu "cùng git history" và "ghi trong cây git" là hai việc khác nhau; investigation 10-17 đặt câu hỏi này cho owner (Câu hỏi 2) và bằng chứng gắn "bền" vào "ai đó tình cờ commit" (3 commit chạm `.fgos/events` trong 7 ngày). |
| **D-B. Worktree bị cấm `.fgos`** | Worktree nhận db copy, ghi changeset mới, trả về qua changeset. | Block-tree: xóa `.fgos/` khỏi worktree; merge từ chối mọi diff chạm `.fgos/`. | YAGNI (không đường dispatch nào đọc/ghi `.fgos` từ worktree), sandbox escape của symlink, thiếu hạ tầng dedupe ngày 07-28. | **Phần lớn không còn.** (1) Hạ tầng dedupe và content-hash đã có (08-10, 08-23). (2) Dispatch ra ngoài tiến trình đã có (`tsk-43z`; `investigation-260821-1050...`). (3) Worktree ngoài vòng đời fgOS vẫn kế thừa snapshot tracked (mục 18). (4) Tiền đề "worker không ghi state" là điều kiện thiết kế chứ không phải sự thật bất biến: hiện không có đường nào để worker ghi, nên cũng không có khối lượng đo được, đó là suy luận vòng tròn (nhận định của producer; xem `DISCUSSION.md` §3 hàng 4: Tầng B chỉ giảm áp lực từ worker, không từ session). |
| **D-C. Vị trí view/db** | Db ignored, mỗi worktree tự materialize; có snapshot cộng changesets có kiểm chứng. | `state.json` ignored (D4) rồi dời vào `.fgos/cache/` (08-25); chỉ có một view ở main; worker đọc của main. Compaction viết ra nhưng chưa chạy ở production. | Đơn giản: một view, một cửa. | **Còn đúng cho view**, nhưng bản `.fgos/state.json` stale bị track từ 09-06 (mục 17) vi phạm chính luật "đọc `.gitignore` là thấy sự thật". Độ tươi của view phụ thuộc ba thứ: đang đứng ở checkout nào, commit tình cờ gần nhất, lần pull gần nhất (investigation 10-17 mục 4). |
| **D-D. Bền bằng commit tình cờ và checkpoint** | Orchestrator quyết thời điểm commit changeset, mỗi run một lần, coarse. | Checkpoint 900 s (08-20), theo số event (08-21), sweep vào merge cộng fallback 3600 s (08-24). | Log mở trong cây dirty có thể mất bởi `git stash/checkout/clean` (tsk-cgg). | **Lý do còn nếu log còn trong cây git.** Nếu log ở ngoài cây git chạy, nhu cầu checkpoint-by-commit biến mất và chỉ còn nhu cầu xuất bản theo hợp đồng. |
| **D-E. Khóa** | Single-active-run lock, transaction SQLite, CAS cấp record. | `events.lock` toàn `.fgos/` (TA-D14), main-checkout lock, beacon (10-15), mutex checkpoint. | Nhiều writer thật; CAS cộng append phải trong một critical section (tsk-1q5). | **Còn đúng cho `events.lock`** (multi-writer thật). Lock mức repo và mutex checkpoint là hệ quả của D-A và D-D, không phải nhu cầu độc lập. |
| **D-F. Identity** | `content_sha256`. | `seq` rồi content-hash `h` 16 hex (08-23). | Seq không phải khóa định danh khi hai lịch sử phân kỳ. | **Đã hội tụ về upstream.** |
| **D-G. Chặn mutation trên revision cũ** | Chặn lúc replay, cộng CAS theo status. | CAS trong `store.mjs` lúc ghi (tsk-1q5), cộng `fgos-write-rejected` lúc merge. | Cần đúng ngay khi ghi vì nhiều session sống. | **Còn đúng và là chỗ fgOS tốt hơn upstream** (xem 3.3). |
| **D-H. Merge** | Không có merge trên state (chỉ thêm file). | `merge=union` (08-10), gỡ (08-24), khôi phục rồi revert, cuối chỉ cho shard. | Log tracked phải merge được. | **Chỉ còn đúng vì D-A.** Với file bất biến theo run, driver merge không cần. |

### 3.2 Sự cố sẽ không xảy ra dưới mô hình upstream

"Không xảy ra" nghĩa là sự cố đó cần điều kiện mà mô hình upstream loại bỏ về cấu trúc. Đánh giá của producer; nguyên nhân gốc của một số sự cố chưa được chứng minh (ghi chú cạnh từng mục).

| Sự cố | Bằng chứng | Vì sao upstream tránh được | Chắc chắn đến đâu |
|---|---|---|---|
| Mất event do tay giải conflict merge (07-28) | `aa9ae156`, `9e3fb469`; `live-events-seq-corruption/CONTEXT.md` D1 | Mỗi run thêm một file mới nên git không có gì để conflict. | Cao |
| Mất event lặp lại do git merge (tsk-4vo, tsk-5td, tsk-2x9k) | tsk-3wq CONTEXT D1 | Như trên. | Cao |
| Phải có union driver, contiguity script và test (08-10) | `fbd856bc2`, `47a0f9c4e` | Không có bản phân kỳ để union. | Cao |
| Conflict union trên shard khi `fgos catchup` (08-24) | tsk-1wk CONTEXT | File bất biến theo run không bị append từ hai phía. | Cao |
| Merge nhánh worker đè `.fgos/` sống của main (08-20 22:51) | `e921fdb4`, `165bc0cb` | Nhánh worker không mang snapshot `.fgos` nào trong git. | Cao |
| `git add -A` trong worktree stage việc xóa log (08-02) | `1367126cb`; `tsk-56u` (`318098bdd`) | Worktree vẫn có changesets đã commit; không bị strip. | Cao |
| Worktree ngoài vòng đời kế thừa snapshot cũ và ghi vào store tách rời (09-09) | `agent-coordination-state-root/findings.md` | Mỗi worktree materialize db từ nguồn commit và viết changeset mới; khi merge các changeset hội tụ. | Cao |
| Commit `.fgos/state.json` 146k dòng (09-06) | `46c5b060a` | Db là artifact ignored theo thiết kế, có negation chỉ cho thư mục changesets. | Cao (nhưng đây là sai sót gitignore, upstream cũng có thể mắc nếu bỏ dòng ignore) |
| Chu kỳ checkpoint tạo churn lên HEAD main và catch-up dày (08-20 đến 08-21) | `investigation-260821-1050...` | Không có checkpoint-commit mịn; changeset commit theo run. | Cao |
| Va chạm lock giữa checkpoint và người gọi, chặn claim 3 phút (08-21 `00aafe0ce`; 10-15 `e8176287f`) | commit message | Không có commit state chen vào tranh mutex code. | Vừa (còn cần một cơ chế khóa cho ghi đồng thời) |
| `git stash`/`checkout` cắt cụt log (08-10, tsk-cgg) | tsk-cgg CONTEXT | Changeset đã commit là file bất biến, stash không đảo được; changeset chưa commit vẫn có thể mất bởi `git clean`. | Vừa |
| Hai lần mất event 08-20 17:13 và 17:33; mất 7 lệnh decision 08-23 | `investigation-260821-1050...`; TA-INCIDENT | Mỗi writer chỉ ghi file của mình. Tuy nhiên nguyên nhân gốc (tsk-4oq) chưa được xác nhận, và giả thuyết `git merge --abort` đã bị bác thực nghiệm (`events-jsonl-merge-abort-truncation-gap/CONTEXT.md`). | Thấp đến vừa |
| Tách nhầm hai nghĩa khóa trong plan 4.3 (hoãn 10-16/17) | `plans/261016-1306-...` | Không có mutex checkpoint để trộn với mutex code. | Cao |

Những sự cố **vẫn xảy ra** dưới upstream: race cấp CAS giữa nhiều writer cùng nhận một việc (cần khóa hoặc transaction), tính tươi giữa các session, và các lỗi view cũ (`state.json` lost-update, tsk-1q5 nguyên nhân A, chỉ cần một critical section).

### 3.3 Điểm yếu của upstream mà fgOS thực sự phải giải

1. **Nhiều writer đồng thời thật.** Upstream tránh bài toán bằng single-active-run lock. fgOS có 8 đến 20 cửa sổ session cùng lúc (`events-lock-concurrency-race/CONTEXT.md` D2). Đây là điểm beads cũng đã gặp và chuyển sang Dolt (Phần 1.3).
2. **Độ tươi sống (live freshness).** Coordination event (`work.move` 29%, `work.stage` 6,6%, `work.add` 4,3%, tổng khoảng 40% trên 23.847 event) cần thấy tức thì trên toàn máy để chống nhận trùng (`tsk-3tp .../DISCUSSION.md` §3 hàng 9). Upstream không trả lời bài toán worktree phát hiện db đổi sau fork (consult 07-28, "Index Gaps").
3. **Nhật ký phải replay được kể cả khi chia sẻ giữa máy.** Upstream thực chất chỉ chạy trên một máy mỗi run; fgOS chưa trả lời có cần chia sẻ giữa máy hay không (investigation 10-17 Câu hỏi 2).
4. **Chi phí replay.** `state.json` 8 đến 10 MB, 67 ms đọc cộng 70 ms parse mỗi lệnh (TA-D15), đây chính là thứ upstream giải bằng snapshot cộng changesets mà fgOS chưa làm (compaction chưa chạy).
5. **Kiểm soát chất lượng ghi.** CAS lúc ghi, cổng Iron Law, evidence-traceability (`store.mjs`, ví dụ `2063097c0`, `176c299f8`) là những thứ upstream chỉ có ở mức story, còn fgOS làm cho từng loại event.
6. **Upstream tự co lại.** Harness bỏ db khỏi default path (Phase 1-2), cho thấy durable layer nặng là chi phí thật khi chưa có tải multi-writer.

### 3.4 Điều quan trọng cho council

- **Lỗi lớn nhất không phải kỹ thuật mà là quy trình:** luật L3 bất biến nói "chạm ngưỡng thì mở lại, không vá tại chỗ", nhưng ngưỡng bị chạm ngày 07-17 và không ai ghi nhận nó là sự kiện mở lại luật. Sau đó ít nhất 20 task vá tại chỗ.
- **Hai trục bị trộn trong tên "truth ở JSONL":** (a) hình dạng truth (JSONL, content-addressed, replay được) và (b) nơi truth sống (cây làm việc git, ghi nóng). Tầng A sửa (a) khá tốt; (b) chưa bao giờ được quyết định riêng, nó chỉ được thừa hưởng từ "commit vào git" của ADR 0001. Investigation 10-17 đã nêu đúng điểm này.
- **Một số mảnh đã xây nhưng không thấy chạy:** compaction (`events-compaction.mjs`) có code và test nhưng chưa có `archive/` (đã kiểm: `ls .fgos/events` không có thư mục này) và catalogue git ghi không có người gọi production. Cần kiểm lại trước khi coi là phần của giải pháp.

---

## Câu hỏi mở cho council

1. L3 có nên được supersede bằng record mới tách hai luật, "hình dạng truth" và "nơi truth sống", thay vì tiếp tục viện dẫn ADR 0001 cho cả hai không?
2. Nhu cầu chia sẻ event giữa máy và giữa clone có thật không? Nếu không, event store có thể ngoài cây git và chỉ xuất bản sang git theo một hợp đồng rõ; nếu có, cơ chế chia sẻ nào (git, sync riêng, Dolt-like)?
3. Coordination event (khoảng 40%) và narrative event (55 đến 60%) có nên đi hai đường lưu khác nhau (coordination ở store cục bộ tức thì, narrative thành changeset bất biến theo run) hay giữ chung một log? Đo của tsk-3tp vòng 3 chỉ ra hai lớp có luật khác nhau.
4. Tầng B đóng "vĩnh viễn" ngày 08-24 trên ba phản chứng (worker không ghi `.fgos`, nguồn áp lực là session, upstream không có mô hình đó). Với bằng chứng ở mục 18 và việc dispatch ra ngoài đã tồn tại, các phản chứng đó có còn đứng vững, hay cần tái đánh giá theo mô hình "thêm file bất biến" chứ không phải "ghi vào log chung"?
5. Có nên coi `.fgos/state.json` bị track (09-06) và `.fgos/events.jsonl.backup-*` là rác cần dọn trước mọi thiết kế, hay là một phần bằng chứng phải giữ?
6. Compaction đã code nhưng chưa chạy: trước khi quyết định snapshot cộng changesets, có cần đo xem chi phí replay hiện tại (khoảng 140 ms mỗi lệnh) có thật là điểm nghẽn không, theo đúng nguyên tắc "defer engine đến khi có bằng chứng" của ADR 0001?
7. Khóa nóng của state (`events.lock`) và mutex main checkout (code) có thể tách bằng cách nào cho khớp với hướng plan `261016-1306-main-checkout-single-door-hot-lock` đang chờ council?
8. Nếu chọn per-run changeset kèm materialized db theo worktree, ai chịu trách nhiệm cho các khoảng trống mà upstream không trả lời: phát hiện thay đổi sau fork, migration schema giữa chừng, thứ tự áp khi hai changeset cùng sửa một item (consult 07-28 liệt kê chúng như "index gaps")?

## Cách tôi kiểm tra và những gì chưa kiểm

- Đã đọc trực tiếp: `docs/distillery/sources/repository-harness.md` (toàn bộ), `docs/distillery/sources/beads.md` (toàn bộ), bốn báo cáo plans (`investigation-261017-1027`, `investigation-260821-1202`, `investigation-260821-1050`, `distill-consult-worktree-in-out-repository-harness-260728`), các `CONTEXT.md`/`plan.md` của các thư mục history trong yêu cầu, ADR 0001 (`docs/specs/platform-foundations.md:102`), ADR 0003 (`docs/specs/work-state.md:1405`), L3 (`docs/platform-foundations.md`).
- Đã đối chiếu bằng `git log` và `git show` các commit trong bảng (ngày, tác giả, thông điệp), `.gitattributes` và `.gitignore` hiện tại, và số file `.fgos/events/` (90) cùng việc không có `archive/`.
- **Chưa làm:** đọc mã nguồn upstream (không có trong máy); đọc `docs/history/tsk-5dk-delivered-event-merge-provenance`, `tsk-4te-partial-claim-event-loss`, `events-jsonl-truncation-force-rebaseline` ngoài tiêu đề (không ảnh hưởng kết luận chính); đếm lại 43/182 bài học (tôi dùng số từ investigation 10-17; catalogue v2 hiện có 233 mục, commit gần nhất ghi 234); xác nhận từng hàng "Chắc chắn" trong 3.2 bằng thực nghiệm.
