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
