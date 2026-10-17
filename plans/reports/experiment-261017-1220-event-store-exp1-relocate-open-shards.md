# Thí nghiệm 1: dời open writer shard ra khỏi cây git, đếm bài học git chết

Trạng thái: hoàn tất, không đổi repo thật (`/home/vantt/projects/forgent` chỉ được đọc). Mọi thay đổi và mọi lần chạy test nằm trong bản sao `/tmp/exp1-repo` (bản gốc, chạy baseline) và `/tmp/exp1-after` (bản sao đã đổi), tạo bằng `git clone --no-hardlinks` rồi `cp -a`; `node_modules` dùng lại được nên `npm ci --offline` báo "up to date".

## 1. Kết luận đầu tiên

**Đếm theo catalogue (61 mục khớp từ khóa `.fgos`/events/shard/checkpoint/union/strip/truncat/jsonl):** DIES 9, CHANGES 8, REMAINS 44, và NEW-RISK 8 hazard mới (N-1..N-8, không có G-id vì catalogue chưa biết chúng). Số DIES nhỏ hơn kỳ vọng "một họ bài học chết hàng loạt" vì ba lý do đo được hoặc đọc được từ mã: (a) shard đã niêm phong vẫn nằm trong git dưới `.fgos/events/`, nên việc strip `.fgos` ở worktree và các guard hook quanh nó vẫn cần; (b) `events.lock` vẫn là vùng găng liên tiến trình (thí nghiệm không đụng tới), nên cả họ lock (H10) còn nguyên; (c) phần lớn mục chỉ nhắc `.fgos` vì chuyện khác (catchup, approve, verify). Cái chết thật nằm ở một cụm hẹp: **tracked-dirty do ghi sự kiện** (G-092, G-093, G-120), **merge/ghi đè trên log chỉ-thêm** (G-089, G-121, G-170) và **cắt xén log** (G-210, G-211), cộng phần mất event-log của G-029.

**Delta test (66 file test liên quan, 1250 test, `env -u CLAUDE_CODE_SESSION_ID`, `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1` đúng như `scripts/run-tests.mjs` đặt):**

| Lần chạy | pass | fail | ghi chú |
|---|---|---|---|
| Trước khi đổi (baseline) | 1228 | 21 | 21 fail có sẵn, tập trung ở test merge/sync-unit (ví dụ "a sync-only unit...", "a .fgos conflict keeps the branch side..."); tôi không điều tra nguyên nhân vì chúng đỏ trước khi đụng code |
| Sau thay đổi prod, chưa sửa test (lần 1, có lỗi cache của tôi) | 1078 | 171 | lỗi của chính tôi: cache nhớ nhầm vị trí dự phòng trước `git init`; đã sửa |
| Sau thay đổi prod, đã sửa lỗi cache | 1121 | 128 | +107 fail mới, 0 fail được sửa |
| Thêm 2 sửa nhỏ ở `test/cli/helpers/fgos-cli-harness.mjs` | 1224 | 25 | +4 fail mới còn lại, 0 fail được sửa |

**Vì sao 107 fail mới (đã phân loại bằng thông báo lỗi, không đoán):** 96 là `git commit` thất bại vì không còn gì để commit: helper `commitPending` (và hàng chục test gọi nó với tên `state: ...`) tin rằng mỗi verb ghi sự kiện làm `.fgos/events/*.jsonl` dơ trong git; đó là một test **chỉ ghim vị trí cũ** chứ không phải phụ thuộc thật (sửa bằng `--allow-empty`, xem diff). 3 là `readdirSync(.fgos/events)` ném ENOENT trong chính thân test (claim-port, concurrent-claim-eventlog-loss) vì thư mục không còn được tạo sẵn. 8 là test đọc sự kiện thẳng từ `.fgos/events` hay đếm số dòng qua helper `eventLines` (fgos-return, post-merge, disconnected-worktree-guard, `sync-root`, `promote-to-component`). Sau khi sửa `commitPending` và `eventLines` (đọc cả thư mục open), còn 4 fail mới và cả 4 đều ghim vị trí cũ: `fgos-approve.test.mjs:150` khẳng định đúng một đường dẫn `.fgos/events/*.jsonl` đang dơ trong `git status` (đây là bài học G-089/G-105 "approve chịu được .fgos dơ" mất đối tượng kiểm), `claim-port.test.mjs:742` và hai test ở `concurrent-claim-eventlog-loss.test.mjs` (dòng 84 và 185) tự `readdirSync(.fgos/events)`. Tôi không tìm thấy test nào thất bại vì một phụ thuộc thật vào vị trí cũ trong mã production, nhưng một kết luận như vậy chỉ đúng với 66 file đã chạy, không phải toàn bộ `npm test` (xem mục "Đã chạy và chưa chạy").

## 2. Bảng từng mục catalogue

Ký hiệu nguồn bằng chứng: **[chạy]** là có số liệu từ lần chạy trong bản sao; **[đọc]** là suy ra từ mã và catalogue, chưa chạy. Khớp từ khóa bằng `grep` trên cột bài học của bảng catalogue (không đọc lại 1271 dòng), nên một mục chỉ nhắc `.fgos` bằng từ khác có thể sót.

| G-id | Verdict | Lý do một câu |
|---|---|---|
| G-017 | REMAINS | Đọc đầu ra git không `-z` là lỗi parser độc lập vị trí shard. |
| G-019 | REMAINS | Tin registry thay topology git để chọn checkout vẫn đúng; phần "ghi từ worktree vào snapshot `.fgos`" thì chết vì open shard luôn ra common dir [chạy: test disconnected-worktree-guard chỉ vỡ do ghim đường dẫn]. |
| G-021 | REMAINS | Kiểm tra bẩn nuốt lỗi git không liên quan tới shard. |
| G-023 | REMAINS | So sánh đường dẫn `git status` với `.fgos` vẫn cần cho phần `.fgos` được track. |
| G-027 | REMAINS | Reclaim claim dựa pid/tuổi; claim vốn đã ở `.fgos/runtime/claims` gitignored. |
| G-029 | DIES | Phần "git add -A stage việc xóa event log nên mất log khi merge ngược" chết vì shard đang ghi không còn trong cây [đọc]; việc `.fgos` bị strip vẫn cần cho phần còn lại (xem G-166). |
| G-032 | REMAINS | `npm install` giữ lock quá ttl, không liên quan vị trí shard. |
| G-033 | REMAINS | Dọn worktree dở dang độc lập. |
| G-040 | REMAINS | resync-worktree phải xác định main bằng `--dir`; vẫn đúng. |
| G-054 | REMAINS | Thay đổi dưới `.fgos/` vẫn có thể đi nhờ commit worker vì config/docs trong `.fgos` vẫn được track. |
| G-069 | REMAINS | Base side của `.fgos/` không được vào branch worker (ADR0020) vẫn cần cho phần `.fgos` còn track. |
| G-076 | REMAINS | Catchup/branch giữa merge không dính shard. |
| G-081 | REMAINS | Đường `integrate` không kế thừa luật; độc lập. |
| G-086 | REMAINS | `branchContentMismatch` vẫn phải loại cả `.fgos/` vì worker branch cố ý thiếu nó. |
| G-088 | REMAINS | Worker branch không được mang thay đổi `.fgos/`; còn đúng với shard đã seal. |
| G-089 | DIES | Auto-resolve `merge=union` làm stage `.fgos/*.jsonl` rồi kích từ chối chỉ xảy ra khi hai bên cùng sửa một shard; open shard không được track, shard seal bất biến tên duy nhất [đọc, và chỉ khi sealer chỉ thêm file mới]. |
| G-090 | CHANGES | Xung đột modify/delete chỉ còn khi compaction `git mv` shard đã seal sang `archive/` (hiện không có caller production, E7) nên điều kiện chuyển từ "luôn" sang "khi bật compaction". |
| G-092 | DIES | Nguyên nhân thật là ghi sự kiện đồng thời làm checkout nửa-abort; ghi vào `.git/fgos/open` không làm dơ checkout [đọc]. |
| G-093 | DIES | Shard bị claim làm bẩn lúc merge hết có, vì chỉ có file seal mới nằm trong cây. |
| G-095 | REMAINS | Tin lời tự báo của worker, verify timeout; độc lập. |
| G-096 | REMAINS | Merge root-vào-trunk CAS vẫn cần; phần "reset --hard phá dirt `.fgos` hợp lệ" chết. |
| G-102 | REMAINS | Chặn approve vì file bẩn không liên quan vẫn đúng; chỉ phần dirt do event chết. |
| G-105 | REMAINS | Post-land state write vẫn tranh `events.lock`; thí nghiệm không đổi vùng găng. |
| G-115 | REMAINS | Provider chạm giới hạn giữa round; độc lập. |
| G-117 | REMAINS | Reclaim claim đang sống; độc lập. |
| G-118 | CHANGES | Checkpoint commit tự đụng lock vẫn là ràng buộc, nhưng đối tượng đổi từ "ghi nhật ký đang mở" thành "seal rồi commit file bất biến", cửa sổ đua nhỏ hơn. |
| G-119 | REMAINS | Lock đặt nhầm trong worktree đã strip; `events.lock` vẫn nằm trong `.fgos/`. |
| G-120 | DIES | Race "writer append trong lúc `git add`/restore" mất nghĩa vì open shard ngoài cây; nhưng sinh ra N-3 (seal đua với append). |
| G-121 | DIES | Merge ba chiều theo dòng trên log chỉ-thêm và conflict xóa/sửa shard cũ cần hai bên cùng sửa một file; seal bất biến tên duy nhất không còn [đọc]. |
| G-124 | REMAINS | ABA khi xóa lock cũ; độc lập. |
| G-137 | REMAINS | Hai process kế thừa cùng session id vẫn tới cùng open shard (đã được `events.lock` tuần tự hóa như cũ). |
| G-142 | REMAINS | Lỗi lock không phân loại; độc lập. |
| G-147 | REMAINS | Hook chỉ khóa commit cuối; độc lập. |
| G-150 | REMAINS | Thứ tự lấy lock; vùng găng chưa đổi. |
| G-151 | REMAINS | `index.lock` của git; độc lập. |
| G-156 | REMAINS | Lock sự kiện: người giữ chết, ABA; vùng găng chưa đổi. |
| G-159 | REMAINS | Mã dọn claim cũ và doctor coordination; độc lập. |
| G-162 | REMAINS | Biến env không được bỏ qua kiểm tra lock của hook; độc lập. |
| G-165 | REMAINS | Guard hook buộc lock của main; độc lập. |
| G-166 | REMAINS | Worktree strip bản `.fgos` nhưng index vẫn giữ nên `git add -A` stage việc xóa; giờ hại lớn nhất là xóa shard đã seal (lịch sử), vì strip không bỏ được khi `.fgos` còn track. |
| G-167 | REMAINS | Materialize merge thủ công có thể stage `.fgos/*` trên branch worker. |
| G-168 | REMAINS | Guard hook tách `diff --name-only` không `-z`; parser. |
| G-170 | DIES | Worktree cũ commit log chỉ-thêm cũ đè log mới của main cần file chung được sửa; shard seal tên duy nhất không bị đè [đọc], baseline-0 đã đóng băng. |
| G-181 | REMAINS | Thiếu assertion trực tiếp rằng `merge.mjs` không ghi `.fgos/`; độc lập. |
| G-183 | REMAINS | Hai chính sách env của hook; độc lập. |
| G-184 | CHANGES | Công tắc `FGOS_DISABLE_OPPORTUNISTIC_CHECKS` tắt cả phát hiện cắt xén lẫn checkpoint; nửa phát hiện chết, nửa checkpoint trở thành bước seal, nên chính sách công tắc (bị AGENTS.md cấm) chuyển sang bước seal. |
| G-191 | CHANGES | Cửa session symlink `.fgos` sang store dùng chung vẫn cần cho phần `.fgos` track, nhưng không còn là đường duy nhất để event tới store sống. |
| G-193 | CHANGES | Rủi ro gỡ symlink rồi khôi phục `.fgos` từ HEAD không còn làm mất event (open shard ở common dir) nhưng còn với file `.fgos` track. |
| G-194 | REMAINS | Chính sách dọn session yếu (pid một lần chạy); độc lập. |
| G-195 | REMAINS | Cửa worktree của `return` và script mutation; độc lập. |
| G-196 | REMAINS | Retry reset về baseline; độc lập. |
| G-202 | REMAINS | Catchup gặp conflict thật ngoài `.fgos/`; độc lập. |
| G-206 | REMAINS | Hồi quy guard chứng thực chỉ đọc baseline `events.jsonl`; không đổi vì thay đổi không sửa nó, và còn nguyên một lớp đọc trực tiếp (xem N-5). |
| G-210 | DIES | Truncate-rồi-append luôn đánh số tiếp chỉ xảy ra trên file track; open shard sống sót qua `git clean -fdx`, `gc --prune=now`, `reset --hard`, `stash -u` [chạy trong `/tmp/exp1-topo.mjs`], shard seal không bao giờ được append lại; cần thay bằng kiểm tra hash nội dung của shard seal (N-7). |
| G-211 | DIES | Sidecar mốc theo từng file chỉ để bảo vệ G-210. |
| G-212 | CHANGES | Checkpoint theo thời gian yên lặng trở thành điều kiện seal theo thời gian; chính sách này giờ quyết định RPO. |
| G-213 | CHANGES | Guard/checkpoint nuốt lỗi bằng `catch {}`; bước seal mới sẽ có cùng nguy cơ nếu không ghi chẩn đoán. |
| G-214 | REMAINS | Compaction `git mv` ngoài writer vẫn chạy trên shard seal (không caller production). |
| G-218 | REMAINS | Claim runtime đã nằm ngoài cây; độc lập. |
| G-223 | REMAINS | Thứ tự guard trong hook; độc lập. |
| G-232 | CHANGES | Test consumer state/intake/workflow chạy trên repo tạm và ghim vị trí cũ [chạy: 107 fail do ghim, 4 fail còn lại sau khi sửa helper]. |

**Mục NEW-RISK (relocation sinh ra, chưa có G-id):**

- **N-1 Cờ vị trí đổi khi `git init` xảy ra sau lần ghi đầu.** Trước khi có git, resolver trả về `.fgos/events`; sau `git init` trả về common dir, nên một store có thể có shard ở hai nơi [chạy: lần chạy đầu của tôi cache nhớ vị trí dự phòng và làm 171 test vỡ; sửa bằng không cache kết quả dự phòng]. Reader gộp cả hai nơi nên không mất event, nhưng quyền sở hữu seal phải xử lý cả hai.
- **N-2 Topology common dir.** Đã chạy `git rev-parse --path-format=absolute --git-common-dir` qua resolver cho: repo thường, linked worktree (kể cả `.fgos` là symlink về main và worktree trên `/dev/shm`, khác filesystem: dev id 120 so với 103), `--separate-git-dir`, bare repo kèm worktree, submodule; tất cả cho ra một thư mục hợp lệ (`main/.git/fgos/open`, `sep-gitdir/fgos/open`, `bare.git/fgos/open`, `main/.git/modules/sub/fgos/open`). Điều kiện chưa chạy: seal bằng `rename` từ common dir sang `.fgos/events` sẽ gặp `EXDEV` khi `--separate-git-dir` nằm khác filesystem với cây làm việc, nên seal phải là copy + fsync + unlink [đọc]. Submodule có common dir riêng, nên shard của superproject và của submodule tách nhau là đúng nhưng phải được ghi trong tài liệu.
- **N-3 Seal đua với writer đang append.** Vì `resolveWriterLogPath` chọn shard "mới nhất theo tên" cho mỗi writer, seal giữa lúc writer vẫn mở file sẽ khiến lần ghi sau tạo shard mới hoặc ghi vào file đã bị dời; seal bắt buộc chạy dưới `events.lock` và writer phải resolve lại đường dẫn sau mỗi lần khóa [đọc].
- **N-4 Mất open shard khi xóa clone hoặc sập trước seal.** Open shard nằm trong `.git`; `git clone` không mang nó theo [đọc] và xóa clone (hay `rm -rf .git`) làm mất mọi event chưa seal; sập trước seal để lại shard mồ côi nên cần quét và seal lại khi khởi động hoặc trong `doctor` [đọc, chưa cài].
- **N-5 Mọi chỗ đọc thẳng `.fgos/events/` bỏ sót open shard.** Qua `rg`: `src/state/events-compaction.mjs:214`, `src/state/events-jsonl-truncation-guard.mjs:258` và `:421`, `src/runner/merge.mjs:1565`, `src/setup/registrations.mjs:1993`, `:2050`, `:6180`, `scripts/regenerate-observe-fixtures.mjs:106` đều dùng `path.join(dir, 'events')`. Tôi chỉ đổi `replay.mjs` và `store.mjs`, nên các chỗ này sẽ không thấy open shard (guard không bảo vệ chúng, doctor không đếm chúng, quét friction cũ không thấy chúng).
- **N-6 `merge=union` và `.gitattributes` vẫn còn nằm đó.** Thí nghiệm không gỡ dòng `.fgos/events/*.jsonl merge=union`; muốn G-089/G-121 chết thật thì phải gỡ nó và phải chứng minh rằng seal chỉ thêm file tên duy nhất (cùng id khác nội dung thì phải là xung đột, đúng như default ở packet).
- **N-7 Không còn guard cắt xén cho open shard.** Disk đầy hay công cụ làm cắt xén file open sẽ không bị phát hiện; cần một kiểm tra khác (hash nội dung của shard seal, hoặc đếm seq liên tục của shard open) [đọc].
- **N-8 Tính tươi giữa các máy.** Event chưa seal không rời máy, nên máy khác chỉ thấy sau seal + commit + push; đây là ngữ nghĩa sản phẩm, trùng với default "cross-machine freshness chỉ qua publish + fetch" trong packet [đọc].

## 3. Diff đã áp dụng (chỉ production, 5 file; sửa test helper ghi ở dưới)

```diff
diff --git a/docs/architecture-manifest.json b/docs/architecture-manifest.json
@@ -207,6 +207,7 @@
     "src/state/fgos-file-registry.mjs": "kernel",
+    "src/state/open-shards-dir.mjs": "kernel",
diff --git a/src/state/fgos-file-registry.mjs b/src/state/fgos-file-registry.mjs
+import { resolveOpenShardsDir } from './open-shards-dir.mjs';
@@
   OBSERVE_DIR: 'observeDir',
+  OPEN_SHARDS_DIR: 'openShardsDir',
@@
   [FGOS_FILE.OBSERVE_DIR]: (fgosDir) => path.join(fgosDir, 'observe'),
+  [FGOS_FILE.OPEN_SHARDS_DIR]: (fgosDir) => resolveOpenShardsDir(fgosDir),
new file src/state/open-shards-dir.mjs   (44 dòng)
+  resolveOpenShardsDir(fgosDir): realpath(fgosDir); cache theo realpath chỉ khi thành công;
+  `git rev-parse --path-format=absolute --git-common-dir` chạy ở dirname(realpath), env đã bỏ mọi GIT_*;
+  trả `<common-dir>/fgos/open`; nếu ngoài cây git thì trả `<fgosDir>/events` (không cache).
diff --git a/src/state/store.mjs b/src/state/store.mjs
 export function resolveWriterLogPath(dir) {
-  const dirPath = eventsDirOf(dir);
+  const dirPath = resolveFgosFile(dir, FGOS_FILE.OPEN_SHARDS_DIR);
diff --git a/src/state/replay.mjs b/src/state/replay.mjs
 function discoverEventFilePaths(dir) {
   const result = [{ file: '', path: path.join(dir, 'events.jsonl') }];
-  const eventsDirPath = path.join(dir, 'events');
-  ... readdir một thư mục ...
+  const seen = new Set();
+  for (const eventsDirPath of [path.join(dir, 'events'), resolveFgosFile(dir, FGOS_FILE.OPEN_SHARDS_DIR)]) {
+    ... readdir từng thư mục, bỏ qua tên đã thấy, đẩy vào result ...
   }
   return result;
```

Phần sửa test (chỉ để đo, không thuộc đề xuất), ở `test/cli/helpers/fgos-cli-harness.mjs`: `commitPending` thêm `--allow-empty`; `eventLines` đọc cả thư mục open (qua `new Set` để không đếm trùng khi resolver trả về thư mục cũ); import `resolveOpenShardsDir`. Có một đơn giản hóa tôi biết là chưa đúng: `discoverEventFilePaths` bỏ qua tên trùng giữa hai thư mục, nhưng nếu seal bằng copy thì bản seal dang dở (ngắn hơn) có thể thắng bản open đầy đủ; nên bỏ `seen` và để dedupe theo hash `h` sẵn có xử lý. Tôi không sửa vì thí nghiệm giữ thay đổi nhỏ.

`.gitattributes`, truncation guard, `merge.mjs` sweep, compaction và doctor cố ý không đụng (đo xem có test nào vỡ vì chúng).

## 4. Chi phí của dời chỗ

**Cửa sổ chưa seal (RPO).** Không có seal trong thí nghiệm, nên RPO của bản thử là cả đời writer. Đo từ 90 shard đã commit trong clone (8.933 event, 4.115.978 byte, từ 2026-08-24 đến 2026-10-17; `ts` là thời điểm event, không phải tuổi tiến trình): mỗi shard có median 24 event, p90 168, tối đa 1.834; khoảng thời gian từ event đầu đến event cuối của một shard có median 54 phút, p90 872 phút (khoảng 14,5 giờ), tối đa 20.292 phút (khoảng 14 ngày); **42 trong 90 shard kéo dài hơn 60 phút và chứa 7.903 trên 8.933 event (88%)**. Nói cách khác, nếu seal chỉ xảy ra khi writer kết thúc, phần lớn event nằm trong các shard sống hơn một giờ và có thể ở ngoài git hàng giờ đến hàng ngày; một chính sách seal theo thời gian (như điều kiện checkpoint G-212 hiện là 3600 giây) chặn RPO ở khoảng một giờ nhưng bắt writer sống lâu phải đóng và mở lại shard giữa chừng. Số liệu "events/ngày" và tần suất commit checkpoint thực: 7 commit chạm `.fgos/events*` trong 30 ngày trên tổng 1.637 commit trong 30 ngày, nghĩa là git hiện chỉ thấy shard ở các thời điểm rất thưa; điều này cho thấy RPO thực tế hiện tại (commit) đã dài, và dời chỗ không làm nó dài hơn đáng kể nếu seal cũng theo giờ, nhưng làm nó rõ ràng thay vì ngầm.

**Seal phải làm gì [đọc, chưa cài].** (1) Lấy `events.lock`. (2) Fsync shard open, đổi tên (hoặc copy + fsync + unlink khi `EXDEV`) sang `.fgos/events/<writer>-<openTs>.jsonl`, fsync thư mục đích. (3) Writer resolve lại đường dẫn sau lần khóa kế tiếp để mở shard mới. (4) Commit (checkpoint hiện có) chỉ gom các file seal, nên G-118/G-120 co lại thành một commit trên file đã đóng. (5) Khi khởi động, `doctor` và writer đầu tiên phải seal các shard mồ côi của writer đã chết (N-4). Điều kiện kích hoạt: writer kết thúc, hoặc yên lặng quá ngưỡng (thừa kế G-212), hoặc kích thước vượt ngưỡng.

**Đường đọc phải gộp open và sealed không?** Có, và đã chứng minh trong thí nghiệm: `discoverEventFilePaths` gộp cả hai thư mục thì `rebuildViewFromDir` và `buildSnapshotFromDir` chạy đúng (1224 trên 1250 test pass sau khi sửa helper, 0 test baseline được sửa, 4 fail mới đều ghim vị trí cũ). Chi phí đọc thêm: một `readdir` và một lần chạy `git rev-parse` mỗi `fgosDir` khác nhau trong mỗi tiến trình (được cache); tôi không đo độ trễ của lệnh git nên chưa có số.

## 5. Đã chạy và chưa chạy

**Đã chạy:** baseline và bốn lần chạy sau thay đổi của 66 file test ở danh sách `/tmp/exp1-tests.txt` (state/events, store, runtime-coordination, events-jsonl-truncation-guard, events-compaction, replay, porting-store, merge, worktree, approve, catchup, sync-root, return, claim, session, main-checkout, architecture, config-merge, doctor-coordination-checks); script đo topology `/tmp/exp1-topo.mjs` (repo thường, linked worktree, symlink, `/dev/shm`, `--separate-git-dir`, bare, submodule, và sống sót qua `clean -fdx`, `gc --prune=now`, `reset --hard`, `stash -u`, `worktree remove`); script đo shard `/tmp/exp1-rpo.mjs`.

**Chưa chạy (chỉ suy luận):** toàn bộ `npm test` (chỉ 66 file); hai worktree thật ghi đồng thời qua CLI vào cùng open shard (chỉ chứng minh resolver cho cùng đường dẫn); seal, khôi phục sau sập, EXDEV; hook pre-commit và truncation guard dưới thay đổi (không sửa chúng); mọi nhãn DIES ghi [đọc]; đo độ trễ của `git rev-parse`; điều tra 21 fail có sẵn ở baseline.

## 6. Câu hỏi mở

1. 21 test đỏ ở baseline là do môi trường (host binary kiểu `FGOS_HOST_BIN`, phiên bản git 2.53, hook) hay lỗi thật của repo? Cần biết để delta "+4" không bị trộn với nhiễu.
2. Seal theo sự kiện nào là chấp nhận được cho owner: writer kết thúc, ngưỡng thời gian (hiện 3600 giây ở D2), hay kích thước? RPO thực tế phụ thuộc vào đây.
3. Registry ghi rõ là "không fs, không git"; tôi vẫn thêm khóa `OPEN_SHARDS_DIR` gọi `execFileSync('git')`, hợp lệ với test kiến trúc (kernel gọi kernel) nhưng phá lời hứa trong comment đầu file. Cổng vị trí (storage-location port) đúng ra phải là một tầng riêng ngoài registry, như F8 của packet đề nghị.
4. Có nên gỡ `merge=union` ngay trong thí nghiệm hai (seal/merge hai worktree) để G-089/G-121 được chứng minh thay vì đọc không?
