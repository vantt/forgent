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
  'Clarify')` trả `undefined`. **Đã đọc thật MỌI call site** (`rg -- "'Clarify'" src`),
  tìm ra 2 chỗ thật sự vỡ (không phải giả định, đã kiểm chứng bằng đọc code):
  - `src/state/frontier.mjs`'s `frontier()` **AN TOÀN sẵn** — dòng
    `if (executeStage === undefined) continue;` đã tường minh guard đúng
    trường hợp này (cùng cách nó đã xử lý domain `synthetic` không có
    Clarify/Divide). `frontierAcrossSteps`'s default `['Clarify', 'Divide',
    'Execute']` thừa hưởng an toàn này — không cần sửa.
  - `src/intake/discovery.mjs`'s `discoverableStages(domain)` (dòng 122-125)
    **VỠ THẬT**: trả `[clarifyStage, 'discovery', 'exploring']` —
    `clarifyStage` sẽ là `undefined` cho domain `coding` sau Phase 2, tức
    hàm trả `[undefined, 'discovery', 'exploring']`. Hàm này nuôi trực
    tiếp `bin/fgos.mjs`'s `discover` CLI case's precondition
    (`validStages.includes(stage)`) — `undefined` lọt vào danh sách "stage
    hợp lệ" là một lỗ hổng validation thật. Sửa: lọc bỏ giá trị falsy
    trước khi trả — `[clarifyStage, 'discovery', 'exploring'].filter(Boolean)`
    (hoặc tương đương) — giữ nguyên hành vi cho domain KHÁC `coding` vẫn
    còn Clarify-mapped stage thật (vd. `triage`).
  - `src/intake/discovery.mjs`'s `nextDiscoveryEdge` (dòng 132)
    **VỠ THẬT KHÁC**: `if (work.stage === clarifyStage)` — khi
    `clarifyStage === undefined`, so sánh này khớp NHẦM với bất kỳ item
    nào có `stage` field bị thiếu/hỏng (dù domain đó không còn có khái
    niệm "clarify" nữa) — một false-positive match nguy hiểm, không phải
    lý thuyết. Sửa: thêm guard `clarifyStage !== undefined &&` trước so
    sánh, đúng cùng kiểu guard `frontier.mjs` đã làm.
  - `src/runner/loop.mjs:681` **VỠ THẬT, nặng nhất**: dòng
    `stage: stageForStep(getDomain(item.domain), 'Clarify')` gán thẳng
    stage cho item MỚI mà runner tự tạo (nhánh "discovered-from", khi
    worker báo cáo một `fgos-discovered` block). Sau Phase 2, dòng này
    tạo item với `stage: undefined` — hỏng dữ liệu thật, không phải rủi
    ro giả định. Sửa: `stageForStep(domain, 'Clarify') ?? domain.stages?.[0]`
    — fallback về stage ĐẦU TIÊN domain đó khai báo; với domain `coding`
    sau Phase 2, `stages[0]` chính là `'discovery'` (thứ tự mảng đã đổi ở
    Phase 2's own change tới `stages`) — đúng ý định D5 ("item mới sinh ra
    bỏ qua clarify, vào thẳng discovery"), không cần thêm nhánh domain-cụ-thể
    nào trong file này (giữ nguyên tính domain-agnostic).
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

## Documentation touch points (đọc thật, không phải phỏng đoán)

`rg -l "fgos-clarifying"` ngoài Phase 3/4's own file, còn 2 chỗ tường
thuật cần sửa cho khớp thật (không phải rủi ro chức năng, chỉ là prose
sai sau khi đổi hợp đồng):
- `.claude/skills/fgos-routing/SKILL.md:139` — bảng route liệt kê
  `clarify -> fgos-clarifying`; hàng này chết sau Phase 2, xoá cùng lúc.
- `.claude/skills/fgos-coding-driving/SKILL.md:393` — câu văn nói
  `fgos-clarifying`/`fgos-coding-exploring` "already use" một engine
  verb; sau Phase 3, `fgos-clarifying` không còn tự gọi engine verb nào
  cả (verdict-only) — câu này cần sửa lại, đừng để nói sai sự thật mới.

## Assumptions

1. **Đã xác nhận thật, không còn là giả định** (chạy `fgos list --all
   --json`, đếm theo `domain` field): toàn bộ 90 item ở stage `'clarify'`
   đều domain `coding` (hoặc không set, mặc định `coding`) — 0 item thuộc
   domain khác. Không cần lọc domain trong Phase 1's vòng lặp chính, dù
   thêm vào vẫn vô hại (defensive).
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

---

# plan.md — tsk-lya: Chẻ picker + sửa prose launcher `discover`

Mode: **standard** (2 flags: public contracts — `discover-next`'s behavior
is consumed by `herdr-plugin`'s auto-launcher, `pick.rs:17,130`; existing
covered behavior — `test/state/discover-pool.test.mjs` already asserts
`pickNextDiscoverItem`'s current pooling shape, which this item narrows).
Fallback lane derivation used (tsk-da1): no `fgos-routing` Orient handoff
was in this session's context (dispatched via `/fgOS:pick` → driving loop,
not via `fgos-routing` directly), and no earlier `Mode:` line existed in
this file — applied `fgos-routing`'s own Mode-gate table directly
(`.claude/skills/fgos-routing/SKILL.md:32-66`) rather than re-deriving its
thresholds inline.

## Approach

D10 (`discover-next` delegates down) and D11 (new `plan-next`/`plan-loop`
pair) are mechanically coupled: `discover-next`'s self-computed-ceiling bug
and the planning pool "ăn ké" problem both trace to one shared pick
function (`pickNextDiscoverItem`, `src/state/discover-pool.mjs`) serving
two unrelated stage groups. Splitting that function is the prerequisite
both D10 and D11 build on — do it first. D8's four prose fixes live
entirely inside `discover/SKILL.md` and have no code dependency on the
pool split; they can land in the same commit set but do not gate or get
gated by it.

**Order** (per `CONTEXT.md`'s locked decisions, D1/D8/D10/D11):

1. Split the pool: extract a `planning`/`decompose`-only pick function
   (mirrors `compareDecomposeOrder`, already isolated in
   `discover-pool.mjs:53-61`) into its own module; narrow
   `discover-pool.mjs`'s own `CANDIDATE_STAGES` to clarify-shaped stages
   only (`clarify`/`discovery`/`exploring`) — this is the one change that
   touches already-tested code, so it goes first where a regression is
   cheapest to catch.
2. Rewrite `discover-next/SKILL.md`: drop the self-claim + self-dispatch +
   self-computed-ceiling step; after picking, delegate to `/fgOS:discover
   <id>` and relay whatever it reports (D10).
3. Author `plan-next/SKILL.md` + `plan-loop/SKILL.md`, mirroring the
   `discover-next`/`discover-loop` template pair (closest analog: also a
   claim-then-delegate-to-a-launcher shape, unlike `cleanup-next`'s
   single mechanical verb call) — wired to the new pool function from
   step 1, delegating to `/fgOS:plan <id>` (D11).
4. Fix the four `discover/SKILL.md` prose defects (D8) — independent of
   steps 1-3, can land in the same change set without ordering constraints
   on the others.

`fgos graph --json`'s `criticalPath`/`topUnblock` were not consulted for
step ordering — this is a single, unsplit item (see "Decide the split"
below), so there is no sibling-item ordering question for that tool to
inform; the ordering above is intra-item sequencing only.

**Impact-analysis gate** (`CLAUDE.md`): `fgos tool query --capability
impact-analysis --status present` → provider `gitnexus`, `status:
"present"`, but a `PostToolUse` hook this session already flagged the
index **stale** (`last indexed: 4ce7a96`) — **degraded**, per `CLAUDE.md`'s
own three-way framing: run the check anyway, mark the evidence weak, name
the gap plainly. `impact({target: "pickNextDiscoverItem", direction:
"upstream"})` → `impactedCount: 0`, `risk: LOW`, `epistemic: "exact"` — no
traced caller beyond the function's own file. This is expected, not a
false-safe zero: `discover-next/SKILL.md` invokes it through an inline
`node -e "..."` script (a bash-embedded dynamic import), which a
static call-graph does not trace as a symbol edge — cross-checked via `rg
-l "pickNextDiscoverItem" .` (three pool test files, one skill file, the
module itself), matching the same set GitNexus found nothing beyond. The
staleness means this 0-count is not proof nothing else calls it, only
that nothing traceable does as of the last index — `fgos-validating`
should re-run `impact` after `gitnexus analyze` refreshes, or accept the
`rg` cross-check as the real evidence per `CLAUDE.md`'s own suspicious-
zero-result guidance.

## Risk map

| Component | Risk | Proof point (for `fgos-validating`) |
|---|---|---|
| `discover-pool.mjs` narrowing (removing `decompose`/`planning` from `CANDIDATE_STAGES`) | Medium — `test/state/discover-pool.test.mjs` currently asserts decompose-pool behavior in the same function; narrowing without updating those assertions in lockstep breaks a currently-green suite | `npm test` green after the split; `discover-pool.test.mjs`'s decompose-pool assertions moved to the new pool-test file, not silently deleted |
| New `plan-pool.mjs` pick function | Low — new code, no existing behavior to regress; logic is a direct extraction of `compareDecomposeOrder`, already proven in production pooling | New `test/state/plan-pool.test.mjs` covering pool-empty, priority-ascending order, and the `decompose`/`planning` dual-stage candidacy (D18's drain-only alias) |
| `discover-next/SKILL.md` rewrite | Low — prose only, no runtime compilation; correctness is exactly what the item's own verify checks | Item's own verify: `grep -q "fgOS:discover" plugins/fgOS/skills/discover-next/SKILL.md` |
| New `plan-next`/`plan-loop` skill pair | Low — new files, mirrors 3 existing templates read in full during exploring | Item's own verify: `test -d plugins/fgOS/skills/plan-next` |
| `discover/SKILL.md` prose fixes | Low — the four defects are independently confirmed against live `nextDiscoveryEdge`/`skillMap` behavior (`CONTEXT.md`'s scout evidence, verified live this session) | Item's own verify: `! grep -q "Socratic reasoning" plugins/fgOS/skills/discover/SKILL.md` |

## Files touched

- `src/state/discover-pool.mjs` — narrow to clarify-shaped stages only
- `src/state/plan-pool.mjs` — new, `planning`/`decompose` pool picker
- `test/state/discover-pool.test.mjs` — update for the narrowed pool
- `test/state/plan-pool.test.mjs` — new
- `plugins/fgOS/skills/discover-next/SKILL.md` — delegate down (D10)
- `plugins/fgOS/skills/plan-next/SKILL.md` — new
- `plugins/fgOS/skills/plan-loop/SKILL.md` — new
- `plugins/fgOS/skills/discover/SKILL.md` — four prose fixes (D8)

## Decide the split

No split. This is one coherent piece: the item's own attached verify is a
single conjunctive command (`npm test && ... && ... && !...`) that only
passes once every file above lands together — splitting into separate
items would break that atomicity and force artificial intermediate verify
commands the design never called for. `fgos graph --what-if` was not run
for this reason: there are no candidate sibling pieces to compare.

## Concrete cases worth proving

- **Pool empty.** `plan-next` on an empty `planning`/`decompose` pool
  reports "pool empty — nothing to plan" cleanly, mirroring
  `discover-next`'s own step 3.
- **Existing behavior not regressed.** After narrowing, `discover-next`
  still correctly picks and delegates a `clarify`/`discovery`/`exploring`-
  stage item — its now-sole remaining job — proven by the updated
  `discover-pool.test.mjs` suite passing green.
- **`lock-timeout` relay parity.** `plan-next`/`plan-loop` carry the same
  `stop-reason: lock-timeout` relay discipline every existing next/loop
  pair already has (D11 means parity with the other four pairs, not a
  lesser copy).
- **D18's drain-only invariant stays mechanical, not violated by this
  item's own tooling.** `plan-pool.mjs`'s candidate-stage set keeps both
  `decompose` (legacy alias) and `planning` (current) as pool candidates —
  same as today's `discover-pool.mjs` — since `plan-next`/`plan-loop` only
  ever pick and delegate to `/fgOS:plan <id>`; they never move `stage`
  themselves, so they cannot be the thing that routes a new item onto the
  legacy alias (that already happens one layer down, in the engine verb,
  outside this item's footprint).

## Assumptions (unproven, pinned per fgos-planning's own rule)

- New pool module is named `plan-pool.mjs`, mirroring the
  `cleanup-pool.mjs`/`retro-pool.mjs` one-module-per-pair convention,
  rather than appended to the existing `discover-pool.mjs`. Naming is an
  implementation detail `CONTEXT.md` correctly left open (its own
  "Still open" note) — not a product decision requiring a hand-back to
  `fgos-exploring`.
- `plan-next`/`plan-loop` are built from the `discover-next`/`discover-
  loop` template pair, not `cleanup-next`/`cleanup-loop` — the closer
  shape match (claim-then-delegate-to-a-launcher vs. a single mechanical
  verb call).

## Outstanding questions

None

---

# plan.md — tsk-30v: Nhánh verdict clear/unclear cho `nextDiscoveryEdge`

Mode: **standard** (2 flags: existing covered behavior —
`test/intake/discovery.test.mjs:260-284,319-329` currently assert the OLD
discovery-stage routing this item intentionally changes; public contracts —
`nextDiscoveryEdge`/`resolveDiscovery` are the one shared FSM-transition
surface both `bin/fgos.mjs`'s `discover` verb and `src/runner/loop.mjs`'s
runner sweep depend on, so a wrong edge affects every in-flight `coding`
item sitting at `discovery`/`exploring`, not just this feature tree).
Fallback lane derivation used (tsk-da1): no `fgos-routing` Orient handoff
was in this session's context (dispatched via `/fgOS:pick` → driving loop
→ `fgos-coding-discovering` → `fgos-coding-exploring` → here, never through
`fgos-routing` directly), and no earlier `Mode:` line existed for this item
in this file — applied `fgos-routing`'s own Mode-gate table directly
(`.claude/skills/fgos-routing/SKILL.md:32-66`) rather than re-deriving its
thresholds inline. Matches the item's own `tier: "standard"` field.

## Approach

The three code changes are strictly ordered by compile/runtime dependency;
the test rewrite depends on all three landing first (a red-then-green
discipline, not a parallel-safe one — the existing tests at
`discovery.test.mjs:260-284,319-329` would otherwise assert against
not-yet-changed behavior and hide a broken edge).

**Order** (per `CONTEXT.md`'s locked decisions, D2/D3/D6/D-local-1/D-local-2):

1. **Register the new FSM edge first** — `{ from: 'discovery', to:
   'planning' }` added to `DOMAINS.coding.transitions`
   (`src/state/workflow-stage-graphs.mjs:123-149`), placed next to the
   existing `discovery -> exploring` edge (line 145) with a short comment
   naming this item and D-local-1 (repo convention: every edge in this
   array is commented with its originating decision). This must land
   before step 2 — `moveStage`'s CAS check (`stage-fsm.mjs`, no bypass)
   throws on an unregistered edge, so any code that tries to route through
   it first would immediately fail its own test.
2. **Make `nextDiscoveryEdge` verdict-aware, `discovery`-branch only**
   (`src/intake/discovery.mjs:136-162`). Add a second parameter
   (`nextDiscoveryEdge(work, verdict)`); change ONLY the `work.stage ===
   'discovery'` branch:
   ```js
   if (hasDiscoveryExploring && work.stage === 'discovery') {
     return verdict?.clear
       ? { to: planningStage, expectedStage: 'discovery' }
       : { to: 'exploring', expectedStage: 'discovery' };
   }
   ```
   The `clarify` branch (dead for `coding`, live for `triage`/other
   domains that still register it) and the `exploring` branch stay
   exactly as they are — D6 scopes the verdict-aware behavior to
   `discovery` only.
3. **Thread `verdict` through every existing `nextDiscoveryEdge(work)`
   call site** in `resolveDiscovery` (`discovery.mjs:225-461`) — three
   sites, all passing a verdict shape that already exists at each call:
   - Line ~279 (`readLockedContext` trust-signal skip): synthesizes
     `verdict = { clear: true }` two lines above (line 269's own
     `addDiscovery(dir, { id, clear: true })`) — pass `{ clear: true }`.
   - Line ~435 (explicit clear branch): the local `verdict` variable
     already holds `{ clear: true, verify?, ... }` — pass it as-is.
   - **New third site**, inside the unclear branch (today
     `discovery.mjs:442-459`, no `nextDiscoveryEdge` call at all): add an
     `if (work.stage === 'discovery')` special case that calls `moveStage`
     BEFORE the existing `putInAwaiting` call:
     ```js
     if (work.stage === 'discovery') {
       moveStage(dir, {
         id,
         ...nextDiscoveryEdge(work, verdict), // verdict.clear === false here -> { to: 'exploring' }
         verify: hasRealVerify(work.verify) ? work.verify : FALLBACK_VERIFY,
         role,
       });
     }
     if (work.status !== 'awaiting-human') {
       putInAwaiting(dir, { id, ask: verdict.question, statusAtAsk: work.status });
     }
     ```
     Confirmed safe by `RESEARCH.md` Round 1 (tsk-30v): `moveStage`
     touches only `stage`, `putInAwaiting` touches only `status`, no
     cross-guard blocks this ordering, and `answerAwaiting` never touches
     `stage` — a person answering later resumes already sitting at
     `exploring`. The `clarify`/`exploring`-stage unclear paths (unaffected
     by this `if`) keep today's park-in-place behavior exactly.
4. **Fix the stale `loop.mjs` comment** (`src/runner/loop.mjs:1082-1085`)
   — replace the "there is no verdict to gate the transition on here …
   the item unconditionally advances discovery -> exploring" claim with
   language matching what the code ~65 lines below it already does
   (verdict-gated via `parseVerdictBlock` + `resolveDiscovery(...,
   callerVerdict)`, tsk-4v6). Comment-only; the call at `loop.mjs:1132-1151`
   is untouched — it already calls the same `resolveDiscovery` this item
   is changing underneath it, so the fix in step 3 applies to the runner
   sweep automatically, no separate wiring needed here.
5. **Rewrite the two now-wrong tests, add one new test**
   (`test/intake/discovery.test.mjs`):
   - Line 260-273 and 275-284 (both currently assert `discovery`-stage
     clear lands on `'exploring'`) — change the expected `stage` to
     `'planning'` in both; keep every other assertion (verify propagation,
     decision-log entry, `discovery` array entry) unchanged, since none of
     that behavior is touched by this item.
   - Line 319-329 (`'resolveDiscovery parks in awaiting-human on a
     caller-supplied unclear verdict...'`) — `sampleWork()`'s default
     `stage: 'discovery'` (confirmed, `RESEARCH.md` Round 1) means this
     test IS the discovery-stage case; add an assertion that `view.work['item-x'].stage
     === 'exploring'` alongside the existing `status === 'awaiting-human'`
     assertion — both must now hold simultaneously, per D-local-2.
   - New test: an unclear verdict at a NON-`discovery` stage (use
     `sampleWork({ domain: 'triage', stage: 'clarify' })`, the same
     domain-agnostic fixture the existing line-308 test already uses,
     since `triage` never registers `discovery`/`exploring`) still parks
     with `stage` UNCHANGED — proves the `if (work.stage === 'discovery')`
     guard in step 3 is truly scoped, not accidentally global.

`fgos graph --json`/`--what-if` were not consulted for ordering — this is a
single, unsplit item with a linear intra-file dependency chain (edge
registration -> edge-picker -> caller threading -> tests), not a
sibling-item ordering question that tool answers.

**Impact-analysis gate** (`CLAUDE.md`): `fgos tool query --capability
impact-analysis --status present` → provider `gitnexus`, `status:
"present"`, but `mcp__gitnexus__list_repos` shows this workspace's index
**691 commits behind HEAD** — **degraded**, per `CLAUDE.md`'s own
three-way framing. `impact({target: "nextDiscoveryEdge", direction:
"upstream"})` → target not found at all (function likely postdates the
stale index); `impact({target: "resolveDiscovery", direction:
"upstream"})` → `impactedCount: 0, risk: LOW` — a **suspicious zero**
per `CLAUDE.md`'s own guidance, cross-checked with `rg -n
"resolveDiscovery" --glob '*.mjs'`: 125 real matches across 15 files,
including the two real call sites this plan already names
(`bin/fgos.mjs:1214`, `src/runner/loop.mjs:1150`) plus ~9 test files. The
`rg` cross-check is the trustworthy evidence here, not the stale
zero-count — `fgos-coding-validating` should either re-run `impact` after
`gitnexus analyze` refreshes the index, or accept this cross-check as
sufficient per the same degraded-posture precedent `tsk-lya`'s own
`plan.md` already recorded for this same repo state.

## Risk map

| Component | Risk | Proof point (for `fgos-coding-validating`) |
|---|---|---|
| New FSM edge `discovery -> planning` | Medium — a missing/misordered edge registration makes `moveStage` throw at runtime for every future clear-at-discovery item, not just this test suite | `npm test` green; a dedicated assertion that `resolveDiscovery` no longer throws for `{stage: 'discovery', verdict: {clear: true}}` (already covered by the rewritten test at line 275-284) |
| `nextDiscoveryEdge` verdict parameter | Medium — the `clarify`/`exploring` branches must stay byte-identical; a mistake there would silently break the `triage`-domain-agnostic test (line 308) or the `exploring -> planning` edge (line 286) | Full `discovery.test.mjs` suite green, including the two untouched domain-agnostic/exploring tests — a regression there is the signal this changed the wrong branch |
| `resolveDiscovery`'s dual `moveStage`+`putInAwaiting` unclear path | Medium — first place in this codebase calling both write-door verbs on the same item in one pass (confirmed no precedent, `RESEARCH.md` Round 1); an ordering mistake (park-then-move) would leave `stage` stuck if the second call ever failed mid-operation | New test (item 3 above) asserting BOTH `status === 'awaiting-human'` AND `stage === 'exploring'` hold after one `resolveDiscovery` call; the scoped non-`discovery`-stage test proves no regression to legacy park-in-place paths |
| `loop.mjs` comment fix | Low — comment-only, no behavior change | `! grep -q "unconditionally advances" src/runner/loop.mjs` (mechanical, addable to the item's own verify if desired — not currently in the attached command) |

## Files touched

- `src/state/workflow-stage-graphs.mjs` — one new `transitions` entry
- `src/intake/discovery.mjs` — `nextDiscoveryEdge` verdict parameter +
  discovery-branch logic; `resolveDiscovery`'s three call sites
- `src/runner/loop.mjs` — comment fix only, lines 1082-1085
- `test/intake/discovery.test.mjs` — 2 tests rewritten, 1 test added

## Decide the split

No split. This is one coherent, small piece of work — a single conjunctive
verify (`npm test && node --test test/intake/discovery.test.mjs`) that
only passes once the edge, the picker, the dual-write unclear path, and
the tests all land together. `fgos graph --what-if` was not run for this
reason: there is no candidate sibling piece to compare against.

## Concrete cases worth proving

- **Clear at `discovery` skips `exploring`.** `resolveDiscovery` with
  `{stage: 'discovery', verdict: {clear: true}}` lands on `stage:
  'planning'`, never `'exploring'` — the item's own DoD.
- **Unclear at `discovery` both advances and parks.** `resolveDiscovery`
  with `{stage: 'discovery', verdict: {clear: false, question}}` leaves
  the item at BOTH `stage: 'exploring'` and `status: 'awaiting-human'` —
  answering the park later resumes directly into `fgos-coding-exploring`,
  never loops back through `fgos-coding-discovering` for the same
  question.
- **Legacy/other-domain unclear paths unregressed.** An unclear verdict at
  any stage other than `discovery` (a `triage`-domain `clarify`-stage
  item, the closest reachable analog since `coding`'s own `clarify` is
  retired) still parks with `stage` unchanged — the pre-existing
  park-in-place contract survives everywhere this item does not touch.
- **`clarify`/`exploring` clear-verdict edges unregressed.** The existing
  domain-agnostic test (line 308) and the `exploring -> planning` test
  (line 286) both stay green untouched — proof the `discovery`-only scope
  of step 2/3 above was actually honored, not silently widened.

## Assumptions (unproven, pinned per fgos-coding-planning's own rule)

- The new `discovery -> planning` transition's inline comment cites this
  item's id and D-local-1 by name, matching the file's existing
  convention (every edge in `transitions` already carries a comment
  naming its origin) — a style choice, not a design question `CONTEXT.md`
  needed to settle.
- The dual-write unclear-at-discovery branch is written as a local `if
  (work.stage === 'discovery')` guard inline in `resolveDiscovery`,
  rather than factored into a separate helper function — `RESEARCH.md`
  Round 1 flagged this as an open implementation/module-boundary choice
  for this skill to settle, not a goal-clarity gap; inline is simpler for
  a single call site and matches the function's existing style (the
  trust-signal skip branch above it is similarly inline, not factored
  out).

## Outstanding questions

None
