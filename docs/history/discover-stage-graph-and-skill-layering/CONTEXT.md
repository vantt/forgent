# CONTEXT: tsk-403 — Đổi tên cả họ `decompose` thành `plan`

## Feature boundary

Scope là đúng ba việc, gộp một đợt quét repo (D15), chỉ cho `tsk-403` — không
đụng phần còn lại của cây `tsk-2mt` (discovery skill chủ, clarifying về
Init, v.v. — các con khác của cùng cha):

1. **Rename stage/verb/launcher**: stage `decompose` → `planning`; engine
   verb `fgos decompose` → `fgos plan`; launcher `/fgOS:decompose` →
   `/fgOS:plan`. Giá trị verdict `decompose | pass-through` **giữ nguyên**
   — đó là tên một kết cục, không phải tên một chặng (D11).
2. **Rename file**: `src/intake/decompose.mjs` → `src/intake/plan.mjs`
   (D15).
3. **Thêm tiền tố `coding-`** cho đúng 5 skill: `fgos-exploring` →
   `fgos-coding-exploring`, `fgos-planning` → `fgos-coding-planning`,
   `fgos-validating` → `fgos-coding-validating`, `fgos-compounding` →
   `fgos-coding-compounding`, `fgos-code-implement` →
   `fgos-coding-implement` (D15). **Không** đụng `fgos-clarifying` /
   `fgos-researching` (helper, D9) và **không bao giờ** đụng
   `fgos-fanout` / `fgos-indexing` / `fgos-routing` / `fgos-unlock` (D19 —
   không phải hoãn, là loại vĩnh viễn).

Rename chuẩn "full rewrite" theo tiền lệ rename `fgos-executing` trước đó:
gồm cả `docs/history/*`, cả hai bản mirror skill dir (`.claude/skills/` +
`.agents/skills/` nếu có), cả how-to doc.

## Locked decisions

| D-ID | Quyết định |
|------|-----------|
| D11 | Đổi tên **cả họ**, không nửa vời: stage `decompose` → `planning`, verb `fgos decompose` → `fgos plan`, launcher `/fgOS:decompose` → `/fgOS:plan`, cộng cặp mới `plan-next` + `plan-loop` sinh ra ở một task con khác (không thuộc `tsk-403`) nhưng **phải sinh sau khi con này xong** để có tên đúng ngay từ đầu. Giá trị verdict `decompose` **giữ nguyên** vì nó là tên kết cục (`fgos plan --verdict decompose\|pass-through`), không phải tên chặng. |
| D15 | Gộp cả ba việc (rename họ, rename file, thêm tiền tố `coding-`) vào một task vì cùng là một loại thao tác (quét toàn repo theo pattern rename) — tách ba đợt là quét ba lần cho cùng một việc. Rủi ro capacityId bằng 0 (`.fgos/config.json` → `capacities` rỗng, xác nhận lại bên dưới). |
| D18 | Giữ **`decompose` làm alias legacy chỉ-để-rút-cạn**: còn trong `stages` array + `skillMap` + giữ cạnh ra của nó, **KHÔNG** có trong `stepMap` — đúng cách `discovery`/`exploring` đang được xử lý hôm nay (không base-workflow step riêng), nên bất biến một-stage-một-step của `stageForStep` giữ nguyên. Lý do: có item đang MỞ đứng trên stage đó (xem scout evidence bên dưới) — sau rename mà xoá thẳng, `stages.indexOf("decompose")=-1` và `skillForStage(...,"decompose")=null` khiến driver đọc ra "không có skill, dừng" — kẹt vĩnh viễn, và không verb nào relabel được `stage` (`EDITABLE_FIELDS` không có `stage`). Kèm comment "legacy, drain-only, không item mới nào vào đây nữa" tại chỗ khai báo, cộng một follow-up (item mới, ngoài phạm vi `tsk-403`) xoá alias khi đếm mở về 0. |
| D19 | 4 skill `fgos-fanout`, `fgos-indexing`, `fgos-routing`, `fgos-unlock` **không bao giờ** mang tiền tố `coding-` — không phải hoãn sang đợt sau, là loại khỏi tập file vĩnh viễn. Theo đúng logic D9 (tiền tố = tính đúng đắn bị giới hạn trong domain `coding`): `routing` định tuyến item của mọi domain, `unlock` gỡ khoá main checkout (domain-agnostic), `indexing` dựng index docs end-user (không phải stage-skill), `fanout` chạy con qua `/fgOS:pick` (domain-agnostic). Không đứa nào sở hữu một stage hay có tên trong `skillMap` của bất kỳ domain nào — phép thử D7 (skill chủ = có trong `skillMap[stage]` + tự gọi engine verb) loại cả bốn. |

## Pinned terms

- **"cả họ" (rename cả họ)** — đổi đồng thời stage name, engine verb name,
  và launcher name cho cùng một khái niệm; không đổi một nửa (ví dụ chỉ
  đổi stage mà giữ verb `fgos decompose`).
- **alias legacy drain-only** — một entry vẫn hợp lệ trong `stages` +
  `skillMap` + cạnh, nhưng bị khoá khỏi `stepMap` nên không item MỚI nào
  còn vào được; chỉ item đã đứng sẵn trên đó mới được rút ra dần qua các
  cạnh hiện có.
- **verdict vs chặng (stage)** — `decompose`/`pass-through` là tên một
  *kết cục* của việc gọi verb `fgos plan`, tách biệt hoàn toàn khỏi tên
  *chặng* (`planning`); đổi tên chặng không kéo theo đổi tên giá trị
  verdict.

## Scout evidence

- `src/state/workflow-stage-graphs.mjs`: domain `coding`'s `stages` array
  (dòng 61) chứa `decompose`; `skillMap.decompose = 'fgos-planning'` (dòng
  151); hai cạnh `clarify -> decompose` và `exploring -> decompose` (dòng
  96, 100). Domain thứ hai trong cùng file (dòng 334+, một domain khác
  `coding`) cũng còn `decompose` trong `stages` nhưng `skillMap.decompose =
  null` — rename chỉ chạm domain `coding`, không đụng domain kia.
- `src/intake/decompose.mjs` tồn tại thật, 44.4K — mục tiêu rename việc 2.
- 13 thư mục `fgos-*` dưới `.claude/skills/`: `fgos-clarifying`,
  `fgos-code-implement`, `fgos-coding-driving`, `fgos-coding-shaping`,
  `fgos-compounding`, `fgos-exploring`, `fgos-fanout`, `fgos-indexing`,
  `fgos-planning`, `fgos-researching`, `fgos-routing`, `fgos-unlock`,
  `fgos-validating` — khớp đúng D19: 2 đã có tiền tố `coding-`
  (`coding-driving`, `coding-shaping`, không thuộc phạm vi), 5 trong phạm
  vi việc 3, 2 helper bị loại (`clarifying`, `researching`), 4 platform
  skill bị loại vĩnh viễn (`fanout`, `indexing`, `routing`, `unlock`).
  Tổng 2+5+2+4=13, không thừa không thiếu.
- `plugins/fgOS/skills/decompose/` tồn tại (launcher hiện tại);
  `plugins/fgOS/skills/plan/` chưa tồn tại — khớp đích rename việc 1.
- **Đếm lại item đang mở trên stage `decompose` (fresh read, 2026-08-11
  ~12:21 UTC)**: `tsk-42i` (blocked), `tsk-3at` (awaiting-human), `tsk-3m6`
  (doing) — **3 item**, không phải 4 như con số D18 ghi lúc chốt quyết
  định. `tsk-1opx` (item thứ tư D18 từng liệt) đã tự đi tiếp, hiện đứng ở
  `stage: executing, status: todo` — không còn đứng trên `decompose` nữa.
  Số liệu đổi nhưng **quyết định D18 không đổi**: vẫn có item mở đứng trên
  stage đó (3 > 0), lý do giữ alias drain-only vẫn nguyên vẹn; đây chỉ là
  cập nhật bằng chứng, không phải câu hỏi mới.
- `impact-analysis` capability gate (CLAUDE.md): `fgos tool query
  --capability impact-analysis --status present` trả về provider
  `gitnexus`, `status: "present"` — **full**. Thông tin này chỉ để ghi lại
  cho `fgos-planning`/`fgos-validating` đọc tiếp; `fgos-exploring` không
  sửa code nên không tự áp MUST rules ở đây.
- `.fgos/config.json` → `capacities` rỗng — xác nhận lại claim "rủi ro
  capacityId bằng 0" trong mô tả item và D15.

## Canonical references

- `docs/history/discover-stage-graph-and-skill-layering/DISCUSSION.md` —
  toàn bộ thiết kế cha (`tsk-2mt`), mục 4 (D1-D19), mục 6 (thiết kế đã
  chốt), mục 7 task 1 (`{#task-plan-family-rename}`) là nguồn quyết định
  gốc cho tài liệu này.
- `tsk-403`'s own `gates.tsk-403` record (`fgos list --id tsk-403 --json`)
  — vòng hỏi/đáp Q1/Q2 đã chốt, câu trả lời của người đã được chép lại
  nguyên văn vào `description` của item.
- Tiền lệ rename trước: rename `fgos-executing` (full rewrite bao gồm
  `docs/history/*`) — chuẩn quét cho việc 3.

## Outstanding questions

None
