---
type: explanation
title: 0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người
tags: []
timestamp: 2026-08-15T00:00:00.000Z
source_capture_ids: []
date: 2026-08-15
status: accepted
supersedes: []
relates_specs: [runner]
---

# 0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người

## Bối cảnh

Cổng Iron Law (`classifyIronLaw`, `src/evolve/iron-law.mjs`) hỏi một câu
đáng hỏi: diff đang chờ merge này có NĂNG LỰC làm yếu chính kỷ luật
gate/verify của hệ không? Câu hỏi giữ nguyên giá trị. Cách nó hỏi thì
không.

`D16/D17 self-improve-loop` — hai quyết định nội tuyến, chỉ tồn tại dưới
dạng trích dẫn trong `docs/specs/runner.md` và trong `view.decisions` của
nhật ký sự kiện, không phải một record đánh số dưới `docs/decisions/` —
khoá cổng ở đúng một hình dạng: chạy trên MỌI đề xuất nguồn `runner`, và
`required: true` mà thiếu `--acknowledge-iron-law` thì **từ chối cứng,
không có mức nào khác**. Ba hệ quả đo được, ghi trong
`docs/history/iron-law-gate-human-ux/DISCUSSION.md`:

1. **Hỏi ở chỗ không có gì để mất.** Một leaf merge vào `fgw/<root>` không
   đụng tới trunk, nhưng vẫn phải trả lời câu hỏi "diff này có thể làm yếu
   gate không" y như một root land thẳng lên main. Cùng một diff bị hỏi
   nhiều lần trên đường đi lên, và lần hỏi cuối — lần duy nhất thật sự
   chặn được gì — chìm giữa những lần hỏi vô hại.
2. **Không có nấc nào giữa "chặn cứng" và "gỡ hẳn".** Một người muốn xem
   cổng bắt gì mà chưa muốn nó chặn thì không có lựa chọn nào ngoài việc
   không dùng.
3. **Câu hỏi treo nghẽn cả hàng.** `merge-loop` gặp một item bị Iron Law
   giữ thì dừng cả vòng, dù những item còn lại phía sau không liên quan gì
   — ngược thẳng bậc ưu tiên #2 "Release con người" (`0030`): một câu hỏi
   treo không được nghẽn phần việc khác còn tiến được.

Iron Law **không** nằm trong `docs/platform-foundations.md` (đã kiểm bằng
grep, không khớp) — nên đây là sửa spec, không phải đổi một luật khoá.

## Quyết định

Record này supersede **đúng mệnh đề "chặn cứng, luôn luôn, ở mọi ranh
giới merge"** của `D16/D17 self-improve-loop`. Bốn thay đổi, tất cả đã có
thật trong code trước khi record này được viết:

1. **Cổng chỉ chạy ở ranh giới trunk** (`CONTEXT.md` D1). Leaf → `fgw/<root>`
   và `sync-root` vào nhánh cha đi thẳng, không hỏi. Discriminator **khác
   nhau theo từng call site**, cố ý không gộp thành helper chung
   (`plan.md` A1b): `approve` và pre-check của `merge next` dùng
   `resolveRoot(view, id) === id`; `sync-root` dùng `!item.parent`, vì nó
   chỉ land vào cha TRỰC TIẾP nên `resolveRoot` — vốn leo tới đỉnh lineage
   — sẽ trả lời sai cho một gốc có cha mà cha lại có ông.
2. **Hai mức, key config riêng** (`CONTEXT.md` D3/D7). `ironLaw.level`:
   `ask` (mặc định) giữ nguyên hành vi từ chối cứng của D16/D17; `warn`
   (opt-in) in cảnh báo, ghi một bản ghi, rồi merge tiếp. Key **riêng**,
   không nhét vào `gateBypass` — floor của `gateBypass` được ghi trong
   `docs/explanation/gate-bypass-design.md` là không bao giờ chạm Iron Law,
   tái dùng từ vựng level của nó sẽ xoá đúng ranh giới ấy. Mọi giá trị
   không phải đúng chữ `warn` — thiếu key, file hỏng, gõ sai — đều đọc
   thành `ask`; mức dễ dãi là mức để một diff tự-sửa land mà không ai xem,
   nên nó không bao giờ được là mặc định của một lỗi.
3. **Người quyết định, agent thao tác** (`CONTEXT.md` D2/D9). Người trả
   lời duyệt trong chat là đủ; agent tự chạy `fgos approve <id>
   --acknowledge-iron-law`, tự đọc exit code, tự sửa lỗi cơ học và tự
   retry — không đẩy một dòng lệnh cho người gõ tay. Cái được giữ nguyên
   là điều `docs/explanation/iron-law-evidence-contract-stays-human-gated.md`
   bảo vệ: **một bên thứ hai độc lập thật sự nhìn vào bằng chứng**. Agent
   trình `docs/history/<id>/iron-law-evidence.md` nguyên văn rồi hỏi; nó
   không bao giờ tự thêm `--acknowledge-iron-law` trên thẩm quyền của
   chính nó. Đổi là đổi ai gõ, không đổi ai quyết.
4. **Item bị giữ không nghẽn item khác** (`CONTEXT.md` D5). `merge-loop`
   đọc tín hiệu `skipped` / `every ready item is blocked` mà engine vốn đã
   trả sẵn, ghi id vào một danh sách rồi **đi tiếp**, cuối vòng trình gom
   một lượt kèm bằng chứng. Item ở nguyên `awaiting-approval` — không
   `fgos ask`, không `awaiting-human`, không cạnh FSM mới.

Đã cân nhắc và loại, ghi lại để không phải cãi lại:

- **Field bypass trên workitem** (D4) — loại: biến một quyết định vận hành
  thành một thuộc tính dữ liệu đi theo item mãi mãi.
- **Thêm cạnh FSM `awaiting-approval → awaiting-human` cho D5** — loại:
  `src/state/status-fsm.mjs` nằm trong `MODULE_RULES` của chính Iron Law,
  nên bản vá sẽ trip đúng cái cổng nó đi sửa; và engine đã có sẵn
  `skipped`.
- **Nới nửa từ-khoá của `classifyIronLaw`** (D6) — ra khỏi phạm vi, chuyển
  sang `tsk-1js`. Chữ ký và hành vi `classifyIronLaw` giữ nguyên byte-for-byte.

## Vì sao `supersedes:` trống

`D16/D17 self-improve-loop` không phải record đánh số — chúng là quyết
định nội tuyến, trích dẫn trong `docs/specs/runner.md` (RUL34, RUL37,
Data Dictionary #10) và sống trong `view.decisions`. Không có file nào để
gắn `superseded_by:` trỏ ngược, nên khuôn trỏ-ngược-bắt-buộc STR72
(`scripts/check-decision-supersession.mjs`) không áp dụng được và
`supersedes:` để trống có chủ đích, thay vì bịa một id không tồn tại.
Việc supersede được ghi bằng văn, ở đây và tại chính RUL34/RUL37.

## Hệ quả

- `docs/specs/runner.md`: RUL34 nói rõ phán quyết chỉ được TÍNH ở ranh giới
  trunk và hệ quả của `required: true` do `ironLaw.level` quyết định;
  RUL37 viết lại theo bốn điểm trên; RUL64 mới cho chính key
  `ironLaw.level` (mặc định, fail-closed, đăng ký vào `fgos doctor`).
- `.fgos/config.json` nhận `ironLaw.level` qua `fgos setup`/`fgos doctor
  --fix`; thiếu key thì `doctor` báo, gate vẫn chạy ở `ask`.
- `plugins/fgOS/skills/approve/SKILL.md` là bề mặt người dùng chạm vào cho
  điểm 3; `merge-loop`/`merge-next` cho điểm 4.
- Không đụng `src/evolve/iron-law.mjs` — phép phân loại không đổi, chỉ đổi
  chỗ nó được gọi và chuyện gì xảy ra sau đó.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.

## Tham chiếu

- `docs/history/iron-law-gate-human-ux/CONTEXT.md` — D1-D9 đã khoá
- `docs/history/iron-law-gate-human-ux/plan.md` — A1/A1b, bản đồ rủi ro
- `docs/history/tsk-5t3-iron-law-evidence-contract/` — hợp đồng
  `docs/history/<id>/iron-law-evidence.md`
- `docs/explanation/iron-law-evidence-contract-stays-human-gated.md`
- `docs/explanation/gate-bypass-design.md`
- `0030` — `docs/decisions/0030-them-release-con-nguoi-vao-thu-tu-uu-tien-san-pham.md`
