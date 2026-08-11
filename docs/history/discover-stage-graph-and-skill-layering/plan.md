# Plan: tsk-tku — Skill chủ fgos-coding-discovering cho stage discovery

Mode: **standard**

Đếm cờ theo Mode-gate (`fgos-routing`): **public contracts** (repoint
`skillMap.discovery` đổi hợp đồng "skill nào load khi item ở stage
discovery" cho MỌI item domain `coding` từ giờ — cả đường tương tác lẫn
đường headless dispatch của runner), **existing covered behavior** (chạm
`workflow-stage-graphs.mjs` và `fgos-coding-driving/SKILL.md`, cả hai đã có
test bao phủ trực tiếp — xem Approach). Không có cờ hard-gate nào (không
auth/data-loss/audit-security/external-provider/xoá-validation) → 2 cờ →
**standard**, khớp với `tier: "standard"` item đã tự mang sẵn.

Không lane nào được handoff sẵn (claim thẳng qua `/fgOS:pick`, chưa qua
`fgos-routing`'s Orient) và `plan.md` trong thư mục này đang mang nội dung
của item khác (`tsk-qod`, item liền trước trong cùng cây, per-item
overwrite convention của thư mục này) — áp dụng fallback Mode-gate như
CONTEXT.md's Feature boundary đã ghi.

## Approach

**Khuôn "skill chủ"**, theo đúng phép thử D7: mở file skill ra, có gọi
`fgos <verb>` để tự chuyển stage/status của chính item không. Đọc trực
tiếp hai skill hiện có làm khuôn:

- `fgos-researching` (helper, KHÔNG đổi trong item này) — khuôn
  mechanical-routing (search repo trước, external sau), fan-out theo gói
  hợp đồng 6 trường, tự ghi `RESEARCH.md`, trả `{clear, verify?, question?}`
  về caller — KHÔNG bao giờ ghi state. `fgos-coding-discovering` gọi helper
  này (bao nhiêu lần tuỳ nhu cầu), y hệt cách `fgos-coding-exploring` và
  `fgos-coding-planning` đã gọi nó hôm nay.
- `fgos-coding-exploring`'s own Gate section — khuôn tự gọi engine verb sau
  khi tự phán: `fgos discover --verdict clear --verify "..."` /
  `--verdict unclear --question "..."`. `fgos-coding-discovering` tái dùng
  đúng khuôn Gate này (kiểm tra gate-bypass trước, log qua `fgos decision`
  + `fgos gate-approve`, rồi tự gọi verb) — khác biệt duy nhất: discovery
  là pha MÁY-MỘT-MÌNH (D6), nên không có nhánh hỏi người ở gate — chỉ có
  `clear`/`unclear`, không có "Approve before planning?" như exploring.

**Bằng chứng thật đã kiểm tra (không phải giả định), thay đổi phạm vi thật
so với mô tả gốc của item:**

`bin/fgos.mjs`'s `discover` case + `src/intake/discovery.mjs`'s
`resolveDiscovery`/`nextDiscoveryEdge` — engine verb không cần sửa, đã
domain-aware qua `discoverableStages` (tsk-4b2), nhận `callerVerdict` trực
tiếp. Item's own description đúng: không cần sửa
`worker-prompt-discovery.txt` vì `buildPrompt` (`src/runner/dispatch.mjs`
dòng 149: `const skillName = skillForStage(domainObj, stage);`) đã resolve
`skillPath` động qua `skillForStage`, không hardcode.

**NHƯNG** — chính vì `buildPrompt` resolve động, đổi `skillMap.discovery`
làm **2 test hiện có hỏng thật**, không phải giả định:
- `test/state/workflow-stage-graphs.test.mjs:87` —
  `assert.equal(DOMAINS.coding.skillMap.discovery, 'fgos-researching')`.
- `test/state/workflow-stage-graphs.test.mjs:168` —
  `assert.equal(skillForStage(DOMAINS.coding, 'discovery'), 'fgos-researching')`.
- `test/runner/dispatch.test.mjs:189-194` (tên test + assertion
  `prompt.includes('.claude/skills/fgos-researching/SKILL.md')`).
- `test/runner/dispatch.test.mjs:1530-1541` (tên test + assertion tương tự
  trên `spawnWorker`'s output).

Cả 4 chỗ đều nằm trong `npm test` — verify của item đã bắt đầu bằng
`npm test`, nên đây không phải việc ngoài phạm vi, mà là phần bắt buộc của
**existing covered behavior** — 4 chỗ này phải sửa CÙNG lúc với việc đổi
`skillMap.discovery`, không phải một bước riêng.

**Việc KHÔNG cần sửa (đã kiểm tra, không phải bỏ sót):**
`test/intake/discovery.test.mjs:39`, `test/intake/plan.test.mjs:76` chỉ là
COMMENT nhắc `fgos-researching`'s `RESEARCH.md`, không phải assertion trên
skill path — vẫn đúng sau đổi này vì helper đó không đổi. Hai comment ở
`test/e2e/runner-loop.test.mjs:505-518` mô tả "worker chạy fgos-researching"
hơi lệch sau đổi này (worker giờ load `fgos-coding-discovering`, skill đó
mới gọi `fgos-researching` như helper bên trong) — sửa nhẹ cho đúng, rủi ro
= 0 (chỉ prose, không test logic).

**impact-analysis posture:** `fgos tool query --capability impact-analysis
--status present` → `gitnexus`, `status: "present"` → **full**. GitNexus
index báo stale so với HEAD hiện tại (hook cảnh báo trong phiên này) —
bằng chứng blast-radius ở trên dựa trên đọc code trực tiếp + `rg`/`grep`
(đã liệt kê từng dòng thật), không dựa vào `impact()`/`detect_changes()`
— **degraded nhưng đã cross-check**, cùng ghi chú `tsk-403`'s
`iron-law-evidence.md` đã dùng cho tình huống tương tự.

**Phương án bị loại.** Viết `fgos-coding-discovering` KHÔNG gọi
`fgos-researching` mà tự làm research trực tiếp — bị loại vì trùng lặp cơ
chế mechanical-routing/fan-out helper đó đã có, đúng lý do D7 tách chủ
khỏi helper ngay từ đầu. Sửa `worker-prompt-discovery.txt` — bị loại, đã
xác nhận thật không cần (xem trên).

## Shape (phased — mode standard)

### Phase 1 — Tạo `fgos-coding-discovering` (cả hai mirror)

- `.claude/skills/fgos-coding-discovering/SKILL.md` và
  `.agents/skills/fgos-coding-discovering/SKILL.md` (nội dung giống hệt,
  đúng khuôn mirror D15 đã dùng).
- Nội dung: Hard rules (gọi `fgos <verb>` với `--dir` main checkout; relay
  `lock-timeout`; không tự nghiên cứu trực tiếp — luôn qua helper
  `fgos-researching`; không tự phán domain/tier/kind/risk trong item này —
  D12's phần đó là task 4, ghi rõ thành non-goal tường minh thay vì im
  lặng bỏ qua). Flow: đọc `view.discovery[id]` cũ (nếu có) + `CONTEXT.md`/
  `docsRef` nếu item đã có; soi ambiguity; gọi `fgos-researching` (1+ lần,
  helper tự ghi `RESEARCH.md`); tự phán `clear`/`unclear` từ finding thật,
  không phỏng đoán. Gate: check gate-bypass tương tự exploring/planning
  NHƯNG không có nhánh hỏi người (D6: máy-một-mình) — verdict
  `clear`/`unclear` tự động dẫn thẳng tới lệnh gọi verb tương ứng,
  `fgos discover --verdict clear --verify "..."` hoặc
  `--verdict unclear --question "..."`, không có bước "Approve?" nào.

**Proof point (risk: THẤP).** `test -f
.claude/skills/fgos-coding-discovering/SKILL.md` (đúng literal verify của
item) + tồn tại đồng thời ở `.agents/skills/` (không nằm trong verify
chính thức của item, nhưng đúng khuôn mirror đã có tiền lệ bắt buộc —
kiểm tra tay/qua `npm test` nếu có test nào check mirror parity).

### Phase 2 — Trỏ registry + sửa 4 test đã hỏng thật

- `src/state/workflow-stage-graphs.mjs`: `skillMap.discovery` đổi từ
  `'fgos-researching'` sang `'fgos-coding-discovering'`.
- `test/state/workflow-stage-graphs.test.mjs` dòng 87, 168: đổi giá trị kỳ
  vọng sang `'fgos-coding-discovering'`.
- `test/runner/dispatch.test.mjs` dòng ~189-194, ~1530-1541: đổi
  `.includes('.claude/skills/fgos-researching/SKILL.md')` sang
  `.includes('.claude/skills/fgos-coding-discovering/SKILL.md')`, đổi luôn
  tên test (đang nhắc "fgos-researching" trong chính literal string mô tả
  test) cho khớp thật — không để tên test nói sai sau khi sửa xong.

**Proof point (risk: TRUNG BÌNH — điểm dễ vỡ nhất, đã đo chính xác).**
`npm test` phải xanh nguyên vẹn — đặc biệt 2 file trên, đã đọc dòng thật,
không phải suy đoán phạm vi.

### Phase 3 — Gỡ khối ngoại lệ khỏi `fgos-coding-driving` (cả hai mirror)

- Xoá toàn bộ section `## Discovery and exploring stages` khỏi
  `.claude/skills/fgos-coding-driving/SKILL.md` VÀ
  `.agents/skills/fgos-coding-driving/SKILL.md` — cùng lúc, cùng nội dung,
  đúng khuôn mirror.
- Xoá luôn 2 dòng red flag riêng của khối đó (`## Red flags` list có 2 mục
  nhắc `fgos-researching`/`discovery` cụ thể: "invoking fgos-researching at
  stage discovery and treating its returned verdict as informational..."
  — mục này chết cùng khối, vì `fgos-coding-discovering` giờ tự gọi verb,
  không còn caller nào ở NGOÀI stage-skill làm việc đó nữa).
- KHÔNG xoá phần Hard rule khác nhắc "one documented exception" nếu câu đó
  còn xuất hiện tách rời ở chỗ khác trong file — đọc lại thật lúc sửa, chỉ
  xoá đúng đoạn nói về discovery, giữ nguyên phần còn lại của Hard rules
  (nguyên tắc "chỉ xoá đúng đoạn cũ, không xoá lây").

**Proof point (khớp literal verify của item).**
`! grep -q "Discovery and exploring stages"
.claude/skills/fgos-coding-driving/SKILL.md` — item's own verify command,
không cần thêm gì.

### Phase 4 (nhẹ, không bắt buộc theo verify nhưng đúng chuẩn prose-accuracy)

- Sửa 2 đoạn comment ở `test/e2e/runner-loop.test.mjs:505-518` — đổi "the
  runner dispatches a stage:discovery item to a real worker running
  fgos-researching" thành mô tả đúng: worker load `fgos-coding-
  discovering`, skill đó tự gọi `fgos-researching` như helper bên trong.
  Rủi ro = 0 (comment-only), làm để không để lại prose sai theo đúng tinh
  thần D19-style "không nói sai sự thật mới" `tsk-qod`'s plan đã áp dụng
  cho trường hợp tương tự.

## Documentation touch points (đọc thật, không phải phỏng đoán)

`rg -l "fgos-researching"` ngoài các file Phase 1-4 đã liệt kê: không còn
chỗ nào khác cần sửa — `fgos-researching` VẪN LÀ helper thật, file/nội
dung của nó không đổi, chỉ có NGƯỜI GỌI nó ở stage `discovery` đổi từ
"trực tiếp qua fgos-coding-driving's exception" sang "gián tiếp qua
fgos-coding-discovering".

## Assumptions

1. Prose cụ thể bên trong `fgos-coding-discovering/SKILL.md` (câu chữ Hard
   rules/Flow/Gate) là chi tiết triển khai, không phải quyết định sản
   phẩm — D4/D6/D7/D8/D9 đã khoá đủ WHAT, prose HOW để lúc code, miễn
   đúng khuôn mirror + đúng phép thử chủ-vs-helper D7.
2. Không viết logic phán lại `tier`/`kind`/`risk` vào skill mới này (D12,
   thuộc task 4/`tsk-2yo`) — ghi rõ thành non-goal tường minh trong chính
   SKILL.md mới, không im lặng bỏ sót, để người đọc lạnh không tưởng lầm
   đây là thiếu sót.
3. Không cần split thành item con — một việc trọn vẹn (tạo 1 skill + sửa 2
   file registry/driver + sửa test đi kèm), không có nhánh phụ thuộc chuỗi
   cần tách riêng.

## Outstanding questions

None
