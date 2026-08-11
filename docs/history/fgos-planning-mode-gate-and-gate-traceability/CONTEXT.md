---
item: tsk-5ay
stage: decompose
docsRef: docs/history/fgos-coding-planning-mode-gate-and-gate-traceability/
---

# CONTEXT — tsk-5ay: fgos-coding-planning cồng kềnh hơn cần thiết — 2 fix có bằng chứng

## Feature boundary

Ban đầu tsk-5ay yêu cầu so sánh toàn bộ 4-skill fgOS (explore/plan/
validate/execute) với `/ck:plan`+`/ck:cook` và re-distill bee thật, để
tìm điểm cồng kềnh và đề xuất cắt/gộp — KHÔNG đảo nguyên tắc reality-
check. Qua thảo luận sống trong phiên (đối chiếu `fgos-coding-planning/SKILL.md`
+ `fgos-routing/SKILL.md` thật, và bee's `bee-planning`/`bee-briefing`
chain), phạm vi hẹp lại còn ĐÚNG 2 fix cụ thể, có bằng chứng — không mở
rộng thành audit toàn bộ 4 skill (item khác, hoặc vòng sau, nếu cần).

**Đã loại rõ:** KHÔNG chia `fgos-coding-planning` thành nhiều skill nhỏ theo
từng bước nội bộ — bee chỉ tách planning làm ĐÚNG 2 (bee-planning +
bee-briefing, 2 LOẠI việc khác nhau: quyết định vs viết ra), không tách
vụn theo bước. Skill là văn xuôi cho LLM, không phải module code có
ranh giới phụ thuộc thật — chia nhỏ không có lợi ích "sửa đúng chỗ"/
"test đúng chỗ" như code (đơn vị test skill đúng là ĐIỂM QUYẾT ĐỊNH,
không phải FILE).

## Locked decisions

| D-ID | Summary | Rationale |
|---|---|---|
| D1 | Mode-gate của `fgos-coding-planning` dời sang `fgos-routing` (triage TRƯỚC khi load skill nặng), thay vì nằm TRONG `fgos-coding-planning` như hiện tại | Khớp bee's triage-before-load (bee-hive triage trước khi load bee-planning nặng) — fgOS hiện mode-gate ở bước 2 BÊN TRONG fgos-coding-planning nên tốn context load hết 257 dòng rồi mới biết việc tiny. Đối chiếu `/ck:plan`+`/ck:cook` và bee thật cho thấy đây đúng chỗ cồng kềnh |
| D2 | Học kỷ luật truy-nguồn của bee-briefing (mỗi câu trình bày phải trỏ được về `plan.md`/`CONTEXT.md`, không trỏ được thì thành Open Question, không tự khẳng định) NHƯNG thêm thẳng vào Gate step của `fgos-coding-planning` hiện có, KHÔNG tách skill `fgos-briefing` riêng | `plan.md` fgOS đã CHÍNH LÀ review document rồi — chỉ thiếu kỷ luật, không thiếu tầng. Tách thêm 1 skill = thêm 1 hop cho mọi đường standard/high-risk, ngược Ship Faster (0025, scope đã làm rõ: tốc độ project dùng fgOS, không phải tốc độ fgOS tự build) cho case phổ biến |

## Pinned terms

- **triage-before-load** — quyết định lane (tiny/small/standard/high-
  risk/spike) TRƯỚC KHI skill nặng được nạp vào context, đối lập với
  "load rồi mới quyết" (hiện trạng fgos-coding-planning).
- **kỷ luật truy-nguồn** — mỗi câu trong bản trình bày ở Gate phải trỏ
  về đúng đoạn `plan.md`/`CONTEXT.md` nó đến từ đó; không trỏ được →
  Open Question, không tự khẳng định.

## Scout evidence

- `.claude/skills/fgos-coding-planning/SKILL.md` (257 dòng): bước 2 (Mode gate)
  nằm BÊN TRONG skill, sau Bootstrap — không phải trước khi skill được
  chọn/nạp.
- `.claude/skills/fgos-routing/SKILL.md`: KHÔNG có lane/mode-gate nào cả
  (grep xác nhận, fresh) — xác nhận D1's premise đúng (chưa có triage-
  before-load ở tầng router).
- `fgos-coding-planning/SKILL.md`'s Gate step hiện có (`plan.md is the review
  document; nothing past this point starts until it is approved`) —
  xác nhận D2's premise: artifact review ĐÃ tồn tại, chỉ thiếu kỷ luật
  truy-nguồn, không thiếu tầng mới.
- bee's `bee-planning`+`bee-briefing` (distillery, `docs/distillery/
  sources/bee.md` — entries `gate-presentation-contract`,
  `section-to-source-map`): "briefing là consolidator, không phải
  planner thứ hai" — mỗi câu truy nguồn được, không truy được thì thành
  Open Question thay vì tự bịa; chỉ 2 phần tự viết (Technical Design,
  Rollback Plan), còn lại chiếu lại từ artifact đã có.
- Impact-analysis capability: `present` (GitNexus), Full mode.

## Canonical references

- Cuộc hội thoại phiên này (deep-dive bee/beegog gốc, so sánh `/ck:plan`
  + `/ck:cook`, đối chiếu `fgos-coding-planning`/`fgos-routing` thật) — nguồn
  gốc của cả D1 và D2, đã được user đồng ý tường minh trước khi ghi vào
  CONTEXT.md này.

## Outstanding questions deferred to planning

- Vị trí chính xác trong `fgos-routing/SKILL.md` để chèn mode-gate logic
  (bước nào trong Orient) — implementer/planning chọn, không material.
- Câu chữ chính xác của rule truy-nguồn mới trong Gate step — planning
  chọn, D2 chỉ khoá nguyên tắc.
- Phần còn lại của tsk-5ay's yêu cầu gốc (so sánh toàn bộ 4 skill với
  `/ck:plan`/`/ck:cook`, tìm thêm điểm cồng kềnh khác) — KHÔNG material
  cho 2 fix đã khoá, để deferred/có thể thành item riêng sau nếu cần
  đào sâu thêm.
