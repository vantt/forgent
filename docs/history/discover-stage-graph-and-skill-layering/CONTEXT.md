# CONTEXT: tsk-qod — Đưa fgos-clarifying về bước Init

## Feature boundary

Ba việc, tất cả trong phạm vi domain `coding` (không đụng
`triage`/`synthetic`/`fixture-marketing` — mỗi domain đó có `stages` riêng,
không share entry `clarify` của coding):

1. **Migrate trước, xoá sau**: đẩy 90 item đang ở `stage: 'clarify'` (đếm
   fresh 2026-08-11) sang stage khác — TRƯỚC khi xoá
   `skillMap.clarify`/`'clarify'` khỏi `stages` (D1). Không giữ legacy
   alias kiểu D18 (tsk-403) — quyết dứt điểm.
2. **Xoá khỏi registry**: gỡ `clarify: 'fgos-clarifying'` khỏi
   `skillMap`, gỡ `'clarify'` khỏi `stages` của domain `coding`
   (`src/state/workflow-stage-graphs.mjs`).
3. **Wiring lại `/fgOS:submit`** (D2): launcher gọi `fgos-clarifying`
   SỐNG (live session) TRƯỚC khi tạo item — rewrite text + phân loại
   `domain` — rồi mới gọi verb `fgos submit "<text đã rewrite>" --domain
   <domain đã phân loại>`. Đảo ngược thứ tự hiện tại (submit trước, gọi
   `fgos-clarifying` SAU khi item đã tồn tại, chỉ cho live session — xem
   scout evidence bên dưới).

## Locked decisions

| D-ID | Quyết định |
|------|-----------|
| D1 | Migrate 90 item đang ở stage `clarify` sang stage khác TRƯỚC khi xoá `skillMap.clarify`/`stages` entry — KHÔNG giữ legacy alias kiểu D18. Lý do (người trả lời trực tiếp): "xử lý dứt điểm bằng di trú thay vì để lại một alias khác phải dọn sau." Cơ chế migrate cụ thể (một lượt hay từng item, đích là stage nào, cách xử lý khác nhau giữa item `todo` và item `doing`/`awaiting-human`) để lại cho `fgos-coding-planning`'s Approach/Shape — không phải quyết định sản phẩm, là chi tiết triển khai. |
| D2 | Wiring `/fgOS:submit` gọi `fgos-clarifying` sống TRƯỚC khi tạo item LÀ trong phạm vi item này, không hoãn. Người trả lời trực tiếp: "Human dùng skill fgOS submit, skill đó sẽ gọi clarifying, xong có kết quả mới submit. Nên task này cần wiring." Domain classification (năng lực đang thiếu hoàn toàn, xác nhận qua scout — xem bên dưới) nằm trong `fgos-clarifying`'s job theo đúng D5 gốc, không phải một capacity/hàm riêng mới. |

## Pinned terms

- **"bước Init"** — giai đoạn TRƯỚC khi item tồn tại, ngoài trục `stage`
  và `status` hoàn toàn (đúng định nghĩa D5 gốc trong DISCUSSION.md).
  `fgos-clarifying` chạy ở đây đọc CHỈ đoạn text vừa submit — thế giới
  đóng, không tra cứu repo/online — khác hẳn `fgos-coding-exploring`
  (chạy SAU khi item đã tồn tại, có scout, có thể tra cứu).
- **hợp đồng verdict-only (không ghi state)** — vì Init không có item nào
  tồn tại, `fgos-clarifying` KHÔNG THỂ dùng `fgos ask <id>`/`fgos answer
  <id>` (không có id) như hợp đồng cũ của nó (chạy như stage-skill trên
  item đã tồn tại). Nó phải trả `{title?, description?, domain, question?}`
  thẳng về cho launcher gọi nó — đúng hợp đồng verdict-only
  `fgos-researching` đã dùng cho stage `discovery` (`fgos-coding-driving`'s
  own "Discovery and exploring stages" exception) — không phải một khuôn
  mới, là tái dùng khuôn đã có tiền lệ.

## Scout evidence

- **Đếm fresh item ở stage `clarify`** (`fgos list --all --json`,
  2026-08-11 ~14:32 UTC): **90 item**, gồm `tsk-2mt` (cha của chính cây
  này, `status: doing`) và 4 con em cùng cây (`tsk-tku`, `tsk-2yo`,
  `tsk-30v`, `tsk-lya`, `tsk-15u`, đều `status: todo`). Đủ trạng thái:
  `todo`/`doing`/`awaiting-human`/`wontfix`/`done`/`cleanup`.
- `bin/fgos.mjs`'s `submitWork` (dòng 856): `title = deriveTitle(text)`
  (cắt cơ học, KHÔNG phải LLM rewrite); `domain: opts.domain` (chỉ nhận
  từ flag người gọi, không có gì tự phân loại). Xác nhận claim của D5:
  domain classification là "năng lực đang thiếu hoàn toàn."
  `verify: SUBMIT_VERIFY_SENTINEL` — verb `submit` không đổi field này.
- `plugins/fgOS/skills/submit/SKILL.md` (203 dòng, đã đọc toàn bộ)
  — luồng HIỆN TẠI: bước 4 gọi `fgos submit "<text thô>"` TRƯỚC (tạo
  item ngay, classify cơ học); bước 6 ("tsk-5wz") mới gọi
  `fgos-clarifying` SAU khi item đã tồn tại — CHỈ khi có "soul" (session
  tương tác), có gate rõ ràng loại trừ no-soul caller
  (`dogfood-fixture:submit`, cron/script/agent khác). Bước 6b chỉ re-judge
  `tier`/`kind`/`risk` trên text sạch — KHÔNG đụng `domain` ở đâu cả.
  Đây chính là thứ tự cần ĐẢO NGƯỢC theo D2: `fgos-clarifying` (rewrite +
  domain) chạy TRƯỚC, rồi mới gọi `submit` với text/domain đã có.
  `tier`/`kind`/`risk` re-judge (bước 6b) giữ nguyên không đổi — thuộc
  phạm vi task 4 (`tsk-2yo`, DISCUSSION.md), KHÔNG phải task này.
- `.claude/skills/fgos-clarifying/SKILL.md` (đã đọc toàn bộ trong tsk-403,
  còn hiệu lực) — hôm nay là stage-skill vận hành trên item ĐÃ TỒN TẠI
  (`fgos ask`/`fgos answer` dùng `<id>` thật), được load bởi
  `fgos-coding-driving` khi `item.stage === 'clarify'`. Hợp đồng này phải
  đổi thành verdict-only (xem Pinned terms) khi chạy ở Init.
- `impact-analysis` capability gate (CLAUDE.md): `fgos tool query
  --capability impact-analysis --status present` → provider `gitnexus`,
  `status: "present"` → **full**. Ghi lại cho `fgos-coding-planning`/
  `fgos-coding-validating` đọc tiếp.

## Canonical references

- `docs/history/discover-stage-graph-and-skill-layering/DISCUSSION.md`
  mục 4 (D5, D9), mục 7 task 2 (`{#task-clarifying-to-init}`) — nguồn
  quyết định gốc.
- `docs/history/discover-stage-graph-and-skill-layering/RESEARCH.md` —
  2 vòng nghiên cứu máy-một-mình (đếm 90 item, xác nhận quyết định D1 của
  người).
- Tiền lệ cùng cây: `tsk-403` (đã delivered) — D18's decompose-alias
  pattern, dẫn chứng cho lý do KHÔNG chọn cùng hướng ở D1 trên đây (quy mô
  90 khác 3-4).

## Outstanding questions

None

---

# CONTEXT: tsk-lya — Chẻ picker + sửa prose launcher `discover`

## Feature boundary

Scope là đúng ba việc, chỉ cho `tsk-lya` — con số 1 (`tsk-403`, plan-family
rename) đã `delivered` và có mặt trên nhánh này, nên tiền đề D11 đặt ra đã
thoả:

1. **`discover-next` thôi tự claim + tự dispatch driver + tự tính
   ceiling.** Hôm nay step 4 của `discover-next/SKILL.md` tự đọc state,
   tự claim, rồi tự gọi `fgos-coding-driving` với một ceiling nó tự tính từ
   stage vừa pick được (`stage:decompose` khi pick trúng `clarify`,
   `stage:executing` khi pick trúng `decompose`) — di sản từ trước
   `tsk-2b0` khi `discover` còn ôm cả hai stage. Sau khi việc 2 tách xong
   pool, `discover-next` pick xong chỉ còn một việc: gọi `/fgOS:discover
   <id>`, để tầng dưới (launcher `discover`) tự lo claim + dispatch +
   ceiling của chính nó — mỗi tầng một việc, tầng dưới là điểm hội tụ duy
   nhất (D10).
2. **Sinh cặp `plan-next` + `plan-loop`.** Bốn cặp `<root>-next`/
   `<root>-loop` đã có (`cleanup`, `discover`, `merge`, `retro`) nhưng
   chưa từng có cặp nào cho pool `planning`/`decompose` — pool đó đang ăn
   ké logic của `discover-next` (`discover-pool.mjs`'s
   `pickNextDiscoverItem` gộp chung cả clarify-shaped stages lẫn
   `decompose`/`planning` trong một hàm). Việc này tách một pick-function
   riêng cho pool `planning` và sinh cặp skill mới theo đúng khuôn ba
   template đã có (D11).
3. **Sửa bốn lỗi prose trong `plugins/fgOS/skills/discover/SKILL.md`**
   (D8, và các phát hiện của vòng chấm điểm §5 Q&A vòng 4-7 trong
   `DISCUSSION.md`):
   - Bỏ 3 câu khẳng định sai gán "Socratic reasoning" cho
     `fgos-coding-exploring` khi mô tả việc `/fgOS:discover` làm — kể cả
     dòng frontmatter `description` được nạp vào MỌI session. Stage
     `clarify` được lái bởi `fgos-clarifying` (registry
     `skillMap.clarify`), không phải `fgos-coding-exploring`; một verdict
     `clear` đưa item sang stage `discovery`, không nhảy thẳng `planning`.
   - Sửa câu sai sự thật ở dòng ~30-33: `discover` **không** errors với
     mọi stage khác `clarify` — `nextDiscoveryEdge` xử lý đúng ba stage
     (`clarify`, `discovery`, `exploring`) mà không throw; nó chỉ throw
     ngoài `discoverableStages(domain)`.
   - Thêm bước **đọc lại state thật** trước khi báo stop reason ở step 4 —
     hiện tại skill này relay thẳng narration của `fgos-coding-driving` mà
     không xác minh lại, đúng lớp lỗi đã bắt được một lần (Q&A vòng 4-5:
     báo "reached ceiling at decompose" trong khi item thật đang ở
     `discovery`).
   - Thêm khối khai báo **tầng + caller**: `discover` là **launcher**
     (ADR 0028 — chọn 1, đứng lên, bước ra hoàn toàn, không cần soul);
     caller của nó là `discover-next` (sau khi pick), auto-launcher của
     `herdr-plugin` (luôn kèm `--autoClose`, `pick.rs:17,130`), và hiếm
     khi là người bấm tay trực tiếp — phần lớn thời gian không có ai ngồi
     xem pane.

Không đụng phần còn lại của cây `tsk-2mt` (skill chủ discovery — con 3,
phân loại xuống discovery — con 4, nhánh verdict clear/unclear — con 5,
v.v.) — các con khác của cùng cha, ngoài phạm vi item này.

## Locked decisions

| D-ID | Quyết định |
|------|-----------|
| D1 | `discover` **không bao giờ** làm việc split-work của `decompose`/`planning`. Khẳng định lại tsk-2b0 D1 (hard split, no fallback) và mở rộng lên tầng picker phía trên: `discover-next` cũng phải tôn trọng thế chẻ đôi này — không được tự gộp lại việc claim/dispatch/ceiling của cả hai stage trong cùng một hàm pick. |
| D8 | Tên skill chủ stage `discovery`/`exploring` theo khuôn `fgos-coding-<gerund>` (`fgos-coding-exploring`, không phải `fgos-discover` hay `fgos-explore`) — lý do gốc: `fgos-discover` khác engine verb `fgos discover` đúng một ký tự, mắt/`rg` không phân biệt được. Áp dụng ở đây: prose trong `discover/SKILL.md` phải nói đúng TÊN skill thật sự chạy ở mỗi stage (`fgos-clarifying` ở `clarify`, không phải `fgos-coding-exploring`), không được lẫn hai skill khác stage vào một câu khẳng định. |
| D10 | `discover-next` (launcher tầng pick) phải **giao xuống** `/fgOS:discover <id>`, không được tự claim + tự dispatch `fgos-coding-driving` + tự tính ceiling như hôm nay. Mỗi tầng một việc; tầng dưới phải là điểm hội tụ duy nhất. |
| D11 | Sinh cặp mới `plan-next` + `plan-loop` (bốn cặp `<root>-next`/`<root>-loop` đã có: cleanup, discover, merge, retro — chưa từng có cặp nào cho `decompose`/`planning`, pool đó vẫn ăn ké `discover-next`). Tiền đề (rename `decompose`→`planning`, con 1/`tsk-403`) đã `delivered` trước khi con này bắt đầu, nên cặp mới sinh ra đã đúng tên ngay từ đầu — không cần rename lại sau. |

## Pinned terms

- **"giao xuống" (hand down / delegate down)** — `discover-next` sau khi
  pick chỉ gọi `/fgOS:discover <id>` và dừng ở đó; không tự claim, không
  tự gọi `fgos-coding-driving`, không tự tính ceiling. Tầng dưới
  (`discover`) sở hữu toàn bộ phần đó cho stage `clarify`.
- **"ăn ké" (piggyback)** — pool `planning`/`decompose` hôm nay không có
  pick-function/skill riêng; nó đi nhờ trong cùng `pickNextDiscoverItem`
  và cùng launcher `discover-next` mà lẽ ra chỉ nên phục vụ pool
  clarify-shaped.
- **"tầng" (layer/tier)** — từ vựng ADR 0028: **launcher** (chọn 1 item,
  đứng lên xử lý, bước ra hoàn toàn, không cần soul theo dõi) vs.
  **orchestrator** (điều phối N đơn vị theo thời gian, ở lại). Trong cây
  này: `discover-loop`/`plan-loop` = orchestrator; `discover-next`/
  `plan-next` = launcher-có-pick; `/fgOS:discover`/`/fgOS:plan` = launcher
  thuần (fire & forget); `herdr-plugin` = orchestrator khác ở mức
  terminal.

## Scout evidence

- `plugins/fgOS/skills/discover-next/SKILL.md:55-77` — step 4 tự claim rồi
  tự gọi `fgos-coding-driving` với ceiling tự tính (`stage:decompose` /
  `stage:executing`) tuỳ stage vừa pick — đúng lỗi D10 nêu.
- `src/state/discover-pool.mjs:19-24,53-61,76-108` — `pickNextDiscoverItem`
  gộp cả `CLARIFY_SHAPED_STAGES` (`clarify`/`discovery`/`exploring`) lẫn
  `decompose`/`planning` trong một hàm; `compareDecomposeOrder` (dòng
  53-61) đã tách riêng như một hàm độc lập, sẵn sàng để lấy ra làm
  pick-function riêng cho `plan-next`.
- Ba template next/loop đã đọc đầy đủ: `discover-next/SKILL.md`,
  `discover-loop/SKILL.md`, `cleanup-next/SKILL.md` — cùng khuôn 5-6 bước:
  bỏ qua `$ARGUMENTS` → pick qua pure pool function → pool rỗng thì dừng →
  claim + dispatch (hoặc chạy verb) → relay nguyên văn stop reason của
  driver, kể cả hợp đồng relay `lock-timeout`.
- `plugins/fgOS/skills/discover/SKILL.md:7,21,127` (bản đã qua rename
  `tsk-403`) — 3 câu khẳng định "live session does its own real Socratic
  reasoning (`fgos-coding-exploring`)", kể cả dòng frontmatter
  `description` (dòng 7) nạp vào MỌI session. Xác minh sống trong chính
  phiên này: gọi `fgos discover tsk-lya` lúc item ở `clarify` đã nạp
  `fgos-clarifying` (đúng `skillMap.clarify`, `workflow-stage-graphs.mjs:
  148`), không phải `fgos-coding-exploring`; verdict `clear` đưa item sang
  `discovery`, không nhảy thẳng `planning` (`nextDiscoveryEdge`,
  `src/intake/discovery.mjs:120-124`).
- `plugins/fgOS/skills/discover/SKILL.md` dòng ~30-33 — khẳng định
  "`discover` errors if called on an item that isn't at stage `clarify`"
  sai: `nextDiscoveryEdge` (`discovery.mjs:120-134`) xử lý đúng ba stage
  `clarify`/`discovery`/`exploring` không hề throw; chỉ throw ngoài
  `discoverableStages(domain)`.
- `plugins/fgOS/skills/discover/SKILL.md:132-146` (step 4) — relay thẳng
  narration của `fgos-coding-driving`, không đọc lại state thật trước khi
  báo — đúng lớp lỗi Q&A vòng 4-5 đã bắt (`DISCUSSION.md:113-114`).
- `DISCUSSION.md:126-136` (vòng 7) + `herdr-plugin/src/pick.rs:17,130` —
  ADR 0028 đã pin từ vựng launcher/orchestrator; `pick.rs` gọi thẳng
  `/fgOS:discover <id> --autoClose` từ cả nút bấm tay lẫn auto-launcher —
  xác nhận caller shape "hiếm khi là người, không ai ngồi xem" là thật,
  không phải giả định.
- Verify hiện tại của `tsk-lya` (`! grep -q "Socratic reasoning"
  plugins/fgOS/skills/discover/SKILL.md`) đang **đỏ** — xác nhận sống 3
  lần khớp còn tồn tại, đúng như mong đợi trước khi implement.
- `impact-analysis` capability gate (CLAUDE.md): `fgos tool query
  --capability impact-analysis --status present` trả provider `gitnexus`,
  `status: "present"` — **full**. Ghi lại cho `fgos-planning`/
  `fgos-validating` đọc tiếp; `fgos-exploring` không sửa code nên không tự
  áp MUST rules ở đây.
- `find .claude -iname "discover-next*" -o -iname "plan-next*"` — không có
  hit; skill launcher/picker dưới `plugins/fgOS/skills/*` không có mirror
  ở `.claude`/`.agents` (khác 5 skill chủ stage tsk-403 vừa đổi tên) — con
  này không có thêm mặt file bị mirror cần sửa.

## Canonical references

- `docs/history/discover-stage-graph-and-skill-layering/DISCUSSION.md` —
  mục 4 (D1-D19), mục 7 task 6 (`{#task-picker-split-and-prose}`) là nguồn
  quyết định gốc cho tài liệu này.
- `docs/history/discover-stage-graph-and-skill-layering/RESEARCH.md` —
  Round 1 (`tsk-lya`, stage `discovery`) chứa toàn bộ evidence chi tiết
  hơn bảng scout evidence phía trên.
- `tsk-403`'s own delivered record (`fgos list --id tsk-403 --json`) —
  xác nhận tiền đề D11 đã thoả trước khi con này bắt đầu.
- `src/state/workflow-stage-graphs.mjs`, `src/intake/discovery.mjs`,
  `src/state/discover-pool.mjs` — nguồn cơ học cho các claim sự thật ở
  trên.

## Outstanding questions

None

---

# CONTEXT: tsk-30v — Nhánh verdict clear/unclear cho `nextDiscoveryEdge`

## Feature boundary

DoD của cả cây `tsk-2mt` (D2/D3/D6). Bốn việc, tất cả trong
`src/intake/discovery.mjs` + `src/state/workflow-stage-graphs.mjs` +
`src/runner/loop.mjs` + `test/intake/discovery.test.mjs`, domain `coding`
only:

1. `nextDiscoveryEdge` (`src/intake/discovery.mjs`) chuyển từ chọn cạnh
   THUẦN THEO STAGE sang chọn cạnh **theo verdict** — nhưng chỉ tại
   `work.stage === 'discovery'`: `clear` → nhảy thẳng `planning` (bỏ qua
   `exploring`), `unclear` → `exploring` (thay vì giữ nguyên `discovery`).
   Nhánh `clarify`/`exploring` (legacy và exploring's own gate) giữ
   nguyên không đổi — chỉ `discovery` là pha "máy một mình" theo D6.
2. **Đăng ký cạnh FSM mới `discovery → planning`**
   (`workflow-stage-graphs.mjs`'s `transitions` array, domain `coding`) —
   cạnh này KHÔNG tồn tại sẵn hôm nay (đính chính lại premise gốc của
   item, xem Scout evidence) — bắt buộc vì `stage-fsm.mjs`'s CAS check
   không có đường vòng (no bypass), thiếu cạnh thì `moveStage` throw.
3. `resolveDiscovery`'s nhánh unclear được cấu trúc lại: riêng tại
   `work.stage === 'discovery'`, verdict unclear vừa gọi `moveStage(...,
   to: 'exploring')` VỪA gọi `putInAwaiting` (park) như hôm nay — không
   phải chọn một trong hai như hôm nay. Xác nhận cơ học: hai FSM
   (`stage-fsm.mjs`/`status-fsm.mjs`) độc lập, không guard nào chặn thứ
   tự này; `answerAwaiting` không đụng `stage`, nên item resume thẳng vào
   `exploring` sau khi người trả lời — đúng nghĩa "không còn park tại
   chỗ" của D2.
4. Sửa comment cũ ở `src/runner/loop.mjs:1082-1085` ("there is no verdict
   to gate the transition on here … unconditionally advances discovery ->
   exploring") — mâu thuẫn với lệnh gọi thật đã verdict-gate ở
   `loop.mjs:1132-1151` (`resolveDiscovery(dir, item.id, config, 'runner',
   callerVerdict)`, tsk-4v6 đã nối dây). Chỉ sửa comment, không đụng logic
   dưới nó — logic đã đúng.

Test mới trong `test/intake/discovery.test.mjs` khẳng định cả hai nhánh
(clear-tại-discovery → planning; unclear-tại-discovery → exploring +
park). Test hiện có ở dòng 275-284 (`'resolveDiscovery advances discovery
-> exploring on a caller-supplied clear verdict'`) mã hoá hành vi CŨ sắp
đổi — cần viết lại/thay bằng test unclear tương ứng, không xoá trần trụi.

**Không đụng:** phân loại tier/kind/risk (`tsk-2yo`, cha khác), picker/prose
`discover-next`/`discover` (`tsk-lya`), cạnh legacy `decompose`
(`tsk-403` D18) — cả ba ngoài phạm vi item này.

## Locked decisions

| D-ID | Quyết định |
|------|-----------|
| D2 (kế thừa `tsk-2mt`) | Verdict của pha máy-một-mình quyết định **cạnh đi**: `clear` → bỏ qua `exploring`, sang thẳng `planning`; `unclear` → sang `exploring`, không còn park tại chỗ. Trích nguyên văn từ `DISCUSSION.md` §4 — không mở lại. |
| D3 (kế thừa `tsk-2mt`) | `exploring` là pha người + máy — verdict unclear phải ĐƯA item TỚI đó (không chỉ hỏi rồi giữ nguyên `discovery`), để người trả lời xong rơi thẳng vào Socratic collab, không phải quay lại `fgos-coding-discovering` lần hai cho cùng một câu hỏi chưa giải quyết. |
| D6 (kế thừa `tsk-2mt`) | `discovery` là pha máy-một-mình duy nhất có quyền tự phán verdict theo nghĩa này — `clarify` (legacy) và `exploring` (gate riêng, luôn gửi clear) không thuộc phạm vi cấu trúc lại ở việc 3. |
| D-local-1 | Cạnh FSM `discovery → planning` là cạnh **mới**, không phải cạnh có sẵn chưa được dùng — đính chính premise gốc của item (`DISCUSSION.md` §7 task 5 viết "cả hai cạnh đã hợp lệ sẵn"). Xác nhận qua đọc trực tiếp `workflow-stage-graphs.mjs:123-149` (`RESEARCH.md` round 1, tsk-30v) — không phải giả định, không cần hỏi người vì đây là một sự thật cơ học đọc được từ code, không phải quyết định sản phẩm. |
| D-local-2 | `resolveDiscovery`'s unclear-tại-`discovery` gọi CẢ HAI `moveStage` và `putInAwaiting` trong cùng một lượt (thứ tự: `moveStage` trước, `putInAwaiting` sau) — xác nhận an toàn cơ học qua đọc `store.mjs`'s `moveStage`/`putInAwaiting`/`answerAwaiting` (`RESEARCH.md` round 1, tsk-30v): hai FSM độc lập, không guard chặn hướng này; tiền lệ hiện có (`resolveDiscovery`/`resolvePlan`) chỉ chọn MỘT trong hai mỗi nhánh — đây là ca đầu tiên cần cả hai, không phải vi phạm tiền lệ mà là mở rộng nó đúng theo D2/D3. |

## Pinned terms

- **"cạnh" (edge)** — một cặp `{from, to}` trong `transitions` array của
  domain `coding` (`workflow-stage-graphs.mjs`) — khác với "verdict"
  (kết quả tự phán của skill chủ) hay "stage" (vị trí hiện tại của item).
- **"không còn park tại chỗ"** — cụm D2 gốc: unclear KHÔNG giữ nguyên
  `stage: 'discovery'` khi park; nó phải advance `stage` sang `exploring`
  ĐỒNG THỜI với park status `awaiting-human` — hai field độc lập, cùng
  đổi trong một lượt `resolveDiscovery`.

## Scout evidence

Toàn bộ evidence chi tiết (file:line, code quote) đã ghi trong
`RESEARCH.md` Round 1 — tsk-30v, stage `discovery` (2026-08-12). Tóm tắt:

- `src/intake/discovery.mjs:136-162` (`nextDiscoveryEdge`) — xác nhận:
  không có tham số verdict, ba nhánh `if` chỉ khoá theo `work.stage`; tại
  `discovery` luôn trả `{to: 'exploring'}` bất kể gì.
- `src/intake/discovery.mjs:225-461` (`resolveDiscovery`) — xác nhận:
  `nextDiscoveryEdge` chỉ được gọi khi `verdict.clear === true`; unclear
  đi thẳng `putInAwaiting`, không bao giờ đụng `nextDiscoveryEdge`/`stage`.
- `src/state/workflow-stage-graphs.mjs:123-149` (`transitions`) — xác
  nhận: `discovery → exploring` có sẵn; `discovery → planning`/`discovery
  → decompose` KHÔNG có — đính chính premise gốc (D-local-1).
- `src/state/store.mjs:763-785` (`moveStage`), `:721-733`
  (`putInAwaiting`), `:747-751` (`answerAwaiting`) — xác nhận độc lập
  cơ học giữa `stage` và `status` (D-local-2).
- `src/runner/loop.mjs:1082-1085` (comment cũ), `:1132-1151` (lệnh gọi
  thật đã verdict-gate) — xác nhận đúng như item mô tả, chỉ lệch số dòng
  do drift.
- `test/intake/discovery.test.mjs` (566 dòng, đọc toàn bộ) — helper sẵn
  có (`tmpStoreDir`, `sampleWork`) đủ dùng; test dòng 275-284 mã hoá hành
  vi cũ, cần viết lại.
- `impact-analysis` capability gate (CLAUDE.md): `fgos tool query
  --capability impact-analysis --status present` → provider `gitnexus`,
  `status: "present"` → **full**. Ghi lại cho `fgos-coding-planning` đọc
  tiếp trước khi sửa `nextDiscoveryEdge`/`resolveDiscovery` (cả hai đều
  là hàm nội bộ, không export ra ngoài file trừ hai export đã có sẵn
  `discoverableStages`/`resolveDiscovery`/`FALLBACK_VERIFY`/
  `RETIRED_P14_PLACEHOLDER`).

## Canonical references

- `docs/history/discover-stage-graph-and-skill-layering/DISCUSSION.md`
  §4 D2/D3/D6, §7 task 5 (`{#task-verdict-branch-edges}`) — nguồn quyết
  định gốc, đã khoá ở cấp cha `tsk-2mt`.
- `docs/history/discover-stage-graph-and-skill-layering/RESEARCH.md`
  Round 1 — tsk-30v — toàn bộ evidence chi tiết hơn bảng scout evidence
  phía trên.
- `src/intake/discovery.mjs`, `src/state/workflow-stage-graphs.mjs`,
  `src/state/store.mjs`, `src/runner/loop.mjs`,
  `test/intake/discovery.test.mjs` — nguồn cơ học cho mọi claim ở trên.

## Outstanding questions

None
