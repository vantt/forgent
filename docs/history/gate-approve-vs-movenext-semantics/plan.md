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
| existing covered behavior | **có** | `resolveDiscovery`/`resolveDecompose`/`frontier()` đều có test suite sống (`test/intake/discovery.test.mjs`, `test/intake/decompose.test.mjs`, `test/state/frontier.test.mjs`) — đổi phải giữ xanh, không né |
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
- `.claude/skills/fgos-exploring/SKILL.md`, `fgos-planning/SKILL.md`,
  `fgos-validating/SKILL.md`: nhánh `true` (auto-approve) của mỗi Gate gọi
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

**Phạm vi:**
- `src/intake/decompose.mjs` — `resolveDecompose` (dòng ~359-408 hiện tại):
  trước khi gọi `judgeDecompose`, check `readLockedContext` (đã export sẵn,
  dùng lại y hệt tsk-ozl's pattern trong `discovery.mjs:285-311`) — có
  `plan.md` non-empty → skip model, `moveStage` thẳng sang `executing`,
  dùng `verify: view.gates?.[id]?.planApprove?.verify` (từ item con 1) thay
  vì gọi `judgeDecompose`. Đây đúng gap 3 CONTEXT.md §0 nêu
  ("`resolveDecompose` KHÔNG có skip-and-advance").
- `src/intake/discovery.mjs` — `resolveDiscovery`'s skip path (dòng
  294-311): đổi `verify: FALLBACK_VERIFY` (dòng 307) thành
  `view.gates?.[id]?.contextApprove?.verify ?? FALLBACK_VERIFY` — giữ
  fallback cho item chưa qua track A (backward-compat), ưu tiên verify
  thật khi có. Đây đúng gap 2 CONTEXT.md §0 ("verify khi skip-and-advance
  vẫn là placeholder").

**Rủi ro:** vừa-cao — sửa hành vi 2 engine function đang có test bao phủ
sống (`resolveDiscovery`/`resolveDecompose`), đường skip-and-advance là
đường THẬT được dùng bởi cả sync verb lẫn runner sweep (RUL19), một lỗi ở
đây ảnh hưởng mọi item claim qua `clarify`/`decompose`. Proof point bắt
buộc trước khi coi track này xong: `impact({target:"resolveDecompose",
direction:"upstream"})` và `impact({target:"resolveDiscovery",
direction:"upstream"})` — báo blast radius cho người trước khi sửa (posture
full, §2).

**Ràng buộc contract (tìm thấy ở fgos-validating, xác nhận qua
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
node --test test/intake/discovery.test.mjs test/intake/decompose.test.mjs
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
- `plugins/fgOS/skills/cook/SKILL.md` — thay bước 2's hardcode prose
  stage→skill (dòng dispatch `clarify`/`decompose`/`executing` hiện có)
  bằng 1 lời gọi `fgos-coding-driving(id, ceiling=unlimited/terminal)` cho
  mỗi id trong queue.
- `plugins/fgOS/skills/pick/SKILL.md` — bước 5 hiện "load fgos-routing,
  let it decide when to stop" (D9 gọi đây là mù mờ): thay bằng lời gọi
  driver tường minh `fgos-coding-driving(id, ceiling=unlimited hoặc
  status:awaiting-approval)`.

**Rủi ro:** vừa — skill mới không đụng code path cũ (an toàn khi chưa
retrofit xong), nhưng retrofit `cook`/`pick` đổi hành vi 2 skill đang dùng
thật trong vòng lặp dev hiện tại (kể cả session này, `/fgOS:pick` vừa
chạy). Proof point: chạy thử `fgos-coding-driving` trên 1 item nháp
(`stage:decompose` ceiling) SONG SONG với `cook` cũ trên 1 item khác trước
khi retrofit, so kết quả 2 đường phải khớp, rồi mới đổi `cook`/`pick` sang
gọi driver.

**Verify:**
```
node --test test/state/frontier.test.mjs test/state/workflow-stage-graphs.test.mjs
```
(driver skill tự thân là prose SKILL.md, không có unit test cơ học — proof
point ở trên, chạy tay 1 lượt trọn `clarify→decompose→executing` qua driver
trên 1 item nháp thật, là bằng chứng thay thế bắt buộc trước khi
`fgos-validating` coi track này xong.)

## 5. Thứ tự thi công

`tsk-19j-1` trước (nền tảng schema) → `tsk-19j-2` sau (đọc field A vừa có)
→ `tsk-19j-3` làm song song bất kỳ lúc nào (không phụ thuộc dữ liệu A/B),
nhưng RETROFIT `cook`/`pick` (phần cuối track D) nên đợi `tsk-19j-1`+
`tsk-19j-2` xong — vì sau retrofit, mọi lần `cook`/`pick` chạy qua
`fgos-exploring`/`fgos-planning`/`fgos-validating` sẽ đụng đường ghi
approve record mới; đổi thứ tự ngược lại (retrofit trước) không sai kỹ
thuật nhưng dồn rủi ro 2 thay đổi lớn (schema mới + driver mới) vào cùng
một lần chạy thật, không tách được nguyên nhân nếu có lỗi.

## Outstanding questions

None
