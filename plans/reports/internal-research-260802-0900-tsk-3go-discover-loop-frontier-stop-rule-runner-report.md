# Internal Research: tsk-3go discover-loop — frontier condition, stop rule, fgos-runner

Nghiên cứu nội bộ (đọc code thật, không cần web search). Verified 2026-08-02.
Builds on prior report: `tsk-3go-discover-loop-260731-1510-stop-rule-and-worktree-question-report.md`
(đã trả lời xong câu hỏi worktree: KHÔNG cần worktree — `discover`/`decompose`
không bao giờ ghi vào git tree, chỉ ghi vào `.fgos/events.jsonl` được khóa bằng
`.fgos/events.lock`. Câu trả lời đó vẫn đúng, không đổi.)

## Câu hỏi 1: điều kiện frontier cho "next"

Không có sẵn hàm nào chọn "clarify/decompose item tiếp theo" trong code hiện tại.

- `frontier()` (`src/state/frontier.mjs:78-98`) — cái mà `ready`/`merge-next`/
  `fgos-runner` dùng — chỉ trả về item ở **stage `executing`** (Execute-stage,
  domain-mapped), không bao giờ trả `clarify`/`decompose`. Điều kiện: `status
  === 'todo'`, không có descendant còn mở, mọi dep đã ở trạng thái resolved
  (`delivered/retrospective/cleanup/done/wontfix`).
- Có field `priority` thật, được tính bởi `computePriority`, ghi trong
  `discovery.mjs:330-335` (rough pass ở clarify) và refine lại ở
  `decompose.mjs` — đây chính là công của `tsk-4y5`
  (`docs/reference/priority-formula-and-intent-retirement.md`). Sort order
  hiện có: `compareReadyOrder` (frontier.mjs:121-133) — priority ASC (thiếu
  thì xếp cuối), rồi FIFO theo thứ tự khai báo.
- **Không có pool/order riêng cho clarify vs decompose.** `fgos-runner`
  (xem câu 3) tự quét hai vòng riêng biệt (`stage===clarify` rồi
  `stage===decompose`, đều `status==='todo'`) mà không sắp xếp gì thêm —
  đơn giản là lặp theo thứ tự item trong state.

**Kết luận cho `/fgOS:discover-next` (đã chỉnh sau thảo luận 2026-08-02):**
không dùng skill-level ad-hoc filter — thêm 1 hàm backend riêng, quét mọi item
`stage in {clarify, decompose}` và `status==='todo'`, ưu tiên clarify trước
(đúng mô tả gốc tsk-3go). **2 pool sort khác nhau, không dùng chung
`priority`:**

- **stage:decompose** — sort `priority` ASC (thiếu xếp cuối) rồi FIFO, y hệt
  `compareReadyOrder`. Hợp lý vì mọi item tới decompose đều đã qua discover 1
  lần, priority đã có sẵn.
- **stage:clarify** — **KHÔNG dùng `priority`**. Verify: `computePriority`
  (`priority-formula.mjs:75-80`) tính `raw = impact*w*d/e`; `impact` mặc định
  `0` khi thiếu `semanticRelatedness` (`verdict.impactScore`, chỉ có SAU khi
  LLM judge chạy) → `raw` luôn `0` → priority luôn = hằng số cố định
  (`PRIORITY_SCALE`) cho MỌI item chưa từng discover — không phân biệt được
  gì, sort priority ở đây là no-op/misleading trên phần lớn backlog hiện tại
  (~49 item chưa có priority). Thay bằng `blocks` (số việc khác đang bị item
  này chặn, từ `rankImpact`/`src/state/graph-harness.mjs` — **thuần cấu trúc
  dependency graph, không cần LLM**, cùng hàm `merge`'s `mergeReadiness` đang
  dùng, và cùng hàm `blocksForItem` discovery.mjs gọi nội bộ, `discovery.mjs:
  66-69`) DESC, rồi `urgent` flag (true trước), rồi FIFO.

Priority vẫn backfill đúng như "side benefit" mô tả gốc (mỗi lần discover
chạy thật sẽ ghi priority) — chỉ là picker không dựa vào nó để sort pool
clarify, vì nó chưa tồn tại có ý nghĩa tại thời điểm đó.

## Câu hỏi 2: stop rule — tại sao dừng khi park awaiting-human 2 lần?

Đã verify trực tiếp: **giả định "park 2 lần mới dừng" trong mô tả gốc là copy
từ merge-loop mà chưa kiểm tra code — nó KHÔNG áp dụng đúng cho discover/decompose.**

Bằng chứng: `putInAwaiting` (`src/state/store.mjs:570-582`) gọi
`moveWork(dir, { id, to: 'awaiting-human', ... })` — tức là **status của item
đổi thành `awaiting-human` ngay từ lần park ĐẦU TIÊN**, không phải giữ nguyên
`todo`. Một khi status đổi, item tự động rời khỏi tập hợp "stage:clarify/
decompose, status:todo" — vòng lặp tiếp theo không thể chọn lại nó nữa, vì
nó không còn khớp điều kiện lọc.

So sánh với merge-loop: `merge next` bị "blocked" (verify-fail, Iron Law...)
thì item **KHÔNG đổi status** — nó vẫn nằm nguyên trong ready pool, nên nếu
không có rule "2 lần thì dừng", merge-loop sẽ chọn lại đúng item đó vô hạn
lần. Đó là lý do merge-loop cần rule này. Discover/decompose không có nguy cơ
đó — cơ chế FSM tự loại item ra khỏi pool ngay khi park.

**Vậy: ý của bạn đúng — chạy cho đến khi hết là hợp lý, và rule "park 2 lần"
nên bỏ hẳn, không phải chỉnh thành "1 lần".** Nó không có tác dụng bảo vệ gì
cả trong trường hợp discover/decompose, vì tình huống nó nhắm tới (cùng
1 item bị chọn lại lặp lại) không thể xảy ra qua con đường "park" bình
thường.

**Sửa lại theo thảo luận tiếp (2026-08-02): loop không nên dừng vì 1 item
riêng lẻ, dù park hay lỗi — chỉ nên skip item đó, log lại, đi tiếp.** Dừng
cả loop vì 1 item hỏng chặn tiến độ mấy chục item còn lại, sai y như dừng
vì park. Nhưng cần phân biệt lỗi nào skip-được, lỗi nào phải dừng thật —
verify code:

- **CAS conflict** (`FsmError('conflict', ...)`, `src/state/fsm.mjs:204-208`)
  — verify: đây là so sánh field-level TRÊN CHÍNH item đó (`work.status !==
  expectedStatus`), không phải version/counter toàn cục. `moveWork`/
  `moveStage` (`store.mjs:355-369`, `612-621`) chỉ rebuild và so sánh status/
  stage của đúng 1 `id` được truyền vào — conflict ở item A không nói gì về
  item B. Conflict chỉ xảy ra khi có 1 writer KHÁC đang race đúng item đó
  trong cùng khoảnh khắc (runner, session khác gọi `move`/`answer`/`take`
  trên cùng id) — không lan sang item khác. **→ an toàn để skip-và-tiếp-tục,
  không phải tín hiệu hạ tầng.**
- **Lock timeout** (`EventLogError('lock-timeout', ...)`, `src/state/
  events.mjs:309-314`, `EVENTS_LOCK_TIMEOUT_MS=2000`) — đây MỚI là lỗi hạ
  tầng thật như bạn nghi ngờ: `.fgos/events.lock` khóa chung TOÀN BỘ log cho
  mọi item, nếu 1 process khác giữ lock quá 2s (stuck/crash), MỌI lần
  append tiếp theo — bất kể item nào — đều timeout y hệt. Đây chính là
  trường hợp "conflict item A thì cũng conflict tiếp item B", chỉ có điều
  đúng tên gọi là `lock-timeout` chứ không phải `conflict`.
  **→ không skip-được, phải dừng cả loop, báo người dùng kiểm tra process
  nào đang giữ lock** (tương tự hướng xử lý của `/fgOS:unlock` cho
  `main-checkout.lock` — khác lock, cùng kiểu sự cố "ai đó đang giữ khóa").

Tóm gọn phân loại lỗi cho `/fgOS:discover-loop`:
| Loại lỗi | Phạm vi | Xử lý |
|---|---|---|
| park awaiting-human | per-item, bình thường | skip, tiếp tục |
| CAS conflict | per-item, do race đúng id đó | skip, log, tiếp tục |
| lock-timeout | hạ tầng, ảnh hưởng mọi item | **dừng cả loop**, báo lock bị giữ |
| iteration cap chạm | giới hạn cứng, không phải lỗi | dừng, không phải bug |

Iteration cap giữ như safety valve độc lập, không liên quan logic trên.
Báo cáo trước (2026-07-31) đề xuất cap mặc định 10-15/lần vì cost (49 item
tồn đọng = 49+ lần gọi LLM judge thật). Bạn muốn chạy hết — vẫn nên giữ cap
làm giới hạn cứng (an toàn, không phải rule nghiệp vụ), có thể đặt cao
(vd 50-100) hoặc bỏ qua bằng flag nếu chủ động muốn "chạy hết một lần".

**Về việc "không mất thông tin khi park"** — đã verify (không phải suy
đoán): `discovery.mjs:314` gọi `addDiscovery` **trước** khi rẽ nhánh
`clear`/`unclear`, tức mọi lần park đều đã ghi discovery entry (câu hỏi,
impactScore...) vào state trước khi item vào awaiting-human.
`decompose.mjs` tương tự — `addDecision`/`logDecomposeVerdict` chạy ở mọi
nhánh kể cả `need-human`. Khi người sau `answer`, `answerAwaiting` đọc lại
`gates[id].statusAtAsk` để resume đúng chỗ, và judge lần sau đọc lại gate cũ
(`decompose.mjs:112-114`) để không hỏi lại câu đã trả lời. Data thật minh
chứng: `tsk-62d`'s discovery array có 1 entry `clear:false` (câu hỏi) rồi
1 entry `clear:true` sau (đã trả lời) — không mất gì. Điều bạn lo (đảm bảo
lưu trữ đủ để người quay lại có đủ thông tin) **đã được đảm bảo sẵn trong
code hiện tại**, không cần discover-loop tự làm thêm gì cho việc này.

## Câu hỏi 3: fgos-runner là gì

`bin/fgos-runner.mjs` — 1 tiến trình **riêng biệt, chạy nền (background
daemon)**, không phải cùng loại với discover-loop bạn muốn xây.

- Chạy bằng `--watch` (hoặc `--once` cho 1 lần quét): vòng lặp polling mỗi
  ~5s (`pollMs` mặc định), chạy tới khi nhận SIGINT/SIGTERM.
- Mỗi chu kỳ: **quét TOÀN BỘ** item `stage:clarify,status:todo` gọi
  `resolveDiscovery`, rồi TOÀN BỘ item `stage:decompose,status:todo` gọi
  `resolveDecompose` (`src/runner/loop.mjs:970-1000`) — đúng 2 hàm y hệt mà
  verb CLI `discover`/`decompose` gọi, chỉ khác `role: 'runner'` thay vì
  `'session'`. Sau đó mới tới quét frontier Execute-stage và dispatch worker
  chạy thật (`execute`).
- Output đi 3 chỗ: (1) trace in thẳng ra console không có format, (2) kết
  quả cuối envelope JSON in gọn ra stdout, (3) log chi tiết từng item ghi
  vào `.fgos/logs/<id>.log` — **thư mục này bị gitignore, không commit, không
  hiện qua `fgos show`/`fgos list`** — đây chính là ý "hidden/opaque" trong
  mô tả gốc tsk-3go: nó có chạy, có xử lý, nhưng muốn xem tiến trình phải tự
  tail file log, không tự nhiên thấy trong 1 terminal đang mở.
- Hiện tại (theo mô tả gốc tsk-3go): `.fgos-runner.json` tồn tại nhưng
  **không có process nào đang chạy** — tức backlog 49 item clarify không
  được ai tự động xử lý ngay bây giờ.

**Vì sao discover-loop khác/cần thiết:** mục tiêu đầu của bạn là chạy NGAY
TRONG agent-terminal đang mở (interactive `/loop` session) — thấy được từng
bước, từng quyết định, ngay trên màn hình đang tương tác, không phải tail
log file riêng. Về mặt kỹ thuật, discover-loop gọi **đúng cùng 2 verb**
(`fgos discover <id>`, `fgos plan <id>`) mà runner gọi bên trong —
khác nhau ở chỗ driver là 1 agent session tương tác (nhìn thấy trực tiếp,
dừng được bất cứ lúc nào, không cần daemon/process riêng) thay vì 1 tiến
trình nền vô hình. Không cạnh tranh nhau về mặt dữ liệu — cả hai đều ghi
qua `appendEvent` có khóa (`events.lock`), chạy song song an toàn nếu có ai
đó bật lại runner.

## Câu hỏi 5: item dừng ngay ở stage sau discover — bảo đảm bằng gì?

Verify: `case 'discover'`/`case 'decompose'` (`bin/fgos.mjs:883-916`) chỉ gọi
`return resolveDiscovery(...)` / `return resolveDecompose(...)` rồi hết —
process CLI trả JSON envelope và kết thúc ngay, không có bước nào nối tiếp.
Import duy nhất từ `dispatch.mjs` trong `discovery.mjs`/`decompose.mjs` là
`modelForTier` (chỉ để chọn model cho LLM judge), **không** import/gọi
`dispatch`/`runOnce`/`execute` nào — verify bằng grep, 0 match.

Vậy: **không cần cơ chế guard riêng nào cả.** Item tự dừng đúng ngay
sau discover/decompose vì bản chất `fgos discover <id>` là 1 lệnh CLI gọi
xong trả kết quả xong — không có "tiếp diễn tự động" nào tồn tại trong code
đường này (khác `fgos-runner`, nơi `runOnce`/`runWatch` CHỦ ĐỘNG nối sweep
clarify/decompose sang bước dispatch execute ngay sau, `src/runner/
loop.mjs:970-1000` → tiếp theo trong cùng file).

Điều kiện duy nhất cần giữ kỷ luật ở tầng `/fgOS:discover-next` (SKILL.md,
không phải code lõi): chỉ gọi `fgos discover`/`fgos plan`, KHÔNG được
tự thêm bước gọi `fgos take`/`pick`/`execute` sau khi thấy verdict `clear`
(item vừa chuyển `stage: executing`) — đó là việc của `/fgOS:pick`, ngoài
scope tsk-3go. Đây là 1 việc "đừng làm thêm" ở cấp thiết kế skill, không
phải bug cần vá ở cấp code.

## Câu hỏi 6: discover có tự quyết clear/unclear không, hay đợi decompose?

Verify: **discover tự quyết ngay, không đợi decompose.** `judgeDiscovery`
chạy tại `discovery.mjs:313`, `verdict.clear` trả về ngay trong cùng lệnh —
nhánh `clear` (`discovery.mjs:340-348`) và nhánh `unclear`
(`discovery.mjs:354`) đều xử lý xong tại chỗ, không phụ thuộc `decompose`
được gọi hay chưa.

Nhưng đúng như quan sát: **có 2 tầng unclear độc lập** — đây là kiến trúc
cố ý, không phải bug. Xác nhận `docs/reference/work-item-pipeline-stages-
verbs-and-handoffs.md:69-70`: "cùng 1 shape lặp lại ở cả `clarify` và
`decompose`: 1 mechanical judge riêng mỗi tầng":
- `judgeDiscovery` (stage `clarify`) — hỏi: item MUỐN LÀM GÌ đã rõ chưa
  (product-level ambiguity). Skill người dùng tương ứng: `fgos-coding-exploring`.
- `judgeDecompose` (stage `decompose`, verb riêng) — hỏi câu KHÁC hẳn:
  biết muốn làm gì rồi, nhưng chia sao/kích cỡ/effort/blast-radius rõ chưa
  để tách con hay pass-through. Skill tương ứng: `fgos-coding-planning`/
  `fgos-coding-validating`.

Vậy "discover clear" chỉ nghĩa **tầng 1 hết mơ hồ**, KHÔNG có nghĩa "xong
hẳn, không hỏi nữa" — item qua `stage:decompose` có thể vẫn unclear ở tầng
2, vì lý do hoàn toàn khác câu hỏi cũ ở tầng 1. 2 tầng độc lập, mỗi tầng có
quyền tự park riêng, không liên quan/chồng lấn nhau.

**Không ảnh hưởng thiết kế discover-loop đã chốt:** pool quét
`stage in {clarify, decompose}` đã tự nhiên coi đây là 2 item-state riêng
biệt — mỗi lần gọi discover/decompose đều tự trả lời độc lập tại chỗ,
không cần logic chờ/nối giữa 2 tầng.

## Đề xuất shape đã chỉnh cho tsk-3go

- `/fgOS:discover-next`: tự quét `stage in {clarify, decompose}, status:todo`,
  ưu tiên clarify trước, sort theo `priority` có sẵn (thiếu thì xếp cuối),
  gọi `fgos discover <id>` / `fgos plan <id>` trực tiếp trên main
  checkout — không worktree, không branch, không merge (đã confirm ở báo
  cáo trước).
- `/fgOS:discover-loop`: `/loop` bọc quanh discover-next. Stop rules:
  - pool rỗng (không còn item nào match) — điều kiện dừng chính, đúng như
    bạn muốn "làm cho đến khi hết".
  - lock-timeout trên bất kỳ item nào — dừng ngay, hạ tầng thật (xem bảng
    phân loại lỗi ở câu hỏi 2), không skip được.
  - iteration cap — safety valve độc lập, không phải rule nghiệp vụ; giá
    trị mặc định để implementer quyết ở bước planning.
  - **KHÔNG dừng** vì: item park awaiting-human, hoặc CAS conflict per-item
    — cả hai chỉ skip item đó rồi đi tiếp.
- Bỏ hẳn rule "park 2 lần" khỏi mô tả gốc — không có cơ sở kỹ thuật, đã
  verify item tự rời pool sau lần park đầu.
- Optional: `/fgOS:terminal` mỗi vòng để đổi tên herdr pane.

## Câu hỏi chưa giải quyết

- Cap iteration mặc định: số cụ thể — để implementer quyết ở
  `fgos-coding-planning`.
- Có nên in tổng kết cuối loop (N cleared, N parked awaiting-human, N lỗi)
  để người xem lại nhanh không — chưa quyết, hợp lý nhưng để planning.
- Không tìm thấy UI "resume từ chỗ loop dừng" nào ngoài `fgos show`/`gates` —
  nếu cần trải nghiệm resume rõ hơn cho người quay lại, đó là phần mở rộng
  ngoài scope tsk-3go hiện tại.
