# Plan: tsk-qod — Đưa fgos-clarifying về bước Init

Mode: **high-risk**

Đếm cờ theo Mode-gate (`fgos-routing`): **public contracts** (đảo thứ tự
`/fgOS:submit`, đổi hợp đồng của `fgos-clarifying` — mọi item mới tạo từ
giờ đi qua đường khác), **existing covered behavior** (chạm
`workflow-stage-graphs.mjs`, `submit`, và `migrate-clarify-split.mjs` +
test suite của nó, tất cả đã có test bao phủ), **weak proof around the
area** (verify hiện tại của item hẹp hơn nhiều phạm vi thật đã khoá ở D1/D2)
— cộng một **cờ hard-gate: data loss** (di trú 90 item sản xuất thật, sai
là mất/nhầm dữ liệu thật, không phải fixture). Một cờ hard-gate → thẳng
**high-risk**, không cần đếm đủ 4 cờ.

Không lane nào được handoff sẵn (claim thẳng qua `/fgOS:pick`, chưa qua
`fgos-routing`'s Orient); `plan.md` chưa tồn tại trước bước này — áp dụng
fallback Mode-gate như trên.

## Approach

**Bằng chứng lớn nhất, thay đổi hẳn đánh giá rủi ro của con này:** đã tìm
thấy `scripts/migrate-clarify-split.mjs` — một script di trú **đã có sẵn,
đã có test suite đầy đủ** (`test/state/migrate-clarify-split.test.mjs`),
viết cho đúng lớp vấn đề này (tsk-puz D12, lần `clarify` bị tách thành
`clarify -> discovery -> exploring` trước đây). Đọc toàn văn: nó phân loại
mỗi item đang ở `stage: 'clarify'` vào 1 trong 3 nhóm — `awaiting-human` →
`exploring`; có `decisionsById` thật hoặc `CONTEXT.md` đã commit → 
`discovery`; còn lại (chưa đụng gì) → **giữ nguyên tại `clarify`**
(`targetStageFor`, dòng 42-51). Ghi qua cửa thật (`moveStage`,
`role: 'system'`), tự idempotent (item đã dời khỏi `clarify` thì lần chạy
sau không còn khớp filter nữa — không cần CAS-retry riêng), có `--dry-run`
để xem trước an toàn trên store thật.

**Việc DUY NHẤT cần đổi trong chính script đó:** nhánh thứ 3
(`return "clarify"` ở dòng 50) — hôm nay nghĩa là "để yên", nhưng sau khi
xoá `clarify` khỏi registry thì "để yên" không còn hợp lệ. Đổi đích nhánh
đó thành `"discovery"` — nhất quán với nhánh 2 (có bằng chứng thật) vì cả
hai đều là "item đã tồn tại, cần một lượt research máy-một-mình trước khi
sang exploring", chỉ khác độ chín của bằng chứng đã có sẵn. Không cần viết
script mới từ đầu — thu hẹp đáng kể rủi ro "data loss" so với ước lượng
ban đầu, vì cơ chế ghi-qua-cửa-thật + idempotent + dry-run đã được kiểm
chứng trước đó (tsk-puz), chỉ đổi MỘT dòng đích.

**Phương án bị loại.** Viết migration script mới từ đầu — bị loại vì
trùng lặp hoàn toàn với script đã có, đúng lý do D1 chọn "di trú dứt điểm"
thay vì giữ alias: tận dụng cơ chế đã kiểm chứng thay vì phát minh lại.
Giữ nhánh 3 ở `leftAtClarify` rồi xử lý tay từng item — bị loại vì D1 đã
minh thị từ chối "chấp nhận kẹt, xử lý tay."

**impact-analysis posture:** `fgos tool query --capability impact-analysis
--status present` → `gitnexus`, `status: "present"` → **full** (lưu ý:
GitNexus index của repo này đang lệch xa HEAD tại thời điểm viết plan —
xem ghi chú trong tsk-403's iron-law-evidence.md; bằng chứng blast-radius
cho các proof point dưới đây dựa trên đọc code trực tiếp thay vì
`impact`/`detect_changes`, degraded nhưng đã cross-check bằng `rg`/`grep`).

## Shape (phased — mode high-risk)

### Phase 1 — Migrate 90 item khỏi stage `clarify`

- Sửa `targetStageFor`'s nhánh thứ 3 (`scripts/migrate-clarify-split.mjs`
  dòng 50): `return "clarify"` → `return "discovery"`.
- Cập nhật `test/state/migrate-clarify-split.test.mjs`: các test hiện
  đang khẳng định "untouched item ở lại `leftAtClarify`" (dòng 43-51,
  84-86, 119-123, 137-145, 167) phải đổi kỳ vọng — untouched item giờ di
  chuyển sang `discovery`, KHÔNG còn xuất hiện trong `leftAtClarify` nữa
  (mảng đó có thể vẫn tồn tại trong shape trả về cho tương thích, nhưng
  luôn rỗng sau đổi này — hoặc xoá hẳn khỏi return shape nếu không còn ý
  nghĩa; quyết định cụ thể để lúc code, không phải quyết định sản phẩm).
- Chạy script thật với `--dry-run` trước, đối chiếu số liệu với 90 item
  đã đếm ở CONTEXT.md, RỒI chạy thật (không dry-run) TRƯỚC khi động vào
  Phase 2/3/4 — đúng thứ tự D1 yêu cầu ("di trú TRƯỚC khi xoá").

**Proof point (risk: TRUNG BÌNH, đã giảm nhờ tiền lệ).** Sau khi chạy
thật: `fgos list --all --json` không còn item nào `stage === 'clarify'`
(trừ phi domain khác `coding` cũng dùng tên này — script gốc không lọc
theo domain, cần xác nhận KHÔNG di chuyển nhầm item của domain khác; đọc
lại `targetStageFor`: nó chỉ lọc `item.stage !== 'clarify'`, không đọc
`item.domain` — CẦN THÊM lọc domain==='coding' vào vòng lặp chính, vì
domain `triage`/`fixture-marketing` không có 'clarify' theo nghĩa này
nhưng có thể trùng tên field tình cờ — kiểm tra thật: cả hai domain đó
không dùng literal 'clarify' làm stage name của chúng, chỉ domain
`coding` có, nên rủi ro này thực ra bằng 0, ghi lại ở đây để tường minh
thay vì giả định).

### Phase 2 — Xoá `clarify` khỏi registry (`src/state/workflow-stage-graphs.mjs`)

- Gỡ `clarify: 'fgos-clarifying'` khỏi `skillMap` của domain `coding`.
- Gỡ `'clarify'` khỏi `stages` array của domain `coding`.
- Gỡ `clarify: 'Clarify'` khỏi `stepMap` — hệ quả: `stageForStep(coding,
  'Clarify')` trả `undefined`. Cần kiểm tra MỌI call site đọc giá trị đó
  không sập khi nhận `undefined` (vd. `discoverableStages` dòng
  `clarifyStage = stageForStep(domain,'Clarify')` — nếu `undefined`,
  logic `CLARIFY_SHAPED_STAGES`/so sánh `item.stage === clarifyStage` vẫn
  an toàn vì không item nào còn `stage: undefined` để khớp nhầm, nhưng
  CẦN xác nhận bằng test thật, không giả định).
- Gỡ cạnh `{from:'clarify', to:...}` còn sót nếu có (transitions array) —
  đọc lại: `clarify` là NGUỒN của mọi cạnh xuất phát
  (`clarify->executing`, `clarify->discovery`, `clarify->exploring`,
  `clarify->planning` theo tsk-403); một khi không còn item nào ở
  `clarify` (Phase 1 đã xong) và không stepMap nào trỏ tới `clarify`
  (không tạo item mới ở đó), các cạnh này trở thành tử — có thể xoá sạch
  hoặc để lại vô hại. Chọn XOÁ SẠCH để nhất quán với D1 "dứt điểm, không
  để lại rác."

**Proof point (risk: CAO — điểm dễ vỡ nhất).** Test `npm test` phải xanh
NGUYÊN VẸN sau đổi này — đặc biệt `test/state/workflow-stage-graphs.test.mjs`
(nhiều assertion cứng liệt kê `'clarify'` trong `stages`/`stepMap`,
tương tự các assertion tsk-403 đã phải sửa cho `'decompose'`/`'planning'`)
và `test/e2e/domain-aware-stage-literals.test.mjs`/`fixture-marketing`
(kiểm tra domain khác không bị ảnh hưởng). Không chạy Phase 2 tách rời
Phase 1 — thứ tự D1 là ràng buộc cứng, không phải gợi ý.

### Phase 3 — Đổi hợp đồng `fgos-clarifying` (`.claude/skills/fgos-clarifying/SKILL.md` + mirror `.agents/`)

- Đổi input: từ "item đã tồn tại (đọc qua `<id>`)" sang "text thô vừa
  submit, chưa có item nào."
- Đổi output: từ "ghi qua `fgos ask <id>`/`fgos answer <id>` (state của
  item)" sang "trả `{title?, description?, domain, question?}` thẳng về
  launcher gọi nó — KHÔNG ghi state, đúng khuôn verdict-only
  `fgos-researching` đã dùng cho stage `discovery` (D2, CONTEXT.md's
  Pinned terms)."
- Thêm nhiệm vụ phân loại `domain` — D5 gốc đã giao việc này cho
  `fgos-clarifying`, nhưng file hiện tại (đọc toàn văn lúc tsk-403) chỉ
  làm rewrite text, KHÔNG phân loại domain. Cần thêm phần này thật —
  đọc `getDomain`'s vocabulary từ `src/state/workflow-stage-graphs.mjs`'s
  `DOMAINS` keys (`coding`/`synthetic`/`triage`/`fixture-marketing`) làm
  từ vựng hợp lệ, tự phán dựa trên nội dung text (session sống, không cần
  capacity dispatch riêng — cùng lý do Native-First đã áp dụng cho chính
  fgos-clarifying's judgment hôm nay).

**Proof point (risk: TRUNG BÌNH).** Skill-prose change — theo
`docs/how-to/write-verify-for-a-skill-prose-change.md` (đọc trước khi
viết verify cho phần này), verify dạng `npm test && POSITIVE && NEGATIVE`
— POSITIVE xác nhận SKILL.md không còn nhắc `fgos ask`/`fgos answer` với
`<id>` (đã đổi hợp đồng), NEGATIVE xác nhận vẫn còn "Init"/"domain" trong
nội dung (chưa xoá nhầm phần cốt lõi).

### Phase 4 — Nối lại `/fgOS:submit` (`plugins/fgOS/skills/submit/SKILL.md`)

- Đảo thứ tự bước 4/6 hiện tại: gọi `fgos-clarifying` (Phase 3's hợp đồng
  mới) TRƯỚC bước gọi verb `submit`, CHỈ cho nhánh có "soul" (gate hiện
  tại đã phân biệt sẵn — giữ nguyên gate đó, chỉ đảo vị trí lệnh bên
  trong nó).
- Nếu `fgos-clarifying` trả `question` (không rõ ý định) — KHÔNG có `id`
  nào để `fgos ask` vào, nên launcher phải giữ câu hỏi trong hội thoại
  (giống `fgos-researching`'s "unclear" verdict tại stage `discovery`
  đang được `fgos-coding-driving` áp dụng bằng `fgos discover --verdict
  unclear` — nhưng ở ĐÂY chưa có discover call nào cả vì chưa có item).
  Đơn giản nhất: launcher hỏi lại người NGAY trong hội thoại, không tạo
  item cho tới khi có câu trả lời — giống bước 3 hiện tại của chính file
  này (xác nhận dependency) đã làm annotation "Do not proceed... until
  the user has answered in this turn."
- Nếu có `domain`/`title`/`description` đã rewrite: gọi `fgos submit
  "<text đã rewrite>" --domain <domain đã phân loại> --deps ...` (giữ
  nguyên logic dependency-confirm ở bước 2/3 không đổi).
- Bước 6b (re-judge tier/kind/risk) GIỮ NGUYÊN không đổi — thuộc phạm vi
  task 4 khác (`tsk-2yo`), không phải task này.
- Bước 5 (report kết quả) GIỮ NGUYÊN.

**Proof point (risk: TRUNG BÌNH).** Cùng chuẩn skill-prose verify như
Phase 3. Kiểm tra thủ công (không tự động hoá được trong CI vì cần
tương tác live): chạy `/fgOS:submit "<text mơ hồ>"` thật trong một phiên
Claude Code, xác nhận launcher hỏi lại TRƯỚC khi tạo item (không còn tạo
item rồi mới hỏi như hôm nay).

## Assumptions

1. Domain khác `coding` (triage/synthetic/fixture-marketing) không có
   item nào ở stage `'clarify'` hôm nay (xác nhận nhanh: đếm 90 item ở
   CONTEXT.md đều đọc qua `fgos list --all`, không lọc domain — cần xác
   nhận lại lúc code Phase 1 bằng cách in kèm `domain` field, không giả
   định thuần từ số đếm ban đầu).
2. Việc thêm domain-classification vào `fgos-clarifying` (Phase 3) dùng
   chính phán đoán của session sống, không cần capacity/model riêng —
   nhất quán với cách `fgos-clarifying` hôm nay đã tự phán intent mà
   không dispatch ra ngoài.
3. Không cần split thành nhiều item con — 4 phase trên phụ thuộc chuỗi
   thật (Phase 2 cần Phase 1 xong trước; Phase 4 cần Phase 3's hợp đồng
   mới tồn tại trước), gộp một item nhất quán với D15's lý do gốc (tsk-403)
   dù đây là tiền lệ khác cây con, cùng nguyên tắc.

## Outstanding questions

None
