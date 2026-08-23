# CONTEXT: Skill prose cleanup (tsk-56w)

## Feature boundary

Dọn 3 loại lỗi cụ thể trong toàn bộ tập skill fgOS
(`.agents/skills/*`, `.claude/skills/*`, `plugins/fgOS/skills/*`),
không sửa cấu trúc mirror 3 tầng hiện có (`.agents/skills` = nguồn thật,
`.claude/skills` = wrapper tự sinh, `plugins/fgOS/skills` = bản copy
cho kênh publish marketplace):

1. **7 skill vượt chuẩn <300 dòng** (`fgos-coding-driving`,
   `fgos-coding-exploring`, `fgos-coding-planning`,
   `fgos-coding-validating`, `fgos-coding-implement`, `fgos-fanout`,
   `merge-loop`) — tách thành `SKILL.md` (high-level flow, quick
   reference) + `references/*.md` (chi tiết từng bước), theo đúng chuẩn
   `skill-creator` có sẵn trong máy.
2. **Boilerplate lặp máy móc** — 23 skill CLI-wrapper chép y hệt 1 khối
   bash 9 dòng gọi `fgos` CLI, gom về `_shared/`.
3. **Trích dẫn ID governance trần** — ≥267 lượt `tsk-…`/`RUL…`/`D…`
   không giải thích, đậm nhất ở các skill core.

Không thuộc phạm vi: cấu trúc mirror 3 tầng (không đổi), `ui-spec`
(không phải skill fgOS), việc đồng bộ tự động `.agents/skills` →
`plugins/fgOS/skills` (giao cho `tsk-5zi`, item độc lập).

Toàn bộ quá trình khảo sát + tranh luận + 6 quyết định (D1-D6) đã diễn
ra trong `fgos-coding-shaping` trước khi tới bước này — xem
`docs/history/skill-prose-cleanup/DISCUSSION.md` cho log đầy đủ round-
by-round. File này chỉ chốt lại phần fgos-coding-exploring cần: không
phát sinh câu hỏi Socratic mới (xem "Vì sao không có câu hỏi mới"), và
render lại 6 quyết định đã có sẵn trong `state.decisions` từ chính quá
trình shaping đó.

## Vì sao không có câu hỏi mới ở bước exploring

`refs` của item đã trỏ `docs/history/skill-prose-cleanup/DISCUSSION.md
#tasks` — nơi 6 gray-area lớn nhất (kiến trúc mirror thật, ranh giới
trích dẫn ID, phạm vi áp dụng chuẩn skill-creator, thủ tục an toàn
trước khi sửa, quy trình QA, xung đột phạm vi với `tsk-2sp`) đều đã
được hỏi-trả lời-chốt qua nhiều vòng thật với người dùng trong
`fgos-coding-shaping`, mỗi quyết định đã ghi qua `fgos decision --id
tsk-56w` (D1-D6, xem bảng render bên dưới). Một vòng self-audit riêng
("còn gì chưa rõ ràng không?") cũng đã chạy trước khi hand-off, tìm và
đóng 2 lỗ hổng còn sót (thời điểm đồng bộ `plugins/fgOS/skills` không
phụ thuộc `tsk-5zi`; audit frontmatter `description` gộp vào bước Orient
của chính skill này).

Quét lại theo đúng 3 tiêu chí material/grounded/answerable của
`fgos-coding-exploring`: không còn câu hỏi nào thoả cả 3 — mọi gray-area
sản phẩm (product-level) đã khoá; phần còn lại (tên file
`references/*.md` cụ thể cho từng skill, thứ tự thực thi 9 task) là
quyết định hình dạng/kế hoạch, thuộc `fgos-coding-planning`, không phải
`fgos-coding-exploring`.

## Impact-analysis capability gate

`fgos tool query --capability impact-analysis --status present` →
GitNexus `present`. Posture: **full** theo khung 3 nấc của `CLAUDE.md`.
Áp dụng thực tế: không liên quan trực tiếp tới việc này — toàn bộ 9 task
sửa file `.md` (SKILL.md/references), không đụng symbol code nào
GitNexus index (function/class trong `src/`, `bin/`). Ghi nhận thông
tin, không gate quyết định nào ở đây (đúng vai trò informational-only
của bước này).

## Scout — bằng chứng đã dùng khi khoá D1-D6

- `test/skills/fgos-mirror.test.mjs`, `src/setup/skill-wrappers.mjs`,
  `scripts/build-skill-wrappers.mjs` — xác minh kiến trúc mirror thật.
- `plugins/fgOS/.claude-plugin/plugin.json` + cấu trúc thư mục — xác
  nhận gói publish marketplace không mang `docs/` theo.
- `~/.claude/skills/skill-creator/references/*` — chuẩn skill-authoring
  chính thức (Anthropic), dùng cho D4.
- `~/.claude/skills/cook/`, `~/.claude/skills/research/` — mẫu thật cho
  `fgos-coding-implement`/`fgos-researching`.
- `docs/distillery/sources/beehive.md` — bee upstream, dùng tham khảo
  văn phong (không ép ranh giới skill).
- `docs/how-to/write-verify-for-a-skill-prose-change.md`,
  `docs/how-to/smoke-test-fgos-code-implement-with-a-trivial-item.md` —
  chuẩn QA, dùng cho D5.
- `scripts/check-decision-citation-drift.baseline.json` — số liệu thật
  cho D6 (660/1679 violation thuộc phạm vi tsk-56w).

## Canonical references

- `docs/history/skill-prose-cleanup/DISCUSSION.md` — log đầy đủ, §6
  thiết kế đã chốt, §7 danh mục 9 task với số liệu thật.
- `~/.claude/skills/skill-creator/references/` — chuẩn skill-authoring.
- `docs/how-to/write-verify-for-a-skill-prose-change.md`,
  `docs/how-to/smoke-test-fgos-code-implement-with-a-trivial-item.md`.

## Locked decisions

| D-ID | Quyết định |
|---|---|
| D1 | Ranh giới trích dẫn ID governance (ADR/RUL/D-local/tsk-) trong skill fgOS xác định theo VAI TRÒ SẢN XUẤT của artifact, không theo vị trí thư mục |
| D2 | git tag pre-skill-prose-cleanup-tsk-56w tren main tai SHA hien tai, bat buoc truoc khi item con dau tien cua tsk-56w vao stage executing |
| D3 | ui-spec (.claude/skills/ui-spec) khong tinh vao pham vi tsk-56w |
| D4 | Ap dung chuan skill-creator (SKILL.md duoi 300 dong, references/*.md duoi 300 dong/file, khong trung lap noi dung, viet imperative form) cho toan bo 7 skill fgOS dang vuot chuan, khong chi 2 skill nhung pseudocode |
| D5 | Quy trinh dam bao chat luong cho moi child task sua skill prose cua tsk-56w - ket hop 2 tai lieu chuan da co san (khong bia moi) + D2 lam luoi an toan cuoi |
| D6 | Thu hep pham vi tsk-2sp, giao 61 file skill (660 violation) trong baseline check-decision-citation-drift cho tsk-56w so huu, tsk-2sp chi con 12 file khong-phai-skill (1019 violation) |

## Outstanding questions

None
