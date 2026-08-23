# Research: tsk-4rd — nâng cấp `fgos discover` lên mức nghiên cứu sâu

Internal-only research (không cần web search — mọi câu hỏi trả lời được bằng
cách đọc code thật + báo cáo distill đã có sẵn trong repo). Verified 2026-08-02.

## 1. Restated goal (tsk-4rd, dep tsk-545)

`fgos discover` hiện tại là **một lệnh gọi LLM duy nhất, không lặp lại, không
có web research** — chạy `discover-loop` 15 vòng trên backlog thật ra kết quả
`cleared=0, parked=4/4`: không item nào thật sự được làm rõ thêm, chỉ bị đóng
dấu "chưa rõ" và park lại `awaiting-human`.

Yêu cầu nâng cấp, 4 phần:

1. **Làm sạch yêu cầu** — tự đọc-hiểu và phát biểu lại title/description cho
   hoàn chỉnh, có thể ghi đè lại chính work item.
2. **Enrich bằng context liên đới** — tìm task đã làm/chưa làm liên quan để
   biết rõ scope hơn (không chỉ đếm số block/dep như hiện tại).
3. **Phân loại rõ/chưa rõ** dựa trên dữ liệu đã thu thập (đã có, nhưng dựa
   trên dữ liệu quá mỏng).
4. **Tự lập plan thu thập thêm** (scan code + research online) *trước khi*
   kết luận chưa rõ — không cần người tham gia ở bước này; chỉ hỏi người khi
   thật sự cần quyết định.

Câu hỏi phụ của user: việc thu thập/tạo thông tin này có cần worktree không,
có conflict không — và: distill kỹ ck:research, ck:scout, superpowers xem có
gì tận dụng được, đặc biệt về kinh tế (capacity) và điều phối song song.

## 2. Kiến trúc discover hiện tại (đọc trực tiếp code)

### 2.1 Hai đường dẫn tồn tại song song, khác hẳn năng lực

| | `fgos discover <id>` (mechanical, CLI/runner sweep) | `fgos-coding-exploring` skill (interactive session) |
|---|---|---|
| Nơi chạy | headless: `node bin/fgos.mjs discover` hoặc runner's RUL19 sweep | trong 1 session Claude Code thật, sau `fgos pick` |
| Model call | 1 lần `claude -p` lồng nhau (`judge-executor.mjs`), tối đa 3 attempt chỉ retry khi *parse* JSON lỗi | agent thật, có toàn bộ tool của session |
| Tool cho phép | `--allowedTools "Bash(rg:*),Bash(git add:*),Bash(git commit:*)"` — **không WebSearch, không Task, không Read/Grep/Glob rộng** | mọi tool: Explore, WebSearch, Task (song song), Read, Grep... |
| Input | title/kind/risk/refs/deps + graph metrics (block count, stale-blocked, component size) + **1 lần scout-notes cache** | tự do: đọc description đầy đủ, đọc CONTEXT.md, chạy `fgos tool query`, tự chọn keyword để scout |
| Output | JSON 1 dòng: `{clear, question?, verify?, impactScore?}` — **không có field sửa title/description** | `docs/history/<feature>/CONTEXT.md` — quyết định có D-ID, thuật ngữ pin, bằng chứng scout |
| Vòng lặp | không — 1 câu hỏi → clear hoặc park, hết | Socratic nhiều vòng, `fgos ask`/`fgos answer` |

**Kết luận:** discover-loop hiện tại route MỌI item qua đường mechanical rẻ
tiền — đường có năng lực thấp nhất trong 2 đường đang tồn tại. Item genuinely
cần đào sâu (không phải câu hỏi 1 dòng trả lời được) → mechanical judge
**không có công cụ để tự làm** việc đó, nên park là đúng theo thiết kế hiện
tại, nhưng đúng theo nghĩa "không làm gì cả rồi bó tay", không phải "đã cố
hết sức".

### 2.2 Root cause cụ thể của "15 rounds toàn unclear"

Đọc `src/intake/judge-executor.mjs` (`readScoutNotes`/`writeScoutNotes`):

- Scout notes (`docs/history/<docsRef>/scout-notes.md`) chỉ được **capture 1
  lần duy nhất** — `capture: !priorScoutNotes`. Vòng phán đầu tiên chạy
  `rg` một lần, lưu lại; **mọi lần discover sau đó tái dùng NGUYÊN VĂN note
  cũ, không bao giờ scout lại** — kể cả khi note đầu quá mỏng/không đủ.
  → Nếu lần scout đầu tiên không đủ evidence, item đó **kẹt vĩnh viễn** ở
  mức thông tin của lần đầu, mỗi vòng discover sau chỉ là hỏi lại model với
  cùng dữ liệu cũ → gần như chắc chắn ra cùng 1 verdict "unclear".
- Verdict schema (`buildDiscoveryPrompt`) không có chỗ cho model đề xuất
  title/description mới, không đọc description/content của các item liên
  quan trong `deps`/`refs` (chỉ liệt kê id), không có bước "tự lập plan rồi
  đi làm" — mọi thứ gói trong 1 prompt, 1 câu trả lời.
- `--allowedTools` không có `WebSearch`/`WebFetch`/`Task` — dù muốn, model
  headless này **không thể** tự research online hay tự spawn song song, bất
  kể prompt yêu cầu gì.

→ Đây không phải bug ngẫu nhiên, mà là giới hạn thiết kế: mechanical judge
được xây để rẻ + nhanh cho item ĐàGiá rõ ràng, không phải để làm nghiên cứu.

## 3. Hạ tầng đã có sẵn nhưng chưa dùng (đòn bẩy rẻ nhất)

### 3.1 `capacities.judge-discovery` — điểm cắm đã tồn tại, đang là no-op

`.fgos/config.json` (canonical hôm nay — `shared-config-file.mjs`'s
`readSharedConfig` đọc file này trước, chỉ fallback về legacy
`.fgos-runner.json` khi `.fgos/config.json` chưa tồn tại; repo này đã có cả
2, nội dung `runner` key hiện giống hệt `.fgos-runner.json`) đã khai:
```json
"runner": { "capacities": {
  "judge-discovery": { "kind": "task" },
  "judge-decompose": { "kind": "task" }
} }
```
Nhưng `resolveExecutorConfig` (`dispatch.mjs:626`): `byCapacity = capacity &&
(capacity.adapter || capacity.command) ? capacity : undefined` — entry này
KHÔNG có `command`/`adapter`, nên **luôn fallback về `executors.judge`** y
hệt hôm nay. `kind: "task"` là vocabulary đặt trước ("in-session Agent/Task
dispatch") nhưng **không có cơ chế thật nào implement nó** — và về bản chất
không thể implement cho 1 hàm headless (`judgeDiscovery` chạy như plain
Node function/subprocess, không nằm trong 1 session Claude Code thật, nên
không có Task tool để gọi).

→ Muốn discover thật sự "nghiên cứu song song" kiểu ck:scout, có 2 hướng
khác nhau, không phải 1:

- **(A) Rẻ, tận dụng ngay:** giữ nguyên kiến trúc `claude -p` lồng nhau, chỉ
  **mở rộng `executors.judge.args`'s `--allowedTools`** thêm
  `WebSearch,WebFetch,Task,Read,Grep,Glob`. `claude -p` (print/headless
  mode) VẪN hỗ trợ đầy đủ tool bao gồm Task — **đã test thật, xem 5.5.3a**:
  agent tự spawn 2 subagent Task song song ngay trong 1 lần gọi `-p`,
  không worktree, không lỗi, kết quả đúng. Giới hạn hiện tại thuần túy do
  `--allowedTools` bị khoá cứng ở 3 quyền Bash, không phải giới hạn kỹ thuật
  của headless mode. Đây là thay đổi config, không phải kiến trúc mới.
- **(B) Đắt, đúng nghĩa "kind: task":** thật sự cho `fgos-coding-exploring` (chạy
  trong session thật, có Task tool) đảm nhận việc research sâu — tức là
  route MỌI item cần đào sâu (không chỉ item "rõ ràng đơn giản") qua
  `fgos-coding-exploring` thay vì qua discover-loop mechanical. Đây gần với thiết
  kế đã có sẵn hôm nay, chỉ cần discover-loop **biết khi nào nhường** thay
  vì tự ôm hết.

### 3.2 Chi phí thực tế theo item, không cố định

`judgeDiscovery` dùng `work.tier` (light/standard/heavy →
haiku/sonnet/opus) qua `cfg.models`, không phải model cố định — vòng
discover của 1 item `tier: light` rẻ hơn nhiều so với `tier: heavy`. Muốn
"tận dụng capacity" mà không đốt tiền vô tội vạ, việc mở rộng allowedTools ở
mục 3.1(A) nên đi kèm 1 quyết định: có escalate tier khi item chưa rõ sau
lần thử research đầu không (giống `escalateTier` cơ chế đã có sẵn trong
`runRetryingExecutor`, hiện chỉ `runJudgeExecutor` chưa dùng tới).

## 4. Trả lời câu hỏi worktree/conflict

**Không cần worktree, với điều kiện giữ discipline hiện tại: chỉ ghi file
plain (không git-write) vào `docs/history/<docsRef>/` trên main checkout.**

Bằng chứng (đã có báo cáo trước xác nhận, `tsk-3go`
`plans/reports/tsk-3go-discover-loop-260731-1510-stop-rule-and-worktree-
question-report.md`, và tự kiểm tra lại cho item này):

- `discovery.mjs`/`decompose.mjs`: `grep -n "writeFileSync\|fs\.write" ` →
  0 match trong 2 file gốc; **duy nhất `judge-executor.mjs`'s
  `writeScoutNotes`** ghi file thật (`scout-notes.md`) — plain
  `fs.writeFileSync`, **không git add/commit**.
- Mọi state change (`editWork`, `moveStage`, `addDiscovery`,
  `putInAwaiting`) đi qua `.fgos/events.jsonl` — log dùng chung, đã có
  cross-process lock (`events.lock`) bảo vệ ghi đồng thời. `fgos-runner`
  sweep lẫn `discover-loop` chạy tuần tự/song song trên main checkout đều
  an toàn nhờ lock này, không cần cô lập bằng worktree.
- Item chỉ thật sự cần worktree khi được **claim** (`fgos pick`) để đi vào
  `fgos-coding-exploring`/`fgos-coding-planning`/`executing` — những skill ĐÓ ghi
  `CONTEXT.md`/code thật và commit lên `fgw/<id>`. Discover không claim
  item, nên chưa tới bước cần worktree.

**Rủi ro thật cần lưu ý nếu nâng cấp theo hướng 3.1(A):** research report/
scout notes phong phú hơn vẫn nên ở dạng plain file dưới
`docs/history/<docsRef>/`, KHÔNG git-commit ở bước discover — giữ đúng
discipline "discover không viết git tree" đã verify ở trên. Nếu để model
tự ý `git add`/`git commit` (allowedTools hiện đã cho phép 2 quyền này!),
cần xem lại: có nên bỏ luôn 2 quyền git đó khỏi judge executor không, vì
non hiện tại đang cho phép commit nhưng discovery.mjs chưa bao giờ dùng tới
(không rõ đây là chủ ý dự phòng hay leftover).

Về conflict giữa nhiều item chạy song song: mỗi item ghi vào
`docs/history/<own-docsRef>/` riêng — không đụng nhau. Nếu tương lai muốn
`discover-loop` chạy N item cùng lúc (không tuần tự như hôm nay), an toàn về
mặt file; an toàn về `.fgos` state cũng đã có sẵn (lock). Cái CHƯA có sẵn là
cơ chế dispatch song song ở tầng `discover-loop`/`discover-next` — hiện 2
skill này chạy **tuần tự từng item một** (`/loop` gọi `/fgOS:discover-next`
lặp lại), không phải song song thật.

## 5. Distill ck:research / ck:scout / superpowers — cái gì đặc biệt, dùng được gì

### ck:research (skill vừa chạy để làm báo cáo này)
4 phase: Scope → multi-source gather (WebSearch/Gemini, tối đa 5 lần gọi,
đọc kỹ) → synthesis → report có structure cố định, luôn liệt kê unresolved
questions cuối bài. Điểm khác biệt lớn nhất so với discover hiện tại: **có
ngân sách rõ ràng** (max 5 tool call) và **luôn kết thúc bằng report file +
unresolved questions**, không phải 1 câu hỏi đơn.

### ck:scout
Chia nhỏ codebase theo thư mục, spawn N `Explore` subagent song song (qua
Task tool), gom kết quả — chính là mô hình "điều phối song song" user nhắc
tới. Áp dụng được cho discover NẾU discover chạy trong 1 session thật (route
3.1(B)) — không áp dụng được cho discover headless (route 3.1(A)), vì
headless `claude -p` không có Task tool multi-agent thật theo kiểu
`ck:scout` (nó tự spawn Task nội bộ trong chính process đó, không phải song
song nhiều process ck:scout kiểu điều phối từ session cha).

### superpowers (obra) — 3 pattern áp dụng trực tiếp

1. **`brainstorming-hard-gate`** — chính là hình mẫu gần nhất cho yêu cầu #1
   (làm sạch yêu cầu) + #4 (tự nghiên cứu trước khi hỏi người): context →
   questions → 2-3 approach → design write-up, có `<HARD-GATE>` cấm code
   trước khi design được duyệt. `fgos-coding-exploring` hiện đã là bản rút gọn của
   pattern này (Socratic, scout trước khi hỏi) — cái thiếu là bản
   **mechanical/headless** của nó, đúng thứ tsk-4rd đang xin.

2. **`sdd-ledger-and-circuit-breaker`** — pattern trực tiếp giải quyết vấn đề
   "15 rounds parked toàn unclear": ghi 1 ledger persist (`progress.md` kiểu
   `discovery` log đã có sẵn trong `view.discovery[id]`), giới hạn round tối
   đa (VD 3), sau round cuối phải có **circuit breaker** buộc quyết định rõ
   ràng (park thật sự có ruling, hoặc escalate model, không lặp vô hạn cùng
   1 câu hỏi). Discover hiện tại đã có `view.discovery[id]` là mầm ledger —
   chỉ thiếu circuit breaker và thiếu escalate-on-repeat.

3. **`positive-instruction-doctrine`** — dữ liệu thực nghiệm (không phải suy
   đoán): prohibition/tripwire hiệu quả, nhưng "composition prohibition"
   (dặn dò kiểu văn phong) đo được **phản tác dụng**. Áp dụng khi viết lại
   `buildDiscoveryPrompt`: nên cho model 1 "recipe" cụ thể các bước phải làm
   (scope → scout → enrich từ deps/refs → tự nghiên cứu nếu thiếu → phán),
   không phải danh sách cấm đoán dài.

## 5.5. Unified recipe — 1 năng lực chung "research-and-brainstorm"

Đối chiếu đề xuất của user (discover + fgos-coding-exploring dùng chung 1 năng lực,
khác nhau ở có/không có con người) với kiến trúc thật:

### 5.5.1 Xác nhận: điểm "clear thì skip exploring" đã tồn tại sẵn

Không phải ý tưởng mới — `resolveDiscovery` hôm nay: verdict `clear=true` →
`moveStage(...to:'decompose')` thẳng, không bao giờ gọi `fgos-coding-exploring`.
Mental model của user khớp thiết kế thật ở điểm này.

### 5.5.2 Xác nhận: giai đoạn có người đã là collaboration loop dùng lại skill

`fgos-coding-exploring/SKILL.md` bước 2 đã là Socratic loop (scout trước mỗi câu
hỏi, `fgos ask`/`fgos answer` park-rồi-resume). 2 case:
- **Async** (park → người trả lời sau, có thể session khác pick up) — "dùng
  lại skill" đúng nghĩa đen: skill load lại từ đầu ở session mới.
- **Sync** (cùng 1 session, người trả lời ngay) — thực chất là loop bên
  trong 1 lần skill chạy, không phải re-invoke, nhưng hiệu quả tương đương.

### 5.5.3 "1 năng lực chung" đúng ở tầng recipe, không đúng ở tầng thực thi

**Recipe** (scope gray area → scout → enrich từ related item → tự đánh giá
rõ/chưa → nếu chưa, tự nghiên cứu thêm trước khi hỏi) nên gộp về 1 nguồn
dùng chung. Hiện tại `discovery.mjs`'s `buildDiscoveryPrompt` (JS template,
hardcode) và `fgos-coding-exploring/SKILL.md` (markdown prose) định nghĩa "thế nào
là đủ rõ" **độc lập nhau, không tham chiếu nhau** — rủi ro thật: 2 định
nghĩa lệch dần theo thời gian khi 1 bên được sửa mà bên kia không theo
kịp. Gộp về 1 spec/recipe chung, cả 2 nơi cùng trích dẫn, giải quyết đúng
rủi ro này — hợp lý, nên làm.

**Thực thi** ban đầu tưởng khác bản chất do headless không có live session —
**đã test thật (5.5.3a) và SAI**, sửa lại:

| | Autonomous (discover, không người) | Interactive (exploring, có người) |
|---|---|---|
| Nơi chạy | headless `claude -p` lồng (subprocess) | session Claude Code thật |
| Task tool (parallel dispatch) | **CÓ — đã test thật, xem 5.5.3a** | có — parallel scout thật (kiểu ck:scout) |
| Research trong 1 lượt | multi-tool + Task song song, y hệt interactive nếu `--allowedTools` mở đủ | multi-tool + Task song song |
| Khi bí | phải tự kết luận park (không ai để hỏi ngay) | hỏi người qua `fgos ask`, chờ `fgos answer` |

→ Khác biệt thật giữa 2 lớp thực thi **chỉ còn 1 dòng**: có người để hỏi
hay không, chứ không phải năng lực tool. "1 năng lực chung" khả thi ở mức
cao hơn ban đầu nghĩ: có thể dùng **chung 1 bản script hoá** (chung
allowedTools, chung recipe) cho cả 2 lớp — lớp autonomous chỉ khác ở chỗ
KHÔNG được gọi `fgos ask` (không ai trả lời), phải tự quyết định park có
ruling rõ ràng thay vì hỏi.

#### 5.5.3a Bằng chứng thật (test trực tiếp trong session này)

```
claude -p "You must use the Task tool (subagent_type=Explore) to launch
exactly 2 subagents IN PARALLEL: agent 1 counts .mjs files under
src/intake/, agent 2 counts .mjs files under src/state/. Only use Task,
not Bash/Read yourself. Reply: 'intake=<N> state=<M>'." \
  --model haiku --permission-mode acceptEdits --allowedTools "Task" \
  --output-format stream-json --verbose
```

Kết quả thật (NDJSON transcript): 2 `tool_use` block tên `Agent`
(subagent_type Explore) phát ra CÙNG LÚC trong 1 assistant turn — đúng
nghĩa song song, không tuần tự; mỗi subagent tự chạy `Bash` riêng (subagent
không bị giới hạn bởi `--allowedTools "Task"` của parent — permission scope
riêng theo agent type); `num_turns: 3`, `is_error: false`; final result
đúng `intake=5 state=24`. Không tạo worktree, không lỗi, exit 0.

**Kết luận:** headless `claude -p` là 1 agent session đầy đủ (không phải
"chạy 1 phát rồi thôi" như tên "print mode" gợi ý) — có thể tự lặp nhiều
tool call, tự spawn Task song song, trước khi trả câu cuối. Giới hạn của
discover hôm nay 100% do `--allowedTools` bị khoá cứng ở
`Bash(rg:*),git add,git commit`, không phải giới hạn kỹ thuật của headless
mode.

### 5.5.4 Đề xuất cấu trúc (để thảo luận, chưa chốt)

1. Viết 1 file recipe dùng chung — VD `docs/specs/research-and-brainstorm-
   recipe.md` hoặc gộp vào 1 reference cả `discovery.mjs` lẫn
   `fgos-coding-exploring/SKILL.md` cùng trích — nội dung: scope gray area → scout
   → enrich từ related item's content thật (không chỉ id) → tự đánh giá →
   nếu chưa rõ, tự nghiên cứu thêm (bao nhiêu round, ngân sách tool-call)
   trước khi: (a) không người → park với câu hỏi cụ thể + toàn bộ evidence
   đã thu thập lưu lại; (b) có người → hỏi qua hội thoại/`fgos ask`.
2. `buildDiscoveryPrompt` (autonomous layer) load/trích nội dung recipe này
   thay vì tự định nghĩa lại tiêu chí "đủ rõ" như hôm nay.
3. `fgos-coding-exploring/SKILL.md` bước 1 (Scope the gray areas) trích cùng
   recipe cho phần "material/grounded/answerable" — hiện đã gần giống, chỉ
   cần thống nhất từ ngữ/tiêu chí với bản autonomous.

## 6. Vấn đề cần thảo luận / quyết định (chưa tự quyết thay user)

1. **Chọn route 3.1(A) hay 3.1(B), hay cả hai theo bậc?** — sau khi test
   thật (5.5.3a) xác nhận headless CÓ Task tool song song, (A) không còn
   là "bản rẻ, yếu hơn" — năng lực gần bằng (B), chỉ thiếu khả năng hỏi
   người ngay khi bí. (A) rẻ hơn để triển khai (sửa config + prompt, không
   đổi kiến trúc discover-loop). (B) vẫn cần cho case thật sự phải hỏi
   người. Có thể nghiêng hẳn về (A) làm route chính, (B) chỉ còn là lối
   thoát khi (A) tự đánh giá "cần người quyết" — thay vì 2 route ngang hàng
   như đề xuất ban đầu.
2. **Sửa lỗi "scout-notes chỉ capture 1 lần"** — bug/limitation rõ ràng gây
   ra hiện tượng "vòng nào cũng unclear giống hệt nhau". Có nên cho phép
   capture lại khi verdict trước là `unclear` (không chỉ khi note trống)?
3. **Có cho model sửa title/description không, và ghi qua cửa nào** —
   `editWork` đã tồn tại (discover đã dùng nó để set `priority`) nên về mặt
   kỹ thuật không khó, nhưng cần quyết định: model có quyền tự viết đè
   title/description của user không, hay chỉ đề xuất rồi vẫn cần người
   duyệt (khác với `verify`/`priority` vốn luôn là suy luận máy, chưa từng
   là input trực tiếp của user).
4. **Ngân sách/circuit breaker cụ thể** — bao nhiêu round trước khi bắt buộc
   escalate tier hay park thật; có nên giới hạn số lần gọi WebSearch/Task
   trong 1 lần discover (giống ck:research's max-5) để tránh 1 item ngốn quá
   nhiều capacity.
5. **`git add`/`git commit` đang có trong allowedTools của judge nhưng chưa
   ai dùng** — giữ, bỏ, hay để dành cho route (B)?

## Unresolved questions
- ~~Chưa đo thực tế `claude -p --allowedTools "...,Task"` có support Task
  tool song song trong headless mode không~~ — **đã resolve, xem 5.5.3a**:
  có, test thật xác nhận.
- Chưa rõ 4 item đang parked thật (từ 15-round run) có nội dung gì cụ thể —
  nên xem `fgos list` lọc `status:awaiting-human` để lấy ví dụ thật, dùng
  làm test case cho thiết kế mới.
- Chi phí thật của 1 lần discover khi mở `Task` trong allowedTools: 1 lần
  gọi có thể tốn N subagent calls chồng lên nhau (mỗi subagent lại có thể
  gọi thêm tool) — chưa đo dollar-cost/latency thật cho 1 item `tier: light`
  vs `tier: heavy` khi bật parallel research. Nên đo trước khi bật mặc định
  cho toàn bộ discover-loop 49-item backlog.

## 7. Đã triển khai (route A, sau khi user chọn)

Chọn (A). Đã sửa thật, test xanh 2308/2308 (`npm test`), không đổi kiến
trúc discover-loop (verb `fgos discover`/`resolveDiscovery` giữ nguyên chữ
ký, chỉ đổi nội dung prompt + capacity config).

**Config** (`.fgos/config.json` + `.fgos-runner.json`, đồng bộ 2 file):
`capacities.judge-discovery` từ `{kind:"task"}` (no-op) → thêm
`command`/`args` riêng, `--allowedTools` mở
`Task,WebSearch,WebFetch,Read,Bash(rg:*),Bash(git add:*),Bash(git commit:*)`
— dùng đúng cơ chế `capacities.<id>` đã có sẵn (tsk-2yp), KHÔNG đụng
`executors.judge` dùng chung với decompose → decompose không bị ảnh hưởng.
Bỏ `Grep`/`Glob` khỏi allowedTools dù ban đầu định thêm — verify thật qua
`init.tools` transcript (5.5.3a) thấy 2 tool này KHÔNG tồn tại trong bản
Claude Code 2.1.220 đang chạy, thêm vào chỉ là no-op không kiểm chứng
được.

**`src/intake/discovery.mjs`:**
- `buildDiscoveryPrompt` viết lại: bỏ `judge-scout-instructions.txt` dùng
  chung với decompose (1 lượt rg, cấm lặp lại) → recipe 5 bước riêng cho
  discover (làm sạch yêu cầu → đọc task liên đới → tự đánh giá → nếu chưa
  rõ thì tự tìm thêm bằng Task/WebSearch/Read/rg, ngân sách ~5 lượt gọi,
  chỉ park SAU KHI đã thử → không có tool thì phán trên dữ liệu sẵn có).
  Viết theo lối "recipe tích cực", không phải danh sách cấm đoán (theo
  `positive-instruction-doctrine`, 5.5.3 mục superpowers).
- `buildRelatedItemsBlock` mới: enrich deps bằng title+description thật
  (không chỉ id) — trả lời yêu cầu #2 của user. Chỉ enrich `deps` (id thật
  theo dep-graph invariant), không đụng `refs` (không đảm bảo là id).
- `judgeDiscovery`: verdict schema thêm `titleProposal`/`descriptionProposal`
  tùy chọn, cùng cơ chế với `impactScore` (không gate clear/unclear, bỏ qua
  nếu không phải string non-empty) — trả lời yêu cầu #1. KHÔNG tự ghi đè
  `work.title`/`work.description` — chỉ là đề xuất, đã có sẵn qua
  `addDiscovery`'s spread hiện tại (không cần cửa ghi mới), người đọc qua
  `fgos show`/`fgos list` rồi tự áp bằng `fgos edit` nếu muốn (giữ đúng
  "User Decisions" — không âm thầm ghi đè trường do user tạo).
- Scout capture đổi từ "chỉ 1 lần" (`capture: !priorScoutNotes`) sang LUÔN
  thử capture (`capture: true`) — vá luôn mục 6.2 (bug gây "vòng nào cũng
  unclear giống hệt") vì cần thiết để recipe mới có ý nghĩa (nếu không, tự
  nghiên cứu xong trong vòng này cũng không lưu lại được cho vòng sau).

**`src/intake/judge-executor.mjs`:** `extractScoutTranscript` mở rộng bắt
thêm `Read/Grep/Glob/WebSearch/WebFetch/Task/Agent` tool_use (trước chỉ bắt
`Bash(rg:*)`) — nếu không sửa, nghiên cứu bằng tool mới sẽ không được lưu
vào `scout-notes.md`, mâu thuẫn với yêu cầu "kết quả thu thập cần lưu lại".
`Bash` vẫn giữ lọc chỉ `rg` (loại `git add`/`git commit` — đó là hành động,
không phải bằng chứng).

**Test mới** (`test/intake/discovery.test.mjs` + `judge-executor.test.mjs`):
10 test cho related-items enrichment + titleProposal/descriptionProposal +
always-capture + WebSearch capture; 2 test cũ sửa lại cho khớp hành vi mới
(không còn "skip capture khi đã có note").

**Mục 6 đã quyết trong lượt này:** #1 (chọn A) + #2 (fix scout-notes
capture) + #3 (proposal-only, không auto-apply). Sau đó tiếp tục quyết
thêm ở lượt kế:

- **#5 — giữ nguyên** `git add`/`git commit` trong allowedTools của judge
  (user: "Giữ git"). Không đổi gì thêm, quyền này tiếp tục vô chủ (chưa
  code nào gọi git) — để dành, không xoá.
- **#4 — đo trước khi ép** (user chọn hướng (2) trong 3 hướng đề xuất, "đo
  thật rồi tính tiếp"). Đã triển khai: `runJudgeExecutor` thêm tham số
  optional cuối cùng `scoutCaptureOut` (threading pattern y hệt
  `capacityId`/`fgosDir` trước đó — additive, `judgeDecompose`/runWatch
  không đổi gì, có test `omitting scoutCaptureOut stays byte-identical`
  xác nhận). `judgeDiscovery` dùng nó để đếm số tool call scout thật
  (`extractScoutTranscript`'s entries) mỗi lần gọi, đưa vào verdict qua
  field mới `researchToolCallCount` — cơ chế y hệt `impactScore`
  (mechanical, cưỡi trên `addDiscovery`'s spread có sẵn, không cửa ghi
  mới, không ép/chặn gì, chỉ đo). Số 0 vẫn được ghi (không bị coi là
  "không có"), vì "0 lượt" là dữ liệu có ý nghĩa (item rõ ngay không cần
  research).

  **Chưa làm:** tổng hợp/đọc lại số liệu này trên diện rộng (VD gom
  `researchToolCallCount` qua nhiều item sau khi discover-loop chạy thật)
  — cần chạy discover-loop thật trên backlog rồi mới có dữ liệu để tổng
  hợp, việc này để sau khi có đủ mẫu thật.

Test mới (route A + point 4): `runJudgeExecutor populates a supplied
scoutCaptureOut...`, `...omitting scoutCaptureOut stays byte-identical...`,
`resolveDiscovery reports researchToolCallCount matching...`,
`...reports researchToolCallCount 0...`, `judgeDiscovery omits
researchToolCallCount... (old 2-arg callers)`. `npm test` sau thay đổi
point 4: 2308/2308 pass (2313 total, 5 skipped — pre-existing, unrelated),
0 fail.

**Cảnh báo GitNexus (`detect_changes`, theo MUST rule CLAUDE.md):**
`risk_level: "critical"` — 18 execution flow bị đụng, vì
`judgeDiscovery`/`buildDiscoveryPrompt`/`resolveDiscovery` là hub node
được nhiều process gọi tới (bản chất cấu trúc file, không phải dấu hiệu
lỗi cụ thể). Index GitNexus của repo này đang lệch 40 commit so với HEAD
(cảnh báo riêng từ `list_repos`) nên vài "changed symbol" báo ra (VD
`mkLockedContextFixture` trong test file) có thể là nhiễu từ baseline cũ,
không phải do lượt sửa này. `npm test` thật (2308/2308 xanh) là bằng chứng
mạnh hơn con số risk cơ học này — nhưng vẫn nêu ra đây theo đúng MUST rule,
để user tự cân nhắc trước khi merge/commit.
