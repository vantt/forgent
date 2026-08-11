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
