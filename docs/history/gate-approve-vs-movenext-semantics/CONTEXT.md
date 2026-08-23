# gate-approve-vs-movenext-semantics — CONTEXT

Item: tsk-19j. Trạng thái: clarify (decisions locked, chờ approve gate).

## 0. Đọc trước — tsk-ozl + tsk-2b0 (done) đã fix 1 phần, scope thật đã thu hẹp

`tsk-4y5` (done) tách ra `tsk-2b0` + `tsk-ozl` (cả 2 done, tự phát hiện độc
lập với item này):

- **`tsk-2b0`**: tách verb `fgos discover` (chỉ clarify)/`fgos plan`
  (chỉ decompose), hard-split, không dispatch theo stage nữa.
- **`tsk-ozl`**: fix đúng root-cause round-3 của item này — `resolveDiscovery`
  giờ có trust signal content-based (CONTEXT.md tồn tại+non-empty → skip
  LLM, `moveStage` thẳng). Áp cho cả sync verb lẫn automated sweep.

**tsk-ozl's CONTEXT.md tự nhận 3 gap chưa đóng — đây là scope thật còn lại:**
(1) bản ghi approve TƯỜNG MINH vẫn thiếu (trust-signal là cơ học, khác
"người đã nói có"), (2) verify khi skip-and-advance vẫn là `FALLBACK_VERIFY`
placeholder, (3) `resolveDecompose` KHÔNG có skip-and-advance tương tự
(luôn gọi `judgeDecompose`).

## 1. Phạm vi cuối cùng

Tách 3 trục độc lập, đúng đề xuất gốc tsk-19j:

- **A. Approve** — duyệt kết quả bước hiện tại, ghi nhận bền (field có cấu
  trúc), tách khỏi việc tiếp tục hay không.
- **B. Trust-signal engine work** — port skip-and-advance (đã có ở
  `resolveDiscovery`, tsk-ozl) sang `resolveDecompose` cho đối xứng; verify
  thật từ record approve (A), không phải placeholder.
- **C. Auto-approve/auto-pass (`gate-bypass.mjs`)** — đã đúng, không đụng.
- **D. Driver dùng chung, ceiling-parameterized** — thay hẳn ý tưởng ban đầu
  (verb/skill "move-next" rời, hay ceiling là field trên item — cả 2 đã bị
  bác trong quá trình thảo luận, xem §2 D4-D8 lịch sử). Kết luận cuối: 1
  skill driver, nhận `id`+`ceiling`, dùng chung cho MỌI loop của coding-domain
  work (cook/pick/discover-loop/planning-loop/execution-loop).

**Ngoài phạm vi:** `awaiting-human` gate (bề mặt khác). Domain khác ngoài
`coding` — D9/D10 không khẳng định driver tự動 tổng quát cho domain tương lai
(xem D10). `docs/specs/work-state.md:356-358` — doc-drift riêng (mô tả
`discover` cũ, đã lỗi thời sau tsk-2b0), không thuộc scope này.

## Locked decisions (D1-D10, giữ đủ lịch sử — D4-D8 đã bị supersede, không xoá)

| ID | Quyết định | Trạng thái |
|---|---|---|
| D1 | Approve record = field có cấu trúc trong `gates[id]`, không phải text | **Còn hiệu lực** |
| D2 | Scope = làm trọn A+B+D, không vá lẻ | **Còn hiệu lực** (D nay là D9, xem dưới) |
| D3 | Verify thật thay placeholder + port skip-and-advance sang decompose-side | **Còn hiệu lực**, revised: clarify-side skip đã có sẵn (tsk-ozl), chỉ còn verify + decompose-side |
| D4 | Verb/skill "move-next" mới, tách biệt | **SUPERSEDED** bởi D9 |
| D5 | Ceiling = tên stage tuyệt đối qua biến môi trường | **SUPERSEDED** bởi D9 (ceiling giờ là tham số của driver skill, không phải env var) |
| D6 | Move-next chỉ áp 1 transition/lần, loop do caller giữ | **Một phần đúng** — driver (D9) vẫn nội bộ loop qua nhiều stage cho 1 item, nhưng ĐÂY LÀ 1 skill/agent-level loop, không phải bare CLI verb loop — không mâu thuẫn D6's tinh thần (verb vẫn chỉ áp đúng 1 transition/lần gọi) |
| D7 | Không cần verb mới — dạy resolveDiscovery/resolveDecompose có sẵn | **Còn hiệu lực**, tsk-ozl đã làm phần clarify-side |
| D8 | Ceiling = tham số `--stop-at` riêng cho `/fgOS:cook` | **SUPERSEDED** bởi D9 — không phải cook-specific, là driver dùng chung |
| D9 | Driver thống nhất (xem §3) — cook/pick/discover-loop/planning-loop/execution-loop đều là driver này, khác `id`-nguồn + `ceiling` | **Còn hiệu lực** |
| D10 | Scope correction: D9 chỉ khẳng định đúng cho domain `coding` thật — KHÔNG khẳng định tự động tổng quát domain tương lai | **Ràng buộc quan trọng lên D9** |
| D11 | Field A (D1) shape cuối: 3 field song song `gates[id].contextApprove`/`planApprove`/`validateApprove` (không phải 2 — cả 3 skill exploring/planning/validating đều có Gate riêng), mỗi field `{actor: 'human'\|'bypass', at, verify}` | **Còn hiệu lực, chốt cuối cho D1** |
| **D12** | **Tên skill driver = `fgos-coding-driving`** (không phải `fgos-driving` trung tính) — vì nó là vòng lặp cơ học không chứa nội dung domain nào, dễ bị hiểu lầm dùng được mọi domain hơn hẳn 5 skill kia | **Chốt cuối** |
| **D13** | **Ceiling dùng prefix tường minh** `stage:<name>` / `status:<name>` (vd `stage:decompose`, `status:awaiting-approval`) — không tự nhận diện qua 2 tập tên không giao nhau | **Chốt cuối** |

## 3. D9 — Driver thống nhất, chi tiết cơ chế

**Tên skill:** `fgos-coding-driving` (D12).

**Input:** `id` (item cần đưa qua tiến trình), `ceiling` — `stage:<name>` HOẶC
`status:<name>` (D13, prefix tường minh — vd `status:awaiting-approval` cho
execution-loop, vì bước kế sau executing là review/merge, không phải 1 stage
FSM khác).

```
loop:
  đọc stage/status hiện tại của item (fresh read)
  NẾU status == 'awaiting-human' → dừng, trả câu hỏi lên người gọi
  NẾU rank(stage hiện tại) >= rank(ceiling) HOẶC status == ceiling (khi ceiling là status)
    → DỪNG, không invoke gì thêm, báo "reached ceiling at <stage/status>"
  NGƯỢC LẠI:
    skill = skillForStage(getDomain(item.domain), stage)  // ĐỘNG, không hardcode
    invoke skill (skill tự Socratic/shape/implement + tự approve gate theo A/B)
    skill xong → nó gọi verb chuyển trạng thái (fgos discover/decompose/
      return+compound) → item advance
    quay lại đầu loop
```

**Kiểm biên đã verify:** check ceiling xảy ra TRƯỚC KHI invoke skill của
stage hiện tại (không phải sau) — đây là điều kiện đúng để discover-loop
(`ceiling=decompose`) dừng ĐÚNG chỗ: item vào `clarify`, invoke
fgos-coding-exploring, nó gọi `fgos discover` → item thành `decompose` → vòng lặp
quay lại, check `decompose >= decompose` → DỪNG, không invoke `fgos-coding-planning`.

**Cách 5 loop hiện có/dự kiến map vào D9 (đều là driver này, không phải 5 cơ
chế riêng):**

| Loop | Nguồn `id` | `ceiling` |
|---|---|---|
| `/fgOS:cook` | submit mới, + children khi decompose sinh ra | unlimited/terminal |
| `/fgOS:pick` | claim 1 item cụ thể | unlimited/terminal (thay "để hand-off tự quyết" mù mờ hiện tại bằng lời gọi driver tường minh) |
| discover-loop (herdr, mới) | `fgos ready --step Clarify` (§4, cần generalize) | `stage:decompose` |
| planning-loop (herdr, mới) | `fgos ready --step Divide` | `stage:executing` |
| execution-loop (herdr, mới) | `fgos ready --step Execute` (đã có, không đổi) | `status:awaiting-approval` |

**Lợi ích phụ:** driver dùng `skillForStage` động → vá luôn lỗ DRY đã tìm
thấy ở `cook` (hardcode prose stage→skill, không tự cập nhật khi registry
đổi, cùng loại lỗi vụ `discover`/`decompose` verb-split vừa gặp).

## 4. Cần làm thêm: generalize `frontier()`/`fgos ready`

`src/state/frontier.mjs:78-98` — `frontier(view)` hardcode
`executeStage = stageForStep(domain, 'Execute')` (dòng 90-91). Cần tham số
hoá thành `frontier(view, { step })` (mặc định `'Execute'` để không đổi hành
vi cũ). Phần "deps-ready + no-open-descendant" đã tách sẵn qua
`isDepsAndLineageReady` (dòng 108-115, stage-independent, dùng bởi `pick`'s
claim-eligibility) — chỉ cần tham số hoá đúng 1 dòng hardcode, không viết
lại logic.

**Hệ quả có sẵn, miễn phí:** item bị split (sinh con) tự động BIẾN MẤT khỏi
MỌI frontier (kể cả frontier của step khác) nhờ `hasOpenDescendant` đã có —
câu hỏi "root dừng ở đâu khi sinh con" (từng bàn ở round 2-4) TỰ GIẢI, không
cần cơ chế mới: con xuất hiện ở frontier của STEP riêng chúng, root vắng mặt
khỏi mọi frontier cho tới khi con `done`.

## 5. Câu hỏi hình dạng — ĐÃ CHỐT HẾT (D11-D14)

- D11: field shape (object + actor, 3 field song song).
- D12: tên skill = `fgos-coding-driving`.
- D13: ceiling prefix `stage:`/`status:`.
- D14: **CÓ retrofit `cook`/`pick`** để gọi `fgos-coding-driving` thay vì tự
  cài logic riêng — sau khi có driver, `pick` = claim + driver(ceiling
  unlimited/`status:awaiting-approval`), `cook` = submit + driver cho từng
  id trong queue — cả hai chỉ còn là wrapper mỏng, không còn lý do giữ logic
  cũ song song. `decompose-parity` = port nguyên pattern tsk-ozl, không phải
  quyết định mới, không cần D riêng.

Không còn câu hỏi mở nào — sẵn sàng cho `fgos-coding-planning` shape thành plan cụ
thể (phases, có tách item con hay không).

## Outstanding questions

None

## 6. Scout evidence

- `src/intake/discovery.mjs:1-33,260-289` — trust-signal skip-and-advance
  (tsk-ozl), vẫn `FALLBACK_VERIFY`.
- `src/intake/plan.mjs:36-50,80-99,192,279+,330-331` — `readLockedContext`,
  chưa có skip-and-advance riêng.
- `bin/fgos.mjs:871+` — verb `discover`/`decompose` hard-split (tsk-2b0).
- `src/state/frontier.mjs:78-98,100-115` — `frontier()` hardcode 'Execute';
  `isDepsAndLineageReady` đã stage-independent, tái dùng được.
- `src/state/workflow-stage-graphs.mjs` — domain registry (`coding`,
  `synthetic` — `synthetic.skillMap: {assembling: null}`, dùng làm ví dụ
  trong D10's thảo luận, KHÔNG phải bằng chứng chắc chắn cho việc driver
  không tổng quát được).
- `.claude/skills/fgos-routing/SKILL.md` — nơi DUY NHẤT tra động qua
  `getDomain`/`skillForStage` hôm nay.
- `plugins/fgOS/skills/cook/SKILL.md:57-109` — hardcode prose stage→skill,
  KHÔNG gọi `skillForStage` (lỗ DRY, D9 vá được).
- `plugins/fgOS/skills/pick/SKILL.md` — bước 5: load `fgos-routing`, "let
  it decide when to stop" (mù mờ, D9 thay bằng lời gọi driver tường minh).
- `docs/history/discover-verb-context-blind-clarify-judge/CONTEXT.md`
  (tsk-ozl), `docs/history/discover-decompose-verb-split/` (tsk-2b0).
- Report đầy đủ (9+ vòng thảo luận):
  `plans/reports/research-gate-semantics-260731-1052-approve-vs-movenext-report.md`.

## 7. Thuật ngữ chốt

- **Gate** = skill-embedded confirmation ("Approve CONTEXT.md?"/"Approve
  plan.md?") — khác `awaiting-human`.
- **Trust signal** (tsk-ozl) = content-based check khiến engine bỏ LLM
  judge — khác "approve record" (D1, tường minh hơn, có actor/verify).
- **Driver** (D9, tên `fgos-coding-driving` per D12) = skill orchestration
  nhận `id`+`ceiling` (`stage:<name>`/`status:<name>`, per D13), lặp qua
  nhiều stage của 1 item cho tới ceiling — KHÔNG phải bare CLI verb, KHÔNG
  phải field bền trên item.
- **Ceiling** = stage/status tối đa 1 lần gọi driver được phép đưa item
  tới — tham số của lời gọi driver, không phải cấu hình bền, không phải
  biến môi trường process.
