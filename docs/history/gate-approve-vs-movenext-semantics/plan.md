# gate-approve-vs-movenext-semantics — plan

Item: tsk-19j. Nguồn thẩm quyền quyết định: `CONTEXT.md` (D1-D14, cùng thư
mục). Plan này không mở lại quyết định nào đã khoá — mỗi lựa chọn dưới đây
cite thẳng D-ID.

## 1. Mode gate (cơ học)

Đếm cờ áp dụng:

| Cờ | Áp dụng? | Vì sao |
|---|---|---|
| data model | **có** | thêm field cấu trúc mới `gates[id].contextApprove/planApprove/validateApprove` (D1/D11) + event kind mới `work.gate-approve` |
| audit/security | **có** | chính là mục đích track A — bản ghi duyệt tường minh cho audit trail |
| public contract | **có** | đổi hành vi `resolveDiscovery`/`resolveDecompose` (engine), Gate section của 3 skill exploring/planning/validating, thêm skill mới `fgos-coding-driving`, sửa `cook`/`pick` |
| existing covered behavior | **có** | `resolveDiscovery`/`resolveDecompose`/`frontier()` đều có test suite sống (`test/intake/discovery.test.mjs`, `test/intake/plan.test.mjs`, `test/state/frontier.test.mjs`) — đổi phải giữ xanh, không né |
| auth/authorization | không | — |
| external systems | không | — |
| cross-platform | không | — |
| multi-domain | không | chỉ domain `coding` (D10 không khẳng định tổng quát domain khác) |

4 cờ khớp → **mode = high-risk** (ngưỡng "4+ cờ, hoặc bất kỳ cờ cứng nào").
Không mode nhỏ hơn honest cover được: đây là thay đổi lược đồ dữ liệu bền
(`gates[id]`) cộng hành vi 2 engine function đang có test bao phủ, cộng 1
skill mới dùng chung cho mọi loop coding-domain.

## 2. Impact-analysis posture

`fgos tool query --capability impact-analysis --status present` → GitNexus
`present`. Posture: **full** — mọi proof point risk map dưới đây giữ nguyên
yêu cầu blast-radius thật qua `impact({target, direction:"upstream"})`
trước khi sửa `resolveDiscovery`/`resolveDecompose`/`frontier`, theo
CLAUDE.md's GitNexus "Always Do".

## 3. Quyết định chưa có trong CONTEXT.md, chốt ở đây (không material — implementation-only)

CONTEXT.md tự xác nhận "Không còn câu hỏi mở nào" (§5). 3 điểm dưới đây là
chi tiết triển khai thuần, không đổi scope/behavior/data shape mà D1-D14
đã khoá — pin làm assumption, không hỏi lại người:

- **Event kind mới**: `work.gate-approve`, payload
  `{id, gate: 'contextApprove'|'planApprove'|'validateApprove', actor:
  'human'|'bypass', verify}`. Theo đúng pattern additive sẵn có
  (`addDiscovery`/`addFriction`/`addOutcome` — mỗi cái 1 `type` riêng, fold
  lazy trong `replay.mjs`, không cần enum trung tâm — xác nhận qua
  `src/state/store.mjs`, không event kind nào được validate qua danh sách
  cố định). Fold trong `replay.mjs`'s `work.move` case hiện tại (dòng
  ~142-170) đã tạo `gates[id]` lazy từ `ask`/`answer` — case mới
  `work.gate-approve` merge thêm field cùng object, không thay cấu trúc
  đang có.
- **Store function mới**: `recordGateApprove(dir, {id, gate, actor,
  verify})` trong `src/state/store.mjs`, cạnh `addDiscovery`/`addFriction`
  — validate `gate` thuộc đúng 3 giá trị D11, `actor` thuộc `'human'|
  'bypass'`, `verify` non-empty string. Không CAS, không FSM (giống
  `addDiscovery`) — approve record không tự nó chuyển stage.
- **Driver ceiling parse**: `stage:<name>` / `status:<name>` (D13) parse
  bằng tách theo dấu `:` đầu tiên, prefix không khớp 2 giá trị này là lỗi
  input tường minh (throw), không fallback đoán.

## 4. Cách chia (3 track độc lập theo §1 CONTEXT.md, mỗi track = 1 item con)

D2/D9: cả A+B+D phải nằm trong 1 plan, không vá lẻ theo round — nhưng đó là
ràng buộc ở tầng **plan**, không cấm chia thành nhiều item **thi công**
độc lập bên dưới plan đó. 3 track vốn đã tách bạch theo phạm vi (§1
CONTEXT.md), mỗi track có bề mặt file riêng, mỗi track tự đứng được với
verify riêng — chia item con đúng D5's tiêu chí ("mỗi mảnh tự thi công
được, verify chạy thật").

`fgos graph --json` cho thấy tsk-19j hiện `deps: []`, đứng biệt lập trong
đồ thị (component riêng) — không có `criticalPath`/`topUnblock` từ item
khác gợi ý thứ tự, nên thứ tự dưới đây suy từ phụ thuộc DỮ LIỆU thật giữa
3 track (B đọc field A ghi ra), không phải suy đoán ưu tiên.

### Item con 1 — `tsk-19j-1`: Approve record tường minh (Track A)

**Title:** "Thêm event kind `work.gate-approve` + field `gates[id].{contextApprove,planApprove,validateApprove}`, dạy 3 Gate section (exploring/planning/validating) tự ghi khi auto-approve HOẶC người approve"

**Phạm vi:**
- `src/state/store.mjs`: hàm `recordGateApprove` (mẫu §3).
- `src/state/replay.mjs`: case `work.gate-approve` mới, fold vào
  `gates[id][gate] = {actor, at: event.ts, verify}` (thêm case, không sửa
  case `work.move` hiện tại).
- `.claude/skills/fgos-coding-exploring/SKILL.md`, `fgos-coding-planning/SKILL.md`,
  `fgos-coding-validating/SKILL.md`: nhánh `true` (auto-approve) của mỗi Gate gọi
  thêm `recordGateApprove`/`fgos gate-approve` verb (actor=`bypass`) NGAY
  CẠNH `fgos decision` hiện có, không thay thế; nhánh `false` (người
  approve) gọi cùng verb với actor=`human` SAU KHI người trả lời "Approve"
  — đây là điểm còn thiếu theo CONTEXT.md §0 gap 1 ("bản ghi approve tường
  minh vẫn thiếu").
- `bin/fgos.mjs`: verb CLI mới `gate-approve` (mỏng, gọi thẳng
  `recordGateApprove`), theo đúng pattern verb mỏng có sẵn
  (`discovery`/`decision`).

**Rủi ro:** thấp-vừa — thuần additive (event kind mới, fold mới, không sửa
fold cũ). Proof point: `gates[id]` cho item cũ (không có event
`gate-approve` nào) phải fold y hệt trước/sau đổi — test hồi quy trên view
cũ đã có trong `test/state/replay.test.mjs`.

**Verify:**
```
node --test test/state/replay.test.mjs test/state/store.test.mjs test/state/gate-bypass.test.mjs
```

### Item con 2 — `tsk-19j-2`: Decompose-side skip-and-advance + verify thật (Track B)

**Phụ thuộc:** `tsk-19j-1` (đọc `gates[id].planApprove.verify` — field chưa
tồn tại thì không có gì đọc).

**Title:** "Port trust-signal skip-and-advance (tsk-ozl pattern) sang `resolveDecompose`; thay `FALLBACK_VERIFY` bằng verify thật từ approve record ở cả 2 skip path (discovery + decompose)"

**Phạm vi (đã điều chỉnh lúc thi công — xem "Phát hiện lúc thi công" bên
dưới):**
- `src/intake/plan.mjs` — `resolveDecompose`: skip `judgeDecompose`
  CHỈ khi `plan.md` (đọc qua `readLockedContext`, có sẵn) khai `mode =
  tiny`/`small` — không skip vô điều kiện chỉ vì `plan.md` tồn tại. Mọi
  nhánh advance sang `executing` (skip, pass-through thật, decompose thật,
  already-decomposed) đều dùng `verify: view.gates?.[id]?.planApprove?.verify
  ?? work.verify` thay vì bỏ trống/FALLBACK_VERIFY. Đây đúng gap 3 CONTEXT.md
  §0 nêu, phạm vi hẹp hơn "port y hệt tsk-ozl" như đề xuất ban đầu.
- `src/intake/discovery.mjs` — `resolveDiscovery`'s skip path (dòng
  294-311): đổi `verify: FALLBACK_VERIFY` (dòng 307) thành
  `view.gates?.[id]?.contextApprove?.verify ?? FALLBACK_VERIFY` — giữ
  fallback cho item chưa qua track A (backward-compat), ưu tiên verify
  thật khi có. Đây đúng gap 2 CONTEXT.md §0 ("verify khi skip-and-advance
  vẫn là placeholder").

**Phát hiện lúc thi công (tsk-19j-2, quan trọng — lệch khỏi mô tả gốc ở
trên có chủ đích):** "port y hệt trust-signal của resolveDiscovery" không
an toàn 1:1 cho decompose. Khác biệt cốt lõi: `resolveDiscovery`'s skip chỉ
đổi `stage` (không sinh dữ liệu mới); `resolveDecompose` có thể SINH CON
THẬT (`addWork`) — skip mù (chỉ dựa "plan.md tồn tại") sẽ bỏ qua chính việc
LLM đọc plan.md để tạo children, đúng thứ chính root `tsk-19j` này vừa cần
thật (`fgos plan tsk-19j` phải gọi `judgeDecompose` thật để sinh 3
item con — không skip được). Sửa: chỉ skip khi `plan.md` tự khai `mode =
tiny`/`small` (fgos-coding-planning's mode gate: 0-1 cờ → luôn single-piece, không
bao giờ chia) — mode khác hoặc không đọc được mode → fail-safe, vẫn gọi
`judgeDecompose` thật như hôm nay. Ghi qua `fgos decision` lúc thi công,
test `test/intake/plan.test.mjs` phủ cả 2 nhánh (skip đúng lúc tiny/
small, không skip lúc standard/high-risk hoặc thiếu plan.md).

**Rủi ro:** vừa-cao — sửa hành vi 2 engine function đang có test bao phủ
sống (`resolveDiscovery`/`resolveDecompose`), đường skip-and-advance là
đường THẬT được dùng bởi cả sync verb lẫn runner sweep (RUL19), một lỗi ở
đây ảnh hưởng mọi item claim qua `clarify`/`decompose`. Proof point bắt
buộc trước khi coi track này xong: `impact({target:"resolveDecompose",
direction:"upstream"})` và `impact({target:"resolveDiscovery",
direction:"upstream"})` — báo blast radius cho người trước khi sửa (posture
full, §2).

**Ràng buộc contract (tìm thấy ở fgos-coding-validating, xác nhận qua
`src/runner/loop.mjs:970-1000` + `bin/fgos.mjs`'s `decompose` verb, dòng
871+):** `loop.mjs`'s 2 sweep không đọc giá trị trả về (fire-and-forget,
chỉ log) — nhưng `bin/fgos.mjs`'s verb trả thẳng `resolveDecompose`'s
`{outcome, ...}` ra JSON, và `cook`/`pick`'s SKILL.md (§`plugins/fgOS/
skills/cook/SKILL.md`) switch cứng theo đúng tập giá trị hiện có
(`pass-through`/`noop`/`already-decomposed`/`need-human`/`invalid`/
`decompose`). Đường skip-and-advance mới của `resolveDecompose` BẮT BUỘC
trả `outcome: 'pass-through'` (tái dùng giá trị đã có, đúng ngữ nghĩa —
skip không sinh con) — KHÔNG được bịa giá trị mới (vd `'clear'`, theo kiểu
`resolveDiscovery`'s skip path), vì `cook` (và driver Track D sau này)
chưa biết xử lý giá trị lạ.

**Verify:**
```
node --test test/intake/discovery.test.mjs test/intake/plan.test.mjs
```

### Item con 3 — `tsk-19j-3`: Driver `fgos-coding-driving` + frontier generalize + retrofit cook/pick (Track D)

**Phụ thuộc:** không phụ thuộc dữ liệu vào item con 1/2 (driver chỉ đọc
`stage`/`status`, gọi skill theo `skillForStage`, không đọc `gates[id]`
trực tiếp) — thi công song song được, không bắt buộc chờ A/B xong.

**Title:** "Skill mới `fgos-coding-driving` (nhận id+ceiling `stage:<name>`/`status:<name>`, D9/D12/D13); tham số hoá `frontier(view, {step})` (mặc định `'Execute'`); retrofit `cook`/`pick` gọi driver thay logic riêng (D14)"

**Phạm vi:**
- `.claude/skills/fgos-coding-driving/SKILL.md` (mới) — implement đúng
  vòng lặp D9 §3: đọc stage/status tươi → `awaiting-human` thì dừng trả câu
  hỏi → `rank(stage hiện tại) >= rank(ceiling)` (hoặc `status == ceiling`
  khi ceiling là status) thì dừng TRƯỚC khi invoke (kiểm biên đã verify ở
  CONTEXT.md §3) → `skillForStage(getDomain(domain), stage)` động → invoke
  → skill tự gọi verb chuyển trạng thái → lặp lại.
- `src/state/frontier.mjs:78-98` — tham số hoá dòng `stageForStep(domain,
  'Execute')` thành `frontier(view, { step = 'Execute' } = {})`; giữ
  `isDepsAndLineageReady` (dòng 108-115) nguyên vẹn — đã stage-independent
  sẵn (theo CONTEXT.md §4).
- ~~`plugins/fgOS/skills/cook/SKILL.md`/`pick/SKILL.md` retrofit~~ —
  **HOÃN, tách thành item con riêng (xem "Phát hiện lúc thi công" bên
  dưới).** Không nằm trong verify của `tsk-19j-3`.

**Rủi ro:** vừa — skill mới (`fgos-coding-driving`) và `frontier.mjs`'s
tham số hoá đều thuần additive, không đụng code path cũ (mọi caller hiện
tại gọi `frontier(view)` không tham số, default `step='Execute'` giữ hành
vi byte-identical — xác nhận qua test mới).

**Verify:**
```
node --test test/state/frontier.test.mjs test/state/workflow-stage-graphs.test.mjs
```

**Phát hiện lúc thi công (tsk-19j-3, quan trọng — cắt bớt phạm vi có chủ
đích, không phải bỏ sót):** Retrofit `cook`/`pick` gọi
`fgos-coding-driving` KHÔNG thi công trong item con này, dời sang
**`tsk-19j-4`** (`fgos add`, `parent: tsk-19j`, cùng `docsRef`). Lý do cụ
thể, không phải ngại việc:

1. **Proof point plan.md tự đòi (chạy driver song song `cook` cũ, so kết
   quả) không giả lập an toàn được trong 1 session tự động** — `cook` là
   skill tương tác nhiều lượt hỏi-đáp người thật; không có cách chạy "song
   song" nó với driver mà không tốn hàng chục lượt turn thật hoặc giả lập
   câu trả lời (giả lập = không phải bằng chứng thật, đúng đại kỵ
   fgos-coding-validating's "no plausibility language as evidence").
2. **`cook` đang được dùng thật, đồng thời, bởi 1 session Claude Code khác
   trên chính repo này** (quan sát trực tiếp lúc thi công tsk-19j-2:
   `CK_SESSION_ID` khác đang tự chạy `fgos merge`/`fgos return` song song)
   — sửa `cook/SKILL.md` giữa lúc 1 phiên khác có thể đang follow đúng file
   đó là rủi ro thật, không phải giả định.
3. **Driver hiện tại (`fgos-coding-driving`, viết ở item con này) CHƯA phủ
   hết ngữ nghĩa `cook` đang có** — `cook`'s "never claim before stage
   executing" (hard rule), queue-seeding lúc submit, và "push children lên
   ĐẦU queue" lúc decompose sinh con đều là logic thuộc về NGƯỜI GIỮ QUEUE
   (cook), không phải driver (driver chỉ lái 1 item đã sẵn sàng, không sở
   hữu queue nhiều item). Retrofit thật cần driver's input/output contract
   rõ ràng hơn bản viết ở item con này — bản thân đó là việc, không phải
   chi tiết vặt.

Đây là cắt scope thật, có ghi lại, không phải "âm thầm bỏ dở" — D14 (retrofit
"gần như miễn phí") đúng cho phần MAPPING (stage→skill qua registry), sai cho
phần QUEUE OWNERSHIP mà lúc thảo luận D14 chưa tách bạch.

**`tsk-19j-4` (thi công sau, giải quyết gap trên):** Thiết kế lại kỹ hơn khi
bắt tay thi công cho thấy "queue ownership" của `cook` thật ra tách được
gọn thành 3 rule cơ học bổ sung vào chính `fgos-coding-driving` (không phải
việc riêng của `cook`):
1. **Anchor check** — item vừa `decompose` sinh con thật KHÔNG được driver
   tự invoke tiếp (root bị neo bởi con còn mở, đúng `frontier.mjs`'s
   `hasOpenDescendant`); driver dừng, báo id con còn mở, để caller (cook)
   tự đẩy con lên đầu queue — đây CHÍNH LÀ phần "queue ownership" thật của
   `cook`, còn lại (anchor detection) hoá ra thuộc về driver.
2. **Claim đúng lúc** — driver tự claim (`fgos pick`) ngay trước lần đầu
   invoke skill stage `executing`, CHỈ khi status chưa `doing` — generalize
   đúng hard rule cũ của `cook` ("never claim before executing") vào chính
   driver, `pick` (đã claim từ bước 2 của chính nó) tự nhiên no-op qua nhánh
   này.
3. **`awaiting-approval` là implicit stop** — phát hiện thêm: ceiling
   "unlimited" (không truyền ceiling) tự nó KHÔNG an toàn nếu thiếu điểm
   dừng tự nhiên này — driver sẽ cố invoke lại skill executing trên item đã
   return xong. Thêm cùng tier với `awaiting-human`/`blocked`.

Sau 3 bổ sung này, `cook`/`pick` retrofit thật sự "gần như miễn phí" đúng
như D14 kỳ vọng ban đầu — chỉ còn lại phần queue thật (thứ tự id, push con
lên đầu) là logic riêng của `cook`.

## 5. Thứ tự thi công

`tsk-19j-1` trước (nền tảng schema) → `tsk-19j-2` sau (đọc field A vừa có)
→ `tsk-19j-3` làm song song bất kỳ lúc nào (không phụ thuộc dữ liệu A/B),
nhưng RETROFIT `cook`/`pick` (phần cuối track D) nên đợi `tsk-19j-1`+
`tsk-19j-2` xong — vì sau retrofit, mọi lần `cook`/`pick` chạy qua
`fgos-coding-exploring`/`fgos-coding-planning`/`fgos-coding-validating` sẽ đụng đường ghi
approve record mới; đổi thứ tự ngược lại (retrofit trước) không sai kỹ
thuật nhưng dồn rủi ro 2 thay đổi lớn (schema mới + driver mới) vào cùng
một lần chạy thật, không tách được nguyên nhân nếu có lỗi.

## Outstanding questions

None
