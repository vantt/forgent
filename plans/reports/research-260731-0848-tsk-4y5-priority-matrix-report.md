# Research Report: tsk-4y5 — Impact×Urgency Priority Matrix

Timestamp: 2026-07-31 08:48 +07

## Task được phân tích

`tsk-4y5` (stage `clarify`, status `todo`, chưa có discovery/decisions):

> cần 1 cơ chế để set priority cho task theo cơ chế matrix impact/urgent/priority
> tức priority được set từ combine của impact và urgent. liệu llm có thể tự làm
> khi mà tôi submit task, sử dụng capability: impact analysis để phát hiện impact
> của item mới trên toàn bộ. nếu người không đưa urgent thì nó sẽ là medium.
> sau khi có 2 giá trị đó thì sẽ ra priority P1,2,3,4...

## Phương pháp

Repo-internal research only (không cần WebSearch — câu hỏi thuộc thiết kế nội bộ
fgOS). Đọc: `docs/specs/work-state.md` (Data Dictionary #25/#26, RUL42, RUL59),
`docs/specs/runner.md`, `src/state/work.mjs`, `docs/reference/rankimpact-sort-key-order.md`,
`docs/reference/triage-table-columns.md`, `docs/backlog.md`.

## Phát hiện chính

### 1. Cơ chế TƯƠNG TỰ đã tồn tại (str7-str8-priority-intent)

Schema `work` đã có **2 khóa sắp-xếp riêng biệt**, KHÔNG phải 1 `priority` gộp:

| Field | Ghi bởi | Cách tính | Khóa sort |
|---|---|---|---|
| `priority` (#25) | Người/agent tự khai qua `edit --priority <n>` | Không bao giờ tự suy | ASC, khóa chính |
| `intent` (#26) | Giai đoạn `clarify` TỰ TÍNH mỗi lần phán item | Đọc graph metrics (STR43) + impact ranking (STR21 = `rankImpact`, blocking fan-out) làm tín hiệu | DESC, tie-break sau `priority` |

`intent` chính là "LLM tự tính điểm ưu tiên dựa impact" — gần với ý tsk-4y5,
chỉ khác: tên field khác, thời điểm tính là `clarify` (không phải lúc submit),
và không có input "urgency" khai riêng.

### 2. Xung đột với locked law RUL42

`docs/specs/runner.md` RUL42 (**đã xây, per str7-str8-priority-intent**):

> Vòng chọn-giao của runner không bao giờ gọi model thông minh... Trí tuệ vào
> hệ qua đúng hai cửa: (1) một bộ não thông minh GHI KẾT LUẬN XUỐNG FIELD qua
> cửa ghi chuẩn (`priority` — người/tác nhân tự khai; `intent` — clarify tự
> tính); picker chỉ đổi khóa sort, không đổi bản chất. (2) cửa pull `take`/`return`.

→ Field `priority` bị khóa cứng: **CHỈ ghi tường minh qua `edit --priority`,
không bao giờ do hệ thống tự suy ra**. Yêu cầu tsk-4y5 ("LLM tự set priority
khi submit") viết đúng nghĩa đen sẽ VI PHẠM RUL42/RUL59 — đây là locked law,
sửa phải supersede quyết định cũ (per AGENTS.md "Changing a locked law"),
không patch tại chỗ.

### 3. Đường không vi phạm law: mở rộng `intent`, không đụng `priority`

`intent` đã ĐÚNG LÀ "cửa" RUL42 cho phép — model tự tính tại `clarify`, ghi
qua edit thứ hai, không đụng picker. Khả thi:
- Thêm "urgency" làm tín hiệu phụ vào công thức tính `intent` (bên cạnh
  graph metrics/impact ranking sẵn có).
- Map `intent` (số) → nhãn P1-P4 chỉ để HIỂN THỊ (triage table, report) —
  derived label, không phải field ghi mới, không đổi picker/sort.
- Field `priority` giữ nguyên nghĩa cũ (override tay tường minh) — không đổi.

### 4. Mơ hồ cần chốt trước khi shape (2 khái niệm "impact" khác nhau trong repo)

- **Impact đồ-thị công-việc** (STR21, `rankImpact`, `src/state/impact.mjs`):
  `blocks` = số item khác đang chờ item này (blocking fan-out). Đây là input
  hiện tại của `intent`.
- **Impact code** (GitNexus `impact({target, direction})` — blast radius trên
  symbol/code, dùng cho review code trong CLAUDE.md của repo này).

Task viết "capability: impact analysis để phát hiện impact của item mới trên
toàn bộ" — nghe giống nghĩa work-graph (item mới ảnh hưởng graph thế nào,
không phải code blast-radius, vì lúc submit thường CHƯA có code diff). Nhưng
chưa chắc chắn — cần chốt với người submit.

## Câu hỏi chưa giải quyết (cần người quyết, per Scout First / User Decisions)

1. `urgency` là field mới thêm vào schema `work.mjs`, khai tay lúc submit
   (mặc định `medium` khi vắng) — hay tự suy? Task nói "nếu người không đưa
   urgent thì mặc định medium" → nghĩa là **field khai tay optional**, không
   phải tự suy — vậy cần thêm 1 field editable mới, giống khuôn `priority`
   hiện có, KHÔNG giống khuôn `intent` (tự tính).
2. "Impact" dùng nghĩa work-graph (STR21/`rankImpact`) hay impact code
   (GitNexus)? Ảnh hưởng trực tiếp: work-graph impact tính được cho MỌI item
   (kể cả chưa có code); GitNexus impact chỉ có nghĩa khi item trỏ tới symbol
   code cụ thể.
3. P1-P4 là NHÃN HIỂN THỊ derive từ `intent` (an toàn, không vi phạm RUL42) —
   hay một FIELD MỚI ghi xuống item? Nếu là field ghi mới do hệ tự set →
   đụng thẳng RUL42, cần supersede decision, không phải feature nhỏ.
4. Quan hệ với `priority`/`intent` sẵn có: thay thế, hay cộng thêm song song?
   Cộng thêm 3 khái niệm chồng nhau (`priority`, `intent`, `P1-4`) dễ vi phạm
   KISS/DRY nếu không rõ ranh giới.

## Khuyến nghị (draft, chưa chốt)

Approach rẻ nhất, không đụng locked law: **mở rộng `intent`** — thêm input
"urgency" (field khai tay mới, optional, default `medium`) vào công thức
tính `intent` tại `clarify`, rồi derive nhãn P1-P4 CHỈ ĐỂ HIỂN THỊ (triage
table) từ `intent` đã tính — không tạo field `priority` tự động. Việc này
tái dùng đúng "cửa" RUL42 đã có, thay vì mở cửa thứ ba.

Route tiếp: item đang ở stage `clarify` — cần `fgos-coding-exploring` skill để lock
các quyết định trên (Q1-Q4) trước khi sang `decompose`/`fgos-coding-planning`.

## Chưa dùng WebSearch

Không cần — câu hỏi là thiết kế nội bộ, không phải công nghệ/thư viện bên
ngoài.

## Round 2 — lịch sử field `intent` + mental model người dùng mô tả

### Lịch sử `intent` (STR8, commit `52905b6`→`174bbca`, 2026-07-27)

Định nghĩa gốc, đúng nguyên văn prompt (`src/intake/discovery.mjs:141-149`):
> "dựa trên ngữ cảnh đồ thị ở trên, ước lượng **mức độ khẩn cấp** của item này
> bằng `intentScore` từ 0-100 (0 = không gấp, 100 = cực gấp/nên làm ngay)"

`intent` = **urgency score**, LLM judge tự chấm ở stage `clarify`, đọc
"graph context" (STR43 graphMetrics + STR21 `rankImpact`) làm tín hiệu trước
khi chấm. Đây CHÍNH LÀ "LLM tự ước lượng urgency dựa trên impact" — đã có
từ STR8, chỉ khác: output liên tục 0-100 (không phải nhãn P1-4), không nhận
input urgency khai tay riêng, chạy ở `clarify` (không phải lúc submit), chỉ
tính cho CHÍNH item đang xét (không bao giờ đụng field item khác).

Rào chắn đã chốt (commit `6bcb7e3`, backlog P38): dù người gợi ý priority/
intent qua chat, gợi ý đó CHỈ là 1 tín hiệu đầu vào — không bao giờ ghi
thẳng field. Giữ đúng RUL42 "1 actor ghi cuối mỗi field".

### Mental model người dùng mô tả (2026-07-31)

Người dùng bóc tách lại rõ hơn, gồm 4 khối:

1. **Impact đồ-thị/feature-release** — "liên quan cục diện feature nào,
   release nào, giải quyết bao nhiêu feature khác" — cần harness quét vì
   con người không đủ trí nhớ để tự khai đúng.
2. **Impact cơ học/code** — "liên đới cơ học bao nhiêu code phía dưới, gây
   nghẽn ùn tắc không" — người dùng tự gợi ý: có thể đã có chỗ chứa là field
   `effort` hoặc `risk.heavy` sẵn có.
3. **Urgency/priority khai tay** — 1 trong 2, người khai; không khai thì mặc
   định mức trung tính (medium).
4. **P (kết quả)** — hệ tự sinh công thức riêng, gộp (1)+(2)+(3) ra P cho
   item hiện tại — và có thể ẢNH HƯỞNG NGƯỢC tới P của item khác (cascade).

### Đối chiếu với cơ chế/field ĐÃ CÓ trong repo

| Khối người dùng mô tả | Field/cơ chế đã có | Khớp tới đâu | Việc còn thiếu |
|---|---|---|---|
| (1) Impact đồ-thị/feature-release | `goalTier` (mvp/milestone, khai tay) + `rankImpact`/STR21 (`blocks` = fan-out từ `deps` khai sẵn, `componentSize`) | Có NỀN — nhưng chỉ đếm quan hệ ĐÃ khai (`deps`/`goalTier`), không tự SUY quan hệ ngữ nghĩa từ text mô tả | Suy luận ngữ nghĩa "item này thuộc feature/release nào" từ free-text — CHƯA có, đây mới là phần "cần LLM quét" thật sự người dùng muốn |
| (2) Impact cơ học/code | `risk` field — nhưng hiện **thuần keyword-matching, không LLM, không tool** (`src/intake/classify.mjs:66-93`: `risk = tier`, tier suy từ đếm khớp từ khoá HEAVY_KEYWORDS/LIGHT_KEYWORDS). `risk` đã có người tiêu dùng thật: `decompose.mjs`'s `risksGate` — risk=`heavy` ép qua cổng người xác nhận trước khi chia việc | Đúng linh cảm người dùng: `risk` LÀ chỗ chứa hợp lý (đã có consumer, đã có ý nghĩa "nặng/nhẹ"), nhưng NGUỒN TÍNH hiện tại quá thô (đếm từ khoá) so với "quét harness/GitNexus" người dùng muốn | Nâng cấp nguồn tính `risk` từ keyword-heuristic → tool-assisted (GitNexus `impact()`); đụng thẳng consumer đang sống (`risksGate`) — cần test coverage khi đổi |
| (3) Urgency/priority khai tay, default medium | `priority` field (STR7) — khai tay qua `edit --priority`, ASC sort key, vắng mặt xếp cuối (KHÔNG coi vắng mặt = 0/medium — khác với "default medium" người dùng muốn) | Đúng KHUÔN (explicit, RUL42-hợp lệ) nhưng SAI NGỮ NGHĨA vắng-mặt (priority hiện "vắng mặt xếp cuối", không phải "default = trung tính") — và priority hiện là SORT KEY CUỐI, không phải input cho công thức khác | Cần field riêng (không đụng `priority` cũ) làm INPUT cho công thức P, semantics "vắng mặt = medium" — tránh đá ý nghĩa field `priority` sẵn có |
| (4) P — hệ tự sinh công thức, ghi cho item hiện tại | `intent` (STR8) — closest analog: đã là field hệ TỰ TÍNH qua đúng cửa RUL42 hợp lệ, đã đọc STR21 impact làm input | Đúng CỬA, đúng TINH THẦN ("urgency estimate informed by impact") — chỉ thiếu 2 input (code-impact, human-urgency-hint) + output nên là nhãn rời P1-4 thay vì số 0-100 | Mở rộng CÔNG THỨC bên trong intent-judge, không cần field mới, không đụng RUL42 |
| (4b) P ảnh hưởng ngược tới item KHÁC (cascade) | **KHÔNG CÓ tiền lệ nào** — mọi cơ chế hiện tại (`intent`, `priority`, `risk`) chỉ bao giờ ghi field của CHÍNH item đang xét. `rankImpact`/`triage` đọc nhiều item nhưng KHÔNG BAO GIỜ ghi ngược lại item nào | Không khớp gì cả — đây là NĂNG LỰC MỚI HOÀN TOÀN | Cascade-recompute là 1 subsystem riêng: cần định nghĩa bán-kính lan (toàn graph? chỉ `deps` trực tiếp?), chi phí ghi (mỗi item bị ảnh hưởng = 1 lượt `edit` = 1 event log — N item ảnh hưởng = N lần ghi mỗi lần submit 1 task mới), và vẫn phải giữ RUL42 (một "bộ não thông minh" ghi qua cửa edit chuẩn cho TỪNG item bị ảnh hưởng — không phải picker tự suy) |

### 2 nút thắt lớn nhất (quyết định trước, ảnh hưởng toàn bộ scope)

**A. Cascade (khối 4b) — MỞ RỘNG LỚN, không phải feature nhỏ.** Không có
nền móng nào trong repo cho việc 1 item mới làm ĐỔI field của item khác.
Nếu giữ trong scope tsk-4y5: cần tự trả lời — bán kính lan bao xa (chỉ
`deps` trực tiếp, hay cả graph), trigger lúc nào (mỗi lần submit? mỗi lần
`clarify` 1 item mới?), và chi phí ghi N event log mỗi lần có thể chấp nhận
được không. Theo YAGNI: slice đầu tiên nên CHỈ tính P cho item đang xét
(giống `intent` hôm nay) — cascade tách thành theo-dõi riêng, không chặn
slice đầu.

**B. Timing của impact cơ học/code (khối 2) — vấn đề con-gà-quả-trứng.**
GitNexus `impact({target, direction})` cần 1 SYMBOL cụ thể. Lúc `clarify`
(lúc judge chấm `intent` hôm nay), item vừa submit thường CHƯA gắn với code
cụ thể nào (đó là việc của `decompose`/`executing`). Không thể chạy blast-
radius thật ở `clarify` nếu chưa biết target. Cần chọn 1 trong:
   - Chạy 1 bước rẻ hơn ở `clarify` (vd tìm file/module liên quan qua
     keyword/semantic search trên codebase — proxy thô, KHÔNG phải blast-
     radius thật của GitNexus).
   - Hoãn phần này sang `decompose`/`executing` (lúc target đã rõ), rồi
     REVISE P sau khi có con số thật — nghĩa là P không cố định 1 lần ở
     `clarify` mà có thể update lại — thêm 1 lớp phức tạp nữa.

### Khuyến nghị cập nhật (draft, chưa chốt)

Đường rẻ nhất, tái dùng tối đa cửa RUL42 đã có, KISS/YAGNI:
1. KHÔNG đụng field `priority` cũ. Thêm field mới nhỏ (tên gợi ý:
   `urgencyHint`) — khai tay optional, vắng mặt = medium — CHỈ là 1 input
   cho công thức, không phải sort key.
2. Nâng cấp nguồn tính `risk` (khối 2) từ keyword-heuristic sang có thêm
   tín hiệu tool-assisted KHI có thể (fallback keyword khi chưa biết
   target) — tái dùng field `risk` + consumer `risksGate` sẵn có, không
   field mới.
3. Mở rộng CÔNG THỨC bên trong `intent`-judge (khối 4): input = STR21
   impact (đã có) + `urgencyHint` (mới) + `risk` (nâng cấp) → output đổi
   từ số 0-100 sang nhãn P1-P4. Vẫn ghi qua đúng cửa `edit` RUL42 cho
   phép — không field/law mới.
4. Cascade (khối 4b) — tách THEO DÕI RIÊNG, không đưa vào slice đầu, trừ
   khi người dùng xác nhận đây là must-have ngay.

## Round 3-5 — lịch sử tách 1a/1b, scout-trước-judge, luật "có-căn-cứ"

- Không tìm thấy bản ghi trước đây cho ý tách `clarify` thành 1a (rẻ/tự
  động)/1b (sâu/có người) — gần nhất: `classify.mjs` (STR14, mechanical,
  chạy ở `submit`) + `judgeDiscovery` (1 lệnh LLM gộp verdict+intentScore,
  KHÔNG chia 2 pha) + STR40 (luật cứng: herdr chỉ chrome, không được là
  actor tự trigger — actor đúng là vòng tự hành/runner).
- Xác nhận: `judgeDiscovery` (`src/intake/discovery.mjs`) **zero scout** —
  chỉ đọc text + `graphMetrics`/`rankImpact` (metadata đồ thị VIỆC, không
  phải code/docs thật), gọi `claude -p` 1 lệnh JSON-only, không tool access.
- Luật **"có-căn-cứ"** (1/3 phép thử lọc câu hỏi, `docs/specs/runner.md:804`)
  hôm nay chỉ được thoả MUỘN — ở skill `fgos-coding-exploring` (phiên đầy đủ, có
  tool), chạy SAU KHI đã park `awaiting-human`. Verdict ĐẦU TIÊN
  (`judgeDiscovery`) không hề có căn cứ gì — gap thật giữa luật đã viết và
  implementation.
- Người dùng chốt: dời scout LÊN 1a (tự động, trước người) — không phải để
  rẻ, mà để (a) verdict đầu tiên thật sự có-căn-cứ đúng luật, (b) câu hỏi
  hỏi người (nếu còn cần) có sẵn bằng chứng, (c) kết quả scout tái dùng làm
  nguyên liệu tính P (impact-code/feature-relatedness, khối 1+2 round 2).
- Xác nhận thêm: "low-confidence" ở 1a là THIẾT KẾ CHỦ Ý (đọc nông, rẻ, cố ý)
  chứ không phải lỗi — verdict `clear:false` tái dùng đúng shape đã có, không
  cần field "confidence" mới.

## Round 6 — Toàn cảnh pipeline submit→done (để chọn điểm cắt + verb)

Stage set thật (`src/state/workflow-stage-graphs.mjs:50,64`):
`clarify → {decompose | executing} → executing → compound-learn → done`
(clarify có 2 cạnh ra — item đơn giản có thể nhảy thẳng clarify→executing,
bỏ qua decompose).

| # | Stage/Status | Verb kích hoạt | Actor | Việc làm | Lối ra |
|---|---|---|---|---|---|
| 0 | Intake (`status: todo`) | `submit` / `add` | Cơ học (`classify.mjs`, STR14, KHÔNG LLM) | Auto tier/kind/risk (đếm từ khoá) + sinh id | → `stage: clarify` |
| 0b | Pull door (`todo→doing`) | `take` / `pick` | Người/agent tự nhấc | Claim 1 item; `pick` còn tự tạo worktree + chuyển phiên vào | Thứ tự frontier: `priority` ASC → `intent` DESC → FIFO |
| 1 | `clarify` | `discover` | Cơ học (`judgeDiscovery`, `claude -p` 1 lệnh, **zero scout hôm nay**) | Verdict `{clear, question?, verify?, intentScore?}` | clear → `decompose`/`executing`; unclear → `awaiting-human` |
| 1b | `clarify`, `awaiting-human` | `ask` / `answer` | Skill `fgos-coding-exploring` (phiên đầy đủ, CÓ tool — chỗ scout thật hôm nay xảy ra) | Lọc câu hỏi qua 3 phép thử (chất-liệu/có-căn-cứ/trả-lời-được) trước khi hỏi | Người trả lời → `todo` → `discover` lại |
| 2 | `decompose` | `discover` (cùng verb, giờ chạy `judgeDecompose`) | Cơ học + cổng `risk: heavy` bắt buộc người xác nhận | Verdict `pass-through`/`decompose` (sinh children, mỗi đứa lại vào `clarify` riêng)/`need-human` | Skill `fgos-coding-planning` (chia-việc, nửa đầu) + `fgos-coding-validating` (thẩm-định, nửa cuối, KHÔNG bao giờ tự nhận đã qua) |
| 3 | `executing` | (runner tự dispatch, hoặc phiên `pick`-thủ-công) | Skill `fgos-coding-implement` | Vòng cài-đặt→kiểm-chứng→`return` | `return` chạy `verify` thật (không tin exit code worker) → `awaiting-approval` (xanh) hoặc `blocked` (đỏ) |
| 4 | `awaiting-approval` | `review`, `approve`/`reject` | Người/agent + khoá main-checkout (RUL49/50) | Xem diff/PR, merge | approve → cạnh `executing→compound-learn` bật; reject → quay lại, không tự động |
| 5 | `compound-learn` | `compound` | Skill `fgos-coding-compounding` | Tổng hợp tín hiệu thật thành doc Diataxis có trích dẫn bằng chứng | → `done`; kéo theo `fgos-indexing` refresh `docs/enduser-docs-index.json` |
| 6 | `done` | — | — | Trạng thái cuối | — |

Verb hỗ trợ xuyên suốt (không nằm trên đường thẳng): `edit` (ghi field
tường minh, cửa RUL42), `decision`, `catchup`, `evolve`, `session`,
`rebuild`, `repair`. Đọc-thuần: `list`, `ready`, `stale`, `rollup`,
`triage`, `check`, `graph`, `conflicts`, `docs-index`, `doc-sources`.

### Điểm cắt cho ý scout+judge (1a) của người dùng

Nằm ĐÚNG tại hàng #1 (`clarify`, verb `discover`) — đây là verb hiện đang
"giả-có-căn-cứ" cần sửa. 2 lựa chọn tên verb:

- **A. Mở rộng `discover` sẵn có** (khuyến nghị, KISS/DRY) — `discover` đã
  đúng vị trí FSM, đã có CLI wiring + skill wrapper (`/fgOS:discover`), chỉ
  cần thêm bước scout TRƯỚC khi gọi `judgeDiscovery`, feed kết quả scout
  vào prompt. Không verb mới, không CLI surface mới.
- **B. Verb `scout` riêng, đứng trước `discover`** — tách được (re-scout
  mà không re-judge), nhưng thêm 1 verb mới + phải định nghĩa field trung
  gian chứa kết quả scout cho `discover` đọc lại (giống cặp `ask`/`answer`
  đã có, 2 verb 1 luồng). Hợp lý nếu scout tốn thời gian/đắt và muốn tách
  khỏi vòng judge lặp lại.

## Round 7 — 2 cơ chế chia-con song song (judgeDecompose vs fgos-coding-planning), đọc trực tiếp 2 SKILL.md

`.claude/skills/fgos-coding-planning/SKILL.md` bước 5 ("Decide the split, if any"):
tự TẠO item con thật, nối bằng field **`parent`**, dùng `fgos graph
--what-if <id>` so sánh ứng viên trước khi chọn.

`.claude/skills/fgos-coding-validating/SKILL.md` (Handoff, dòng 50-57, 126-131):
xác nhận `fgos discover` — verb ENGINE — mới là lệnh THẬT SỰ bắn cạnh
`decompose→executing`, và verb này chạy DÙ session đã qua đủ
`fgos-coding-planning`+`fgos-coding-validating` hay chưa. Tức `judgeDecompose` (chạy bên
trong `discover`) KHÔNG bị bỏ qua kể cả khi phiên người đã tự quyết xong —
nó vẫn tự chạy, tự sinh verdict + children RIÊNG, nối bằng field **`deps`**
(`src/intake/plan.mjs`).

**=> 2 nguồn quyết "có chia không", 2 field nối khác nhau (`parent` vs
`deps`), từng đá nhau thật (bug `tsk-1wd`, đã vá 1 phần bằng cách bắt
`judgeDecompose` đọc `docsRef`→CONTEXT.md/plan.md làm căn cứ) — nhưng
KHÔNG rõ liệu vá đó đã loại hết trùng lặp, hay `judgeDecompose` vẫn có thể
tự sinh 1 bộ children KHÁC với cái `fgos-coding-planning` đã tạo trước đó.
Chưa verify bằng test/transcript thật — đây là NGHI VẤN mở, không phải kết
luận chắc.

## Round 7b — Pattern lặp lại: engine-judge vs skill-session, cả 2 stage

Cùng 1 HÌNH DẠNG xảy ra ở CẢ `clarify` VÀ `decompose`:

| | Engine judge (mechanical, luôn tự chạy qua `discover`) | Skill session (chỉ chạy khi có người/agent claim) |
|---|---|---|
| `clarify` | `judgeDiscovery` — zero scout, closed-book | `fgos-coding-exploring` — có tool, scout thật, lọc câu hỏi 3 phép thử |
| `decompose` | `judgeDecompose` — closed-book (đã vá đọc plan.md, vẫn zero scout code/repo thật) | `fgos-coding-planning`+`fgos-coding-validating` — có tool (`fgos graph --what-if`), bằng-chứng-thật bắt buộc từng dòng matrix |

Cả 2 stage: engine judge là bên KÉM CĂN CỨ HƠN nhưng lại là bên THỰC SỰ
bắn cạnh chuyển-stage (RUL42/RUL46: chỉ verb máy được áp cạnh). Skill
session là bên GIÀU CĂN CỨ HƠN nhưng chỉ input/prose, không tự áp cạnh.

**Ý nghĩa cho tái thiết kế dài hạn:** hướng "dời scout lên trước judge"
(người dùng đề xuất ở round 4-5 cho `clarify`) thực ra là ĐÚNG PATTERN
CHUNG cần áp cho CẢ 2 stage, không chỉ `clarify` — biến engine judge từ
"người quyết độc lập, dễ đá nhau với skill session" thành "người XÁC NHẬN
lại quyết định đã có căn cứ từ skill session", giảm nguy cơ trùng
lặp/đá nhau đã thấy ở `tsk-1wd`.

## Round 9 — Đóng lỗ hổng: đọc trực tiếp toàn bộ SKILL.md + source còn thiếu

Trước round này, nhiều kết luận dựa vào mô tả gián tiếp (doc trích dẫn,
1-dòng mô tả skill) thay vì đọc trực tiếp. Đóng lại từng cái:

- **`fgos-coding-exploring/SKILL.md`** (chưa đọc trước đó) — xác nhận scout THẬT
  có tồn tại (bước 1), nhưng CHỈ là **"one keyword pass"** qua `rg`
  (ripgrep) — 1 lệnh grep 1 từ khoá, KHÔNG phải quét sâu. 3 phép thử
  material/grounded/answerable xác nhận đúng nguyên văn trong CHÍNH skill
  này (bước 2), không chỉ nhắc lại gián tiếp qua runner.md.
- **Executor config thật** (`src/runner/dispatch.mjs:207-220`,
  `DEFAULT_RUNNER_CONFIG.executor.args`) — chứa
  `--allowedTools 'Bash(git add:*),Bash(git commit:*)'`. Vì
  `judge-executor.mjs` dùng CHUNG `resolveExecutorCommand` với worker thật,
  `judgeDiscovery`/`judgeDecompose` chạy dưới ĐÚNG giới hạn quyền này —
  CHỈ được `git add`/`git commit`, không Grep/Read gì khác. **"Zero scout"
  ở round 4-5 giờ là bằng chứng cứng (quyền bị chặn), không còn là suy
  luận từ việc code không gọi grep.**
- **`fgos-routing/SKILL.md`** — khớp 100% với "Precedence: the engine's
  verb always wins" đã trích trước đó.
- **`fgos-coding-implement/SKILL.md`** — khớp mô tả cũ (cài-đặt→verify→return),
  cộng thêm 2 phát hiện mới liên quan trực tiếp chủ đề gốc:
  - `fgos tool query --capability impact-analysis --status present` —
    cơ chế CAPABILITY-CHECK đã build sẵn (Full/Degraded/Inactive), dùng ở
    `executing` trước khi chạy GitNexus impact thật. Đây CHÍNH LÀ pattern
    "graceful degrade khi thiếu GitNexus" cho câu hỏi B (timing impact-
    code) từ đầu buổi — đã có sẵn, chỉ chưa dùng ở `clarify`/`decompose`.
  - `classifyIronLaw` (`src/evolve/iron-law.mjs`) — 1 risk classifier THỨ
    BA trong hệ (khác `risk` field/HEAVY_KEYWORDS của classify.mjs, khác
    HEAVY_RISK gate của decompose.mjs), dùng ở bước approve-gate.
- **`fgos-coding-compounding/SKILL.md`** — khớp hoàn toàn mô tả cũ.
- **`src/state/impact.mjs`, `src/state/graph-metrics.mjs`** (source, chưa
  đọc trước đó) — khớp đúng 2 doc reference đã trích (rankImpact,
  connectedComponents, criticalPath). 1 chi tiết nhỏ: comment gốc trong
  `impact.mjs` viết "P7/P8 both still proposed" — comment CŨ từ trước khi
  STR7/STR8 build xong, không phải mâu thuẫn thật, chỉ là doc-lag.

## Round 10 — Lỗ hổng THẬT, nặng nhất: field `parent` không có đường ghi qua CLI

Grep toàn bộ `src/cli/command-registry.mjs` + `bin/fgos.mjs` cho `parent`
— **0 kết quả**. Đọc trực tiếp handler `add` (`bin/fgos.mjs:726-795`):
object `work` build từ danh sách flag tường minh (title/kind/risk/verify/
deps/refs/tier/domain/discoveredFrom/footprint/docsRef/acceptance...) —
**không có `flags.parent`**. `edit`'s mô tả field patch được liệt kê rõ:
*"title/kind/risk/verify/tier/refs/deps/acceptance/priority/intent/docs-ref"*
— **cũng không có `parent`**.

`parent` là field schema THẬT, load-bearing (`frontier.mjs`,
`dep-graph.mjs`'s `buildUnifiedEdges`, `impact.mjs`'s blocking-fan-out,
`decompose.mjs`'s `hasChildren` check, `awaiting-context.mjs`) — nhưng
**KHÔNG CÓ VERB CLI NÀO** (`add` hay `edit`) cho set nó. Nơi DUY NHẤT
trong toàn repo thật sự ghi `parent` là `decompose.mjs`'s `addWork()` NỘI
BỘ (`judgeDecompose`'s auto-split, gọi thẳng store function — hợp lệ vì
đó là code tầng ENGINE, không phải phiên/skill, không vi phạm one-door-
write vì chính nó LÀ 1 phần của cửa ghi CTR001).

**Hệ quả:** `fgos-coding-planning` SKILL.md bước 5 — *"list each piece as its
own item title... carries this item's own id as its parent"* — mô tả 1
khả năng KHÔNG TỒN TẠI trên CLI. 1 phiên theo đúng skill này, giữ đúng kỷ
luật one-door-write (không được bypass CLI gọi thẳng `addWork`), KHÔNG CÓ
CÁCH set `--parent` khi tạo children qua `fgos add`.

**Sửa lại kết luận Round 7:** KHÔNG PHẢI "2 cơ chế chia-con song song, có
thể đá nhau" — mà là **1 cơ chế THẬT SỰ CHẠY ĐƯỢC** (`judgeDecompose`,
field `deps`, engine tự ghi) và **1 cơ chế được TÀI LIỆU MÔ TẢ nhưng
KHÔNG THI CÔNG ĐƯỢC qua CLI** (`fgos-coding-planning` bước 5, field `parent`) —
do thiếu `--parent` flag. Đây là gap thật, xác nhận bằng grep + đọc code
trực tiếp, không phải suy diễn.

## Round 11 — A/B/C: xác nhận verb thật + tool-registry tổng quát

**A (xác nhận có thật):**
- `fgos graph --what-if <id>` — verb thật (`command-registry.mjs:325-341`),
  đúng behavior `fgos-coding-planning` mô tả.
- `fgos tool query --capability <label> [--status present]` — verb thật,
  nhóm `fgos tool` (register/check/query/remove, `command-registry.mjs:
  756-781`) — registry TỔNG QUÁT, không riêng GitNexus.

**B (không thấy đúng bằng chứng nhưng ra phát hiện khác giá trị hơn):**
`STR92` (`docs/backlog.md:132`, audit thật 2026-07-23, quét `--help` 31
verb + đọc toàn bộ 18 SKILL.md) xác nhận `fgos-coding-planning` "tạo item con
qua `parent`" nhưng CHỈ bắt lỗi thiếu `--footprint` — KHÔNG bắt lỗi thiếu
`--parent` hoàn toàn (Round 10). Audit chính thức của repo cũng lọt gap
này — Round 10 finding đứng vững, giá trị hơn vì audit trước cũng bỏ sót.

**C (đổi hướng thiết kế thật):** Đọc
`docs/reference/forgentx-tool-registry-configuration.md` +
`docs/explanation/tool-registry-capability-is-a-prose-contract-not-compiled-logic.md`
— registry đã có sẵn 3-tier degrade ladder (inactive/degraded/full) TÁI
DÙNG ĐƯỢC THẲNG cho câu hỏi B gốc (timing impact-code), GitNexus đã đăng
ký sẵn dưới capability `impact-analysis`. Registry chỉ trả FACT, không tự
inject — ai gọi nó ở bước nào là quyết định của prose (skill/CLAUDE.md).

## Round 12 — SỬA Round 11: tsk-1e4 đã merge, NGAY TRONG lúc research này

Kết luận ban đầu ở Round 11 ("fgos-coding-planning/fgos-coding-validating CHƯA hỏi
capability, đó là tsk-1e4 CHƯA LÀM") **SAI — dựa vào 1 doc đã CŨ**
(`tool-registry-capability-is-a-prose-contract-not-compiled-logic.md`,
viết TRƯỚC khi tsk-1e4 merge). Người dùng chỉ ra tsk-1e4 đã merge; xác
nhận qua `fgos show tsk-1e4`: `status: done`, `branchHeadAtReturn` +
settlement `close/human` lúc 2026-07-31T04:04 — ĐÚNG khung giờ buổi
research này đang chạy (merge xảy ra GIỮA lúc đang bàn).

Grep lại NGAY tại thời điểm ghi report này, xác nhận THẬT:
- `.claude/skills/fgos-coding-planning/SKILL.md:95-98` — ĐÃ gọi
  `fgos tool query --capability impact-analysis --status present`, ghi
  posture vào `plan.md`.
- `.claude/skills/fgos-coding-validating/SKILL.md:81-86` — ĐÃ re-query, đối
  chiếu posture ghi trong plan.md với thực tế máy đang chạy.
- `CLAUDE.md:10-33` — thêm prose capability-gate đứng trước block
  GitNexus cũ.

`tsk-1e4`'s `refs`: `fgos-coding-planning`, `fgos-coding-validating`, `fgos-coding-implement`,
`CLAUDE.md` — **KHÔNG có `fgos-coding-exploring`**. Vậy:
- `decompose` (`fgos-coding-planning`+`fgos-coding-validating`) VÀ `executing`
  (`fgos-coding-implement`) — capability-gate `impact-analysis` đã chạy THẬT, có
  mẫu prose cụ thể để copy nguyên xi.
- `clarify` (`fgos-coding-exploring`) — VẪN CHƯA có capability-gate này. Xác
  nhận lại đúng hướng ưu tiên round 4-8 (scout ở clarify là gap ưu tiên
  #1), nhưng giờ có SẴN 1 mẫu prose đã chạy thật (chứ không phải thiết kế
  từ đầu) để làm theo cho `fgos-coding-exploring`.

**Bài học tự-kiểm-tra:** 1 tài liệu docs/explanation/ (hand-authored,
không tự làm mới) có thể LỖI THỜI ngay giữa 1 phiên nếu có merge xảy ra
song song — luôn đối chiếu lại bằng grep trực tiếp file THẬT tại thời
điểm kết luận, không dừng ở doc trích dẫn, kể cả doc đã đọc đúng lúc đọc.

## Câu hỏi cần chốt (bản rút gọn sau round 2)

1. Cascade — bắt buộc ngay hay defer (khuyến nghị defer, YAGNI)?
2. Impact cơ học/code — chạy proxy thô ở `clarify`, hay hoãn thật sự tới
   lúc có target (`decompose`/`executing`) rồi revise P sau?
3. Chỗ chứa impact cơ học/code — nâng cấp `risk` sẵn có, hay field `effort`
   mới tách riêng?
4. Human input (khối 3) — field mới `urgencyHint` tách khỏi `priority` cũ,
   hay muốn đè nghĩa lên `priority` luôn (rủi ro vỡ semantics "vắng mặt xếp
   cuối" hiện có)?
